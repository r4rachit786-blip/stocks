// Painted Canvas2D textures for the Niihau set, in the kit's paint.ts manner (broad soft tone drift first, then
// marks, seams painted in as dark tints, small light bevels; no outlines: the ink pass draws those).
// Uses the kit's ctex / rep / jit / rng; the scatter helpers below are local copies of paint.ts's private ones.
import * as THREE from "three";
import { ctex, jit, rng } from "./paint";

type R = () => number;
type G = CanvasRenderingContext2D;
const TAU = Math.PI * 2;
const U = (r: R, a: number, b: number) => a + (b - a) * r();
const pick = <T,>(r: R, a: T[]) => a[Math.floor(r() * a.length) % a.length];
const wrap2 = (W: number, H: number, x: number, y: number, rd: number, fn: (x: number, y: number) => void) => {
  for (const ox of [0, -W, W]) for (const oy of [0, -H, H]) {
    const X = x + ox, Y = y + oy;
    if (X + rd > 0 && X - rd < W && Y + rd > 0 && Y - rd < H) fn(X, Y);
  }
};
const blotch = (g: G, x: number, y: number, rd: number, sx: number, rgb: string, a: number) => {
  g.save(); g.translate(x, y); g.scale(sx, 1);
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, rd);
  gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = gr; g.fillRect(-rd, -rd, rd * 2, rd * 2);
  g.restore();
};
const clampT = (t: THREE.Texture) => { t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.needsUpdate = true; return t; };

// ---------------------------------------------------------------------------------------------------------------
/** Dry ranch pasture, 2048 px = 6 m. Golden-ochre straw with broad drift, bare red-brown earth, straw strokes,
 *  pebbles and a few cracks. Albedos sit at L* 66-72 so the day key lands them at warm gold, not lemon. */
export const dryGroundHD = () => ctex("dryGroundHD", 2048, 2048, (g, r) => {
  const S = 2048;
  g.fillStyle = "#bfa066"; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 60; i++) { // broad drift: paler straw, deeper ochre, dry olive, sienna
    const x = U(r, 0, S), y = U(r, 0, S), rd = U(r, 130, 400);
    const c = pick(r, ["224,200,136", "176,134,74", "204,172,104", "150,142,88", "212,180,112", "170,120,80", "232,212,156"]);
    wrap2(S, S, x, y, rd * 1.6, (xx, yy) => blotch(g, xx, yy, rd, 1.6, c, 0.42));
  }
  const bare: [number, number, number][] = [];
  for (let i = 0; i < 13; i++) { // bare earth patches (red-brown, Niihau dirt)
    const x = U(r, 0, S), y = U(r, 0, S), rd = U(r, 80, 230);
    bare.push([x, y, rd]);
    wrap2(S, S, x, y, rd * 1.8, (xx, yy) => { blotch(g, xx, yy, rd, 1.8, "168,116,84", 0.7); blotch(g, xx + rd * 0.2, yy, rd * 0.55, 1.5, "140,94,70", 0.5); });
  }
  g.lineCap = "round"; g.lineJoin = "round";
  for (const [bx, by, rd] of bare) for (let k = 0; k < 5; k++) { // cracks in the bare patches
    let x = bx + U(r, -rd, rd), y = by + U(r, -rd * 0.5, rd * 0.5);
    g.strokeStyle = "rgba(104,58,36,0.5)"; g.lineWidth = U(r, 1.5, 3);
    g.beginPath(); g.moveTo(x, y);
    for (let s = 0; s < 5; s++) { x += U(r, -34, 34); y += U(r, -22, 22); g.lineTo(x, y); }
    g.stroke();
  }
  for (let i = 0; i < 3600; i++) { // straw strokes: flattened dry grass, mostly lying one way
    const x = U(r, 0, S), y = U(r, 0, S), l = U(r, 26, 70), a = U(r, -0.5, 0.5) + (r() < 0.2 ? U(r, -1.2, 1.2) : 0), t = r();
    wrap2(S, S, x, y, 50, (xx, yy) => {
      g.strokeStyle = t < 0.4 ? "rgba(244,230,176,0.8)" : t < 0.75 ? "rgba(128,88,46,0.62)" : "rgba(108,100,56,0.58)";
      g.lineWidth = U(r, 3, 6);
      g.beginPath(); g.moveTo(xx, yy); g.quadraticCurveTo(xx + Math.cos(a) * l * 0.5, yy + Math.sin(a) * l * 0.5 - 4, xx + Math.cos(a) * l, yy + Math.sin(a) * l); g.stroke();
    });
  }
  for (let i = 0; i < 420; i++) { // tufts: little fans
    const x = U(r, 0, S), y = U(r, 0, S), h = U(r, 20, 42), light = r() < 0.45;
    wrap2(S, S, x, y, 30, (xx, yy) => {
      g.strokeStyle = light ? "rgba(244,228,164,0.8)" : "rgba(124,90,44,0.7)"; g.lineWidth = 4;
      g.beginPath();
      for (const d of [-0.7, -0.25, 0.2, 0.65]) { g.moveTo(xx, yy); g.lineTo(xx + d * h * 0.7, yy - h * (1 - Math.abs(d) * 0.3)); }
      g.stroke();
    });
  }
  for (let i = 0; i < 260; i++) { // pebbles with a light top and a dark foot
    const x = U(r, 0, S), y = U(r, 0, S), s = U(r, 5, 15), c = pick(r, ["#8d8078", "#7b6e68", "#a39588", "#6f625c"]);
    wrap2(S, S, x, y, 12, (xx, yy) => {
      g.fillStyle = "rgba(90,60,40,0.35)"; g.beginPath(); g.ellipse(xx + 1.5, yy + s * 0.5, s * 1.1, s * 0.5, 0, 0, TAU); g.fill();
      g.fillStyle = c; g.beginPath(); g.ellipse(xx, yy, s, s * 0.72, U(r, 0, 3), 0, TAU); g.fill();
      g.fillStyle = "rgba(255,244,225,0.3)"; g.beginPath(); g.ellipse(xx - s * 0.25, yy - s * 0.25, s * 0.45, s * 0.26, 0, 0, TAU); g.fill();
    });
  }
});

/** Turned red-brown earth (furrow, mounds, clods): 1024 px = 3 m */
export const dirtHD = () => ctex("dirtHD", 1024, 1024, (g, r) => {
  const S = 1024;
  g.fillStyle = "#93674e"; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 40; i++) {
    const x = U(r, 0, S), y = U(r, 0, S), rd = U(r, 60, 190), c = pick(r, ["170,124,92", "116,78,60", "150,104,76", "104,70,56"]);
    wrap2(S, S, x, y, rd * 1.4, (xx, yy) => blotch(g, xx, yy, rd, 1.4, c, 0.4));
  }
  for (let i = 0; i < 420; i++) { // clods: dark foot, lit top
    const x = U(r, 0, S), y = U(r, 0, S), s = U(r, 5, 17);
    wrap2(S, S, x, y, 24, (xx, yy) => {
      g.fillStyle = "rgba(88,44,26,0.5)"; g.beginPath(); g.ellipse(xx + 2, yy + s * 0.45, s * 1.05, s * 0.55, 0, 0, TAU); g.fill();
      g.fillStyle = jit(r, "#a67656", 0.1, 4, 0.1); g.beginPath(); g.ellipse(xx, yy, s, s * 0.7, U(r, 0, 3), 0, TAU); g.fill();
      g.fillStyle = "rgba(236,180,128,0.35)"; g.beginPath(); g.ellipse(xx - s * 0.2, yy - s * 0.22, s * 0.5, s * 0.25, 0, 0, TAU); g.fill();
    });
  }
  g.lineCap = "round";
  for (let i = 0; i < 60; i++) { // torn straw mixed in
    const x = U(r, 0, S), y = U(r, 0, S), l = U(r, 14, 40), a = U(r, 0, TAU);
    g.strokeStyle = "rgba(226,196,120,0.6)"; g.lineWidth = 2.4;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
});

/** Basalt field stone for the dry-stone wall and loose rocks: 1024 px, about 1 m. Warm greys, pores, lichen. */
export const rockHD = (key = "rockA", base = "#948a80") => ctex("rockHD" + key, 1024, 1024, (g, r) => {
  const S = 1024;
  g.fillStyle = base; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 50; i++) {
    const x = U(r, 0, S), y = U(r, 0, S), rd = U(r, 50, 170), light = r() < 0.5;
    wrap2(S, S, x, y, rd * 1.3, (xx, yy) => blotch(g, xx, yy, rd, 1.3, light ? "214,202,186" : "84,74,70", 0.28));
  }
  for (let i = 0; i < 14; i++) { // lichen: pale ochre / grey-green crusts
    const x = U(r, 0, S), y = U(r, 0, S), rd = U(r, 26, 70), c = pick(r, ["206,196,128", "178,186,150", "224,214,170"]);
    wrap2(S, S, x, y, rd * 1.3, (xx, yy) => { blotch(g, xx, yy, rd, 1.2, c, 0.5); blotch(g, xx + rd * 0.3, yy - rd * 0.2, rd * 0.5, 1, c, 0.5); });
  }
  for (let i = 0; i < 1400; i++) { // pores and grit
    const x = U(r, 0, S), y = U(r, 0, S), s = U(r, 1.2, 4.2), d = r() < 0.7;
    g.fillStyle = d ? "rgba(58,48,48,0.42)" : "rgba(246,236,220,0.4)";
    g.beginPath(); g.ellipse(x, y, s, s * U(r, 0.5, 1), U(r, 0, 3), 0, TAU); g.fill();
  }
  g.lineCap = "round"; g.lineJoin = "round";
  for (let i = 0; i < 16; i++) { // hairline cracks
    let x = U(r, 0, S), y = U(r, 0, S);
    g.strokeStyle = "rgba(60,48,46,0.42)"; g.lineWidth = U(r, 1.4, 2.6);
    g.beginPath(); g.moveTo(x, y);
    for (let s = 0; s < 5; s++) { x += U(r, -60, 60); y += U(r, 10, 60); g.lineTo(x, y); }
    g.stroke();
  }
});

/** Weathered fence timber: 512 x 1024, grain runs along v (canvas y); 1 tile = 1 m of length */
export const woodHD = (key = "fence", base = "#a98a66") => ctex("woodHD" + key, 512, 1024, (g, r) => {
  const W = 512, H = 1024;
  g.fillStyle = base; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 16; i++) blotch(g, U(r, 0, W), U(r, 0, H), U(r, 60, 160), 0.6, r() < 0.5 ? "214,188,150" : "110,82,56", 0.3);
  g.lineCap = "round";
  for (let i = 0; i < 90; i++) { // long grain lines
    const x = U(r, 0, W), y0 = U(r, -200, H), l = U(r, 200, 800), light = r() < 0.3;
    g.strokeStyle = light ? "rgba(236,214,178,0.3)" : "rgba(86,58,36,0.34)"; g.lineWidth = U(r, 1.5, 4);
    g.beginPath(); g.moveTo(x, y0); g.bezierCurveTo(x + U(r, -10, 10), y0 + l * 0.3, x + U(r, -10, 10), y0 + l * 0.7, x + U(r, -6, 6), y0 + l); g.stroke();
  }
  for (let i = 0; i < 5; i++) { // knots
    const x = U(r, 60, W - 60), y = U(r, 60, H - 60), s = U(r, 12, 22);
    g.strokeStyle = "rgba(92,60,36,0.5)"; g.lineWidth = 3;
    g.beginPath(); g.ellipse(x, y, s * 0.6, s, 0, 0, TAU); g.stroke();
    g.fillStyle = "rgba(96,62,38,0.6)"; g.beginPath(); g.ellipse(x, y, s * 0.3, s * 0.55, 0, 0, TAU); g.fill();
  }
  for (let i = 0; i < 6; i++) { // splits
    const x = U(r, 30, W - 30), y = U(r, 0, H), l = U(r, 80, 260);
    g.strokeStyle = "rgba(52,34,24,0.6)"; g.lineWidth = 3; g.beginPath(); g.moveTo(x, y); g.lineTo(x + U(r, -5, 5), y + l); g.stroke();
  }
  // edges: light lip one side, shade on the other (reads as a rounded rail)
  const gr = g.createLinearGradient(0, 0, W, 0);
  gr.addColorStop(0, "rgba(255,238,210,0.26)"); gr.addColorStop(0.2, "rgba(255,238,210,0)"); gr.addColorStop(0.75, "rgba(60,36,20,0)"); gr.addColorStop(1, "rgba(60,36,20,0.3)");
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
});

// ---------------------------------------------------------------------------------------------------------------
// The Zero (A6M2, Hiryu air group, December 1941): light grey-green overall, black cowl, plain red discs, two blue
// bands round the rear fuselage. No lettering.
const ZERO = "#b3b89b";
const panelLine = (g: G, x0: number, y0: number, x1: number, y1: number, w = 2.2) => {
  g.strokeStyle = "rgba(70,78,62,0.6)"; g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
  g.strokeStyle = "rgba(240,244,224,0.3)"; g.lineWidth = w * 0.6; g.beginPath(); g.moveTo(x0 + 1.6, y0 + 1.6); g.lineTo(x1 + 1.6, y1 + 1.6); g.stroke();
};
const rivets = (g: G, x0: number, y0: number, x1: number, y1: number, step = 14) => {
  const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / step));
  g.fillStyle = "rgba(74,82,66,0.5)";
  for (let i = 0; i <= n; i++) { g.beginPath(); g.arc(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, 1.5, 0, TAU); g.fill(); }
};
const disc = (g: G, x: number, y: number, rx: number, ry: number, r: R) => {
  g.fillStyle = "#b02a2c"; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill();
  g.save(); g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.clip();
  blotch(g, x - rx * 0.3, y - ry * 0.3, rx * 0.9, 1, "214,74,66", 0.35);
  blotch(g, x + rx * 0.4, y + ry * 0.4, rx * 0.8, 1, "130,28,30", 0.3);
  for (let i = 0; i < 9; i++) { g.fillStyle = "rgba(178,186,160,0.75)"; g.beginPath(); g.ellipse(x + U(r, -rx, rx), y + U(r, -ry, ry), U(r, 2, 7), U(r, 1.5, 4), U(r, 0, 3), 0, TAU); g.fill(); } // chips
  g.restore();
  g.strokeStyle = "rgba(96,22,24,0.55)"; g.lineWidth = 2.5; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.stroke();
};
const weather = (g: G, r: R, W: number, H: number, n: number) => {
  for (let i = 0; i < n; i++) blotch(g, U(r, 0, W), U(r, 0, H), U(r, 50, 190), U(r, 1, 2.4), r() < 0.5 ? "226,232,208" : "120,126,104", 0.16);
  for (let i = 0; i < n * 4; i++) { // paint chips down to metal
    g.fillStyle = r() < 0.6 ? "rgba(214,218,214,0.6)" : "rgba(92,96,84,0.45)";
    g.beginPath(); g.ellipse(U(r, 0, W), U(r, 0, H), U(r, 1.5, 6), U(r, 1, 3), U(r, 0, 3), 0, TAU); g.fill();
  }
};

/** Fuselage skin: 2048 x 1024. u (canvas x) runs tail -> firewall over LEN metres; v (canvas y, flipped) runs once
 *  round the section: 0 belly, .25 the +z flank (near side), .5 spine, .75 the far flank.
 *  discU = u of the red disc; circ = section circumference there (m), to keep the disc round. */
export const zeroFuselage = (LEN: number, discU: number, circ: number) => clampT(ctex("zeroFus", 2048, 1024, (g, r) => {
  const W = 2048, H = 1024, pxm = W / LEN, Y = (v: number) => (1 - v) * H;
  g.fillStyle = ZERO; g.fillRect(0, 0, W, H);
  // form: lighter spine, greyer belly (painted, on top of the real two-tone light)
  const gr = g.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, "rgba(96,98,84,0.42)"); gr.addColorStop(0.16, "rgba(96,98,84,0.1)"); gr.addColorStop(0.5, "rgba(236,240,216,0.22)");
  gr.addColorStop(0.84, "rgba(96,98,84,0.1)"); gr.addColorStop(1, "rgba(96,98,84,0.42)");
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  weather(g, r, W, H, 30);
  // blue Hiryu bands, just aft of the disc
  for (const du of [-0.105, -0.068]) {
    g.fillStyle = "#3a5fa4"; g.fillRect((discU + du) * W, 0, 0.022 * W, H);
    g.fillStyle = "rgba(20,30,70,0.28)"; g.fillRect((discU + du) * W, 0, 3, H);
  }
  // frames (rings) and stringers
  for (let x = 0.06; x < 1; x += 0.085) { panelLine(g, x * W, 0, x * W, H); rivets(g, x * W + 9, 0, x * W + 9, H, 16); }
  for (const v of [0.07, 0.18, 0.33, 0.42, 0.58, 0.67, 0.82, 0.93]) { panelLine(g, 0, Y(v), W, Y(v), 1.8); rivets(g, 0, Y(v) + 8, W, Y(v) + 8, 22); }
  // access hatches on both flanks
  for (const v of [0.25, 0.75]) for (const [u, w, h] of [[0.52, 0.05, 0.05], [0.8, 0.06, 0.07], [0.2, 0.04, 0.04]]) {
    g.strokeStyle = "rgba(70,78,62,0.6)"; g.lineWidth = 2.2; g.strokeRect(u * W, Y(v) + 0.06 * H, w * W, h * H);
  }
  // red discs on both flanks
  const rx = 0.3 * pxm, ry = (0.3 / circ) * H;
  for (const v of [0.25, 0.75]) disc(g, discU * W, Y(v), rx, ry, r);
  // exhaust soot and oil streaks running aft from the firewall, low on the flanks
  for (const v of [0.14, 0.86, 0.2, 0.8]) {
    const y = Y(v), gg = g.createLinearGradient(W, 0, W * 0.5, 0);
    gg.addColorStop(0, "rgba(40,36,34,0.6)"); gg.addColorStop(1, "rgba(40,36,34,0)");
    g.fillStyle = gg; g.beginPath(); g.moveTo(W, y - 26); g.quadraticCurveTo(W * 0.7, y - 6, W * 0.5, y + 8); g.quadraticCurveTo(W * 0.7, y + 22, W, y + 30); g.fill();
  }
  // crash dirt thrown up the belly and the near flank
  for (let i = 0; i < 70; i++) {
    const x = U(r, 0.25, 1) * W, v = pick(r, [U(r, 0, 0.16), U(r, 0.84, 1), U(r, 0, 0.3)]);
    blotch(g, x, Y(v), U(r, 14, 60), U(r, 1, 3), "138,98,74", U(r, 0.25, 0.5));
  }
}));

/** Wing skin: 2048 x 512. u = span (0 = far tip, 1 = near tip), v: 0..0.5 upper surface (leading -> trailing edge),
 *  0.5..1 lower surface back to the leading edge. SPAN in m; chordAt(u) gives the local chord for the round discs. */
export const zeroWing = (SPAN: number, chordAt: (u: number) => number) => clampT(ctex("zeroWing", 2048, 512, (g, r) => {
  const W = 2048, H = 512, pxm = W / SPAN;
  g.fillStyle = ZERO; g.fillRect(0, 0, W, H);
  const gr = g.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, "rgba(238,242,220,0.28)"); gr.addColorStop(0.12, "rgba(238,242,220,0)"); gr.addColorStop(0.5, "rgba(96,98,84,0.16)");
  gr.addColorStop(0.55, "rgba(96,98,84,0.4)"); gr.addColorStop(1, "rgba(96,98,84,0.3)");
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  weather(g, r, W, H, 22);
  for (const top of [true, false]) {
    const y0 = top ? 0 : H, k = top ? 1 : -1, h2 = H / 2;
    for (let u = 0.04; u < 1; u += 0.062) { panelLine(g, u * W, y0, u * W, y0 + k * h2 * 0.98, 2); rivets(g, u * W + 8, y0, u * W + 8, y0 + k * h2, 14); } // ribs
    for (const c of [0.3, 0.68]) { panelLine(g, 0, y0 + k * h2 * c, W, y0 + k * h2 * c, 2); rivets(g, 0, y0 + k * h2 * c + 7, W, y0 + k * h2 * c + 7, 20); } // spars
    for (const [u0, u1] of [[0.04, 0.3], [0.7, 0.96]]) { // ailerons
      g.strokeStyle = "rgba(60,66,52,0.75)"; g.lineWidth = 3.2; g.strokeRect(u0 * W, y0 + k * h2 * 0.76, (u1 - u0) * W, k * h2 * 0.24);
    }
    for (const [u0, u1] of [[0.32, 0.45], [0.55, 0.68]]) { g.strokeStyle = "rgba(60,66,52,0.6)"; g.lineWidth = 2.6; g.strokeRect(u0 * W, y0 + k * h2 * 0.8, (u1 - u0) * W, k * h2 * 0.2); } // flaps
    for (const u of [0.21, 0.79]) { const c = chordAt(u); disc(g, u * W, y0 + k * h2 * 0.5, 0.34 * pxm, (0.34 / c) * h2, r); }
    for (const u of [0.38, 0.62]) { // wing-gun access panels and the red "no step" line, textless
      g.strokeStyle = "rgba(70,78,62,0.6)"; g.lineWidth = 2.2; g.strokeRect(u * W - 26, y0 + k * h2 * 0.14, 52, k * h2 * 0.2);
    }
  }
  // walkways by the roots (dark, upper surface) and grime thrown along the leading edge
  for (const u of [0.445, 0.52]) { g.fillStyle = "rgba(60,64,58,0.5)"; g.fillRect(u * W, H * 0.2, 0.035 * W, H * 0.26); }
  for (let i = 0; i < 60; i++) blotch(g, U(r, 0, W), pick(r, [U(r, 0, 30), U(r, H - 30, H)]), U(r, 10, 40), U(r, 1, 3), "138,98,74", U(r, 0.2, 0.5));
}));

/** Tail surfaces (fin, tailplane): 512 x 512, u = span / height, v round the section like the wing */
export const zeroTail = () => clampT(ctex("zeroTail", 512, 512, (g, r) => {
  const S = 512;
  g.fillStyle = ZERO; g.fillRect(0, 0, S, S);
  weather(g, r, S, S, 8);
  for (const y0 of [0, S]) {
    const k = y0 ? -1 : 1, h2 = S / 2;
    for (let u = 0.12; u < 1; u += 0.2) panelLine(g, u * S, y0, u * S, y0 + k * h2, 2);
    g.strokeStyle = "rgba(60,66,52,0.75)"; g.lineWidth = 3.2; g.beginPath(); g.moveTo(0, y0 + k * h2 * 0.6); g.lineTo(S, y0 + k * h2 * 0.6); g.stroke(); // hinge line
    for (let u = 0.06; u < 1; u += 0.11) { g.strokeStyle = "rgba(70,78,62,0.3)"; g.lineWidth = 1.6; g.beginPath(); g.moveTo(u * S, y0 + k * h2 * 0.62); g.lineTo(u * S, y0 + k * h2); g.stroke(); } // fabric ribs
  }
}));

/** Cowl front: the radial engine seen through the intake ring (512 x 512, clamp) */
export const engineFace = () => clampT(ctex("engineFace", 512, 512, (g) => {
  const c = 256;
  g.fillStyle = "#17161a"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 14; i++) { // cylinder heads with cooling fins
    const a = (i / 14) * TAU;
    g.save(); g.translate(c + Math.cos(a) * 150, c + Math.sin(a) * 150); g.rotate(a);
    g.fillStyle = "#4b4a50"; g.fillRect(-52, -24, 104, 48);
    g.strokeStyle = "#232228"; g.lineWidth = 4; for (let k = -40; k <= 40; k += 13) { g.beginPath(); g.moveTo(k, -24); g.lineTo(k, 24); g.stroke(); }
    g.fillStyle = "rgba(190,190,200,0.35)"; g.fillRect(-52, -24, 104, 7);
    g.restore();
  }
  g.fillStyle = "#34333a"; g.beginPath(); g.arc(c, c, 92, 0, TAU); g.fill(); // crankcase
  g.strokeStyle = "#77767e"; g.lineWidth = 5; g.beginPath(); g.arc(c, c, 92, 0, TAU); g.stroke();
  for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU; g.fillStyle = "#8a8990"; g.beginPath(); g.arc(c + Math.cos(a) * 74, c + Math.sin(a) * 74, 6, 0, TAU); g.fill(); }
}));

/** Propeller blade: 128 x 512, v along the blade (0 = hub). Polished metal face, two red warning stripes at the tip. */
export const propBlade = () => clampT(ctex("propBlade", 128, 512, (g, r) => {
  g.fillStyle = "#b9bcc0"; g.fillRect(0, 0, 128, 512);
  const gr = g.createLinearGradient(0, 0, 128, 0);
  gr.addColorStop(0, "rgba(255,255,255,0.4)"); gr.addColorStop(0.4, "rgba(255,255,255,0)"); gr.addColorStop(1, "rgba(60,62,72,0.4)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 512);
  for (let i = 0; i < 40; i++) { g.strokeStyle = "rgba(90,92,100,0.3)"; g.lineWidth = 1.5; const y = U(r, 0, 512); g.beginPath(); g.moveTo(0, y); g.lineTo(128, y + U(r, -8, 8)); g.stroke(); } // scuffs
  g.fillStyle = "#c2352c"; g.fillRect(0, 26, 128, 16); g.fillRect(0, 54, 128, 16); // canvas y 0 = tip (v = 1)
  g.fillStyle = "rgba(150,92,58,0.6)"; g.fillRect(0, 0, 128, 22); // dirt on the tip
}));

/** Cockpit glazing: faint blue sheet with diagonal glints (transparent material) */
export const glassTex = () => clampT(ctex("glassTex", 256, 256, (g) => {
  g.clearRect(0, 0, 256, 256);
  g.fillStyle = "rgba(190,226,244,0.26)"; g.fillRect(0, 0, 256, 256);
  g.fillStyle = "rgba(255,255,255,0.55)";
  for (const x of [60, 96]) { g.beginPath(); g.moveTo(x, 256); g.lineTo(x + 120, 0); g.lineTo(x + (x === 60 ? 150 : 132), 0); g.lineTo(x + (x === 60 ? 30 : 12), 256); g.fill(); }
}));

// ---------------------------------------------------------------------------------------------------------------
/** Plantation house wall: vertical board-and-batten, painted cream with green trim; windows / door per options.
 *  wm x hm metres at 128 px/m. One image per wall face (clamp). */
export const boardWall = (key: string, wm: number, hm: number, o: { windows?: number[]; door?: number; wall?: string; trim?: string }) =>
  clampT(ctex("boardWall" + key, Math.round(wm * 128), Math.round(hm * 128), (g, r) => {
    const W = Math.round(wm * 128), H = Math.round(hm * 128), wall = o.wall ?? "#e7e0c4", trim = o.trim ?? "#4d7a5c";
    g.fillStyle = wall; g.fillRect(0, 0, W, H);
    for (let i = 0; i < wm * 3; i++) blotch(g, U(r, 0, W), U(r, 0, H), U(r, 60, 160), 1, r() < 0.5 ? "250,246,226" : "168,150,116", 0.2);
    const B = 34; // board pitch (0.27 m) with a raised batten on every joint
    for (let x = 0; x < W; x += B) {
      g.fillStyle = jit(r, wall, 0.04, 2, 0.1); g.globalAlpha = 0.5; g.fillRect(x, 0, B, H); g.globalAlpha = 1;
      g.fillStyle = "rgba(255,252,236,0.5)"; g.fillRect(x - 5, 0, 4, H);
      g.fillStyle = "rgba(120,104,78,0.55)"; g.fillRect(x - 1, 0, 4, H);
      g.fillStyle = "rgba(120,104,78,0.16)"; g.fillRect(x + 3, 0, 5, H);
    }
    const gs = g.createLinearGradient(0, H * 0.72, 0, H); // rain-stained, red-dust foot
    gs.addColorStop(0, "rgba(170,108,70,0)"); gs.addColorStop(1, "rgba(170,108,70,0.4)");
    g.fillStyle = gs; g.fillRect(0, 0, W, H);
    g.fillStyle = "rgba(60,50,70,0.2)"; g.fillRect(0, 0, W, 20); // eave shadow
    const frame = (x: number, y: number, w: number, h: number) => {
      g.fillStyle = "rgba(60,50,40,0.25)"; g.fillRect(x - 6, y - 6 + 5, w + 12, h + 12);
      g.fillStyle = trim; g.fillRect(x - 9, y - 9, w + 18, h + 18);
      g.fillStyle = "rgba(255,255,255,0.22)"; g.fillRect(x - 9, y - 9, w + 18, 4);
    };
    for (const cx of o.windows ?? []) { // double-hung sash windows
      const w = 100, h = 140, x = cx * 128 - w / 2, y = H * 0.24;
      frame(x, y, w, h);
      const gg = g.createLinearGradient(0, y, 0, y + h); gg.addColorStop(0, "#5a6a94"); gg.addColorStop(1, "#7f8fb6");
      g.fillStyle = gg; g.fillRect(x, y, w, h);
      g.fillStyle = "rgba(240,236,214,0.85)"; g.beginPath(); g.moveTo(x, y); g.lineTo(x + w * 0.44, y); g.quadraticCurveTo(x + w * 0.3, y + h * 0.5, x, y + h * 0.7); g.fill(); // curtain
      g.fillStyle = "rgba(255,255,255,0.3)"; g.beginPath(); g.moveTo(x + w * 0.6, y); g.lineTo(x + w * 0.78, y); g.lineTo(x + w * 0.5, y + h); g.lineTo(x + w * 0.32, y + h); g.fill();
      g.fillStyle = "#f4efdc"; g.fillRect(x, y + h / 2 - 4, w, 8); g.fillRect(x + w / 2 - 3, y, 6, h);
      g.fillStyle = trim; g.fillRect(x - 14, y + h + 9, w + 28, 9); // sill
    }
    if (o.door !== undefined) {
      const w = 112, h = H * 0.7, x = o.door * 128 - w / 2, y = H - h;
      frame(x, y, w, h + 20);
      g.fillStyle = "#6f4a34"; g.fillRect(x, y, w, h);
      for (const [px, py, pw, ph] of [[0.12, 0.06, 0.76, 0.36], [0.12, 0.5, 0.76, 0.42]]) {
        g.fillStyle = "rgba(40,22,14,0.35)"; g.fillRect(x + px * w, y + py * h, pw * w, ph * h);
        g.fillStyle = "rgba(255,220,180,0.18)"; g.fillRect(x + px * w, y + py * h + ph * h - 4, pw * w, 4);
      }
      g.fillStyle = "#d8b45a"; g.beginPath(); g.arc(x + w * 0.84, y + h * 0.5, 6, 0, TAU); g.fill();
    }
  }));

/** Corrugated iron: 512 px = 1.6 m; ribs run along v (down the roof slope). Red-oxide paint, rust at the laps. */
export const tinHD = (key = "roof", base = "#a9523c") => ctex("tinHD" + key, 512, 512, (g, r) => {
  const S = 512;
  g.fillStyle = base; g.fillRect(0, 0, S, S);
  for (let x = 0; x < S; x += 32) {
    const gr = g.createLinearGradient(x, 0, x + 32, 0);
    gr.addColorStop(0, "rgba(40,16,16,0.34)"); gr.addColorStop(0.35, "rgba(255,214,190,0.3)"); gr.addColorStop(0.7, "rgba(255,214,190,0)"); gr.addColorStop(1, "rgba(40,16,16,0.34)");
    g.fillStyle = gr; g.fillRect(x, 0, 32, S);
  }
  for (let i = 0; i < 26; i++) blotch(g, U(r, 0, S), U(r, 0, S), U(r, 30, 110), 0.5, r() < 0.6 ? "110,58,34" : "214,150,120", 0.3);
  for (const y of [0, 256]) { g.fillStyle = "rgba(50,22,18,0.5)"; g.fillRect(0, y, S, 5); g.fillStyle = "rgba(255,220,200,0.25)"; g.fillRect(0, y + 5, S, 3); } // sheet laps
});

// ---------------------------------------------------------------------------------------------------------------
/** Coconut-palm trunk: 512 x 512, u along the trunk (1 tile = 1.2 m), ring scars every ~0.15 m */
export const palmTrunk = () => ctex("palmTrunk", 512, 512, (g, r) => {
  const S = 512;
  g.fillStyle = "#a08a6c"; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 20; i++) blotch(g, U(r, 0, S), U(r, 0, S), U(r, 40, 120), 1, r() < 0.5 ? "200,182,150" : "110,92,70", 0.25);
  for (let x = 0; x < S; x += 64) {
    const gr = g.createLinearGradient(x, 0, x + 64, 0);
    gr.addColorStop(0, "rgba(70,52,38,0.6)"); gr.addColorStop(0.12, "rgba(70,52,38,0.15)"); gr.addColorStop(0.2, "rgba(236,220,190,0.3)"); gr.addColorStop(0.5, "rgba(236,220,190,0)"); gr.addColorStop(1, "rgba(70,52,38,0.2)");
    g.fillStyle = gr; g.fillRect(x, 0, 64, S);
  }
  for (let i = 0; i < 160; i++) { g.strokeStyle = "rgba(76,58,42,0.35)"; g.lineWidth = 1.5; const x = U(r, 0, S), y = U(r, 0, S); g.beginPath(); g.moveTo(x, y); g.lineTo(x + U(r, 8, 30), y + U(r, -3, 3)); g.stroke(); }
});

/** Palm frond: 256 x 1024 cut-out (alphaTest), stem at the bottom centre. Leaflets as a toothed outline, painted
 *  mid-rib and leaflet strokes, dark plum-green edge so it carries its own line. */
export const frondTex = (v = 0) => clampT(ctex("frond" + v, 256, 1024, (g) => {
  const r = rng(77 + v * 13), W = 256, H = 1024, n = 20;
  g.clearRect(0, 0, W, H);
  const half = (t: number) => (8 + 112 * Math.sin(Math.PI * Math.min(1, t * 1.08)) ** 0.7) * (1 - 0.25 * t);
  const side = (s: number) => {
    const pts: [number, number][] = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, y = H - 30 - t * (H - 50), w = half(t);
      pts.push([W / 2 + s * w, y - 26]); pts.push([W / 2 + s * w * 0.45, y - 40 - U(r, 0, 8)]); // tooth tip, notch
    }
    return pts;
  };
  const L = side(-1), Rr = side(1).reverse();
  g.beginPath(); g.moveTo(W / 2, H - 6);
  for (const [x, y] of L) g.lineTo(x, y);
  g.lineTo(W / 2, 6);
  for (const [x, y] of Rr) g.lineTo(x, y);
  g.closePath();
  const gr = g.createLinearGradient(0, 0, W, 0);
  gr.addColorStop(0, v ? "#5d8a3c" : "#4f8440"); gr.addColorStop(0.5, v ? "#86ad4a" : "#74a548"); gr.addColorStop(1, v ? "#55803a" : "#497c3e");
  g.fillStyle = gr; g.fill();
  g.save(); g.clip();
  const tip = g.createLinearGradient(0, 0, 0, H); tip.addColorStop(0, "rgba(206,196,104,0.6)"); tip.addColorStop(0.3, "rgba(206,196,104,0)");
  g.fillStyle = tip; g.fillRect(0, 0, W, H); // sun-dried tips
  g.lineCap = "round";
  for (let i = 0; i <= n * 2; i++) { // leaflet strokes
    const t = i / (n * 2), y = H - 30 - t * (H - 50), w = half(t);
    for (const s of [-1, 1]) {
      g.strokeStyle = i % 2 ? "rgba(40,78,40,0.55)" : "rgba(176,214,110,0.5)"; g.lineWidth = 3;
      g.beginPath(); g.moveTo(W / 2, y); g.lineTo(W / 2 + s * w, y - 30); g.stroke();
    }
  }
  g.restore();
  g.strokeStyle = "#2c3a2a"; g.lineWidth = 5; g.lineJoin = "round"; g.stroke();
  g.strokeStyle = "#d8cf8a"; g.lineWidth = 7; g.beginPath(); g.moveTo(W / 2, H - 4); g.lineTo(W / 2, 30); g.stroke(); // mid-rib
}));

/** Kiawe / scrub foliage: 1024 px, feathery sage-green dabs with darker pockets */
export const foliageHD = (key = "kiawe", base = "#7d9a52", lit = "176,200,110", dark = "70,98,56") => ctex("foliage" + key, 1024, 1024, (g, r) => {
  const S = 1024;
  g.fillStyle = base; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 60; i++) {
    const x = U(r, 0, S), y = U(r, 0, S), rd = U(r, 50, 150);
    wrap2(S, S, x, y, rd * 1.3, (xx, yy) => blotch(g, xx, yy, rd, 1.3, r() < 0.5 ? lit : dark, 0.38));
  }
  g.lineCap = "round";
  for (let i = 0; i < 1500; i++) { // leaf dabs in little arcs
    const x = U(r, 0, S), y = U(r, 0, S), l = U(r, 12, 30), a = U(r, 0, TAU), t = r();
    wrap2(S, S, x, y, 40, (xx, yy) => {
      g.strokeStyle = t < 0.45 ? `rgba(${lit},0.6)` : `rgba(${dark},0.5)`; g.lineWidth = U(r, 4, 8);
      g.beginPath(); g.moveTo(xx, yy); g.quadraticCurveTo(xx + Math.cos(a) * l * 0.5 + 6, yy + Math.sin(a) * l * 0.5 - 6, xx + Math.cos(a) * l, yy + Math.sin(a) * l); g.stroke();
    });
  }
});

/** Dry grass tuft cut-outs (alphaTest), 256 x 256, base at the bottom centre; three shapes. Own thin dark line. */
export const tuftTex = (v: number) => clampT(ctex("tuft" + v, 256, 256, (g) => {
  const r = rng(31 + v * 17), n = 9 + v * 3;
  g.clearRect(0, 0, 256, 256);
  g.lineCap = "round"; g.lineJoin = "round";
  const blades: { a: number; l: number; b: number; c: string }[] = [];
  for (let i = 0; i < n; i++) blades.push({ a: ((i + 0.5) / n - 0.5) * (1.9 + 0.3 * v) + U(r, -0.1, 0.1), l: U(r, 120, 226), b: U(r, -40, 40), c: pick(r, ["#e2c476", "#d2ac5a", "#c59a4c", "#ecd690", "#b98e44", v === 2 ? "#a9a45c" : "#dcb866"]) });
  const draw = (w: number, col: string | null) => {
    for (const k of blades) {
      const x1 = 128 + Math.sin(k.a) * k.l, y1 = 250 - Math.cos(k.a) * k.l;
      g.strokeStyle = col ?? k.c; g.lineWidth = w;
      g.beginPath(); g.moveTo(128 + Math.sin(k.a) * 8, 250); g.quadraticCurveTo(128 + Math.sin(k.a) * k.l * 0.5 + k.b * 0.4, 250 - Math.cos(k.a) * k.l * 0.62, x1 + k.b, y1 + Math.abs(k.b) * 0.5); g.stroke();
    }
  };
  draw(19, "#4a3220"); draw(11, null);
  g.fillStyle = "#4a3220"; g.beginPath(); g.ellipse(128, 248, 34, 9, 0, 0, TAU); g.fill();
}));

/** Neighbouring island on the horizon: 2048 x 512 cut-out with hazy ridges and a cloud cap (unlit card) */
export const islandTex = () => clampT(ctex("islandTex", 2048, 512, (g) => {
  const r = rng(4711), W = 2048, H = 512;
  g.clearRect(0, 0, W, H);
  const ridge = (base: number, amp: number, col0: string, col1: string, seed: number, x0: number, x1: number) => {
    const rr = rng(seed), ph = [rr() * 9, rr() * 9, rr() * 9];
    g.beginPath(); g.moveTo(x0, H);
    for (let x = x0; x <= x1; x += 8) {
      const t = (x - x0) / (x1 - x0), env = Math.sin(Math.PI * t) ** 0.6;
      const h = env * (amp * (0.62 + 0.2 * Math.sin(t * 5 + ph[0]) + 0.1 * Math.sin(t * 13 + ph[1]) + 0.06 * Math.sin(t * 31 + ph[2])));
      g.lineTo(x, H - base - h);
    }
    g.lineTo(x1, H); g.closePath();
    const gr = g.createLinearGradient(0, H - base - amp, 0, H);
    gr.addColorStop(0, col0); gr.addColorStop(1, col1);
    g.fillStyle = gr; g.fill();
  };
  ridge(0, 400, "#8ba3d6", "#b4c8ea", 3, 150, 1900);
  ridge(0, 250, "#7f99cf", "#b0c6ea", 9, 60, 1250);
  ridge(0, 150, "#7791c8", "#abc2e8", 15, 800, 2000);
  for (let i = 0; i < 9; i++) { // soft cloud cap on the summit
    g.save(); g.filter = "blur(10px)"; g.fillStyle = "rgba(250,248,244,0.9)";
    g.beginPath(); g.ellipse(820 + i * 62 + U(r, -20, 20), 132 + U(r, -18, 26), U(r, 60, 120), U(r, 22, 38), 0, 0, TAU); g.fill(); g.restore();
  }
  const m = g.createLinearGradient(0, H - 46, 0, H); // sea haze at the foot
  m.addColorStop(0, "rgba(184,208,236,0)"); m.addColorStop(1, "rgba(184,208,236,0.95)");
  g.fillStyle = m; g.globalCompositeOperation = "source-atop"; g.fillRect(0, 0, W, H); g.globalCompositeOperation = "source-over";
}));

/** Sea from the shore to the horizon: 64 x 1024 gradient, v = 0 at the shore. Turquoise shallows, surf line, deep blue. */
export const seaTex = () => clampT(ctex("seaTex", 256, 1024, (g, r) => {
  const H = 1024;
  const gr = g.createLinearGradient(0, H, 0, 0);
  gr.addColorStop(0, "#bfeee4"); gr.addColorStop(0.012, "#6fd3cf"); gr.addColorStop(0.05, "#2fa9c2"); gr.addColorStop(0.16, "#1f7fba"); gr.addColorStop(0.5, "#2a6db4"); gr.addColorStop(1, "#5b8fd0");
  g.fillStyle = gr; g.fillRect(0, 0, 256, H);
  for (let i = 0; i < 130; i++) { const y = H - U(r, 0, 1) ** 2.2 * H; g.fillStyle = `rgba(255,255,255,${U(r, 0.12, 0.4)})`; g.fillRect(U(r, 0, 256), y, U(r, 14, 60), 2); } // crests
  g.fillStyle = "rgba(255,255,255,0.9)"; g.fillRect(0, H - 8, 256, 8); // surf
}));

/** soft-edged ground decal (alpha): turned earth where the plane ploughed in. 1024 x 256, long axis = the furrow. */
export const furrowTex = () => clampT(ctex("furrowTex", 1024, 256, (g, r) => {
  g.clearRect(0, 0, 1024, 256);
  for (let i = 0; i < 260; i++) {
    const x = U(r, 0, 1024), t = x / 1024, y = 128 + U(r, -1, 1) * (26 + 60 * t), rd = U(r, 22, 54);
    blotch(g, x, y, rd, 1.6, pick(r, ["134,92,70", "150,106,80", "112,76,58"]), 0.5 * Math.min(1, t * 6, (1 - t) * 30 + 0.4));
  }
  for (const dy of [-26, 0, 24]) { // gouges
    g.strokeStyle = "rgba(86,44,28,0.65)"; g.lineWidth = 9; g.lineCap = "round";
    g.beginPath(); g.moveTo(90, 128 + dy * 0.4); g.bezierCurveTo(400, 128 + dy + U(r, -12, 12), 700, 128 + dy + U(r, -12, 12), 1010, 128 + dy * 1.5); g.stroke();
    g.strokeStyle = "rgba(226,160,110,0.35)"; g.lineWidth = 3; g.beginPath(); g.moveTo(90, 128 + dy * 0.4 - 8); g.bezierCurveTo(400, 128 + dy - 8, 700, 128 + dy - 8, 1010, 128 + dy * 1.5 - 8); g.stroke();
  }
}));

/** soft bare-earth / worn-path decal, 512 x 512 alpha */
export const patchTex = (v: number) => clampT(ctex("patchTex" + v, 512, 512, (g) => {
  const r = rng(900 + v * 7);
  g.clearRect(0, 0, 512, 512);
  for (let i = 0; i < 70; i++) {
    const a = U(r, 0, TAU), d = U(r, 0, 1) ** 0.7 * 170;
    blotch(g, 256 + Math.cos(a) * d * 1.2, 256 + Math.sin(a) * d * 0.8, U(r, 30, 80), 1.3, pick(r, v ? ["226,204,140", "150,140,86", "210,184,120"] : ["158,110,82", "138,94,72", "172,124,94"]), 0.4);
  }
  for (let i = 0; i < 40; i++) { const a = U(r, 0, TAU), d = U(r, 0, 150); g.fillStyle = "rgba(96,70,56,0.5)"; g.beginPath(); g.ellipse(256 + Math.cos(a) * d * 1.2, 256 + Math.sin(a) * d * 0.8, U(r, 2, 6), U(r, 1.5, 4), 0, 0, TAU); g.fill(); }
}));

/** very large, very soft tone drift over the whole field (alpha decal, 1024 px = 90 m): breaks the 6 m tile */
export const macroTex = () => ctex("macroTex", 1024, 1024, (g, r) => {
  const S = 1024;
  g.clearRect(0, 0, S, S);
  for (let i = 0; i < 90; i++) {
    const x = U(r, 0, S), y = U(r, 0, S), rd = U(r, 40, 150), c = pick(r, ["232,204,128", "150,112,58", "176,160,88", "196,128,84", "226,190,110", "132,120,70"]);
    wrap2(S, S, x, y, rd * 2, (xx, yy) => blotch(g, xx, yy, rd, U(r, 1, 2), c, U(r, 0.2, 0.42)));
  }
});
