#!/usr/bin/env python3
"""Regenerates the data block inside worker.js.

You only need this if the S&P 500 list or Congress membership has changed a lot.
It downloads:
  - the S&P 500 list (ticker, name, sector, SEC CIK) from Wikipedia
  - current members of Congress (name, state, district, party) from the
    public @unitedstates/congress-legislators project
and rewrites everything between the BEGIN/END GENERATED DATA markers in worker.js.

Usage:  python3 scripts/gen_data.py
"""
import csv
import html
import io
import json
import re
import unicodedata
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WORKER = ROOT / "worker.js"
UA = {"User-Agent": "Mozilla/5.0 (stock-alerts data generator)"}

# Short names that are too common as English words to use for matching text.
AMBIGUOUS = {
    "American", "U.S.", "News", "Block", "Target", "Ball", "Southern", "Progressive",
    "Republic", "Principal", "Williams", "Northern", "Constellation", "Everest", "Waters",
    "Dover", "Cooper", "Hartford", "Edison", "Citizens", "Regions", "Carnival", "Quanta",
    "Flex", "Dow", "Visa", "HP", "Coherent", "Trane", "Fox", "Lennox", "Republic", "Cincinnati",
    "Booking", "Prudential", "Generac", "Gen Digital", "Q", "Jabil", "Corning", "Tyler",
    "Global Payments", "Universal Health", "Globe Life", "Synchrony", "Seagate",
}

# Extra nicknames people actually use in posts and headlines.
EXTRA_ALIASES = {
    "Google": "GOOGL", "YouTube": "GOOGL", "Facebook": "META", "Instagram": "META",
    "WhatsApp": "META", "Meta": "META", "Eli Lilly": "LLY", "Lilly": "LLY",
    "General Electric": "GE", "Exxon": "XOM", "Lockheed": "LMT", "Raytheon": "RTX",
    "Coke": "KO", "Disney": "DIS", "J&J": "JNJ", "JPMorgan": "JPM", "Chase": "JPM",
    "Goldman": "GS", "Citi": "C", "Citibank": "C", "Wells Fargo": "WFC",
    "Bank of America": "BAC", "Berkshire": "BRK.B", "Northrop": "NOC",
    "General Dynamics": "GD", "Boeing": "BA", "Ford": "F", "GM": "GM", "Tesla": "TSLA",
    "Nvidia": "NVDA", "Intel": "INTC", "Micron": "MU", "AMD": "AMD", "Qualcomm": "QCOM",
    "Broadcom": "AVGO", "Apple": "AAPL", "Microsoft": "MSFT", "Amazon": "AMZN",
    "Oracle": "ORCL", "Palantir": "PLTR", "Walmart": "WMT", "Costco": "COST",
    "Pfizer": "PFE", "Merck": "MRK", "AbbVie": "ABBV", "Moderna": "MRNA",
    "Johnson & Johnson": "JNJ", "Chevron": "CVX", "ConocoPhillips": "COP",
    "Occidental": "OXY", "Halliburton": "HAL", "Caterpillar": "CAT", "Deere": "DE",
    "John Deere": "DE", "Nucor": "NUE", "Steel Dynamics": "STLD", "Comcast": "CMCSA",
    "NBC": "CMCSA", "MSNBC": "CMCSA", "CNN": "WBD", "Warner Bros": "WBD", "ABC": "DIS",
    "CBS": "PSKY", "Paramount": "PSKY", "Netflix": "NFLX", "Coinbase": "COIN",
    "Robinhood": "HOOD", "UnitedHealth": "UNH", "CVS": "CVS", "Humana": "HUM",
    "McDonald's": "MCD", "Starbucks": "SBUX", "Nike": "NKE", "Mattel": "",
    "Home Depot": "HD", "Lowe's": "LOW", "FedEx": "FDX", "UPS": "UPS",
    "Delta Air Lines": "DAL", "United Airlines": "UAL", "American Airlines": "",
    "Southwest Airlines": "LUV", "Uber": "UBER", "Airbnb": "ABNB", "Salesforce": "CRM",
    "IBM": "IBM", "Cisco": "CSCO", "Dell": "DELL", "Supermicro": "SMCI",
    "Super Micro": "SMCI", "Visa Inc": "V", "Mastercard": "MA", "PayPal": "PYPL",
    "Fox News": "FOXA", "Fox Corporation": "FOXA", "Dow Inc": "DOW", "Target Corporation": "TGT",
}

SUFFIX = re.compile(
    r"(,?\s+(Inc\.?|Incorporated|Corporation|Corp\.?|Company|Co\.?|plc|PLC|Ltd\.?|Limited|"
    r"N\.V\.|S\.A\.|Holdings?|Group|Technologies|Technology|Systems|Brands|International|"
    r"Industries|Enterprises|Companies|Financial|Services|Trust|Bancorp|\(The\)|"
    r"\(Class [A-Z]\)|Class [A-Z]|&))+$"
)


def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
        return r.read().decode("utf-8", "ignore")


def sp500():
    page = get("https://en.wikipedia.org/wiki/List_of_S%26P_500_companies")
    table = page[page.find('id="constituents"'):]
    table = table[: table.find("</table>")]
    rows = []
    for row in re.split(r"<tr[^>]*>", table)[1:]:
        cells = [
            re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", c))).strip()
            for c in re.findall(r"<td[^>]*>(.*?)</td>", row, flags=re.S)
        ]
        if len(cells) >= 7:
            ticker, name, sector = cells[0], cells[1].replace("|", ""), cells[2]
            cik = next((int(c) for c in cells if re.fullmatch(r"\d{10}", c)), 0)
            rows.append((ticker, name, sector, cik))
    if len(rows) < 480:
        raise SystemExit(f"Only found {len(rows)} S&P 500 rows; Wikipedia layout changed?")
    return rows


def aliases(rows):
    out = {}
    tickers = {r[0] for r in rows}
    for ticker, name, _, _ in rows:
        if name == "Lilly (Eli)":
            name = "Eli Lilly"
        short = SUFFIX.sub("", name).strip().rstrip("&").strip()
        for a in {name, short}:
            if a and a not in AMBIGUOUS and len(a) >= 3 and a not in out:
                out[a] = ticker
    for a, t in EXTRA_ALIASES.items():
        if t and t in tickers:
            out[a] = t
    return out


def norm(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z ]", "", s.replace("-", " ")).strip()


def legislators():
    text = get("https://unitedstates.github.io/congress-legislators/legislators-current.csv")
    out = {}
    for r in csv.DictReader(io.StringIO(text)):
        party = {"Democrat": "D", "Republican": "R", "Independent": "I"}.get(r["party"], r["party"][:1])
        if r["type"] == "sen":
            key = f"{norm(r['last_name'])}|{r['state']}|S"
        else:
            key = f"{norm(r['last_name'])}|{r['state']}|{int(r['district'] or 0)}"
        out[key] = party
    return out


def main():
    rows = sp500()
    data = {
        "sp500": [list(r) for r in rows],
        "aliases": aliases(rows),
        "party": legislators(),
    }
    block = (
        "// BEGIN GENERATED DATA (scripts/gen_data.py) - do not edit by hand\n"
        "const DATA = " + json.dumps(data, separators=(",", ":"), ensure_ascii=False) + ";\n"
        "// END GENERATED DATA"
    )
    src = WORKER.read_text()
    new = re.sub(
        r"// BEGIN GENERATED DATA.*?// END GENERATED DATA", lambda _: block, src, flags=re.S
    )
    WORKER.write_text(new)
    print(f"S&P 500: {len(rows)} companies, {len(data['aliases'])} name aliases, "
          f"{len(data['party'])} members of Congress")


if __name__ == "__main__":
    main()
