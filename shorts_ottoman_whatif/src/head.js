// ===== "Two Ships That Built The Middle East" — Ottoman alt-history Short, 1080x1920 =====
(() => {
  const W = 1080, HH = 1920;
  const CYAN = '#f2c14e', RED = '#e0263b', AMBER = '#ffb23e', GOLD = '#f2c14e';
  const E = H.ease, cl = H.clamp, seg = (t, a, b) => cl((t - a) / (b - a)), lerp = H.lerp;
  const WORDS = window.VO_WORDS, wt = (i) => WORDS[i][0], we = (i) => WORDS[i][1];
  const DURATION = we(WORDS.length - 1) + 0.9;
  const appear = (t, t0, d = 0.25) => E.out(seg(t, t0, t0 + d));
  const pop = (t, t0, d = 0.3) => E.back(seg(t, t0, t0 + d));
  const PTS = window.CITIES;
  const P = Object.assign({ hudY: 230, capY: 1420, top: 0, right: 70, grain: 0.3, scan: 0.1 }, window.PRESET || {});

  // ---------------- assets ----------------
  const A = {};
  const loadImg = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
  const filtered = (img, f) => { const c = H.layer(img.width, img.height), x = c.getContext('2d'); x.filter = f; x.drawImage(img, 0, 0); return c; };
  const SEPIA = 'grayscale(1) sepia(0.55) contrast(1.2) brightness(0.88)', SHIP = 'grayscale(1) sepia(0.3) contrast(1.25) brightness(1.08)';
  const tint = (img, rgb, blur = 0) => { const c = H.layer(img.width, img.height), x = c.getContext('2d'); x.drawImage(img, 0, 0); const d = x.getImageData(0, 0, c.width, c.height); for (let i = 0; i < d.data.length; i += 4) { d.data[i + 3] = d.data[i]; d.data[i] = rgb[0]; d.data[i + 1] = rgb[1]; d.data[i + 2] = rgb[2]; } x.putImageData(d, 0, 0); if (!blur) return c; const g = H.layer(c.width, c.height), gx = g.getContext('2d'); gx.filter = `blur(${blur}px)`; gx.drawImage(c, 0, 0); return g; };
  window.loadAssets = async () => {
    const L = (n, e = 'jpg') => loadImg('assets/' + n + '.' + e);
    const [erin, agincourt, goeben, fire, ataturk, hagia, kirkuk, mehmed, map, ott, cuts, atCut, meCut, smoke, gusher, cord] = await Promise.all([L('erin'), L('agincourt'), L('goeben'), L('fire'), L('ataturk'), L('hagia'), L('kirkuk1933'), L('mehmed'), L('map_base'), L('map_ottoman', 'png'), L('map_cuts', 'png'), L('ataturk_cut', 'png'), L('mehmed_cut', 'png'), L('smoke', 'png'), L('gusher'), L('map_cuts_order', 'png')]);
    Object.assign(A, { erin: filtered(erin, SHIP), agincourt: filtered(agincourt, SHIP), goeben: filtered(goeben, SEPIA + ' contrast(1.1)'), fire: filtered(fire, 'contrast(1.15) saturate(1.3)'), hagia: filtered(hagia, 'contrast(1.1) saturate(1.2)'), kirkuk: filtered(kirkuk, SEPIA), map });
    A.atBg = filtered(ataturk, SEPIA + ' blur(9px) brightness(0.6)'); A.atCut = filtered(atCut, SEPIA); A.meBg = filtered(mehmed, 'sepia(0.4) blur(9px) brightness(0.6)'); A.meCut = filtered(meCut, 'sepia(0.3) contrast(1.15)');
    A.ott = tint(ott, [242, 193, 78]); A.ottGlow = tint(ott, [255, 200, 90], 22); A.cuts = tint(cuts, [224, 38, 59]);
    A.gusher = filtered(gusher, 'contrast(1.12) sepia(0.25)');
    { const cw = 1100, ch = 1200, c1 = H.layer(cw, ch), x1 = c1.getContext('2d'); x1.drawImage(cord, 0, 0, cw, ch); const od = x1.getImageData(0, 0, cw, ch).data; x1.clearRect(0, 0, cw, ch); x1.drawImage(cuts, 0, 0, cw, ch); const cd = x1.getImageData(0, 0, cw, ch).data;
      const ord = new Uint8Array(cw * ch), al = new Uint8Array(cw * ch); for (let i = 0; i < ord.length; i++) { ord[i] = od[i * 4]; al[i] = cd[i * 4]; } A.cutDraw = { cw, ch, ord, al, q: -1, c: H.layer(cw, ch) }; A.cutTips = window.CUT_TIPS; }
    A.smoke = smoke; A.smokeDark = filtered(smoke, 'brightness(0.12)'); A.smokeOrange = filtered(smoke, 'sepia(1) saturate(4) hue-rotate(-15deg) brightness(0.9)');
    A.grain = []; for (let s = 0; s < 6; s++) { const c = H.layer(540, 960), x = c.getContext('2d'), d = x.createImageData(540, 960), g = H.rng(700 + s); for (let i = 0; i < d.data.length; i += 4) { const n = 128 + g.gauss() * 30; d.data[i] = d.data[i + 1] = d.data[i + 2] = n; d.data[i + 3] = 255; } x.putImageData(d, 0, 0); A.grain.push(c); }
    const sl = H.layer(W, HH), sx = sl.getContext('2d'); sx.fillStyle = `rgba(0,0,0,${P.scan})`; for (let y = 0; y < HH; y += 4) sx.fillRect(0, y, W, 2); A.scan = sl;
    A.off1 = H.layer(W, HH); A.off2 = H.layer(W, HH); A.fx = H.layer(W, HH);
  };

  // ---------------- timeline ----------------
  const S = (k, t0, t1, tr = 'whip') => ({ k, t0, t1, tr });
  const SC = [
    S('hook', 0, wt(15), 'none'), S('paid', wt(15), wt(27), 'whip'), S('kept', wt(27), wt(30), 'flash'), S('goeben', wt(30), wt(46), 'whip'),
    S('carve', wt(46), wt(62), 'zoom'), S('whatif', wt(62), wt(71), 'cut'), S('survive', wt(71), wt(81), 'flash'), S('nolands', wt(81), wt(91), 'zoom'),
    S('oil', wt(91), wt(106), 'flash'), S('rich', wt(106), wt(120), 'whip'), S('ataturk', wt(120), wt(129), 'whip'), S('istanbul', wt(129), wt(136), 'flash'),
    S('end', wt(136), DURATION + 1, 'zoom'),
  ];
  const HITS = [wt(3), wt(5) + 0.05, wt(19), wt(28), wt(39), wt(54), wt(80), wt(82) + 0.15, wt(84) + 0.15, wt(86) + 0.15, wt(88) + 0.15, wt(89), wt(94), wt(104), wt(125), wt(135), wt(136)];
  const KEY = new Set(['1914', 'BRITAIN', 'STOLE', 'BATTLESHIPS', 'MIDDLE', 'EAST', 'OTTOMANS', 'PAID', 'DONATED', 'KEPT', 'GERMANY', 'WARSHIPS', 'WORLD', 'WAR', 'ONE', 'LOSING', 'SIX-HUNDRED-YEAR-OLD', 'CARVED', 'RULER', 'MAP', 'DELIVERED', 'SHIPS', 'SURVIVES', 'NO', 'IRAQ', 'SYRIA', 'JORDAN', 'LEBANON', 'EMPIRE', '1927', 'OIL', 'EXPLODES', 'KIRKUK', 'SULTAN', 'BIGGEST', 'EARTH', 'ATATÜRK', 'OFFICER', 'REPUBLIC', 'TURKEY', 'ISTANBUL', 'TODAY', 'OURS']);
  const RED_KEYS = new Set(['STOLE', 'KEPT', 'LOSING', 'CARVED', 'NO', 'EXPLODES', 'WAR']);
  const CAPS = []; { let cur = null; WORDS.forEach((w, i) => { const gap = i ? w[0] - WORDS[i - 1][1] : 1; if (!cur || cur.idx.length >= 3 || gap > 0.22) { cur = { idx: [] }; CAPS.push(cur); } cur.idx.push(i); }); }
  const tok = (i) => WORDS[i][2].toUpperCase().replace(/[.,!?…]/g, '');

