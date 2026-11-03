const { chromium } = require('playwright'); const fs = require('fs');
const [URL, OUT, DUR, FPS] = [process.argv[2], process.argv[3], +process.argv[4], 30];
(async () => { fs.mkdirSync(OUT, { recursive: true }); const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto(URL); await p.evaluate(async () => { await document.fonts.load('400 100px "Anton"'); await document.fonts.load('900 100px "Montserrat"'); });
  const n = Math.round(DUR * FPS); const only = process.argv[5] ? process.argv[5].split(',').map(Number) : null;
  for (let i = 0; i < n; i++) { if (only && !only.includes(i)) continue; const u = await p.evaluate((t) => window.draw(t), i / FPS); fs.writeFileSync(`${OUT}/${String(i).padStart(5, '0')}.png`, Buffer.from(u.split(',')[1], 'base64')); }
  await b.close(); console.log('frames', n); })();
