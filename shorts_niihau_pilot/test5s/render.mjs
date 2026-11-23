// Render frames with headless Chromium. Usage: node render.mjs <outdir> [frame,frame,...]
import { createRequire } from "module"; const { chromium } = createRequire(process.env.PW_ROOT + "/")("playwright"); import fs from "fs"; import path from "path"; import { fileURLToPath } from "url";
const out = process.argv[2]; fs.mkdirSync(out, { recursive: true });
const only = process.argv[3] ? process.argv[3].split(",").map(Number) : null;
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const p = await b.newPage({ viewport: { width: 540, height: 960 } });
p.on("console", (m) => { if (m.type() === "error") console.log("ERR", m.text()); }); p.on("pageerror", (e) => console.log("PAGEERR", e.message));
await p.goto("file://" + path.join(path.dirname(fileURLToPath(import.meta.url)), "index.html") + "#render");
await p.waitForFunction("window.ready === true", null, { timeout: 60000 });
const total = await p.evaluate("TOTAL"); const t0 = Date.now();
for (const f of only ?? [...Array(total).keys()]) {
  const d = await p.evaluate((f) => renderFrame(f), f);
  fs.writeFileSync(path.join(out, `f${String(f).padStart(4, "0")}.jpg`), Buffer.from(d.split(",")[1], "base64"));
}
console.log("done", ((Date.now() - t0) / 1000).toFixed(1) + "s"); await b.close();
