const { chromium } = require('playwright'); const fs = require('fs');
const FPS = 30, OUT = '/tmp/frames_ww1tt', N = +process.argv[2] || 3;
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch();
  const open = async () => { const p = await b.newPage({ viewport: { width: 400, height: 700 } }); await p.goto('http://127.0.0.1:8771/index_tiktok.html'); await p.evaluate(() => window.ready); return p; };
  const p0 = await open(); const D = await p0.evaluate(() => window.DURATION); const total = Math.ceil(D * FPS);
  const pages = [p0]; for (let i = 1; i < N; i++) pages.push(await open());
  let next = 0, done = 0; const t0 = Date.now();
  await Promise.all(pages.map(async (p) => { while (true) { const i = next++; if (i >= total) return;
    const url = await p.evaluate((t) => { window.seek(t); return document.getElementById('cv').toDataURL('image/jpeg', 0.93); }, i / FPS);
    fs.writeFileSync(`${OUT}/${String(i).padStart(5, '0')}.jpg`, Buffer.from(url.split(',')[1], 'base64'));
    if (++done % 150 === 0) console.log(done, '/', total, ((Date.now() - t0) / 1000).toFixed(0) + 's'); } }));
  console.log('frames', total); await b.close();
})();

