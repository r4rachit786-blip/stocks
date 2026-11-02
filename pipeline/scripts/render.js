const { chromium } = require('playwright'); const fs = require('fs');
const FPS = 30, OUT = '/tmp/frames', N = +process.argv[2] || 3;
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch();
  const open = async () => { const p = await b.newPage({ viewport: { width: 400, height: 700 } }); await p.goto('file:///home/user/stocks/shorts_ww1_whatif/ww1-what-if.html'); await p.evaluate(() => window.ready); return p; };
  const p0 = await open(); const D = await p0.evaluate(() => window.DURATION); const total = Math.ceil(D * FPS);
  // effects track
  const fx = await p0.evaluate(async () => { const res = await SOUND.renderOffline(window.scoreSound, window.DURATION, 48000, { voiceover: true }); const f = res.inter; let s = ''; const u8 = new Uint8Array(f.buffer); for (let i = 0; i < u8.length; i += 32768) s += String.fromCharCode.apply(null, u8.subarray(i, i + 32768)); return btoa(s); });
  const f = new Float32Array(new Uint8Array(Buffer.from(fx, 'base64')).buffer);
  const n = f.length / 2, hdr = Buffer.alloc(44), data = Buffer.alloc(n * 4);
  for (let i = 0; i < n * 2; i++) data.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(f[i] * 32767))), i * 2);
  hdr.write('RIFF', 0); hdr.writeUInt32LE(36 + data.length, 4); hdr.write('WAVEfmt ', 8); hdr.writeUInt32LE(16, 16); hdr.writeUInt16LE(1, 20); hdr.writeUInt16LE(2, 22); hdr.writeUInt32LE(48000, 24); hdr.writeUInt32LE(48000 * 4, 28); hdr.writeUInt16LE(4, 32); hdr.writeUInt16LE(16, 34); hdr.write('data', 36); hdr.writeUInt32LE(data.length, 40);
  fs.writeFileSync('/tmp/vo/effects.wav', Buffer.concat([hdr, data])); console.log('effects', n / 48000, 's');
  const pages = [p0]; for (let i = 1; i < N; i++) pages.push(await open());
  let next = 0, done = 0; const t0 = Date.now();
  await Promise.all(pages.map(async (p) => { while (true) { const i = next++; if (i >= total) return;
    const url = await p.evaluate((t) => { window.seek(t); return document.getElementById('cv').toDataURL('image/jpeg', 0.93); }, i / FPS);
    fs.writeFileSync(`${OUT}/${String(i).padStart(5, '0')}.jpg`, Buffer.from(url.split(',')[1], 'base64'));
    if (++done % 150 === 0) console.log(done, '/', total, ((Date.now() - t0) / 1000).toFixed(0) + 's'); } }));
  console.log('frames', total); await b.close();
})();
