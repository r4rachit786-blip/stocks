// usage: node scripts/render.mjs <entry> <compId> <outDir> [concurrency]   -> PNG-free JPEG sequence f0000.jpg ... at 1080x1920
import fs from "node:fs";
import path from "node:path";
process.env.TMPDIR = process.env.TEMP = process.env.TMP = "/tmp/rmt"; // short symlink to <scratch>/remotion-tmp (chromium socket paths < 108 chars)
const { bundle } = await import("@remotion/bundler");
const { renderFrames, selectComposition } = await import("@remotion/renderer");
const [entry, id, outDir, conc = "2"] = process.argv.slice(2);
const browserExecutable = process.env.CHROME || "/opt/pw-browsers/chromium-1243/chrome-linux64/chrome";
const chromiumOptions = { gl: "swangle" };
fs.mkdirSync(outDir, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve(entry), publicDir: path.resolve("public") });
const composition = await selectComposition({ serveUrl, id, browserExecutable, chromiumOptions });
const t0 = Date.now();
let done = 0;
await renderFrames({ composition, serveUrl, outputDir: path.resolve(outDir), imageFormat: "jpeg", jpegQuality: 97, inputProps: {}, concurrency: Number(conc),
  browserExecutable, chromiumOptions, timeoutInMilliseconds: 600000, imageSequencePattern: "f[frame].[ext]", everyNthFrame: Number(process.env.NTH || 1), frameRange: process.env.RANGE ? process.env.RANGE.split("-").map(Number) : null, // RANGE=0-56 re-renders part of the shot
  onStart: () => {}, onFrameUpdate: (n) => { if (n !== done && n % 10 === 0) console.log("frames", n, ((Date.now() - t0) / 1000).toFixed(0) + "s"); done = n; } });
console.log("done", composition.durationInFrames, "frames in", ((Date.now() - t0) / 1000).toFixed(0) + "s");
process.exit(0);
