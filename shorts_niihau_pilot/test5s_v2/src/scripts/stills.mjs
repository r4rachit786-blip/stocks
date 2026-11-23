// usage: node scripts/stills.mjs <entry> <compId> <outPrefix> <frame,frame,...> [scale]
import fs from "node:fs";
import path from "node:path";
const TMP = "/tmp/rmt"; /* short symlink to <scratch>/remotion-tmp: chromium socket paths must stay < 108 chars */ process.env.TMPDIR = process.env.TEMP = process.env.TMP = TMP;
const { bundle } = await import("@remotion/bundler");
const { renderStill, selectComposition } = await import("@remotion/renderer");
const [entry, id, prefix, frames, scale = "0.5"] = process.argv.slice(2);
const browserExecutable = process.env.CHROME || "/opt/pw-browsers/chromium-1243/chrome-linux64/chrome";
const chromiumOptions = { gl: "swangle" };
const t00 = Date.now();
const serveUrl = await bundle({ entryPoint: path.resolve(entry), publicDir: path.resolve("public") });
console.log("bundle", ((Date.now() - t00) / 1000).toFixed(1) + "s");
const inputProps = process.env.PROPS ? JSON.parse(process.env.PROPS) : {};
const composition = await selectComposition({ serveUrl, id, browserExecutable, chromiumOptions, inputProps });
const onBrowserLog = (l) => { if (l.type === "error" || l.type === "warning") console.log(`[${l.type}]`, l.text.slice(0, 400)); };
fs.mkdirSync(path.dirname(prefix), { recursive: true });
for (const f of frames.split(",").map(Number)) {
  const t0 = Date.now();
  await renderStill({ composition, serveUrl, frame: f, output: `${prefix}${String(f).padStart(4, "0")}.jpg`, imageFormat: "jpeg", jpegQuality: 90, scale: Number(scale),
    browserExecutable, chromiumOptions, timeoutInMilliseconds: 600000, onBrowserLog, inputProps });
  console.log("still", f, ((Date.now() - t0) / 1000).toFixed(1) + "s");
}
process.exit(0);
