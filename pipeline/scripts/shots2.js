const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 600, height: 1000 } });
  const errs = []; p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => window.ready);
  const chk = await p.evaluate(() => { const w = window.VO_WORDS; return [2,11,12,16,19,24,26,29,33,38,47,52,55,60,66,72,73,76].map(i => i + ':' + w[i][2]).join(' '); });
  console.log(chk);
  const ts = process.argv.slice(2).map(Number);
  for (const t of ts) {
    const ms = await p.evaluate((t) => { const a = performance.now(); window.seek(t); return performance.now() - a; }, t);
    const url = await p.evaluate(() => document.getElementById('cv').toDataURL('image/jpeg', 0.85));
    require('fs').writeFileSync(`/tmp/shots/t${t.toFixed(2)}.jpg`, Buffer.from(url.split(',')[1], 'base64'));
    console.log(t, ms.toFixed(0) + 'ms');
  }
  console.log('errors:', errs); await b.close();
})();
