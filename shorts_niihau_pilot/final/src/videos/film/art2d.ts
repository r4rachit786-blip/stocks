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

// ---------------- review round 2: new painted props ----------------
/** inside of a sea cave looking out: rock walls in violet-blue, the mouth opens on the moonlit sea; 1400 x 2400 */
export const caveBack = (p: Pen) => {
  const g = p.g;
  g.fillStyle = "#2a2a66"; g.fillRect(0, 0, 1400, 2400);
  // the opening: sky, moon, sea, far palms
  g.save(); g.beginPath(); g.moveTo(520, 1500); g.bezierCurveTo(430, 900, 640, 420, 980, 430); g.bezierCurveTo(1300, 450, 1380, 900, 1330, 1500); g.closePath(); g.clip();
  const sk = g.createLinearGradient(0, 400, 0, 1500); sk.addColorStop(0, "#27329c"); sk.addColorStop(0.6, "#5a68d6"); sk.addColorStop(1, "#8f8ae4"); g.fillStyle = sk; g.fillRect(400, 380, 1000, 1150);
  g.fillStyle = "rgba(190,205,255,0.35)"; g.beginPath(); g.arc(1080, 720, 150, 0, 7); g.fill(); g.fillStyle = "#eef2ff"; g.beginPath(); g.arc(1080, 720, 92, 0, 7); g.fill();
  for (let i = 0; i < 40; i++) { g.fillStyle = "rgba(235,240,255,0.8)"; g.beginPath(); g.arc(470 + ((i * 197) % 880), 440 + ((i * 131) % 560), 3 + (i % 3), 0, 7); g.fill(); }
  g.fillStyle = "#2f44b0"; g.fillRect(400, 1180, 1000, 400);
  for (let i = 0; i < 26; i++) { g.fillStyle = "rgba(215,228,255,0.75)"; const w = 30 + ((i * 53) % 110) * (i / 26 + 0.3); g.fillRect(1080 - w / 2 + ((i * 37) % 60) - 30, 1190 + i * 12, w, 5); }
  g.fillStyle = "#1a1c52"; g.beginPath(); g.moveTo(400, 1330); g.quadraticCurveTo(700, 1250, 1400, 1300); g.lineTo(1400, 1600); g.lineTo(400, 1600); g.fill();
  p.stroke([[640, 1320], [652, 1120]], 12, "#1a1c52"); for (const a of [-2.6, -2.1, -1.5, -0.9, -0.4]) p.stroke([[652, 1120], [652 + Math.cos(a) * 120, 1120 + Math.sin(a) * 90 + 40]], 10, "#1a1c52");
  g.restore();
  p.g.lineWidth = 16; p.g.strokeStyle = INK; g.beginPath(); g.moveTo(520, 1500); g.bezierCurveTo(430, 900, 640, 420, 980, 430); g.bezierCurveTo(1300, 450, 1380, 900, 1330, 1500); g.stroke();
  // rock blocks and strata, lighter toward the mouth
  for (let i = 0; i < 60; i++) { const x = (i * 331) % 1400, y = (i * 577) % 2400; if (x > 470 && x < 1340 && y > 480 && y < 1480) continue; const w = 150 + ((i * 97) % 200), h = 100 + ((i * 53) % 130); blob(p, [[x, y], [x + w, y - 20], [x + w + 30, y + h * 0.6], [x + w * 0.6, y + h], [x - 20, y + h * 0.7]], i % 3 ? "#34367c" : "#42459a", 7); }
  for (const [x, l] of [[300, 260], [760, 180], [1180, 300], [1000, 150], [150, 190]]) blob(p, [[x - 60, 0], [x + 60, 0], [x + 14, l], [x, l + 40], [x - 14, l]], "#3a3c88", 8); // stalactites
  blob(p, [[0, 1900], [300, 1820], [800, 1880], [1400, 1800], [1400, 2400], [0, 2400]], "#2c2e6e", 10); // floor
};
/** oval family portrait in a frame, 700 x 900: four formal figures; brass label, no names */
export const portrait = (p: Pen) => {
  rrect(p, 20, 20, 660, 860, 26, "#7a4e2a", 14); rrect(p, 70, 70, 560, 640, 14, "#e9dcb8", 8);
  const g = p.g; g.save(); g.beginPath(); g.ellipse(350, 390, 250, 290, 0, 0, 7); g.clip(); g.fillStyle = "#c9b48a"; g.fillRect(70, 70, 560, 640);
  for (const [x, y, s, c] of [[230, 330, 1, "#3a3440"], [460, 320, 1, "#5a4a3a"], [300, 470, 0.85, "#6a3a3a"], [420, 480, 0.8, "#3a4a5a"]] as const) {
    blob(p, [[x - 70 * s, y + 250 * s], [x - 62 * s, y + 80 * s], [x, y + 50 * s], [x + 62 * s, y + 80 * s], [x + 70 * s, y + 250 * s]], c, 7);
    p.ell(x, y, 62 * s, 58 * s, "#fbf3e2", 8); p.stroke([[x - 30 * s, y - 4], [x - 12 * s, y - 4]], 7); p.stroke([[x + 12 * s, y - 4], [x + 30 * s, y - 4]], 7); p.stroke([[x - 12 * s, y + 26 * s], [x + 12 * s, y + 26 * s]], 6);
  }
  g.restore(); g.lineWidth = 9; g.strokeStyle = INK; g.beginPath(); g.ellipse(350, 390, 250, 290, 0, 0, 7); g.stroke();
  rrect(p, 150, 750, 400, 90, 10, "#d9b45a", 7); text(p, "THE OWNERS", 350, 797, 54);
};
/** conch shell, 300 x 300 */
export const conch = (p: Pen) => { blob(p, [[40, 170], [90, 70], [200, 50], [270, 130], [240, 230], [130, 260]], "#f6d6c0", 10); blob(p, [[120, 180], [200, 120], [250, 160], [210, 220]], "#f09aa0", 6); for (const k of [0, 1, 2]) p.stroke([[80 + k * 26, 110 - k * 14], [110 + k * 30, 80 - k * 8]], 6); };
/** kerosene hurricane lamp, lit, 300 x 520 */
export const lampCard = (p: Pen) => {
  p.g.strokeStyle = INK; p.g.lineWidth = 9; p.g.beginPath(); p.g.arc(150, 150, 110, Math.PI * 1.08, Math.PI * 1.92); p.g.stroke();
  rrect(p, 80, 400, 140, 96, 22, "#6f7f8a", 10); rrect(p, 104, 366, 92, 40, 8, "#8d949c", 8);
  blob(p, [[100, 366], [84, 260], [112, 170], [188, 170], [216, 260], [200, 366]], "#ffe9a0", 10);
  blob(p, [[150, 350], [126, 290], [150, 215], [174, 290]], "#fb9a30", 0); blob(p, [[150, 346], [138, 300], [150, 256], [162, 300]], "#fff6d0", 0);
  rrect(p, 106, 128, 88, 46, 10, "#6f7f8a", 9); rrect(p, 128, 96, 44, 36, 8, "#6f7f8a", 8);
};
/** boat-day wall calendar with a sampan, 700 x 900: one day ringed in every week */
export const boatCal = (p: Pen) => {
  rrect(p, 20, 20, 660, 860, 16, "#f6f0dc", 12); rrect(p, 20, 20, 660, 150, 16, "#2f4f93", 12); text(p, "BOAT DAY", 350, 98, 92, "#fff6e0");
  blob(p, [[190, 300], [350, 322], [510, 300], [470, 372], [230, 372]], "#a8683a", 9); p.stroke([[350, 312], [350, 196]], 10, "#7a5a3a"); p.poly([[360, 204], [450, 290], [360, 290]], "#f6f0dc", 7);
  p.g.strokeStyle = "#3f6aa8"; p.g.lineWidth = 8; for (let i = 0; i < 5; i++) { p.g.beginPath(); p.g.arc(140 + i * 105, 400, 50, 0.15 * Math.PI, 0.85 * Math.PI); p.g.stroke(); }
  for (let r = 0; r < 4; r++) for (let c = 0; c < 7; c++) { const x = 92 + c * 86, y = 520 + r * 92; text(p, String(r * 7 + c + 1), x, y, 46, c === 2 ? "#c2352c" : "#5a5560"); if (c === 2) { p.g.strokeStyle = "#c2352c"; p.g.lineWidth = 7; p.g.beginPath(); p.g.arc(x, y - 2, 38, 0, 7); p.g.stroke(); } }
};
/** one window with two patterned curtains; open 1 = parted (dark room, lamp glow), 0 = drawn shut; 400 x 500 */
export const curtainCard = (p: Pen, open: number) => {
  const g = p.g; rrect(p, 10, 10, 380, 480, 6, "#f4efdc", 12);
  const gr = g.createLinearGradient(0, 30, 0, 470); gr.addColorStop(0, "#3a3458"); gr.addColorStop(1, "#6a5a70"); g.fillStyle = gr; g.fillRect(34, 34, 332, 432);
  // a kerosene lamp on the sill, and someone peeking out until the curtains close
  g.fillStyle = "rgba(255,190,110,0.35)"; g.beginPath(); g.arc(250, 400, 90, 0, 7); g.fill();
  rrect(p, 232, 418, 36, 44, 6, "#6f7f8a", 6); blob(p, [[236, 418], [230, 376], [250, 350], [270, 376], [264, 418]], "#ffe9a0", 6); blob(p, [[250, 412], [242, 390], [250, 368], [258, 390]], "#fb9a30", 0);
  if (open > 0.2) { p.ell(170, 300, 62, 58, "#fff8f0", 9); blob(p, [[108, 290], [118, 240], [170, 222], [222, 240], [232, 290], [170, 268]], "#3a2620", 7); for (const ex of [150, 190]) { p.ell(ex, 306, 13, 14, "#ffffff", 5); p.dot(ex + 4, 308, 5); } }
  const half = (s: number) => { const edge = 200 + s * (8 + 120 * open), x0 = s < 0 ? 34 : edge, x1 = s < 0 ? edge : 366;
    g.fillStyle = "#e8b04a"; g.fillRect(x0, 34, x1 - x0, 432);
    for (let x = x0 + 14; x < x1 - 6; x += 30) { g.fillStyle = "rgba(160,96,30,0.4)"; g.fillRect(x, 34, 8, 432); }
    for (let y = 70; y < 460; y += 62) for (let x = x0 + 26; x < x1 - 10; x += 60) { g.fillStyle = "#c2352c"; g.beginPath(); g.arc(x + ((y / 62) % 2) * 26, y, 11, 0, 7); g.fill(); g.fillStyle = "#fff3c0"; g.beginPath(); g.arc(x + ((y / 62) % 2) * 26, y, 4, 0, 7); g.fill(); }
    p.stroke([[edge, 34], [edge, 466]], 7); };
  half(-1); half(1);
  p.stroke([[20, 34], [380, 34]], 12, "#7a4e2a"); g.lineWidth = 12; g.strokeStyle = INK; g.strokeRect(34, 34, 332, 432); rrect(p, 0, 470, 400, 26, 4, "#4d7a5c", 8);
};
/** WW2 fleet submarine on the surface, heading away: long low hull, deck gun, small conning tower; 1400 x 360 */
export const iboat = (p: Pen) => {
  blob(p, [[20, 250], [200, 214], [700, 204], [1250, 216], [1380, 246], [1250, 276], [200, 280]], "#3f4a6c", 10);
  p.stroke([[60, 232], [1320, 226]], 6, "#566289");
  rrect(p, 600, 120, 170, 92, 14, "#3f4a6c", 10); rrect(p, 630, 84, 84, 40, 8, "#3f4a6c", 9); p.stroke([[660, 84], [660, 28]], 8); p.stroke([[692, 84], [692, 46]], 6); p.stroke([[600, 150], [560, 150], [560, 206]], 6);
  rrect(p, 430, 176, 60, 30, 6, "#3f4a6c", 8); p.stroke([[470, 184], [380, 160]], 12); // deck gun
  p.stroke([[20, 250], [-10, 200]], 5); p.stroke([[1380, 246], [1400, 196]], 5); p.stroke([[40, 200], [600, 124]], 3); p.stroke([[770, 124], [1360, 200]], 3); // aerial wires
  p.g.fillStyle = "rgba(230,240,255,0.92)"; for (let i = 0; i < 16; i++) { p.g.beginPath(); p.g.ellipse(50 + i * 86, 284 + (i % 2) * 10, 58, 13, 0, 0, 7); p.g.fill(); }
};
/** the pilot's flying helmet and goggles left on the sand, 420 x 300 */
export const helmetCard = (p: Pen) => {
  blob(p, [[60, 250], [70, 130], [160, 60], [270, 70], [350, 150], [360, 250]], "#8b5a34", 11); blob(p, [[130, 250], [140, 180], [210, 150], [280, 180], [290, 250]], "#3a2416", 7);
  p.ell(150, 110, 52, 38, "#caa252", 9, 0, 360, -16); p.ell(150, 110, 36, 24, "#a8d6ec", 6, 0, 360, -16); p.ell(262, 112, 52, 38, "#caa252", 9, 0, 360, 12); p.ell(262, 112, 36, 24, "#a8d6ec", 6, 0, 360, 12);
  p.stroke([[40, 262], [380, 262]], 10, "#c9a25a");
};
/** string of triangular bunting, 1600 x 300 */
export const bunting = (p: Pen) => {
  const g = p.g; g.strokeStyle = INK; g.lineWidth = 7; g.beginPath(); g.moveTo(0, 40); g.quadraticCurveTo(800, 150, 1600, 40); g.stroke();
  for (let i = 0; i < 13; i++) { const t = (i + 0.5) / 13, x = t * 1600, y = 40 + 110 * 4 * t * (1 - t) * 0.5 + 4; p.poly([[x - 52, y], [x + 52, y], [x, y + 120]], ["#c2352c", "#f6f0dc", "#2f4f93"][i % 3], 7); }
};
/** an officer's sleeve and hand reaching in from the right to pin the medal, 700 x 260 */
export const sleeve = (p: Pen) => { blob(p, [[700, 60], [300, 84], [250, 130], [300, 176], [700, 210]], "#b9a878", 10); p.stroke([[330, 92], [330, 170]], 8, "#8f7e52"); for (const x of [420, 470]) p.stroke([[x, 90], [x, 178]], 10, "#e8c45a"); p.ell(210, 130, 56, 46, "#fff8f0", 10); };
/** rope round the prisoner's wrists, 300 x 160 */
export const ropeCard = (p: Pen) => { for (let k = 0; k < 4; k++) { p.stroke([[40, 40 + k * 26], [260, 30 + k * 26]], 20, INK); p.stroke([[40, 40 + k * 26], [260, 30 + k * 26]], 11, "#d9b87a"); } p.ell(150, 76, 26, 22, "#d9b87a", 8); };
/** framed period photograph for the museum wall, 500 x 400; v picks the subject */
export const photoFrame = (p: Pen, v: number) => {
  rrect(p, 10, 10, 480, 380, 8, "#3a2a22", 10); rrect(p, 50, 50, 400, 300, 4, "#d9cfb8", 5);
  const g = p.g; g.save(); g.beginPath(); g.rect(50, 50, 400, 300); g.clip(); g.fillStyle = "#b9ad94"; g.fillRect(50, 230, 400, 120);
  if (v === 0) { blob(p, [[90, 210], [250, 180], [400, 200], [330, 240], [140, 240]], "#8a8674", 6); p.ell(120, 206, 40, 40, "#5a5650", 5); p.stroke([[370, 190], [420, 130]], 12, "#8a8674"); }
  if (v === 1) { for (const x of [150, 250, 350]) { p.stroke([[x, 300], [x, 220]], 8, "#5a5650"); p.ell(x, 190, 34, 32, "#f1ead6", 6); } }
  if (v === 2) { p.poly([[110, 250], [110, 170], [250, 110], [390, 170], [390, 250]], "#8a8674", 6); p.stroke([[250, 250], [250, 190]], 30, "#5a5650"); p.stroke([[420, 250], [420, 110]], 10, "#5a5650"); }
  g.restore();
};
/** a sheet of paper in the air, 200 x 240 */
export const paperSheet = (p: Pen) => { p.poly([[20, 30], [170, 14], [184, 214], [36, 228]], "#f6f0dc", 9); for (let i = 0; i < 5; i++) p.stroke([[50, 64 + i * 30], [150, 56 + i * 30]], 5, "#8a8478"); };
/** glass display case with the flying helmet inside, 600 x 800 */
export const displayCase = (p: Pen) => {
  rrect(p, 60, 430, 480, 350, 8, "#5a4630", 12); rrect(p, 80, 60, 440, 380, 6, "rgba(200,225,245,0.55)", 10);
  p.g.save(); p.g.translate(160, 170); p.g.scale(0.72, 0.72); helmetCard(new Pen(p.g)); p.g.restore();
  p.stroke([[120, 100], [200, 390]], 14, "rgba(255,255,255,0.5)"); rrect(p, 200, 520, 200, 70, 6, "#d9b45a", 6);
};

// ---------------- review round 3: wall dressing for the "no phones" picture ----------------
/** wall shelf with jars, a tin and a book, 700 x 420 */
export const shelfCard = (p: Pen) => {
  rrect(p, 20, 300, 660, 40, 6, "#8a5a34", 10); p.poly([[80, 340], [80, 400], [150, 340]], "#6b4426", 8); p.poly([[620, 340], [620, 400], [550, 340]], "#6b4426", 8);
  rrect(p, 70, 150, 110, 150, 14, "#bfe0d8", 9); rrect(p, 84, 126, 82, 30, 6, "#c9a04a", 7);
  rrect(p, 210, 190, 120, 110, 10, "#c2352c", 9); text(p, "TEA", 270, 246, 44, "#fff6e0");
  rrect(p, 370, 120, 60, 180, 4, "#2f4f93", 8); rrect(p, 436, 140, 54, 160, 4, "#4d7a5c", 8); rrect(p, 496, 110, 66, 190, 4, "#7a4e2a", 8);
  p.ell(620, 268, 40, 32, "#f6d6c0", 8);
};
/** straw hat hanging on a peg, 400 x 360 */
export const hatHook = (p: Pen) => { p.stroke([[200, 40], [200, 90]], 16, "#6b4426"); p.ell(200, 250, 180, 70, "#ecc76a", 10); blob(p, [[110, 250], [130, 140], [200, 110], [270, 140], [290, 250]], "#ecc76a", 10); p.stroke([[118, 226], [282, 226]], 22, "#a8402f"); };
/** pinned shipping notice, 520 x 640 */
export const noticeCard = (p: Pen) => {
  p.g.save(); p.g.translate(260, 320); p.g.rotate(-0.04); p.g.translate(-260, -320);
  rrect(p, 20, 30, 480, 590, 6, "#f6f0dc", 9); p.dot(260, 58, 14, "#c2352c");
  text(p, "NOTICE", 260, 140, 84, "#c2352c"); p.stroke([[70, 196], [450, 196]], 6);
  text(p, "NO TELEPHONE", 260, 268, 48); text(p, "ON THIS ISLAND", 260, 332, 48);
  text(p, "Send word", 260, 430, 46, "#2f4f93"); text(p, "by the boat", 260, 494, 46, "#2f4f93");
  p.g.restore();
};
