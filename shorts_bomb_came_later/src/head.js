// ===== "The Bomb Came Later" — nuclear what-if Short, 1080x1920 =====
(() => {
  const W = 1080, HH = 1920;
  const CYAN = '#ffc93c', RED = '#e0263b', AMBER = '#ffb23e', GOLD = '#ffc93c', BLUE = '#2f7cf0', GREEN = '#2fbf5a';
  const E = H.ease, cl = H.clamp, seg = (t, a, b) => cl((t - a) / (b - a)), lerp = H.lerp;
  const WORDS = window.VO_WORDS, wt = (i) => WORDS[i][0], we = (i) => WORDS[i][1];
  const DURATION = we(WORDS.length - 1) + 0.9;
  const appear = (t, t0, d = 0.25) => E.out(seg(t, t0, t0 + d));
  const pop = (t, t0, d = 0.3) => E.back(seg(t, t0, t0 + d));
  const JP = window.JAPAN;
  const P = Object.assign({ hudY: 230, capY: 1420, top: 0, right: 70, grain: 0.3, scan: 0.1 }, window.PRESET || {});

  // ---------------- assets ----------------
  const A = {};
  const loadImg = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
  const filtered = (img, f) => { const c = H.layer(img.width, img.height), x = c.getContext('2d'); x.filter = f; x.drawImage(img, 0, 0); return c; };
  const tintMask = (img, rgb) => { const c = H.layer(img.width, img.height), x = c.getContext('2d'); x.drawImage(img, 0, 0); const d = x.getImageData(0, 0, c.width, c.height); for (let i = 0; i < d.data.length; i += 4) { d.data[i + 3] = d.data[i]; d.data[i] = rgb[0]; d.data[i + 1] = rgb[1]; d.data[i + 2] = rgb[2]; } x.putImageData(d, 0, 0); return c; };
  const NAMES = ['cloud', 'desk', 'hangar', 'street', 'fleet', 'medals', 'soviets', 'standoff', 'tanks_clean', 'rocket', 'moon', 'study', 'lab', 'skyline', 'valley', 'map_japan'];
  const CUTS = ['soviets_cut2', 'standoff_cut', 'skyline_cut', 'lab_cut', 'bombers_cut', 'rocket_cut', 'hangar_cut'];
  window.loadAssets = async () => {
    const imgs = await Promise.all(NAMES.map((n) => loadImg('assets/' + n + '.jpg')));
    NAMES.forEach((n, i) => { A[n] = filtered(imgs[i], 'contrast(1.08)'); });
    A.moonBlur = filtered(imgs[NAMES.indexOf('moon')], 'blur(14px) contrast(0.9)');
    A.cloudHot = filtered(imgs[0], 'brightness(1.6) contrast(1.3)');
    const [n, s, smoke] = await Promise.all([loadImg('assets/jp_north.png'), loadImg('assets/jp_south.png'), loadImg('assets/smoke.png')]);
    A.north = tintMask(n, [224, 38, 59]); A.south = tintMask(s, [47, 124, 240]);
    A.smoke = smoke; A.smokeDark = filtered(smoke, 'brightness(0.12)');
    const cuts = await Promise.all(CUTS.map((n) => loadImg('assets/' + n + '.png'))); CUTS.forEach((n, i) => { A[n.replace(/_cut2?$/, 'Fg')] = filtered(cuts[i], 'contrast(1.08)'); });
    A.skylineDark = filtered(cuts[2], 'brightness(0.32) contrast(1.35)'); A.tanks = A.tanks_clean;
    A.blur = {}; ['soviets', 'standoff', 'hangar', 'rocket', 'lab', 'skyline'].forEach((n) => { A.blur[n] = filtered(imgs[NAMES.indexOf(n)], 'blur(5px) contrast(1.05) brightness(0.92)'); });
    A.grain = []; for (let k = 0; k < 6; k++) { const c = H.layer(540, 960), x = c.getContext('2d'), d = x.createImageData(540, 960), g = H.rng(700 + k); for (let i = 0; i < d.data.length; i += 4) { const v = 128 + g.gauss() * 30; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } x.putImageData(d, 0, 0); A.grain.push(c); }
    const sl = H.layer(W, HH), sx = sl.getContext('2d'); sx.fillStyle = `rgba(0,0,0,${P.scan})`; for (let y = 0; y < HH; y += 4) sx.fillRect(0, y, W, 2); A.scan = sl;
    A.off1 = H.layer(W, HH); A.off2 = H.layer(W, HH); A.fx = H.layer(W, HH);
  };

  // ---------------- timeline ----------------
  const S = (k, t0, t1, tr = 'whip') => ({ k, t0, t1, tr });
  const SC = [
    S('hook', 0, wt(9), 'none'), S('rewind', wt(9), wt(11), 'cut'), S('cancel', wt(11), wt(18), 'whip'), S('jets', wt(18), wt(32), 'whip'),
    S('calm', wt(32), wt(38), 'flash'), S('invasion', wt(38), wt(49), 'cut'), S('medals', wt(49), wt(59), 'zoom'), S('hokkaido', wt(59), wt(63), 'whip'),
    S('split', wt(63), wt(67), 'cut'), S('standoff', wt(67), wt(74), 'zoom'), S('ww3', wt(74), wt(86), 'flash'), S('rocket', wt(86), wt(92), 'whip'),
    S('moon', wt(92), wt(97), 'cut'), S('other', wt(97), wt(106), 'whip'), S('twist', wt(106), wt(110), 'cut'), S('lab', wt(110), wt(120), 'zoom'),
    S('skyline', wt(120), wt(131), 'whip'), S('choice', wt(131), wt(139), 'cut'), S('end', wt(139), DURATION + 1, 'flash'),
  ];
  const HITS = [0.12, wt(8), wt(14), wt(44), wt(46.5 | 0) + 0.3, wt(53), wt(64), wt(76), wt(91), wt(108), wt(126) + 0.1, wt(139), wt(151)];
  const KEY = new Set(['ATOMIC', 'BOMB', 'WORLD', 'WAR', 'THREE', '1950', '1942', 'MANHATTAN', 'PROJECT', 'CANCELS', 'BILLION', 'JETS', 'RADAR', '1945', 'HIROSHIMA', 'NOVEMBER', 'BIGGEST', 'INVASION', 'JAPAN', 'MILLION', 'PURPLE', 'HEARTS', 'SOVIETS', 'HOKKAIDO', 'SPLITS', 'TWO', 'FEAR', 'DESTRUCTION', 'HOT', 'TAKE', 'EUROPE', 'TANKS', 'MISSILES', 'SPUTNIK', 'MOON', '1969', 'SURRENDERED', 'MAYBE', 'TWIST', 'FISSION', '1938', 'EVENTUALLY', 'WARNING', 'TABOO', 'BETTER', 'WORSE', 'SCARIEST', 'LATER', 'NO']);
  const RED_KEYS = new Set(['BOMB', 'WAR', 'THREE', 'CANCELS', 'INVASION', 'DESTRUCTION', 'TANKS', 'MISSILES', 'NO', 'WARNING', 'TABOO', 'WORSE', 'LATER', 'SPLITS', 'TWIST']);
  const CAPS = []; { let cur = null; WORDS.forEach((w, i) => { const gap = i ? w[0] - WORDS[i - 1][1] : 1; if (!cur || cur.idx.length >= 3 || gap > 0.22) { cur = { idx: [] }; CAPS.push(cur); } cur.idx.push(i); }); }
  const tok = (i) => WORDS[i][2].toUpperCase().replace(/[.,!?…:]/g, '');
