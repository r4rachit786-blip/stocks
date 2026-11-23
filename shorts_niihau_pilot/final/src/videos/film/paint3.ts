// Painted textures for the night party set (v3): flat colour fields + thin crisp painted detail + legible lettering
// (STUDY.md C). Same manner as the kit's paint.ts; uses its ctex / rng.
import * as THREE from "three";
import { ctex, rng } from "./paint";

type G = CanvasRenderingContext2D;
const TAU = Math.PI * 2;
const clampT = (t: THREE.Texture) => { t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.anisotropy = 16; t.needsUpdate = true; return t; };
const SERIF = "'DejaVu Serif', 'Bitstream Charter', serif", SANS = "Inter, 'DejaVu Sans', sans-serif";
const rr = (g: G, x: number, y: number, w: number, h: number, k: number) => { g.beginPath(); g.moveTo(x + k, y); g.arcTo(x + w, y, x + w, y + h, k); g.arcTo(x + w, y + h, x, y + h, k); g.arcTo(x, y + h, x, y, k); g.arcTo(x, y, x + w, y, k); g.closePath(); };

/** red / white checked tablecloth, 1024 px = 1 m (8 checks per metre), weave ticks, a few creases */
export const checkCloth = () => ctex("checkCloth", 1024, 1024, (g, r) => {
  const S = 1024, C = 64;
  g.fillStyle = "#f3ead8"; g.fillRect(0, 0, S, S);
  for (let i = 0; i < S / C; i++) { g.fillStyle = "rgba(200,58,50,0.62)"; if (i % 2) { g.fillRect(i * C, 0, C, S); g.fillRect(0, i * C, S, C); } }
  for (let i = 0; i < S / C; i++) for (let j = 0; j < S / C; j++) if (i % 2 && j % 2) { g.fillStyle = "#a82c2c"; g.fillRect(i * C, j * C, C, C); }
  g.strokeStyle = "rgba(90,20,20,0.16)"; g.lineWidth = 1;
  for (let y = 0; y < S; y += 6) { g.beginPath(); g.moveTo(0, y); g.lineTo(S, y); g.stroke(); }
  for (let i = 0; i < 5; i++) { const y = r() * S; g.strokeStyle = "rgba(255,255,255,0.3)"; g.lineWidth = 5; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(300, y + 20, 700, y - 24, S, y + 6); g.stroke(); g.strokeStyle = "rgba(70,20,30,0.2)"; g.beginPath(); g.moveTo(0, y + 7); g.bezierCurveTo(300, y + 27, 700, y - 17, S, y + 13); g.stroke(); }
});

/** woven lauhala mat: over-under strips 5 cm wide, 1024 px = 0.8 m */
export const lauhala = () => ctex("lauhala", 1024, 1024, (g, r) => {
  const S = 1024, C = 64;
  g.fillStyle = "#b08a4a"; g.fillRect(0, 0, S, S);
  for (let i = 0; i < S / C; i++) for (let j = 0; j < S / C; j++) {
    const hor = (i + j) % 2 === 0, k = 0.92 + 0.16 * r();
    g.fillStyle = hor ? `rgb(${Math.round(222 * k)},${Math.round(188 * k)},${Math.round(116 * k)})` : `rgb(${Math.round(198 * k)},${Math.round(160 * k)},${Math.round(92 * k)})`;
    g.fillRect(i * C + 2, j * C + 2, C - 4, C - 4);
    g.strokeStyle = "rgba(120,84,36,0.35)"; g.lineWidth = 2;
    for (let t = 14; t < C; t += 16) { g.beginPath(); if (hor) { g.moveTo(i * C + 3, j * C + t); g.lineTo(i * C + C - 3, j * C + t); } else { g.moveTo(i * C + t, j * C + 3); g.lineTo(i * C + t, j * C + C - 3); } g.stroke(); }
    g.fillStyle = "rgba(255,240,200,0.3)"; g.fillRect(i * C + 2, j * C + 2, C - 4, 4);
    g.fillStyle = "rgba(70,44,16,0.4)"; g.fillRect(i * C + 2, j * C + C - 5, C - 4, 3);
  }
});

/** table / radio cabinet wood: warm boards with long grain; grain along canvas x. key picks the tone. */
export const grainWood = (key: string, base: string, boards = 4) => ctex("grainWood" + key, 1024, 512, (g, r) => {
  const W = 1024, H = 512, B = H / boards;
  for (let b = 0; b < boards; b++) {
    g.save(); g.beginPath(); g.rect(0, b * B, W, B); g.clip();
    g.fillStyle = base; g.fillRect(0, b * B, W, B);
    g.fillStyle = r() < 0.5 ? "rgba(255,220,170,0.1)" : "rgba(60,30,10,0.1)"; g.fillRect(0, b * B, W, B);
    for (let i = 0; i < 26; i++) {
      const y = b * B + r() * B, a = r() * 14;
      g.strokeStyle = r() < 0.3 ? "rgba(255,226,180,0.3)" : "rgba(84,44,18,0.36)"; g.lineWidth = 1.5 + r() * 3;
      g.beginPath(); g.moveTo(-10, y); g.bezierCurveTo(W * 0.3, y + a, W * 0.6, y - a, W + 10, y + a * 0.4); g.stroke();
    }
    if (r() < 0.7) { const x = 100 + r() * 800, y = b * B + B * (0.3 + 0.4 * r()); g.strokeStyle = "rgba(70,36,14,0.6)"; g.lineWidth = 3; for (const k of [1, 1.8, 2.7]) { g.beginPath(); g.ellipse(x, y, 16 * k, 7 * k, 0, 0, TAU); g.stroke(); } }
    g.restore();
    g.fillStyle = "#2c1408"; g.fillRect(0, b * B - 2, W, 4);
    g.fillStyle = "rgba(255,230,190,0.3)"; g.fillRect(0, b * B + 2, W, 2);
  }
});

/** radio front, 1024 x 704 (0.46 x 0.32 m): speaker cloth with fretwork, lit dial with station numbers, knobs.
 *  lit = true draws only what glows (dial face, numbers, pointer) on black, for the emissive overlay. */
export const radioFront = (lit: boolean) => clampT(ctex("radioFront" + lit, 1024, 704, (g, r) => {
  const W = 1024, H = 704;
  if (!lit) {
    g.fillStyle = "#7a4a26"; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 40; i++) { const y = r() * H; g.strokeStyle = r() < 0.3 ? "rgba(255,216,160,0.22)" : "rgba(50,24,8,0.32)"; g.lineWidth = 2 + r() * 3; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(300, y + 12, 700, y - 12, W, y + 5); g.stroke(); }
    g.strokeStyle = "#3a1e0c"; g.lineWidth = 14; rr(g, 16, 16, W - 32, H - 32, 46); g.stroke();
    g.strokeStyle = "rgba(255,214,150,0.5)"; g.lineWidth = 4; rr(g, 30, 30, W - 60, H - 60, 38); g.stroke();
    // speaker: cloth + fretwork bars
    rr(g, 70, 74, 430, 430, 60); g.fillStyle = "#c9a468"; g.fill();
    g.save(); g.clip();
    for (let y = 74; y < 510; y += 9) { g.fillStyle = "rgba(96,64,28,0.42)"; g.fillRect(70, y, 430, 3); }
    for (let x = 70; x < 500; x += 9) { g.fillStyle = "rgba(96,64,28,0.24)"; g.fillRect(x, 74, 3, 430); }
    g.fillStyle = "#5a3216"; for (const x of [150, 240, 330, 420]) g.fillRect(x - 12, 74, 24, 430);
    g.restore();
    g.strokeStyle = "#3a1e0c"; g.lineWidth = 12; rr(g, 70, 74, 430, 430, 60); g.stroke();
    for (const [x, y, rad] of [[610, 600, 46], [880, 600, 46], [745, 612, 26]]) { // knobs
      g.fillStyle = "#1c1210"; g.beginPath(); g.arc(x, y + 5, rad + 4, 0, TAU); g.fill();
      g.fillStyle = "#4a3428"; g.beginPath(); g.arc(x, y, rad, 0, TAU); g.fill();
      g.fillStyle = "#6e5140"; g.beginPath(); g.arc(x - 6, y - 8, rad * 0.62, 0, TAU); g.fill();
      g.strokeStyle = "#f0dcae"; g.lineWidth = 6; g.beginPath(); g.moveTo(x, y); g.lineTo(x + rad * 0.5, y - rad * 0.7); g.stroke();
    }
    g.fillStyle = "#e8c98a"; g.font = `bold 34px ${SERIF}`; g.textAlign = "center"; g.fillText("TUNE", 610, 690); g.fillText("VOL", 880, 690);
  } else { g.fillStyle = "#000"; g.fillRect(0, 0, W, H); }
  // dial window: amber face, numbered arc, red pointer
  const cx = 745, cy = 430, R = 250;
  g.save(); rr(g, 560, 90, 380, 400, 40); g.clip();
  const gr = g.createRadialGradient(cx, cy - 60, 20, cx, cy - 40, 330);
  gr.addColorStop(0, "#fff0b8"); gr.addColorStop(0.5, "#f6b84a"); gr.addColorStop(1, "#c8741c");
  g.fillStyle = gr; g.fillRect(560, 90, 380, 400);
  g.strokeStyle = "#4a240a"; g.lineWidth = 6; g.beginPath(); g.arc(cx, cy, R, Math.PI * 1.13, Math.PI * 1.87); g.stroke();
  g.beginPath(); g.arc(cx, cy, R - 60, Math.PI * 1.13, Math.PI * 1.87); g.lineWidth = 3; g.stroke();
  const nums = ["55", "60", "70", "80", "100", "120", "140", "160"];
  g.fillStyle = "#3a1a06"; g.font = `bold 34px ${SERIF}`; g.textAlign = "center"; g.textBaseline = "middle";
  nums.forEach((s, i) => {
    const a = Math.PI * (1.16 + (0.68 * i) / (nums.length - 1));
    g.save(); g.translate(cx + Math.cos(a) * (R - 30), cy + Math.sin(a) * (R - 30)); g.rotate(a + Math.PI / 2); g.fillText(s, 0, 0); g.restore();
    for (let k = 0; k < 4; k++) { const b = a + (k * 0.68 * Math.PI) / (nums.length - 1) / 4; g.strokeStyle = "#4a240a"; g.lineWidth = k ? 3 : 6; g.beginPath(); g.moveTo(cx + Math.cos(b) * (R - 60), cy + Math.sin(b) * (R - 60)); g.lineTo(cx + Math.cos(b) * (R - 60 - (k ? 14 : 26)), cy + Math.sin(b) * (R - 60 - (k ? 14 : 26))); g.stroke(); }
  });
  g.font = `bold 30px ${SERIF}`; g.fillText("KILOCYCLES", cx, 330); g.font = `bold 24px ${SERIF}`; g.fillText("KGMB  ·  HONOLULU", cx, 372);
  const pa = Math.PI * 1.42; g.strokeStyle = "#c2281e"; g.lineWidth = 8; g.beginPath(); g.moveTo(cx, cy + 10); g.lineTo(cx + Math.cos(pa) * (R - 6), cy + Math.sin(pa) * (R - 6)); g.stroke();
  g.restore();
  g.strokeStyle = lit ? "#000" : "#2a1408"; g.lineWidth = 14; rr(g, 560, 90, 380, 400, 40); g.stroke();
  if (!lit) { g.strokeStyle = "#d9b26a"; g.lineWidth = 4; rr(g, 548, 78, 404, 424, 48); g.stroke(); }
}));

/** dry-cell battery label wrapped round a box: 1024 x 512 */
export const batteryLabel = () => clampT(ctex("batteryLabel", 1024, 512, (g) => {
  g.fillStyle = "#c9372c"; g.fillRect(0, 0, 1024, 512);
  g.fillStyle = "#1f3f7a"; g.fillRect(0, 0, 1024, 120); g.fillRect(0, 400, 1024, 112);
  g.fillStyle = "#f4e6c0"; g.fillRect(0, 120, 1024, 12); g.fillRect(0, 388, 1024, 12);
  g.textAlign = "center"; g.textBaseline = "middle";
  for (const x of [256, 768]) {
    g.fillStyle = "#f4e6c0"; g.font = `bold 120px ${SERIF}`; g.fillText("DRY CELL", x, 235);
    g.font = `bold 62px ${SERIF}`; g.fillText("RADIO  “B”  45 V", x, 335);
    g.fillStyle = "#f4d35a"; g.font = `bold 54px ${SERIF}`; g.fillText("★  EVER-LIVE  ★", x, 62);
    g.fillStyle = "#f4e6c0"; g.font = `bold 40px ${SANS}`; g.fillText("KEEP DRY", x, 456);
  }
}));

/** hand-painted welcome board, 1024 x 320 */
export const alohaSign = () => clampT(ctex("alohaSign", 1024, 320, (g, r) => {
  g.fillStyle = "#e9dcb6"; g.fillRect(0, 0, 1024, 320);
  for (let i = 0; i < 30; i++) { const y = r() * 320; g.strokeStyle = "rgba(120,90,50,0.22)"; g.lineWidth = 2 + r() * 2; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(300, y + 8, 700, y - 8, 1024, y + 3); g.stroke(); }
  g.strokeStyle = "#2f7a5c"; g.lineWidth = 16; g.strokeRect(14, 14, 996, 292);
  g.textAlign = "center"; g.textBaseline = "middle"; g.font = `bold 210px ${SERIF}`;
  g.fillStyle = "#7a1f1a"; g.fillText("ALOHA", 518, 172); g.fillStyle = "#d2392e"; g.fillText("ALOHA", 510, 164);
  for (const x of [84, 940]) for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU; g.fillStyle = "#f2b83a"; g.beginPath(); g.ellipse(x + Math.cos(a) * 24, 160 + Math.sin(a) * 24, 22, 15, a, 0, TAU); g.fill(); g.fillStyle = "#d2392e"; g.beginPath(); g.arc(x, 160, 10, 0, TAU); g.fill(); }
}));

/** top view of a plate with food, 512 x 512 cut-out; v picks the dish */
export const plateTex = (v: number) => clampT(ctex("plate" + v, 512, 512, (g) => {
  const r = rng(40 + v);
  g.clearRect(0, 0, 512, 512);
  g.fillStyle = "#2a2440"; g.beginPath(); g.arc(256, 256, 250, 0, TAU); g.fill();
  g.fillStyle = "#f4efe2"; g.beginPath(); g.arc(256, 256, 240, 0, TAU); g.fill();
  g.strokeStyle = "#3f6aa8"; g.lineWidth = 10; g.beginPath(); g.arc(256, 256, 222, 0, TAU); g.stroke();
  g.fillStyle = "#e4dccb"; g.beginPath(); g.arc(256, 256, 170, 0, TAU); g.fill();
  if (v === 0) { // poi (purple) + fish
    g.fillStyle = "#8a6aa6"; g.beginPath(); g.ellipse(200, 250, 100, 86, 0.3, 0, TAU); g.fill(); g.fillStyle = "#a98bc2"; g.beginPath(); g.ellipse(180, 228, 50, 34, 0.3, 0, TAU); g.fill();
    g.fillStyle = "#d98a4a"; g.beginPath(); g.ellipse(330, 290, 78, 38, -0.5, 0, TAU); g.fill(); g.strokeStyle = "#7a3f1a"; g.lineWidth = 6; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(330 + i * 22 - 14, 290 - i * 12 - 22); g.lineTo(330 + i * 22 + 14, 290 - i * 12 + 22); g.stroke(); }
  } else if (v === 1) { // pineapple rings + banana
    for (const [x, y] of [[200, 210], [300, 300], [210, 320]]) { g.fillStyle = "#f2c230"; g.beginPath(); g.arc(x, y, 62, 0, TAU); g.fill(); g.fillStyle = "#e4dccb"; g.beginPath(); g.arc(x, y, 20, 0, TAU); g.fill(); g.strokeStyle = "#b98a14"; g.lineWidth = 5; for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; g.beginPath(); g.moveTo(x + Math.cos(a) * 24, y + Math.sin(a) * 24); g.lineTo(x + Math.cos(a) * 58, y + Math.sin(a) * 58); g.stroke(); } }
    g.strokeStyle = "#f4dc5a"; g.lineWidth = 34; g.lineCap = "round"; g.beginPath(); g.arc(330, 180, 70, 0.2, 1.9); g.stroke();
  } else { // roast pork pieces + rice
    g.fillStyle = "#fbf8f0"; g.beginPath(); g.ellipse(320, 250, 86, 96, 0, 0, TAU); g.fill();
    for (let i = 0; i < 40; i++) { g.fillStyle = "rgba(200,190,170,0.8)"; g.beginPath(); g.ellipse(320 + (r() - 0.5) * 130, 250 + (r() - 0.5) * 150, 7, 3.5, r() * 3, 0, TAU); g.fill(); }
    for (const [x, y, a] of [[190, 220, 0.4], [210, 300, -0.3], [170, 280, 1.2]]) { g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = "#9a5230"; rr(g, -44, -26, 88, 52, 16); g.fill(); g.fillStyle = "#c98052"; rr(g, -36, -20, 60, 20, 8); g.fill(); g.restore(); }
  }
}));

/** ukulele seen from above, 1024 x 384 cut-out (0.6 x 0.225 m), neck to the right */
export const ukeTex = () => clampT(ctex("ukeTex", 1024, 384, (g) => {
  g.clearRect(0, 0, 1024, 384);
  const body = () => { g.beginPath(); g.ellipse(190, 192, 180, 172, 0, 0, TAU); g.ellipse(400, 192, 140, 132, 0, 0, TAU); };
  g.fillStyle = "#241726"; g.save(); g.translate(0, 0); body(); g.lineWidth = 16; g.strokeStyle = "#241726"; g.stroke(); g.restore();
  body(); const gr = g.createLinearGradient(0, 20, 0, 364); gr.addColorStop(0, "#d79a4e"); gr.addColorStop(1, "#a8672c"); g.fillStyle = gr; g.fill();
  g.fillStyle = "#3a1e10"; g.beginPath(); g.arc(330, 192, 56, 0, TAU); g.fill(); g.strokeStyle = "#f0d9a0"; g.lineWidth = 6; g.beginPath(); g.arc(330, 192, 68, 0, TAU); g.stroke();
  g.fillStyle = "#241726"; g.fillRect(520, 148, 420, 88); g.fillStyle = "#5a3418"; g.fillRect(520, 156, 412, 72);
  for (let x = 560; x < 930; x += 46) { g.fillStyle = "#d8d2c0"; g.fillRect(x, 156, 5, 72); }
  g.fillStyle = "#241726"; rr(g, 924, 124, 96, 136, 20); g.fill(); g.fillStyle = "#8a5226"; rr(g, 932, 132, 80, 120, 14); g.fill();
  for (const [x, y] of [[956, 140], [990, 140], [956, 244], [990, 244]]) { g.fillStyle = "#e9e2d0"; g.beginPath(); g.arc(x, y, 9, 0, TAU); g.fill(); }
  g.fillStyle = "#3a1e10"; g.fillRect(96, 150, 22, 84);
  g.strokeStyle = "#f6f0dc"; g.lineWidth = 3; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(106, 162 + i * 20); g.lineTo(940, 166 + i * 17); g.stroke(); }
}));

/** lit window: warm glass with glazing bars, half-drawn curtain and a shadow shape inside; 256 x 320 */
export const windowGlow = () => clampT(ctex("windowGlow", 256, 320, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 320); gr.addColorStop(0, "#ffe9a8"); gr.addColorStop(1, "#f6a94a");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 320);
  g.fillStyle = "rgba(255,248,220,0.75)"; g.beginPath(); g.moveTo(0, 0); g.lineTo(110, 0); g.quadraticCurveTo(80, 170, 0, 230); g.fill();
  g.fillStyle = "rgba(150,70,30,0.35)"; g.beginPath(); g.arc(180, 250, 46, 0, TAU); g.fill(); g.fillRect(140, 280, 86, 40);
  g.fillStyle = "#5a2c14"; g.fillRect(0, 152, 256, 14); g.fillRect(121, 0, 14, 320);
  g.strokeStyle = "#5a2c14"; g.lineWidth = 16; g.strokeRect(0, 0, 256, 320);
}));

/** flame (tiki torch, lantern wick): teardrop in three flat tones, 128 x 256 cut-out; v = flicker shape */
export const flameTex = (v: number) => clampT(ctex("flame" + v, 128, 256, (g) => {
  g.clearRect(0, 0, 128, 256);
  const tear = (cx: number, w: number, top: number, col: string, lean: number) => {
    g.fillStyle = col; g.beginPath(); g.moveTo(cx, 250);
    g.bezierCurveTo(cx - w, 236, cx - w * 1.1, 150, cx + lean, top); g.bezierCurveTo(cx + w * 1.1, 150, cx + w, 236, cx, 250); g.fill();
  };
  const l = [-14, 10, -4, 16][v % 4];
  tear(64, 54, 8 + v * 6, "#f2672a", l); tear(64, 38, 70 + v * 4, "#fbb13c", l * 0.6); tear(64, 20, 140, "#fff3c0", l * 0.3);
}));

/** night sea: 256 x 1024 gradient, v = 0 at the shore; ultramarine with pale crests */
export const seaNight = () => clampT(ctex("seaNight", 256, 1024, (g, r) => {
  const H = 1024, gr = g.createLinearGradient(0, H, 0, 0);
  gr.addColorStop(0, "#3c5fd0"); gr.addColorStop(0.1, "#2a44b4"); gr.addColorStop(0.5, "#22349c"); gr.addColorStop(1, "#4a5cc8");
  g.fillStyle = gr; g.fillRect(0, 0, 256, H);
  for (let i = 0; i < 90; i++) { const y = H * (0.02 + 0.78 * r()); g.fillStyle = `rgba(190,210,255,${0.08 + 0.14 * r()})`; g.fillRect(r() * 256, y, 6 + r() * 22, 1); } // sparse far crests only: near the shore they turned into big white blocks
  g.fillStyle = "rgba(210,228,255,0.9)"; g.fillRect(0, H - 6, 256, 6);
}));
/** moon glitter path on the water: broken horizontal dashes narrowing toward the horizon (additive), 256 x 1024 */
export const glitterTex = () => clampT(ctex("glitter", 256, 1024, (g, r) => {
  g.clearRect(0, 0, 256, 1024);
  for (let i = 0; i < 420; i++) { const t = r(), y = t * 1024, w = (10 + 60 * r()) * (0.25 + 0.75 * t), x = 128 + (r() - 0.5) * 220 * (0.2 + 0.8 * t); g.fillStyle = `rgba(255,255,255,${0.35 + 0.6 * r()})`; g.fillRect(x - w / 2, y, w, 2 + 4 * t); }
}));
/** star field for the sky dome band: 1024 x 512, transparent */
export const starsTex = () => ctex("starsN", 1024, 512, (g, r) => {
  g.clearRect(0, 0, 1024, 512);
  for (let i = 0; i < 260; i++) { const s = r() < 0.12 ? 2.6 : 1.3; g.fillStyle = `rgba(230,238,255,${0.5 + 0.5 * r()})`; g.beginPath(); g.arc(r() * 1024, r() * 512, s, 0, TAU); g.fill(); }
});
