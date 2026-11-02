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
    timeline(ctx, t, s); corners(ctx);
    if (s.k !== 'you') captions(ctx, t);
  }
