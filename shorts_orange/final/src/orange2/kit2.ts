// Orange v2 set kit: props, buildings, ships and camels for nine places, all procedural, all on the Niihau kit's
// two-tone Lambert (lam) so they share the approved lighting model. Props are dense on purpose (skill: MS 6-15 prop
// types, wides 20-60 instanced items). Everything is merged per material through Batch.
import * as THREE from "three";
import { Batch, lam, boxGeo, V } from "../film/build";
import { ctex, rep, roofHD, facadeHD, cobbleHD, stoneHD } from "../film/paint";
import { quadUV, limb, rock, rng, loft, mergeNI } from "../film/geo";
import { grainWood } from "../film/paint3";
import { NOINK } from "../film/ink";

export { V, Batch, lam, boxGeo };
export const M4 = (x: number, y: number, z: number, ry = 0, s: number | [number, number, number] = 1, rx = 0, rz = 0) =>
  new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, "YXZ")), Array.isArray(s) ? V(s[0], s[1], s[2]) : V(s, s, s));
export const C = (hex: string, side = false) => lam("c2" + hex + (side ? "d" : ""), () => ({ color: hex, side: side ? THREE.DoubleSide : THREE.FrontSide }));
export const T = (key: string, map: THREE.Texture, o: THREE.MeshLambertMaterialParameters = {}) => lam("t2" + key, () => ({ map, ...o }));
type R = () => number;
const U = (r: R, a: number, b: number) => a + (b - a) * r();
const lathe = (pts: [number, number][], seg = 18) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);

// ---------------- textures ----------------
export const speckTex = (key: string, base: string, speck: string[], n = 900, big = 26) => ctex("o2g_" + key, 1024, 1024, (g, r) => {
  g.fillStyle = base; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < n; i++) { g.fillStyle = speck[i % speck.length]; g.globalAlpha = 0.16 + 0.22 * r(); const x = r() * 1024, y = r() * 1024, s = 4 + r() * big; g.beginPath(); g.ellipse(x, y, s, s * 0.6, r() * 3, 0, 7); g.fill(); }
  g.globalAlpha = 1;
});
export const GROUNDS = {
  earth: () => T("gEarth", rep(speckTex("earth3", "#d6ccc6", ["#c6bab4", "#e4dcd6", "#bcb0ac", "#cec6da"]), 18, 18)),
  sand: () => T("gSand", rep(speckTex("sand3", "#e2d9cc", ["#d6cbbc", "#eee6da", "#ccc0b2", "#d8d2e2"]), 18, 18)),
  dune: () => T("gDune", rep(speckTex("dune2", "#ecd8b6", ["#e0c8a0", "#f6e6cc", "#d8c2a0"], 500, 60), 10, 10)),
  cobble: () => T("gCobble", rep(cobbleHD(), 10, 10)),
  grass: () => T("gGrass", rep(speckTex("grass", "#8bbb5c", ["#76a84c", "#a2cc72", "#6a9a44", "#b2d47c"]), 18, 18)),
  plaza: () => T("gPlaza", rep(stoneHD("plaza3", ["#dcd6d0", "#d0c8c2", "#e6e0da", "#c8c0bc"], "#a8a0a8"), 12, 12)),
  deck: () => T("gDeck", rep(grainWood("deck2", "#c79a62", 8), 6, 6)),
  quay: () => T("gQuay", rep(stoneHD("quay2", ["#d8cfc0", "#cbbfac", "#e2d9ca", "#c2b6a2"], "#a89c8a"), 10, 10)),
};
export function ground(b: Batch, mat: THREE.Material, x0 = -80, x1 = 80, z0 = 40, z1 = -120, y = 0) {
  b.add(quadUV(V(x0, y, z0), V(x1, y, z0), V(x1, y, z1), V(x0, y, z1), 0, 0, (x1 - x0) / 160, (z0 - z1) / 160), mat);
}
const stripeTex = (a: string, c: string) => ctex("o2stripe" + a + c, 256, 256, (g) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? c : a; g.fillRect(i * 32, 0, 32, 256); } g.fillStyle = "rgba(0,0,0,0.1)"; g.fillRect(0, 226, 256, 30); for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? c : a; g.beginPath(); g.arc(i * 32 + 16, 236, 16, 0, Math.PI); g.fill(); } });
const rugTex = (seed: number, a: string, c: string, d: string) => ctex("o2rug" + seed + a, 256, 384, (g, r) => {
  g.fillStyle = a; g.fillRect(0, 0, 256, 384); g.fillStyle = c; g.fillRect(14, 14, 228, 356); g.fillStyle = a; g.fillRect(28, 28, 200, 328);
  g.fillStyle = d; for (let k = 0; k < 3; k++) { const y = 80 + k * 112; g.beginPath(); g.moveTo(128, y - 44); g.lineTo(190, y); g.lineTo(128, y + 44); g.lineTo(66, y); g.closePath(); g.fill(); }
  g.fillStyle = c; for (let k = 0; k < 3; k++) { const y = 80 + k * 112; g.beginPath(); g.moveTo(128, y - 20); g.lineTo(156, y); g.lineTo(128, y + 20); g.lineTo(100, y); g.closePath(); g.fill(); }
  g.fillStyle = "#f4e6c8"; for (let x = 4; x < 256; x += 10) { g.fillRect(x, 0, 3, 8); g.fillRect(x, 376, 3, 8); }
  void r;
});
export const labelTex = (text: string, o: { board?: string; ink?: string; font?: number; w?: number; h?: number; serif?: boolean } = {}) => {
  const w = o.w ?? 1024, h = o.h ?? 384;
  const t = ctex("o2lab|" + text + "|" + (o.board ?? "") + w + h + (o.ink ?? ""), w, h, (g) => {
    g.fillStyle = o.board ?? "#d8b27a"; g.fillRect(0, 0, w, h);
    g.fillStyle = "rgba(90,50,20,0.15)"; for (let i = 0; i < 6; i++) g.fillRect(0, (i * h) / 6, w, 4);
    const lines = text.split("\n"), fs = o.font ?? Math.min(150, (h * 0.8) / lines.length);
    g.font = `900 ${fs}px 'DejaVu ${o.serif === false ? "Sans" : "Serif"}', serif`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = o.ink ?? "#3a2418";
    lines.forEach((l, i) => { let s = fs; while (g.measureText(l).width > w * 0.9 && s > 20) { s -= 4; g.font = `900 ${s}px 'DejaVu ${o.serif === false ? "Sans" : "Serif"}', serif`; } g.fillText(l, w / 2, h / 2 + (i - (lines.length - 1) / 2) * fs * 1.05); });
  });
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t;
};
/** unlit label quad (signs stay readable in any light: readability trap "painted signs lit by a side sun go grey") */
export function label(parent: THREE.Object3D, tex: THREE.Texture, x: number, y: number, z: number, w: number, h: number, ry = 0) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, toneMapped: true }));
  m.position.set(x, y, z); m.rotation.y = ry; m.layers.set(NOINK); parent.add(m); return m;
}

// ---------------- small props ----------------
const ORANGE_G = new THREE.SphereGeometry(0.075, 12, 9);
export const orangeMat = () => C("#f58a1f");
export function oranges(b: Batch, cx: number, cy: number, cz: number, n: number, rad: number, seed: number, flat = 0.6, s = 1) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) { const a = r() * 6.283, d = Math.sqrt(r()) * rad, hgt = (1 - d / rad) * rad * 0.75; b.add(ORANGE_G, orangeMat(), M4(cx + Math.cos(a) * d, cy + 0.07 * s + hgt + r() * 0.03, cz + Math.sin(a) * d * flat, r() * 3, (0.85 + 0.3 * r()) * s)); }
}
export function crate(b: Batch, x: number, y: number, z: number, w = 0.7, h = 0.45, d = 0.5, ry = 0, full = true, seed = 1) {
  const m = M4(x, y, z, ry), wood = T("crateW", grainWood("crate3", "#b49a82", 3)), dark = C("#7a4f2e");
  b.add(boxGeo(V(-w / 2, 0, -d / 2), V(w / 2, h, d / 2)), wood, m);
  for (const sx of [-1, 1]) b.add(boxGeo(V(sx * w / 2 - 0.03, 0, d / 2), V(sx * w / 2 + 0.03, h, d / 2 + 0.02)), dark, m);
  b.add(boxGeo(V(-w / 2, h * 0.45, d / 2), V(w / 2, h * 0.55, d / 2 + 0.015)), dark, m);
  if (full) { const r = rng(seed); for (let i = 0; i < Math.round(w * d * 60); i++) b.add(ORANGE_G, orangeMat(), m.clone().multiply(M4(U(r, -w / 2 + 0.08, w / 2 - 0.08), h - 0.02 + r() * 0.05, U(r, -d / 2 + 0.08, d / 2 - 0.08), r() * 3, 0.95))); }
}
export function basket(b: Batch, x: number, y: number, z: number, r0 = 0.3, h = 0.32, fill = true, seed = 2, col = "#c9934e") {
  const g = lathe([[r0 * 0.7, 0], [r0, h * 0.85], [r0 * 1.06, h]], 16);
  b.add(g, T("basket" + col, rep(ctex("o2weave" + col, 128, 128, (q) => { q.fillStyle = col; q.fillRect(0, 0, 128, 128); q.strokeStyle = "rgba(90,50,20,0.45)"; q.lineWidth = 4; for (let i = 0; i < 8; i++) { q.beginPath(); q.moveTo(0, i * 16 + 8); q.lineTo(128, i * 16 + 8); q.stroke(); } for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) if ((i + j) % 2) { q.fillStyle = "rgba(255,230,180,0.2)"; q.fillRect(i * 16, j * 16, 16, 16); } }), 6, 2), { side: THREE.DoubleSide }), M4(x, y, z));
  if (fill) oranges(b, x, y + h - 0.12, z, Math.round(r0 * r0 * 140), r0 * 0.85, seed, 1);
}
export function sack(b: Batch, x: number, y: number, z: number, s = 1, spice = "#e0a52a", seed = 3) {
  const cloth = C("#d9c3a0");
  b.add(rock(seed, 0.26 * s, 0.3 * s, 0.24 * s, 0.85, 2, 0.08), cloth, M4(x, y + 0.28 * s, z));
  b.add(lathe([[0.25 * s, 0], [0.27 * s, 0.06 * s], [0.0, 0.0001]], 14).rotateX(Math.PI).translate(0, 0, 0), cloth, M4(x, y + 0.58 * s, z));
  b.add(new THREE.ConeGeometry(0.22 * s, 0.16 * s, 16), C(spice), M4(x, y + 0.6 * s, z));
}
export function spiceHeap(b: Batch, x: number, y: number, z: number, r = 0.25, col = "#d94a2a") {
  b.add(new THREE.ConeGeometry(r, r * 0.9, 18), C(col), M4(x, y + r * 0.45, z));
  b.add(new THREE.CylinderGeometry(r * 1.15, r * 1.1, 0.08, 18), C("#9a6a3e"), M4(x, y + 0.04, z));
}
export function pot(b: Batch, x: number, y: number, z: number, s = 1, col = "#c9773e", kind = 0) {
  const prof: [number, number][] = kind === 0 ? [[0.12, 0], [0.2, 0.08], [0.24, 0.22], [0.18, 0.36], [0.1, 0.42], [0.12, 0.48]] : kind === 1 ? [[0.1, 0], [0.18, 0.05], [0.2, 0.14], [0.08, 0.3], [0.05, 0.5], [0.09, 0.56]] : [[0.16, 0], [0.22, 0.06], [0.22, 0.2], [0.24, 0.24]];
  b.add(lathe(prof.map(([r, h]) => [r * s, h * s] as [number, number]), 18), C(col, true), M4(x, y, z));
}
export function barrel(b: Batch, x: number, y: number, z: number, s = 1, ry = 0, lying = false) {
  const g = lathe([[0.26, 0], [0.31, 0.2], [0.33, 0.4], [0.31, 0.6], [0.26, 0.8]].map(([r, h]) => [r * s, h * s] as [number, number]), 16);
  const m = lying ? M4(x, y + 0.3 * s, z, ry, 1, 0, Math.PI / 2).multiply(M4(0, -0.4 * s, 0)) : M4(x, y, z, ry);
  b.add(g, T("barrelW", grainWood("barrel3", "#9a7e70", 6)), m);
  for (const h of [0.12, 0.68]) b.add(new THREE.CylinderGeometry(0.315 * s, 0.315 * s, 0.05 * s, 16, 1, true), C("#4a4048", true), m.clone().multiply(M4(0, h * s, 0)));
}
export function brassLantern(b: Batch, x: number, y: number, z: number, s = 1) {
  const brass = C("#d9a441"), glass = C("#ffd27a");
  b.add(lathe([[0.0, 0.42], [0.12, 0.3], [0.1, 0.26]].map(([r, h]) => [r * s, h * s] as [number, number]), 10), brass, M4(x, y, z));
  b.add(new THREE.CylinderGeometry(0.09 * s, 0.07 * s, 0.22 * s, 8), glass, M4(x, y + 0.14 * s, z));
  b.add(lathe([[0.08, 0.0], [0.12, 0.03], [0.0, 0.03]].map(([r, h]) => [r * s, h * s] as [number, number]), 10), brass, M4(x, y, z));
  b.add(limb([V(x, y + 0.42 * s, z), V(x, y + 0.7 * s, z)], [0.01, 0.01], 4), C("#3a3034"));
}
export function paperLantern(b: Batch, x: number, y: number, z: number, s = 1, col = "#e0392b") {
  b.add(new THREE.SphereGeometry(0.22 * s, 14, 10).scale(1, 1.25, 1), C(col), M4(x, y, z));
  for (const dy of [-0.27, 0.27]) b.add(new THREE.CylinderGeometry(0.09 * s, 0.09 * s, 0.05 * s, 10), C("#2a2226"), M4(x, y + dy * s, z));
  b.add(limb([V(x, y - 0.3 * s, z), V(x, y - 0.5 * s, z)], [0.012, 0.004], 4), C("#e8c45a"));
}
export function rug(b: Batch, x: number, y: number, z: number, w: number, d: number, seed: number, cols: [string, string, string], hang = false, ry = 0) {
  const mat = T("rug" + seed + cols[0], rugTex(seed, ...cols), { side: THREE.DoubleSide });
  if (hang) b.add(quadUV(V(-w / 2, -d, 0), V(w / 2, -d, 0), V(w / 2, 0, 0), V(-w / 2, 0, 0)), mat, M4(x, y, z, ry));
  else b.add(quadUV(V(-w / 2, 0.012, d / 2), V(w / 2, 0.012, d / 2), V(w / 2, 0.012, -d / 2), V(-w / 2, 0.012, -d / 2)), mat, M4(x, y, z, ry));
}
/** market stall: plank table on trestles, a sloped striped awning on 4 poles with a scalloped edge */
export function stall(b: Batch, x: number, z: number, w: number, cols: string, ry = 0, o: { h?: number; noAwning?: boolean; d?: number } = {}) {
  const m = M4(x, 0, z, ry), wood = T("stallW", grainWood("stall3", "#9a7e70", 4)), y = 0.88, hw = w / 2, d = o.d ?? 0.9, h = o.h ?? 2.5;
  b.add(boxGeo(V(-hw, y - 0.07, -d / 2), V(hw, y, d / 2)), wood, m);
  b.add(boxGeo(V(-hw, 0.12, d / 2 - 0.06), V(hw, y - 0.07, d / 2)), wood, m);
  for (const sx of [-hw + 0.08, hw - 0.08]) for (const sz of [-d / 2 + 0.06, d / 2 - 0.06]) b.add(boxGeo(V(sx - 0.04, 0, sz - 0.04), V(sx + 0.04, y, sz + 0.04)), wood, m);
  if (o.noAwning) return;
  const [a, c] = cols.split("/"), mat = T("awn" + cols, stripeTex(a, c), { side: THREE.DoubleSide });
  b.add(quadUV(V(-hw - 0.2, h, -d / 2 - 0.2), V(hw + 0.2, h, -d / 2 - 0.2), V(hw + 0.2, h - 0.35, d / 2 + 0.45), V(-hw - 0.2, h - 0.35, d / 2 + 0.45), 0, 0, w / 1.1, 1), mat, m);
  b.add(quadUV(V(-hw - 0.2, h - 0.35, d / 2 + 0.45), V(hw + 0.2, h - 0.35, d / 2 + 0.45), V(hw + 0.2, h - 0.6, d / 2 + 0.47), V(-hw - 0.2, h - 0.6, d / 2 + 0.47), 0, 0.85, w / 1.1, 1), mat, m);
  for (const sx of [-hw, hw]) for (const sz of [-d / 2 - 0.15, d / 2 + 0.4]) b.add(boxGeo(V(sx - 0.035, 0, sz - 0.035), V(sx + 0.035, sz < 0 ? h : h - 0.35, sz + 0.035)), wood, m);
}
/** a fruit stall fully dressed: pyramids of oranges, baskets, crates under and beside */
export function fruitStall(b: Batch, x: number, z: number, w: number, cols: string, seed: number, ry = 0) {
  stall(b, x, z, w, cols, ry);
  const m = M4(x, 0, z, ry), r = rng(seed), p = (lx: number, lz: number) => V(lx, 0, lz).applyMatrix4(m);
  const n = Math.max(2, Math.round(w / 0.75));
  for (let i = 0; i < n; i++) { const q = p(-w / 2 + (i + 0.5) * (w / n), -0.05); oranges(b, q.x, 0.88, q.z, 30, 0.3, seed * 10 + i, 0.8); }
  crate(b, p(-w / 2 + 0.45, 0.9).x, 0, p(-w / 2 + 0.45, 0.9).z, 0.7, 0.42, 0.5, ry + U(r, -0.2, 0.2), true, seed + 1);
  basket(b, p(w / 2 - 0.3, 0.85).x, 0, p(w / 2 - 0.3, 0.85).z, 0.3, 0.34, true, seed + 2);
  crate(b, p(w / 2 + 0.5, 0.1).x, 0, p(w / 2 + 0.5, 0.1).z, 0.65, 0.4, 0.5, ry + 0.3, true, seed + 3);
}
export function marigolds(b: Batch, a: THREE.Vector3, c: THREE.Vector3, sag = 0.5, n = 22) {
  const cols = ["#f6a21e", "#f2c230", "#e9761c"];
  for (let i = 0; i <= n; i++) { const t = i / n, q = a.clone().lerp(c, t); q.y -= sag * 4 * t * (1 - t); b.add(new THREE.SphereGeometry(0.07, 8, 6), C(cols[i % 3]), M4(q.x, q.y, q.z)); }
}
export function bunting(b: Batch, a: THREE.Vector3, c: THREE.Vector3, sag = 0.4, n = 12, cols = ["#e0392b", "#f2c230", "#2f7fc4", "#f6f2e6"]) {
  b.add(limb([a, a.clone().lerp(c, 0.5).add(V(0, -sag, 0)), c], [0.01, 0.01, 0.01], 3, 1, 12), C("#5a4636"));
  for (let i = 1; i < n; i++) { const t = i / n, q = a.clone().lerp(c, t); q.y -= sag * 4 * t * (1 - t); const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute([-0.12, 0, 0, 0.12, 0, 0, 0, -0.3, 0], 3)); g.computeVertexNormals(); b.add(g, C(cols[i % cols.length], true), M4(q.x, q.y, q.z, Math.atan2(c.x - a.x, c.z - a.z) - Math.PI / 2)); }
}
export function clothLine(b: Batch, x0: number, x1: number, y: number, z: number, cols: string[]) {
  b.add(limb([V(x0, y, z), V((x0 + x1) / 2, y - 0.15, z), V(x1, y, z)], [0.012, 0.012, 0.012], 4, 1, 10), C("#5a4636"));
  const n = cols.length, w = (x1 - x0) / n;
  cols.forEach((c, i) => { const x = x0 + (i + 0.5) * w, yy = y - 0.15 * 4 * ((i + 0.5) / n) * (1 - (i + 0.5) / n); b.add(quadUV(V(x - w * 0.4, yy - 1.3, z), V(x + w * 0.4, yy - 1.3, z), V(x + w * 0.4, yy, z), V(x - w * 0.4, yy, z)), C(c, true)); });
}
export function well(b: Batch, x: number, z: number) {
  b.add(new THREE.CylinderGeometry(0.75, 0.8, 0.8, 20, 1, true), T("wellS", rep(stoneHD("well", ["#cfc2a8", "#c2b394", "#dacdb4"], "#9e8f78"), 2, 1), { side: THREE.DoubleSide }), M4(x, 0.4, z));
  b.add(new THREE.TorusGeometry(0.78, 0.07, 6, 24).rotateX(Math.PI / 2), C("#bfb29a"), M4(x, 0.8, z));
  for (const s of [-1, 1]) b.add(boxGeo(V(-0.05, 0, -0.05), V(0.05, 1.9, 0.05)), C("#7a5232"), M4(x + s * 0.7, 0.7, z));
  b.add(limb([V(x - 0.8, 2.5, z), V(x + 0.8, 2.5, z)], [0.05, 0.05], 6), C("#7a5232"));
  b.add(new THREE.CylinderGeometry(0.16, 0.13, 0.25, 10), C("#8a6a4a"), M4(x + 0.1, 1.7, z));
}
export function fountain(b: Batch, x: number, z: number, s = 1) {
  const st = C("#d7ccb8"), water = C("#7fb3e0");
  b.add(new THREE.CylinderGeometry(1.9 * s, 2.0 * s, 0.55, 28), st, M4(x, 0.27, z));
  b.add(new THREE.CylinderGeometry(1.7 * s, 1.7 * s, 0.05, 28), water, M4(x, 0.53, z));
  b.add(lathe([[0.25, 0], [0.18, 0.6], [0.2, 1.2], [0.75, 1.35], [0.8, 1.5], [0.15, 1.5], [0.1, 2.1], [0.2, 2.3], [0.0, 2.5]].map(([r, h]) => [r * s, h * s] as [number, number]), 18), st, M4(x, 0.5, z));
  b.add(new THREE.CylinderGeometry(0.7 * s, 0.7 * s, 0.03, 18), water, M4(x, 0.5 + 1.47 * s, z));
}
export function cart(b: Batch, x: number, z: number, ry = 0, load = true, seed = 5) {
  const m = M4(x, 0, z, ry), wood = T("cartW", grainWood("cart3", "#8e7466", 4)), w = 1.7, d = 1.1;
  b.add(boxGeo(V(-w / 2, 0.55, -d / 2), V(w / 2, 0.62, d / 2)), wood, m);
  for (const s of [-1, 1]) b.add(boxGeo(V(-w / 2, 0.62, s * d / 2 - 0.04), V(w / 2, 0.95, s * d / 2 + 0.04)), wood, m);
  b.add(boxGeo(V(-w / 2 - 0.04, 0.62, -d / 2), V(-w / 2 + 0.04, 0.95, d / 2)), wood, m);
  for (const s of [-1, 1]) { b.add(new THREE.TorusGeometry(0.45, 0.05, 6, 20), C("#5a3a24"), m.clone().multiply(M4(-0.2, 0.47, s * (d / 2 + 0.08)))); b.add(new THREE.CylinderGeometry(0.07, 0.07, 0.1, 8).rotateX(Math.PI / 2), C("#5a3a24"), m.clone().multiply(M4(-0.2, 0.47, s * (d / 2 + 0.08)))); for (let k = 0; k < 6; k++) b.add(limb([V(0, 0, 0), V(0.42 * Math.cos(k), 0.42 * Math.sin(k), 0)], [0.025, 0.025], 4), C("#5a3a24"), m.clone().multiply(M4(-0.2, 0.47, s * (d / 2 + 0.08)))); }
  for (const s of [-1, 1]) b.add(limb([V(w / 2, 0.6, s * 0.35), V(w / 2 + 1.4, 0.45, s * 0.3)], [0.04, 0.035], 5), wood, m);
  if (load) { const q = V(0, 0.62, 0).applyMatrix4(m); oranges(b, q.x, q.y, q.z, 90, 0.75, seed, 0.6); }
}
export function bollard(b: Batch, x: number, z: number) { b.add(lathe([[0.16, 0], [0.13, 0.4], [0.2, 0.5], [0.0, 0.56]], 12), C("#3e3a44"), M4(x, 0, z)); }
export function ropeCoil(b: Batch, x: number, y: number, z: number, r = 0.35) { for (let i = 0; i < 4; i++) b.add(new THREE.TorusGeometry(r - i * 0.05, 0.035, 6, 20).rotateX(Math.PI / 2), C("#c9a46a"), M4(x, y + 0.035 + i * 0.05, z)); }
export function bench(b: Batch, x: number, z: number, w = 1.6, ry = 0) { const m = M4(x, 0, z, ry), wood = T("benchW", grainWood("bench", "#8a5a34", 3)); b.add(boxGeo(V(-w / 2, 0.42, -0.18), V(w / 2, 0.48, 0.18)), wood, m); for (const s of [-1, 1]) b.add(boxGeo(V(s * (w / 2 - 0.12) - 0.04, 0, -0.15), V(s * (w / 2 - 0.12) + 0.04, 0.42, 0.15)), wood, m); }
export function planter(b: Batch, x: number, z: number, col = "#e0e0d0") { b.add(boxGeo(V(-0.3, 0, -0.3), V(0.3, 0.7, 0.3)), C(col), M4(x, 0, z)); b.add(rock(x * 7 + z, 0.34, 0.3, 0.34, 0.95, 2, 0.15), C("#5e9a44"), M4(x, 0.95, z)); }
export function flag(b: Batch, x: number, y: number, z: number, w: number, h: number, tex: THREE.Texture, ry = 0) {
  b.add(limb([V(x, 0, z), V(x, y + h * 0.5, z)], [0.04, 0.03], 6), C("#6b4a30"));
  const g = new THREE.PlaneGeometry(w, h, 8, 1), p = g.attributes.position as THREE.BufferAttribute; for (let i = 0; i < p.count; i++) p.setZ(i, 0.12 * Math.sin((p.getX(i) / w + 0.5) * 6));
  g.translate(w / 2, 0, 0); b.add(g, T("flag" + tex.uuid, tex, { side: THREE.DoubleSide }), M4(x, y, z, ry));
}

/** ground dressing: petals / leaves / straw / pebbles scattered as tiny flat or lumpy bits (breaks empty floors) */
export function litter(b: Batch, x0: number, x1: number, z0: number, z1: number, n: number, seed: number, cols: string[], kind: "petal" | "stone" | "straw" = "petal") {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const x = x0 + (x1 - x0) * r(), z = z0 + (z1 - z0) * r(), col = cols[i % cols.length];
    if (kind === "stone") b.add(new THREE.DodecahedronGeometry(0.03 + 0.05 * r(), 0).scale(1, 0.5, 1), C(col), M4(x, 0.02, z, r() * 3));
    else { const L = kind === "straw" ? 0.25 : 0.07, W2 = kind === "straw" ? 0.015 : 0.05; b.add(quadUV(V(-L, 0, W2), V(L, 0, W2), V(L, 0, -W2), V(-L, 0, -W2)), C(col, true), M4(x, 0.012 + 0.002 * (i % 3), z, r() * 6.28)); }
  }
}
// ---------------- trees ----------------
export function orangeTree(b: Batch, x: number, z: number, s: number, seed: number, nFruit = 20) {
  const r = rng(seed), bark = C("#7a5a40"), leaf = [C("#4f8a3e"), C("#5f9c48"), C("#447a36")];
  b.add(limb([V(x, -0.1, z), V(x + 0.1 * s, 0.8 * s, z), V(x - 0.05 * s, 1.3 * s, z)], [0.13 * s, 0.1 * s, 0.08 * s], 7, 1, 6), bark);
  for (let i = 0; i < 6; i++) { const a = (i / 6) * 6.283 + r(), c = V(x + Math.cos(a) * 0.6 * s, (1.75 + 0.35 * r()) * s, z + Math.sin(a) * 0.5 * s); b.add(rock(seed * 31 + i, 0.8 * s, 0.68 * s, 0.75 * s, 0.95, 2, 0.12), leaf[i % 3], M4(c.x, c.y, c.z, r() * 3)); }
  b.add(rock(seed * 31 + 9, 1.0 * s, 0.8 * s, 0.95 * s, 0.95, 2, 0.12), leaf[0], M4(x, 2.25 * s, z));
  for (let i = 0; i < nFruit; i++) { const a = r() * 6.283, e = (r() - 0.25) * 1.1, Rr = 1.08 * s; b.add(ORANGE_G, orangeMat(), M4(x + Math.cos(a) * Math.cos(e) * Rr, 1.95 * s + Math.sin(e) * Rr * 0.75, z + Math.sin(a) * Math.cos(e) * Rr * 0.85, 0, 1.3 * s)); }
}
export function cypress(b: Batch, x: number, z: number, h: number, seed: number) { b.add(rock(seed, 0.6 * h / 6, h / 2, 0.6 * h / 6, 0.95, 2, 0.1), C("#3f6a3a"), M4(x, h / 2, z)); b.add(limb([V(x, 0, z), V(x, 0.6, z)], [0.1, 0.08], 6), C("#6a4a30")); }
export function roundTree(b: Batch, x: number, z: number, s: number, seed: number, col = "#5e9a44") {
  const r = rng(seed); b.add(limb([V(x, -0.1, z), V(x + 0.15 * s, 1.6 * s, z)], [0.18 * s, 0.12 * s], 7), C("#7a5a40"));
  for (let i = 0; i < 5; i++) { const a = (i / 5) * 6.283 + r(); b.add(rock(seed * 13 + i, 1.0 * s, 0.85 * s, 0.95 * s, 0.95, 2, 0.12), C(i % 2 ? col : "#4f8a3e"), M4(x + Math.cos(a) * 0.7 * s, (2.4 + 0.4 * r()) * s, z + Math.sin(a) * 0.6 * s)); }
  b.add(rock(seed * 13 + 7, 1.2 * s, 1.0 * s, 1.1 * s, 0.95, 2, 0.12), C(col), M4(x, 3.0 * s, z));
}

// ---------------- buildings ----------------
/** flat-roofed plaster house with parapet, optional dome, awning, balcony and a row of pots on the roof */
export function flatHouse(b: Batch, x: number, z: number, w: number, d: number, h: number, wall: string, shutter: string, o: { dome?: string; ry?: number; awning?: string; balcony?: boolean; arch?: boolean; door?: boolean } = {}) {
  const m = M4(x, 0, z, o.ry ?? 0), key = `fh2${wall}${shutter}${w}${h}`;
  const front = T("fr" + key, facadeHD("o2" + key, w, h, { wall, shutter, door: o.door !== false }));
  const side = T("sd" + key, facadeHD("o2s" + key, d, h, { wall, shutter }));
  const hw = w / 2, hd = d / 2;
  b.add(quadUV(V(-hw, 0, hd), V(hw, 0, hd), V(hw, h, hd), V(-hw, h, hd)), front, m);
  b.add(quadUV(V(-hw, 0, -hd), V(-hw, 0, hd), V(-hw, h, hd), V(-hw, h, -hd)), side, m);
  b.add(quadUV(V(hw, 0, hd), V(hw, 0, -hd), V(hw, h, -hd), V(hw, h, hd)), side, m);
  b.add(quadUV(V(-hw, h, hd), V(hw, h, hd), V(hw, h, -hd), V(-hw, h, -hd)), C(wall), m);
  const trim = C(shade2(wall, 0.92));
  b.add(boxGeo(V(-hw - 0.1, h, hd - 0.15), V(hw + 0.1, h + 0.45, hd + 0.1)), trim, m);
  b.add(boxGeo(V(-hw - 0.1, h, -hd - 0.1), V(-hw + 0.1, h + 0.45, hd)), trim, m); b.add(boxGeo(V(hw - 0.1, h, -hd - 0.1), V(hw + 0.1, h + 0.45, hd)), trim, m);
  b.add(boxGeo(V(-hw - 0.06, h - 0.22, hd), V(hw + 0.06, h - 0.12, hd + 0.08)), C(shade2(wall, 0.8)), m);
  if (o.dome) { const g = new THREE.SphereGeometry(Math.min(w, d) * 0.32, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2); g.scale(1, 1.25, 1); b.add(g, C(o.dome), m.clone().multiply(M4(0, h, 0))); b.add(new THREE.CylinderGeometry(Math.min(w, d) * 0.34, Math.min(w, d) * 0.34, 0.4, 24), C(wall), m.clone().multiply(M4(0, h + 0.0, 0))); b.add(lathe([[0.06, 0], [0.04, 0.4], [0.1, 0.5], [0, 0.7]], 8), C("#e8b93e"), m.clone().multiply(M4(0, h + Math.min(w, d) * 0.4, 0))); }
  if (o.awning) { const [a, c] = o.awning.split("/"), mat = T("awn" + o.awning, stripeTex(a, c), { side: THREE.DoubleSide }); b.add(quadUV(V(-hw * 0.8, 2.6, hd), V(hw * 0.8, 2.6, hd), V(hw * 0.8, 2.15, hd + 1.1), V(-hw * 0.8, 2.15, hd + 1.1), 0, 0, w / 1.2, 1), mat, m); }
  if (o.balcony) { const wood = C("#7a4f2e"); b.add(boxGeo(V(-hw * 0.4, h * 0.55, hd), V(hw * 0.4, h * 0.55 + 0.1, hd + 0.7)), wood, m); for (let i = 0; i <= 8; i++) b.add(boxGeo(V(-hw * 0.4 + i * (w * 0.8 / 8) - 0.025, h * 0.55, hd + 0.62), V(-hw * 0.4 + i * (w * 0.8 / 8) + 0.025, h * 0.55 + 0.8, hd + 0.68)), wood, m); b.add(boxGeo(V(-hw * 0.4, h * 0.55 + 0.78, hd + 0.6), V(hw * 0.4, h * 0.55 + 0.86, hd + 0.7)), wood, m); }
  if (o.arch) { const ar = archFrame(1.4, 2.4, 0.25); b.add(ar, C(shade2(wall, 0.85)), m.clone().multiply(M4(0, 0, hd + 0.02))); }
}
export const shade2 = (hex: string, k: number) => { const c = new THREE.Color(hex); c.multiplyScalar(k); return "#" + c.getHexString(); };
/** an arch outline frame (pointed when pointed=true) extruded as a thin moulding: w wide, h to the apex */
export function archFrame(w: number, h: number, t = 0.2, pointed = true) {
  const sh = new THREE.Shape(), hw = w / 2, sp = h - hw * (pointed ? 1.25 : 1);
  sh.moveTo(-hw - t, 0); sh.lineTo(-hw - t, sp); if (pointed) sh.quadraticCurveTo(-hw - t, h + t * 0.6 - hw * 0.25, 0, h + t); else sh.absarc(0, sp, hw + t, Math.PI, 0, true);
  if (pointed) sh.quadraticCurveTo(hw + t, h + t * 0.6 - hw * 0.25, hw + t, sp); sh.lineTo(hw + t, 0); sh.lineTo(hw, 0); sh.lineTo(hw, sp);
  if (pointed) sh.quadraticCurveTo(hw, h - hw * 0.25, 0, h); else sh.absarc(0, sp, hw, 0, Math.PI, false);
  if (pointed) sh.quadraticCurveTo(-hw, h - hw * 0.25, -hw, sp); sh.lineTo(-hw, 0); sh.closePath();
  return new THREE.ExtrudeGeometry(sh, { depth: 0.12, bevelEnabled: false, curveSegments: 10 });
}
/** a wall pierced by a row of arches (arcade / caravanserai / souk), extruded with real openings */
export function arcade(b: Batch, x: number, z: number, n: number, aw: number, ah: number, h: number, depth: number, wall: string, ry = 0, pointed = true) {
  const W = n * (aw + 0.6) + 0.6, sh = new THREE.Shape(); sh.moveTo(-W / 2, 0); sh.lineTo(W / 2, 0); sh.lineTo(W / 2, h); sh.lineTo(-W / 2, h); sh.closePath();
  for (let i = 0; i < n; i++) { const cx = -W / 2 + 0.6 + aw / 2 + i * (aw + 0.6), hw = aw / 2, sp = ah - hw * (pointed ? 1.2 : 1), hole = new THREE.Path(); hole.moveTo(cx - hw, 0.001); hole.lineTo(cx - hw, sp); if (pointed) { hole.quadraticCurveTo(cx - hw, ah - hw * 0.2, cx, ah); hole.quadraticCurveTo(cx + hw, ah - hw * 0.2, cx + hw, sp); } else hole.absarc(cx, sp, hw, Math.PI, 0, true); hole.lineTo(cx + hw, 0.001); hole.closePath(); sh.holes.push(hole); }
  const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: false, curveSegments: 10 });
  const uv = g.attributes.uv as THREE.BufferAttribute; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 3, uv.getY(i) / 3);
  b.add(g, T("arc" + wall, rep(stoneHD("arc" + wall, [wall, shade2(wall, 0.95), shade2(wall, 1.04), shade2(wall, 0.9)], shade2(wall, 0.8)), 1, 1)), M4(x, 0, z, ry));
  b.add(boxGeo(V(-W / 2 - 0.1, h, -0.1), V(W / 2 + 0.1, h + 0.3, depth + 0.1)), C(shade2(wall, 0.9)), M4(x, 0, z, ry));
  for (let i = 0; i < Math.floor(W / 0.9); i++) b.add(boxGeo(V(-W / 2 + i * 0.9 + 0.15, h + 0.3, 0), V(-W / 2 + i * 0.9 + 0.6, h + 0.65, depth)), C(shade2(wall, 0.9)), M4(x, 0, z, ry));
  return W;
}
export function dome(b: Batch, x: number, y: number, z: number, r: number, col: string, drum = "#e9dcc0", onion = false) {
  b.add(new THREE.CylinderGeometry(r * 1.02, r * 1.02, r * 0.6, 28), C(drum), M4(x, y + r * 0.3, z));
  const pts: [number, number][] = []; for (let i = 0; i <= 14; i++) { const t = i / 14, a = t * Math.PI / 2; pts.push([onion ? r * Math.sin(Math.PI * Math.min(1, t * 1.25)) * (1 - t * 0.25) + (t < 0.2 ? r * (1 - t * 5) * 0.1 : 0) : r * Math.cos(a), onion ? r * 1.5 * t : r * 1.15 * Math.sin(a)]); }
  if (onion) pts[0] = [r, 0];
  b.add(lathe(pts, 28), C(col), M4(x, y + r * 0.6, z));
  b.add(lathe([[0.05 * r, 0], [0.03 * r, 0.35 * r], [0.08 * r, 0.42 * r], [0, 0.6 * r]], 8), C("#e8b93e"), M4(x, y + r * 0.6 + (onion ? 1.5 : 1.15) * r, z));
}
export function minaret(b: Batch, x: number, z: number, h: number, wall: string, cap: string) {
  b.add(new THREE.CylinderGeometry(0.75, 0.95, h, 12), C(wall), M4(x, h / 2, z));
  for (const k of [0.45, 0.8]) b.add(new THREE.CylinderGeometry(1.15, 0.85, 0.35, 12), C(shade2(wall, 0.85)), M4(x, h * k, z));
  b.add(new THREE.CylinderGeometry(0.6, 0.7, 1.6, 12), C(wall), M4(x, h + 0.8, z)); b.add(new THREE.ConeGeometry(0.75, 1.6, 12), C(cap), M4(x, h + 2.4, z));
}
/** Hindu temple tower (shikhara): ribbed curvilinear spire on a cubic base, a round amalaka and a kalasha on top */
export function shikhara(b: Batch, x: number, z: number, s: number, col = "#e6b878") {
  b.add(boxGeo(V(-2.4 * s, 0, -2.4 * s), V(2.4 * s, 3.2 * s, 2.4 * s)), C(shade2(col, 0.95)), M4(x, 0, z));
  b.add(boxGeo(V(-2.7 * s, 3.2 * s, -2.7 * s), V(2.7 * s, 3.5 * s, 2.7 * s)), C(shade2(col, 0.85)), M4(x, 0, z));
  const prof: [number, number][] = []; for (let i = 0; i <= 16; i++) { const t = i / 16; prof.push([2.3 * s * (1 - t ** 1.6) * (1 + 0.04 * Math.sin(t * 40)), 7.5 * s * t]); }
  b.add(lathe(prof, 8), C(col), M4(x, 3.5 * s, z, Math.PI / 8));
  b.add(new THREE.CylinderGeometry(0.75 * s, 0.75 * s, 0.35 * s, 16), C(shade2(col, 0.9)), M4(x, 11.1 * s, z));
  b.add(lathe([[0.25, 0], [0.4, 0.3], [0.2, 0.6], [0.08, 0.7], [0.0, 1.1]].map(([r, h]) => [r * s, h * s] as [number, number]), 10), C("#e8b93e"), M4(x, 11.25 * s, z));
  b.add(limb([V(x, 12.2 * s, z), V(x, 13.4 * s, z)], [0.03, 0.03], 4), C("#6b4a30"));
  b.add(quadUV(V(0, 0, 0), V(1.2 * s, -0.25 * s, 0), V(1.2 * s, 0.35 * s, 0), V(0, 0.6 * s, 0)), C("#f28a1e", true), M4(x, 12.6 * s, z));
}
/** gabled European house, ridge along z, gable to the street, tiled roof, optional timber framing */
export function gableHouse(b: Batch, x: number, z: number, w: number, d: number, h: number, wall: string, shutter: string, roof: string, o: { timber?: boolean; steep?: number; ry?: number; brick?: boolean; tiles?: boolean } = {}) {
  const m = M4(x, 0, z, o.ry ?? 0), key = `gh2${wall}${shutter}${w}${h}${o.timber ? 1 : 0}${o.brick ? 1 : 0}`;
  const front = T("fr" + key, facadeHD("o2" + key, w, h, { wall, shutter, door: true, timber: o.timber, brick: o.brick }));
  const side = T("sd" + key, facadeHD("o2s" + key, d, h, { wall, shutter, timber: o.timber, brick: o.brick }));
  const wm = o.brick ? C("#b8573a") : C(wall), hw = w / 2, hd = d / 2, rh = w * (o.steep ?? 0.45), ov = 0.3;
  b.add(quadUV(V(-hw, 0, hd), V(hw, 0, hd), V(hw, h, hd), V(-hw, h, hd)), front, m);
  b.add(quadUV(V(-hw, 0, -hd), V(-hw, 0, hd), V(-hw, h, hd), V(-hw, h, -hd)), side, m);
  b.add(quadUV(V(hw, 0, hd), V(hw, 0, -hd), V(hw, h, -hd), V(hw, h, hd)), side, m);
  const tri = (zz: number) => { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute([-hw, h, zz, hw, h, zz, 0, h + rh, zz], 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 1, 0, 0.5, 1], 2)); g.computeVertexNormals(); return g; };
  b.add(tri(hd), wm, m);
  const rm = T("roof" + roof, roofHD(roof), { side: THREE.DoubleSide });
  b.add(quadUV(V(-hw - ov, h - 0.2, hd + ov), V(-hw - ov, h - 0.2, -hd - ov), V(0, h + rh + 0.05, -hd - ov), V(0, h + rh + 0.05, hd + ov), 0, 0, d / 2, rh / 1.6), rm, m);
  b.add(quadUV(V(hw + ov, h - 0.2, -hd - ov), V(hw + ov, h - 0.2, hd + ov), V(0, h + rh + 0.05, hd + ov), V(0, h + rh + 0.05, -hd - ov), 0, 0, d / 2, rh / 1.6), rm, m);
  b.add(boxGeo(V(-hw - 0.05, h - 0.05, hd), V(hw + 0.05, h + 0.06, hd + 0.08)), C(shade2(wall, 0.82)), m);
  b.add(boxGeo(V(hw * 0.3, h + rh * 0.4, -hd * 0.3), V(hw * 0.3 + 0.45, h + rh + 0.6, -hd * 0.3 + 0.45)), C("#9a5a40"), m); // chimney
}
export function dutchHouse(b: Batch, x: number, z: number, w: number, h: number, wall: string, shutter: string, brick = "#b8573a") {
  gableHouse(b, x, z, w, 7, h, wall, shutter, "#5a4a52", { brick: true, steep: 0.9 });
  const m = M4(x, 0, z), wm = C(brick), tr = C("#f6efdc"), steps = 4, sw = w / 2, sh = (w * 0.9) / steps;
  for (let i = 0; i < steps; i++) { const ww = sw * (1 - i / steps); b.add(boxGeo(V(-ww, h + i * sh, 3.5), V(ww, h + (i + 1) * sh, 3.72)), wm, m); b.add(boxGeo(V(-ww - 0.06, h + (i + 1) * sh - 0.08, 3.5), V(ww + 0.06, h + (i + 1) * sh, 3.8)), tr, m); }
  b.add(boxGeo(V(-0.25, h + steps * sh, 3.5), V(0.25, h + steps * sh + 0.5, 3.72)), wm, m);
  b.add(boxGeo(V(-w / 2, 2.6, 3.5), V(w / 2, 2.72, 3.7)), tr, m);
}
/** Chinese hall: red columns and walls, a sweeping two-pitch roof whose eaves curl up at the corners, ridge ends */
export function curvedRoof(b: Batch, cx: number, y0: number, cz: number, w: number, d: number, rise: number, col: string, ry = 0) {
  const N = 12, mat = T("croof" + col, rep(roofHD(col, true), 1, 1), { side: THREE.DoubleSide }), m = M4(cx, y0, cz, ry);
  for (const side of [-1, 1]) {
    const rings: THREE.Vector3[][] = [], us: number[] = [];
    for (let i = 0; i <= N; i++) { const t = i / N, xx = (t - 0.5) * w, curl = 0.55 * Math.pow(Math.abs(t - 0.5) * 2, 4); const ring: THREE.Vector3[] = []; for (let j = 0; j <= 6; j++) { const s = j / 6, zz = side * (d / 2) * (1 - s), yy = rise * (1 - (1 - s) ** 1.8) + curl * (1 - s); ring.push(V(xx, yy, zz)); } rings.push(ring); us.push(t * w / 2); }
    const pos: number[] = [], uv: number[] = [];
    for (let i = 0; i < N; i++) for (let j = 0; j < 6; j++) { const a = rings[i][j], bb = rings[i + 1][j], c = rings[i + 1][j + 1], dd = rings[i][j + 1]; for (const q of [a, bb, c, a, c, dd]) pos.push(q.x, q.y, q.z); uv.push(us[i], j / 6, us[i + 1], j / 6, us[i + 1], (j + 1) / 6, us[i], j / 6, us[i + 1], (j + 1) / 6, us[i], (j + 1) / 6); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.computeVertexNormals(); b.add(g, mat, m);
  }
  b.add(limb([V(-w / 2 - 0.2, rise + 0.3, 0), V(w / 2 + 0.2, rise + 0.3, 0)], [0.14, 0.14], 6), C(shade2(col, 0.7)), m);
  for (const s of [-1, 1]) b.add(limb([V(s * w / 2, rise + 0.3, 0), V(s * (w / 2 + 0.3), rise + 0.9, 0)], [0.14, 0.05], 6), C(shade2(col, 0.7)), m);
}
export function chinaHall(b: Batch, x: number, z: number, w: number, d: number, h: number, roof = "#3f7a5e", ry = 0) {
  const m = M4(x, 0, z, ry), red = C("#c8402f"), wall = T("chWall" + w, facadeHD("o2ch" + w + h, w, h, { wall: "#d9584a", shutter: "#2f5a3a", door: true }));
  b.add(boxGeo(V(-w / 2 - 0.4, 0, -d / 2 - 0.4), V(w / 2 + 0.4, 0.35, d / 2 + 0.4)), C("#cfc6b4"), m);
  b.add(quadUV(V(-w / 2, 0.35, d / 2 - 0.6), V(w / 2, 0.35, d / 2 - 0.6), V(w / 2, h, d / 2 - 0.6), V(-w / 2, h, d / 2 - 0.6)), wall, m);
  b.add(boxGeo(V(-w / 2, 0.35, -d / 2), V(w / 2, h, d / 2 - 0.6)), red, m);
  for (let i = 0; i <= Math.round(w / 1.6); i++) b.add(new THREE.CylinderGeometry(0.13, 0.15, h - 0.35, 10), red, m.clone().multiply(M4(-w / 2 + i * (w / Math.round(w / 1.6)), 0.35 + (h - 0.35) / 2, d / 2)));
  b.add(boxGeo(V(-w / 2, h - 0.35, d / 2 - 0.1), V(w / 2, h, d / 2 + 0.1)), C("#2f6a8a"), m);
  curvedRoof(b, 0, h, 0, w + 1.8, d + 2.2, 1.8, roof); void m;
  const g = new THREE.Matrix4().multiplyMatrices(m, new THREE.Matrix4()); void g;
}
export function pagoda(b: Batch, x: number, z: number, s: number, tiers = 5) {
  for (let k = 0; k < tiers; k++) {
    const w = (3.6 - k * 0.45) * s, y = k * 2.4 * s;
    b.add(boxGeo(V(-w / 2, y, -w / 2), V(w / 2, y + 1.9 * s, w / 2)), C(k % 2 ? "#d9584a" : "#c8402f"), M4(x, 0, z));
    for (const ry of [0, Math.PI / 2]) curvedRoof(b, x, y + 1.9 * s, z, w + 1.6 * s, w + 1.6 * s, 0.6 * s, "#3f7a5e", ry);
  }
  b.add(lathe([[0.2, 0], [0.12, 1.5], [0.25, 1.6], [0.0, 2.8]].map(([r, h]) => [r * s, h * s] as [number, number]), 8), C("#e8b93e"), M4(x, tiers * 2.4 * s, z));
}
export function paifang(b: Batch, x: number, z: number, w: number, h: number) {
  const red = C("#c8402f");
  for (const sx of [-w / 2, -w / 6, w / 6, w / 2]) { b.add(new THREE.CylinderGeometry(0.22, 0.25, h, 12), red, M4(x + sx, h / 2, z)); b.add(boxGeo(V(-0.4, 0, -0.4), V(0.4, 0.6, 0.4)), C("#cfc6b4"), M4(x + sx, 0, z)); }
  b.add(boxGeo(V(-w / 2 - 0.4, h - 0.9, -0.2), V(w / 2 + 0.4, h - 0.5, 0.2)), C("#2f6a8a"), M4(x, 0, z));
  b.add(boxGeo(V(-w / 2 - 0.4, h - 0.3, -0.25), V(w / 2 + 0.4, h + 0.1, 0.25)), red, M4(x, 0, z));
  curvedRoof(b, x, h + 0.1, z, w + 1.6, 1.8, 0.7, "#3f7a5e");
}
export function chapel(b: Batch, x: number, z: number, s: number, ry = 0) {
  const m = M4(x, 0, z, ry), white = C("#f6f2e8"), trim = C("#d9b25a"), w = 8 * s, d = 12 * s, h = 7 * s;
  b.add(quadUV(V(-w / 2, 0, d / 2), V(w / 2, 0, d / 2), V(w / 2, h, d / 2), V(-w / 2, h, d / 2)), T("chapelF", facadeHD("o2chapel", 8, 7, { wall: "#f6f2e8", shutter: "#2f5ea8", door: true })), m);
  b.add(boxGeo(V(-w / 2, 0, -d / 2), V(w / 2, h, d / 2 - 0.01)), white, m);
  const tri = new THREE.BufferGeometry(); tri.setAttribute("position", new THREE.Float32BufferAttribute([-w / 2 - 0.3, h, d / 2 + 0.05, w / 2 + 0.3, h, d / 2 + 0.05, 0, h + 3 * s, d / 2 + 0.05], 3)); tri.computeVertexNormals(); b.add(tri, white, m);
  b.add(boxGeo(V(-w / 2 - 0.3, h - 0.25, d / 2), V(w / 2 + 0.3, h, d / 2 + 0.2)), trim, m);
  for (const sx of [-w / 2, w / 2]) b.add(boxGeo(V(sx - 0.35, 0, d / 2 - 0.2), V(sx + 0.35, h, d / 2 + 0.15)), trim, m);
  b.add(boxGeo(V(-0.08, h + 3 * s, d / 2 - 0.1), V(0.08, h + 4.4 * s, d / 2)), C("#3a3034"), m); b.add(boxGeo(V(-0.45, h + 3.7 * s, d / 2 - 0.1), V(0.45, h + 3.86 * s, d / 2)), C("#3a3034"), m);
  b.add(quadUV(V(-w / 2 - 0.3, h, d / 2 + 0.3), V(-w / 2 - 0.3, h, -d / 2 - 0.3), V(0, h + 3 * s, -d / 2 - 0.3), V(0, h + 3 * s, d / 2 + 0.3), 0, 0, d / 2, 2), T("roofCh", roofHD("#c9775a"), { side: THREE.DoubleSide }), m);
  b.add(quadUV(V(w / 2 + 0.3, h, -d / 2 - 0.3), V(w / 2 + 0.3, h, d / 2 + 0.3), V(0, h + 3 * s, d / 2 + 0.3), V(0, h + 3 * s, -d / 2 - 0.3), 0, 0, d / 2, 2), T("roofCh", roofHD("#c9775a"), { side: THREE.DoubleSide }), m);
}
/** Sintra's National Palace: white blocks with arched windows and its two giant conical kitchen chimneys */
export function sintraPalace(b: Batch, x: number, y: number, z: number, s: number) {
  const white = C("#f4efe4"), m = M4(x, y, z), fac = T("sinF", facadeHD("o2sintra", 16, 7, { wall: "#f4efe4", shutter: "#8c3b4a" }));
  b.add(quadUV(V(-8 * s, 0, 4 * s), V(8 * s, 0, 4 * s), V(8 * s, 7 * s, 4 * s), V(-8 * s, 7 * s, 4 * s)), fac, m);
  b.add(boxGeo(V(-8 * s, 0, -4 * s), V(8 * s, 7 * s, 3.99 * s)), white, m);
  b.add(boxGeo(V(-12 * s, 0, -2 * s), V(-8 * s, 9 * s, 3 * s)), white, m); b.add(boxGeo(V(8 * s, 0, -3 * s), V(12 * s, 5.5 * s, 3.5 * s)), white, m);
  for (let i = 0; i < 18; i++) b.add(boxGeo(V(-0.3, 0, -0.3), V(0.3, 0.6, 0.3)), white, m.clone().multiply(M4((-8 + 0.45 + i * 0.9) * s, 7 * s, 3.8 * s)));
  const roof = T("roofSin", roofHD("#c9775a"), { side: THREE.DoubleSide });
  b.add(new THREE.ConeGeometry(5.5 * s, 2.2 * s, 4).rotateY(Math.PI / 4), roof, m.clone().multiply(M4(-10 * s, 10.1 * s, 0.5 * s, 0, [0.6, 1, 0.75])));
  for (const sx of [-2.8, 2.8]) { b.add(new THREE.ConeGeometry(2.2 * s, 13 * s, 24, 1, true), C("#f6f3ec", true), m.clone().multiply(M4(sx * s, 7 * s + 6.5 * s, -1 * s))); b.add(new THREE.CylinderGeometry(0.35 * s, 0.35 * s, 0.6 * s, 12), white, m.clone().multiply(M4(sx * s, 7 * s + 13 * s, -1 * s))); }
  for (let i = 0; i < 6; i++) b.add(archFrame(1.1 * s, 2.0 * s, 0.15, false), C("#d9d2c4"), m.clone().multiply(M4((-6.5 + i * 2.6) * s, 0, 4.02 * s)));
}
/** crenellated stone wall along a ridge line (the Moorish castle), with square towers */
export function castleWall(b: Batch, pts: [number, number, number][], h: number, col = "#c9c2b2") {
  const st = C(col);
  for (let i = 0; i < pts.length - 1; i++) {
    const a = V(...pts[i]), c = V(...pts[i + 1]), len = a.distanceTo(c), ry = Math.atan2(c.x - a.x, c.z - a.z) - Math.PI / 2, mid = a.clone().lerp(c, 0.5);
    b.add(boxGeo(V(-len / 2, -4, -0.6), V(len / 2, h, 0.6)), st, M4(mid.x, mid.y, mid.z, ry, 1, 0, Math.atan2(c.y - a.y, len)));
    for (let k = 0; k < Math.floor(len / 1.6); k++) { const q = a.clone().lerp(c, (k + 0.5) / Math.floor(len / 1.6)); b.add(boxGeo(V(-0.45, 0, -0.6), V(0.45, 0.9, 0.6)), st, M4(q.x, q.y + h, q.z, ry)); }
    if (i % 2 === 0) { b.add(boxGeo(V(-1.8, -4, -1.8), V(1.8, h + 3, 1.8)), st, M4(a.x, a.y, a.z)); for (const [dx, dz] of [[-1.4, -1.4], [1.4, -1.4], [-1.4, 1.4], [1.4, 1.4]]) b.add(boxGeo(V(-0.35, 0, -0.35), V(0.35, 0.8, 0.35)), st, M4(a.x + dx, a.y + h + 3, a.z + dz)); }
  }
}
/** a Belem-like river tower: square body with crenels, a balcony arcade and four corner turrets */
export function riverTower(b: Batch, x: number, z: number, s: number) {
  const st = C("#e9e2d2"), m = M4(x, 0, z);
  b.add(boxGeo(V(-6 * s, -1, -6 * s), V(6 * s, 4 * s, 6 * s)), st, m);
  b.add(boxGeo(V(-3 * s, 4 * s, -3 * s), V(3 * s, 18 * s, 3 * s)), st, m);
  for (const [dx, dz] of [[-3, -3], [3, -3], [-3, 3], [3, 3], [-6, 6], [6, 6]]) { b.add(new THREE.CylinderGeometry(0.6 * s, 0.6 * s, 2 * s, 10), st, m.clone().multiply(M4(dx * s, (dx * dx === 36 ? 5 : 18.5) * s, dz * s))); dome(b, x + dx * s, (dx * dx === 36 ? 6 : 19.5) * s, z + dz * s, 0.6 * s, "#e9e2d2", "#e9e2d2"); }
  for (let i = 0; i < 6; i++) for (const sd of [-1, 1]) b.add(boxGeo(V(-0.4 * s, 0, -0.4 * s), V(0.4 * s, 0.8 * s, 0.4 * s)), st, m.clone().multiply(M4((-2.5 + i) * s, 18 * s, sd * 3 * s)));
  b.add(boxGeo(V(-3.2 * s, 10 * s, 3 * s), V(3.2 * s, 10.3 * s, 4 * s)), C("#d6cdb8"), m);
}
/** a Dutch smock mill: tapered octagonal body, a cap, four lattice sails (rotate the returned group) */
export function windmill(parent: THREE.Object3D, x: number, z: number, s: number): THREE.Group {
  const b = new Batch(), m = M4(x, 0, z);
  b.add(new THREE.CylinderGeometry(2.0 * s, 3.4 * s, 9 * s, 8), C("#4f5a4a"), m.clone().multiply(M4(0, 4.5 * s, 0)));
  b.add(new THREE.CylinderGeometry(3.6 * s, 3.6 * s, 0.4 * s, 8), C("#8a5a34"), m.clone().multiply(M4(0, 3.2 * s, 0)));
  b.add(new THREE.ConeGeometry(2.3 * s, 2.2 * s, 8), C("#6a4a3a"), m.clone().multiply(M4(0, 10.1 * s, 0)));
  b.build(parent);
  const sails = new THREE.Group(); sails.position.set(x, 9.5 * s, z + 2.2 * s); parent.add(sails); const sb = new Batch(), sailT = T("millSail", ctex("o2mill", 128, 512, (g) => { g.fillStyle = "#f4ead6"; g.fillRect(0, 0, 128, 512); g.strokeStyle = "#5a3a24"; g.lineWidth = 8; for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(0, i * 64); g.lineTo(128, i * 64); g.stroke(); } g.strokeRect(4, 4, 120, 504); }), { side: THREE.DoubleSide });
  for (let k = 0; k < 4; k++) { const a = (k * Math.PI) / 2, mm = new THREE.Matrix4().makeRotationZ(a); sb.add(boxGeo(V(-0.12 * s, 0, -0.1), V(0.12 * s, 7 * s, 0.1)), C("#5a3a24"), mm); sb.add(quadUV(V(0.15 * s, 1.2 * s, 0), V(1.5 * s, 1.2 * s, 0), V(1.5 * s, 7 * s, 0), V(0.15 * s, 7 * s, 0)), sailT, mm); }
  sb.build(sails); return sails;
}
export function hill(b: Batch, x: number, z: number, sx: number, sy: number, sz: number, col: string, seed: number, y = -0.1) {
  const g = new THREE.SphereGeometry(1, 36, 12, 0, Math.PI * 2, 0, Math.PI / 2), p = g.attributes.position as THREE.BufferAttribute, rr = rng(seed), ph = [rr() * 6, rr() * 6];
  for (let i = 0; i < p.count; i++) { const X = p.getX(i), Y = p.getY(i), Z = p.getZ(i), k = 1 + 0.16 * Math.sin(4 * X + ph[0]) * Math.cos(3 * Z + ph[1]); p.setXYZ(i, X * sx, Math.pow(Y, 0.8) * sy * k, Z * sz); }
  g.computeVertexNormals(); b.add(g, T("hill" + col, rep(speckTex("hill" + col, col, [shade2(col, 0.9), shade2(col, 1.08)], 600, 40), 4, 2)), M4(x, y, z));
}

// ---------------- ships ----------------
const sailCross = () => ctex("o2sailX", 512, 512, (g) => {
  g.fillStyle = "#fbf3df"; g.fillRect(0, 0, 512, 512); g.fillStyle = "rgba(170,140,100,0.2)"; for (let i = 1; i < 6; i++) g.fillRect(i * 85, 0, 5, 512);
  g.fillStyle = "#c8302a"; // Order of Christ cross: flared arms with a white inner cross
  const cx = 256, cy = 270, A = 170, Bw = 58;
  for (const r of [0, 1, 2, 3]) { g.save(); g.translate(cx, cy); g.rotate((r * Math.PI) / 2); g.beginPath(); g.moveTo(-Bw * 0.45, 0); g.lineTo(-Bw, A); g.lineTo(Bw, A); g.lineTo(Bw * 0.45, 0); g.closePath(); g.fill(); g.restore(); }
  g.fillStyle = "#fbf3df"; g.fillRect(cx - 9, cy - 130, 18, 260); g.fillRect(cx - 130, cy - 9, 260, 18);
});
const hullTex = () => ctex("o2hull", 1024, 512, (g, r) => {
  g.fillStyle = "#8a5430"; g.fillRect(0, 0, 1024, 512);
  for (let i = 0; i < 16; i++) { g.fillStyle = r() < 0.5 ? "rgba(255,220,170,0.08)" : "rgba(50,25,10,0.1)"; g.fillRect(0, i * 32, 1024, 32); g.fillStyle = "rgba(40,20,8,0.55)"; g.fillRect(0, i * 32, 1024, 3); }
  for (let i = 0; i < 60; i++) { g.fillStyle = "rgba(40,20,8,0.35)"; g.fillRect(r() * 1024, Math.floor(r() * 16) * 32, 3, 32); }
  g.fillStyle = "#3a2a24"; g.fillRect(0, 300, 1024, 26); g.fillRect(0, 160, 1024, 14); // wales
  g.fillStyle = "#f2e8d2"; g.fillRect(0, 380, 1024, 60); // painted waterline band
  g.fillStyle = "#5a7a5a"; g.fillRect(0, 440, 1024, 72);
});
/** caravel (caravela redonda): lofted round hull with sheer, raised aftcastle, small forecastle, three masts:
 *  two square sails with the Order of Christ cross and a lateen mizzen; shrouds, bowsprit, stern lantern, pennants.
 *  Local: bow +x, waterline y = 0. Returns the group and the sail bellies (scale x to fill them). */
export function caravel(parent: THREE.Object3D, s = 1): { g: THREE.Group; sails: THREE.Object3D[] } {
  const G = new THREE.Group(); parent.add(G); const b = new Batch(), sb = new Batch();
  const hull = T("hull2", hullTex(), { side: THREE.DoubleSide }), dark = C("#3a2a24"), deck = T("deck2", rep(grainWood("deck3", "#c79a62", 8), 3, 1)), wood = T("wood2", grainWood("wood2", "#8a5430", 4));
  const L = 18 * s, B = 2.6 * s, D = 2.0 * s, NS = 22, NR = 16;
  const half = (t: number) => B * Math.pow(Math.sin(Math.PI * Math.min(1, 0.08 + t * 0.92)), 0.55) * (t < 0.12 ? 0.75 + 2.1 * t : 1); // t 0 stern .. 1 bow
  const sheer = (t: number) => (1.0 + 1.6 * Math.pow(1 - t, 3) + 1.1 * Math.pow(t, 4)) * s;
  const keel = (t: number) => -D * (1 - 0.6 * Math.pow(Math.abs(t - 0.45) / 0.55, 3));
  const rings: THREE.Vector3[][] = [], us: number[] = [];
  for (let i = 0; i <= NS; i++) {
    const t = i / NS, xx = (t - 0.5) * L + (t > 0.85 ? (t - 0.85) * 2.2 * s : 0), bh = half(t), top = sheer(t), bot = keel(t), ring: THREE.Vector3[] = [];
    for (let j = 0; j < NR; j++) { const th = -Math.PI / 2 + (Math.PI * j) / (NR - 1), c = Math.cos(th), sn = Math.sin(th); ring.push(V(xx, top - (top - bot) * Math.pow(c, 0.55), bh * sn * (1 - 0.1 * Math.pow(c, 4)) * (j === 0 || j === NR - 1 ? 0.94 : 1))); }
    rings.push(ring); us.push(t * 2);
  }
  b.add(loft(rings, us, { capA: true }), hull);
  // deck strip just above the closing chord, bulwark rails
  const dk: number[] = []; for (let i = 0; i < NS; i++) { const a0 = rings[i][0], a1 = rings[i][NR - 1], b0 = rings[i + 1][0], b1 = rings[i + 1][NR - 1]; for (const q of [a0, b0, b1, a0, b1, a1]) dk.push(q.x, q.y + 0.03, q.z * 0.97); }
  { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(dk, 3)); g.computeVertexNormals(); const uv: number[] = []; for (let i = 0; i < dk.length / 3; i++) uv.push(dk[i * 3] / 2, dk[i * 3 + 2] / 2); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); b.add(g, deck); }
  for (const j of [0, NR - 1]) { const pts = rings.map((r) => r[j]); for (let i = 0; i < NS; i++) { const a = pts[i], c = pts[i + 1]; b.add(quadUV(a, c, V(c.x, c.y + 0.55 * s, c.z), V(a.x, a.y + 0.55 * s, a.z)), hull); b.add(limb([V(a.x, a.y + 0.58 * s, a.z), V(c.x, c.y + 0.58 * s, c.z)], [0.06 * s, 0.06 * s], 4), dark); } }
  // aftcastle and forecastle
  b.add(boxGeo(V(-L / 2 + 0.2 * s, sheer(0.1), -B * 0.75), V(-L * 0.2, sheer(0.1) + 1.4 * s, B * 0.75)), wood);
  b.add(boxGeo(V(-L / 2 + 0.1 * s, sheer(0.1) + 1.4 * s, -B * 0.8), V(-L * 0.19, sheer(0.1) + 1.55 * s, B * 0.8)), dark);
  for (let i = 0; i < 5; i++) b.add(boxGeo(V(-L * 0.38 + i * 0.9 * s, sheer(0.1) + 0.3 * s, B * 0.75), V(-L * 0.38 + i * 0.9 * s + 0.5 * s, sheer(0.1) + 0.9 * s, B * 0.76)), C("#f2c230"));
  b.add(boxGeo(V(L * 0.3, sheer(0.85) - 0.1, -B * 0.55), V(L * 0.46, sheer(0.85) + 0.9 * s, B * 0.55)), wood);
  b.add(limb([V(L * 0.46, sheer(0.95) + 0.2, 0), V(L / 2 + 4.5 * s, sheer(1) + 1.6 * s, 0)], [0.14 * s, 0.07 * s], 6), dark); // bowsprit
  b.add(lathe([[0.12, 0], [0.2, 0.15], [0.16, 0.45], [0.0, 0.6]].map(([r, h]) => [r * s, h * s] as [number, number]), 8), C("#e8b93e"), M4(-L / 2, sheer(0) + 1.6 * s, 0)); // stern lantern
  const masts: [number, number, number, boolean][] = [[L * 0.24, 10 * s, 5.2 * s, false], [-L * 0.02, 13 * s, 6.6 * s, false], [-L * 0.28, 9 * s, 0, true]];
  const sailM = T("sailX", sailCross(), { side: THREE.DoubleSide }), sails: THREE.Object3D[] = [];
  for (const [mx, mh, sw, lat] of masts) {
    const y0 = sheer((mx / L) + 0.5) - 0.5, top = y0 + mh;
    b.add(limb([V(mx, y0, 0), V(mx, top, 0)], [0.2 * s, 0.11 * s], 8), wood);
    b.add(new THREE.CylinderGeometry(0.55 * s, 0.4 * s, 0.6 * s, 10), wood, M4(mx, top - 1.6 * s, 0)); // fighting top
    b.add(quadUV(V(mx, top + 0.1, 0), V(mx - 1.8 * s, top - 0.15, 0), V(mx - 1.8 * s, top - 0.45, 0), V(mx, top - 0.5, 0)), C("#c8302a", true));
    for (const sz of [-1, 1]) for (let k = 0; k < 3; k++) b.add(limb([V(mx, top - 1.8 * s, 0), V(mx - 0.8 * s + k * 0.7 * s, sheer((mx / L) + 0.5) + 0.55 * s, sz * B * 0.95)], [0.018 * s, 0.018 * s], 3), dark);
    const sg = new THREE.Group(); sg.position.set(mx + 0.3 * s, 0, 0); G.add(sg); sails.push(sg); const sbb = new Batch();
    if (!lat) {
      const yt = top - 2.2 * s, yb = y0 + 2.6 * s, N = 6;
      b.add(limb([V(mx + 0.2, yt + 0.1, -sw / 2 - 0.3), V(mx + 0.2, yt + 0.1, sw / 2 + 0.3)], [0.08 * s, 0.08 * s], 6), wood);
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
        const P = (u: number, v: number) => V(1.3 * s * Math.sin(Math.PI * u) * Math.sin(Math.PI * Math.min(1, v * 0.9 + 0.1)), yt - (yt - yb) * v, (u - 0.5) * sw * (1 + 0.1 * v));
        sbb.add(quadUV(P(i / N, j / N), P((i + 1) / N, j / N), P((i + 1) / N, (j + 1) / N), P(i / N, (j + 1) / N), i / N, 1 - j / N, (i + 1) / N, 1 - (j + 1) / N), sailM);
      }
    } else {
      const a = V(0, y0 + 1.2 * s, 0), c = V(0, top + 1.0 * s, 0); b.add(limb([V(mx + 2.6 * s, y0 + 1.2 * s, 0), V(mx - 3.4 * s, top + 1.0 * s, 0)], [0.07 * s, 0.05 * s], 5), wood); void a; void c;
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute([2.3 * s, y0 + 1.3 * s, 0.2, -3.2 * s, top + 0.9 * s, 0.2, -1.8 * s, y0 + 1.5 * s, 0.9 * s], 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute([0.9, 0.1, 0.1, 0.95, 0.2, 0.1], 2)); g.computeVertexNormals(); sbb.add(g, sailM);
    }
    sbb.build(sg, false);
  }
  b.add(limb([V(L * 0.24, sheer(0.74) + 9.6 * s, 0), V(L / 2 + 4.3 * s, sheer(1) + 1.6 * s, 0)], [0.02 * s, 0.02 * s], 3), dark);
  b.add(limb([V(-L * 0.02, sheer(0.5) + 12.6 * s, 0), V(L * 0.24, sheer(0.74) + 9.6 * s, 0)], [0.02 * s, 0.02 * s], 3), dark);
  b.build(G); sb.build(G, false);
  return { g: G, sails };
}
/** Chinese junk: flat transom stern, high poop, three masts with battened lug sails (rust red), eye on the bow */
export function junk(parent: THREE.Object3D, s = 1): THREE.Group {
  const G = new THREE.Group(); parent.add(G); const b = new Batch();
  const L = 14 * s, B = 2.4 * s, rings: THREE.Vector3[][] = [], us: number[] = [];
  for (let i = 0; i <= 14; i++) { const t = i / 14, xx = (t - 0.5) * L, bh = B * (0.75 + 0.25 * Math.sin(Math.PI * t)), top = (1.0 + 1.8 * Math.pow(1 - t, 2) + 0.8 * Math.pow(t, 3)) * s, bot = -1.3 * s * Math.sin(Math.PI * (0.1 + 0.8 * t)); const ring: THREE.Vector3[] = []; for (let j = 0; j < 12; j++) { const th = -Math.PI / 2 + (Math.PI * j) / 11; ring.push(V(xx, top - (top - bot) * Math.pow(Math.cos(th), 0.4), bh * Math.sin(th))); } rings.push(ring); us.push(t * 2); }
  b.add(loft(rings, us, { capA: true, capB: true }), T("junkHull", hullTex(), { side: THREE.DoubleSide }));
  const sailT = T("junkSail", ctex("o2junk", 256, 512, (g) => { g.fillStyle = "#c2532e"; g.fillRect(0, 0, 256, 512); g.strokeStyle = "#5a2a1a"; g.lineWidth = 7; for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(0, i * 64); g.lineTo(256, i * 64 - 10); g.stroke(); } }), { side: THREE.DoubleSide });
  for (const [mx, h, w] of [[3.5 * s, 8 * s, 3.4 * s], [-0.5 * s, 10 * s, 4.4 * s], [-4.5 * s, 7 * s, 3 * s]] as const) { b.add(limb([V(mx, 1, 0), V(mx, 1 + h, 0)], [0.13 * s, 0.08 * s], 6), C("#6a4a30")); b.add(quadUV(V(mx - w * 0.75, 2.2 * s, 0.25), V(mx + w * 0.35, 2.2 * s, 0.25), V(mx + w * 0.3, h + 0.6, 0.25), V(mx - w * 0.6, h + 0.2, 0.25)), sailT); }
  b.build(G); return G;
}
export function rowBoat(b: Batch, x: number, z: number, ry: number, col = "#2f7fc4") {
  const rings: THREE.Vector3[][] = [], us: number[] = [];
  for (let i = 0; i <= 8; i++) { const t = i / 8, xx = (t - 0.5) * 3.4, bh = 0.62 * Math.sin(Math.PI * (0.06 + 0.88 * t)), ring: THREE.Vector3[] = []; for (let j = 0; j < 9; j++) { const th = -Math.PI / 2 + (Math.PI * j) / 8; ring.push(V(xx, 0.45 - 0.75 * Math.pow(Math.cos(th), 0.6), bh * Math.sin(th))); } rings.push(ring); us.push(t); }
  b.add(loft(rings, us), C(col, true), M4(x, 0, z, ry));
}

// ---------------- camels ----------------
const camelCol = "#d4a062", camelDark = "#b88446";
/** a 3D dromedary: body, hump, neck, head; four two-segment legs pivoting at the shoulder/hip (pace gait: same-side
 *  legs together). update(phase) swings the legs and bobs the body. kneel = folded legs for a resting camel. */
export class Camel {
  g = new THREE.Group(); body = new THREE.Group(); legs: { g: THREE.Group; low: THREE.Group; side: number; front: boolean }[] = []; head = new THREE.Group(); kneel = false;
  constructor(parent: THREE.Object3D, x: number, z: number, ry: number, o: { kneel?: boolean; load?: boolean; blanket?: string; s?: number } = {}) {
    const s = o.s ?? 1, fur = T("camelFur", rep(speckTex("camel", camelCol, [camelDark, "#e2b47a"], 400, 20), 2, 2)), dark = C(camelDark);
    this.g.position.set(x, 0, z); this.g.rotation.y = ry; this.g.scale.setScalar(s); parent.add(this.g); this.g.add(this.body);
    const kneel = !!o.kneel; this.kneel = kneel; const by = kneel ? 0.75 : 1.65, b = new Batch();
    b.add(rock(11, 0.95, 0.5, 0.46, 0.9, 2, 0.05), fur, M4(0, by, 0));
    b.add(rock(18, 0.42, 0.42, 0.4, 0.9, 2, 0.05), fur, M4(0.6, by - 0.02, 0)); // deep chest
    b.add(new THREE.LatheGeometry([[0.62, 0], [0.58, 0.18], [0.44, 0.4], [0.22, 0.56], [0.0, 0.6]].map(([r, h]) => new THREE.Vector2(r, h)), 20).scale(1, 1, 0.72), fur, M4(-0.12, by + 0.28, 0)); // the hump, peaked, a little behind the middle
    b.add(limb([V(0.78, by + 0.08, 0), V(1.12, by - 0.04, 0), V(1.42, by + 0.22, 0), V(1.56, by + 0.68, 0), V(1.52, by + 1.06, 0)], [0.25, 0.2, 0.16, 0.135, 0.12], 10, 1, 16), fur); // the long S neck: down from the chest, then up
    b.add(limb([V(1.05, by - 0.12, 0), V(1.3, by + 0.0, 0)], [0.1, 0.06], 6), C(camelDark)); // throat fur
    b.add(limb([V(-0.85, by + 0.1, 0), V(-1.05, by - 0.25, 0), V(-1.0, by - 0.55, 0)], [0.05, 0.04, 0.02], 5), dark);
    if (o.load) {
      b.add(rock(13, 0.6, 0.14, 0.5, 0.8, 1, 0.02), C(o.blanket ?? "#c8302a"), M4(-0.12, by + 0.8, 0));
      for (const sz of [-1, 1]) { b.add(boxGeo(V(-0.32, -0.28, -0.2), V(0.32, 0.28, 0.2)), T("crateW", grainWood("crate3", "#b49a82", 3)), M4(-0.05, by + 0.1, sz * 0.62)); oranges(b, -0.05, by + 0.32, sz * 0.62, 8, 0.2, 40 + sz, 0.8); }
      for (let k = 0; k < 6; k++) b.add(new THREE.SphereGeometry(0.04, 6, 5), C("#f2c230"), M4(-0.6 + k * 0.22, by + 0.02, 0.58));
    }
    b.build(this.body);
    this.head.position.set(1.52, by + 1.12, 0); this.body.add(this.head); const hb = new Batch();
    hb.add(rock(14, 0.26, 0.17, 0.16, 0.9, 2, 0.04), fur, M4(0.1, 0.02, 0, 0, 1, 0, -0.15)); // skull
    hb.add(rock(15, 0.24, 0.12, 0.12, 0.9, 2, 0.03), fur, M4(0.4, -0.08, 0, 0, 1, 0, -0.3)); // long snout
    hb.add(rock(17, 0.09, 0.06, 0.1, 0.9, 1, 0.02), C(camelDark), M4(0.6, -0.17, 0)); // muzzle
    hb.add(rock(19, 0.11, 0.045, 0.085, 0.9, 1, 0.02), C("#a8703e"), M4(0.55, -0.25, 0, 0, 1, 0, 0.25)); // the droopy lower lip
    for (const sz of [-1, 1]) {
      hb.add(new THREE.SphereGeometry(0.05, 12, 10), C("#fbf6ee"), M4(0.2, 0.08, sz * 0.125)); hb.add(new THREE.SphereGeometry(0.027, 8, 6), C("#2a1a20"), M4(0.235, 0.07, sz * 0.165));
      hb.add(new THREE.SphereGeometry(0.056, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), fur, M4(0.2, 0.08, sz * 0.125, 0, 1, 0, -0.35)); // heavy upper lid over the eye
      hb.add(new THREE.ConeGeometry(0.045, 0.14, 7), fur, M4(-0.06, 0.18, sz * 0.11, 0, 1, sz * 0.5, 0.4)); // ear, laid back
      hb.add(new THREE.SphereGeometry(0.014, 6, 5), C("#3a2228"), M4(0.66, -0.12, sz * 0.05)); // nostril
    }
    if (o.load) hb.add(new THREE.TorusGeometry(0.15, 0.02, 4, 12).rotateY(Math.PI / 2), C("#c8302a"), M4(0.35, -0.02, 0));
    hb.build(this.head);
    for (const front of [true, false]) for (const side of [-1, 1]) {
      const lg = new THREE.Group(); lg.position.set(front ? 0.62 : -0.6, by - 0.2, side * 0.25); this.body.add(lg);
      const lb = new Batch(); lb.add(limb([V(0, 0.05, 0), V(front ? 0.02 : 0.1, -0.42, 0), V(0, kneel ? -0.3 : -0.78, 0)], [0.19, 0.11, 0.075], 7), fur); lb.build(lg);
      const low = new THREE.Group(); low.position.set(0, kneel ? -0.3 : -0.78, 0); lg.add(low);
      const lo = new Batch(); lo.add(new THREE.SphereGeometry(0.11, 10, 8).scale(1, 1.1, 1), fur); lo.add(rock(20, 0.08, 0.05, 0.07, 0.9, 1, 0.02), dark, M4(0.07, 0, 0)); lo.add(limb([V(0, 0, 0), V(0, -0.6, 0)], [0.065, 0.055], 6), fur); lo.add(new THREE.SphereGeometry(0.07, 8, 6), fur, M4(0, -0.58, 0)); lo.add(rock(16, 0.17, 0.06, 0.15, 0.9, 1, 0.02), dark, M4(0.05, -0.68, 0)); lo.build(low); // knobbly knee (callus), fetlock, wide padded foot
      if (kneel) { lg.rotation.z = front ? -1.4 : 1.3; low.rotation.z = front ? 2.6 : -2.5; }
      this.legs.push({ g: lg, low, side, front });
    }
    this.body.traverse((c) => { const m = c as THREE.Mesh; if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  }
  /** phase 0..1 of a stride (pace), speed 0 = standing (idle sway only), t = real frame for idle */
  update(phase: number, walking: boolean, t: number) {
    const two = Math.PI * 2;
    for (const l of this.legs) {
      if (!walking) { if (!this.kneel) { l.g.rotation.z = 0; l.low.rotation.z = 0; } continue; }
      const ph = two * (phase + (l.side > 0 ? 0 : 0.5)), sw = Math.sin(ph) * 0.42;
      l.g.rotation.z = sw; l.low.rotation.z = Math.max(0, -Math.cos(ph)) * (l.front ? -0.7 : 0.6);
    }
    this.body.position.y = walking ? 0.05 * Math.abs(Math.sin(two * phase)) : 0;
    this.body.rotation.x = walking ? 0.04 * Math.sin(two * phase) : 0;
    this.head.rotation.z = (walking ? 0.12 * Math.sin(two * phase * 2) : 0.06 * Math.sin(t * 0.05));
    this.head.rotation.y = walking ? 0 : 0.2 * Math.sin(t * 0.03);
  }
}
export { mergeNI, NOINK };
