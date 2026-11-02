// ===== "One Vote From The End Of The World" — v2, high-motion edit, 1080x1920 =====
(() => {
  const W = 1080, HH = 1920;
  const CYAN = '#5fe3ff', RED = '#ff2a2a', AMBER = '#ffb23e';
  const E = H.ease, cl = H.clamp, seg = (t, a, b) => cl((t - a) / (b - a)), lerp = H.lerp;
  const WORDS = window.VO_WORDS, wt = (i) => WORDS[i][0], we = (i) => WORDS[i][1];
  const DURATION = we(WORDS.length - 1) + 0.9;
  const appear = (t, t0, d = 0.25) => E.out(seg(t, t0, t0 + d));
  const pop = (t, t0, d = 0.3) => E.back(seg(t, t0, t0 + d));
  const CITY = window.CITIES;
  const P = Object.assign({ hudY: 230, capY: 1420, top: 0, right: 70, grain: 0.35, scan: 0.13, cardX0: 50, cardStep: 335, cardW: 310 }, window.PRESET || {});

  // ---------------- assets ----------------
  const A = {};
  const loadImg = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
  const filtered = (img, f) => { const c = H.layer(img.width, img.height), x = c.getContext('2d'); x.filter = f; x.drawImage(img, 0, 0); return c; };
  const COLD = 'grayscale(0.85) contrast(1.25) brightness(0.85) sepia(0.15) hue-rotate(160deg) saturate(1.4)';
  const REDT = 'grayscale(1) contrast(1.35) brightness(0.75) sepia(1) hue-rotate(-50deg) saturate(3.2)';
  window.loadAssets = async () => {
    const names = ['arkhipov', 'b59', 'carrier', 'bravo', 'grable', 'badger', 'beatles', 'moon', 'titan', 'cubamissiles', 'kennedy', 'nyc', 'moscow', 'map'];
    const imgs = await Promise.all(names.map((n) => loadImg('assets/' + n + '.jpg')));
    const [arkCut, kenCut, smoke] = await Promise.all([loadImg('assets/arkhipov_cut.png'), loadImg('assets/kennedy_cut.png'), loadImg('assets/smoke.png')]);
    names.forEach((n, i) => { const im = imgs[i]; A[n] = n === 'map' ? im : (['bravo', 'grable', 'badger', 'titan', 'moon', 'moscow', 'nyc'].includes(n) ? filtered(im, 'contrast(1.12) saturate(1.15)') : filtered(im, COLD)); });
    const ark = imgs[0], ken = imgs[names.indexOf('kennedy')];
    A.arkBgRed = filtered(ark, REDT + ' blur(10px) brightness(0.6)'); A.arkCutRed = filtered(arkCut, REDT);
    A.arkBgCold = filtered(ark, COLD + ' blur(10px) brightness(0.6)'); A.arkCutCold = filtered(arkCut, COLD);
    A.arkBgWarm = filtered(ark, 'sepia(0.4) blur(10px) brightness(0.7)'); A.arkCutWarm = filtered(arkCut, 'sepia(0.35) contrast(1.1) brightness(1.05)');
    A.kenBg = filtered(ken, COLD + ' blur(8px) brightness(0.65)'); A.kenCut = filtered(kenCut, COLD);
    A.nycFire = filtered(imgs[names.indexOf('nyc')], 'grayscale(0.6) contrast(1.2) brightness(0.8)');
    A.nycAsh = filtered(imgs[names.indexOf('nyc')], 'grayscale(1) contrast(1.05) brightness(1.2)');
    A.moscowFire = filtered(imgs[names.indexOf('moscow')], 'grayscale(0.5) contrast(1.2) brightness(0.8)');
    A.smoke = smoke; A.smokeDark = filtered(smoke, 'brightness(0.12)'); A.smokeOrange = filtered(smoke, 'sepia(1) saturate(4) hue-rotate(-15deg) brightness(0.9)');
    A.grain = []; for (let s = 0; s < 6; s++) { const c = H.layer(540, 960), x = c.getContext('2d'), d = x.createImageData(540, 960), g = H.rng(500 + s); for (let i = 0; i < d.data.length; i += 4) { const n = 128 + g.gauss() * 30; d.data[i] = d.data[i + 1] = d.data[i + 2] = n; d.data[i + 3] = 255; } x.putImageData(d, 0, 0); A.grain.push(c); }
    const sl = H.layer(W, HH), sx = sl.getContext('2d'); sx.fillStyle = `rgba(0,0,0,${P.scan})`; for (let y = 0; y < HH; y += 4) sx.fillRect(0, y, W, 2); A.scan = sl;
    A.off1 = H.layer(W, HH); A.off2 = H.layer(W, HH); A.fx = H.layer(W, HH);
  };

  // ---------------- timeline ----------------
  const S = (k, t0, t1, tr = 'whip') => ({ k, t0, t1, tr });
  const SC = [
    S('hook', 0, wt(8), 'none'), S('third', wt(8), wt(17), 'zoom'), S('disappear', wt(17), wt(24), 'flash'), S('b59', wt(24), wt(26), 'whip'),
    S('sonar', wt(26), wt(30), 'whip'), S('fleet', wt(30), wt(38), 'whip'), S('kennedy', wt(38), wt(53), 'whip'), S('cuba', wt(53), wt(58), 'flash'),
    S('mapUS', wt(58), wt(62), 'zoom'), S('burnNY', wt(62), wt(65), 'flash'), S('noon', wt(65), wt(68), 'whip'), S('mapEU', wt(68), wt(73), 'zoom'),
    S('burnMoscow', wt(73), wt(74), 'flash'), S('ash', wt(74), wt(82), 'whip'), S('cards', wt(82), wt(93), 'cut'), S('you', wt(93), wt(95), 'cut'),
    S('villain', wt(95), wt(107), 'flash'), S('end', wt(107), DURATION + 1, 'zoom'),
  ];
  const HITS = [wt(7), wt(15), wt(23), wt(29) + 0.45, wt(37), wt(48), wt(55), wt(58), wt(59), wt(60), wt(62), wt(68), wt(69), wt(70), wt(72), wt(73), wt(104)];
  const KEY = new Set(['YES', 'NO', 'BUTTON', 'THIRD', 'DISAPPEARS', 'FLASH', 'GONE', 'WORLD', 'THREE', 'CUBA', 'MIAMI', 'WASHINGTON', 'NEW', 'YORK', 'MOSCOW', 'LENINGRAD', 'EUROPE', 'SUMMER', 'NEVER', 'BEATLES', 'MOON', 'INTERNET', 'IPHONE', 'YOUTUBE', 'YOU', 'ENDED', 'ARKHIPOV', 'TIMELINE', 'NUCLEAR', 'SCARED', 'MIDNIGHT', 'NOON', 'MEN']);
  const RED_KEYS = new Set(['GONE', 'ENDED', 'FLASH', 'NUCLEAR', 'NEVER', 'DISAPPEARS', 'YES']);
  const CAPS = []; { let cur = null; WORDS.forEach((w, i) => { const gap = i ? w[0] - WORDS[i - 1][1] : 1; if (!cur || cur.idx.length >= 3 || gap > 0.22) { cur = { idx: [] }; CAPS.push(cur); } cur.idx.push(i); }); }
  const tok = (i) => WORDS[i][2].toUpperCase().replace(/[.,!?…]/g, '');

  // ---------------- helpers ----------------
  const txt = (ctx, s, font, x, y, align = 'center', fill = '#fff', ls = 0) => { ctx.font = font; ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; ctx.letterSpacing = ls + 'px'; ctx.fillStyle = fill; ctx.fillText(s, x, y); ctx.letterSpacing = '0px'; };
  const cover = (ctx, img, cx, cy, z, dx = 0, dy = 0) => { const s = Math.max(W / img.width, HH / img.height) * z, dw = img.width * s, dh = img.height * s; let x = W / 2 - cx * dw, y = HH / 2 - cy * dh; x = Math.min(0, Math.max(W - dw, x)) + dx; y = Math.min(0, Math.max(HH - dh, y)) + dy; ctx.drawImage(img, x, y, dw, dh); return { x, y, dw, dh, P: (nx, ny) => [x + nx * dw, y + ny * dh] }; };
  const kb = (ctx, img, s, t, f, to) => { const u = E.inOut(seg(t, s.t0, s.t1)); return cover(ctx, img, lerp(f[0], to[0], u), lerp(f[1], to[1], u), lerp(f[2], to[2], u)); };
  const glow = (ctx, fn, color = CYAN, blur = 24) => { ctx.save(); ctx.shadowColor = color; ctx.shadowBlur = blur; fn(); ctx.restore(); };
  // 2.5D parallax: blurred background and cut-out foreground move at different speeds
  const parallax = (ctx, bg, fg, s, t, face = [0.5, 0.3], rim = RED) => {
    const u = E.inOut(seg(t, s.t0, s.t1));
    const z0 = 1.12; const r = cover(ctx, bg, face[0], face[1], z0 + 0.04 * u, -20 + 40 * u, 0);
    const sc = (r.dw / bg.width) * (fg.width === bg.width ? 1 : 1) * (1 + 0.08 * u), dw = fg.width * sc, dh = fg.height * sc;
    const x = r.x + 20 - 40 * u - (dw - r.dw) * face[0] - 30 * u, y = r.y - (dh - r.dh) * face[1];
    ctx.save(); ctx.shadowColor = rim; ctx.shadowBlur = 60; ctx.drawImage(fg, x, y, dw, dh); ctx.restore(); ctx.drawImage(fg, x, y, dw, dh);
    return (nx, ny) => [x + nx * dw, y + ny * dh];
  };
  // kinetic headline: flies in from big + ghost trail, settles with a slight drift
  const kin = (ctx, s, y, size, color, t, t0, rot = 0) => { if (t < t0 - 0.02) return; const u = seg(t, t0 - 0.02, t0 + 0.2), e = E.out(u), sc = lerp(2.4, 1, e) * (1 + 0.02 * (t - t0));
    ctx.save(); ctx.translate(W / 2, y); ctx.rotate(rot); ctx.font = `400 ${size}px "Anton"`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    for (let g = 3; g >= 0; g--) { const gs = sc * (1 + g * 0.08 * (1 - e)); ctx.save(); ctx.scale(gs, gs); ctx.globalAlpha = g ? 0.18 * (1 - e) : Math.min(1, u * 3); if (!g) { ctx.lineWidth = size * 0.12; ctx.strokeStyle = 'rgba(0,0,0,0.9)'; ctx.strokeText(s, 0, 0); ctx.shadowColor = color; ctx.shadowBlur = 45; } ctx.fillStyle = color; ctx.letterSpacing = '4px'; ctx.fillText(s, 0, 0); ctx.letterSpacing = '0px'; ctx.restore(); }
    ctx.restore(); };
  const stamp = (ctx, s, x, y, size, color, t, t0, rot = -0.12) => { if (t < t0 - 0.02) return; const u = seg(t, t0 - 0.02, t0 + 0.12), sc = lerp(2.2, 1, E.out(u)); ctx.save(); ctx.globalAlpha = Math.min(1, u * 3); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc, sc);
    ctx.font = `400 ${size}px "Anton"`; const w = ctx.measureText(s).width + size * 0.5; ctx.strokeStyle = color; ctx.lineWidth = size * 0.07; ctx.strokeRect(-w / 2, -size * 0.62, w, size * 1.15); glow(ctx, () => txt(ctx, s, `400 ${size}px "Anton"`, 0, size * 0.36, 'center', color, 4), color, 30);
    ctx.globalCompositeOperation = 'destination-out'; const r = H.rng(7); for (let i = 0; i < 90; i++) { ctx.beginPath(); ctx.arc(r.range(-w / 2, w / 2), r.range(-size * 0.6, size * 0.5), r.range(1, 4), 0, 7); ctx.fill(); } ctx.restore(); };
  // animated callout: pulsing dot on the subject, a line drawn out to a typed label
  const callout = (ctx, p, l, label, sub, t, t0, color = CYAN) => { if (t < t0) return; const u = seg(t, t0, t0 + 0.35), v = seg(t, t0 + 0.25, t0 + 0.75);
    const pulse = 1 + 0.4 * Math.sin((t - t0) * 9); ctx.save(); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 3; ctx.shadowColor = color; ctx.shadowBlur = 16;
    ctx.beginPath(); ctx.arc(p[0], p[1], 10, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(p[0], p[1], 22 * pulse, 0, 7); ctx.stroke();
    const mx = lerp(p[0], l[0], 0.5), my = l[1]; const e = [lerp(p[0], mx, Math.min(1, u * 2)), lerp(p[1], my, Math.min(1, u * 2))]; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(e[0], e[1]); if (u > 0.5) ctx.lineTo(lerp(mx, l[0], (u - 0.5) * 2), my); ctx.stroke();
    if (v > 0) { const n = Math.ceil(label.length * v), m = Math.ceil((sub || '').length * v); ctx.shadowBlur = 0; ctx.font = '400 46px "Share Tech Mono"'; ctx.letterSpacing = '2px'; const lw0 = ctx.measureText(label).width; ctx.font = '400 34px "Share Tech Mono"'; const sw0 = sub ? ctx.measureText(sub).width : 0; ctx.letterSpacing = '0px'; const w = Math.max(lw0, sw0) + 44, left = l[0] > W / 2 ? l[0] - w : l[0];
      ctx.fillStyle = 'rgba(0,10,16,0.75)'; ctx.fillRect(left, my - 52, w, sub ? 112 : 70); ctx.strokeRect(left, my - 52, w, sub ? 112 : 70); txt(ctx, label.slice(0, n), '400 46px "Share Tech Mono"', left + 20, my, 'left', '#fff', 2); if (sub) txt(ctx, sub.slice(0, m), '400 34px "Share Tech Mono"', left + 20, my + 44, 'left', color, 2); }
    ctx.restore(); };
  // target reticle locking onto a point
  const reticle = (ctx, p, size, label, t, t0, color = RED) => { if (t < t0) return; const u = E.out(seg(t, t0, t0 + 0.35)), s = lerp(size * 2.2, size, u), a = (1 - u) * 0.8; ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(a); ctx.strokeStyle = color; ctx.lineWidth = 5; ctx.shadowColor = color; ctx.shadowBlur = 20;
    const l = s * 0.35; [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sy]) => { ctx.beginPath(); ctx.moveTo(sx * s, sy * (s - l)); ctx.lineTo(sx * s, sy * s); ctx.lineTo(sx * (s - l), sy * s); ctx.stroke(); }); ctx.rotate(-a);
    if (u > 0.6) txt(ctx, label, '400 40px "Share Tech Mono"', 0, -s - 22, 'center', color, 4); ctx.restore(); };
  const hud = (ctx, lines, t, t0, y = P.hudY) => { const u = appear(t, t0 + 0.05, 0.3); if (u <= 0) return; ctx.save(); ctx.globalAlpha = u; ctx.translate(-(1 - u) * 60, 0);
    ctx.fillStyle = 'rgba(0,10,16,0.65)'; ctx.fillRect(60, y - 64, 640, 64 + lines.length * 58); ctx.strokeStyle = CYAN; ctx.lineWidth = 2; ctx.strokeRect(60, y - 64, 640, 64 + lines.length * 58);
    lines.forEach((l, i) => { const s = l.replace(/^!/, ''), n = Math.ceil(s.length * seg(t, t0 + 0.05 + i * 0.12, t0 + 0.45 + i * 0.12)); glow(ctx, () => txt(ctx, s.slice(0, n), `400 ${i ? 40 : 54}px "Share Tech Mono"`, 86, y + i * 58, 'left', i ? CYAN : (l.startsWith('!') ? RED : '#fff'), 3), i ? CYAN : '#fff', 12); }); ctx.restore(); };
  const clock = (ctx, time, date, t, t0, color = RED, y = 760) => { const u = pop(t, t0, 0.3); if (u <= 0) return; ctx.save(); ctx.translate(W / 2, y); ctx.scale(u, u); ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(-380, -170, 760, 300); ctx.strokeStyle = color; ctx.lineWidth = 4; ctx.strokeRect(-380, -170, 760, 300);
    const blink = Math.floor(t * 2) % 2 ? ':' : ' '; glow(ctx, () => txt(ctx, time.replace(':', blink), '400 190px "Share Tech Mono"', 0, 40, 'center', color, 6), color, 40); txt(ctx, date, '400 44px "Share Tech Mono"', 0, 105, 'center', '#fff', 8); ctx.restore(); };
  const flash = (ctx, t, t0, d = 0.5, color = '255,245,220') => { if (t < t0 || t > t0 + d) return; const a = 1 - (t - t0) / d; ctx.fillStyle = `rgba(${color},${a * 0.95})`; ctx.fillRect(0, 0, W, HH); };
  const embers = (ctx, t, n, seed, y0 = HH, spread = W, hot = 1) => { const r = H.rng(seed); ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < n; i++) { const sp = r.range(120, 380), ph = r.range(0, 10), x0 = r.range(0, spread), life = (t * sp / HH + ph) % 1, x = x0 + Math.sin(t * r.range(1, 3) + ph) * 40, y = y0 - life * HH * 1.1, s = r.range(2, 6) * (1 - life * 0.6);
    ctx.fillStyle = `rgba(255,${(140 + r.range(0, 90)) | 0},40,${(0.9 - life) * hot})`; ctx.beginPath(); ctx.arc(x, y, s, 0, 7); ctx.fill(); } ctx.restore(); };
  const smokeLayer = (ctx, tex, t, alpha, speed = 30, scale = 2.4, mode = 'screen') => { ctx.save(); ctx.globalAlpha = alpha; ctx.globalCompositeOperation = mode; const s = tex.width * scale, ox = -((t * speed) % s), oy = -((t * speed * 0.4) % s); for (let y = oy; y < HH; y += s) for (let x = ox; x < W; x += s) ctx.drawImage(tex, x, y, s, s); ctx.restore(); };
  const fireGlow = (ctx, t, a = 1) => { const f = 0.85 + 0.15 * Math.sin(t * 17) * Math.sin(t * 7.3); const g = ctx.createLinearGradient(0, HH, 0, HH * 0.3); g.addColorStop(0, `rgba(255,120,20,${0.75 * a * f})`); g.addColorStop(0.5, `rgba(200,40,10,${0.35 * a * f})`); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = g; ctx.fillRect(0, 0, W, HH); ctx.restore(); };
  const leak = (ctx, t, color = '255,120,40', a = 0.35) => { const x = W * (0.5 + 0.45 * Math.sin(t * 0.7)), y = HH * (0.3 + 0.2 * Math.cos(t * 0.5)); const g = ctx.createRadialGradient(x, y, 0, x, y, 900); g.addColorStop(0, `rgba(${color},${a})`); g.addColorStop(1, `rgba(${color},0)`); ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = g; ctx.fillRect(0, 0, W, HH); ctx.restore(); };
  const shockwave = (ctx, p, t, t0, max = 1400) => { if (t < t0 || t > t0 + 0.8) return; const u = seg(t, t0, t0 + 0.8); ctx.save(); ctx.strokeStyle = `rgba(255,240,220,${1 - u})`; ctx.lineWidth = 30 * (1 - u) + 2; ctx.beginPath(); ctx.arc(p[0], p[1], max * E.out(u), 0, 7); ctx.stroke(); ctx.restore(); };
  const rgbSplit = (ctx, amt) => { if (amt <= 0.02) return; const fx = A.fx, x = fx.getContext('2d'); x.globalCompositeOperation = 'copy'; x.drawImage(ctx.canvas, 0, 0); x.globalCompositeOperation = 'multiply'; x.fillStyle = '#ff0000'; x.fillRect(0, 0, W, HH);
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 0.55 * amt; ctx.drawImage(fx, 18 * amt, 0); ctx.restore(); x.globalCompositeOperation = 'copy'; x.drawImage(ctx.canvas, 0, 0); x.globalCompositeOperation = 'multiply'; x.fillStyle = '#00ffff'; x.fillRect(0, 0, W, HH); ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 0.45 * amt; ctx.drawImage(fx, -18 * amt, 0); ctx.restore(); };
  const glitch = (ctx, amt, seed) => { if (amt <= 0.01) return; const r = H.rng(seed), c = ctx.canvas; for (let i = 0; i < 7; i++) { const y = r.range(0, HH), h = r.range(10, 90), dx = r.range(-90, 90) * amt; ctx.drawImage(c, 0, y, W, h, dx, y, W, h); } };

  // ---------------- map ----------------
  const drawMap = (ctx, cam) => { ctx.fillStyle = '#060c12'; ctx.fillRect(0, 0, W, HH); const r = cover(ctx, A.map, cam[0], cam[1], cam[2]); return (n) => [r.x + CITY[n][0] * r.dw, r.y + CITY[n][1] * r.dh]; };
  const LBL = { WASHINGTON: [-150, 95], 'NEW YORK': [120, -75], LENINGRAD: [-150, -60], MOSCOW: [-40, 85], PARIS: [70, 85], LONDON: [-110, -70], BERLIN: [40, -70], MIAMI: [-20, -70] };
  const arc = (ctx, a, b, u, color = RED) => { if (u <= 0) return; const mx = (a[0] + b[0]) / 2, my = Math.min(a[1], b[1]) - 280, q = (s) => [(1 - s) * (1 - s) * a[0] + 2 * (1 - s) * s * mx + s * s * b[0], (1 - s) * (1 - s) * a[1] + 2 * (1 - s) * s * my + s * s * b[1]];
    ctx.save(); ctx.lineCap = 'round'; for (const [w, al] of [[16, 0.18], [7, 0.9]]) { ctx.strokeStyle = color; ctx.globalAlpha = al; ctx.lineWidth = w; ctx.shadowColor = color; ctx.shadowBlur = 24; ctx.beginPath(); const s0 = Math.max(0, u - 0.45); for (let i = 0; i <= 40; i++) { const p = q(lerp(s0, u, i / 40)); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); } ctx.stroke(); }
    ctx.globalAlpha = 1; const e = q(Math.min(1, u)); ctx.fillStyle = '#fff'; ctx.shadowBlur = 30; ctx.beginPath(); ctx.arc(e[0], e[1], 11, 0, 7); ctx.fill(); ctx.restore(); };
  const blast = (ctx, p, t, t0, name) => { if (t < t0) return; const u = seg(t, t0, t0 + 1.0), r = 30 + 300 * E.out(u);
    const g = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], r); g.addColorStop(0, `rgba(255,255,230,${1 - u * 0.5})`); g.addColorStop(0.35, `rgba(255,170,40,${0.9 - u * 0.4})`); g.addColorStop(1, 'rgba(255,40,0,0)'); ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, 7); ctx.fill(); ctx.restore();
    shockwave(ctx, p, t, t0, 420);
    const o = LBL[name] || [0, -70], v = pop(t, t0, 0.25); ctx.save(); ctx.translate(p[0] + o[0], p[1] + o[1]); ctx.scale(v, v); ctx.lineJoin = 'round'; ctx.font = '400 58px "Anton"'; ctx.textAlign = 'center'; ctx.lineWidth = 9; ctx.strokeStyle = 'rgba(0,0,0,0.9)'; ctx.strokeText(name, 0, 0); txt(ctx, name, '400 58px "Anton"', 0, 0, 'center', '#fff', 2); ctx.restore(); };

  // ---------------- scenes ----------------
  const silhouette = (ctx, x, y, w, h) => { ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); const g = ctx.createLinearGradient(x, y, x, y + h); g.addColorStop(0, '#1d2a33'); g.addColorStop(1, '#0a1218'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#05090c'; ctx.beginPath(); ctx.arc(x + w / 2, y + h * 0.4, w * 0.2, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(x + w / 2, y + h * 1.02, w * 0.48, h * 0.42, 0, 0, 7); ctx.fill(); txt(ctx, '?', `400 ${w * 0.3}px "Anton"`, x + w / 2, y + h * 0.48, 'center', 'rgba(95,227,255,0.45)'); ctx.restore(); };
  const SCN = {
    hook(ctx, t, s) { // dark sub interior: red light, smoke, sonar sweep; three officer dossiers
      ctx.fillStyle = '#07090b'; ctx.fillRect(0, 0, W, HH); const pulse = 0.5 + 0.5 * Math.sin(t * 6); const g = ctx.createRadialGradient(W / 2, 300, 0, W / 2, 300, 1300); g.addColorStop(0, `rgba(160,10,10,${0.35 + 0.25 * pulse})`); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, HH);
      smokeLayer(ctx, A.smoke, t, 0.12, 25);
      // big red button
      const b = pop(t, wt(2) - 0.05, 0.35); if (b > 0) { ctx.save(); ctx.translate(W / 2, P.cardY ? P.cardY - 200 : 470 + P.top * 0.6); ctx.scale(b, b); ctx.fillStyle = '#222'; ctx.beginPath(); ctx.ellipse(0, 30, 170, 60, 0, 0, 7); ctx.fill(); glow(ctx, () => { const gg = ctx.createRadialGradient(-40, -40, 10, 0, 0, 150); gg.addColorStop(0, '#ff7a7a'); gg.addColorStop(1, '#a00'); ctx.fillStyle = gg; ctx.beginPath(); ctx.ellipse(0, 0, 140, 90, 0, 0, 7); ctx.fill(); }, RED, 40 + 30 * pulse); txt(ctx, 'LAUNCH', '400 42px "Share Tech Mono"', 0, P.cardY ? 128 : 160, 'center', RED, 8); ctx.restore(); }
      // three dossier cards
      const cards = [['CAPTAIN', 'V. SAVITSKY'], ['POLITICAL OFFICER', 'I. MASLENNIKOV'], ['CHIEF OF STAFF', 'V. ARKHIPOV']];
      cards.forEach((c, i) => { const t0 = wt(0) + i * 0.12, u = E.out(seg(t, t0, t0 + 0.35)); if (u <= 0) return; const x = P.cardX0 + i * P.cardStep, y = (P.cardY || 760 + P.top * 0.5) + (1 - u) * 500, w = P.cardW, h = 420;
        ctx.save(); ctx.globalAlpha = u; ctx.translate(x + w / 2, y + h / 2); ctx.rotate((i - 1) * 0.04 * (1 - u * 0.5)); ctx.translate(-w / 2, -h / 2);
        ctx.fillStyle = '#e9e4d6'; ctx.fillRect(-12, -12, w + 24, h + 150); if (i === 2) { ctx.save(); ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.clip(); cover2(ctx, A.arkhipov, 0, 0, w, h, 0.5, 0.3); ctx.restore(); } else silhouette(ctx, 0, 0, w, h);
        txt(ctx, c[0], '400 26px "Share Tech Mono"', w / 2, h + 50, 'center', '#333', 2); txt(ctx, c[1], '400 40px "Anton"', w / 2, h + 105, 'center', '#111', 2); ctx.restore(); });
      stamp(ctx, "YES", P.cardX0 + P.cardW / 2, (P.cardY || 760 + P.top * 0.5) + 240, 120, RED, t, wt(5), -0.15); stamp(ctx, "YES", P.cardX0 + P.cardStep + P.cardW / 2, (P.cardY || 760 + P.top * 0.5) + 240, 120, RED, t, wt(7), 0.1);
      if (t > wt(7) + 0.2) { const q = 0.5 + 0.5 * Math.sin(t * 10); glow(ctx, () => txt(ctx, '?', '400 220px "Anton"', P.cardX0 + 2 * P.cardStep + P.cardW / 2, (P.cardY || 760 + P.top * 0.5) + 300, 'center', `rgba(95,227,255,${0.5 + 0.5 * q})`), CYAN, 40); }
      // persistent text hook
      const u = appear(t, 0, 0.2); ctx.save(); ctx.globalAlpha = u; ctx.fillStyle = 'rgba(0,0,0,0.65)'; ctx.fillRect(40, 120 + P.top, W - 80, 140); ctx.strokeStyle = RED; ctx.lineWidth = 3; ctx.strokeRect(40, 120 + P.top, W - 80, 140); glow(ctx, () => txt(ctx, '1 VOTE FROM THE', '400 52px "Anton"', W / 2, 180 + P.top, 'center', '#fff', 3), '#fff', 10); glow(ctx, () => txt(ctx, 'END OF THE WORLD', '400 64px "Anton"', W / 2, 245 + P.top, 'center', RED, 3), RED, 20); ctx.restore(); },
    third(ctx, t, s) { const P = parallax(ctx, A.arkBgRed, A.arkCutRed, s, t, [0.5, 0.3], RED); const pulse = 0.5 + 0.5 * Math.sin(t * 7); ctx.fillStyle = `rgba(255,0,0,${0.08 + 0.1 * pulse})`; ctx.fillRect(0, 0, W, HH);
      smokeLayer(ctx, A.smoke, t, 0.1, 30); hud(ctx, ['TIMELINE B', 'VOTE 3 OF 3: PENDING'], t, s.t0); reticle(ctx, P(0.5, 0.3), 230, 'V. ARKHIPOV', t, wt(12) - 0.05);
      stamp(ctx, 'YES', W / 2, 1000, 260, RED, t, wt(15), -0.1); },
    disappear(ctx, t, s) { kb(ctx, A.badger, s, t, [0.5, 0.45, 1.0], [0.5, 0.4, 1.3]); embers(ctx, t, 70, 11); smokeLayer(ctx, A.smokeOrange, t, 0.25, 50); leak(ctx, t);
      kin(ctx, 'YOUR WORLD', 700, 170, '#fff', t, wt(21)); kin(ctx, 'DISAPPEARS', 880, 160, RED, t, wt(23)); if (t > wt(23) + 0.25) glitch(ctx, seg(t, wt(23) + 0.25, wt(24)), Math.floor(t * 30)); },
    b59(ctx, t, s) { const r = kb(ctx, A.b59, s, t, [0.48, 0.55, 1.15], [0.48, 0.55, 1.4]); smokeLayer(ctx, A.smoke, t, 0.08, 20); clock(ctx, '23:00', '27 · OCT · 1962', t, s.t0 + 0.02, RED, 420);
      callout(ctx, r.P(0.5, 0.56), [W - P.right, 1150], 'SUBMARINE B-59', 'NUCLEAR TORPEDO ON BOARD', t, s.t0 + 0.4, RED); },
    sonar(ctx, t, s) { ctx.fillStyle = '#02100c'; ctx.fillRect(0, 0, W, HH); const cx = W / 2, cy = 860, R = 470;
      ctx.strokeStyle = 'rgba(95,255,170,0.35)'; ctx.lineWidth = 2; for (let k = 1; k <= 4; k++) { ctx.beginPath(); ctx.arc(cx, cy, (R * k) / 4, 0, 7); ctx.stroke(); } ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R); ctx.stroke();
      const g = ctx.createConicGradient(t * 3, cx, cy); g.addColorStop(0, 'rgba(95,255,170,0.5)'); g.addColorStop(0.12, 'rgba(95,255,170,0)'); g.addColorStop(1, 'rgba(95,255,170,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fill();
      const ships = [[cx + 210, cy - 250], [cx + 300, cy - 150], [cx + 120, cy - 320], [cx + 330, cy - 300]], fire = wt(28), hit = wt(29) + 0.45, u = E.in(seg(t, fire, hit));
      ships.forEach((p) => { if (t < hit) glow(ctx, () => { ctx.fillStyle = '#7dffb8'; ctx.beginPath(); ctx.arc(p[0], p[1], 14, 0, 7); ctx.fill(); }, '#7dffb8'); });
      glow(ctx, () => { ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(cx - 40, cy + 120, 16, 0, 7); ctx.fill(); }, RED); txt(ctx, 'B-59', '400 36px "Share Tech Mono"', cx - 40, cy + 180, 'center', RED, 3);
      if (t > fire) { const p = [lerp(cx - 40, cx + 220, u), lerp(cy + 120, cy - 245, u)]; ctx.save(); ctx.strokeStyle = RED; ctx.lineWidth = 6; ctx.shadowColor = RED; ctx.shadowBlur = 20; ctx.beginPath(); ctx.moveTo(cx - 40, cy + 120); ctx.lineTo(p[0], p[1]); ctx.stroke(); ctx.restore(); glow(ctx, () => { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(p[0], p[1], 12, 0, 7); ctx.fill(); }, RED, 30); }
      if (t > hit) { const v = seg(t, hit, hit + 0.7); const gg = ctx.createRadialGradient(cx + 220, cy - 245, 0, cx + 220, cy - 245, 80 + 900 * v); gg.addColorStop(0, `rgba(255,255,220,${1 - v * 0.4})`); gg.addColorStop(1, 'rgba(255,80,0,0)'); ctx.fillStyle = gg; ctx.fillRect(0, 0, W, HH); shockwave(ctx, [cx + 220, cy - 245], t, hit, 1200); }
      hud(ctx, ['! TORPEDO AWAY', 'WARHEAD: NUCLEAR · ETA 00:0' + Math.max(0, Math.ceil((hit - t) * 2))], t, s.t0, P.hudY); },
    fleet(ctx, t, s) { const fl = wt(37); if (t < fl) { const r = kb(ctx, A.carrier, s, t, [0.5, 0.5, 1.15], [0.55, 0.5, 1.4]); callout(ctx, r.P(0.6, 0.45), [70, 520], 'USS RANDOLPH', 'US AIRCRAFT CARRIER', t, s.t0 + 0.2); reticle(ctx, r.P(0.6, 0.48), 200, 'TARGET', t, s.t0 + 0.9); }
      else { kb(ctx, A.bravo, s, t, [0.5, 0.45, 1.05], [0.5, 0.42, 1.3]); embers(ctx, t, 60, 12); smokeLayer(ctx, A.smokeOrange, t, 0.22, 60); shockwave(ctx, [W / 2, 820], t, fl, 1500); hud(ctx, ['US NAVY TASK GROUP', '! STATUS: NO SIGNAL'], t, fl + 0.1); }
      flash(ctx, t, fl - 0.02, 0.6); },
    kennedy(ctx, t, s) { const P = parallax(ctx, A.kenBg, A.kenCut, s, t, [0.55, 0.38], CYAN); hud(ctx, ['WASHINGTON D.C.', 'INCOMING: UNKNOWN'], t, s.t0); reticle(ctx, P(0.52, 0.42), 170, 'PRESIDENT KENNEDY', t, s.t0 + 0.3, CYAN);
      if (t > wt(46) - 0.1) { const a = 0.25 + 0.22 * Math.sin(t * 14); ctx.fillStyle = `rgba(255,20,20,${a})`; ctx.fillRect(0, 0, W, HH); hud(ctx, ['! DEFCON 1', 'NUCLEAR WAR IMMINENT'], t, wt(46) - 0.1, P.hudY + 200); }
      kin(ctx, 'WORLD WAR III', 900, 170, RED, t, wt(48), -0.04); },
    cuba(ctx, t, s) { const sw = wt(55); if (t < sw) { const r = kb(ctx, A.cubamissiles, s, t, [0.5, 0.5, 1.05], [0.52, 0.55, 1.3]); reticle(ctx, r.P(0.45, 0.62), 180, 'MISSILE SITE', t, wt(54) - 0.1); clock(ctx, '00:00', 'MIDNIGHT', t, s.t0 + 0.02, RED, 760); }
      else { const u = seg(t, sw, s.t1); cover(ctx, A.titan, 0.5, lerp(0.75, 0.45, E.inOut(u)), 1.15 + 0.15 * u); const g = ctx.createRadialGradient(W / 2, HH * 0.82, 0, W / 2, HH * 0.82, 700); g.addColorStop(0, 'rgba(255,220,150,0.8)'); g.addColorStop(1, 'rgba(255,100,0,0)'); ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = g; ctx.fillRect(0, 0, W, HH); ctx.restore(); smokeLayer(ctx, A.smoke, t, 0.3, 90); embers(ctx, t, 40, 21); hud(ctx, ['LAUNCH: CUBA', 'TARGETS: USA'], t, sw); } },
    mapUS(ctx, t, s) { const u = E.inOut(seg(t, s.t0, s.t1)); const P = drawMap(ctx, [0.2, 0.55, lerp(1.0, 1.15, u)]); const hv = P('HAVANA');
      glow(ctx, () => { ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(hv[0], hv[1], 14, 0, 7); ctx.fill(); }, RED, 30);
      [['MIAMI', 58], ['WASHINGTON', 59], ['NEW YORK', 60]].forEach(([n, i]) => { const t0 = wt(i) - 0.45; arc(ctx, hv, P(n), seg(t, t0, wt(i))); blast(ctx, P(n), t, wt(i), n); }); },
    burnNY(ctx, t, s) { kb(ctx, A.nycFire, s, t, [0.5, 0.5, 1.05], [0.5, 0.5, 1.2]); fireGlow(ctx, t); smokeLayer(ctx, A.smokeDark, t, 0.55, 40, 2.6, 'multiply'); embers(ctx, t, 90, 31); kin(ctx, 'GONE BEFORE SUNRISE', 820, 110, '#fff', t, wt(62) + 0.05); hud(ctx, ['NEW YORK CITY', '! SIGNAL LOST'], t, s.t0); },
    noon(ctx, t, s) { const u = seg(t, s.t0, s.t1); cover(ctx, A.titan, 0.5, lerp(0.7, 0.4, E.inOut(u)), 1.1 + 0.15 * u); smokeLayer(ctx, A.smoke, t, 0.25, 90); clock(ctx, '12:00', 'NOON · AMERICA ANSWERS', t, s.t0 + 0.02, AMBER); },
    mapEU(ctx, t, s) { const u = E.inOut(seg(t, s.t0, s.t1)); const P = drawMap(ctx, [0.86, 0.32, lerp(1.0, 1.12, u)]); const src = [P('LONDON')[0] - 700, P('LONDON')[1] + 300];
      [['MOSCOW', 68], ['LENINGRAD', 69], ['BERLIN', 70], ['PARIS', 71], ['LONDON', 72]].forEach(([n, i]) => { const t0 = wt(i) - 0.4; arc(ctx, src, P(n), seg(t, t0, wt(i)), AMBER); blast(ctx, P(n), t, wt(i), n); }); },
    burnMoscow(ctx, t, s) { kb(ctx, A.moscowFire, s, t, [0.5, 0.4, 1.05], [0.5, 0.4, 1.2]); fireGlow(ctx, t); smokeLayer(ctx, A.smokeDark, t, 0.5, 40, 2.6, 'multiply'); embers(ctx, t, 90, 41); kin(ctx, 'GONE', 820, 220, RED, t, wt(73)); },
    ash(ctx, t, s) { kb(ctx, A.nycAsh, s, t, [0.5, 0.5, 1.0], [0.5, 0.48, 1.15]); const d = seg(t, s.t0, wt(79)); ctx.fillStyle = `rgba(20,18,16,${0.15 + d * 0.25})`; ctx.fillRect(0, 0, W, HH);
      const sun = 1 - d; glow(ctx, () => { ctx.fillStyle = `rgba(255,190,90,${0.7 * sun})`; ctx.beginPath(); ctx.arc(780, 520, 100, 0, 7); ctx.fill(); }, 'rgba(255,150,60,0.8)', 80 * sun);
      smokeLayer(ctx, A.smokeDark, t, 0.25 + 0.4 * d, 25, 3, 'multiply');
      const r = H.rng(3); for (let i = 0; i < 220; i++) { const x = (r.range(0, W) + Math.sin(t + i) * 30 + W) % W, y = (r.range(0, HH) + t * r.range(60, 160)) % HH; ctx.fillStyle = `rgba(225,220,210,${r.range(0.3, 0.85)})`; ctx.fillRect(x, y, r.range(2, 6), r.range(2, 6)); }
      hud(ctx, ['SUMMER 1963', '! STATUS: CANCELLED'], t, wt(79) - 0.1, P.hudY); },
    cards(ctx, t, s) { const items = [[83, 'beatles', 'THE BEATLES · 1964'], [85, 'moon', 'MOON LANDING · 1969'], [88, null, 'THE INTERNET'], [90, null, 'iPHONE · 2007'], [92, null, 'YOUTUBE · 2005']];
      let k = 0; for (let i = 0; i < items.length; i++) if (t >= wt(items[i][0] - 1) - 0.08) k = i; const it = items[k], t0 = wt(it[0] - 1) - 0.08, z = 1.12 + 0.08 * seg(t, t0, t0 + 0.9);
      if (it[1]) cover(ctx, A[it[1]], 0.5, 0.45, z);
      else { ctx.fillStyle = '#0b0f14'; ctx.fillRect(0, 0, W, HH); ctx.save(); ctx.translate(W / 2, 760); ctx.scale(z - 0.12, z - 0.12); ctx.strokeStyle = '#fff'; ctx.lineWidth = 10; ctx.fillStyle = '#fff';
        if (k === 2) { ctx.strokeRect(-330, -230, 660, 460); ctx.fillRect(-330, -230, 660, 60); txt(ctx, 'www', '400 150px "Share Tech Mono"', 0, 90, 'center', '#fff'); } else if (k === 3) { ctx.beginPath(); ctx.roundRect(-170, -320, 340, 640, 50); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 270, 22, 0, 7); ctx.stroke(); }
        else { ctx.beginPath(); ctx.roundRect(-270, -180, 540, 360, 70); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-60, -100); ctx.lineTo(110, 0); ctx.lineTo(-60, 100); ctx.closePath(); ctx.fill(); } ctx.restore(); }
      hud(ctx, ['DELETED FROM HISTORY', it[2]], t, t0 - 0.05, P.hudY);
      const x = seg(t, wt(it[0]) - 0.05, wt(it[0]) + 0.12); if (x > 0) { ctx.save(); ctx.translate(W / 2, 760); ctx.strokeStyle = RED; ctx.lineCap = 'round'; ctx.lineWidth = 50; ctx.shadowColor = RED; ctx.shadowBlur = 40; const R = 320 * Math.min(1, x * 1.4); ctx.beginPath(); ctx.moveTo(-R, -R); ctx.lineTo(R, R); ctx.moveTo(R, -R); ctx.lineTo(-R, R); ctx.stroke(); ctx.restore(); }
      glitch(ctx, Math.max(0, 1 - (t - t0) / 0.18), Math.floor(t * 30)); },
    you(ctx, t, s) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, HH); if (t >= wt(94) - 0.05) { kin(ctx, 'YOU', 860, 360, '#fff', t, wt(94)); const g = seg(t, wt(94) + 0.3, wt(95)); if (g > 0) { glitch(ctx, g * 1.5, Math.floor(t * 30)); ctx.fillStyle = `rgba(0,0,0,${g})`; ctx.fillRect(0, 0, W, HH); } } },
    villain(ctx, t, s) { const P = parallax(ctx, A.arkBgRed, A.arkCutRed, s, t, [0.5, 0.3], RED); smokeLayer(ctx, A.smokeOrange, t, 0.15, 30); embers(ctx, t, 50, 51); hud(ctx, ['HISTORY BOOK // TIMELINE B', 'VASILI ARKHIPOV'], t, s.t0);
      if (t >= wt(103) - 0.05) { const u = appear(t, wt(103) - 0.05, 0.3); ctx.save(); ctx.globalAlpha = u; ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 640, W, 260); ctx.restore(); kin(ctx, 'THE MAN WHO', 720, 72, '#fff', t, wt(102)); kin(ctx, 'ENDED THE WORLD', 830, 130, RED, t, wt(104)); } },
    end(ctx, t, s) { const P = parallax(ctx, A.arkBgWarm, A.arkCutWarm, s, t, [0.5, 0.3], '#ffd29a'); leak(ctx, t, '255,200,120', 0.4); hud(ctx, ['TIMELINE A', 'OUR WORLD // HE SAID NO'], t, s.t0);
      stamp(ctx, 'NO', W / 2, 980, 300, CYAN, t, wt(115), -0.06); const fo = seg(t, DURATION - 0.35, DURATION); if (fo > 0) { ctx.fillStyle = `rgba(0,0,0,${fo * 0.6})`; ctx.fillRect(0, 0, W, HH); } },
  };
  // cover an image into a box (used for the dossier photo)
  function cover2(ctx, img, x, y, w, h, cx, cy) { const s = Math.max(w / img.width, h / img.height) * 1.25; ctx.drawImage(img, x + w / 2 - cx * img.width * s, y + h / 2 - cy * img.height * s, img.width * s, img.height * s); }

  // ---------------- captions ----------------
  const CAP_SIZE = 96, CAP_Y = P.capY; const MEAS = H.layer(8, 8).getContext('2d');
  const captions = (ctx, t) => {
    let ci = -1; for (let i = CAPS.length - 1; i >= 0; i--) if (t >= wt(CAPS[i].idx[0]) - 0.08) { ci = i; break; } if (ci < 0) ci = 0;
    const c = CAPS[ci]; if (t > we(c.idx[c.idx.length - 1]) + 0.5) return;
    MEAS.font = `400 ${CAP_SIZE}px "Anton"`; const toks = c.idx.map(tok), ws = toks.map((s) => MEAS.measureText(s).width), sp = 26, total = ws.reduce((a, b) => a + b, 0) + sp * (toks.length - 1); const sc0 = total > 960 ? 960 / total : 1; let x = W / 2 - (total * sc0) / 2;
    ctx.save(); ctx.font = `400 ${CAP_SIZE}px "Anton"`; ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.lineJoin = 'round';
    toks.forEach((s, j) => { const wi = c.idx[j], t0 = wt(wi) - 0.05, w = ws[j] * sc0; if (t >= t0 || (ci === 0 && j === 0)) { const u = ci === 0 && j === 0 ? 1 : E.out(seg(t, t0, t0 + 0.1)), key = s.split(' ').some((p) => KEY.has(p));
      ctx.save(); ctx.globalAlpha = u; ctx.translate(x + w / 2, CAP_Y - (1 - u) * 30); const k = (0.8 + 0.2 * E.back(u)) * sc0; ctx.scale(k, k); ctx.lineWidth = 16; ctx.strokeStyle = '#000'; ctx.strokeText(s, -ws[j] / 2, 0); const col = key ? (RED_KEYS.has(s) ? RED : CYAN) : '#fff'; if (key) { ctx.shadowColor = col; ctx.shadowBlur = 24; } ctx.fillStyle = col; ctx.fillText(s, -ws[j] / 2, 0); ctx.restore(); } x += w + sp * sc0; });
    ctx.restore(); };

  // ---------------- frame with transitions ----------------
  const corners = (ctx) => { ctx.strokeStyle = 'rgba(95,227,255,0.55)'; ctx.lineWidth = 4; const m = 40, l = 70; [[m, m, 1, 1], [W - m, m, -1, 1], [m, HH - m, 1, -1], [W - m, HH - m, -1, -1]].forEach(([x, y, sx, sy]) => { ctx.beginPath(); ctx.moveTo(x, y + sy * l); ctx.lineTo(x, y); ctx.lineTo(x + sx * l, y); ctx.stroke(); }); };
  const shakeAt = (t) => { let a = 0; for (const h of HITS) if (t >= h) a = Math.max(a, Math.exp(-(t - h) * 7) * 24); return a; };
  const renderScene = (ctx, s, t) => { ctx.save(); SCN[s.k](ctx, t, s); ctx.restore(); };
  const TR = 0.2;
  function frame(ctx, t) {
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
    const i = SC.findIndex((x) => t >= x.t0 && t < x.t1), s = SC[i < 0 ? SC.length - 1 : i], prev = SC[i - 1], dt = t - s.t0;
    const sh = shakeAt(t), r = H.rng(Math.floor(t * 60)); ctx.save(); ctx.translate((r() - 0.5) * sh, (r() - 0.5) * sh);
    if (prev && dt < TR && (s.tr === 'whip' || s.tr === 'zoom')) {
      const u = E.inOut(dt / TR), o1 = A.off1.getContext('2d'), o2 = A.off2.getContext('2d');
      o1.setTransform(1, 0, 0, 1, 0, 0); o1.clearRect(0, 0, W, HH); renderScene(o1, prev, t); o2.setTransform(1, 0, 0, 1, 0, 0); o2.clearRect(0, 0, W, HH); renderScene(o2, s, t);
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, HH);
      if (s.tr === 'whip') { for (let g = 0; g < 4; g++) { ctx.globalAlpha = g ? 0.22 : 1; ctx.drawImage(A.off1, -u * W - g * 40, 0); ctx.drawImage(A.off2, (1 - u) * W - g * 40, 0); } }
      else { const z = 1 + u * 0.6; ctx.globalAlpha = 1 - u; ctx.drawImage(A.off1, W / 2 - (W * z) / 2, HH / 2 - (HH * z) / 2, W * z, HH * z); const z2 = 1.4 - 0.4 * u; ctx.globalAlpha = u; ctx.drawImage(A.off2, W / 2 - (W * z2) / 2, HH / 2 - (HH * z2) / 2, W * z2, HH * z2); }
      ctx.globalAlpha = 1;
    } else renderScene(ctx, s, t);
    ctx.restore();
    if (prev && dt < 0.25 && s.tr === 'flash') { ctx.fillStyle = `rgba(255,250,235,${(1 - dt / 0.25) * 0.85})`; ctx.fillRect(0, 0, W, HH); }
    if (prev && dt < 0.1 && s.tr === 'cut') glitch(ctx, 1 - dt / 0.1, Math.floor(t * 60));
    // colour split on hits
    let ca = 0; for (const h of HITS) if (t >= h && t < h + 0.3) ca = Math.max(ca, 1 - (t - h) / 0.3); rgbSplit(ctx, ca);
    // finishing
    ctx.drawImage(A.scan, 0, 0); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = P.grain; ctx.drawImage(A.grain[Math.floor(t * 30) % 6], 0, 0, W, HH); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    const g = ctx.createRadialGradient(W / 2, HH / 2, 450, W / 2, HH / 2, 1250); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.62)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, HH);
    const bg = ctx.createLinearGradient(0, 1220, 0, HH); bg.addColorStop(0, 'rgba(0,0,0,0)'); bg.addColorStop(1, 'rgba(0,0,0,0.6)'); ctx.fillStyle = bg; ctx.fillRect(0, 1220, W, HH - 1220);
    corners(ctx);
    if (s.k !== 'you') captions(ctx, t);
  }

  // ---------------- sound design ----------------
  function scoreSound(k) {
    const D = DURATION;
    const boom = (t, g = 1) => { k.play('impact', t, { gain: 1.2 * g }); k.noise(t, { dur: 2.2, color: 'brown', filter: 'lowpass', f: [[0, 900], [2.2, 120]], gain: 0.55 * g, a: 0.01 }); k.tone(t, { f: [[0, 70], [1.5, 30]], dur: 1.8, gain: 0.35 * g }); };
    const ping = (t, g = 1) => { k.tone(t, { f: 1250, dur: 1.4, gain: 0.12 * g, verb: 0.6 }); k.tone(t, { f: 2500, dur: 0.5, gain: 0.03 * g, verb: 0.6 }); };
    const stat = (t, d = 0.18, g = 1) => k.noise(t, { dur: d, filter: 'highpass', f: 1500, gain: 0.3 * g, a: 0.003 });
    const whip = (t) => k.play('whoosh', t - 0.12, { dur: 0.28, gain: 0.55, top: 3200 });
    const siren = (t0, t1) => { for (let t = t0; t < t1; t += 0.9) k.tone(t, { f: [[0, 520], [0.45, 900], [0.9, 520]], type: 'sawtooth', dur: 0.9, gain: 0.05, filter: 'lowpass', f2: 1800 }); };
    k.tone(0, { f: 'D2', type: 'sawtooth', dur: D, gain: 0.06, a: 0.8, hold: D - 2, filter: 'lowpass', f2: 300 }); k.tone(0, { f: 'A2', type: 'sine', dur: D, gain: 0.05, a: 1.5, hold: D - 3 });
    // hook: alarm pulse + heartbeat, cards slide, button, stamps
    for (let t = 0; t < wt(8); t += 0.75) { k.play('thud', t, { f: 60, gain: 0.8 }); k.play('thud', t + 0.2, { f: 55, gain: 0.55 }); }
    for (let i = 0; i < 3; i++) k.play('swish', wt(0) + i * 0.12, { dur: 0.2, gain: 0.5 });
    k.play('tock', wt(2), { f: 300, gain: 0.7 }); k.tone(wt(2), { f: [[0, 220], [0.3, 440]], type: 'square', dur: 0.35, gain: 0.05, filter: 'lowpass', f2: 1200 });
    k.play('stamp', wt(5), { gain: 1.1 }); k.play('stamp', wt(7), { gain: 1.2 }); k.play('riser', wt(8), { dur: 1.6, gain: 0.6 });
    k.play('tock', wt(12), { f: 800, gain: 0.5 }); k.play('stamp', wt(15), { gain: 1.3 }); boom(wt(15), 0.7);
    boom(wt(17), 0.8); k.play('impact', wt(21), { gain: 0.8 }); k.play('impact', wt(23), { gain: 1.0 }); k.play('glitch', wt(23) + 0.25, { gain: 0.7 });
    SC.forEach((s) => { if (s.tr === 'whip' || s.tr === 'zoom') whip(s.t0); });
    k.play('tock', wt(24) + 0.02, { f: 900, gain: 0.6 }); ping(wt(26)); ping(wt(26) + 1.2, 0.7);
    k.noise(wt(28), { dur: wt(29) + 0.45 - wt(28), filter: 'bandpass', f: [[0, 400], [1.0, 1800]], q: 2, gain: 0.35, a: 0.05 }); boom(wt(29) + 0.45, 0.9);
    k.play('tock', wt(30) + 0.9, { f: 1200, gain: 0.5 }); boom(wt(37), 1.2);
    siren(wt(46) - 0.1, wt(53)); k.play('impact', wt(48), { gain: 1.0 });
    k.play('tock', wt(53) + 0.02, { f: 900, gain: 0.6 }); k.play('riser', wt(54), { dur: 0.8, gain: 0.6 }); k.noise(wt(55), { dur: 2.5, color: 'brown', filter: 'lowpass', f: 400, gain: 0.4, a: 0.2 });
    [58, 59, 60].forEach((i) => { k.play('whoosh', wt(i) - 0.45, { dur: 0.45, gain: 0.5, top: 2600 }); boom(wt(i), 0.8); });
    k.noise(wt(62), { dur: 2.6, color: 'pink', filter: 'bandpass', f: 900, q: 0.5, gain: 0.2, a: 0.3 });
    k.play('tock', wt(65) + 0.02, { f: 700, gain: 0.6 }); k.noise(wt(66), { dur: 2.2, color: 'brown', filter: 'lowpass', f: 400, gain: 0.4, a: 0.2 });
    [68, 69, 70, 71, 72].forEach((i) => { k.play('whoosh', wt(i) - 0.4, { dur: 0.4, gain: 0.45, top: 2600 }); boom(wt(i), 0.65); }); k.play('impact', wt(73), { gain: 1.1 });
    k.noise(wt(74), { dur: wt(82) - wt(74), color: 'pink', filter: 'lowpass', f: 600, gain: 0.18, a: 0.6 });
    [83, 85, 88, 90, 92].forEach((i) => { stat(wt(i - 1) - 0.08, 0.14, 0.8); k.play('error', wt(i), { f: 'A2', gain: 0.6 }); });
    k.play('impact', wt(94), { gain: 0.9 }); stat(wt(94) + 0.3, 0.5, 1.1); k.play('glitch', wt(94) + 0.3, { gain: 0.8 });
    k.tone(wt(95), { f: [[0, 110], [2, 80]], type: 'sawtooth', dur: 3, gain: 0.06, filter: 'lowpass', f2: 600 }); k.play('impact', wt(104), { gain: 1.1 });
    k.play('sparkle', wt(107), { gain: 0.5 }); k.play('stamp', wt(115), { gain: 1.0 }); k.play('impact', wt(115), { gain: 0.8 }); ping(wt(115) + 0.1, 0.8);
  }

  window.explainer = (ctx, W_, H_, t) => frame(ctx, t);
  window.scoreSound = scoreSound; window.DURATION = DURATION;
})();
