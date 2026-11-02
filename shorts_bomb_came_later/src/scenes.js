  // ---------------- scene helpers ----------------
  const imagined = (ctx, t, t0) => { const u = appear(t, t0 + 0.1, 0.25); if (u <= 0) return; ctx.save(); ctx.globalAlpha = u * 0.9; const x = W - P.right - 20, y = 150 + P.top;
    ctx.font = '400 30px "Share Tech Mono"'; ctx.letterSpacing = '5px'; const w = ctx.measureText('IMAGINED').width + 34; ctx.letterSpacing = '0px'; ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(x - w, y - 34, w, 50); ctx.strokeStyle = CYAN; ctx.lineWidth = 2; ctx.strokeRect(x - w, y - 34, w, 50);
    ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(x - w + 16, y - 9, 6, 0, 7); ctx.fill(); txt(ctx, 'IMAGINED', '400 30px "Share Tech Mono"', x - 14, y + 2, 'right', '#fff', 5); ctx.restore(); };
  const fmt = (n) => Math.round(n).toLocaleString('en-US');
  const counter = (ctx, t, t0, t1, to, y, size, color, prefix = '', suffix = '') => { if (t < t0) return; const u = E.out(seg(t, t0, t1)), v = to * u; ctx.save(); ctx.translate(W / 2, y); const k = t < t1 ? 1 + 0.03 * Math.sin(t * 60) : 1 + 0.12 * Math.exp(-(t - t1) * 10); ctx.scale(k, k);
    ctx.font = `400 ${size}px "Anton"`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.lineWidth = size * 0.12; ctx.strokeStyle = 'rgba(0,0,0,0.9)'; const s = prefix + fmt(v) + suffix; ctx.strokeText(s, 0, 0); ctx.shadowColor = color; ctx.shadowBlur = 40; ctx.fillStyle = color; ctx.fillText(s, 0, 0); ctx.restore(); };
  const label = (ctx, s, y, size, color, t, t0) => { const u = appear(t, t0, 0.2); if (u <= 0) return; ctx.save(); ctx.globalAlpha = u; ctx.font = `400 ${size}px "Share Tech Mono"`; ctx.letterSpacing = '6px'; const w = ctx.measureText(s).width + 50; ctx.letterSpacing = '0px';
    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(W / 2 - w / 2, y - size * 0.85, w * u, size * 1.35); txt(ctx, s, `400 ${size}px "Share Tech Mono"`, W / 2, y + size * 0.2, 'center', color, 6); ctx.restore(); };
  const button = (ctx, s, x, y, color, t, t0) => { const u = pop(t, t0, 0.3); if (u <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(u, u); const w = 400, h = 150, r = 30, pulse = 1 + 0.03 * Math.sin((t - t0) * 8); ctx.scale(pulse, pulse);
    ctx.shadowColor = color; ctx.shadowBlur = 40; ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, r); ctx.fill(); ctx.shadowColor = 'transparent'; ctx.lineWidth = 6; ctx.strokeStyle = '#fff'; ctx.stroke();
    txt(ctx, s, '400 92px "Anton"', 0, 32, 'center', '#fff', 4); ctx.restore(); };
  const quote = (ctx, q, who, t, t0) => { const u = appear(t, t0, 0.3); if (u <= 0) return; ctx.save(); ctx.globalAlpha = u; ctx.translate(0, (1 - u) * 40); const x = 90, y = 640, w = W - 180, h = 420;
    ctx.fillStyle = 'rgba(245,236,214,0.94)'; ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 40; ctx.fillRect(x, y, w, h); ctx.shadowColor = 'transparent'; ctx.fillStyle = RED; ctx.fillRect(x, y, 14, h);
    txt(ctx, '“', '400 220px "Anton"', x + 50, y + 190, 'left', RED); q.forEach((l, i) => txt(ctx, l, '400 92px "Anton"', x + 70, y + 160 + i * 104, 'left', '#1a1410', 2)); txt(ctx, who, '400 40px "Share Tech Mono"', x + w - 40, y + h - 40, 'right', '#5a4a3a', 4); ctx.restore(); };
  const vhs = (ctx, t, amt) => { const r = H.rng(Math.floor(t * 40)); for (let i = 0; i < 9; i++) { const y = r.range(0, HH), h = r.range(6, 60); ctx.drawImage(ctx.canvas, 0, y, W, h, r.range(-80, 80) * amt, y, W, h); } ctx.fillStyle = `rgba(255,255,255,${0.08 * amt})`; for (let i = 0; i < 30; i++) ctx.fillRect(0, r.range(0, HH), W, r.range(1, 4)); };
  const typeOn = (ctx, s, x, y, size, t, t0, cps, col = '#fff') => { if (t < t0) return; const n = Math.min(s.length, Math.floor((t - t0) * cps) + 1); ctx.save(); ctx.font = `400 ${size}px "Share Tech Mono"`; ctx.lineJoin = 'round'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.lineWidth = size * 0.14; ctx.strokeStyle = 'rgba(0,0,0,0.85)'; ctx.strokeText(s.slice(0, n), x, y); ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 20; ctx.fillText(s.slice(0, n), x, y); ctx.restore(); };
  const clockFace = (ctx, p, rad, t, speed) => { ctx.save(); ctx.translate(p[0], p[1]); ctx.strokeStyle = '#1a1410'; ctx.lineCap = 'round'; const a1 = t * speed, a2 = t * speed / 12; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(a2) * rad * 0.5, -Math.cos(a2) * rad * 0.5); ctx.stroke(); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(a1) * rad * 0.8, -Math.cos(a1) * rad * 0.8); ctx.stroke(); ctx.restore(); };
  const mapPt = (p, r) => [r.x + (p[0] / 1080) * r.dw, r.y + (p[1] / 1920) * r.dh];

  // ---------------- scenes ----------------
  const SCN = {
    hook(ctx, t, s) { if (t < 0.1) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, HH); return; }
      const r = kb(ctx, A.cloud, s, t, [0.5, 0.45, 1.0], [0.5, 0.4, 1.28]); if (t > wt(4) - 0.05) { const u = seg(t, wt(4), wt(4) + 0.2); ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 0.35 * (1 - u); ctx.drawImage(A.cloudHot, 0, 0, W, HH); ctx.restore(); }
      if (t > wt(4) - 0.05 && t < wt(8) + 0.4) { const a = 0.14 + 0.1 * Math.sin(t * 14); ctx.fillStyle = `rgba(200,20,30,${a})`; ctx.fillRect(0, 0, W, HH); }
      kin(ctx, 'NO A-BOMB', 380 + P.top, 150, '#fff', t, wt(0) + 0.1); kin(ctx, '= WORLD WAR III?', 540 + P.top, 110, RED, t, wt(4), -0.03); stamp(ctx, '1950', W / 2, 1060, 170, RED, t, wt(8), -0.08);
      flash(ctx, t, 0.1, 0.6, '255,250,235'); },
    rewind(ctx, t, s) { const u = seg(t, s.t0, s.t1); cover(ctx, A.cloud, 0.5, 0.4, 1.3 - 0.35 * E.inOut(u)); ctx.save(); ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = '#000'; ctx.globalAlpha = 0.6; ctx.fillRect(0, 0, W, HH); ctx.restore(); vhs(ctx, t, 1);
      hud(ctx, ['◀◀ REWIND', 'TIMELINE B'], t, s.t0); kin(ctx, "HERE'S HOW", 960, 130, CYAN, t, wt(9)); },
    cancel(ctx, t, s) { const r = kb(ctx, A.desk, s, t, [0.5, 0.5, 1.05], [0.56, 0.52, 1.3]); hud(ctx, ['1942', 'WASHINGTON, D.C.'], t, s.t0); imagined(ctx, t, s.t0);
      kin(ctx, 'MANHATTAN PROJECT', 1150, 92, '#fff', t, wt(16)); stamp(ctx, 'CANCELLED', W / 2, 900, 130, RED, t, wt(14), -0.14); },
    jets(ctx, t, s) { const z = t > wt(28) ? 1.18 + 0.1 * seg(t, wt(28), s.t1) : 1.05 + 0.1 * seg(t, s.t0, wt(28)); cover(ctx, A.hangar, 0.45, 0.62, z); imagined(ctx, t, s.t0);
      counter(ctx, t, wt(18) - 0.05, wt(20) + 0.2, 2000000000, 700, 112, GOLD, '$'); label(ctx, '100,000 WORKERS', 830, 50, '#fff', t, wt(23)); kin(ctx, '→ JETS & RADAR', 1080, 120, CYAN, t, wt(28)); },
    calm(ctx, t, s) { kb(ctx, A.street, s, t, [0.5, 0.75, 1.25], [0.5, 0.25, 1.12]); hud(ctx, ['AUG 6, 1945', 'HIROSHIMA, 8:15 AM'], t, s.t0); imagined(ctx, t, s.t0);
      typeOn(ctx, 'NO FLASH.', W / 2, 760, 110, t, wt(34), 14); typeOn(ctx, 'NOTHING HAPPENS.', W / 2, 900, 74, t, wt(36), 18, CYAN); },
    invasion(ctx, t, s) { const r = kb(ctx, A.fleet, s, t, [0.5, 0.35, 1.25], [0.5, 0.6, 1.05]); smokeLayer(ctx, A.smokeDark, t, 0.18, 50, 2.6, 'multiply'); hud(ctx, ['NOV 1, 1945', '!OPERATION DOWNFALL'], t, s.t0); imagined(ctx, t, s.t0);
      [wt(43), wt(47)].forEach((h) => flash(ctx, t, h, 0.18, '255,210,150')); kin(ctx, 'BIGGEST INVASION', 930, 120, '#fff', t, wt(43)); kin(ctx, 'IN HISTORY', 1060, 100, RED, t, wt(46)); },
    medals(ctx, t, s) { kb(ctx, A.medals, s, t, [0.5, 0.85, 1.35], [0.5, 0.5, 1.02]); counter(ctx, t, wt(49) - 0.05, wt(53), 500000, 700, 170, '#fff'); kin(ctx, 'PURPLE HEARTS', 860, 110, '#b26cff', t, wt(52)); label(ctx, 'MADE FOR THE INVASION · REAL', 990, 40, CYAN, t, wt(55)); },
    hokkaido(ctx, t, s) { kb(ctx, A.soviets, s, t, [0.55, 0.45, 1.25], [0.5, 0.5, 1.05]); hud(ctx, ['!HOKKAIDO', 'SOVIET LANDING'], t, s.t0); imagined(ctx, t, s.t0); },
    split(ctx, t, s) { const z = 1.05 + 0.08 * seg(t, s.t0, s.t1), r = cover(ctx, A.map_japan, 0.55, 0.45, z); imagined(ctx, t, s.t0);
      const u = seg(t, wt(64) - 0.1, wt(64) + 0.35), a = mapPt(JP.line[0], r), b = mapPt(JP.line[1], r);
      if (u > 0) { ctx.save(); ctx.globalAlpha = 0.75 * u; ctx.drawImage(A.north, r.x, r.y, r.dw, r.dh); ctx.globalAlpha = 0.6 * u; ctx.drawImage(A.south, r.x, r.y, r.dw, r.dh); ctx.restore();
        ctx.save(); ctx.strokeStyle = RED; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.shadowColor = RED; ctx.shadowBlur = 30; ctx.setLineDash([40, 22]); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(lerp(a[0], b[0], E.out(u)), lerp(a[1], b[1], E.out(u))); ctx.stroke(); ctx.restore(); }
      mapLabel(ctx, mapPt(JP.north_label, r), 'NORTH JAPAN', 70, RED, seg(t, wt(65) - 0.1, wt(65) + 0.15)); mapLabel(ctx, mapPt(JP.south_label, r), 'SOUTH JAPAN', 70, '#7fb2ff', seg(t, wt(66) - 0.1, wt(66) + 0.15)); },
    standoff(ctx, t, s) { const beat = Math.max(Math.exp(-((t - wt(70)) ** 2) * 200), Math.exp(-((t - wt(72)) ** 2) * 200)); kb(ctx, A.standoff, s, t, [0.5, 0.45, 1.05 + 0.04 * beat], [0.5, 0.45, 1.25 + 0.04 * beat]); imagined(ctx, t, s.t0);
      kin(ctx, 'NO NUKES', 820, 140, '#fff', t, wt(69)); kin(ctx, '= NO FEAR', 970, 120, RED, t, wt(70)); },
    ww3(ctx, t, s) { kb(ctx, A.tanks, s, t, [0.5, 0.55, 1.3], [0.55, 0.45, 1.05]); fireGlow(ctx, t, 0.55); embers(ctx, t, 70, 31); imagined(ctx, t, s.t0);
      kin(ctx, 'HOT TAKE:', 560 + P.top, 100, CYAN, t, wt(74)); kin(ctx, 'WORLD WAR III', 720 + P.top, 150, RED, t, wt(76), -0.03); stamp(ctx, '1950', W / 2, 920, 130, RED, t, wt(82), 0.08); kin(ctx, 'TANKS, NOT MISSILES', 1100, 90, '#fff', t, wt(83)); },
    rocket(ctx, t, s) { kb(ctx, A.rocket, s, t, [0.5, 0.3, 1.25], [0.5, 0.6, 1.05]); imagined(ctx, t, s.t0); if (t > wt(90)) vhs(ctx, t, 0.6 * (1 - seg(t, wt(91), wt(91) + 0.4)));
      stamp(ctx, 'NO SPUTNIK', W / 2, 1000, 130, RED, t, wt(91), -0.1); },
    moon(ctx, t, s) { kb(ctx, A.moon, s, t, [0.5, 0.65, 1.2], [0.5, 0.62, 1.05]); const f = seg(t, wt(94), s.t1); if (f > 0) { ctx.save(); ctx.globalAlpha = f; cover(ctx, A.moonBlur, 0.5, 0.63, lerp(1.2, 1.05, seg(t, s.t0, s.t1))); ctx.restore(); } imagined(ctx, t, s.t0);
      stamp(ctx, 'NO MOON', W / 2, 640, 140, RED, t, wt(93), -0.08); kin(ctx, '1969', 860, 130, '#fff', t, wt(96)); },
    other(ctx, t, s) { kb(ctx, A.study, s, t, [0.6, 0.35, 1.25], [0.62, 0.32, 1.45]); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, 0, W, HH);
      quote(ctx, ['JAPAN WAS', 'ALREADY BEATEN.'], '— SOME HISTORIANS', t, wt(97)); kin(ctx, 'MAYBE.', 1220, 120, CYAN, t, wt(105)); },
    twist(ctx, t, s) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, HH); const u = appear(t, wt(108), 0.15); if (u > 0) { ctx.save(); ctx.globalAlpha = u; glow(ctx, () => txt(ctx, 'THE TWIST', '400 190px "Anton"', W / 2, 1000, 'center', '#fff', 6), '#fff', 40); ctx.restore(); } },
    lab(ctx, t, s) { const r = kb(ctx, A.lab, s, t, [0.5, 0.5, 1.05], [0.78, 0.3, 1.45]); const sp = t < wt(115) ? 0.6 : 2 + 60 * seg(t, wt(115), s.t1) ** 2; clockFace(ctx, r.P(0.877, 0.155), 70 * r.dw / 1080, t, sp);
      hud(ctx, ['1938', 'FISSION DISCOVERED · REAL'], t, s.t0); const yrs = ['1938', '1955', '1970', '1990', '2010', '20??']; const k = Math.min(yrs.length - 1, Math.floor(seg(t, wt(115), wt(119)) * yrs.length)); if (t > wt(115)) kin(ctx, yrs[k], 1080, 190, k === yrs.length - 1 ? RED : '#fff', t, wt(115)); },
    skyline(ctx, t, s) { kb(ctx, A.skyline, s, t, [0.5, 0.55, 1.05], [0.62, 0.42, 1.3]); imagined(ctx, t, s.t0); const fT = wt(126) + 0.1;
      if (t > fT) { const u = seg(t, fT, fT + 0.5), x = W * 0.7, y = HH * 0.4; const g = ctx.createRadialGradient(x, y, 0, x, y, 200 + 1700 * E.out(u)); g.addColorStop(0, `rgba(255,255,255,${1 - 0.5 * u})`); g.addColorStop(0.4, `rgba(255,240,220,${0.8 * (1 - u)})`); g.addColorStop(1, 'rgba(255,240,220,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, HH); }
      kin(ctx, 'NO HIROSHIMA', 640 + P.top * 0.4, 110, '#fff', t, wt(122)); stamp(ctx, 'NO WARNING', W / 2, 900, 110, RED, t, wt(127), -0.08); stamp(ctx, 'NO TABOO', W / 2, 1090, 110, RED, t, wt(129), 0.06); },
    choice(ctx, t, s) { kb(ctx, A.valley, s, t, [0.5, 0.5, 1.15], [0.5, 0.5, 1.02]); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(0, 0, W, HH);
      kin(ctx, 'BETTER WORLD', 520 + P.top, 120, '#fff', t, wt(131)); kin(ctx, 'OR WORSE?', 660 + P.top, 120, RED, t, wt(134)); button(ctx, 'BETTER', W / 2 - 230 - P.right * 0.3, 1000, GREEN, t, wt(136)); button(ctx, 'WORSE', W / 2 + 230 - P.right * 0.3, 1000, RED, t, wt(138));
      if (t > wt(138) + 0.2) { const b = 12 * Math.sin((t - wt(138)) * 9); txt(ctx, '↓  COMMENT  ↓', '400 44px "Share Tech Mono"', W / 2, 1160 + b, 'center', '#fff', 6); } },
    end(ctx, t, s) { kb(ctx, A.cloud, s, t, [0.5, 0.42, 1.25], [0.5, 0.4, 1.0]); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(0, 0, W, HH);
      kin(ctx, 'THE BOMB', 800, 160, '#fff', t, wt(148)); kin(ctx, 'COMES LATER', 970, 150, RED, t, wt(150)); const fo = seg(t, DURATION - 0.3, DURATION); if (fo > 0) { ctx.fillStyle = `rgba(255,250,235,${fo})`; ctx.fillRect(0, 0, W, HH); } },
  };
  const mapLabel = (ctx, p, s, size, color, u) => { if (u <= 0) return; ctx.save(); ctx.globalAlpha = Math.min(1, u * 2); ctx.translate(p[0], p[1]); const k = 0.7 + 0.3 * E.back(cl(u)); ctx.scale(k, k); ctx.lineJoin = 'round'; ctx.font = `400 ${size}px "Anton"`; ctx.textAlign = 'center'; ctx.lineWidth = size * 0.16; ctx.strokeStyle = 'rgba(0,0,0,0.9)'; ctx.strokeText(s, 0, size * 0.35); glow(ctx, () => txt(ctx, s, `400 ${size}px "Anton"`, 0, size * 0.35, 'center', color, 3), color, 24); ctx.restore(); };
