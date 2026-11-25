// The orange film's cast and flat props, take by take (Niihau card method: one design per person, light painted onto
// each card by the look). Positions are in the set's own coordinates; stage() adds the set origin.
import * as THREE from "three";
import { Pen, bodyFront, fxStars, fxBurst, fxSmoke, Outfit, Expr, FrontOpts, INK } from "../film/toon";
import { Stage, CamInfo, Place, tier, light2D, lidAt, blob, fkey, q } from "../film/cards";
import { takeAt, W, L, TRAVELLER_PATH, smooth, TOTAL } from "./story";
import { camelDraw, swatchDraw, paintPot, appleDraw, bubbleDraw, glowDraw, letterDraw, signAdv, nailDraw } from "./sets";

const SK = "#fff8f0";
const TRAVELLER: Outfit = { jacket: "#f0a23a", pants: "#f4efe2", boots: "#7a4a2a", hat: "turban", cap: "#f6f1e4", hatband: "#f2861e", skin: SK, moustache: "#2f211c", buttons: "#f6f1e4" };
const SCHOLAR: Outfit = { jacket: "#f4efe2", pants: "#f4efe2", boots: "#8a5a34", hat: "hair", hair: "#d8d4cc", moustache: "#d8d4cc", skin: SK, sash: "#d9822a", plain: true };
const PAINTER: Outfit = { jacket: "#2f7a8a", pants: "#4a4a52", boots: "#5a3a24", hat: "turban", cap: "#e8d6a8", hatband: "#2f7a8a", skin: SK, moustache: "#3a2a22" };
const TRADER: Outfit = { jacket: "#8a3b4a", pants: "#4a3f52", boots: "#5a3a24", hat: "turban", cap: "#3f6aa8", skin: SK };
const MERCHANT: Outfit = { jacket: "#f4f1ea", pants: "#e8e2d4", boots: "#7a5a3a", hat: "turban", cap: "#f6f4ee", hatband: "#c2352c", skin: SK, moustache: "#2f211c" };
const SAILOR: Outfit = { jacket: "#f6f2e8", stripes: "#2f5ea8", pants: "#4d6d9a", boots: "#4a3426", hat: "cap", cap: "#c2352c", skin: SK };
const DOCKER: Outfit = { jacket: "#c9a46a", pants: "#5d5348", boots: "#4a3426", hat: "hair", hair: "#2f211c", skin: SK };
const TOWNM: Outfit = { jacket: "#3f6aa8", pants: "#5d5348", boots: "#3a2a22", hat: "hair", hair: "#6a4a2a", skin: SK, buttons: "#e8eef4" };
const TOWNW: Outfit = { jacket: "#c84a3c", dress: "#c84a3c", print: "#fbe6a8", pants: "#3b3f52", boots: "#5a3a24", hat: "bonnet", hair: "#5a3b2a", skin: SK };
const KID: Outfit = { jacket: "#f6f2e8", stripes: "#2f8a5a", pants: "#4d6d9a", boots: "#fdebd8", hat: "hair", hair: "#5a3b2a", build: "kid", skin: SK, plain: true };
const SELLERC: Outfit = { jacket: "#3f6aa8", pants: "#2f3a52", boots: "#2a2a30", hat: "hair", hair: "#1f1a1c", skin: SK, buttons: "#e8c45a" };
const DUTCHW: Outfit = { jacket: "#3f6aa8", dress: "#3f6aa8", print: "#f6f2ea", pants: "#3b3f52", boots: "#7a5a3a", hat: "bonnet", hair: "#c9a24a", skin: SK };
const DUTCHM: Outfit = { jacket: "#2a2a34", pants: "#2a2a34", boots: "#2a2a30", hat: "hair", hair: "#c9a24a", skin: SK, buttons: "#d9b24a" };
const FRUITER: Outfit = { jacket: "#f4efe2", pants: "#f4efe2", boots: "#7a4a2a", hat: "turban", cap: "#e8822a", hatband: "#c2352c", skin: SK, moustache: "#2f211c", sash: "#2f7a8a" };
const CROWD: Outfit[] = [TOWNM, TOWNW, { ...TOWNM, jacket: "#6a8a3a", hair: "#2f211c" }, { ...TOWNW, jacket: "#7a5aa8", dress: "#7a5aa8" }, { ...TOWNM, jacket: "#a8683a", hair: "#c9a24a" }];

type Ctx = { cam: CamInfo; out: Stage; f: number; rf: number; o: [number, number, number] };
type Extra = { s?: number; mirror?: boolean; roll?: number; noBlob?: boolean; y?: number };
const P = (c: Ctx, okey: string, o: Outfit, seed: number, x: number, z: number, fo0: FrontOpts, e: Extra = {}) => {
  const X = x + c.o[0], Z = z + c.o[2], scale = e.s ?? 1, y = e.y ?? 0, d = c.cam.pos.distanceTo(new THREE.Vector3(X, y + 1.2, Z)) / scale, [w, h, k] = tier(d);
  const fo = { ...fo0, light: light2D(c.cam, !!e.mirror), seed };
  const pl: Place = { key: `F|${okey}|${fkey(fo)}`, x: X, y, z: Z, scale, mirror: e.mirror, roll: e.roll, size: [w, h, k], draw: (p: Pen) => bodyFront(p, o, fo) };
  c.out.places.push(pl);
  if (!e.noBlob) blob(c.out, c.cam.sun, X, 0, Z, scale, 0.9);
};
const card = (c: Ctx, key: string, cw: number, ch: number, draw: (p: Pen) => void, x: number, y: number, z: number, w: number, o: { flat?: boolean; rot?: number; tint?: number; soft?: boolean; alpha?: number } = {}) =>
  c.out.fx.push({ key, cw, ch, draw, x: x + c.o[0], y, z: z + c.o[2], w, h: (Math.abs(w) * ch) / cw, tint: 1, ...o });
const stand = (expr: Expr, o: Partial<FrontOpts> = {}): FrontOpts => ({ mode: "stand", expr, ...o });
const walk = (expr: Expr, phase: number, o: Partial<FrontOpts> = {}): FrontOpts => ({ mode: "stroll", expr, phase, ...o });
const sparkle = (c: Ctx, x: number, y: number, z: number, f0: number, s = 0.5) => { if (c.f >= f0 && c.f < f0 + 10) { const u = q((c.f - f0) / 10, 10); card(c, `spark${u}`, 500, 500, (p) => fxBurst(p, u, "#fff3b0", 8, 20, 150), x, y, z, s, { tint: 1.6 }); } };

// ---------------- takes ----------------
const hook = (c: Ctx) => { // he walks out of the orchard holding a glowing orange; the NARANGA sign on the post at the edge
  const f = c.f, t = TRAVELLER_PATH(f), u = smooth((f - 6) / 120), ph = (c.rf / 18) % 1;
  P(c, "trav", TRAVELLER, 4, t[0], t[2], u < 1 ? walk("grin", ph, { facing: 1, look: 0.4, prop: "orange", blink: lidAt(f, 7) }) : stand("grin", { prop: "orange", blink: lidAt(f, 7) }), {});
  card(c, "glow", 256, 256, glowDraw, t[0] + 0.62, 1.42, t[2] + 0.05, 0.9 * (1 + 0.06 * Math.sin(c.rf * 0.3)), { soft: true, alpha: 0.85, tint: 1.4 });
};
const india = (c: Ctx) => { // the scholar with his palm-leaf manuscript reads the name off it; the traveller listens
  const f = c.f, read = f >= W.sanskrit - 4;
  P(c, "scholar", SCHOLAR, 10, -0.7, -0.4, stand(read ? "smile" : "neutral", { facing: 1, look: 1, prop: "scroll", blink: lidAt(f, 11) }), {});
  P(c, "trav", TRAVELLER, 4, 1.0, 0.2, stand("grin", { facing: -1, look: -1, prop: "orange", blink: lidAt(f, 7) }), { mirror: true });
  card(c, "glow", 256, 256, glowDraw, 0.45, 1.42, 0.25, 0.8, { soft: true, alpha: 0.75, tint: 1.3 });
  sparkle(c, 1.9, 2.4, -1.2, W.naranga, 0.7);
};
const persia = (c: Ctx) => { // the caravan arrives; a painter rewrites the sign, then mixes the new colour
  const f = c.f;
  [[-6.5, -2.6, 0], [-3.8, -3.2, 1]].forEach(([x, z, i]) => { const dx = Math.min(1.6, (f - L[2]) * 0.012); card(c, `camel${Math.floor(c.rf / 6) % 2}`, 600, 500, camelDraw(Math.floor(c.rf / 6) + i), x + dx, 1.05, z, 2.6, { tint: 0.98 }); });
  P(c, "trader", TRADER, 21, -2.4 + Math.min(1.2, (f - L[2]) * 0.01), -1.6, walk("smile", (c.rf / 18) % 1, { facing: 1, look: 1 }), {});
  const paint = f >= W.narang2 - 14 && f < W.narang2 + 2, mixC = f >= W.named - 2;
  P(c, "painter", PAINTER, 22, 2.9, -0.4, stand(mixC ? "grin" : "smile", { facing: mixC ? 1 : -1, look: mixC ? 1 : -1, prop: "brush", wave: paint ? -0.7 : undefined, raise: paint ? 0.9 : undefined, blink: lidAt(f, 23) }), { mirror: !mixC });
  card(c, "pot", 300, 300, paintPot, 3.4, 0.16, -0.2, 0.34, { tint: 1.0 });
  const k = smooth((f - W.color) / 14); card(c, `swatch${q(k, 10)}`, 400, 500, swatchDraw(q(k, 10)), 4.08, 1.42, -0.86, 0.9, { tint: 1.0 });
};
const arab = (c: Ctx) => { // the merchant cannot say the g; the sign flips to NARANJ
  const f = c.f, tryG = f >= W.nog - 4 && f < W.became, done = f >= W.naranj;
  P(c, "merchant", MERCHANT, 31, 0.9, -0.5, stand(tryG ? "hesitant" : done ? "grin" : "smile", { facing: -1, look: -1, lookY: tryG ? 0.5 : 0, wave: tryG ? -0.6 : undefined, raise: tryG ? 0.6 : undefined, blink: lidAt(f, 31) }), { mirror: true });
  if (tryG) card(c, "bubbleG", 600, 340, bubbleDraw("g ?", 600), 1.5, 2.85, -0.4, 1.0, { tint: 1.0 });
  P(c, "kidA", KID, 32, -0.2, 0.4, stand(done ? "laugh" : "smile", { facing: 1, look: 1 }), { s: 0.8 });
  sparkle(c, -1.6, 2.4, -1.0, W.naranj, 0.8);
};
const quay = (c: Ctx) => { // Portugal: sailors unload crates by the caravel under the LARANJA sign
  const f = c.f;
  P(c, "sailor", SAILOR, 41, 1.8, -1.0, stand("grin", { facing: -1, look: -1, prop: "orange", blink: lidAt(f, 41) }), { mirror: true });
  P(c, "docker", DOCKER, 42, -1.2, -0.6, stand("smile", { facing: 1, look: 1, blink: lidAt(f, 42) }), {});
  sparkle(c, 0.6, 2.4, -1.4, W.laranja, 0.8);
};
const europe = (c: Ctx) => { // A NARANGE: the N falls off its word with a clink and lands beside the A: AN ORANGE
  const f = c.f, n = 9, adv = signAdv(n), bw = 2.7, slot = (i: number) => (adv * (i - (n - 1) / 2) / 1400) * bw, by = 2.75 - 0.45 - (bw * 420 / 1400) / 2 + 2.75 - 2.75;
  const boardY = 2.75 + (bw * 420 / 1400) / 2 + 0.45 - 0.45 - (bw * 420 / 1400) / 2; // centre of the board (hangingSign: top bar at y + h/2 + .45, board centre at top - .45 - h/2)
  void by;
  if (f >= W.theN && f < W.fell + 4) { // pop up, arc one slot left, drop
    const u = Math.min(1, (f - W.theN) / (W.fell + 4 - W.theN)), x = slot(2) + (slot(1) - slot(2)) * smooth(u), y = boardY + 0.04 + 0.55 * Math.sin(Math.PI * u) - 0.05 * u;
    card(c, "letterN", 256, 256, letterDraw("N", n), x, y, -1.0 + 0.05, 0.46, { rot: 0.5 * Math.sin(u * 9) * (1 - u), tint: 1.0 });
  }
  const land = W.fell + 4; if (f >= land && f < land + 8) { const u = q((f - land) / 8, 8); card(c, `clink${u}`, 500, 500, (p) => fxBurst(p, u, "#fff3b0", 8, 20, 150), slot(1), boardY - 0.12, -0.9, 0.42, { tint: 1.5 }); }
  if (f >= land && f < land + 16) card(c, "nail", 120, 240, nailDraw, slot(2) + 0.02, boardY + 0.15 - 2.2 * ((f - land) / 16) ** 2, -0.85, 0.08, { rot: (f - land) * 0.6 }); // a nail drops out of the N's old place
  const look = f >= W.theN;
  P(c, "townW", TOWNW, 51, -2.2, 0.2, stand(look ? "shock" : "smile", { facing: 1, look: 1, lookY: look ? 0.7 : 0.3, blink: lidAt(f, 51) }), { s: 0.98 });
  P(c, "townM", TOWNM, 52, 2.0, 0.4, stand(f >= land ? "laugh" : "neutral", { facing: -1, look: -1, lookY: 0.6, blink: lidAt(f, 52) }), { mirror: true });
  P(c, "kidE", KID, 53, -1.1, 0.9, stand(f >= land ? "laugh" : "grin", { facing: 1, look: 1, lookY: 0.8, wave: f >= land ? q(Math.sin(c.rf * 0.6), 12) : undefined }), { s: 0.78 });
};
const china = (c: Ctx) => { // a sailor bites a sweet orange and his eyes light up
  const f = c.f, bite = f >= W.eat - 6;
  P(c, "seller", SELLERC, 61, -1.2, -0.5, stand("smile", { facing: 1, look: 1, blink: lidAt(f, 61) }), {});
  P(c, "sailorC", SAILOR, 41, 0.6, -0.2, stand(bite ? "wow" : "smile", { facing: -1, look: -1, prop: "orange", bite: false, blink: bite ? 0 : lidAt(f, 41) }), { mirror: true });
  if (bite) { const u = q(((c.rf - W.eat) / 24) % 1, 24); card(c, `stars${u}`, 420, 210, (p) => fxStars(p, u), 0.6, 2.25, -0.1, 0.8, { tint: 1.2 }); }
  sparkle(c, 0.15, 1.6, 0.0, W.sweeter, 0.6);
};
const sintra = (c: Ctx) => { // the town sign, the cart of oranges; on "crazy" the crowd rushes the cart
  const f = c.f, rush = smooth((f - (W.europe6 - 4)) / 22);
  P(c, "farmer", DOCKER, 71, -1.0, -1.2, stand(f >= W.crazy ? "shock" : "grin", { facing: 1, look: 1, blink: lidAt(f, 71) }), {});
  CROWD.forEach((o, i) => { const x0 = 9 + i * 1.6, x1 = 1.4 + i * 0.75, z = 0.3 - (i % 3) * 0.7; const x = x0 + (x1 - x0) * rush;
    P(c, `crowd${i}`, o, 72 + i, x, z, rush > 0 && rush < 1 ? walk("cheer", ((c.rf + i * 5) / 10) % 1, { facing: -1, look: -1 }) : stand(rush >= 1 ? "cheer" : "smile", { facing: -1, look: -1, wave: rush >= 1 ? q(Math.sin(c.rf * 0.5 + i), 12) : undefined }), { mirror: true, s: o === KID ? 0.78 : 1 }); });
};
const dutch = (c: Ctx) => { // SINAASAPPEL = "China's apple": the seller holds up the orange with its little flag sticker
  const f = c.f;
  P(c, "dutchW", DUTCHW, 81, -0.9, -0.5, stand("smile", { facing: 1, look: 1, blink: lidAt(f, 81) }), {});
  P(c, "dutchM", DUTCHM, 82, 1.9, -0.3, stand(f >= W.apple - 6 ? "laugh" : "smile", { facing: -1, look: -1, blink: lidAt(f, 82) }), { mirror: true });
  card(c, "apple", 400, 400, appleDraw, 0.55, 1.4, -1.1, 0.8, { tint: 1.0 });
};
const port = (c: Ctx) => { // the ship, the crate LARANJA DE SINTRA, the fruit seller whispering Sintra faster and faster, SANTRA!
  const f = c.f, wh = f >= W.say - 4 && f < W.santra, sa = f >= W.santra;
  P(c, "sailorP", SAILOR, 41, 3.4, -1.6, stand(sa ? "laugh" : "smile", { facing: -1, look: -1, blink: lidAt(f, 41) }), { mirror: true });
  // the seller's mouth works faster and faster through "Sintra, Sintra, Sintra..."
  let ex: Expr = sa ? "cheer" : "smile";
  if (wh) { const k = (f - W.say) / (W.santra - W.say), per = Math.max(2, Math.round(7 - 5 * k)); ex = Math.floor((f - W.say) / per) % 2 ? "wow" : "smile_closed"; }
  P(c, "fruiter", FRUITER, 91, -0.35, -0.3, stand(ex, { facing: 1, look: wh ? 0 : 1, wave: sa ? 1 : undefined, waveL: sa ? -1 : undefined, blink: wh ? 0 : lidAt(f, 91) }), {});
  if (wh) { const k = Math.min(1, (f - W.sintraW) / (W.fast - W.sintraW)), n = 1 + Math.min(2, Math.floor(k * 3)), s = Array(n).fill("Sintra").join(" "); const cw = 300 + 330 * n; card(c, `bub${n}`, cw, 340, bubbleDraw(s, cw), 0.45, 2.75, -0.2, (cw / 1000) * 1.45, { tint: 1.0, alpha: 1 }); }
  if (sa && f < W.santra + 12) { const u = q((f - W.santra) / 12, 12); card(c, `pop${u}`, 500, 500, (p) => fxBurst(p, u, "#ffe27a", 12, 30, 220), -1.5, 2.55, -1.5, 3.0, { tint: 1.6 }); card(c, `pop2${u}`, 500, 500, (p) => fxBurst(p, u, "#fff3b0", 10, 20, 180), 0.2, 1.3, -1.2, 1.6, { tint: 1.5 }); }
  P(c, "kidP", KID, 92, 1.0, 0.6, stand(sa ? "laugh" : "smile", { facing: -1, look: -1, wave: sa ? q(Math.sin(c.rf * 0.6), 12) : undefined }), { mirror: true, s: 0.78 });
};
const ending = (c: Ctx) => { // golden hour: the stall, the seller and the kid, the whole chain of names along the street
  const f = c.f;
  P(c, "fruiter", FRUITER, 91, -0.35, -0.3, stand("smile", { facing: 1, look: 1, prop: "orange", blink: lidAt(f, 91) }), {});
  P(c, "kidP", KID, 92, 1.0, 0.6, stand("grin", { facing: -1, look: -1, prop: "orange" }), { mirror: true, s: 0.78 });
  P(c, "sailorP", SAILOR, 41, 2.8, -1.4, stand("smile", { facing: -1, look: -1 }), { mirror: true });
  P(c, "trav", TRAVELLER, 4, -2.4, 0.4, stand("grin", { facing: 1, look: 1, prop: "orange", blink: lidAt(f, 7) }), {});
};
const DIR: Record<string, (c: Ctx) => void> = { hook, m1: persia, m2: quay, m3: europe, india, persia, arab, quay, europe, sea: () => {}, china, sintra, dutch, port, end: ending };
export const stage = (f: number, cam: CamInfo, rf = f, o: [number, number, number] = [0, 0, 0]): Stage => {
  const out: Stage = { places: [], fx: [] }, t = takeAt(f);
  DIR[t.id]?.({ cam, out, f, rf, o });
  void fxSmoke; void INK; void TOTAL;
  return out;
};
