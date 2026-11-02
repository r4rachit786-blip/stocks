# Video build pipeline (backup from the cloud session)

Everything used to build the Shorts in this repo, copied out of the cloud container so it can be used on your own computer.

| Folder | What it is |
|---|---|
| `scripts/` | Python and Node scripts: HTML assembly (`assemble*.py`), frame rendering (`render*.js`), screenshots, covers, SFX generators (`sfx_*.py`), the encode/mix script (`finish_o.sh`) |
| `engine/ottoman/` | Canvas engine source for the Ottoman video, joined in this order: head, helpers, scenes, captions, frame, tail |
| `engine/nuclear/`, `engine/ww1_old/` | Engine sources for the nuclear and earlier WW1 builds |
| `fonts/` | Web fonts (embedded CSS) |
| `sfx_mixkit/` | Mixkit sound effects (free licence), named by Mixkit ID |
| `geo/` | Map city points / GeoJSON helpers |
| `audio/` | Voiceovers, word timings (`words.json`), vidIQ score, SFX layers and final mixes (MP3) |

Each finished video folder (`shorts_*`) also has its own `index*.html` page: open it in a browser to preview the animation with the voice.

**To re-render on your computer you need:** Python 3 (numpy, scipy, pillow), ffmpeg, Node.js with Playwright (Chromium).
**Note:** the scripts still point at the cloud container's `/tmp/...` paths. Swap those paths for this `pipeline/` folder before running them (Claude can do this for you in a local session).
