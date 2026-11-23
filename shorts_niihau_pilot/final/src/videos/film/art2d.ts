// Flat painted story props for the full film: map, census chalkboard, calendar, signs, canoe, cave wall, submarine,
// museum plaque and banner, fire. Drawn like the character cards (flat colour fields, plum line, legible hand
// lettering: STUDY.md C). Numbers and concepts live on these props, not on overlays.
import { Pen, INK } from "./toon";

const SERIF = "'DejaVu Serif', 'Bitstream Charter', serif";
const text = (p: Pen, s: string, x: number, y: number, px: number, col = INK, align: CanvasTextAlign = "center", rot = 0) => {
  const g = p.g; g.save(); g.translate(x, y); g.rotate(rot); g.font = `bold ${px}px ${SERIF}`; g.textAlign = align; g.textBaseline = "middle"; g.fillStyle = col; g.fillText(s, 0, 0); g.restore();
};
const rrect = (p: Pen, x: number, y: number, w: number, h: number, r: number, fill: string, ol = 10) => {
  const g = p.g; g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  g.fillStyle = fill; g.fill(); if (ol) { g.lineWidth = ol; g.strokeStyle = INK; g.stroke(); }
};
const blob = (p: Pen, pts: [number, number][], fill: string, ol = 8) => {
  const g = p.g; g.beginPath();
  pts.forEach(([x, y], i) => { const [nx, ny] = pts[(i + 1) % pts.length]; if (!i) g.moveTo((x + nx) / 2, (y + ny) / 2); g.quadraticCurveTo(nx, ny, (nx + pts[(i + 2) % pts.length][0]) / 2, (ny + pts[(i + 2) % pts.length][1]) / 2); });
  g.closePath(); g.fillStyle = fill; g.fill(); if (ol) { g.lineWidth = ol; g.strokeStyle = INK; g.lineJoin = "round"; g.stroke(); }
};

/** sea chart, 1000 x 1300. stage 0: islands + flight line to the small island; 1: + "EMPTY" stamp; 2: + waiting
 *  submarine and dashed pick-up line; 3 ("the truth"): fence, houses and a PRIVATE sign on the small island */
export const mapCard = (p: Pen, stage: number) => {
  const g = p.g;
  rrect(p, 10, 10, 980, 1280, 18, "#e9dcb8", 12);
  g.strokeStyle = "rgba(60,110,150,0.28)"; g.lineWidth = 3;
  for (let i = 1; i < 8; i++) { g.beginPath(); g.moveTo(10, i * 160); g.lineTo(990, i * 160); g.stroke(); g.beginPath(); g.moveTo(i * 125, 10); g.lineTo(i * 125, 1290); g.stroke(); }
  for (let i = 0; i < 26; i++) { const x = 60 + ((i * 337) % 880), y = 80 + ((i * 211) % 1140); g.strokeStyle = "rgba(60,110,150,0.4)"; g.lineWidth = 4; g.beginPath(); g.arc(x, y, 14, Math.PI, 0); g.arc(x + 28, y, 14, Math.PI, 0); g.stroke(); }
  blob(p, [[560, 170], [800, 150], [900, 300], [820, 430], [600, 420], [500, 300]], "#9cc27a"); text(p, "OAHU", 700, 300, 54, "#2f4a2a");
  blob(p, [[250, 520], [420, 500], [470, 620], [380, 720], [240, 680]], "#9cc27a"); text(p, "KAUAI", 350, 610, 44, "#2f4a2a");
  blob(p, [[120, 860], [200, 820], [250, 900], [230, 1040], [150, 1080], [100, 980]], stage === 3 ? "#d9b85c" : "#c9d39a"); text(p, "NIIHAU", 330, 1110, 50, "#7a2a22");
  g.strokeStyle = "#c2352c"; g.lineWidth = 9; g.setLineDash([26, 18]); g.beginPath(); g.moveTo(690, 380); g.quadraticCurveTo(560, 760, 215, 930); g.stroke(); g.setLineDash([]);
  for (const [x, y, r] of [[690, 372, 0.5], [205, 934, 2.3]] as const) { g.save(); g.translate(x, y); g.rotate(r); g.fillStyle = "#c2352c"; g.beginPath(); g.moveTo(0, -30); g.lineTo(9, 6); g.lineTo(34, 16); g.lineTo(9, 18); g.lineTo(6, 34); g.lineTo(-6, 34); g.lineTo(-9, 18); g.lineTo(-34, 16); g.lineTo(-9, 6); g.closePath(); g.fill(); g.restore(); }
  if (stage === 1 || stage === 2) { g.save(); g.translate(330, 960); g.rotate(-0.22); g.strokeStyle = "#c2352c"; g.lineWidth = 12; g.strokeRect(-150, -52, 300, 104); text(p, "EMPTY", 0, 4, 78, "#c2352c"); g.restore(); }
  if (stage === 2) {
    g.strokeStyle = "#2f4f93"; g.lineWidth = 8; g.setLineDash([14, 14]); g.beginPath(); g.moveTo(215, 1000); g.lineTo(520, 1160); g.stroke(); g.setLineDash([]);
    rrect(p, 500, 1130, 250, 62, 31, "#4a5a78", 9); rrect(p, 600, 1088, 62, 46, 8, "#4a5a78", 9); p.stroke([[640, 1088], [640, 1050], [664, 1050]], 9);
  }
  if (stage === 3) {
    for (const [x, y] of [[150, 900], [185, 965], [160, 1020]]) { rrect(p, x, y, 34, 26, 3, "#f1ead6", 5); g.fillStyle = "#a9523c"; g.beginPath(); g.moveTo(x - 6, y); g.lineTo(x + 17, y - 18); g.lineTo(x + 40, y); g.fill(); }
    g.strokeStyle = "#5a3418"; g.lineWidth = 7; g.beginPath(); g.ellipse(176, 950, 118, 170, 0.08, 0, 7); g.stroke();
    for (let i = 0; i < 22; i++) { const a = (i / 22) * 6.283; p.stroke([[176 + Math.cos(a) * 118, 950 + Math.sin(a) * 170 - 12], [176 + Math.cos(a) * 118, 950 + Math.sin(a) * 170 + 12]], 7, "#5a3418"); }
    p.stroke([[420, 960], [420, 860]], 12, "#5a3418"); g.save(); g.translate(420, 830); g.rotate(-0.06); rrect(p, -150, -56, 300, 112, 8, "#f1ead6", 10); text(p, "PRIVATE", 0, 4, 62, "#c2352c"); g.restore();
  }
  // compass rose
  g.save(); g.translate(840, 1130); for (let i = 0; i < 4; i++) { g.rotate(Math.PI / 2); g.fillStyle = i % 2 ? "#2f4f93" : "#c2352c"; g.beginPath(); g.moveTo(0, -78); g.lineTo(16, 0); g.lineTo(-16, 0); g.fill(); } g.restore(); text(p, "N", 840, 1030, 40);
};

/** census chalkboard on an easel, 900 x 1100 */
export const chalkboard = (p: Pen) => {
  p.stroke([[190, 640], [90, 1080]], 26, "#8a5a34"); p.stroke([[710, 640], [810, 1080]], 26, "#8a5a34"); p.stroke([[450, 600], [450, 1060]], 22, "#6b4426");
  rrect(p, 40, 40, 820, 620, 14, "#8a5a34", 12); rrect(p, 86, 86, 728, 528, 6, "#2f4a3c", 8);
  text(p, "NIIHAU", 450, 180, 104, "#f4f1e4"); text(p, "POPULATION", 450, 290, 70, "#f4f1e4");
  text(p, "136", 450, 450, 230, "#ffe27a");
  p.stroke([[250, 560], [650, 560]], 9, "#f4f1e4");
  rrect(p, 600, 618, 90, 26, 6, "#f4f1e4", 5);
};

/** tear-off calendar, 600 x 800; day = number shown */
export const calendar = (p: Pen, day: number) => {
  rrect(p, 30, 60, 540, 710, 16, "#f6f0dc", 12);
  rrect(p, 30, 60, 540, 170, 16, "#c2352c", 12); text(p, "DECEMBER", 300, 130, 78, "#fff6e0"); text(p, "1941", 300, 205, 44, "#fff6e0");
  text(p, String(day), 300, 500, 380, INK);
  for (const x of [150, 450]) { p.ell(x, 62, 22, 22, "#8d949c", 8); }
  p.g.fillStyle = "rgba(60,40,30,0.12)"; p.g.fillRect(40, 730, 520, 12); p.g.fillRect(40, 748, 520, 10);
};

/** painted order board on a post, 900 x 1000 */
export const noBoats = (p: Pen) => {
  p.stroke([[450, 520], [450, 980]], 34, "#7a5a3a");
  rrect(p, 40, 40, 820, 520, 16, "#f1ead6", 14);
  text(p, "NO BOATS", 450, 190, 150, "#c2352c");
  p.stroke([[120, 290], [780, 290]], 8);
  text(p, "BY MILITARY ORDER", 450, 370, 64); text(p, "ALL SAILINGS CANCELLED", 450, 460, 50);
  for (const [x, y] of [[80, 80], [820, 80], [80, 520], [820, 520]]) p.dot(x, y, 10, "#8d949c");
};
/** outrigger canoe pulled up and chained, 1200 x 420, side view */
export const canoe = (p: Pen) => {
  blob(p, [[60, 150], [600, 120], [1140, 150], [1060, 300], [600, 330], [140, 300]], "#a8683a", 12);
  p.g.fillStyle = "rgba(60,30,10,0.35)"; p.g.fillRect(150, 250, 900, 14);
  p.stroke([[300, 150], [300, 60], [900, 60], [900, 150]], 16, "#7a5a3a"); p.stroke([[220, 380], [980, 380]], 24, "#c9a25a");
  for (let i = 0; i < 7; i++) p.ell(560 + i * 34, 330 + (i % 2) * 14, 18, 12, null, 7);
};
/** rock face with a cave mouth, 1200 x 2100 (fills the frame) */
export const caveWall = (p: Pen) => {
  const g = p.g;
  g.fillStyle = "#3a3f7c"; g.fillRect(0, 0, 1200, 2100);
  for (let i = 0; i < 46; i++) { const x = (i * 331) % 1200, y = (i * 577) % 2100, w = 150 + ((i * 97) % 200), h = 110 + ((i * 53) % 130); blob(p, [[x, y], [x + w, y - 20], [x + w + 30, y + h * 0.6], [x + w * 0.6, y + h], [x - 20, y + h * 0.7]], i % 3 ? "#454b8e" : "#535aa4", 7); }
  blob(p, [[240, 1500], [300, 900], [520, 640], [760, 700], [930, 980], [960, 1500], [600, 1560]], "#141230", 16);
  g.fillStyle = "rgba(255,170,80,0.16)"; g.beginPath(); g.ellipse(600, 1380, 300, 150, 0, 0, 7); g.fill();
  for (let i = 0; i < 9; i++) blob(p, [[80 + i * 130, 1700 + (i % 2) * 40], [150 + i * 130, 1640], [230 + i * 130, 1720], [200 + i * 130, 1800], [90 + i * 130, 1800]], "#5a61ae", 7);
};
/** a pair of eyes in the dark, 200 x 100; lid 0 open .. 1 shut; look -1..1 */
export const eyesCard = (p: Pen, lid: number, look: number) => {
  for (const x of [56, 144]) {
    if (lid >= 1) { p.stroke([[x - 30, 50], [x + 30, 50]], 9, "#f4f1e4"); continue; }
    p.ell(x, 50, 32, 34 * (1 - 0.5 * lid), "#fbf8ee", 0); p.dot(x + look * 12, 52, 11, INK);
  }
};
/** crossed-out pictograms for "no phones, no power, one boat a week": 600 x 600; k = 0 phone, 1 power pole, 2 boat */
export const icon = (p: Pen, k: number) => {
  rrect(p, 20, 20, 560, 560, 40, "#fbf3dc", 14);
  if (k === 0) { rrect(p, 190, 250, 220, 190, 30, "#2a2a34", 10); p.ell(300, 345, 58, 58, "#f1ead6", 8); p.dot(300, 345, 9); p.stroke([[150, 230], [200, 170], [400, 170], [450, 230]], 44, "#2a2a34"); p.stroke([[210, 440], [170, 500], [130, 470], [100, 520]], 9); }
  if (k === 1) { p.stroke([[300, 520], [300, 110]], 30, "#7a5a3a"); p.stroke([[170, 190], [430, 190]], 24, "#7a5a3a"); p.stroke([[200, 260], [400, 260]], 20, "#7a5a3a"); for (const x of [180, 420]) p.dot(x, 176, 14, "#bfe8ff"); p.g.strokeStyle = INK; p.g.lineWidth = 7; p.g.beginPath(); p.g.moveTo(20, 150); p.g.quadraticCurveTo(100, 230, 180, 176); p.g.moveTo(420, 176); p.g.quadraticCurveTo(500, 230, 580, 150); p.g.stroke(); p.poly([[320, 300], [270, 390], [310, 390], [280, 470], [360, 360], [318, 360]], "#ffd84a", 7); }
  if (k === 2) { blob(p, [[120, 330], [300, 350], [480, 330], [430, 430], [170, 430]], "#a8683a", 10); p.stroke([[300, 340], [300, 150]], 12, "#7a5a3a"); p.poly([[312, 160], [440, 300], [312, 300]], "#f6f0dc", 9); p.g.strokeStyle = "#3f6aa8"; p.g.lineWidth = 10; for (let i = 0; i < 4; i++) { p.g.beginPath(); p.g.arc(110 + i * 126, 470, 62, 0.15 * Math.PI, 0.85 * Math.PI); p.g.stroke(); } text(p, "1 × WEEK", 300, 92, 76, "#2f4f93"); }
  if (k < 2) { p.stroke([[110, 110], [490, 490]], 46, "#c2352c"); p.g.strokeStyle = "#c2352c"; p.g.lineWidth = 40; p.g.beginPath(); p.g.arc(300, 300, 236, 0, 7); p.g.stroke(); }
};
/** closed window curtains with a lamp glow behind, 256 x 320 */
export const curtains = (p: Pen) => {
  const g = p.g; g.fillStyle = "#f2d9a0"; g.fillRect(0, 0, 256, 320);
  for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "#d9a45e" : "#e9c07a"; g.beginPath(); g.moveTo(i * 32, 0); g.quadraticCurveTo(i * 32 + 22, 160, i * 32 + 4, 320); g.lineTo(i * 32 + 36, 320); g.quadraticCurveTo(i * 32 + 52, 160, i * 32 + 32, 0); g.fill(); }
  g.strokeStyle = "#5a2c14"; g.lineWidth = 16; g.strokeRect(0, 0, 256, 320); p.stroke([[128, 0], [128, 320]], 5, "#b8843e");
};
/** surfaced submarine heading away, 1200 x 420 */
export const submarine = (p: Pen) => {
  blob(p, [[40, 300], [300, 230], [900, 230], [1160, 300], [900, 330], [300, 330]], "#3a4668", 12);
  rrect(p, 520, 110, 190, 130, 22, "#3a4668", 12); p.stroke([[600, 110], [600, 40], [640, 40]], 12); p.stroke([[670, 110], [670, 70]], 9);
  p.g.fillStyle = "rgba(220,235,255,0.9)"; for (let i = 0; i < 12; i++) { p.g.beginPath(); p.g.ellipse(60 + i * 100, 336 + (i % 2) * 10, 60, 14, 0, 0, 7); p.g.fill(); }
};
/** museum plaque, 900 x 560 */
export const plaque = (p: Pen) => {
  rrect(p, 20, 20, 860, 520, 18, "#b8935a", 14); rrect(p, 56, 56, 788, 448, 8, "#2a2440", 6);
  text(p, "ZERO FIGHTER", 450, 150, 92, "#f1d9a0"); text(p, "crash-landed on Niihau", 450, 260, 54, "#f1d9a0"); text(p, "7 DECEMBER 1941", 450, 350, 66, "#ffe27a"); text(p, "please do not touch", 450, 445, 40, "#c9b98a");
};
/** museum wall banner, 1600 x 400 */
export const banner = (p: Pen) => {
  rrect(p, 10, 10, 1580, 380, 10, "#2f4f93", 12); text(p, "PACIFIC WAR GALLERY", 800, 150, 120, "#f6f0dc"); text(p, "HAWAII · 1941", 800, 300, 84, "#ffe27a");
};
/** big flame mass for a burning roof / plane, 400 x 500; v = flicker shape */
export const fireBig = (p: Pen, v: number) => {
  const g = p.g, tongue = (cx: number, w: number, top: number, col: string, lean: number) => { g.fillStyle = col; g.beginPath(); g.moveTo(cx - w, 500); g.bezierCurveTo(cx - w * 1.2, 330, cx - w * 0.5 + lean, 250, cx + lean, top); g.bezierCurveTo(cx + w * 0.6 + lean * 0.5, 260, cx + w * 1.2, 330, cx + w, 500); g.fill(); };
  const L = [[-30, 20, -10], [24, -18, 12], [-12, 30, 24], [18, -26, -20]][v % 4];
  for (const [layer, col, k] of [[0, "#e8542a", 1], [1, "#fb9a30", 0.72], [2, "#ffe07a", 0.42]] as const) {
    tongue(110, 80 * k, 190 + layer * 70 + (v % 2) * 20, col, L[0]); tongue(205, 100 * k, 40 + layer * 100 + (v % 3) * 16, col, L[1]); tongue(300, 76 * k, 150 + layer * 76, col, L[2]);
  }
  g.globalCompositeOperation = "destination-in"; g.beginPath(); g.ellipse(200, 250, 196, 262, 0, 0, 7); g.fill(); g.globalCompositeOperation = "source-over"; // rounded mass, no square foot
};
/** medal on a ribbon, 200 x 300 */
export const medal = (p: Pen) => {
  p.poly([[60, 10], [140, 10], [128, 150], [72, 150]], "#3f6aa8", 8); p.stroke([[100, 12], [100, 148]], 14, "#f6f0dc");
  p.ell(100, 210, 62, 62, "#f2c84a", 9); const s: [number, number][] = []; for (let k = 0; k < 10; k++) { const r = k % 2 ? 20 : 46, b = (k * 36 - 90) * Math.PI / 180; s.push([100 + r * Math.cos(b), 210 + r * Math.sin(b)]); } p.poly(s, "#fff3b0", 5);
};
