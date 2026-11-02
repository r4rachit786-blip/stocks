// ===== "The Timeline Where He Said Yes" — Cold War alt-history Short, 1080x1920 =====
(() => {
  const W = 1080, HH = 1920;
  const CYAN = '#5fe3ff', RED = '#ff2a2a', AMBER = '#ffb23e';
  const E = H.ease, cl = H.clamp, seg = (t, a, b) => cl((t - a) / (b - a)), lerp = H.lerp;
  const WORDS = window.VO_WORDS, wt = (i) => WORDS[i][0], we = (i) => WORDS[i][1];
  const DURATION = we(WORDS.length - 1) + 0.9;
  const appear = (t, t0, d = 0.25) => E.out(seg(t, t0, t0 + d));
  const pop = (t, t0, d = 0.3) => E.back(seg(t, t0, t0 + d));
  const CITY = window.CITIES;

  // ---------------- assets ----------------
  const A = {};
  const loadImg = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
  const filtered = (img, f) => { const c = H.layer(img.width, img.height), x = c.getContext('2d'); x.filter = f; x.drawImage(img, 0, 0); return c; };
  const COLD = 'grayscale(0.85) contrast(1.25) brightness(0.85) sepia(0.15) hue-rotate(160deg) saturate(1.4)';
  window.loadAssets = async () => {
    const names = ['arkhipov', 'b59', 'carrier', 'bravo', 'grable', 'badger', 'beatles', 'moon', 'titan', 'cubamissiles', 'kennedy', 'nyc', 'moscow', 'map'];
    const imgs = await Promise.all(names.map((n) => loadImg('assets/' + n + '.jpg')));
    names.forEach((n, i) => { const im = imgs[i];
      A[n] = n === 'map' ? im : (['bravo', 'grable', 'badger', 'titan', 'moon', 'nyc', 'moscow'].includes(n) ? filtered(im, 'contrast(1.12) saturate(1.15)') : filtered(im, COLD)); });
    A.arkRed = filtered(imgs[0], 'grayscale(1) contrast(1.3) brightness(0.8) sepia(1) hue-rotate(-50deg) saturate(3)');
    A.arkWarm = filtered(imgs[0], 'sepia(0.35) contrast(1.1) brightness(1.05)');
    A.nycAsh = filtered(imgs[names.indexOf('nyc')], 'grayscale(1) contrast(1.05) brightness(1.25)');
    // grain + scanlines
    A.grain = []; for (let s = 0; s < 6; s++) { const c = H.layer(540, 960), x = c.getContext('2d'), d = x.createImageData(540, 960), g = H.rng(500 + s); for (let i = 0; i < d.data.length; i += 4) { const n = 128 + g.gauss() * 30; d.data[i] = d.data[i + 1] = d.data[i + 2] = n; d.data[i + 3] = 255; } x.putImageData(d, 0, 0); A.grain.push(c); }
    const sl = H.layer(W, HH), sx = sl.getContext('2d'); sx.fillStyle = 'rgba(0,0,0,0.16)'; for (let y = 0; y < HH; y += 4) sx.fillRect(0, y, W, 2); A.scan = sl;
  };

  // ---------------- timeline from the voiceover ----------------
  const S = (k, t0, t1, o = {}) => Object.assign({ k, t0, t1 }, o);
  const SC = [
    S('ark', 0, wt(7)),
    S('fire', wt(7), wt(14)),
    S('b59', wt(14), wt(16)),
    S('sonar', wt(16), wt(20)),
    S('carrier', wt(20), wt(28)),
    S('kennedy', wt(28), wt(43)),
    S('cuba', wt(43), wt(48)),
    S('mapUS', wt(48), wt(55)),
    S('titan', wt(55), wt(58)),
    S('mapEU', wt(58), wt(64)),
    S('ash', wt(64), wt(72)),
    S('cards', wt(72), wt(83)),
    S('you', wt(83), wt(85)),
    S('villain', wt(85), wt(97)),
    S('end', wt(97), DURATION + 1),
  ];
  const CUTS = SC.map((s) => s.t0).filter((t) => t > 0);
  const KEY = new Set(['YES', 'NO', 'SATURDAY', 'FLASH', 'GONE', 'WORLD', 'THREE', 'CUBA', 'MIAMI', 'WASHINGTON', 'NEW', 'YORK', 'MOSCOW', 'LENINGRAD', 'EUROPE', 'SUMMER', 'NEVER', 'BEATLES', 'MOON', 'INTERNET', 'IPHONE', 'YOUTUBE', 'YOU', 'ENDED', 'ARKHIPOV', 'TIMELINE', 'NUCLEAR', 'SCARED', 'MIDNIGHT', 'NOON']);
  const RED_KEYS = new Set(['GONE', 'ENDED', 'FLASH', 'NUCLEAR', 'NEVER']);
  // captions: chunks of up to 3 words inside each spoken line
  const CAPS = []; { let cur = null; WORDS.forEach((w, i) => { const line = w[3]; if (!cur || cur.line !== line || cur.idx.length >= 3) { cur = { line, idx: [] }; CAPS.push(cur); } cur.idx.push(i); }); }
  const tok = (i) => WORDS[i][2].toUpperCase().replace(/[.,!?…]/g, '');

  // ---------------- helpers ----------------
  const txt = (ctx, s, font, x, y, align = 'center', fill = '#fff', ls = 0) => { ctx.font = font; ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; ctx.letterSpacing = ls + 'px'; ctx.fillStyle = fill; ctx.fillText(s, x, y); ctx.letterSpacing = '0px'; };
  const cover = (ctx, img, cx, cy, z) => { const s = Math.max(W / img.width, HH / img.height) * z, dw = img.width * s, dh = img.height * s; let x = W / 2 - cx * dw, y = HH / 2 - cy * dh; x = Math.min(0, Math.max(W - dw, x)); y = Math.min(0, Math.max(HH - dh, y)); ctx.drawImage(img, x, y, dw, dh); return { x, y, dw, dh }; };
  const kb = (ctx, img, s, t, f, to) => { const u = E.inOut(seg(t, s.t0, s.t1)); return cover(ctx, img, lerp(f[0], to[0], u), lerp(f[1], to[1], u), lerp(f[2], to[2], u)); };
  const glow = (ctx, fn, color = CYAN, blur = 24) => { ctx.save(); ctx.shadowColor = color; ctx.shadowBlur = blur; fn(); ctx.restore(); };
  const big = (ctx, s, y, size, color, u, rot = 0) => { if (u <= 0) return; ctx.save(); ctx.globalAlpha = Math.min(1, u * 2); ctx.translate(W / 2, y); ctx.rotate(rot); const sc = 1 + (1 - E.out(cl(u))) * 0.5; ctx.scale(sc, sc); ctx.lineJoin = 'round'; ctx.font = `400 ${size}px "Anton"`; ctx.textAlign = 'center'; ctx.lineWidth = size * 0.12; ctx.strokeStyle = 'rgba(0,0,0,0.9)'; ctx.strokeText(s, 0, 0); glow(ctx, () => txt(ctx, s, `400 ${size}px "Anton"`, 0, 0, 'center', color, 4), color, 40); ctx.restore(); };
  // HUD clock / label
  const hud = (ctx, lines, t, t0, y = 230) => { const u = appear(t, t0 + 0.05, 0.3); if (u <= 0) return; ctx.save(); ctx.globalAlpha = u;
    ctx.fillStyle = 'rgba(0,10,16,0.65)'; ctx.fillRect(60, y - 64, 620, 64 + lines.length * 58); ctx.strokeStyle = CYAN; ctx.lineWidth = 2; ctx.strokeRect(60, y - 64, 620, 64 + lines.length * 58);
    lines.forEach((l, i) => glow(ctx, () => txt(ctx, l, `400 ${i ? 40 : 54}px "Share Tech Mono"`, 86, y + i * 58, 'left', i ? CYAN : (l.startsWith('!') ? RED : '#fff'), 3), i ? CYAN : '#fff', 12)); ctx.restore(); };
  const clock = (ctx, time, date, t, t0, color = RED) => { const u = pop(t, t0, 0.3); if (u <= 0) return; ctx.save(); ctx.translate(W / 2, 760); ctx.scale(u, u); ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(-380, -170, 760, 300); ctx.strokeStyle = color; ctx.lineWidth = 4; ctx.strokeRect(-380, -170, 760, 300);
    glow(ctx, () => txt(ctx, time, '400 190px "Share Tech Mono"', 0, 40, 'center', color, 6), color, 40); txt(ctx, date, '400 44px "Share Tech Mono"', 0, 105, 'center', '#fff', 8); ctx.restore(); };
  const flash = (ctx, t, t0, d = 0.5, color = '255,245,220') => { if (t < t0 || t > t0 + d) return; const a = 1 - (t - t0) / d; ctx.fillStyle = `rgba(${color},${a * 0.95})`; ctx.fillRect(0, 0, W, HH); };
  // RGB-split glitch of whatever is on the canvas
  const glitch = (ctx, amt, seed) => { if (amt <= 0.01) return; const r = H.rng(seed); const c = ctx.canvas; for (let i = 0; i < 6; i++) { const y = r.range(0, HH), h = r.range(10, 90), dx = r.range(-80, 80) * amt; ctx.drawImage(c, 0, y, W, h, dx, y, W, h); }
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 0.35 * amt; ctx.fillStyle = 'rgba(255,0,60,1)'; ctx.fillRect(r.range(-20, 20), 0, W, HH); ctx.restore(); };
  const shake = (t, t0, amp = 22, k = 7) => (t < t0 ? 0 : Math.exp(-(t - t0) * k) * amp);

  // ---------------- map strikes ----------------
  const drawMap = (ctx, cam) => { ctx.fillStyle = '#060c12'; ctx.fillRect(0, 0, W, HH); const r = cover(ctx, A.map, cam[0], cam[1], cam[2]); return (n) => [r.x + CITY[n][0] * r.dw, r.y + CITY[n][1] * r.dh]; };
  const arc = (ctx, a, b, u, color = RED) => { if (u <= 0) return; const mx = (a[0] + b[0]) / 2, my = Math.min(a[1], b[1]) - 260, q = (s) => [(1 - s) * (1 - s) * a[0] + 2 * (1 - s) * s * mx + s * s * b[0], (1 - s) * (1 - s) * a[1] + 2 * (1 - s) * s * my + s * s * b[1]];
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 6; ctx.shadowColor = color; ctx.shadowBlur = 20; ctx.beginPath(); ctx.moveTo(a[0], a[1]); for (let i = 1; i <= 40 * u; i++) { const p = q(i / 40); ctx.lineTo(p[0], p[1]); } ctx.stroke(); const e = q(Math.min(1, u)); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(e[0], e[1], 9, 0, 7); ctx.fill(); ctx.restore(); };
  const blast = (ctx, p, t, t0, name) => { if (t < t0) return; const u = seg(t, t0, t0 + 0.9), r = 30 + 260 * E.out(u);
    const g = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], r); g.addColorStop(0, `rgba(255,255,230,${1 - u * 0.6})`); g.addColorStop(0.35, `rgba(255,170,40,${0.9 - u * 0.5})`); g.addColorStop(1, 'rgba(255,40,0,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, 7); ctx.fill();
    ctx.strokeStyle = `rgba(255,220,180,${1 - u})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(p[0], p[1], r * 1.2, 0, 7); ctx.stroke();
    ctx.save(); ctx.lineJoin = 'round'; ctx.font = '400 56px "Anton"'; ctx.textAlign = 'center'; ctx.lineWidth = 8; ctx.strokeStyle = 'rgba(0,0,0,0.9)'; const o = LBL[name] || [0, -70]; ctx.strokeText(name, p[0] + o[0], p[1] + o[1]); txt(ctx, name, '400 56px "Anton"', p[0] + o[0], p[1] + o[1], 'center', '#fff', 2); ctx.restore(); };
  const LBL = { WASHINGTON: [-150, 95], 'NEW YORK': [120, -75], LENINGRAD: [-150, -60], MOSCOW: [-40, 85], PARIS: [70, 85], LONDON: [-110, -70], BERLIN: [40, -70], MIAMI: [-20, -70] };

  // ---------------- scenes ----------------
  const SCN = {
    ark(ctx, t, s) { kb(ctx, A.arkhipov, s, t, [0.5, 0.33, 1.0], [0.5, 0.3, 1.18]);
      hud(ctx, ['TIMELINE B', 'SIMULATION // 27.10.1962'], t, 0.05);
      big(ctx, 'YES', 860, 300, RED, seg(t, wt(6) - 0.05, wt(6) + 0.2), -0.08); },
    fire(ctx, t, s) { kb(ctx, A.badger, s, t, [0.5, 0.45, 1.0], [0.5, 0.42, 1.25]); big(ctx, 'SATURDAY', 760, 170, '#fff', seg(t, wt(13) - 0.05, wt(13) + 0.25)); },
    b59(ctx, t, s) { kb(ctx, A.b59, s, t, [0.5, 0.5, 1.0], [0.55, 0.5, 1.1]); clock(ctx, '23:00', '27 · OCT · 1962', t, s.t0 + 0.05); hud(ctx, ['SUBMARINE B-59', 'NEAR CUBA'], t, s.t0, 230); },
    sonar(ctx, t, s) { // sonar screen: torpedo racing toward the fleet
      ctx.fillStyle = '#02100c'; ctx.fillRect(0, 0, W, HH); const cx = W / 2, cy = 860, R = 470;
      ctx.strokeStyle = 'rgba(95,255,170,0.35)'; ctx.lineWidth = 2; for (let k = 1; k <= 4; k++) { ctx.beginPath(); ctx.arc(cx, cy, (R * k) / 4, 0, 7); ctx.stroke(); } ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R); ctx.stroke();
      const a = t * 2.4; const g = ctx.createConicGradient ? ctx.createConicGradient(a, cx, cy) : null; if (g) { g.addColorStop(0, 'rgba(95,255,170,0.45)'); g.addColorStop(0.12, 'rgba(95,255,170,0)'); g.addColorStop(1, 'rgba(95,255,170,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fill(); }
      const ships = [[cx + 210, cy - 250], [cx + 300, cy - 150], [cx + 120, cy - 320]];
      const u = E.in(seg(t, wt(18), wt(19) + 0.25)), hit = wt(19) + 0.25;
      ships.forEach((p) => { if (t < hit) { glow(ctx, () => { ctx.fillStyle = '#7dffb8'; ctx.beginPath(); ctx.arc(p[0], p[1], 14, 0, 7); ctx.fill(); }, '#7dffb8'); } });
      glow(ctx, () => { ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(cx - 40, cy + 120, 16, 0, 7); ctx.fill(); }, RED); txt(ctx, 'B-59', '400 36px "Share Tech Mono"', cx - 40, cy + 180, 'center', RED, 3);
      if (t > wt(18)) { const p = [lerp(cx - 40, cx + 210, u), lerp(cy + 120, cy - 250, u)]; ctx.strokeStyle = RED; ctx.setLineDash([12, 10]); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cx - 40, cy + 120); ctx.lineTo(p[0], p[1]); ctx.stroke(); ctx.setLineDash([]); glow(ctx, () => { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(p[0], p[1], 10, 0, 7); ctx.fill(); }, RED); }
      if (t > hit) { const v = seg(t, hit, hit + 0.6); const gg = ctx.createRadialGradient(cx + 210, cy - 250, 0, cx + 210, cy - 250, 60 + 500 * v); gg.addColorStop(0, `rgba(255,255,220,${1 - v * 0.5})`); gg.addColorStop(1, 'rgba(255,80,0,0)'); ctx.fillStyle = gg; ctx.fillRect(0, 0, W, HH); }
      hud(ctx, ['! TORPEDO AWAY', 'WARHEAD: NUCLEAR'], t, s.t0, 230); },
    carrier(ctx, t, s) { const fl = wt(27); if (t < fl) kb(ctx, A.carrier, s, t, [0.5, 0.5, 1.0], [0.52, 0.5, 1.15]); else kb(ctx, A.bravo, s, t, [0.5, 0.45, 1.05], [0.5, 0.42, 1.2]); hud(ctx, ['US NAVY TASK GROUP', 'STATUS: ' + (t < fl ? 'ACTIVE' : 'NO SIGNAL')], t, s.t0); flash(ctx, t, fl - 0.02, 0.6); },
    kennedy(ctx, t, s) { kb(ctx, A.kennedy, s, t, [0.45, 0.35, 1.0], [0.45, 0.32, 1.2]); hud(ctx, ['WASHINGTON D.C.', 'DEFCON 2 → 1'], t, s.t0);
      if (t > wt(36)) { const a = 0.25 + 0.2 * Math.sin(t * 14); ctx.fillStyle = `rgba(255,20,20,${a})`; ctx.fillRect(0, 0, W, HH); }
      big(ctx, 'WORLD WAR III', 820, 160, RED, seg(t, wt(38) - 0.05, wt(38) + 0.25), -0.04); },
    cuba(ctx, t, s) { if (t < wt(45)) kb(ctx, A.cubamissiles, s, t, [0.5, 0.5, 1.0], [0.5, 0.5, 1.15]); else kb(ctx, A.titan, s, t, [0.5, 0.6, 1.0], [0.5, 0.4, 1.15]); clock(ctx, '00:00', 'MIDNIGHT', t, s.t0 + 0.02); hud(ctx, ['LAUNCH SITES: CUBA', 'TARGETS: USA'], t, s.t0 + 0.3, 230); },
    mapUS(ctx, t, s) { const u = E.inOut(seg(t, s.t0, s.t1)); const P = drawMap(ctx, [0.2, 0.55, lerp(1.0, 1.12, u)]); const hv = P('HAVANA');
      [['MIAMI', 48], ['WASHINGTON', 49], ['NEW YORK', 50]].forEach(([n, i]) => { const t0 = wt(i) - 0.45; arc(ctx, hv, P(n), seg(t, t0, wt(i))); blast(ctx, P(n), t, wt(i), n); });
      hud(ctx, ['IMPACTS: 3', 'GONE BEFORE SUNRISE'], t, wt(52) - 0.1, 230); },
    titan(ctx, t, s) { kb(ctx, A.titan, s, t, [0.5, 0.7, 1.05], [0.5, 0.35, 1.25]); clock(ctx, '12:00', 'NOON · AMERICA ANSWERS', t, s.t0 + 0.02, AMBER); },
    mapEU(ctx, t, s) { const u = E.inOut(seg(t, s.t0, s.t1)); const P = drawMap(ctx, [0.86, 0.32, lerp(1.0, 1.1, u)]);
      const src = [P('LONDON')[0] - 700, P('LONDON')[1] + 300];
      [['MOSCOW', 58], ['LENINGRAD', 59], ['BERLIN', 60], ['PARIS', 61], ['LONDON', 62]].forEach(([n, i]) => { const t0 = wt(i) - 0.4; arc(ctx, src, P(n), seg(t, t0, wt(i)), AMBER); blast(ctx, P(n), t, wt(i), n); }); },
    ash(ctx, t, s) { kb(ctx, A.nycAsh, s, t, [0.5, 0.5, 1.0], [0.5, 0.48, 1.12]); const d = seg(t, s.t0, wt(68)); ctx.fillStyle = `rgba(20,18,16,${0.12 + d * 0.22})`; ctx.fillRect(0, 0, W, HH);
      const sun = 1 - d; ctx.fillStyle = `rgba(255,190,90,${0.6 * sun})`; ctx.beginPath(); ctx.arc(780, 420, 90, 0, 7); ctx.fill();
      const r = H.rng(3); for (let i = 0; i < 160; i++) { const x = (r.range(0, W) + Math.sin(t + i) * 30) % W, y = (r.range(0, HH) + t * r.range(60, 160)) % HH; ctx.fillStyle = `rgba(220,215,205,${r.range(0.3, 0.8)})`; ctx.fillRect(x, y, r.range(2, 5), r.range(2, 5)); }
      hud(ctx, ['SUMMER 1963', 'STATUS: CANCELLED'], t, wt(69) - 0.1, 230); },
    cards(ctx, t, s) { // rapid "deleted from history" cards
      const items = [[73, 'beatles', 'THE BEATLES · 1964'], [75, 'moon', 'MOON LANDING · 1969'], [78, null, 'THE INTERNET'], [80, null, 'iPHONE'], [82, null, 'YOUTUBE']];
      let k = 0; for (let i = 0; i < items.length; i++) if (t >= wt(items[i][0]) - 0.25) k = i; const it = items[k], t0 = wt(it[0]) - 0.25;
      if (it[1]) cover(ctx, A[it[1]], 0.5, 0.45, 1.05 + 0.05 * seg(t, t0, t0 + 1));
      else { ctx.fillStyle = '#0b0f14'; ctx.fillRect(0, 0, W, HH); ctx.save(); ctx.translate(W / 2, 760); ctx.strokeStyle = '#fff'; ctx.lineWidth = 10; ctx.fillStyle = '#fff';
        if (k === 2) { ctx.strokeRect(-330, -230, 660, 460); ctx.fillRect(-330, -230, 660, 60); txt(ctx, 'www', '400 150px "Share Tech Mono"', 0, 90, 'center', '#fff'); }
        else if (k === 3) { ctx.beginPath(); ctx.roundRect(-170, -320, 340, 640, 50); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 270, 22, 0, 7); ctx.stroke(); }
        else { ctx.beginPath(); ctx.roundRect(-270, -180, 540, 360, 70); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-60, -100); ctx.lineTo(110, 0); ctx.lineTo(-60, 100); ctx.closePath(); ctx.fill(); }
        ctx.restore(); }
      hud(ctx, ['DELETED FROM HISTORY', it[2]], t, t0 - 0.05, 230);
      const x = seg(t, wt(it[0]) - 0.05, wt(it[0]) + 0.15); if (x > 0) { ctx.save(); ctx.translate(W / 2, 760); ctx.strokeStyle = RED; ctx.lineCap = 'round'; ctx.lineWidth = 46; ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 30; const R = 300 * Math.min(1, x * 1.4); ctx.beginPath(); ctx.moveTo(-R, -R); ctx.lineTo(R, R); ctx.moveTo(R, -R); ctx.lineTo(-R, R); ctx.stroke(); ctx.restore(); }
      glitch(ctx, Math.max(0, 1 - (t - t0) / 0.18), Math.floor(t * 30)); },
    you(ctx, t, s) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, HH); const u = appear(t, wt(84) - 0.05, 0.15); if (u > 0) { big(ctx, 'YOU', 860, 330, '#fff', u); const g = seg(t, wt(84) + 0.35, wt(84) + 0.9); if (g > 0) { glitch(ctx, g, Math.floor(t * 30)); ctx.fillStyle = `rgba(0,0,0,${g})`; ctx.fillRect(0, 0, W, HH); } } },
    villain(ctx, t, s) { kb(ctx, A.arkRed, s, t, [0.5, 0.32, 1.25], [0.5, 0.3, 1.05]); hud(ctx, ['HISTORY BOOK // TIMELINE B', 'VASILI ARKHIPOV'], t, s.t0);
      const u = appear(t, wt(94) - 0.05, 0.3); if (u > 0) { ctx.save(); ctx.globalAlpha = u; ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 640, W, 250); txt(ctx, 'THE MAN WHO', '400 70px "Anton"', W / 2, 735, 'center', '#fff', 4); glow(ctx, () => txt(ctx, 'ENDED THE WORLD', '400 120px "Anton"', W / 2, 860, 'center', RED, 4), RED, 30); ctx.restore(); } },
    end(ctx, t, s) { kb(ctx, A.arkWarm, s, t, [0.5, 0.3, 1.05], [0.5, 0.33, 1.0]); hud(ctx, ['TIMELINE A', 'OUR WORLD // HE SAID NO'], t, s.t0);
      big(ctx, 'NO', 860, 340, CYAN, seg(t, wt(105) - 0.05, wt(105) + 0.2), -0.05);
      const fo = seg(t, DURATION - 0.35, DURATION); if (fo > 0) { ctx.fillStyle = `rgba(0,0,0,${fo * 0.6})`; ctx.fillRect(0, 0, W, HH); } },
  };

  // ---------------- captions ----------------
  const CAP_SIZE = 96, CAP_Y = 1390;
  const MEAS = H.layer(8, 8).getContext('2d');
  const captions = (ctx, t) => {
    let ci = 0; for (let i = CAPS.length - 1; i >= 0; i--) if (t >= wt(CAPS[i].idx[0]) - 0.08) { ci = i; break; }
    const c = CAPS[ci]; if (t > we(c.idx[c.idx.length - 1]) + 0.6) return;
    MEAS.font = `400 ${CAP_SIZE}px "Anton"`; const toks = c.idx.map(tok), ws = toks.map((s) => MEAS.measureText(s).width), sp = 26, total = ws.reduce((a, b) => a + b, 0) + sp * (toks.length - 1);
    const sc0 = total > 960 ? 960 / total : 1; let x = W / 2 - (total * sc0) / 2;
    ctx.save(); ctx.font = `400 ${CAP_SIZE}px "Anton"`; ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.lineJoin = 'round';
    toks.forEach((s, j) => { const wi = c.idx[j], t0 = wt(wi) - 0.05, w = ws[j] * sc0; if (t >= t0 || ci === 0) { const u = ci === 0 && j === 0 ? 1 : E.out(seg(t, t0, t0 + 0.1)), key = [...s.split(' ')].some((p) => KEY.has(p));
      ctx.save(); ctx.globalAlpha = u; ctx.translate(x + w / 2, CAP_Y); const k = (0.8 + 0.2 * E.back(u)) * sc0; ctx.scale(k, k); ctx.lineWidth = 16; ctx.strokeStyle = '#000'; ctx.strokeText(s, -ws[j] / 2, 0);
      const col = key ? (RED_KEYS.has(s) ? RED : CYAN) : '#fff'; if (key) { ctx.shadowColor = col; ctx.shadowBlur = 24; } ctx.fillStyle = col; ctx.fillText(s, -ws[j] / 2, 0); ctx.restore(); } x += w + sp * sc0; });
    ctx.restore();
  };

  // ---------------- frame ----------------
  const corners = (ctx) => { ctx.strokeStyle = 'rgba(95,227,255,0.55)'; ctx.lineWidth = 4; const m = 40, l = 70; [[m, m, 1, 1], [W - m, m, -1, 1], [m, HH - m, 1, -1], [W - m, HH - m, -1, -1]].forEach(([x, y, sx, sy]) => { ctx.beginPath(); ctx.moveTo(x, y + sy * l); ctx.lineTo(x, y); ctx.lineTo(x + sx * l, y); ctx.stroke(); }); };
  function frame(ctx, t) {
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
    const s = SC.find((x) => t >= x.t0 && t < x.t1) || SC[SC.length - 1];
    let sh = 0; [wt(27), wt(19) + 0.25, wt(48), wt(49), wt(50), wt(58), wt(59), wt(60), wt(61), wt(62)].forEach((b) => (sh = Math.max(sh, shake(t, b))));
    const r = H.rng(Math.floor(t * 60)); ctx.save(); ctx.translate((r() - 0.5) * sh, (r() - 0.5) * sh);
    SCN[s.k](ctx, t, s); ctx.restore();
    // cut glitch
    for (const c of CUTS) { const d = t - c; if (d >= 0 && d < 0.12) glitch(ctx, 1 - d / 0.12, Math.floor(t * 60) + 9); }
    // finishing: scanlines, grain, vignette, HUD corners
    ctx.drawImage(A.scan, 0, 0); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.35; ctx.drawImage(A.grain[Math.floor(t * 30) % 6], 0, 0, W, HH); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    const g = ctx.createRadialGradient(W / 2, HH / 2, 450, W / 2, HH / 2, 1250); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.6)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, HH);
    const bg = ctx.createLinearGradient(0, 1200, 0, HH); bg.addColorStop(0, 'rgba(0,0,0,0)'); bg.addColorStop(1, 'rgba(0,0,0,0.55)'); ctx.fillStyle = bg; ctx.fillRect(0, 1200, W, HH - 1200);
    corners(ctx);
    if (s.k !== 'you') captions(ctx, t);
  }

  // ---------------- sound design (no music: user adds a track) ----------------
  function scoreSound(k) {
    const D = DURATION;
    const boom = (t, g = 1) => { k.play('impact', t, { gain: 1.2 * g }); k.noise(t, { dur: 2.2, color: 'brown', filter: 'lowpass', f: [[0, 900], [2.2, 120]], gain: 0.55 * g, a: 0.01 }); k.tone(t, { f: [[0, 70], [1.5, 30]], dur: 1.8, gain: 0.35 * g }); };
    const ping = (t, g = 1) => { k.tone(t, { f: 1250, dur: 1.4, gain: 0.12 * g, verb: 0.6 }); k.tone(t, { f: 2500, dur: 0.5, gain: 0.03 * g, verb: 0.6 }); };
    const stat = (t, d = 0.18, g = 1) => k.noise(t, { dur: d, filter: 'highpass', f: 1500, gain: 0.3 * g, a: 0.003 });
    const siren = (t0, t1) => { for (let t = t0; t < t1; t += 0.9) k.tone(t, { f: [[0, 520], [0.45, 900], [0.9, 520]], type: 'sawtooth', dur: 0.9, gain: 0.05, filter: 'lowpass', f2: 1800 }); };
    // drone bed
    k.tone(0, { f: 'D2', type: 'sawtooth', dur: D, gain: 0.06, a: 1.2, hold: D - 2.5, filter: 'lowpass', f2: 300 });
    k.tone(0, { f: 'A2', type: 'sine', dur: D, gain: 0.05, a: 2, hold: D - 3 });
    // heartbeat under the hook
    for (let t = 0.1; t < wt(7); t += 0.8) { k.play('thud', t, { f: 60, gain: 0.8 }); k.play('thud', t + 0.2, { f: 55, gain: 0.55 }); }
    k.play('stamp', wt(6), { gain: 1.0 }); stat(wt(6), 0.25);
    boom(wt(7) + 0.05, 0.6); k.play('impact', wt(13), { gain: 0.8 });
    // clocks, sonar, torpedo
    k.play('tock', wt(14) + 0.05, { f: 900, gain: 0.6 }); ping(wt(16)); ping(wt(16) + 1.3, 0.7);
    k.noise(wt(18), { dur: 1.0, filter: 'bandpass', f: [[0, 400], [1.0, 1600]], q: 2, gain: 0.3, a: 0.05 }); boom(wt(19) + 0.25, 0.9);
    boom(wt(27), 1.1);
    siren(wt(36), wt(43)); k.play('impact', wt(38), { gain: 0.9 });
    k.play('tock', wt(43) + 0.02, { f: 900, gain: 0.6 }); k.play('riser', wt(44), { dur: 0.9, gain: 0.6 });
    [48, 49, 50].forEach((i) => { k.play('whoosh', wt(i) - 0.45, { dur: 0.45, gain: 0.5, top: 2600 }); boom(wt(i), 0.8); });
    k.play('tock', wt(55) + 0.02, { f: 700, gain: 0.6 }); k.play('riser', wt(56), { dur: 0.8, gain: 0.6 });
    [58, 59, 60, 61, 62].forEach((i) => { k.play('whoosh', wt(i) - 0.4, { dur: 0.4, gain: 0.45, top: 2600 }); boom(wt(i), 0.7); });
    k.noise(wt(64), { dur: wt(72) - wt(64), color: 'pink', filter: 'lowpass', f: 600, gain: 0.18, a: 0.6 });
    [73, 75, 78, 80, 82].forEach((i) => { stat(wt(i) - 0.25, 0.14, 0.8); k.play('error', wt(i), { f: 'A2', gain: 0.6 }); });
    stat(wt(84) + 0.35, 0.5, 1.1); k.play('glitch', wt(84) + 0.35, { gain: 0.8 });
    k.tone(wt(85), { f: [[0, 110], [2, 80]], type: 'sawtooth', dur: 3, gain: 0.06, filter: 'lowpass', f2: 600 }); k.play('impact', wt(94), { gain: 1.0 });
    k.play('sparkle', wt(97), { gain: 0.5 }); k.play('impact', wt(105), { gain: 0.8 }); ping(wt(105) + 0.1, 0.8);
  }

  window.explainer = (ctx, W_, H_, t) => frame(ctx, t);
  window.scoreSound = scoreSound; window.DURATION = DURATION;
})();
