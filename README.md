# Free WhatsApp Stock Alerts

Three "agents" that send **informational** stock alerts to your WhatsApp. No trading, no money involved, and everything runs on free plans ($0).

| Agent | What it watches | When you get a message |
|---|---|---|
| 🇺🇸 Trump posts | Truth Social (backup: trumpstruth.org) | Right away, any time, if Gemini rates it relevant with confidence ≥ 6/10 |
| 🏛️ Congress trades | Bargo Congress Trades API, checked every 2 hours | One digest at 6 pm Newfoundland time, only if there were new trades |
| 📰 S&P 500 news | Alpaca news + SEC 8-K filings | Confidence ≥ 8/10 only, 7 am–10 pm, max 10 per day |
| 📊 Scorecard | Its own alert log | Sundays at 7 pm |

There's a limit of **25 WhatsApp messages per day** across all agents. Two of those are always kept free for the digest and the scorecard.

Everything is in a single file, [`worker.js`](worker.js), which you paste into Cloudflare.

---

## Setup checklist

You'll need these free accounts:

1. **CallMeBot**: sends the WhatsApp messages
2. **Google AI Studio**: the Gemini API key for the AI classifier
3. **Bargo**: the Congress trades key
4. **Alpaca**: news and stock prices (paper account)
5. **Cloudflare**: runs the code every 2 minutes

Then, in Cloudflare:

6. Create a KV storage space.
7. Create the Worker and paste in `worker.js`.
8. Connect the KV space to the Worker as `KV`.
9. Add the 7 secrets and 1 variable.
10. Add the cron trigger `*/2 * * * *`.
11. Open `/check` and `/test` to confirm it works.
12. Turn on and view the logs.

### Secrets and variables

| Name | Type | What to paste |
|---|---|---|
| `CALLMEBOT_PHONE` | Secret | Your WhatsApp number with country code, e.g. `+17095551234` |
| `CALLMEBOT_APIKEY` | Secret | The number CallMeBot sent you on WhatsApp |
| `GEMINI_API_KEY` | Secret | Key from aistudio.google.com (starts with `AIza`) |
| `BARGO_API_KEY` | Secret | Key from bargo.ai/free-apis |
| `ALPACA_KEY_ID` | Secret | Paper trading API Key ID (starts with `PK`) |
| `ALPACA_SECRET_KEY` | Secret | Paper trading Secret Key |
| `ADMIN_KEY` | Secret | A password you make up. It protects the test pages. |
| `SEC_CONTACT_EMAIL` | Text | Your email address. The SEC requires it in every request. |
| `GEMINI_MODEL` | Text (optional) | Leave it out to use `gemini-3.1-flash-lite` |

### Your private pages

Replace `YOUR-WORKER` with your Worker's address and `YOUR_ADMIN_KEY` with your password:

- `https://YOUR-WORKER.workers.dev/test?key=YOUR_ADMIN_KEY` sends one sample message from each agent.
- `https://YOUR-WORKER.workers.dev/check?key=YOUR_ADMIN_KEY` tests every API key, one by one.
- `https://YOUR-WORKER.workers.dev/status?key=YOUR_ADMIN_KEY` shows today's counters and the last alerts.
- `https://YOUR-WORKER.workers.dev/run?key=YOUR_ADMIN_KEY` runs one cycle right now.

---

## How it stays free

| Service | Free limit | What this project uses |
|---|---|---|
| Cloudflare Workers | 100,000 runs/day, 10 ms CPU per run | 720 runs/day, about 1–3 ms CPU each |
| Cloudflare KV | 1,000 writes/day, 100,000 reads/day | Saves only when something changed, usually a few hundred writes |
| Gemini | Free tier | Hard cap of 150 calls/day. News can use at most 100 of them, so Trump posts always have room. |
| Bargo | 100 requests and 1,000 rows/day | 12 checks/day × 70 rows, plus a little history |
| Alpaca | Free IEX data | News every 4 minutes, plus prices when an alert goes out |
| CallMeBot | Free for personal use | 25 messages/day or fewer |

## How it works

- **Nothing is alerted twice.** Every post, news story, filing and trade ID is saved in KV once it's handled.
- **First run is quiet.** The first time it runs, it only records what already exists. You'll only hear about things that happen after that.
- **Pre-filter before AI.** Gemini only sees items that mention an S&P 500 company or a keyword such as tariff, Fed, oil, earnings or FDA.
- **Rate limits.** If Gemini says "too many requests" (429), the item waits and is retried a few minutes later.
- **Truth Social blocks.** Truth Social often blocks automated requests. After 3 failures in a row the Worker switches to the trumpstruth.org RSS feed. It tries Truth Social again every hour.
- **Win rate (Congress).** For each trade, the stock's move since the trade date is compared with SPY over the same period. A buy is a "win" if the stock beat SPY. A sell is a "win" if the stock did worse than SPY. The sample size is shown. Every new trade is stored, so win rates get more reliable over time.
- **⭐ in the digest.** Means the trade is over $50,000, or the politician has a win rate of 60% or more over at least 10 trades.
- **Scorecard.** Each alert is logged with the stock price at that moment (from Alpaca). Each Sunday, it checks whether the price moved the predicted way 1 and 5 trading days later.

## Known limits

- Bargo's free feed covers about the last 3 months, sorted by trade date. A trade filed very late (up to 45 days) can be missed if many newer trades came in at the same time.
- Party labels (D/R/I) come from a built-in list of current members of Congress. A new member may show `?` until you run `python3 scripts/gen_data.py` again.
- SEC 8-K summaries only list item numbers, such as "Item 5.02 – officer departure". So Gemini rarely rates them 8/10, and most news alerts will come from Alpaca.
- Google may retire Gemini models over time. If `gemini-3.1-flash-lite` stops working, the Worker tries `gemini-3.5-flash-lite` automatically. You can also set the `GEMINI_MODEL` variable yourself.

## Updating the built-in lists

`python3 scripts/gen_data.py` downloads the latest S&P 500 list and members of Congress, and updates the data block at the bottom of `worker.js`. After that, paste the new `worker.js` into Cloudflare again.

*Informational only. Not investment advice. Congress data provided by [Bargo](https://www.bargo.ai/free-apis/congress).*
