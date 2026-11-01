  // ---------------- Ottoman map ----------------
  // draws the map into a horizontal band [y0, y0+h]; returns a point mapper
  const drawMap = (ctx, cam, o = {}) => {
    const y0 = o.y0 || 0, h = o.h || HH, img = A.map;
    ctx.save(); ctx.beginPath(); ctx.rect(0, y0, W, h); ctx.clip(); ctx.fillStyle = '#0a0e16'; ctx.fillRect(0, y0, W, h);
    const s = Math.max(W / img.width, h / img.height) * cam[2], dw = img.width * s, dh = img.height * s;
    let x = W / 2 - cam[0] * dw, y = y0 + h / 2 - cam[1] * dh; x = Math.min(0, Math.max(W - dw, x)); y = Math.min(y0, Math.max(y0 + h - dh, y));
    ctx.drawImage(img, x, y, dw, dh);
    const gold = o.gold == null ? 1 : o.gold;
    if (gold > 0) { ctx.globalAlpha = 0.45 * gold; ctx.drawImage(A.ott, x, y, dw, dh); ctx.globalAlpha = 0.22 * gold * Math.min(1, o.glow || 0.6); ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(A.ottGlow, x, y, dw, dh); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; }
    if (o.draw != null && o.draw > 0) { const D = A.cutDraw, q = Math.round(cl(o.draw) * 80); if (D.q !== q) { const x2 = D.c.getContext('2d'), im = x2.createImageData(D.cw, D.ch), th = q / 80 * 250 + 3; for (let i = 0; i < D.ord.length; i++) { const v = D.ord[i]; if (v && v <= th && D.al[i] > 20) { const k = i * 4; im.data[k] = 224; im.data[k + 1] = 38; im.data[k + 2] = 59; im.data[k + 3] = D.al[i]; } } x2.putImageData(im, 0, 0); D.q = q; }
      ctx.save(); ctx.shadowColor = RED; ctx.shadowBlur = 16; ctx.drawImage(D.c, x, y, dw, dh); ctx.restore(); }
    const cu = o.cuts || 0; if (cu > 0) { ctx.save(); ctx.beginPath(); ctx.rect(0, y0, W * cu, h); ctx.clip(); ctx.shadowColor = RED; ctx.shadowBlur = 18; ctx.globalAlpha = o.cutAlpha == null ? 1 : o.cutAlpha; ctx.drawImage(A.cuts, x, y, dw, dh); ctx.restore(); }
    ctx.restore();
    const f = (n) => [x + PTS[n][0] * dw, y + PTS[n][1] * dh]; f.xf = [x, y, dw, dh]; return f;
  };
  const camU = (s, t, a, b) => { const u = E.inOut(seg(t, s.t0, s.t1)); return a.map((v, i) => lerp(v, b[i], u)); };
  const mapLabel = (ctx, p, s, size, color, u) => { if (u <= 0) return; ctx.save(); ctx.globalAlpha = Math.min(1, u * 2); ctx.translate(p[0], p[1]); const k = 0.7 + 0.3 * E.back(cl(u)); ctx.scale(k, k); ctx.lineJoin = 'round'; ctx.font = `400 ${size}px "Anton"`; ctx.textAlign = 'center'; ctx.lineWidth = size * 0.14; ctx.strokeStyle = 'rgba(0,0,0,0.9)'; ctx.strokeText(s, 0, size * 0.35); glow(ctx, () => txt(ctx, s, `400 ${size}px "Anton"`, 0, size * 0.35, 'center', color, 3), color, 24); ctx.restore(); };
  const coins = (ctx, t, t0, n = 80) => { if (t < t0) return; const r = H.rng(77); for (let i = 0; i < n; i++) { const x = r.range(40, W - 40), sp = r.range(500, 1100), d0 = r.range(0, 0.8), y = -60 + (t - t0 - d0) * sp; if (y < -60 || y > HH + 60) continue; const ang = t * r.range(3, 9) + i, w = Math.abs(Math.cos(ang)) * 22 + 3;
    ctx.save(); ctx.translate(x, y); ctx.fillStyle = '#f2c14e'; ctx.shadowColor = '#ffd66b'; ctx.shadowBlur = 14; ctx.beginPath(); ctx.ellipse(0, 0, w, 22, 0, 0, 7); ctx.fill(); ctx.strokeStyle = '#a87a1a'; ctx.lineWidth = 3; ctx.stroke(); ctx.restore(); } };
  const pencil = (ctx, p, ang = -0.6, sz = 1) => { ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(ang); ctx.scale(sz, sz); ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 8;
    ctx.fillStyle = '#e8b33a'; ctx.fillRect(40, -13, 300, 26); ctx.shadowColor = 'transparent'; ctx.fillStyle = '#c99520'; ctx.fillRect(40, 4, 300, 9); ctx.fillStyle = '#b8b8b8'; ctx.fillRect(330, -14, 34, 28); ctx.fillStyle = '#e07a8a'; ctx.fillRect(362, -13, 30, 26);
    ctx.fillStyle = '#e6c9a0'; ctx.beginPath(); ctx.moveTo(40, -13); ctx.lineTo(40, 13); ctx.lineTo(4, 2); ctx.lineTo(4, -2); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#7a1a22'; ctx.beginPath(); ctx.moveTo(14, -5); ctx.lineTo(14, 5); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill(); ctx.restore(); };
  const typeOn = (ctx, s, x, y, size, t, t0, cps, col = '#1a1410') => { if (t < t0) return 0; const n = Math.min(s.length, Math.floor((t - t0) * cps) + 1); ctx.save(); ctx.font = `400 ${size}px "Share Tech Mono"`; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; const cw = size * 0.62, x0 = x - s.length * cw / 2;
    for (let i = 0; i < n; i++) { const r = H.rng(i * 13 + s.length); ctx.fillStyle = col; ctx.globalAlpha = 0.82 + r.range(0, 0.18); const age = t - (t0 + i / cps), k = age < 0.05 ? 1.25 - age * 5 : 1; ctx.save(); ctx.translate(x0 + i * cw + cw / 2, y + r.range(-3, 3)); ctx.scale(k, k); ctx.fillText(s[i], -cw / 2, 0); ctx.restore(); }
    const blink = (t * 2) % 1 < 0.6; if (n < s.length || blink) { ctx.globalAlpha = 1; ctx.fillStyle = col; ctx.fillRect(x0 + n * cw + 4, y + 10, cw * 0.8, 8); } ctx.restore(); return n; };
  const header = (ctx, l1, l2, t, t0, col = RED) => { const u = appear(t, t0, 0.2); if (u <= 0) return; ctx.save(); ctx.globalAlpha = u; const y = 120 + P.top; ctx.fillStyle = 'rgba(0,0,0,0.65)'; ctx.fillRect(40, y, W - 80, 140); ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.strokeRect(40, y, W - 80, 140); glow(ctx, () => txt(ctx, l1, '400 52px "Anton"', W / 2, y + 60, 'center', '#fff', 3), '#fff', 10); glow(ctx, () => txt(ctx, l2, '400 64px "Anton"', W / 2, y + 125, 'center', col, 3), col, 20); ctx.restore(); };

  // ---------------- scenes ----------------
  const TY = { y0: wt(93) - 0.28, cps1: 12, k0: wt(93) + 0.22, cps2: 16 };
  const SCN = {
    hook(ctx, t, s) { // two seized battleships, stacked, with red frames and STOLEN stamps
      ctx.fillStyle = '#0b0a0c'; ctx.fillRect(0, 0, W, HH); const u = E.inOut(seg(t, s.t0, s.t1));
      const band = (img, y, h, z, cx) => { ctx.save(); ctx.beginPath(); ctx.rect(30, y, W - 60, h); ctx.clip(); const sc = Math.max((W - 60) / img.width, h / img.height) * z; ctx.drawImage(img, W / 2 - cx * img.width * sc, y + h / 2 - 0.5 * img.height * sc, img.width * sc, img.height * sc); ctx.restore(); ctx.strokeStyle = RED; ctx.lineWidth = 5; ctx.strokeRect(30, y, W - 60, h); };
      const a = appear(t, 0, 0.25), b = appear(t, wt(4) - 0.1, 0.25);
      ctx.save(); ctx.globalAlpha = a; ctx.translate(-(1 - a) * 300, 0); band(A.erin, 430 + P.top * 0.5, 430, 1.05 + 0.1 * u, 0.55); ctx.restore();
      ctx.save(); ctx.globalAlpha = b; ctx.translate((1 - b) * 300, 0); band(A.agincourt, 900 + P.top * 0.5, 430, 1.15 + 0.1 * u, 0.5); ctx.restore();
      stamp(ctx, 'STOLEN', W / 2, 650 + P.top * 0.5, 120, RED, t, wt(3), -0.12); if (t > wt(5)) stamp(ctx, 'STOLEN', W / 2, 1120 + P.top * 0.5, 120, RED, t, wt(5) + 0.05, 0.08);
      header(ctx, '2 SHIPS THAT', 'BUILT THE MIDDLE EAST', t, 0);
      if (t > wt(10) - 0.05) { ctx.fillStyle = `rgba(0,0,0,${0.55 * appear(t, wt(10) - 0.05, 0.2)})`; ctx.fillRect(0, 300 + P.top, W, 1150); kin(ctx, 'THE MIDDLE EAST', 820 + P.top * 0.5, 130, GOLD, t, wt(10)); kin(ctx, 'YOU KNOW TODAY', 960 + P.top * 0.5, 90, '#fff', t, wt(12)); } },
    paid(ctx, t, s) { const Pf = parallax(ctx, A.meBg, A.meCut, s, t, [0.5, 0.28], GOLD); smokeLayer(ctx, A.smoke, t, 0.08, 20); hud(ctx, ['OTTOMAN EMPIRE', 'SULTAN MEHMED V'], t, s.t0);
      stamp(ctx, 'PAID IN FULL', W / 2, 900, 110, GOLD, t, wt(19), -0.08); coins(ctx, t, wt(23)); },
    kept(ctx, t, s) { const r = kb(ctx, A.agincourt, s, t, [0.5, 0.5, 1.15], [0.55, 0.5, 1.35]); callout(ctx, r.P(0.5, 0.55), [70, 520], 'HMS AGINCOURT', 'SEIZED BY BRITAIN · AUG 1914', t, s.t0 + 0.05, RED); stamp(ctx, 'KEPT', W / 2, 1000, 200, RED, t, wt(28), -0.1); },
    goeben(ctx, t, s) { const r = kb(ctx, A.goeben, s, t, [0.4, 0.45, 1.05], [0.45, 0.45, 1.3]); smokeLayer(ctx, A.smokeDark, t, 0.25, 40, 2.6, 'multiply'); callout(ctx, r.P(0.4, 0.45), [W - P.right, 520], 'SMS GOEBEN', 'GERMANY SENDS IT TO ISTANBUL', t, s.t0 + 0.1);
      if (t > wt(38) - 0.1) { const a = 0.18 + 0.15 * Math.sin(t * 12); ctx.fillStyle = `rgba(220,20,40,${a})`; ctx.fillRect(0, 0, W, HH); } kin(ctx, 'WORLD WAR I', 860, 170, RED, t, wt(39), -0.04); kin(ctx, 'ON THE LOSING SIDE', 1010, 84, '#fff', t, wt(44)); },
    carve(ctx, t, s) { const P2 = drawMap(ctx, camU(s, t, [0.45, 0.35, 1.0], [0.47, 0.38, 1.12]), { gold: 1 - 0.5 * seg(t, wt(54), wt(61)), draw: seg(t, wt(54) - 0.1, wt(61) + 0.2), glow: 0.8 });
      { const du = seg(t, wt(54) - 0.1, wt(61) + 0.2), [mx, my, mw, mh] = P2.xf; if (du > 0 && du < 1) { const tp = A.cutTips[Math.round(du * 60)] || []; tp.forEach((q, k) => { const p = [mx + q[0] * mw, my + q[1] * mh]; ctx.save(); ctx.fillStyle = '#fff'; ctx.shadowColor = RED; ctx.shadowBlur = 25; ctx.beginPath(); ctx.arc(p[0], p[1], 7, 0, 7); ctx.fill(); ctx.restore(); if (k === 0) pencil(ctx, p, -0.75 + 0.08 * Math.sin(t * 30), 1.05); }); } }
      header(ctx, '600 YEARS OLD', 'OTTOMAN EMPIRE · 1914', t, s.t0, GOLD);
      if (t > wt(56)) { const u = E.inOut(seg(t, wt(56), wt(61) + 0.2)); ctx.save(); ctx.translate(lerp(-300, W + 300, u), 900); ctx.rotate(0.35); ctx.fillStyle = 'rgba(230,220,190,0.9)'; ctx.fillRect(-260, -40, 520, 80); ctx.fillStyle = '#333'; for (let k = 0; k < 26; k++) ctx.fillRect(-250 + k * 20, -40, 3, k % 5 ? 20 : 34); ctx.restore(); }
      kin(ctx, 'CARVED UP', 1150, 140, RED, t, wt(54)); },
    whatif(ctx, t, s) { const u = seg(t, s.t0, s.t1); cover(ctx, u < 0.5 ? A.goeben : A.erin, 0.5, 0.5, 1.25 - 0.2 * u); const r = H.rng(Math.floor(t * 30) + 5); for (let i = 0; i < 7; i++) { const y = r.range(0, HH), h = r.range(8, 70); ctx.drawImage(ctx.canvas, 0, y, W, h, r.range(-60, 60), y, W, h); }
      ctx.fillStyle = 'rgba(255,255,255,0.1)'; for (let i = 0; i < 26; i++) ctx.fillRect(0, r.range(0, HH), W, r.range(1, 3)); hud(ctx, ['◀◀ REWIND', 'TIMELINE B // AUG 1914'], t, s.t0); kin(ctx, 'WHAT IF?', 840, 230, GOLD, t, wt(63)); kin(ctx, 'THEY DELIVERED THE SHIPS', 1010, 70, '#fff', t, wt(68)); },
    survive(ctx, t, s) { const back = 1 - E.inOut(seg(t, s.t0, wt(77))); drawMap(ctx, camU(s, t, [0.47, 0.38, 1.12], [0.45, 0.36, 1.0]), { gold: 1, cuts: 1, cutAlpha: back, glow: 0.6 + 0.8 * seg(t, wt(77), wt(80)) }); leak(ctx, t, '255,190,80', 0.25);
      hud(ctx, ['TIMELINE B', 'NO WORLD WAR · NO PARTITION'], t, s.t0); kin(ctx, 'THE EMPIRE', 860, 150, GOLD, t, wt(79)); kin(ctx, 'SURVIVES', 1010, 170, '#fff', t, wt(80)); },
    nolands(ctx, t, s) { const Pm = drawMap(ctx, camU(s, t, [0.5, 0.38, 1.35], [0.52, 0.38, 1.5]), { gold: 1, glow: 1 });
      [['IRAQ', 82], ['SYRIA', 84], ['JORDAN', 86], ['LEBANON', 88]].forEach(([n, i]) => { const p = Pm(n), u = seg(t, wt(i) - 0.15, wt(i) + 0.1), x = seg(t, wt(i) + 0.15, wt(i) + 0.35); if (u <= 0) return; if (n === 'LEBANON') p[0] -= 45, p[1] += 62; mapLabel(ctx, p, n, n === 'LEBANON' ? 46 : 64, '#fff', u);
        const xs = seg(t, wt(i) + 0.13, wt(i) + 0.21); if (xs > 0) { const k = lerp(2.4, 1, E.out(xs)), R = n === 'LEBANON' ? 70 : 105; ctx.save(); ctx.translate(p[0], p[1] - 10); ctx.rotate(-0.08); ctx.scale(k, k); ctx.globalAlpha = Math.min(1, xs * 3); ctx.lineCap = 'butt';
          for (const [lw, c] of [[46, 'rgba(0,0,0,0.75)'], [30, RED]]) { ctx.strokeStyle = c; ctx.lineWidth = lw; ctx.shadowColor = c === RED ? RED : 'transparent'; ctx.shadowBlur = c === RED ? 25 : 0; ctx.beginPath(); ctx.moveTo(-R, -R * 0.75); ctx.lineTo(R, R * 0.75); ctx.moveTo(R, -R * 0.75); ctx.lineTo(-R, R * 0.75); ctx.stroke(); } ctx.restore(); } });
      kin(ctx, 'ONE EMPIRE', 1050, 170, GOLD, t, wt(89)); },
    oil(ctx, t, s) { const fireT = wt(94); if (t < fireT - 0.1) { ctx.fillStyle = '#d9caa6'; ctx.fillRect(0, 0, W, HH); const vg = ctx.createRadialGradient(W / 2, HH / 2, 300, W / 2, HH / 2, 1250); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(40,25,10,0.75)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, HH);
        ctx.fillStyle = 'rgba(120,90,50,0.18)'; for (let k = 0; k < 40; k++) ctx.fillRect(110, 520 + k * 34, W - 220, 2); typeOn(ctx, '1927', W / 2, 900, 260, t, TY.y0, TY.cps1); typeOn(ctx, 'KIRKUK', W / 2, 1060, 110, t, TY.k0, TY.cps2, '#7a1a22'); }
      else { const r = kb(ctx, A.gusher, { t0: fireT, t1: s.t1 }, t, [0.5, 0.72, 1.35], [0.5, 0.4, 1.06]); smokeLayer(ctx, A.smokeDark, t, 0.3, 40, 2.6, 'multiply'); shockwave(ctx, [W / 2, 1050], t, fireT, 1300); callout(ctx, r.P(0.63, 0.74), [70, 520], 'BABA GURGUR', 'KIRKUK OIL FIELD', t, wt(101) - 0.1, GOLD); stamp(ctx, 'OTTOMAN EMPIRE', W / 2, 1120, 100, GOLD, t, wt(104), -0.06); kin(ctx, 'OIL EXPLODES', 860, 150, '#fff', t, wt(95)); }
      flash(ctx, t, fireT - 0.05, 0.4, '255,220,160'); },
    rich(ctx, t, s) { const sw = wt(110); if (t < sw) { kb(ctx, A.kirkuk, s, t, [0.5, 0.5, 1.1], [0.5, 0.5, 1.2]); coins(ctx, t, s.t0 + 0.2, 60); }
      else { parallax(ctx, A.meBg, A.meCut, { t0: sw, t1: s.t1 }, t, [0.5, 0.28], GOLD); leak(ctx, t, '255,190,80', 0.35); coins(ctx, t, sw, 90); }
      if (t > wt(112)) { const u = appear(t, wt(112), 0.3); ctx.save(); ctx.globalAlpha = u; ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(140, 1000, 800, 230); ctx.strokeStyle = GOLD; ctx.lineWidth = 4; ctx.strokeRect(140, 1000, 800, 230); glow(ctx, () => txt(ctx, 'BILLIONS', '400 130px "Anton"', W / 2, 1150, 'center', GOLD, 6), GOLD, 30); txt(ctx, 'OF BARRELS UNDER KIRKUK', '400 36px "Share Tech Mono"', W / 2, 1210, 'center', '#fff', 4); ctx.restore(); }
      kin(ctx, 'BIGGEST OIL FIELDS', 860, 110, GOLD, t, wt(115)); },
    ataturk(ctx, t, s) { const Pa = parallax(ctx, A.atBg, A.atCut, s, t, [0.5, 0.3], GOLD); hud(ctx, ['MUSTAFA KEMAL', 'STATUS: ARMY OFFICER'], t, s.t0); reticle(ctx, Pa(0.5, 0.28), 200, 'ATATÜRK', t, s.t0 + 0.1, GOLD);
      stamp(ctx, 'NO REPUBLIC', W / 2, 1150, 120, RED, t, wt(125), -0.08); kin(ctx, 'OF TURKEY', 1290, 100, '#fff', t, wt(128)); },
    istanbul(ctx, t, s) { kb(ctx, A.hagia, s, t, [0.5, 0.45, 1.05], [0.5, 0.4, 1.25]); leak(ctx, t, '255,180,90', 0.35); hud(ctx, ['ISTANBUL', 'CAPITAL OF THE EMPIRE'], t, s.t0);
      kin(ctx, 'A SULTAN', 820, 150, GOLD, t, wt(130)); kin(ctx, 'IN ISTANBUL', 960, 110, '#fff', t, wt(132)); stamp(ctx, '2026', W / 2, 1150, 150, '#1f6fe0', t, wt(135), -0.08); },
    end(ctx, t, s) { const h = (HH - 6) / 2; drawMap(ctx, [0.45, 0.36, 1.0], { y0: 0, h, gold: 1, glow: 1 }); drawMap(ctx, [0.45, 0.36, 1.0], { y0: h + 6, h, gold: 0.35, cuts: 1 }); ctx.fillStyle = GOLD; ctx.fillRect(0, h, W, 6);
      mapLabel(ctx, [W / 2, h - 200], 'THAT MAP?', 110, GOLD, seg(t, wt(145) - 0.1, wt(146) + 0.1)); mapLabel(ctx, [W / 2, h + 200], 'OR OURS?', 110, '#fff', seg(t, wt(147) - 0.1, wt(148) + 0.1));
      kin(ctx, 'ALL BECAUSE OF 2 SHIPS', 330 + P.top, 84, '#fff', t, wt(136)); const fo = seg(t, DURATION - 0.35, DURATION); if (fo > 0) { ctx.fillStyle = `rgba(0,0,0,${fo * 0.6})`; ctx.fillRect(0, 0, W, HH); } },
  };

