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
