const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto('http://127.0.0.1:8769/_cover.html'); await p.waitForFunction(() => document.title === 'done');
  await (await p.$('#c')).screenshot({ path: '/home/user/stocks/shorts_ottoman_whatif/cover.jpg', type: 'jpeg', quality: 92 }); await b.close(); })();
