// 5-second look test: 3D world (three.js) + flat 2D cartoon characters on camera-facing cards.
// Shot: the pilot sits dazed in his crashed plane; pull-out reveals islanders waving at him.
import * as THREE from "three";

const W = 1080, H = 1920, FPS = 30, TOTAL = 150;
const INK = "#3a1c22";
const canvas = document.getElementById("c");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setSize(W, H, false);
renderer.setPixelRatio(1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 600);

// ---------- helpers ----------
const rng = (s) => () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
const smooth = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
const lerp = (a, b, t) => a + (b - a) * t;
const ctex = (w, h, draw, rep) => {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); }
  return t;
};
const ramp = (() => { // 3-step toon ramp
  const d = new Uint8Array([120, 120, 120, 255, 200, 200, 200, 255, 255, 255, 255, 255]);
  const t = new THREE.DataTexture(d, 3, 1, THREE.RGBAFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t;
})();
const toon = (color, extra = {}) => new THREE.MeshToonMaterial({ color, gradientMap: ramp, ...extra });
const inkMat = (t, color = INK) => new THREE.ShaderMaterial({
  side: THREE.BackSide, uniforms: { uT: { value: t }, uC: { value: new THREE.Color(color) } },
  vertexShader: "uniform float uT; void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position + normalize(normal) * uT, 1.0); }",
  fragmentShader: "uniform vec3 uC; void main(){ gl_FragColor = vec4(uC, 1.0); }",
});
/** mesh with a thin ink outline (inverted hull) */
const part = (geo, mat, t = 0.025, shadow = true) => {
  const g = new THREE.Group(); const m = new THREE.Mesh(geo, mat); m.castShadow = shadow; m.receiveShadow = true; g.add(m);
  if (t > 0) g.add(new THREE.Mesh(geo, inkMat(t)));
  return g;
};

// ---------- sky ----------
scene.add(new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false,
  vertexShader: "varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
  fragmentShader: "varying vec3 vP; void main(){ float h = clamp(normalize(vP).y*1.6, 0.0, 1.0); vec3 a = vec3(0.86,0.90,0.96); vec3 b = vec3(0.47,0.60,0.82); vec3 c = mix(a,b,pow(h,0.75)); gl_FragColor = vec4(pow(c, vec3(2.2)),1.0); }",
})));
const cloudTex = ctex(512, 256, (g, w, h) => {
  const r = rng(7); g.fillStyle = "#fffaf2";
  for (let i = 0; i < 9; i++) { g.beginPath(); g.ellipse(90 + i * 42, 150 - Math.sin(i * 0.8) * 34 - r() * 20, 62 + r() * 26, 46 + r() * 22, 0, 0, 7); g.fill(); }
  g.beginPath(); g.roundRect(50, 140, 420, 56, 28); g.fill();
  g.globalCompositeOperation = "source-atop"; const gr = g.createLinearGradient(0, 110, 0, 200); gr.addColorStop(0, "rgba(255,255,255,0)"); gr.addColorStop(1, "rgba(190,196,230,0.5)"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
});
const clouds = [];
[[-70, 62, -220, 90], [40, 78, -260, 120], [120, 50, -210, 70], [-150, 44, -240, 80], [-10, 110, -280, 100]].forEach(([x, y, z, s]) => {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(s, s / 2), new THREE.MeshBasicMaterial({ map: cloudTex, transparent: true, depthWrite: false, fog: false }));
  m.position.set(x, y, z); scene.add(m); clouds.push(m);
});

// ---------- lights ----------
scene.add(new THREE.HemisphereLight(0xd9d4ff, 0xb08a5a, 1.25));
const sun = new THREE.DirectionalLight(0xfff0d2, 2.3);
sun.position.set(9, 14, 10); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 50 }); sun.shadow.bias = -0.0015; sun.shadow.radius = 5;
scene.add(sun);
scene.fog = new THREE.Fog(0xcfd8ee, 60, 330);

// ---------- ground, sea, far island ----------
const grass = ctex(1024, 1024, (g, w, h) => {
  g.fillStyle = "#d7b765"; g.fillRect(0, 0, w, h); const r = rng(3);
  for (let i = 0; i < 260; i++) { g.fillStyle = ["rgba(196,160,78,.5)", "rgba(226,200,120,.5)", "rgba(158,160,84,.45)", "rgba(184,142,70,.4)"][i % 4]; g.beginPath(); g.ellipse(r() * w, r() * h, 30 + r() * 90, 14 + r() * 36, r() * 3, 0, 7); g.fill(); }
  g.lineCap = "round";
  for (let i = 0; i < 900; i++) { const x = r() * w, y = r() * h; g.strokeStyle = r() < 0.5 ? "rgba(120,110,52,.55)" : "rgba(242,220,150,.6)"; g.lineWidth = 2.2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 9, y - 8 - r() * 12); g.stroke(); }
}, [26, 26]);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(260, 190), toon(0xffffff, { map: grass }));
ground.rotation.x = -Math.PI / 2; ground.position.z = -40; ground.receiveShadow = true; scene.add(ground);
const sea = new THREE.Mesh(new THREE.PlaneGeometry(900, 500), new THREE.MeshBasicMaterial({ color: 0x4f7fc9 }));
sea.rotation.x = -Math.PI / 2; sea.position.set(0, -1.2, -380); scene.add(sea);
const surf = new THREE.Mesh(new THREE.PlaneGeometry(900, 5), new THREE.MeshBasicMaterial({ color: 0xf4f6ff })); surf.rotation.x = -Math.PI / 2; surf.position.set(0, -1.1, -137); scene.add(surf);
// far island silhouette (the neighbour island across the channel)
{
  const s = new THREE.Shape(); s.moveTo(-120, 0); const r = rng(11);
  for (let i = 0; i <= 24; i++) { const x = -120 + i * 10; s.lineTo(x, Math.max(0, 30 * Math.sin((i / 24) * Math.PI) ** 0.8 + (r() - 0.5) * 7)); }
  s.lineTo(120, 0);
  const m = new THREE.Mesh(new THREE.ShapeGeometry(s), new THREE.MeshBasicMaterial({ color: 0x8fa3d2, fog: false })); m.position.set(-60, -1, -360); scene.add(m);
}
// dry hills
[[-52, -84, 30, 10, 0xc9a55c], [-78, -70, 34, 14, 0xb8964f], [50, -92, 30, 9, 0xcdaa62], [84, -70, 30, 12, 0xbd9a54]].forEach(([x, z, rr, hh, c]) => {
  const g = part(new THREE.SphereGeometry(rr, 14, 8, 0, 7, 0, Math.PI / 2), toon(c), 0.1, false); g.scale.y = hh / rr; g.position.set(x, -0.2, z); scene.add(g);
});

// ---------- props ----------
const wood = toon(0x86482b), woodL = toon(0xa7663c), stone = toon(0xa69c93), stoneD = toon(0x8b8079);
// dry-stone wall along the back of the field
{
  const r = rng(21);
  for (let i = 0; i < 46; i++) for (let j = 0; j < 2; j++) {
    const x = -22 + i * 1.0 + (j ? 0.5 : 0) + (r() - 0.5) * 0.2; if (Math.abs(x - 0.4) < 2.1 && j) continue;
    const s = part(new THREE.DodecahedronGeometry(0.42 + r() * 0.12, 0), r() < 0.5 ? stone : stoneD, 0.03);
    s.scale.set(1.25, 0.8, 0.9); s.rotation.set(r() * 3, r() * 3, r() * 3); s.position.set(x, 0.28 + j * 0.52, -4.6 + (r() - 0.5) * 0.15); scene.add(s);
  }
}
// wooden fence the plane ploughed through (gap in the middle), broken rails on the ground
{
  const post = new THREE.BoxGeometry(0.16, 1.25, 0.16), rail = new THREE.BoxGeometry(1.9, 0.11, 0.07);
  for (let i = -6; i <= 7; i++) {
    const x = i * 1.9; if (i >= 0 && i <= 1) continue;
    const p = part(post, wood, 0.02); p.position.set(x, 0.62, 2.4); p.rotation.z = Math.sin(i * 7.3) * 0.05; scene.add(p);
    if (i === -1 || i === 7) continue;
    [0.45, 0.95].forEach((y) => { const q = part(rail, woodL, 0.018); q.position.set(x + 0.95, y, 2.4); q.rotation.z = Math.sin(i * 3.1 + y) * 0.03; scene.add(q); });
  }
  [[0.2, 0.06, 3.3, 0.5, 0.2], [2.5, 0.06, 2.9, -0.8, 0.1], [1.7, 0.3, 2.0, 0.3, 0.7], [-0.9, 0.06, 3.1, 1.2, 0]].forEach(([x, y, z, ry, rz]) => {
    const q = part(new THREE.BoxGeometry(1.5, 0.11, 0.07), woodL, 0.018); q.position.set(x, y, z); q.rotation.set(0, ry, rz); scene.add(q);
  });
  const p2 = part(post, wood, 0.02); p2.position.set(2.6, 0.3, 2.55); p2.rotation.z = 1.1; scene.add(p2);
}
// palms
const palms = [];
const palm = (x, z, h, lean) => {
  const g = new THREE.Group(); const fr = new THREE.Group();
  const segs = 7; let px = 0, py = 0;
  for (let i = 0; i < segs; i++) {
    const t = i / segs, sh = h / segs, a = lean * t;
    const s = part(new THREE.CylinderGeometry(0.17 - t * 0.06, 0.2 - t * 0.06, sh * 1.06, 8), toon(i % 2 ? 0x9a6a44 : 0x8a5b3a), 0.03);
    s.position.set(px + Math.sin(a) * sh / 2, py + Math.cos(a) * sh / 2, 0); s.rotation.z = -a; g.add(s); px += Math.sin(a) * sh; py += Math.cos(a) * sh;
  }
  const leaf = new THREE.Shape(); leaf.moveTo(0, 0); leaf.quadraticCurveTo(1.3, 0.75, 3.1, -0.5); leaf.quadraticCurveTo(1.5, -0.05, 0, -0.28);
  const lg = new THREE.ShapeGeometry(leaf, 8);
  for (let i = 0; i < 9; i++) {
    const l = part(lg, toon(i % 2 ? 0x6f9a4c : 0x5c8a45, { side: THREE.DoubleSide }), 0, true);
    const piv = new THREE.Group(); piv.rotation.y = (i / 9) * Math.PI * 2; l.rotation.x = -0.25; l.rotation.z = 0.25 - (i % 3) * 0.2; piv.add(l); fr.add(piv);
  }
  const nut = part(new THREE.SphereGeometry(0.2, 8, 6), toon(0x7a4b33), 0.03); nut.position.y = -0.25; fr.add(nut);
  fr.position.set(px, py, 0); g.add(fr); g.position.set(x, 0, z); scene.add(g); palms.push(fr);
};
palm(-4.4, -8.5, 7.0, 0.3); palm(6.0, -7.5, 6.2, -0.22); palm(-7, -16, 7.4, -0.15); palm(9.5, -13, 6.6, 0.25);
// little plantation house far right
{
  const g = new THREE.Group();
  const b = part(new THREE.BoxGeometry(5, 2.6, 4), toon(0xf2e6d0), 0.05); b.position.y = 1.3; g.add(b);
  const rf = part(new THREE.ConeGeometry(4.3, 1.8, 4), toon(0xb5503a), 0.05); rf.position.y = 3.5; rf.rotation.y = Math.PI / 4; g.add(rf);
  const d = part(new THREE.BoxGeometry(0.9, 1.7, 0.1), wood, 0.02); d.position.set(0, 0.85, 2.02); g.add(d);
  g.position.set(15, 0, -15); g.rotation.y = -0.35; scene.add(g);
}
// tufts and rocks
{
  const r = rng(5);
  for (let i = 0; i < 70; i++) {
    const x = (r() - 0.5) * 44, z = 6 - r() * 26; if (Math.abs(x - 0.5) < 3.4 && z > -3 && z < 4) continue;
    const t = part(new THREE.ConeGeometry(0.16 + r() * 0.1, 0.4 + r() * 0.3, 5), toon(r() < 0.5 ? 0x9aa257 : 0xc2a04e), 0, false); t.position.set(x, 0.2, z); scene.add(t);
  }
  for (let i = 0; i < 9; i++) { const s = part(new THREE.DodecahedronGeometry(0.2 + r() * 0.25, 0), stone, 0.025); s.position.set((r() - 0.5) * 30, 0.1, 5 - r() * 9); s.scale.y = 0.6; scene.add(s); }
}

// ---------- the crashed plane (local +z = nose) ----------
const plane = new THREE.Group();
const skin = toon(0xd9dccd), skinD = toon(0xbfc4b4), cowlM = toon(0x2e2a30), redM = toon(0xc83a2e);
{
  const fus = part(new THREE.CylinderGeometry(0.2, 0.5, 5.4, 16), skin, 0.03); fus.rotation.x = -Math.PI / 2; fus.position.z = -0.9; plane.add(fus);
  const tailc = part(new THREE.ConeGeometry(0.2, 0.9, 12), skin, 0.03); tailc.rotation.x = -Math.PI / 2; tailc.position.z = -4.05; plane.add(tailc);
  const cowl = part(new THREE.CylinderGeometry(0.56, 0.54, 0.95, 18), cowlM, 0.03); cowl.rotation.x = Math.PI / 2; cowl.position.z = 2.25; plane.add(cowl);
  const spin = part(new THREE.ConeGeometry(0.2, 0.5, 12), toon(0xb9bcc2), 0.02); spin.rotation.x = Math.PI / 2; spin.position.z = 2.95; plane.add(spin);
  const wing = part(new THREE.BoxGeometry(8.2, 0.12, 1.45), skin, 0.03); wing.position.set(0, -0.3, 0.75); plane.add(wing);
  [-1, 1].forEach((s) => {
    const tip = part(new THREE.CylinderGeometry(0.725, 0.725, 0.12, 16, 1, false, 0, Math.PI), skin, 0.03); tip.position.set(s * 4.1, -0.3, 0.75); tip.rotation.y = s > 0 ? 0 : Math.PI; plane.add(tip);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(0.5, 24), new THREE.MeshBasicMaterial({ color: 0xc23428 })); disc.rotation.x = -Math.PI / 2; disc.position.set(s * 2.9, -0.232, 0.75); plane.add(disc);
    const d2 = new THREE.Mesh(new THREE.CircleGeometry(0.3, 20), new THREE.MeshBasicMaterial({ color: 0xc23428 })); d2.position.set(s * 0.345, 0.02, -2.0); d2.rotation.y = s * Math.PI / 2; d2.rotation.x = 0; plane.add(d2);
    const tp = part(new THREE.BoxGeometry(1.5, 0.08, 0.75), skin, 0.025); tp.position.set(s * 0.85, 0.05, -3.75); plane.add(tp);
  });
  const fin = part(new THREE.BoxGeometry(0.08, 1.05, 0.9), skin, 0.025); fin.position.set(0, 0.6, -3.85); fin.rotation.x = 0.25; plane.add(fin);
  const band = part(new THREE.CylinderGeometry(0.262, 0.285, 0.22, 16), toon(0x3f66b8), 0); band.rotation.x = -Math.PI / 2; band.position.z = -2.75; plane.add(band);
  // cockpit: dark tub, windshield frame, slid-back canopy
  
  const glass = new THREE.MeshBasicMaterial({ color: 0xbfe0ee, transparent: true, opacity: 0.38, side: THREE.DoubleSide, depthWrite: false });
  const ws = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.44, 0.5, 10, 1, true, -Math.PI / 2, Math.PI), glass); ws.rotation.z = Math.PI / 2; ws.rotation.y = Math.PI / 2; ws.position.set(0, 0.48, 1.12); plane.add(ws);
  // propeller: three blades, bent by the crash
  const hub = new THREE.Group(); hub.position.z = 2.8; plane.add(hub);
  for (let i = 0; i < 3; i++) { const piv = new THREE.Group(); piv.rotation.z = (i / 3) * Math.PI * 2 + 0.4; const b = part(new THREE.BoxGeometry(0.2, 1.35, 0.05), toon(0x4a454a), 0.02); b.position.y = 0.72; b.rotation.x = i === 1 ? -0.9 : i === 2 ? -0.35 : 0.1; piv.add(b); hub.add(piv); }
  // a few bullet holes
  [[0.42, 0.12, -1.2], [0.36, 0.2, -1.7], [-2.0, -0.235, 0.9], [2.2, -0.235, 0.5]].forEach(([x, y, z]) => { const h = new THREE.Mesh(new THREE.CircleGeometry(0.06, 10), new THREE.MeshBasicMaterial({ color: 0x1c1418 })); h.position.set(x, y, z); if (Math.abs(x) > 1) h.rotation.x = -Math.PI / 2; else h.rotation.y = Math.PI / 2 - 0.3; plane.add(h); });
}
plane.position.set(0.4, 0.92, 0.2); plane.rotation.set(0.2, 0.42, 0.09); scene.add(plane);
// churned earth where it slid
{
  const dirt = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 9), new THREE.MeshBasicMaterial({ color: 0x8a5f3a, transparent: true, opacity: 0.75, map: ctex(128, 256, (g, w, h) => { const gr = g.createRadialGradient(64, 128, 4, 64, 128, 125); gr.addColorStop(0, "#fff"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); }) }));
  dirt.rotation.x = -Math.PI / 2; dirt.rotation.z = -0.42; dirt.position.set(-0.6, 0.02, -1.6); scene.add(dirt);
}

// ---------- 2D characters (drawn on a canvas every frame) ----------
const HEAD = "#f8eee8";
function drawChar(g, o, t) {
  // design space 400 x 600, soles at y = 580
  g.save(); g.lineCap = "round"; g.lineJoin = "round";
  const bob = Math.sin(t * (o.bobHz || 2.2) * Math.PI * 2 + (o.ph || 0)) * 4 + (o.jump || 0);
  const sway = Math.sin(t * 1.3 + (o.ph || 0)) * 0.03;
  g.translate(200, 580); g.rotate(sway); g.translate(-200, -580 + bob * 0.4);
  const limb = (pts, col, lw) => {
    const path = () => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); if (pts.length === 3) g.quadraticCurveTo(pts[1][0], pts[1][1], pts[2][0], pts[2][1]); else g.lineTo(pts[1][0], pts[1][1]); };
    g.strokeStyle = INK; g.lineWidth = lw + 11; path(); g.stroke(); g.strokeStyle = col; g.lineWidth = lw; path(); g.stroke();
  };
  const hand = (x, y) => { g.fillStyle = HEAD; g.strokeStyle = INK; g.lineWidth = 6; g.beginPath(); g.arc(x, y, 15, 0, 7); g.fill(); g.stroke(); };
  // legs + shoes
  if (!o.noLegs) {
    limb([[176, 430], [168, 566]], o.pants, 26); limb([[224, 430], [232, 566]], o.pants, 26);
    g.fillStyle = o.shoes || INK; [[160, 572], [240, 572]].forEach(([x, y]) => { g.beginPath(); g.ellipse(x, y, 26, 13, 0, 0, 7); g.fill(); });
  }
  // back arm
  const arm = (side, a) => {
    const sx = 200 + side * 58, sy = 302 + bob * 0.3, L = 118;
    const ang = a; const ex = sx + side * Math.sin(ang) * L, ey = sy + Math.cos(ang) * L;
    const kx = (sx + ex) / 2 + side * 26 * Math.cos(ang), ky = (sy + ey) / 2 + 10 * Math.sin(ang);
    limb([[sx, sy], [kx, ky], [ex, ey]], o.shirt, 24); hand(ex, ey);
  };
  arm(-1, o.armL ?? 0.18);
  // torso (bean)
  g.beginPath(); g.moveTo(140, 300 + bob * 0.3); g.bezierCurveTo(132, 250, 268, 250, 260, 300 + bob * 0.3); g.bezierCurveTo(282, 380, 270, 446, 200, 448); g.bezierCurveTo(130, 446, 118, 380, 140, 300 + bob * 0.3); g.closePath();
  g.fillStyle = o.shirt; g.fill(); g.save(); g.clip();
  if (o.check) { g.strokeStyle = o.check; g.lineWidth = 5; for (let i = 0; i < 9; i++) { g.beginPath(); g.moveTo(110 + i * 22, 240); g.lineTo(110 + i * 22, 460); g.stroke(); g.beginPath(); g.moveTo(100, 262 + i * 24); g.lineTo(300, 262 + i * 24); g.stroke(); } }
  if (o.flowers) { const r = rng(o.flowers); for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? "#fff3dc" : "#ffd36a"; g.beginPath(); g.arc(125 + r() * 150, 262 + r() * 185, 9, 0, 7); g.fill(); } }
  g.fillStyle = "rgba(60,40,90,.16)"; g.fillRect(100, 240, 62, 220);
  if (o.scarf) { g.fillStyle = "#fbf6ea"; g.beginPath(); g.ellipse(200, 268, 60, 26, 0, 0, 7); g.fill(); }
  g.restore(); g.strokeStyle = INK; g.lineWidth = 9; g.stroke();
  if (o.lei) { g.lineWidth = 3; for (let i = 0; i < 11; i++) { const a = Math.PI * (0.08 + (i / 10) * 0.84); g.fillStyle = ["#f25a6e", "#ffd36a", "#fff3dc"][i % 3]; g.beginPath(); g.arc(200 + Math.cos(a) * 64, 262 + Math.sin(a) * 74, 12, 0, 7); g.fill(); g.stroke(); } }
  // head
  const hy = 168 + bob, hx = 200 + (o.headX || 0);
  g.save(); g.translate(hx, hy); g.rotate(o.tilt || 0);
  const hp = new Path2D(); for (let i = 0; i <= 64; i++) { const a = (i / 64) * Math.PI * 2, n = 2.6, c = Math.cos(a), s = Math.sin(a); const x = 114 * Math.sign(c) * Math.abs(c) ** (2 / n), y = (s < 0 ? 100 : 104) * Math.sign(s) * Math.abs(s) ** (2 / n); i ? hp.lineTo(x, y) : hp.moveTo(x, y); } hp.closePath();
  const hg = g.createLinearGradient(-110, 0, 110, 0); hg.addColorStop(0, "#eadbd6"); hg.addColorStop(0.3, HEAD); hg.addColorStop(1, "#fdf8f3"); g.fillStyle = hg; g.fill(hp);
  // hair / hats (clipped to the head, then outlined)
  g.save(); g.clip(hp);
  if (o.hair) { g.fillStyle = o.hair; g.beginPath(); g.ellipse(0, -92, 135, 62, 0, 0, 7); g.fill(); if (o.long) { g.fillRect(-120, -92, 34, 200); g.fillRect(86, -92, 34, 200); } }
  if (o.pilot) { g.fillStyle = "#7a4a2c"; g.beginPath(); g.ellipse(0, -84, 135, 70, 0, 0, 7); g.fill(); g.fillRect(-120, -84, 36, 210); g.fillRect(84, -84, 36, 210); }
  g.restore(); g.strokeStyle = INK; g.lineWidth = 10; g.stroke(hp);
  if (o.pilot) { // goggles pushed up on the forehead + chin strap
    g.strokeStyle = INK; g.lineWidth = 8; g.fillStyle = "#3b3134"; g.fillRect(-112, -70, 224, 16);
    [-44, 44].forEach((x) => { g.beginPath(); g.ellipse(x, -62, 38, 27, 0, 0, 7); g.fillStyle = "#c98f3e"; g.fill(); g.stroke(); g.beginPath(); g.ellipse(x, -62, 26, 17, 0, 0, 7); g.fillStyle = "#bfe3ee"; g.fill(); g.lineWidth = 5; g.stroke(); g.lineWidth = 8; g.fillStyle = "rgba(255,255,255,.8)"; g.beginPath(); g.ellipse(x - 8, -68, 7, 4, -0.5, 0, 7); g.fill(); });
  }
  if (o.straw) { g.fillStyle = "#e3bd6a"; g.strokeStyle = INK; g.lineWidth = 9; g.beginPath(); g.ellipse(0, -78, 168, 30, 0, 0, 7); g.fill(); g.stroke(); g.beginPath(); g.moveTo(-84, -80); g.bezierCurveTo(-80, -160, 80, -160, 84, -80); g.closePath(); g.fill(); g.stroke(); g.fillStyle = "#b5503a"; g.fillRect(-82, -98, 164, 16); }
  if (o.flower) { g.strokeStyle = INK; g.lineWidth = 4; for (let i = 0; i < 5; i++) { const a = (i / 5) * 6.283; g.fillStyle = "#f25a6e"; g.beginPath(); g.arc(88 + Math.cos(a) * 15, -70 + Math.sin(a) * 15, 13, 0, 7); g.fill(); g.stroke(); } g.fillStyle = "#ffd36a"; g.beginPath(); g.arc(88, -70, 9, 0, 7); g.fill(); }
  // face
  const blink = o.blink || 0, lx = (o.lookX || 0) * 9, ey = 8;
  g.fillStyle = INK; g.strokeStyle = INK;
  if (o.expr === "dazed") {
    g.lineWidth = 6; [-40, 40].forEach((x, k) => { g.beginPath(); for (let i = 0; i < 40; i++) { const a = i * 0.42 + t * 9 * (k ? 1 : -1), r = i * 0.5; const px = x + Math.cos(a) * r, py = ey + Math.sin(a) * r; i ? g.lineTo(px, py) : g.moveTo(px, py); } g.stroke(); });
    g.lineWidth = 7; g.beginPath(); for (let i = 0; i <= 8; i++) { const x = -34 + i * 8.5, y = 58 + (i % 2 ? -6 : 6); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
  } else {
    [-40, 40].forEach((x) => { g.beginPath(); g.ellipse(x + lx, ey, 11, Math.max(1.6, 16 * (1 - blink)), 0, 0, 7); g.fill(); });
    g.lineWidth = 7;
    if (o.expr === "confused") { g.beginPath(); g.moveTo(-62, -22); g.lineTo(-22, -30); g.stroke(); g.beginPath(); g.moveTo(22, -38); g.lineTo(62, -44); g.stroke(); g.beginPath(); g.moveTo(-20, 62); g.quadraticCurveTo(4, 52, 24, 64); g.stroke(); g.fillStyle = "#bfe3ee"; g.lineWidth = 4; g.beginPath(); g.moveTo(96, -10); g.quadraticCurveTo(110, 12, 96, 20); g.quadraticCurveTo(82, 12, 96, -10); g.fill(); g.stroke(); }
    else if (o.expr === "laugh") { g.beginPath(); g.moveTo(-60, -34); g.quadraticCurveTo(-40, -44, -20, -34); g.stroke(); g.beginPath(); g.moveTo(20, -34); g.quadraticCurveTo(40, -44, 60, -34); g.stroke(); g.beginPath(); g.moveTo(-40, 44); g.quadraticCurveTo(0, 54, 40, 44); g.quadraticCurveTo(26, 90, 0, 90); g.quadraticCurveTo(-26, 90, -40, 44); g.closePath(); g.fillStyle = "#5a1e28"; g.fill(); g.stroke(); g.fillStyle = "#e86e78"; g.beginPath(); g.ellipse(0, 80, 15, 8, 0, 0, 7); g.fill(); }
    else { g.beginPath(); g.moveTo(-58, -36); g.quadraticCurveTo(-40, -44, -22, -38); g.stroke(); g.beginPath(); g.moveTo(22, -38); g.quadraticCurveTo(40, -44, 58, -36); g.stroke(); g.beginPath(); g.moveTo(-34, 50); g.quadraticCurveTo(0, 82, 34, 50); g.stroke(); }
  }
  if (o.moustache) { g.fillStyle = o.moustache; g.beginPath(); g.ellipse(0, 40, 32, 9, 0, 0, 7); g.fill(); }
  g.restore();
  // front arm (drawn over the torso, may wave above the head)
  arm(1, o.armR ?? -0.18);
  g.restore();
}
const cards = [];
const makeChar = (o, x, y, z, h = 1.78) => {
  const c = document.createElement("canvas"); c.width = 640; c.height = 960; const g = c.getContext("2d");
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(h * (2 / 3), h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.35 }));
  m.geometry.translate(0, h / 2 - h * (20 / 600), 0); m.position.set(x, y, z);
  const blob = new THREE.Mesh(new THREE.CircleGeometry(0.42, 20), new THREE.MeshBasicMaterial({ color: 0x4a3a6a, transparent: true, opacity: o.noLegs ? 0 : 0.28, depthWrite: false })); blob.rotation.x = -Math.PI / 2; blob.scale.y = 0.5; blob.position.set(x, 0.03, z); scene.add(blob);
  scene.add(m); const card = { m, g, tex, o, c }; cards.push(card); return card;
};
// the pilot sits in the cockpit (card parented to the plane so the fuselage hides his legs)
const pilot = makeChar({ pilot: true, shirt: "#a8824e", pants: "#7a6238", scarf: true, noLegs: true, ph: 1 }, 0, 0, 0, 1.55);
scene.remove(pilot.m); plane.add(pilot.m); pilot.m.position.set(0, -0.2, 0.3);
const A = makeChar({ shirt: "#c8452f", check: "#f5e6d0", pants: "#3b4f86", straw: true, moustache: "#3a2a22", ph: 0.3 }, 2.9, 0, 3.3, 1.95);
const B = makeChar({ shirt: "#e9a050", flowers: 4, pants: "#e9a050", hair: "#2c1c25", long: true, flower: true, lei: true, ph: 1.7, shoes: "#7a4b33" }, 3.65, 0, 3.8, 1.72);
const C = makeChar({ shirt: "#4a6fbe", pants: "#6b4a34", hair: "#2c1c25", ph: 2.6, bobHz: 2.6 }, 1.9, 0, 4.2, 1.74);
const D = makeChar({ shirt: "#f4efe2", pants: "#b5503a", hair: "#2c1c25", ph: 4.1, bobHz: 3.1 }, 3.2, 0, 5.0, 1.2);

// smoke from the engine
const puffTex = ctex(128, 128, (g) => { g.fillStyle = "#fff"; [[64, 70, 40], [40, 60, 28], [88, 58, 30], [62, 40, 30]].forEach(([x, y, r]) => { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }); g.strokeStyle = INK; g.lineWidth = 0; });
const puffs = [];
for (let i = 0; i < 9; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: puffTex, transparent: true, depthWrite: false, color: 0x8d8590 })); scene.add(m); puffs.push(m); }
const nose = new THREE.Vector3();

// ---------- camera path ----------
const keys = [ // frame, position, look-at, fov
  [0, [-1.5, 2.15, 4.1], [0.6, 1.72, 0.45], 32],
  [36, [-1.35, 2.12, 3.8], [0.6, 1.72, 0.45], 32],
  [80, [2.5, 1.75, 11.8], [2.25, 1.15, 1.5], 38],
  [150, [2.9, 1.7, 11.0], [2.35, 1.15, 1.5], 38],
];
const camAt = (f) => {
  let i = 0; while (i < keys.length - 2 && f >= keys[i + 1][0]) i++;
  const [f0, p0, l0, v0] = keys[i], [f1, p1, l1, v1] = keys[i + 1]; const u = (f - f0) / (f1 - f0), e = i === 1 ? smooth(u) : u;
  return { p: p0.map((v, k) => lerp(v, p1[k], e)), l: l0.map((v, k) => lerp(v, l1[k], e)), fov: lerp(v0, v1, e) };
};

// ---------- per-frame ----------
const blinkAt = (f, at) => at.reduce((a, b) => Math.max(a, 1 - Math.min(1, Math.abs(f - b) / 2)), 0);
window.renderFrame = (f) => {
  const t = f / FPS;
  const cam = camAt(f); camera.position.set(...cam.p); camera.fov = cam.fov; camera.updateProjectionMatrix(); camera.lookAt(...cam.l);
  // world motion
  clouds.forEach((c, i) => { c.position.x += 0; c.position.x = c.userData.x0 ?? (c.userData.x0 = c.position.x); c.position.x = c.userData.x0 + t * (1.2 + i * 0.3); c.lookAt(camera.position.x, c.position.y, camera.position.z); });
  palms.forEach((p, i) => { p.rotation.z = Math.sin(t * 1.4 + i * 1.9) * 0.07; p.rotation.x = Math.cos(t * 1.1 + i) * 0.05; });
  plane.rotation.z = 0.09 + Math.exp(-t * 2.2) * Math.sin(t * 16) * 0.02; // settles after the crash
  plane.updateMatrixWorld(); nose.set(0, 0.25, 2.5).applyMatrix4(plane.matrixWorld);
  puffs.forEach((p, i) => { const life = ((t * 0.55 + i / puffs.length) % 1); p.position.set(nose.x + Math.sin(i * 2.3 + life * 3) * 0.3 + life * 0.9, nose.y + life * 3.6, nose.z - life * 0.5); const s = (0.45 + life * 1.3) * (life > 0.75 ? 1 - (life - 0.75) * 2.2 : 1); p.scale.set(s, s, s); p.material.opacity = Math.min(1, life * 10) * (life > 0.8 ? (1 - life) * 5 : 1); p.renderOrder = 5; p.quaternion.copy(camera.quaternion); });
  // acting
  const wake = smooth((f - 30) / 8); // dazed -> confused
  Object.assign(pilot.o, { expr: f < 34 ? "dazed" : "confused", tilt: f < 34 ? Math.sin(t * 7) * 0.09 : 0.05, blink: blinkAt(f, [34, 35, 92, 128]), lookX: wake * 1.6, headX: wake * 6, armL: 0.4, armR: f > 104 ? lerp(0.4, 2.3 + Math.sin(t * 9) * 0.2, smooth((f - 104) / 6)) : 0.4 });
  const wave = (ph, sp = 10) => 2.5 + Math.sin(t * sp + ph) * 0.38;
  Object.assign(A.o, { expr: "laugh", armR: wave(0, 9), armL: 0.2, blink: blinkAt(f, [70, 118]), lookX: -1 });
  Object.assign(B.o, { expr: "smile", armR: wave(1.3, 11), armL: 0.25, blink: blinkAt(f, [88, 140]), lookX: -1, tilt: Math.sin(t * 2) * 0.05 });
  Object.assign(C.o, { expr: "laugh", armR: wave(2.2, 12), armL: 2.5 + Math.sin(t * 12 + 2.2) * 0.38, blink: blinkAt(f, [60, 104]), lookX: -1 });
  Object.assign(D.o, { expr: "laugh", armR: wave(0.7, 14), armL: 2.5 + Math.sin(t * 14) * 0.38, jump: -Math.abs(Math.sin(t * 6.2)) * 46, blink: blinkAt(f, [80]), lookX: -1 });
  cards.forEach((c) => {
    c.g.setTransform(1, 0, 0, 1, 0, 0); c.g.clearRect(0, 0, 640, 960); c.g.setTransform(1.6, 0, 0, 1.6, 0, 0); drawChar(c.g, c.o, t); c.tex.needsUpdate = true;
    // face the camera (yaw only), in the parent's space
    const wp = c.m.getWorldPosition(new THREE.Vector3()); const yaw = Math.atan2(camera.position.x - wp.x, camera.position.z - wp.z);
    if (c.m.parent === scene) c.m.rotation.set(0, yaw, 0);
    else { const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0)); const pq = c.m.parent.getWorldQuaternion(new THREE.Quaternion()).invert(); c.m.quaternion.copy(pq.multiply(q)); }
  });
  renderer.render(scene, camera);
  return canvas.toDataURL("image/jpeg", 0.95);
};
window.TOTAL = TOTAL; window.ready = true;
