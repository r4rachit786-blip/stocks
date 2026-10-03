/**
 * Stock Alert Worker - three informational agents that send WhatsApp alerts.
 * NOT trading advice. Nothing here buys or sells anything.
 *
 *   Agent 1  Trump Truth Social posts  -> instant alerts
 *   Agent 2  Congress stock trades     -> one digest per day at 6 pm Newfoundland time
 *   Agent 3  S&P 500 news + SEC 8-Ks   -> high-confidence alerts, 7 am - 10 pm only
 *   Sunday 7 pm: weekly scorecard of how the alerts played out.
 *
 * Runs on Cloudflare Workers (free plan) with a cron trigger every 2 minutes.
 *
 * Needs:
 *   KV namespace bound as:   KV
 *   Secrets:                 CALLMEBOT_PHONE, CALLMEBOT_APIKEY, GEMINI_API_KEY,
 *                            BARGO_API_KEY, ALPACA_KEY_ID, ALPACA_SECRET_KEY, ADMIN_KEY
 *   Plain-text variable:     SEC_CONTACT_EMAIL   (your email - the SEC requires it)
 *   Optional variable:       GEMINI_MODEL        (defaults to gemini-3.1-flash-lite)
 *
 * Web addresses (replace YOUR-WORKER and YOUR_ADMIN_KEY):
 *   https://YOUR-WORKER.workers.dev/test?key=YOUR_ADMIN_KEY    send 3 sample WhatsApp messages
 *   https://YOUR-WORKER.workers.dev/check?key=YOUR_ADMIN_KEY   check every API key works
 *   https://YOUR-WORKER.workers.dev/status?key=YOUR_ADMIN_KEY  today's counters
 *   https://YOUR-WORKER.workers.dev/run?key=YOUR_ADMIN_KEY     run one cycle right now
 */

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------
const TZ = "America/St_Johns";
const TRUMP_ACCOUNT_ID = "107780257626128497"; // @realDonaldTrump
const TRUMP_HANDLE = "realDonaldTrump";
const TRUMP_RSS = "https://www.trumpstruth.org/feed";
const DEFAULT_GEMINI_MODEL = "gemini-3.1-flash-lite";
const BACKUP_GEMINI_MODEL = "gemini-3.5-flash-lite";

const MAX_MESSAGES_PER_DAY = 25;
const RESERVED_FOR_DIGEST_AND_SCORECARD = 2; // instant alerts stop at 23 so these always fit
const MAX_NEWS_ALERTS_PER_DAY = 10;
const MAX_GEMINI_CALLS_PER_DAY = 150;
const NEWS_GEMINI_LIMIT = 100; // news may use at most 100 of the 150; the rest is kept for Trump
const MAX_GEMINI_CALLS_PER_RUN = 6;
const MAX_MESSAGES_PER_RUN = 6;
const MESSAGE_GAP_MS = 5500;
const MAX_MESSAGE_CHARS = 1000;
const TRUMP_MIN_CONFIDENCE = 6;
const NEWS_MIN_CONFIDENCE = 8;
const NEWS_START_HOUR = 7; // 7 am
const NEWS_END_HOUR = 22; // 10 pm
const DIGEST_HOUR = 18; // 6 pm
const SCORECARD_HOUR = 19; // 7 pm Sunday
const TRADES_EVERY_MS = 2 * 60 * 60 * 1000;
const BARGO_DAILY_LIMIT = 90; // free key allows 100 requests/day; keep 10 spare
const BARGO_DAILY_ROWS = 950; // free key allows 1,000 rows/day
const BARGO_FEED_ROWS = 70; // newest trades fetched each 2-hour poll (12 x 70 = 840 rows)
const BARGO_BACKFILL_ROWS = 25; // history fetched for a politician we haven't seen before
const BARGO_BACKFILL_PER_POLL = 2;
const SUBREQUEST_LIMIT = 45; // Cloudflare free plan allows 50 outbound requests per run

const TRUMP_KEYWORDS =
  /\b(tariffs?|trade deals?|bans?|banned|banning|sanctions?|fed|federal reserve|interest rates?|rates?|oil|drugs?|drug prices|pharma|pharmaceuticals?|chips?|semiconductors?|china|chinese|crypto|bitcoin|defen[cs]e|contracts?|deals?|invest|investing|investments?|plants?|factor(y|ies)|jobs|stock market|stocks)\b/i;
const NEWS_KEYWORDS =
  /\b(earnings|guidance|downgraded?|downgrades|upgraded?|upgrades|fda|lawsuits?|sued|recalls?|recalled|acquisitions?|acquires?|acquired|mergers?|merge|ceo|resigns?|resigned|resignation|investigations?|probe|buybacks?|repurchase|bankruptcy|chapter 11|contracts?|layoffs?|job cuts)\b/i;

// SEC 8-K item numbers turned into plain words so the keyword filter understands them
const EDGAR_ITEMS = {
  "1.01": "material contract agreement",
  "1.02": "contract terminated",
  "1.03": "bankruptcy",
  "2.01": "acquisition completed",
  "2.02": "earnings results",
  "2.05": "layoffs restructuring",
  "2.06": "impairment",
  "4.02": "restatement investigation",
  "5.02": "CEO executive resign appointment",
};

// Words that look like tickers in ALL-CAPS text but usually aren't
const COMMON_CAPS = new Set(
  "A ALL ARE BIG CAN CAT DAY DD EOG FAST FOR GE GM HAS HD IT KEY LOW MA MAR MO NOW O ON OR PM SO T TECH TV UP US USA WELL V WM YES WAS ONE AM PEG RL SPG BR IP J L C D F".split(" ")
);

// ---------------------------------------------------------------------------
// Entry points
// ---------------------------------------------------------------------------
export default {
  async scheduled(event, env, ctx) {
    await runCycle(env, {});
  },

  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";
    if (path === "/") {
      return text("Stock alert worker is running. (Informational only, no trading.)");
    }
    if (!env.ADMIN_KEY || url.searchParams.get("key") !== env.ADMIN_KEY) {
      return text("Wrong or missing key. Add ?key=YOUR_ADMIN_KEY to the address.", 401);
    }
    try {
      if (path === "/test") return text(await runTest(env));
      if (path === "/check") return text(await runCheck(env));
      if (path === "/status") return text(await runStatus(env));
      if (path === "/run") return text(await runCycle(env, { manual: true }));
    } catch (e) {
      return text("Error: " + (e && e.stack ? e.stack : e), 500);
    }
    return text("Unknown page. Try /test, /check, /status or /run", 404);
  },
};

function text(body, status = 200) {
  return new Response(body, { status, headers: { "content-type": "text/plain; charset=utf-8" } });
}

// ---------------------------------------------------------------------------
// One cycle (runs every 2 minutes)
// ---------------------------------------------------------------------------
async function runCycle(env, opts) {
  const c = await makeContext(env);
  const now = Date.now();
  const report = [];
  const step = async (name, fn) => {
    try {
      const r = await fn();
      if (r) report.push(`${name}: ${r}`);
    } catch (e) {
      console.log(`[${name}] error: ${e && e.stack ? e.stack : e}`);
      report.push(`${name}: ERROR ${e && e.message ? e.message : e}`);
    }
  };

  await step("trump", () => trumpAgent(c));
  // News every 4 minutes (every other run) to stay well inside the free KV write limit
  if (opts.manual || Math.floor(now / 60000) % 4 < 2) {
    await step("alpaca-news", () => alpacaNewsAgent(c));
    await step("sec-8k", () => edgarAgent(c));
  }
  if (opts.manual || now - (c.state.lastTradesPoll || 0) >= TRADES_EVERY_MS) {
    await step("congress", () => tradesAgent(c));
  }
  await step("classify", () => classifyPending(c));
  await step("digest", () => maybeDigest(c));
  await step("scorecard", () => maybeScorecard(c));
  await step("send", () => sendOutbox(c));
  await saveAll(c);

  const summary = report.join("\n") || "nothing new";
  console.log(`[cycle ${c.local.date} ${pad(c.local.hour)}:${pad(c.local.minute)} NDT] ` + summary.replace(/\n/g, " | "));
  return summary + `\n\nToday: ${c.state.sent}/${MAX_MESSAGES_PER_DAY} WhatsApp messages, ${c.state.gemini}/${MAX_GEMINI_CALLS_PER_DAY} Gemini calls, ${c.state.news}/${MAX_NEWS_ALERTS_PER_DAY} news alerts.`;
}

// ---------------------------------------------------------------------------
// Context, state and storage (Cloudflare KV)
// ---------------------------------------------------------------------------
function freshState() {
  return {
    day: "",
    sent: 0, // WhatsApp messages sent today
    gemini: 0, // Gemini calls today
    news: 0, // news alerts sent today
    bargo: 0, // Bargo requests today
    bargoRows: 0, // Bargo rows received today
    geminiBackoffUntil: 0,
    trump: { lastId: null, fails: 0, mode: "api", nextApiTry: 0, verified: false },
    seen: { news: [], edgar: [] }, // already-processed IDs
    newsSince: null,
    pending: [], // items waiting for Gemini (e.g. after a 429)
    outbox: [], // messages waiting to be sent
    digest: [], // new Congress trades waiting for the 6 pm digest
    lastTradesPoll: 0,
    tradesReady: false,
    lastDigestDate: "",
    lastScorecardDate: "",
  };
}

async function makeContext(env) {
  if (!env.KV) throw new Error("KV namespace is not bound. Add a KV binding named KV.");
  const stored = await env.KV.get("state", "json");
  const state = Object.assign(freshState(), stored || {});
  const c = {
    env,
    state,
    before: JSON.stringify(state),
    local: localTime(new Date()),
    subrequests: 0,
    log: null, // loaded lazily
    logDirty: false,
    trades: null, // loaded lazily
    tradesDirty: false,
  };
  if (state.day !== c.local.date) {
    state.day = c.local.date;
    state.sent = 0;
    state.gemini = 0;
    state.news = 0;
    state.bargo = 0;
    state.bargoRows = 0;
  }
  return c;
}

async function saveAll(c) {
  const after = JSON.stringify(c.state);
  if (after !== c.before) await c.env.KV.put("state", after);
  if (c.logDirty) await c.env.KV.put("log", JSON.stringify(c.log.slice(-3000)));
  if (c.tradesDirty) await c.env.KV.put("trades", JSON.stringify(c.trades));
}

async function getLog(c) {
  if (!c.log) c.log = (await c.env.KV.get("log", "json")) || [];
  return c.log;
}

async function getTrades(c) {
  if (!c.trades) c.trades = (await c.env.KV.get("trades", "json")) || { t: {}, members: {} };
  return c.trades;
}

// fetch() with a counter so we never exceed Cloudflare's per-run limit
async function cfetch(c, url, init = {}) {
  if (c.subrequests >= SUBREQUEST_LIMIT) throw new Error("subrequest budget used up for this run");
  c.subrequests++;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

function remember(list, id, max = 400) {
  list.push(String(id));
  if (list.length > max) list.splice(0, list.length - max);
}

// ---------------------------------------------------------------------------
// Time helpers (Newfoundland time)
// ---------------------------------------------------------------------------
function localTime(d, tz = TZ) {
  const f = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23", weekday: "short",
  });
  const p = {};
  for (const x of f.formatToParts(d)) p[x.type] = x.value;
  return { date: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour), minute: Number(p.minute), weekday: p.weekday };
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function inNewsHours(c) {
  return c.local.hour >= NEWS_START_HOUR && c.local.hour < NEWS_END_HOUR;
}

function daysBetween(a, b) {
  return Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86400000);
}

// ---------------------------------------------------------------------------
// Static data lookups
// ---------------------------------------------------------------------------
let LOOKUP = null;
function lookup() {
  if (LOOKUP) return LOOKUP;
  const byTicker = new Map();
  const byCik = new Map();
  for (const [ticker, name, sector, cik] of DATA.sp500) {
    byTicker.set(ticker, { ticker, name, sector, cik });
    if (cik) byCik.set(cik, ticker);
  }
  const names = Object.keys(DATA.aliases).sort((a, b) => b.length - a.length);
  const escaped = names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const nameRe = new RegExp(`(?<![A-Za-z])(${escaped.join("|")})(?![A-Za-z])`, "gi");
  const aliasLower = new Map(names.map((n) => [n.toLowerCase(), DATA.aliases[n]]));
  LOOKUP = { byTicker, byCik, nameRe, aliasLower };
  return LOOKUP;
}

function normTicker(t) {
  return String(t || "").trim().toUpperCase().replace("-", ".").replace(/^\$/, "");
}

function isSp500(t) {
  return lookup().byTicker.has(normTicker(t));
}

// Finds S&P 500 tickers mentioned in free text (company names, $TICKER, or TICKER)
function findTickers(textIn) {
  const L = lookup();
  const found = new Set();
  for (const m of textIn.matchAll(L.nameRe)) {
    const t = L.aliasLower.get(m[1].toLowerCase());
    if (t) found.add(t);
  }
  for (const m of textIn.matchAll(/\$([A-Z]{1,5}(?:\.[A-Z])?)\b/g)) if (L.byTicker.has(m[1])) found.add(m[1]);
  const letters = textIn.replace(/[^A-Za-z]/g, "");
  const mostlyCaps = letters.length > 20 && letters.replace(/[^A-Z]/g, "").length / letters.length > 0.6;
  if (!mostlyCaps) {
    for (const m of textIn.matchAll(/\b([A-Z]{2,5})\b/g)) {
      if (L.byTicker.has(m[1]) && !COMMON_CAPS.has(m[1])) found.add(m[1]);
    }
  }
  return [...found];
}

function normName(s) {
  return s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/-/g, " ").replace(/[^a-z ]/g, "").trim();
}

// "David J. Taylor", "OH02", "house" -> "R"
function partyOf(member, stateCode, chamber) {
  const skip = new Set(["hon", "jr", "sr", "ii", "iii", "iv", "dr", "mr", "mrs", "ms"]);
  const toks = normName(member).split(/\s+/).filter((t) => t && !skip.has(t));
  const st = (stateCode || "").slice(0, 2);
  const dist = (stateCode || "").slice(2);
  const suffix = chamber === "senate" ? "S" : /^\d+$/.test(dist) ? String(Number(dist)) : "";
  for (const n of [2, 1]) {
    if (toks.length < n) continue;
    const last = toks.slice(-n).join(" ");
    const exact = DATA.party[`${last}|${st}|${suffix}`];
    if (exact) return exact;
    const prefix = `${last}|${st}|`;
    const matches = new Set(Object.entries(DATA.party).filter(([k]) => k.startsWith(prefix)).map(([, v]) => v));
    if (matches.size === 1) return [...matches][0];
  }
  return "?";
}

// ---------------------------------------------------------------------------
// WhatsApp via CallMeBot
// ---------------------------------------------------------------------------
async function sendWhatsApp(c, message) {
  const { CALLMEBOT_PHONE, CALLMEBOT_APIKEY } = c.env;
  if (!CALLMEBOT_PHONE || !CALLMEBOT_APIKEY) throw new Error("CALLMEBOT_PHONE / CALLMEBOT_APIKEY secrets are missing");
  const body = message.length > MAX_MESSAGE_CHARS ? message.slice(0, MAX_MESSAGE_CHARS - 1) + "…" : message;
  const url =
    "https://api.callmebot.com/whatsapp.php?phone=" + encodeURIComponent(CALLMEBOT_PHONE) +
    "&text=" + encodeURIComponent(body) + "&apikey=" + encodeURIComponent(CALLMEBOT_APIKEY);
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await cfetch(c, url);
      const reply = await res.text();
      if (res.ok && !/(error|invalid|not allowed|blocked|wrong|apikey is)/i.test(reply)) return true;
      console.log(`[whatsapp] attempt ${attempt} failed: HTTP ${res.status} ${reply.replace(/<[^>]+>/g, " ").slice(0, 200)}`);
    } catch (e) {
      console.log(`[whatsapp] attempt ${attempt} error: ${e.message}`);
    }
    if (attempt === 1) await sleep(MESSAGE_GAP_MS);
  }
  return false;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// Puts a message in the outbox. kind: trump | news | congress | scorecard
function queueMessage(c, kind, body, logs = []) {
  c.state.outbox.push({ kind, body, logs, created: Date.now(), tries: 0 });
}

async function sendOutbox(c) {
  const s = c.state;
  const order = { scorecard: 0, congress: 1, trump: 2, news: 3 };
  s.outbox.sort((a, b) => order[a.kind] - order[b.kind] || a.created - b.created);
  const keep = [];
  const toSend = [];
  for (const m of s.outbox) {
    const scheduled = m.kind === "congress" || m.kind === "scorecard";
    if (Date.now() - m.created > 18 * 3600 * 1000) {
      console.log(`[send] dropped stale ${m.kind} message`);
      continue;
    }
    if (m.kind === "news" && !inNewsHours(c)) {
      keep.push(m); // quiet hours: hold until 7 am
      continue;
    }
    const cap = scheduled ? MAX_MESSAGES_PER_DAY : MAX_MESSAGES_PER_DAY - RESERVED_FOR_DIGEST_AND_SCORECARD;
    if (s.sent + toSend.length >= cap) {
      console.log(`[send] daily cap reached, dropped ${m.kind} message`);
      continue;
    }
    if (m.kind === "news" && s.news + toSend.filter((x) => x.kind === "news").length >= MAX_NEWS_ALERTS_PER_DAY) {
      console.log("[send] 10 news alerts already sent today, dropped one");
      continue;
    }
    if (toSend.length >= MAX_MESSAGES_PER_RUN) {
      keep.push(m);
      continue;
    }
    toSend.push(m);
  }
  if (!toSend.length) {
    s.outbox = keep;
    return "";
  }

  // Price at alert time, for the log / scorecard (one request for all tickers)
  const tickers = [...new Set(toSend.flatMap((m) => m.logs.map((l) => l.t)))];
  let prices = {};
  try {
    prices = await latestPrices(c, tickers);
  } catch (e) {
    console.log(`[send] could not fetch prices: ${e.message}`);
  }

  let sentCount = 0;
  for (let i = 0; i < toSend.length; i++) {
    const m = toSend[i];
    if (i > 0) await sleep(MESSAGE_GAP_MS);
    const ok = await sendWhatsApp(c, m.body);
    if (ok) {
      sentCount++;
      s.sent++;
      if (m.kind === "news") s.news++;
      if (m.logs.length) {
        const log = await getLog(c);
        const ts = new Date().toISOString();
        for (const l of m.logs) {
          log.push({ ts, a: m.kind, t: l.t, d: l.d, conf: l.conf ?? null, px: prices[l.t] ?? null });
        }
        c.logDirty = true;
      }
    } else if (++m.tries < 3) {
      keep.push(m); // try again next run
    } else {
      console.log(`[send] giving up on ${m.kind} message after 3 runs`);
    }
  }
  s.outbox = keep;
  return `sent ${sentCount}/${toSend.length}`;
}

// ---------------------------------------------------------------------------
// Gemini classifier
// ---------------------------------------------------------------------------
async function classify(c, source, content, hintTickers) {
  const prompt = `You are a careful financial analyst. Decide whether this ${source} is likely to move specific U.S.-listed stocks or a market sector over the next 1-5 trading days. This is for informational alerts only.
${hintTickers.length ? `Possibly related S&P 500 tickers: ${hintTickers.join(", ")}\n` : ""}
TEXT:
"""
${content.slice(0, 4000)}
"""

Reply with JSON only, exactly this shape:
{"relevant": true or false, "tickers": ["TICKER", ...], "sector": "sector name", "direction": "UP" or "DOWN" or "MIXED", "confidence": 1-10, "reason": "one short sentence"}

Rules: relevant=true only if there is a plausible, specific price impact. Use real U.S. ticker symbols (prefer S&P 500 companies), at most 5. confidence 10 = clear, direct and material impact; 1 = pure speculation. Be conservative.`;

  const models = [c.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL, BACKUP_GEMINI_MODEL];
  for (const model of models) {
    c.state.gemini++;
    const res = await cfetch(c, `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": c.env.GEMINI_API_KEY || "" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
      }),
    });
    if (res.status === 429) {
      const err = new Error("Gemini rate limit (429)");
      err.rateLimited = true;
      err.retryAfter = Number(res.headers.get("retry-after")) || 0;
      throw err;
    }
    if (res.status === 404 && model !== BACKUP_GEMINI_MODEL) {
      console.log(`[gemini] model ${model} not found, trying ${BACKUP_GEMINI_MODEL}`);
      continue;
    }
    if (!res.ok) throw new Error(`Gemini HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const data = await res.json();
    const out = (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("");
    return parseVerdict(out);
  }
  throw new Error("No Gemini model available");
}

function parseVerdict(out) {
  let v;
  try {
    v = JSON.parse(out);
  } catch {
    const m = out.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("Gemini did not return JSON");
    v = JSON.parse(m[0]);
  }
  if (Array.isArray(v)) v = v[0] || {};
  const dir = String(v.direction || "").toUpperCase();
  return {
    relevant: v.relevant === true || v.relevant === "true",
    tickers: (Array.isArray(v.tickers) ? v.tickers : []).map(normTicker).filter((t) => /^[A-Z.]{1,6}$/.test(t)).slice(0, 5),
    sector: String(v.sector || "").slice(0, 40),
    direction: ["UP", "DOWN", "MIXED"].includes(dir) ? dir : "MIXED",
    confidence: Math.max(1, Math.min(10, Math.round(Number(v.confidence) || 1))),
    reason: String(v.reason || "").replace(/\s+/g, " ").slice(0, 220),
  };
}

// Runs Gemini on items waiting in state.pending, respecting all limits
async function classifyPending(c) {
  const s = c.state;
  const now = Date.now();
  s.pending = s.pending.filter((p) => now - p.added < 12 * 3600 * 1000); // forget after 12 h
  if (!s.pending.length) return "";
  if (now < s.geminiBackoffUntil) return `waiting for Gemini rate limit (${s.pending.length} queued)`;
  if (!c.env.GEMINI_API_KEY) return "GEMINI_API_KEY missing";
  // Trump first, then news
  s.pending.sort((a, b) => (a.agent === "trump" ? 0 : 1) - (b.agent === "trump" ? 0 : 1) || a.added - b.added);

  let calls = 0;
  let alerts = 0;
  const left = [];
  for (const item of s.pending) {
    const dailyLimit = item.agent === "trump" ? MAX_GEMINI_CALLS_PER_DAY : NEWS_GEMINI_LIMIT;
    if (calls >= MAX_GEMINI_CALLS_PER_RUN || now < s.geminiBackoffUntil) {
      left.push(item);
      continue;
    }
    if (s.gemini >= dailyLimit) {
      console.log(`[gemini] daily cap reached; skipping ${item.agent} item ${item.id}`);
      continue;
    }
    calls++;
    try {
      const source = item.agent === "trump" ? "social media post by President Donald Trump" : item.agent === "edgar" ? "SEC 8-K filing summary" : "financial news headline";
      const v = await classify(c, source, item.text, item.hints || []);
      console.log(`[gemini] ${item.agent} ${item.id}: relevant=${v.relevant} ${v.direction} ${v.confidence}/10 ${v.tickers.join(",")}`);
      if (handleVerdict(c, item, v)) alerts++;
    } catch (e) {
      if (e.rateLimited) {
        s.geminiBackoffUntil = Date.now() + Math.max(e.retryAfter * 1000, 4 * 60 * 1000);
        console.log("[gemini] 429 rate limited - backing off, will retry next run");
        left.push(item);
      } else {
        console.log(`[gemini] error on ${item.id}: ${e.message}`);
        if (++item.tries < 2) left.push(item);
      }
    }
  }
  s.pending = left;
  return `${calls} Gemini call(s), ${alerts} alert(s) queued${left.length ? `, ${left.length} waiting` : ""}`;
}

const ARROW = { UP: "📈", DOWN: "📉", MIXED: "↕️" };

function handleVerdict(c, item, v) {
  if (item.agent === "trump") {
    if (!v.relevant || v.confidence < TRUMP_MIN_CONFIDENCE) return false;
    const tick = v.tickers.length ? v.tickers.join(", ") : "Market";
    const sector = v.sector ? ` (${v.sector})` : "";
    const excerpt = item.text.length > 200 ? item.text.slice(0, 200) + "…" : item.text;
    const body = `🇺🇸 TRUMP POST
${ARROW[v.direction]} ${v.direction} – ${tick}${sector}
Confidence: ${v.confidence}/10
Why: ${v.reason}
Post: ${excerpt}
${item.url}`;
    queueMessage(c, "trump", body, v.tickers.slice(0, 3).map((t) => ({ t, d: v.direction, conf: v.confidence })));
    return true;
  }
  // news / edgar
  if (!v.relevant || v.confidence < NEWS_MIN_CONFIDENCE) return false;
  const tagged = item.hints || [];
  const ticker = v.tickers.find((t) => tagged.includes(t)) || v.tickers.find(isSp500) || tagged[0];
  if (!ticker) return false;
  const body = `📰 NEWS
${ARROW[v.direction]} ${ticker} – ${item.title}
Confidence: ${v.confidence}/10
Why: ${v.reason}
${item.url}`;
  queueMessage(c, "news", body, [{ t: ticker, d: v.direction, conf: v.confidence }]);
  return true;
}

function addPending(c, item) {
  if (c.state.pending.some((p) => p.id === item.id)) return;
  c.state.pending.push({ ...item, added: Date.now(), tries: 0 });
  if (c.state.pending.length > 40) c.state.pending.splice(0, c.state.pending.length - 40);
}

// ---------------------------------------------------------------------------
// Agent 1 - Trump posts
// ---------------------------------------------------------------------------
function stripHtml(h) {
  return String(h || "")
    .replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n").replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/&#39;|&#039;|&apos;/g, "'").replace(/&nbsp;/g, " ").replace(/[ \t]+/g, " ").trim();
}

function bigger(a, b) {
  // compare long numeric IDs safely
  return BigInt(a) > BigInt(b);
}

async function fetchTruthSocial(c) {
  const t = c.state.trump;
  const base = `https://truthsocial.com/api/v1/accounts/${TRUMP_ACCOUNT_ID}`;
  const headers = {
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
    accept: "application/json",
  };
  if (!t.verified) {
    const r = await cfetch(c, base, { headers });
    if (!r.ok) throw new Error(`Truth Social HTTP ${r.status}`);
    const acct = await r.json();
    if (String(acct.acct || acct.username).toLowerCase() !== TRUMP_HANDLE.toLowerCase()) {
      throw new Error(`Account ${TRUMP_ACCOUNT_ID} is @${acct.acct}, not @${TRUMP_HANDLE}`);
    }
    t.verified = true;
    console.log(`[trump] verified account ${TRUMP_ACCOUNT_ID} is @${acct.acct}`);
  }
  const q = `?exclude_replies=true&limit=20${t.lastId ? `&min_id=${t.lastId}` : ""}`;
  const res = await cfetch(c, `${base}/statuses${q}`, { headers });
  if (!res.ok) throw new Error(`Truth Social HTTP ${res.status}`);
  const list = await res.json();
  if (!Array.isArray(list)) throw new Error("Truth Social returned unexpected data");
  return list.map((p) => {
    const src = p.reblog || p;
    return { id: String(p.id), text: stripHtml(src.content), url: p.url || `https://truthsocial.com/@${TRUMP_HANDLE}/${p.id}` };
  });
}

async function fetchTrumpRss(c) {
  const res = await cfetch(c, TRUMP_RSS, { headers: { "user-agent": "Mozilla/5.0 stock-alerts" } });
  if (!res.ok) throw new Error(`trumpstruth.org HTTP ${res.status}`);
  const xml = await res.text();
  const posts = [];
  for (const item of xml.split("<item>").slice(1)) {
    const id = (item.match(/<truth:originalId>(\d+)<\/truth:originalId>/) || [])[1];
    if (!id) continue;
    const title = (item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) || [])[1] || "";
    const desc = (item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) || [])[1] || "";
    const url = (item.match(/<truth:originalUrl>([^<]+)<\/truth:originalUrl>/) || [])[1] || `https://truthsocial.com/@${TRUMP_HANDLE}/${id}`;
    posts.push({ id, text: stripHtml(title || desc), url });
  }
  return posts;
}

async function trumpAgent(c) {
  const t = c.state.trump;
  const now = Date.now();
  let posts = null;
  let source = "";

  if (t.mode === "api" || now >= t.nextApiTry) {
    try {
      posts = await fetchTruthSocial(c);
      source = "truthsocial";
      if (t.mode !== "api") console.log("[trump] Truth Social works again, switching back from RSS");
      t.mode = "api";
      t.fails = 0;
    } catch (e) {
      console.log(`[trump] Truth Social failed: ${e.message}`);
      if (t.mode === "api") {
        t.fails++;
        if (t.fails >= 3) {
          t.mode = "rss";
          console.log("[trump] 3 failures in a row - switching to trumpstruth.org RSS");
        }
      }
      if (t.mode === "rss") t.nextApiTry = now + 60 * 60 * 1000; // try Truth Social again in 1 h
    }
  }
  if (!posts && t.mode === "rss") {
    posts = await fetchTrumpRss(c);
    source = "rss";
  }
  if (!posts) return "";

  posts = posts.filter((p) => p.id && /^\d+$/.test(p.id)).sort((a, b) => (bigger(a.id, b.id) ? 1 : -1));
  if (!posts.length) return "";
  const newest = posts[posts.length - 1].id;
  if (!t.lastId) {
    t.lastId = newest; // first run: just remember where we are, don't alert on old posts
    return `first run - starting after post ${newest} (${source})`;
  }
  const fresh = posts.filter((p) => bigger(p.id, t.lastId));
  if (!fresh.length) return "";
  t.lastId = fresh[fresh.length - 1].id;

  let candidates = 0;
  for (const p of fresh) {
    if (!p.text) continue;
    const hints = findTickers(p.text);
    if (!hints.length && !TRUMP_KEYWORDS.test(p.text)) continue; // cheap pre-filter
    addPending(c, { agent: "trump", id: "T" + p.id, text: p.text, url: p.url, hints });
    candidates++;
  }
  return `${fresh.length} new post(s) via ${source}, ${candidates} passed the pre-filter`;
}

// ---------------------------------------------------------------------------
// Agent 3a - Alpaca news
// ---------------------------------------------------------------------------
function alpacaHeaders(env) {
  if (!env.ALPACA_KEY_ID || !env.ALPACA_SECRET_KEY) throw new Error("ALPACA_KEY_ID / ALPACA_SECRET_KEY secrets are missing");
  return { "APCA-API-KEY-ID": env.ALPACA_KEY_ID, "APCA-API-SECRET-KEY": env.ALPACA_SECRET_KEY, accept: "application/json" };
}

async function alpacaNewsAgent(c) {
  const s = c.state;
  const firstRun = !s.newsSince;
  const since = s.newsSince || new Date(Date.now() - 30 * 60 * 1000).toISOString();
  const url = `https://data.alpaca.markets/v1beta1/news?start=${encodeURIComponent(since)}&sort=asc&limit=50&include_content=false&exclude_contentless=false`;
  const res = await cfetch(c, url, { headers: alpacaHeaders(c.env) });
  if (!res.ok) throw new Error(`Alpaca news HTTP ${res.status}: ${(await res.text()).slice(0, 150)}`);
  const data = await res.json();
  const items = data.news || [];
  let candidates = 0;
  let fresh = 0;
  for (const n of items) {
    if (n.created_at && n.created_at > (s.newsSince || "")) s.newsSince = n.created_at;
    const id = "A" + n.id;
    if (s.seen.news.includes(id)) continue;
    remember(s.seen.news, id);
    fresh++;
    if (firstRun) continue;
    const tickers = (n.symbols || []).map(normTicker).filter(isSp500);
    if (!tickers.length) continue;
    const textIn = `${n.headline || ""}. ${n.summary || ""}`;
    if (!NEWS_KEYWORDS.test(textIn)) continue;
    addPending(c, {
      agent: "news", id, title: (n.headline || "").slice(0, 200), url: n.url || "",
      text: `Headline: ${n.headline}\nSummary: ${n.summary || "(none)"}\nSource: ${n.source || ""}\nTagged tickers: ${tickers.join(", ")}`,
      hints: tickers,
    });
    candidates++;
  }
  if (firstRun && !s.newsSince) s.newsSince = new Date().toISOString();
  if (firstRun) return `first run - marked ${fresh} recent item(s) as seen`;
  return fresh ? `${fresh} new item(s), ${candidates} passed the S&P 500 + keyword filter` : "";
}

// ---------------------------------------------------------------------------
// Agent 3b - SEC EDGAR 8-K filings
// ---------------------------------------------------------------------------
async function edgarAgent(c) {
  const s = c.state;
  const email = c.env.SEC_CONTACT_EMAIL;
  if (!email) return "skipped - set the SEC_CONTACT_EMAIL variable";
  const url = "https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=8-K&company=&dateb=&owner=include&start=0&count=100&output=atom";
  const res = await cfetch(c, url, { headers: { "user-agent": `StockAlerts personal project ${email}`, accept: "application/atom+xml" } });
  if (!res.ok) throw new Error(`SEC EDGAR HTTP ${res.status}`);
  const xml = await res.text();
  const firstRun = s.seen.edgar.length === 0;
  const L = lookup();
  let fresh = 0;
  let candidates = 0;
  for (const entry of xml.split("<entry>").slice(1)) {
    const acc = (entry.match(/accession-number=([\d-]+)/) || [])[1];
    const title = stripHtml((entry.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || "");
    if (!acc || !/^8-K/.test(title)) continue;
    const id = "E" + acc;
    if (s.seen.edgar.includes(id)) continue;
    remember(s.seen.edgar, id, 600);
    fresh++;
    if (firstRun) continue;
    const cik = Number((title.match(/\((\d{10})\)/) || [])[1]);
    const ticker = L.byCik.get(cik);
    if (!ticker) continue; // not an S&P 500 company
    const link = (entry.match(/<link[^>]*href="([^"]+)"/) || [])[1] || "";
    const summary = stripHtml((entry.match(/<summary[^>]*>([\s\S]*?)<\/summary>/) || [])[1] || "");
    const items = [...summary.matchAll(/Item (\d\.\d\d):\s*([^\n]+)/g)];
    const plain = items.map((m) => EDGAR_ITEMS[m[1]] || "").join(" ");
    const itemText = items.map((m) => `Item ${m[1]}: ${m[2].trim()}`).join("\n");
    if (!NEWS_KEYWORDS.test(plain + " " + itemText)) continue;
    const company = L.byTicker.get(ticker).name;
    const mainItem = items.find((m) => EDGAR_ITEMS[m[1]]);
    addPending(c, {
      agent: "edgar", id, url: link, hints: [ticker],
      title: `8-K filing: ${company}${mainItem ? " – " + mainItem[2].trim().slice(0, 90) : ""}`,
      text: `${company} (${ticker}) just filed an SEC Form 8-K (material event report) with these items:\n${itemText}\nPlain meaning: ${plain}`,
    });
    candidates++;
  }
  if (firstRun) return `first run - marked ${fresh} recent filing(s) as seen`;
  return fresh ? `${fresh} new 8-K(s), ${candidates} from S&P 500 companies with material items` : "";
}

// ---------------------------------------------------------------------------
// Agent 2 - Congress trades (Bargo)
// ---------------------------------------------------------------------------
async function bargo(c, path) {
  if (c.state.bargo >= BARGO_DAILY_LIMIT) throw new Error("Bargo daily request budget used up");
  c.state.bargo++;
  const headers = { accept: "application/json" };
  if (c.env.BARGO_API_KEY) headers.authorization = `Bearer ${c.env.BARGO_API_KEY}`;
  const res = await cfetch(c, `https://www.bargo.ai/free-apis/congress/v1${path}`, { headers });
  if (!res.ok) throw new Error(`Bargo HTTP ${res.status}: ${(await res.text()).slice(0, 150)}`);
  const data = await res.json();
  c.state.bargoRows += (data.trades || []).length;
  const rowsLeft = Number(res.headers.get("x-ratelimit-rows-remaining"));
  if (Number.isFinite(rowsLeft) && rowsLeft < 50) c.state.bargoRows = Math.max(c.state.bargoRows, BARGO_DAILY_ROWS);
  return data;
}

function tradeKey(t) {
  return [t.member_slug, normTicker(t.ticker), t.type, t.transaction_date, t.amount_range, t.disclosure_date].join("|");
}

function compactTrade(t) {
  return {
    m: t.member, s: t.member_slug, c: t.chamber, st: t.state, t: normTicker(t.ticker), as: (t.asset || "").slice(0, 60),
    ty: t.type, d: t.transaction_date, dd: t.disclosure_date, a: t.amount_range, lo: t.amount_low || 0,
    p: t.est_price || null, rp: t.recent_price || null,
  };
}

function side(type) {
  const ty = String(type || "").toLowerCase();
  if (ty.startsWith("purchase") || ty === "buy") return "BUY";
  if (ty.startsWith("sale") || ty.startsWith("sell")) return "SELL";
  return ty.toUpperCase() || "?";
}

async function tradesAgent(c) {
  const s = c.state;
  s.lastTradesPoll = Date.now();
  const db = await getTrades(c);
  if (c.state.bargoRows + BARGO_FEED_ROWS > BARGO_DAILY_ROWS + 50) return "skipped - Bargo daily row budget used up";
  const feed = await bargo(c, `/trades?limit=${BARGO_FEED_ROWS}`);
  let added = 0;
  const newSlugs = new Set();
  for (const t of feed.trades || []) {
    const key = tradeKey(t);
    if (db.t[key]) {
      if (t.recent_price) db.t[key].rp = t.recent_price;
      continue;
    }
    db.t[key] = compactTrade(t);
    added++;
    if (s.tradesReady && !s.digest.includes(key)) s.digest.push(key);
    if (!db.members[t.member_slug]) newSlugs.add(t.member_slug);
  }
  // Backfill each politician's last 3 months once, so win rates have more data from day one
  let backfilled = 0;
  for (const slug of newSlugs) {
    if (backfilled >= BARGO_BACKFILL_PER_POLL || s.bargo >= BARGO_DAILY_LIMIT) break;
    if (s.bargoRows + BARGO_BACKFILL_ROWS > BARGO_DAILY_ROWS) break;
    try {
      const m = await bargo(c, `/members/${encodeURIComponent(slug)}?limit=${BARGO_BACKFILL_ROWS}`);
      for (const t of m.trades || []) {
        const key = tradeKey(t);
        if (!db.t[key]) db.t[key] = compactTrade(t);
      }
      db.members[slug] = c.local.date;
      backfilled++;
    } catch (e) {
      console.log(`[congress] backfill ${slug} failed: ${e.message}`);
      break;
    }
  }
  if (added || backfilled) c.tradesDirty = true;
  const firstRun = !s.tradesReady;
  s.tradesReady = true;
  if (firstRun) return `first run - stored ${added} recent trade(s) as history (no digest for these)`;
  return `${added} new trade(s), ${s.digest.length} waiting for the 6 pm digest`;
}

// Win rate per politician: % of trades where the stock beat SPY (buys) or lagged SPY (sells)
async function winRates(c, slugs) {
  const db = await getTrades(c);
  const today = c.local.date;
  const rows = Object.values(db.t).filter(
    (t) => slugs.has(t.s) && t.p > 0 && t.t && isTickerLike(t.t) && ["BUY", "SELL"].includes(side(t.ty)) && t.d < today
  );
  if (!rows.length) return { rates: {}, prices: {} };
  const tickers = [...new Set(rows.map((r) => r.t))].slice(0, 300);
  let prices = {};
  try {
    prices = await latestPrices(c, tickers);
  } catch (e) {
    console.log(`[congress] price lookup failed, using Bargo prices: ${e.message}`);
  }
  const start = rows.reduce((m, r) => (r.d < m ? r.d : m), today);
  const spyBars = (await dailyBars(c, ["SPY"], shiftDate(start, -7))).SPY || [];
  const spyNow = prices.SPY || spyBars.at(-1)?.c;
  const rates = {};
  for (const r of rows) {
    const now = prices[r.t] || r.rp;
    const spyThen = closeOnOrBefore(spyBars, r.d);
    if (!now || !spyThen || !spyNow) continue;
    const stockRet = now / r.p - 1;
    const spyRet = spyNow / spyThen - 1;
    const win = side(r.ty) === "BUY" ? stockRet > spyRet : stockRet < spyRet;
    const x = (rates[r.s] ||= { wins: 0, n: 0 });
    x.n++;
    if (win) x.wins++;
  }
  return { rates, prices };
}

function isTickerLike(t) {
  return /^[A-Z]{1,5}(\.[A-Z])?$/.test(t);
}

async function maybeDigest(c) {
  const s = c.state;
  if (c.local.hour < DIGEST_HOUR || s.lastDigestDate === c.local.date) return "";
  s.lastDigestDate = c.local.date;
  if (!s.digest.length) return "no new Congress trades today - no digest";
  const db = await getTrades(c);
  const trades = s.digest.map((k) => db.t[k]).filter(Boolean);
  s.digest = [];
  if (!trades.length) return "";

  const slugs = new Set(trades.map((t) => t.s));
  let rates = {};
  let prices = {};
  try {
    ({ rates, prices } = await winRates(c, slugs));
  } catch (e) {
    console.log(`[congress] win-rate calculation failed: ${e.message}`);
  }

  const blocks = trades.map((t) => {
    const r = rates[t.s];
    const pct = r && r.n ? Math.round((100 * r.wins) / r.n) : null;
    const star = t.lo > 50000 || (pct !== null && pct >= 60 && r.n >= 10);
    const late = t.d && t.dd ? daysBetween(t.d, t.dd) : null;
    const ticker = t.t && isTickerLike(t.t) ? t.t : t.as || "?";
    return {
      star,
      text: `${star ? "⭐ " : ""}🏛️ ${t.m} (${partyOf(t.m, t.st, t.c)}-${(t.st || "").slice(0, 2)}, ${t.c === "senate" ? "Senate" : "House"})
${side(t.ty)} ${ticker} – ${t.a || "amount n/a"}
Traded: ${t.d || "?"} | Disclosed: ${t.dd || "?"}${late !== null ? ` (${late} days late)` : ""}
Win rate: ${pct !== null ? `${pct}% over ${r.n} trade${r.n === 1 ? "" : "s"}` : "not enough data yet"}`,
      log: isTickerLike(t.t) && ["BUY", "SELL"].includes(side(t.ty)) ? { t: t.t, d: side(t.ty) === "BUY" ? "UP" : "DOWN", conf: null } : null,
    };
  });
  blocks.sort((a, b) => Number(b.star) - Number(a.star));

  // Split into WhatsApp-sized messages (max 4 messages)
  const header = `🏛️ CONGRESS TRADES – ${c.local.date} (${trades.length} new)\n⭐ = over $50k or win rate ≥60% on 10+ trades\n\n`;
  const footer = "\nData: bargo.ai";
  const msgs = [];
  let cur = header;
  let curLogs = [];
  let shown = 0;
  for (const b of blocks) {
    const add = b.text + "\n\n";
    if (cur.length + add.length + footer.length + 30 > MAX_MESSAGE_CHARS) {
      if (msgs.length === 3) break;
      msgs.push({ body: cur.trimEnd(), logs: curLogs });
      cur = "🏛️ (continued)\n\n";
      curLogs = [];
    }
    cur += add;
    if (b.log) curLogs.push(b.log);
    shown++;
  }
  if (shown < blocks.length) cur += `…and ${blocks.length - shown} more trade(s).\n`;
  msgs.push({ body: (cur.trimEnd() + "\n" + footer).trim(), logs: curLogs });
  for (const m of msgs) queueMessage(c, "congress", m.body, m.logs);
  return `digest queued: ${trades.length} trade(s) in ${msgs.length} message(s)`;
}

// ---------------------------------------------------------------------------
// Prices (Alpaca free IEX data)
// ---------------------------------------------------------------------------
async function latestPrices(c, tickers) {
  const out = {};
  const list = [...new Set(tickers.map(normTicker).filter(isTickerLike))];
  if (!list.length) return out;
  if (!list.includes("SPY")) list.push("SPY");
  for (let i = 0; i < list.length && i < 300; i += 100) {
    const chunk = list.slice(i, i + 100);
    const res = await cfetch(c, `https://data.alpaca.markets/v2/stocks/snapshots?symbols=${chunk.join(",")}&feed=iex`, { headers: alpacaHeaders(c.env) });
    if (!res.ok) throw new Error(`Alpaca snapshots HTTP ${res.status}`);
    const data = await res.json();
    for (const [sym, snap] of Object.entries(data || {})) {
      const p = snap?.latestTrade?.p || snap?.dailyBar?.c || snap?.prevDailyBar?.c;
      if (p) out[sym] = p;
    }
  }
  return out;
}

async function dailyBars(c, tickers, startDate) {
  const out = {};
  const list = [...new Set(tickers.filter(isTickerLike))];
  for (let i = 0; i < list.length; i += 50) {
    let token = "";
    let pages = 0;
    do {
      const url = `https://data.alpaca.markets/v2/stocks/bars?symbols=${list.slice(i, i + 50).join(",")}&timeframe=1Day&start=${startDate}&limit=10000&adjustment=split&feed=iex${token ? `&page_token=${token}` : ""}`;
      const res = await cfetch(c, url, { headers: alpacaHeaders(c.env) });
      if (!res.ok) throw new Error(`Alpaca bars HTTP ${res.status}`);
      const data = await res.json();
      for (const [sym, bars] of Object.entries(data.bars || {})) {
        (out[sym] ||= []).push(...bars.map((b) => ({ d: b.t.slice(0, 10), c: b.c })));
      }
      token = data.next_page_token || "";
    } while (token && ++pages < 3);
  }
  return out;
}

function closeOnOrBefore(bars, date) {
  let best = null;
  for (const b of bars) if (b.d <= date) best = b.c;
  return best || bars[0]?.c || null;
}

function shiftDate(date, days) {
  return new Date(Date.parse(date + "T00:00:00Z") + days * 86400000).toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Weekly scorecard (Sunday 7 pm)
// ---------------------------------------------------------------------------
async function maybeScorecard(c) {
  const s = c.state;
  if (c.local.weekday !== "Sun" || c.local.hour < SCORECARD_HOUR || s.lastScorecardDate === c.local.date) return "";
  s.lastScorecardDate = c.local.date;
  if (!(await getLog(c)).length) return "no alerts logged yet - scorecard skipped";
  const body = await buildScorecard(c);
  queueMessage(c, "scorecard", body, []);
  return "weekly scorecard queued";
}

async function buildScorecard(c) {
  const log = await getLog(c);
  const now = Date.now();
  const weekAgo = new Date(now - 7 * 86400000).toISOString();
  const evalFrom = new Date(now - 35 * 86400000).toISOString();
  const recent = log.filter((l) => l.ts >= evalFrom && l.px && (l.d === "UP" || l.d === "DOWN") && isTickerLike(l.t));
  let bars = {};
  if (recent.length) {
    const start = recent.reduce((m, l) => (l.ts < m ? l.ts : m), recent[0].ts).slice(0, 10);
    try {
      bars = await dailyBars(c, [...new Set(recent.map((l) => l.t))].slice(0, 150), start);
    } catch (e) {
      console.log(`[scorecard] price history failed: ${e.message}`);
    }
  }
  const agents = [
    ["trump", "🇺🇸 Trump posts"],
    ["news", "📰 News"],
    ["congress", "🏛️ Congress trades"],
  ];
  const lines = [`📊 WEEKLY SCORECARD – week to ${c.local.date}`, ""];
  for (const [key, label] of agents) {
    const week = log.filter((l) => l.a === key && l.ts >= weekAgo);
    // Congress: one log entry per trade. Others: entries from one message share a timestamp.
    const alerts = key === "congress" ? week.length : new Set(week.map((l) => l.ts)).size;
    const res = { 1: [0, 0], 5: [0, 0] };
    for (const l of recent.filter((x) => x.a === key)) {
      // first trading day strictly after the alert date (U.S. Eastern)
      const alertDay = localTime(new Date(l.ts), "America/New_York").date;
      const after = (bars[l.t] || []).filter((b) => b.d > alertDay);
      for (const h of [1, 5]) {
        const bar = after[h - 1];
        if (!bar) continue;
        res[h][1]++;
        if ((l.d === "UP" && bar.c > l.px) || (l.d === "DOWN" && bar.c < l.px)) res[h][0]++;
      }
    }
    const fmt = ([w, n]) => (n ? `${Math.round((100 * w) / n)}% (of ${n})` : "n/a");
    lines.push(`${label}: ${alerts} alert${alerts === 1 ? "" : "s"} this week`);
    lines.push(`  Right direction after 1 day: ${fmt(res[1])}`);
    lines.push(`  Right direction after 5 days: ${fmt(res[5])}`);
  }
  lines.push("", "Hit rates use alerts from the last 5 weeks with enough price data. Congress: BUY counts as UP, SELL as DOWN. Informational only.");
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Test, check and status pages
// ---------------------------------------------------------------------------
async function runTest(env) {
  const c = await makeContext(env);
  const samples = [
    `🧪 TEST 1/3
🇺🇸 TRUMP POST
📈 UP – LMT, NOC (Defense)
Confidence: 7/10
Why: Sample message - a post praising a large new defense contract.
Post: This is a sample post used to check that WhatsApp alerts work…
https://truthsocial.com/@realDonaldTrump`,
    `🧪 TEST 2/3
🏛️ Jane Example (D-CA, House)
BUY NVDA – $15,001 - $50,000
Traded: 2026-09-01 | Disclosed: 2026-09-20 (19 days late)
Win rate: 64% over 14 trades`,
    `🧪 TEST 3/3
📰 NEWS
📉 XYZ – Sample headline: company cuts full-year guidance
Confidence: 8/10
Why: Sample message - lowered guidance usually pressures the stock.
https://example.com`,
  ];
  const out = [];
  for (let i = 0; i < samples.length; i++) {
    if (i > 0) await sleep(MESSAGE_GAP_MS);
    const ok = await sendWhatsApp(c, samples[i]);
    out.push(`Test message ${i + 1}: ${ok ? "sent ✅" : "FAILED ❌ (check CALLMEBOT_PHONE and CALLMEBOT_APIKEY, and the Worker logs)"}`);
  }
  out.push("", "Test messages do not count toward the daily limit.");
  return out.join("\n");
}

async function runCheck(env) {
  const c = await makeContext(env);
  const lines = [];
  const check = async (name, fn) => {
    try {
      lines.push(`✅ ${name}: ${(await fn()) || "OK"}`);
    } catch (e) {
      lines.push(`❌ ${name}: ${e.message}`);
    }
  };
  const has = (k) => (env[k] ? "set" : "MISSING");
  lines.push("Secrets: " + ["CALLMEBOT_PHONE", "CALLMEBOT_APIKEY", "GEMINI_API_KEY", "BARGO_API_KEY", "ALPACA_KEY_ID", "ALPACA_SECRET_KEY", "ADMIN_KEY"].map((k) => `${k}=${has(k)}`).join(", "));
  lines.push(`Variable SEC_CONTACT_EMAIL=${has("SEC_CONTACT_EMAIL")}, Gemini model=${env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL}`);
  lines.push("");
  await check("KV storage", async () => {
    await env.KV.put("check", new Date().toISOString());
    return "read/write works";
  });
  await check("Gemini", async () => {
    const v = await classify(c, "financial news headline", "Headline: Apple raises full-year revenue guidance after record iPhone sales", ["AAPL"]);
    return `answered: ${v.direction} ${v.tickers.join(",")} confidence ${v.confidence}/10 (1 call used)`;
  });
  await check("Alpaca prices", async () => {
    const p = await latestPrices(c, ["AAPL"]);
    return `AAPL $${p.AAPL}, SPY $${p.SPY}`;
  });
  await check("Alpaca news", async () => {
    const res = await cfetch(c, "https://data.alpaca.markets/v1beta1/news?limit=1", { headers: alpacaHeaders(env) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const d = await res.json();
    return `latest headline: ${(d.news?.[0]?.headline || "").slice(0, 80)}`;
  });
  await check("Bargo (Congress trades)", async () => {
    const d = await bargo(c, "/trades?limit=1");
    const t = d.trades?.[0];
    return t ? `latest: ${t.member} ${side(t.type)} ${t.ticker} (${partyOf(t.member, t.state, t.chamber)})` : "no trades returned";
  });
  await check("SEC EDGAR", async () => {
    if (!env.SEC_CONTACT_EMAIL) throw new Error("set the SEC_CONTACT_EMAIL variable first");
    const res = await cfetch(c, "https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=8-K&count=10&output=atom", {
      headers: { "user-agent": `StockAlerts personal project ${env.SEC_CONTACT_EMAIL}` },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return "feed reachable";
  });
  await check("Truth Social (direct)", async () => {
    const posts = await fetchTruthSocial({ ...c, state: { ...c.state, trump: { verified: false } } });
    return `${posts.length} posts readable, account verified as @${TRUMP_HANDLE}`;
  });
  await check("trumpstruth.org RSS (backup)", async () => {
    const posts = await fetchTrumpRss(c);
    return `${posts.length} posts in feed`;
  });
  lines.push("", "If Truth Social (direct) fails but the RSS backup works, that's fine - the Worker switches to the backup automatically.");
  // Only the Gemini/Bargo counters changed; keep them
  await env.KV.put("state", JSON.stringify(c.state));
  return lines.join("\n");
}

async function runStatus(env) {
  const c = await makeContext(env);
  const s = c.state;
  const log = await getLog(c);
  return [
    `Newfoundland time: ${c.local.date} ${pad(c.local.hour)}:${pad(c.local.minute)} (${c.local.weekday})`,
    `WhatsApp messages today: ${s.sent}/${MAX_MESSAGES_PER_DAY}`,
    `News alerts today: ${s.news}/${MAX_NEWS_ALERTS_PER_DAY}`,
    `Gemini calls today: ${s.gemini}/${MAX_GEMINI_CALLS_PER_DAY}${Date.now() < s.geminiBackoffUntil ? " (paused after a rate limit)" : ""}`,
    `Bargo requests today: ${s.bargo}/${BARGO_DAILY_LIMIT} (rows ${s.bargoRows}/${BARGO_DAILY_ROWS})`,
    `Trump source: ${s.trump.mode === "api" ? "Truth Social" : "trumpstruth.org RSS (backup)"}, last post ID ${s.trump.lastId || "none yet"}`,
    `Items waiting for Gemini: ${s.pending.length}`,
    `Messages waiting to send: ${s.outbox.length}${s.outbox.some((m) => m.kind === "news") ? " (news held for quiet hours)" : ""}`,
    `Congress trades waiting for 6 pm digest: ${s.digest.length}`,
    `Alerts logged so far: ${log.length}`,
    "",
    "Last 5 logged alerts:",
    ...log.slice(-5).map((l) => `  ${l.ts.slice(0, 16)}Z ${l.a} ${l.t} ${l.d} conf=${l.conf ?? "-"} price=${l.px ?? "?"}`),
  ].join("\n");
}

// BEGIN GENERATED DATA (scripts/gen_data.py) - do not edit by hand
const DATA = {"sp500":[["MMM","3M","Industrials",66740],["AOS","A. O. Smith","Industrials",91142],["ABT","Abbott Laboratories","Health Care",1800],["ABBV","AbbVie","Health Care",1551152],["ACN","Accenture","Information Technology",1467373],["ADBE","Adobe Inc.","Information Technology",796343],["AMD","Advanced Micro Devices","Information Technology",2488],["AES","AES Corporation","Utilities",874761],["AFL","Aflac","Financials",4977],["A","Agilent Technologies","Health Care",1090872],["APD","Air Products","Materials",2969],["ABNB","Airbnb","Consumer Discretionary",1559720],["AKAM","Akamai Technologies","Information Technology",1086222],["ALB","Albemarle Corporation","Materials",915913],["ARE","Alexandria Real Estate Equities","Real Estate",1035443],["ALGN","Align Technology","Health Care",1097149],["ALLE","Allegion","Industrials",1579241],["LNT","Alliant Energy","Utilities",352541],["ALL","Allstate","Financials",899051],["GOOGL","Alphabet Inc. (Class A)","Communication Services",1652044],["GOOG","Alphabet Inc. (Class C)","Communication Services",1652044],["MO","Altria","Consumer Staples",764180],["AMZN","Amazon","Consumer Discretionary",1018724],["AMCR","Amcor","Materials",1748790],["AEE","Ameren","Utilities",1002910],["AEP","American Electric Power","Utilities",4904],["AXP","American Express","Financials",4962],["AIG","American International Group","Financials",5272],["AMT","American Tower","Real Estate",1053507],["AWK","American Water Works","Utilities",1410636],["AMP","Ameriprise Financial","Financials",820027],["AME","Ametek","Industrials",1037868],["AMGN","Amgen","Health Care",318154],["APH","Amphenol","Information Technology",820313],["ADI","Analog Devices","Information Technology",6281],["AON","Aon plc","Financials",315293],["APA","APA Corporation","Energy",1841666],["APO","Apollo Global Management","Financials",1858681],["AAPL","Apple Inc.","Information Technology",320193],["AMAT","Applied Materials","Information Technology",6951],["APP","AppLovin","Communication Services",1751008],["APTV","Aptiv","Consumer Discretionary",1521332],["ACGL","Arch Capital Group","Financials",947484],["ADM","Archer Daniels Midland","Consumer Staples",7084],["ARES","Ares Management","Financials",1176948],["ANET","Arista Networks","Information Technology",1596532],["AJG","Arthur J. Gallagher & Co.","Financials",354190],["AIZ","Assurant","Financials",1267238],["T","AT&T","Communication Services",732717],["ATO","Atmos Energy","Utilities",731802],["ADSK","Autodesk","Information Technology",769397],["ADP","Automatic Data Processing","Industrials",8670],["AZO","AutoZone","Consumer Discretionary",866787],["AVY","Avery Dennison","Materials",8818],["AXON","Axon Enterprise","Industrials",1069183],["BKR","Baker Hughes","Energy",1701605],["BALL","Ball Corporation","Materials",9389],["BAC","Bank of America","Financials",70858],["BAX","Baxter International","Health Care",10456],["BDX","Becton Dickinson","Health Care",10795],["BRK.B","Berkshire Hathaway","Financials",1067983],["BBY","Best Buy","Consumer Discretionary",764478],["TECH","Bio-Techne","Health Care",842023],["BIIB","Biogen","Health Care",875045],["BLK","BlackRock","Financials",2012383],["BX","Blackstone Inc.","Financials",1393818],["XYZ","Block, Inc.","Financials",1512673],["BE","Bloom Energy","Industrials",1664703],["BNY","BNY Mellon","Financials",1390777],["BA","Boeing","Industrials",12927],["BKNG","Booking Holdings","Consumer Discretionary",1075531],["BSX","Boston Scientific","Health Care",885725],["BMY","Bristol Myers Squibb","Health Care",14272],["AVGO","Broadcom","Information Technology",1730168],["BR","Broadridge Financial Solutions","Industrials",1383312],["BRO","Brown & Brown","Financials",79282],["BF.B","Brown–Forman","Consumer Staples",14693],["BG","Bunge Global","Consumer Staples",1996862],["BXP","BXP, Inc.","Real Estate",1037540],["CHRW","C.H. Robinson","Industrials",1043277],["CDNS","Cadence Design Systems","Information Technology",813672],["CPT","Camden Property Trust","Real Estate",906345],["COF","Capital One","Financials",927628],["CAH","Cardinal Health","Health Care",721371],["CCL","Carnival Corporation","Consumer Discretionary",815097],["CARR","Carrier Global","Industrials",1783180],["CVNA","Carvana","Consumer Discretionary",1690820],["CASY","Casey's","Consumer Staples",726958],["CAT","Caterpillar Inc.","Industrials",18230],["CBOE","Cboe Global Markets","Financials",1374310],["CBRE","CBRE Group","Real Estate",1138118],["CDW","CDW Corporation","Information Technology",1402057],["COR","Cencora","Health Care",1140859],["CNC","Centene Corporation","Health Care",1071739],["CNP","CenterPoint Energy","Utilities",1130310],["CF","CF Industries","Materials",1324404],["CRL","Charles River Laboratories","Health Care",1100682],["SCHW","Charles Schwab Corporation","Financials",316709],["CHTR","Charter Communications","Communication Services",1091667],["CVX","Chevron Corporation","Energy",93410],["CMG","Chipotle Mexican Grill","Consumer Discretionary",1058090],["CB","Chubb Limited","Financials",896159],["CHD","Church & Dwight","Consumer Staples",313927],["CIEN","Ciena","Information Technology",936395],["CI","Cigna","Health Care",1739940],["CINF","Cincinnati Financial","Financials",20286],["CTAS","Cintas","Industrials",723254],["CSCO","Cisco","Information Technology",858877],["C","Citigroup","Financials",831001],["CFG","Citizens Financial Group","Financials",759944],["CLX","Clorox","Consumer Staples",21076],["CME","CME Group","Financials",1156375],["CMS","CMS Energy","Utilities",811156],["KO","Coca-Cola Company (The)","Consumer Staples",21344],["CTSH","Cognizant","Information Technology",1058290],["COHR","Coherent Corp.","Information Technology",820318],["COIN","Coinbase","Financials",1679788],["CL","Colgate-Palmolive","Consumer Staples",21665],["CMCSA","Comcast","Communication Services",1166691],["FIX","Comfort Systems USA","Industrials",1035983],["COP","ConocoPhillips","Energy",1163165],["ED","Consolidated Edison","Utilities",1047862],["STZ","Constellation Brands","Consumer Staples",16918],["CEG","Constellation Energy","Utilities",1868275],["COO","Cooper Companies (The)","Health Care",711404],["CPRT","Copart","Industrials",900075],["GLW","Corning Inc.","Information Technology",24741],["CPAY","Corpay","Financials",1175454],["CTVA","Corteva","Materials",1755672],["CSGP","CoStar Group","Real Estate",1057352],["COST","Costco","Consumer Staples",909832],["CRH","CRH plc","Materials",849395],["CRWD","CrowdStrike","Information Technology",1535527],["CCI","Crown Castle","Real Estate",1051470],["CSX","CSX Corporation","Industrials",277948],["CMI","Cummins","Industrials",26172],["CVS","CVS Health","Health Care",64803],["DHR","Danaher Corporation","Health Care",313616],["DRI","Darden Restaurants","Consumer Discretionary",940944],["DDOG","Datadog","Information Technology",1561550],["DVA","DaVita","Health Care",927066],["DECK","Deckers Brands","Consumer Discretionary",910521],["DE","Deere & Company","Industrials",315189],["DELL","Dell Technologies","Information Technology",1571996],["DAL","Delta Air Lines","Industrials",27904],["DVN","Devon Energy","Energy",1090012],["DXCM","Dexcom","Health Care",1093557],["FANG","Diamondback Energy","Energy",1539838],["DLR","Digital Realty","Real Estate",1297996],["DG","Dollar General","Consumer Staples",29534],["DLTR","Dollar Tree","Consumer Staples",935703],["D","Dominion Energy","Utilities",715957],["DPZ","Domino's","Consumer Discretionary",1286681],["DASH","DoorDash","Consumer Discretionary",1792789],["DOV","Dover Corporation","Industrials",29905],["DOW","Dow Inc.","Materials",1751788],["DHI","D. R. Horton","Consumer Discretionary",882184],["DTE","DTE Energy","Utilities",936340],["DUK","Duke Energy","Utilities",1326160],["DD","DuPont","Industrials",1666700],["ETN","Eaton Corporation","Industrials",1551182],["EBAY","eBay Inc.","Consumer Discretionary",1065088],["ECHO","EchoStar","Communication Services",1415404],["ECL","Ecolab","Materials",31462],["EIX","Edison International","Utilities",827052],["EW","Edwards Lifesciences","Health Care",1099800],["ELV","Elevance Health","Health Care",1156039],["EME","Emcor","Industrials",105634],["EMR","Emerson Electric","Industrials",32604],["ETR","Entergy","Utilities",65984],["EOG","EOG Resources","Energy",821189],["EQT","EQT Corporation","Energy",33213],["EFX","Equifax","Industrials",33185],["EQIX","Equinix","Real Estate",1101239],["ERIE","Erie Indemnity","Financials",922621],["ESS","Essex Property Trust","Real Estate",920522],["EL","Estée Lauder Companies (The)","Consumer Staples",1001250],["EG","Everest Group","Financials",1095073],["EVRG","Evergy","Utilities",1711269],["P","Everpure","Information Technology",1474432],["ES","Eversource Energy","Utilities",72741],["EXC","Exelon","Utilities",1109357],["EXE","Expand Energy","Energy",895126],["EXPE","Expedia Group","Consumer Discretionary",1324424],["EXPD","Expeditors International","Industrials",746515],["EXR","Extra Space Storage","Real Estate",1289490],["XOM","ExxonMobil","Energy",2115436],["FFIV","F5, Inc.","Information Technology",1048695],["FDS","FactSet","Financials",1013237],["FICO","Fair Isaac","Information Technology",814547],["FAST","Fastenal","Industrials",815556],["FRT","Federal Realty Investment Trust","Real Estate",34903],["FDX","FedEx","Industrials",1048911],["FDXF","FedEx Freight","Industrials",2082247],["FERG","Ferguson Enterprises","Industrials",2011641],["FIS","Fidelity National Information Services","Financials",1136893],["FITB","Fifth Third Bancorp","Financials",35527],["FSLR","First Solar","Information Technology",1274494],["FE","FirstEnergy","Utilities",1031296],["FISV","Fiserv","Financials",798354],["FLEX","Flex Ltd.","Information Technology",866374],["F","Ford Motor Company","Consumer Discretionary",37996],["FTNT","Fortinet","Information Technology",1262039],["FTV","Fortive","Industrials",1659166],["FOXA","Fox Corporation (Class A)","Communication Services",1754301],["FOX","Fox Corporation (Class B)","Communication Services",1754301],["BEN","Franklin Resources","Financials",38777],["FCX","Freeport-McMoRan","Materials",831259],["GRMN","Garmin","Consumer Discretionary",1121788],["IT","Gartner","Information Technology",749251],["GE","GE Aerospace","Industrials",40545],["GEHC","GE HealthCare","Health Care",1932393],["GEV","GE Vernova","Industrials",1996810],["GEN","Gen Digital","Information Technology",849399],["GNRC","Generac","Industrials",1474735],["GD","General Dynamics","Industrials",40533],["GIS","General Mills","Consumer Staples",40704],["GM","General Motors","Consumer Discretionary",1467858],["GPC","Genuine Parts Company","Consumer Discretionary",40987],["GILD","Gilead Sciences","Health Care",882095],["GPN","Global Payments","Financials",1123360],["GL","Globe Life","Financials",320335],["GDDY","GoDaddy","Information Technology",1609711],["GS","Goldman Sachs","Financials",886982],["HAL","Halliburton","Energy",45012],["HIG","Hartford (The)","Financials",874766],["HAS","Hasbro","Consumer Discretionary",46080],["HCA","HCA Healthcare","Health Care",860730],["DOC","Healthpeak Properties","Real Estate",765880],["HSIC","Henry Schein","Health Care",1000228],["HSY","Hershey Company (The)","Consumer Staples",47111],["HPE","Hewlett Packard Enterprise","Information Technology",1645590],["HLT","Hilton Worldwide","Consumer Discretionary",1585689],["HD","Home Depot (The)","Consumer Discretionary",354950],["HONA","Honeywell Aerospace","Industrials",2089271],["HON","Honeywell Technologies","Industrials",773840],["HRL","Hormel Foods","Consumer Staples",48465],["HST","Host Hotels & Resorts","Real Estate",1070750],["HWM","Howmet Aerospace","Industrials",4281],["HPQ","HP Inc.","Information Technology",47217],["HUBB","Hubbell Incorporated","Industrials",48898],["HUM","Humana","Health Care",49071],["HBAN","Huntington Bancshares","Financials",49196],["HII","Huntington Ingalls Industries","Industrials",1501585],["IBM","IBM","Information Technology",51143],["IEX","IDEX Corporation","Industrials",832101],["IDXX","Idexx Laboratories","Health Care",874716],["ITW","Illinois Tool Works","Industrials",49826],["ILMN","Illumina, Inc.","Health Care",1110803],["INCY","Incyte","Health Care",879169],["IR","Ingersoll Rand","Industrials",1699150],["PODD","Insulet Corporation","Health Care",1145197],["INTC","Intel","Information Technology",50863],["IBKR","Interactive Brokers","Financials",1381197],["ICE","Intercontinental Exchange","Financials",1571949],["IFF","International Flavors & Fragrances","Materials",51253],["IP","International Paper","Materials",51434],["INTU","Intuit","Information Technology",896878],["ISRG","Intuitive Surgical","Health Care",1035267],["IVZ","Invesco","Financials",914208],["INVH","Invitation Homes","Real Estate",1687229],["IQV","IQVIA","Health Care",1478242],["IRM","Iron Mountain","Real Estate",1020569],["JBHT","J.B. Hunt","Industrials",728535],["JBL","Jabil","Information Technology",898293],["JKHY","Jack Henry & Associates","Financials",779152],["J","Jacobs Solutions","Industrials",52988],["JNJ","Johnson & Johnson","Health Care",200406],["JCI","Johnson Controls","Industrials",833444],["JPM","JPMorgan Chase","Financials",19617],["KVUE","Kenvue","Consumer Staples",1944048],["KDP","Keurig Dr Pepper","Consumer Staples",1418135],["KEY","KeyCorp","Financials",91576],["KEYS","Keysight Technologies","Information Technology",1601046],["KMB","Kimberly-Clark","Consumer Staples",55785],["KIM","Kimco Realty","Real Estate",879101],["KMI","Kinder Morgan","Energy",1506307],["KKR","KKR & Co.","Financials",1404912],["KLAC","KLA Corporation","Information Technology",319201],["KHC","Kraft Heinz","Consumer Staples",1637459],["KR","Kroger","Consumer Staples",56873],["LHX","L3Harris","Industrials",202058],["LH","Labcorp","Health Care",920148],["LRCX","Lam Research","Information Technology",707549],["LVS","Las Vegas Sands","Consumer Discretionary",1300514],["LDOS","Leidos","Industrials",1336920],["LEN","Lennar","Consumer Discretionary",920760],["LII","Lennox International","Industrials",1069202],["LLY","Lilly (Eli)","Health Care",59478],["LIN","Linde plc","Materials",1707925],["LYV","Live Nation Entertainment","Communication Services",1335258],["LMT","Lockheed Martin","Industrials",936468],["L","Loews Corporation","Financials",60086],["LOW","Lowe's","Consumer Discretionary",60667],["LULU","Lululemon Athletica","Consumer Discretionary",1397187],["LITE","Lumentum","Information Technology",1633978],["LYB","LyondellBasell","Materials",1489393],["MTB","M&T Bank","Financials",36270],["MPC","Marathon Petroleum","Energy",1510295],["MAR","Marriott International","Consumer Discretionary",1048286],["MRSH","Marsh McLennan","Financials",62709],["MLM","Martin Marietta Materials","Materials",916076],["MRVL","Marvell Technology","Information Technology",1835632],["MAS","Masco","Industrials",62996],["MA","Mastercard","Financials",1141391],["MKC","McCormick & Company","Consumer Staples",63754],["MCD","McDonald's","Consumer Discretionary",63908],["MCK","McKesson Corporation","Health Care",927653],["MDT","Medtronic","Health Care",1613103],["MRK","Merck & Co.","Health Care",310158],["META","Meta Platforms","Communication Services",1326801],["MET","MetLife","Financials",1099219],["MTD","Mettler Toledo","Health Care",1037646],["MGM","MGM Resorts","Consumer Discretionary",789570],["MCHP","Microchip Technology","Information Technology",827054],["MU","Micron Technology","Information Technology",723125],["MSFT","Microsoft","Information Technology",789019],["MAA","Mid-America Apartment Communities","Real Estate",912595],["MRNA","Moderna","Health Care",1682852],["MDLZ","Mondelez International","Consumer Staples",1103982],["MPWR","Monolithic Power Systems","Information Technology",1280452],["MNST","Monster Beverage","Consumer Staples",865752],["MCO","Moody's Corporation","Financials",1059556],["MS","Morgan Stanley","Financials",895421],["MOS","Mosaic Company (The)","Materials",1285785],["MSI","Motorola Solutions","Information Technology",68505],["MSCI","MSCI","Financials",1408198],["NDAQ","Nasdaq, Inc.","Financials",1120193],["NTAP","NetApp","Information Technology",1002047],["NFLX","Netflix","Communication Services",1065280],["NEM","Newmont","Materials",1164727],["NWSA","News Corp (Class A)","Communication Services",1564708],["NWS","News Corp (Class B)","Communication Services",1564708],["NEE","NextEra Energy","Utilities",753308],["NKE","Nike, Inc.","Consumer Discretionary",320187],["NI","NiSource","Utilities",1111711],["NDSN","Nordson Corporation","Industrials",72331],["NSC","Norfolk Southern","Industrials",702165],["NTRS","Northern Trust","Financials",73124],["NOC","Northrop Grumman","Industrials",1133421],["NCLH","Norwegian Cruise Line Holdings","Consumer Discretionary",1513761],["NRG","NRG Energy","Utilities",1013871],["NUE","Nucor","Materials",73309],["NVDA","Nvidia","Information Technology",1045810],["NVR","NVR, Inc.","Consumer Discretionary",906163],["NXPI","NXP Semiconductors","Information Technology",1413447],["ORLY","O'Reilly Automotive","Consumer Discretionary",898173],["OXY","Occidental Petroleum","Energy",797468],["ODFL","Old Dominion","Industrials",878927],["OMC","Omnicom Group","Communication Services",29989],["ON","ON Semiconductor","Information Technology",1097864],["OKE","Oneok","Energy",1039684],["ORCL","Oracle Corporation","Information Technology",1341439],["OTIS","Otis Worldwide","Industrials",1781335],["PCAR","Paccar","Industrials",75362],["PKG","Packaging Corporation of America","Materials",75677],["PLTR","Palantir Technologies","Information Technology",1321655],["PANW","Palo Alto Networks","Information Technology",1327567],["PSKY","Paramount Skydance Corporation","Communication Services",2041610],["PH","Parker Hannifin","Industrials",76334],["PAYX","Paychex","Industrials",723531],["PYPL","PayPal","Financials",1633917],["PNR","Pentair","Industrials",77360],["PEP","PepsiCo","Consumer Staples",77476],["PFE","Pfizer","Health Care",78003],["PCG","PG&E Corporation","Utilities",1004980],["PM","Philip Morris International","Consumer Staples",1413329],["PSX","Phillips 66","Energy",1534701],["PNW","Pinnacle West Capital","Utilities",764622],["PNC","PNC Financial Services","Financials",713676],["PPG","PPG Industries","Materials",79879],["PPL","PPL Corporation","Utilities",922224],["PFG","Principal Financial Group","Financials",1126328],["PG","Procter & Gamble","Consumer Staples",80424],["PGR","Progressive Corporation","Financials",80661],["PLD","Prologis","Real Estate",1045609],["PRU","Prudential Financial","Financials",1137774],["PEG","Public Service Enterprise Group","Utilities",788784],["PTC","PTC Inc.","Information Technology",857005],["PSA","Public Storage","Real Estate",1393311],["PHM","PulteGroup","Consumer Discretionary",822416],["PWR","Quanta Services","Industrials",1050915],["QCOM","Qualcomm","Information Technology",804328],["DGX","Quest Diagnostics","Health Care",1022079],["Q","Qnity Electronics","Information Technology",2058873],["RL","Ralph Lauren Corporation","Consumer Discretionary",1037038],["RJF","Raymond James Financial","Financials",720005],["RDDT","Reddit","Communication Services",1713445],["RTX","RTX Corporation","Industrials",101829],["O","Realty Income","Real Estate",726728],["REG","Regency Centers","Real Estate",910606],["REGN","Regeneron Pharmaceuticals","Health Care",872589],["RF","Regions Financial Corporation","Financials",1281761],["RSG","Republic Services","Industrials",1060391],["RMD","ResMed","Health Care",943819],["RVTY","Revvity","Health Care",31791],["HOOD","Robinhood Markets","Financials",1783879],["ROK","Rockwell Automation","Industrials",1024478],["ROL","Rollins, Inc.","Industrials",84839],["ROP","Roper Technologies","Information Technology",882835],["ROST","Ross Stores","Consumer Discretionary",745732],["RCL","Royal Caribbean Group","Consumer Discretionary",884887],["SPGI","S&P Global","Financials",64040],["CRM","Salesforce","Information Technology",1108524],["SNDK","Sandisk","Information Technology",2023554],["SBAC","SBA Communications","Real Estate",1034054],["SLB","Schlumberger","Energy",87347],["STX","Seagate Technology","Information Technology",1137789],["SRE","Sempra","Utilities",1032208],["NOW","ServiceNow","Information Technology",1373715],["SHW","Sherwin-Williams","Materials",89800],["SPG","Simon Property Group","Real Estate",1063761],["SWKS","Skyworks Solutions","Information Technology",4127],["SJM","J.M. Smucker Company (The)","Consumer Staples",91419],["SW","Smurfit Westrock","Materials",2005951],["SNA","Snap-on","Industrials",91440],["SOLV","Solventum","Health Care",1964738],["SO","Southern Company","Utilities",92122],["LUV","Southwest Airlines","Industrials",92380],["SWK","Stanley Black & Decker","Industrials",93556],["SBUX","Starbucks","Consumer Discretionary",829224],["STT","State Street Corporation","Financials",93751],["STLD","Steel Dynamics","Materials",1022671],["STE","Steris","Health Care",1757898],["SYK","Stryker Corporation","Health Care",310764],["SMCI","Supermicro","Information Technology",1375365],["SYF","Synchrony Financial","Financials",1601712],["SNPS","Synopsys","Information Technology",883241],["SYY","Sysco","Consumer Staples",96021],["TMUS","T-Mobile US","Communication Services",1283699],["TROW","T. Rowe Price","Financials",1113169],["TTWO","Take-Two Interactive","Communication Services",946581],["TPR","Tapestry, Inc.","Consumer Discretionary",1116132],["TRGP","Targa Resources","Energy",1389170],["TGT","Target Corporation","Consumer Staples",27419],["TEL","TE Connectivity","Information Technology",1385157],["TDY","Teledyne Technologies","Information Technology",1094285],["TER","Teradyne","Information Technology",97210],["TSLA","Tesla, Inc.","Consumer Discretionary",1318605],["TXN","Texas Instruments","Information Technology",97476],["TPL","Texas Pacific Land Corporation","Energy",1811074],["TXT","Textron","Industrials",217346],["TMO","Thermo Fisher Scientific","Health Care",97745],["TJX","TJX Companies","Consumer Discretionary",109198],["TKO","TKO Group Holdings","Communication Services",1973266],["TSCO","Tractor Supply","Consumer Discretionary",916365],["TT","Trane Technologies","Industrials",1466258],["TDG","TransDigm Group","Industrials",1260221],["TRV","Travelers Companies (The)","Financials",86312],["TRMB","Trimble Inc.","Information Technology",864749],["TFC","Truist Financial","Financials",92230],["TYL","Tyler Technologies","Information Technology",860731],["TSN","Tyson Foods","Consumer Staples",100493],["USB","U.S. Bancorp","Financials",36104],["UBER","Uber","Industrials",1543151],["UDR","UDR, Inc.","Real Estate",74208],["ULTA","Ulta Beauty","Consumer Discretionary",1403568],["UNP","Union Pacific Corporation","Industrials",100885],["UAL","United Airlines Holdings","Industrials",100517],["UPS","United Parcel Service","Industrials",1090727],["URI","United Rentals","Industrials",1067701],["UNH","UnitedHealth Group","Health Care",731766],["UHS","Universal Health Services","Health Care",352915],["VLO","Valero Energy","Energy",1035002],["VEEV","Veeva Systems","Health Care",1393052],["VTR","Ventas","Real Estate",740260],["VLTO","Veralto","Industrials",1967680],["VRSN","Verisign","Information Technology",1014473],["VRSK","Verisk Analytics","Industrials",1442145],["VZ","Verizon","Communication Services",732712],["VRTX","Vertex Pharmaceuticals","Health Care",875320],["VRT","Vertiv","Industrials",1674101],["VTRS","Viatris","Health Care",1792044],["VICI","Vici Properties","Real Estate",1705696],["V","Visa Inc.","Financials",1403161],["VST","Vistra Corp.","Utilities",1692819],["VMRK","Vivmark Residential","Real Estate",906107],["VMC","Vulcan Materials Company","Materials",1396009],["WRB","W. R. Berkley Corporation","Financials",11544],["GWW","W. W. Grainger","Industrials",277135],["WAB","Wabtec","Industrials",943452],["WMT","Walmart","Consumer Staples",104169],["DIS","Walt Disney Company (The)","Communication Services",1744489],["WBD","Warner Bros. Discovery","Communication Services",1437107],["WM","Waste Management","Industrials",823768],["WAT","Waters Corporation","Health Care",1000697],["WEC","WEC Energy Group","Utilities",783325],["WFC","Wells Fargo","Financials",72971],["WELL","Welltower","Real Estate",766704],["WST","West Pharmaceutical Services","Health Care",105770],["WDC","Western Digital","Information Technology",106040],["WY","Weyerhaeuser","Real Estate",106535],["WSM","Williams-Sonoma, Inc.","Consumer Discretionary",719955],["WMB","Williams Companies","Energy",107263],["WTW","Willis Towers Watson","Financials",1140536],["WDAY","Workday, Inc.","Information Technology",1327811],["WYNN","Wynn Resorts","Consumer Discretionary",1174922],["XEL","Xcel Energy","Utilities",72903],["XYL","Xylem Inc.","Industrials",1524472],["YUM","Yum! Brands","Consumer Discretionary",1041061],["ZBRA","Zebra Technologies","Information Technology",877212],["ZBH","Zimmer Biomet","Health Care",1136869],["ZTS","Zoetis","Health Care",1555280]],"aliases":{"A. O. Smith":"AOS","Abbott Laboratories":"ABT","AbbVie":"ABBV","Accenture":"ACN","Adobe Inc.":"ADBE","Adobe":"ADBE","Advanced Micro Devices":"AMD","AES Corporation":"AES","AES":"AES","Aflac":"AFL","Agilent Technologies":"A","Agilent":"A","Air Products":"APD","Airbnb":"ABNB","Akamai Technologies":"AKAM","Akamai":"AKAM","Albemarle Corporation":"ALB","Albemarle":"ALB","Alexandria Real Estate Equities":"ARE","Align Technology":"ALGN","Align":"ALGN","Allegion":"ALLE","Alliant Energy":"LNT","Allstate":"ALL","Alphabet Inc. (Class A)":"GOOGL","Alphabet":"GOOGL","Alphabet Inc. (Class C)":"GOOG","Altria":"MO","Amazon":"AMZN","Amcor":"AMCR","Ameren":"AEE","American Electric Power":"AEP","American Express":"AXP","American International Group":"AIG","American Tower":"AMT","American Water Works":"AWK","Ameriprise Financial":"AMP","Ameriprise":"AMP","Ametek":"AME","Amgen":"AMGN","Amphenol":"APH","Analog Devices":"ADI","Aon plc":"AON","Aon":"AON","APA Corporation":"APA","APA":"APA","Apollo Global Management":"APO","Apple Inc.":"AAPL","Apple":"AAPL","Applied Materials":"AMAT","AppLovin":"APP","Aptiv":"APTV","Arch Capital Group":"ACGL","Arch Capital":"ACGL","Archer Daniels Midland":"ADM","Ares Management":"ARES","Arista Networks":"ANET","Arthur J. Gallagher & Co.":"AJG","Arthur J. Gallagher":"AJG","Assurant":"AIZ","AT&T":"T","Atmos Energy":"ATO","Autodesk":"ADSK","Automatic Data Processing":"ADP","AutoZone":"AZO","Avery Dennison":"AVY","Axon Enterprise":"AXON","Baker Hughes":"BKR","Ball Corporation":"BALL","Bank of America":"BAC","Baxter":"BAX","Baxter International":"BAX","Becton Dickinson":"BDX","Berkshire Hathaway":"BRK.B","Best Buy":"BBY","Bio-Techne":"TECH","Biogen":"BIIB","BlackRock":"BLK","Blackstone":"BX","Blackstone Inc.":"BX","Block, Inc.":"XYZ","Bloom Energy":"BE","BNY Mellon":"BNY","Boeing":"BA","Booking Holdings":"BKNG","Boston Scientific":"BSX","Bristol Myers Squibb":"BMY","Broadcom":"AVGO","Broadridge Financial Solutions":"BR","Brown & Brown":"BRO","Brown–Forman":"BF.B","Bunge Global":"BG","BXP":"BXP","BXP, Inc.":"BXP","C.H. Robinson":"CHRW","Cadence Design Systems":"CDNS","Cadence Design":"CDNS","Camden Property":"CPT","Camden Property Trust":"CPT","Capital One":"COF","Cardinal Health":"CAH","Carnival Corporation":"CCL","Carrier Global":"CARR","Carvana":"CVNA","Casey's":"CASY","Caterpillar":"CAT","Caterpillar Inc.":"CAT","Cboe Global Markets":"CBOE","CBRE Group":"CBRE","CBRE":"CBRE","CDW Corporation":"CDW","CDW":"CDW","Cencora":"COR","Centene Corporation":"CNC","Centene":"CNC","CenterPoint Energy":"CNP","CF Industries":"CF","Charles River Laboratories":"CRL","Charles Schwab":"SCHW","Charles Schwab Corporation":"SCHW","Charter Communications":"CHTR","Chevron":"CVX","Chevron Corporation":"CVX","Chipotle Mexican Grill":"CMG","Chubb":"CB","Chubb Limited":"CB","Church & Dwight":"CHD","Ciena":"CIEN","Cigna":"CI","Cincinnati Financial":"CINF","Cintas":"CTAS","Cisco":"CSCO","Citigroup":"C","Citizens Financial Group":"CFG","Clorox":"CLX","CME Group":"CME","CME":"CME","CMS Energy":"CMS","Coca-Cola":"KO","Coca-Cola Company (The)":"KO","Cognizant":"CTSH","Coherent Corp.":"COHR","Coinbase":"COIN","Colgate-Palmolive":"CL","Comcast":"CMCSA","Comfort Systems USA":"FIX","ConocoPhillips":"COP","Consolidated Edison":"ED","Constellation Brands":"STZ","Constellation Energy":"CEG","Cooper Companies (The)":"COO","Copart":"CPRT","Corning Inc.":"GLW","Corpay":"CPAY","Corteva":"CTVA","CoStar Group":"CSGP","CoStar":"CSGP","Costco":"COST","CRH":"CRH","CRH plc":"CRH","CrowdStrike":"CRWD","Crown Castle":"CCI","CSX Corporation":"CSX","CSX":"CSX","Cummins":"CMI","CVS Health":"CVS","Danaher Corporation":"DHR","Danaher":"DHR","Darden Restaurants":"DRI","Datadog":"DDOG","DaVita":"DVA","Deckers Brands":"DECK","Deckers":"DECK","Deere":"DE","Deere & Company":"DE","Dell Technologies":"DELL","Dell":"DELL","Delta Air Lines":"DAL","Devon Energy":"DVN","Dexcom":"DXCM","Diamondback Energy":"FANG","Digital Realty":"DLR","Dollar General":"DG","Dollar Tree":"DLTR","Dominion Energy":"D","Domino's":"DPZ","DoorDash":"DASH","Dover Corporation":"DOV","Dow Inc.":"DOW","D. R. Horton":"DHI","DTE Energy":"DTE","Duke Energy":"DUK","DuPont":"DD","Eaton Corporation":"ETN","Eaton":"ETN","eBay":"EBAY","eBay Inc.":"EBAY","EchoStar":"ECHO","Ecolab":"ECL","Edison International":"EIX","Edwards Lifesciences":"EW","Elevance Health":"ELV","Emcor":"EME","Emerson Electric":"EMR","Entergy":"ETR","EOG Resources":"EOG","EQT":"EQT","EQT Corporation":"EQT","Equifax":"EFX","Equinix":"EQIX","Erie Indemnity":"ERIE","Essex Property Trust":"ESS","Essex Property":"ESS","Estée Lauder":"EL","Estée Lauder Companies (The)":"EL","Everest Group":"EG","Evergy":"EVRG","Everpure":"P","Eversource Energy":"ES","Exelon":"EXC","Expand Energy":"EXE","Expedia Group":"EXPE","Expedia":"EXPE","Expeditors International":"EXPD","Expeditors":"EXPD","Extra Space Storage":"EXR","ExxonMobil":"XOM","F5, Inc.":"FFIV","FactSet":"FDS","Fair Isaac":"FICO","Fastenal":"FAST","Federal Realty Investment":"FRT","Federal Realty Investment Trust":"FRT","FedEx":"FDX","FedEx Freight":"FDXF","Ferguson Enterprises":"FERG","Ferguson":"FERG","Fidelity National Information Services":"FIS","Fidelity National Information":"FIS","Fifth Third Bancorp":"FITB","Fifth Third":"FITB","First Solar":"FSLR","FirstEnergy":"FE","Fiserv":"FISV","Flex Ltd.":"FLEX","Ford Motor Company":"F","Ford Motor":"F","Fortinet":"FTNT","Fortive":"FTV","Fox Corporation (Class A)":"FOXA","Fox Corporation (Class B)":"FOX","Franklin Resources":"BEN","Freeport-McMoRan":"FCX","Garmin":"GRMN","Gartner":"IT","GE Aerospace":"GE","GE HealthCare":"GEHC","GE Vernova":"GEV","General Dynamics":"GD","General Mills":"GIS","General Motors":"GM","Genuine Parts Company":"GPC","Genuine Parts":"GPC","Gilead Sciences":"GILD","GoDaddy":"GDDY","Goldman Sachs":"GS","Halliburton":"HAL","Hartford (The)":"HIG","Hasbro":"HAS","HCA Healthcare":"HCA","Healthpeak Properties":"DOC","Henry Schein":"HSIC","Hershey":"HSY","Hershey Company (The)":"HSY","Hewlett Packard Enterprise":"HPE","Hilton Worldwide":"HLT","Home Depot":"HD","Home Depot (The)":"HD","Honeywell Aerospace":"HONA","Honeywell Technologies":"HON","Honeywell":"HON","Hormel Foods":"HRL","Host Hotels & Resorts":"HST","Howmet Aerospace":"HWM","HP Inc.":"HPQ","Hubbell Incorporated":"HUBB","Hubbell":"HUBB","Humana":"HUM","Huntington Bancshares":"HBAN","Huntington Ingalls Industries":"HII","Huntington Ingalls":"HII","IBM":"IBM","IDEX Corporation":"IEX","IDEX":"IEX","Idexx Laboratories":"IDXX","Illinois Tool Works":"ITW","Illumina":"ILMN","Illumina, Inc.":"ILMN","Incyte":"INCY","Ingersoll Rand":"IR","Insulet":"PODD","Insulet Corporation":"PODD","Intel":"INTC","Interactive Brokers":"IBKR","Intercontinental Exchange":"ICE","International Flavors & Fragrances":"IFF","International Paper":"IP","Intuit":"INTU","Intuitive Surgical":"ISRG","Invesco":"IVZ","Invitation Homes":"INVH","IQVIA":"IQV","Iron Mountain":"IRM","J.B. Hunt":"JBHT","Jack Henry & Associates":"JKHY","Jacobs Solutions":"J","Johnson & Johnson":"JNJ","Johnson Controls":"JCI","JPMorgan Chase":"JPM","Kenvue":"KVUE","Keurig Dr Pepper":"KDP","KeyCorp":"KEY","Keysight Technologies":"KEYS","Keysight":"KEYS","Kimberly-Clark":"KMB","Kimco Realty":"KIM","Kinder Morgan":"KMI","KKR":"KKR","KKR & Co.":"KKR","KLA Corporation":"KLAC","KLA":"KLAC","Kraft Heinz":"KHC","Kroger":"KR","L3Harris":"LHX","Labcorp":"LH","Lam Research":"LRCX","Las Vegas Sands":"LVS","Leidos":"LDOS","Lennar":"LEN","Lennox International":"LII","Eli Lilly":"LLY","Linde plc":"LIN","Linde":"LIN","Live Nation Entertainment":"LYV","Lockheed Martin":"LMT","Loews":"L","Loews Corporation":"L","Lowe's":"LOW","Lululemon Athletica":"LULU","Lumentum":"LITE","LyondellBasell":"LYB","M&T Bank":"MTB","Marathon Petroleum":"MPC","Marriott":"MAR","Marriott International":"MAR","Marsh McLennan":"MRSH","Martin Marietta Materials":"MLM","Marvell Technology":"MRVL","Marvell":"MRVL","Masco":"MAS","Mastercard":"MA","McCormick":"MKC","McCormick & Company":"MKC","McDonald's":"MCD","McKesson":"MCK","McKesson Corporation":"MCK","Medtronic":"MDT","Merck & Co.":"MRK","Merck":"MRK","Meta Platforms":"META","MetLife":"MET","Mettler Toledo":"MTD","MGM Resorts":"MGM","Microchip":"MCHP","Microchip Technology":"MCHP","Micron Technology":"MU","Micron":"MU","Microsoft":"MSFT","Mid-America Apartment Communities":"MAA","Moderna":"MRNA","Mondelez International":"MDLZ","Mondelez":"MDLZ","Monolithic Power":"MPWR","Monolithic Power Systems":"MPWR","Monster Beverage":"MNST","Moody's Corporation":"MCO","Moody's":"MCO","Morgan Stanley":"MS","Mosaic Company (The)":"MOS","Mosaic":"MOS","Motorola Solutions":"MSI","MSCI":"MSCI","Nasdaq, Inc.":"NDAQ","Nasdaq":"NDAQ","NetApp":"NTAP","Netflix":"NFLX","Newmont":"NEM","News Corp (Class A)":"NWSA","News Corp (Class B)":"NWS","NextEra Energy":"NEE","Nike, Inc.":"NKE","Nike":"NKE","NiSource":"NI","Nordson Corporation":"NDSN","Nordson":"NDSN","Norfolk Southern":"NSC","Northern Trust":"NTRS","Northrop Grumman":"NOC","Norwegian Cruise Line Holdings":"NCLH","Norwegian Cruise Line":"NCLH","NRG Energy":"NRG","Nucor":"NUE","Nvidia":"NVDA","NVR":"NVR","NVR, Inc.":"NVR","NXP Semiconductors":"NXPI","O'Reilly Automotive":"ORLY","Occidental Petroleum":"OXY","Old Dominion":"ODFL","Omnicom Group":"OMC","Omnicom":"OMC","ON Semiconductor":"ON","Oneok":"OKE","Oracle":"ORCL","Oracle Corporation":"ORCL","Otis Worldwide":"OTIS","Paccar":"PCAR","Packaging Corporation of America":"PKG","Palantir":"PLTR","Palantir Technologies":"PLTR","Palo Alto Networks":"PANW","Paramount Skydance":"PSKY","Paramount Skydance Corporation":"PSKY","Parker Hannifin":"PH","Paychex":"PAYX","PayPal":"PYPL","Pentair":"PNR","PepsiCo":"PEP","Pfizer":"PFE","PG&E Corporation":"PCG","PG&E":"PCG","Philip Morris":"PM","Philip Morris International":"PM","Phillips 66":"PSX","Pinnacle West Capital":"PNW","PNC":"PNC","PNC Financial Services":"PNC","PPG":"PPG","PPG Industries":"PPG","PPL":"PPL","PPL Corporation":"PPL","Principal Financial Group":"PFG","Procter & Gamble":"PG","Progressive Corporation":"PGR","Prologis":"PLD","Prudential Financial":"PRU","Public Service Enterprise Group":"PEG","Public Service Enterprise":"PEG","PTC Inc.":"PTC","PTC":"PTC","Public Storage":"PSA","PulteGroup":"PHM","Quanta Services":"PWR","Qualcomm":"QCOM","Quest Diagnostics":"DGX","Qnity Electronics":"Q","Ralph Lauren Corporation":"RL","Ralph Lauren":"RL","Raymond James Financial":"RJF","Raymond James":"RJF","Reddit":"RDDT","RTX":"RTX","RTX Corporation":"RTX","Realty Income":"O","Regency Centers":"REG","Regeneron Pharmaceuticals":"REGN","Regions Financial Corporation":"RF","Republic Services":"RSG","ResMed":"RMD","Revvity":"RVTY","Robinhood Markets":"HOOD","Rockwell Automation":"ROK","Rollins":"ROL","Rollins, Inc.":"ROL","Roper Technologies":"ROP","Roper":"ROP","Ross Stores":"ROST","Royal Caribbean Group":"RCL","Royal Caribbean":"RCL","S&P Global":"SPGI","Salesforce":"CRM","Sandisk":"SNDK","SBA Communications":"SBAC","Schlumberger":"SLB","Seagate Technology":"STX","Sempra":"SRE","ServiceNow":"NOW","Sherwin-Williams":"SHW","Simon Property Group":"SPG","Simon Property":"SPG","Skyworks Solutions":"SWKS","J.M. Smucker":"SJM","J.M. Smucker Company (The)":"SJM","Smurfit Westrock":"SW","Snap-on":"SNA","Solventum":"SOLV","Southern Company":"SO","Southwest Airlines":"LUV","Stanley Black & Decker":"SWK","Starbucks":"SBUX","State Street Corporation":"STT","State Street":"STT","Steel Dynamics":"STLD","Steris":"STE","Stryker":"SYK","Stryker Corporation":"SYK","Supermicro":"SMCI","Synchrony Financial":"SYF","Synopsys":"SNPS","Sysco":"SYY","T-Mobile US":"TMUS","T. Rowe Price":"TROW","Take-Two Interactive":"TTWO","Tapestry, Inc.":"TPR","Tapestry":"TPR","Targa Resources":"TRGP","Target Corporation":"TGT","TE Connectivity":"TEL","Teledyne":"TDY","Teledyne Technologies":"TDY","Teradyne":"TER","Tesla, Inc.":"TSLA","Tesla":"TSLA","Texas Instruments":"TXN","Texas Pacific Land":"TPL","Texas Pacific Land Corporation":"TPL","Textron":"TXT","Thermo Fisher Scientific":"TMO","TJX Companies":"TJX","TJX":"TJX","TKO":"TKO","TKO Group Holdings":"TKO","Tractor Supply":"TSCO","Trane Technologies":"TT","TransDigm Group":"TDG","TransDigm":"TDG","Travelers Companies (The)":"TRV","Travelers":"TRV","Trimble":"TRMB","Trimble Inc.":"TRMB","Truist":"TFC","Truist Financial":"TFC","Tyler Technologies":"TYL","Tyson Foods":"TSN","U.S. Bancorp":"USB","Uber":"UBER","UDR":"UDR","UDR, Inc.":"UDR","Ulta Beauty":"ULTA","Union Pacific Corporation":"UNP","Union Pacific":"UNP","United Airlines Holdings":"UAL","United Airlines":"UAL","United Parcel Service":"UPS","United Rentals":"URI","UnitedHealth":"UNH","UnitedHealth Group":"UNH","Universal Health Services":"UHS","Valero Energy":"VLO","Veeva":"VEEV","Veeva Systems":"VEEV","Ventas":"VTR","Veralto":"VLTO","Verisign":"VRSN","Verisk Analytics":"VRSK","Verizon":"VZ","Vertex Pharmaceuticals":"VRTX","Vertiv":"VRT","Viatris":"VTRS","Vici Properties":"VICI","Visa Inc.":"V","Vistra":"VST","Vistra Corp.":"VST","Vivmark Residential":"VMRK","Vulcan Materials":"VMC","Vulcan Materials Company":"VMC","W. R. Berkley Corporation":"WRB","W. R. Berkley":"WRB","W. W. Grainger":"GWW","Wabtec":"WAB","Walmart":"WMT","Walt Disney Company (The)":"DIS","Walt Disney":"DIS","Warner Bros. Discovery":"WBD","Waste Management":"WM","Waters Corporation":"WAT","WEC Energy":"WEC","WEC Energy Group":"WEC","Wells Fargo":"WFC","Welltower":"WELL","West Pharmaceutical":"WST","West Pharmaceutical Services":"WST","Western Digital":"WDC","Weyerhaeuser":"WY","Williams-Sonoma":"WSM","Williams-Sonoma, Inc.":"WSM","Williams Companies":"WMB","Willis Towers Watson":"WTW","Workday, Inc.":"WDAY","Workday":"WDAY","Wynn Resorts":"WYNN","Xcel Energy":"XEL","Xylem":"XYL","Xylem Inc.":"XYL","Yum! Brands":"YUM","Yum!":"YUM","Zebra":"ZBRA","Zebra Technologies":"ZBRA","Zimmer Biomet":"ZBH","Zoetis":"ZTS","Google":"GOOGL","YouTube":"GOOGL","Facebook":"META","Instagram":"META","WhatsApp":"META","Meta":"META","Lilly":"LLY","General Electric":"GE","Exxon":"XOM","Lockheed":"LMT","Raytheon":"RTX","Coke":"KO","Disney":"DIS","J&J":"JNJ","JPMorgan":"JPM","Chase":"JPM","Goldman":"GS","Citi":"C","Citibank":"C","Berkshire":"BRK.B","Northrop":"NOC","Ford":"F","GM":"GM","AMD":"AMD","Occidental":"OXY","John Deere":"DE","NBC":"CMCSA","MSNBC":"CMCSA","CNN":"WBD","Warner Bros":"WBD","ABC":"DIS","CBS":"PSKY","Paramount":"PSKY","Robinhood":"HOOD","CVS":"CVS","UPS":"UPS","Super Micro":"SMCI","Visa Inc":"V","Fox News":"FOXA","Fox Corporation":"FOXA","Dow Inc":"DOW"},"party":{"cantwell|WA|S":"D","klobuchar|MN|S":"D","sanders|VT|S":"I","whitehouse|RI|S":"D","barrasso|WY|S":"R","wicker|MS|S":"R","collins|ME|S":"R","cornyn|TX|S":"R","durbin|IL|S":"D","mcconnell|KY|S":"R","merkley|OR|S":"D","reed|RI|S":"D","risch|ID|S":"R","shaheen|NH|S":"D","warner|VA|S":"D","gillibrand|NY|S":"D","coons|DE|S":"D","aderholt|AL|4":"R","baldwin|WI|S":"D","bennet|CO|S":"D","bilirakis|FL|12":"R","bishop|GA|2":"D","blackburn|TN|S":"R","blumenthal|CT|S":"D","boozman|AR|S":"R","buchanan|FL|16":"R","calvert|CA|41":"R","capito|WV|S":"R","carson|IN|7":"D","carter|TX|31":"R","cassidy|LA|S":"R","castor|FL|14":"D","chu|CA|28":"D","clarke|NY|9":"D","cleaver|MO|5":"D","clyburn|SC|6":"D","cohen|TN|9":"D","cole|OK|4":"R","costa|CA|21":"D","courtney|CT|2":"D","crapo|ID|S":"R","crawford|AR|1":"R","cuellar|TX|28":"D","davis|IL|7":"D","degette|CO|1":"D","delauro|CT|3":"D","desjarlais|TN|4":"R","diaz balart|FL|26":"R","doggett|TX|37":"D","fleischmann|TN|3":"R","foxx|NC|5":"R","garamendi|CA|8":"D","gosar|AZ|9":"R","grassley|IA|S":"R","graves|MO|6":"R","green|TX|9":"D","griffith|VA|9":"R","guthrie|KY|2":"R","harris|MD|1":"R","heinrich|NM|S":"D","himes|CT|4":"D","hirono|HI|S":"D","hoeven|ND|S":"R","hoyer|MD|5":"D","huizenga|MI|4":"R","johnson|GA|4":"D","johnson|WI|S":"R","jordan|OH|4":"R","kaptur|OH|9":"D","keating|MA|9":"D","kelly|PA|16":"R","lankford|OK|S":"R","larsen|WA|2":"D","larson|CT|1":"D","latta|OH|5":"R","lee|UT|S":"R","lofgren|CA|18":"D","lucas|OK|3":"R","lujan|NM|S":"D","lynch|MA|8":"D","markey|MA|S":"D","matsui|CA|7":"D","mccaul|TX|10":"R","mcclintock|CA|5":"R","mccollum|MN|4":"D","mcgovern|MA|2":"D","meeks|NY|5":"D","moore|WI|4":"D","moran|KS|S":"R","murkowski|AK|S":"R","murphy|CT|S":"D","murray|WA|S":"D","nadler|NY|12":"D","neal|MA|1":"D","norton|DC|0":"D","pallone|NJ|6":"D","paul|KY|S":"R","pelosi|CA|11":"D","peters|MI|S":"D","pingree|ME|1":"D","quigley|IL|5":"D","rogers|KY|5":"R","rogers|AL|3":"R","scalise|LA|1":"R","schakowsky|IL|9":"D","schiff|CA|S":"D","schumer|NY|S":"D","schweikert|AZ|1":"R","scott|GA|8":"R","scott|VA|3":"D","scott|SC|S":"R","sewell|AL|7":"D","sherman|CA|32":"D","simpson|ID|2":"R","smith|WA|9":"D","smith|NE|3":"R","smith|NJ|4":"R","sanchez|CA|38":"D","thompson|MS|2":"D","thompson|CA|4":"D","thompson|PA|15":"R","thune|SD|S":"R","tonko|NY|20":"D","turner|OH|10":"R","van hollen|MD|S":"D","velazquez|NY|7":"D","walberg|MI|5":"R","wasserman schultz|FL|25":"D","waters|CA|43":"D","webster|FL|11":"R","welch|VT|S":"D","wilson|SC|2":"R","wilson|FL|24":"D","wittman|VA|1":"R","womack|AR|3":"R","wyden|OR|S":"D","young|IN|S":"R","amodei|NV|2":"R","bonamici|OR|1":"D","delbene|WA|1":"D","massie|KY|4":"R","schatz|HI|S":"D","foster|IL|11":"D","titus|NV|1":"D","cotton|AR|S":"R","huffman|CA|2":"D","bera|CA|6":"D","brownley|CA|26":"D","ruiz|CA|25":"D","takano|CA|39":"D","vargas|CA|52":"D","peters|CA|50":"D","frankel|FL|22":"D","duckworth|IL|S":"D","barr|KY|6":"R","warren|MA|S":"D","king|ME|S":"I","wagner|MO|2":"R","daines|MT|S":"R","hudson|NC|9":"R","cramer|ND|S":"R","fischer|NE|S":"R","meng|NY|6":"D","jeffries|NY|8":"D","beatty|OH|3":"D","joyce|OH|14":"R","perry|PA|10":"R","cruz|TX|S":"R","weber|TX|14":"R","castro|TX|20":"D","williams|TX|25":"R","veasey|TX|33":"D","kaine|VA|S":"D","pocan|WI|2":"D","kelly|IL|2":"D","smith|MO|8":"R","booker|NJ|S":"D","clark|MA|5":"D","norcross|NJ|1":"D","adams|NC|12":"D","palmer|AL|6":"R","hill|AR|2":"R","westerman|AR|4":"R","gallego|AZ|S":"D","desaulnier|CA|10":"D","aguilar|CA|33":"D","lieu|CA|36":"D","torres|CA|35":"D","carter|GA|1":"R","loudermilk|GA|11":"R","allen|GA|12":"R","bost|IL|12":"R","moulton|MA|6":"D","moolenaar|MI|2":"R","dingell|MI|6":"D","emmer|MN|6":"R","rouzer|NC|7":"R","watson coleman|NJ|12":"D","stefanik|NY|21":"R","boyle|PA|2":"D","babin|TX|36":"R","beyer|VA|8":"D","plaskett|VI|0":"D","newhouse|WA|4":"R","grothman|WI|6":"R","radewagen|AS|0":"R","sullivan|AK|S":"R","ernst|IA|S":"R","tillis|NC|S":"R","rounds|SD|S":"R","kelly|MS|1":"R","lahood|IL|16":"R","davidson|OH|8":"R","comer|KY|1":"R","evans|PA|3":"D","kennedy|LA|S":"R","hassan|NH|S":"D","cortez masto|NV|S":"D","schneider|IL|10":"D","biggs|AZ|5":"R","khanna|CA|17":"D","panetta|CA|19":"D","carbajal|CA|24":"D","barragan|CA|44":"D","correa|CA|46":"D","blunt rochester|DE|S":"D","dunn|FL|2":"R","rutherford|FL|5":"R","soto|FL|9":"D","mast|FL|21":"R","krishnamoorthi|IL|8":"D","banks|IN|S":"R","marshall|KS|S":"R","higgins|LA|3":"R","johnson|LA|4":"R","raskin|MD|8":"D","bergman|MI|1":"R","budd|NC|S":"R","bacon|NE|2":"R","gottheimer|NJ|5":"D","rosen|NV|S":"D","espaillat|NY|13":"D","fitzpatrick|PA|1":"R","smucker|PA|11":"R","kustoff|TN|8":"R","gonzalez|TX|34":"D","arrington|TX|19":"R","jayapal|WA|7":"D","estes|KS|4":"R","norman|SC|5":"R","gomez|CA|34":"D","curtis|UT|S":"R","smith|MN|S":"D","hyde smith|MS|S":"R","cloud|TX|27":"R","balderson|OH|12":"R","hern|OK|1":"R","morelle|NY|25":"D","scanlon|PA|5":"D","case|HI|1":"D","horsford|NV|4":"D","stanton|AZ|4":"D","harder|CA|9":"D","levin|CA|49":"D","neguse|CO|2":"D","crow|CO|6":"D","hayes|CT|5":"D","steube|FL|17":"R","mcbath|GA|6":"D","fulcher|ID|1":"R","garcia|IL|4":"D","casten|IL|6":"D","underwood|IL|14":"D","baird|IN|4":"R","davids|KS|3":"D","trahan|MA|3":"D","pressley|MA|7":"D","slotkin|MI|S":"D","stevens|MI|11":"D","tlaib|MI|12":"D","craig|MN|2":"D","omar|MN|5":"D","stauber|MN|8":"R","guest|MS|3":"R","pappas|NH|1":"D","van drew|NJ|2":"R","kim|NJ|S":"D","lee|NV|3":"D","ocasio cortez|NY|14":"D","dean|PA|4":"D","houlahan|PA|6":"D","meuser|PA|9":"R","joyce|PA|13":"R","reschenthaler|PA|14":"R","timmons|SC|4":"R","johnson|SD|0":"R","burchett|TN|2":"R","rose|TN|6":"R","crenshaw|TX|2":"R","gooden|TX|5":"R","fletcher|TX|7":"D","escobar|TX|16":"D","roy|TX|21":"R","garcia|TX|29":"D","cline|VA|6":"R","schrier|WA|8":"D","steil|WI|1":"R","miller|WV|1":"R","scott|FL|S":"R","hawley|MO|S":"R","golden|ME|2":"D","murphy|NC|3":"R","mfume|MD|7":"D","tiffany|WI|7":"R","kelly|AZ|S":"D","lummis|WY|S":"R","issa|CA|48":"R","sessions|TX|17":"R","valadao|CA|22":"R","tuberville|AL|S":"R","hickenlooper|CO|S":"D","hagerty|TN|S":"R","moore|AL|1":"R","obernolte|CA|23":"R","kim|CA|40":"R","jacobs|CA|51":"D","boebert|CO|4":"R","cammack|FL|3":"R","franklin|FL|18":"R","donalds|FL|19":"R","gimenez|FL|28":"R","salazar|FL|27":"R","williams|GA|5":"D","clyde|GA|9":"R","hinson|IA|2":"R","miller meeks|IA|1":"R","feenstra|IA|4":"R","miller|IL|15":"R","mrvan|IN|1":"D","spartz|IN|5":"R","mann|KS|1":"R","auchincloss|MA|4":"D","mcclain|MI|9":"R","fischbach|MN|7":"R","ross|NC|2":"D","leger fernandez|NM|3":"D","garbarino|NY|2":"R","malliotakis|NY|11":"R","torres|NY|15":"D","bice|OK|5":"R","bentz|OR|2":"R","mace|SC|1":"R","harshbarger|TN|1":"R","fallon|TX|4":"R","pfluger|TX|11":"R","jackson|TX|13":"R","nehls|TX|22":"R","van duyne|TX|24":"R","moore|UT|1":"R","owens|UT|4":"R","strickland|WA|10":"D","fitzgerald|WI|5":"R","padilla|CA|S":"D","ossoff|GA|S":"D","warnock|GA|S":"D","tenney|NY|24":"R","letlow|LA|5":"R","carter|LA|2":"D","stansbury|NM|1":"D","ellzey|TX|6":"R","brown|OH|11":"D","carey|OH|15":"R","flood|NE|1":"R","finstad|MN|1":"R","ryan|NY|18":"D","yakym|IN|2":"R","zinke|MT|1":"R","britt|AL|S":"R","schmitt|MO|S":"R","fetterman|PA|S":"D","strong|AL|5":"R","crane|AZ|2":"R","ciscomani|AZ|6":"R","kiley|CA|3":"I","mullin|CA|15":"D","kamlager dove|CA|37":"D","garcia|CA|42":"D","pettersen|CO|7":"D","bean|FL|4":"R","mills|FL|7":"R","frost|FL|10":"D","luna|FL|13":"R","lee|FL|15":"R","moskowitz|FL|23":"D","mccormick|GA|7":"R","collins|GA|10":"R","moylan|GU|0":"R","tokuda|HI|2":"D","nunn|IA|3":"R","jackson|IL|1":"D","ramirez|IL|3":"D","budzinski|IL|13":"D","sorensen|IL|17":"D","houchin|IN|9":"R","mcgarvey|KY|3":"D","ivey|MD|4":"D","scholten|MI|3":"D","james|MI|10":"R","thanedar|MI|13":"D","alford|MO|4":"R","burlison|MO|7":"R","ezell|MS|4":"R","davis|NC|1":"D","foushee|NC|4":"D","edwards|NC|11":"R","kean|NJ|7":"R","menendez|NJ|8":"D","vasquez|NM|2":"D","lalota|NY|1":"R","goldman|NY|10":"D","lawler|NY|17":"R","langworthy|NY|23":"R","landsman|OH|1":"D","miller|OH|7":"R","sykes|OH|13":"D","brecheen|OK|2":"R","hoyle|OR|4":"D","salinas|OR|6":"D","lee|PA|12":"D","deluzio|PA|17":"D","magaziner|RI|2":"D","fry|SC|7":"R","ogles|TN|5":"R","moran|TX|1":"R","self|TX|3":"R","luttrell|TX|8":"R","de la cruz|TX|15":"R","crockett|TX|30":"D","casar|TX|35":"D","hunt|TX|38":"R","kiggans|VA|2":"R","balint|VT|0":"D","gluesenkamp perez|WA|3":"D","van orden|WI|3":"R","hageman|WY|0":"R","ricketts|NE|S":"R","mcclellan|VA|4":"D","amo|RI|1":"D","maloy|UT|2":"R","suozzi|NY|3":"D","kennedy|NY|26":"D","fong|CA|20":"R","rulli|OH|6":"R","mciver|NJ|10":"D","wied|WI|8":"R","fields|LA|6":"D","stutzman|IN|3":"R","cisneros|CA|31":"D","alsobrooks|MD|S":"D","sheehy|MT|S":"R","moreno|OH|S":"R","mccormick|PA|S":"R","begich|AK|0":"R","figures|AL|2":"D","ansari|AZ|3":"D","hamadeh|AZ|8":"R","simon|CA|12":"D","gray|CA|13":"D","liccardo|CA|16":"D","whitesides|CA|27":"D","rivas|CA|29":"D","friedman|CA|30":"D","tran|CA|45":"D","min|CA|47":"D","hurd|CO|3":"R","crank|CO|5":"R","evans|CO|8":"R","mcbride|DE|0":"D","haridopolos|FL|8":"R","jack|GA|3":"R","shreve|IN|6":"R","messmer|IN|8":"R","schmidt|KS|2":"R","olszewski|MD|2":"D","elfreth|MD|3":"D","mcclain delaney|MD|6":"D","barrett|MI|7":"R","mcdonald rivet|MI|8":"D","morrison|MN|3":"D","bell|MO|1":"D","onder|MO|3":"R","king hinds|MP|0":"R","downing|MT|2":"R","mcdowell|NC|6":"R","harris|NC|8":"R","harrigan|NC|10":"R","knott|NC|13":"R","moore|NC|14":"R","fedorchak|ND|0":"R","goodlander|NH|2":"D","conaway|NJ|3":"D","pou|NJ|9":"D","gillen|NY|4":"D","latimer|NY|16":"D","riley|NY|19":"D","mannion|NY|22":"D","taylor|OH|2":"R","dexter|OR|3":"D","bynum|OR|5":"D","mackenzie|PA|7":"R","bresnahan|PA|8":"R","hernandez rivera|PR|0":"D","biggs|SC|3":"R","goldman|TX|12":"R","gill|TX|26":"R","johnson|TX|32":"D","kennedy|UT|3":"R","mcguire|VA|5":"R","vindman|VA|7":"D","subramanyam|VA|10":"D","baumgartner|WA|5":"R","randall|WA|6":"D","moore|WV|2":"R","justice|WV|S":"R","husted|OH|S":"R","moody|FL|S":"R","patronis|FL|1":"R","fine|FL|6":"R","walkinshaw|VA|11":"D","grijalva|AZ|7":"D","van epps|TN|7":"R","menefee|TX|18":"D","armstrong|OK|S":"R","fuller|GA|14":"R","mejia|NJ|11":"D","gallagher|CA|1":"R","graham nordone|SC|S":"R","blair|GA|13":"D","wahab|CA|14":"D"}};
// END GENERATED DATA
