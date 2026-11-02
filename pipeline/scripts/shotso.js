const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  const errs = []; p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://localhost:8769/' + (process.env.PAGE || 'index.html')); await p.waitForFunction(() => window.seek && window.explainer !== undefined, null, { timeout: 60000 }).catch(()=>{}); await p.evaluate(() => window.ready);
  for (const t of process.argv.slice(2).map(Number)) {
    await p.evaluate((t) => window.seek(t), t);
    const url = await p.evaluate(() => document.querySelector('canvas').toDataURL('image/jpeg', 0.8));
    require('fs').writeFileSync(`/tmp/shots_o/t${t.toFixed(2)}.jpg`, Buffer.from(url.split(',')[1], 'base64'));
  }
  console.log('errors:', errs); await b.close();
})();
