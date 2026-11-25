// "The orange that changed its name": set pieces built from the Niihau kit (Batch + two-tone Lambert, kit textures).
// Every set is a street/market corner seen from +z: ground at y 0, buildings behind (z -6 .. -16), the stall and the
// hanging NAME SIGN near the middle, people at z -1 .. 1. Each set lives in its own group (origin moved far apart).
import * as THREE from "three";
import { Batch, lam, boxGeo, V } from "../film/build";
import { ctex, roofHD, facadeHD, cobble, rep } from "../film/paint";
import { quadUV, limb, rock, rng } from "../film/geo";
import { mats, palm, Mats } from "../film/set";
import { dryGroundHD } from "../film/paintx";
import { grainWood } from "../film/paint3";
import { NOINK } from "../film/ink";
import { untone } from "../film/shade";
import { Pen, INK } from "../film/toon";

export const M4 = (x: number, y: number, z: number, ry = 0, s = 1) => new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), V(s, s, s));
let _M: Mats | null = null;
export const KM = () => (_M ??= mats());

// ---------------- ground ----------------
const groundTex = (key: string, base: string, speck: string[]) => ctex("og_" + key, 1024, 1024, (g, r) => {
  g.fillStyle = base; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 900; i++) { g.fillStyle = speck[i % speck.length]; g.globalAlpha = 0.18 + 0.25 * r(); const x = r() * 1024, y = r() * 1024, s = 4 + r() * 26; g.beginPath(); g.ellipse(x, y, s, s * 0.6, r() * 3, 0, 7); g.fill(); }
  g.globalAlpha = 1;
});
export const GROUND: Record<string, () => THREE.Material> = {
  earth: () => lam("ogEarth", () => ({ map: rep(groundTex("earth", "#c98a5a", ["#b27447", "#dba06c", "#a86a40", "#e3b07a"]), 14, 14) })),
  sand: () => lam("ogSand", () => ({ map: rep(groundTex("sand", "#e2c48e", ["#d4b27a", "#ecd4a2", "#c9a46c"]), 14, 14) })),
  dry: () => lam("dryGround", () => ({ map: dryGroundHD() })),
  cobble: () => lam("ogCobble", () => ({ map: rep(cobble(), 70, 70) })),
  grass: () => lam("ogGrass", () => ({ map: rep(groundTex("grass", "#7fae58", ["#6a9a48", "#94bf68", "#5e8a40", "#a8c870"]), 16, 16) })),
};
export function ground(b: Batch, mat: THREE.Material, w = 140, d = 90) { b.add(quadUV(V(-w / 2, 0, d / 3), V(w / 2, 0, d / 3), V(w / 2, 0, -d), V(-w / 2, 0, -d)), mat); }

// ---------------- buildings ----------------
/** flat-roofed plaster house (India, Persia, Arabia): facade texture, parapet, optional dome and arched door */
export function flatHouse(b: Batch, x: number, z: number, w: number, d: number, h: number, wall: string, shutter: string, o: { dome?: string; ry?: number; awning?: string } = {}) {
  const m = M4(x, 0, z, o.ry ?? 0), key = `fh${wall}${shutter}${w}${h}`;
  const front = lam("ofr" + key, () => ({ map: facadeHD("o" + key, w, h, { wall, shutter, door: true }) }));
  const side = lam("osd" + key, () => ({ map: facadeHD("os" + key, d, h, { wall, shutter }) }));
  const hw = w / 2, hd = d / 2;
  b.add(quadUV(V(-hw, 0, hd), V(hw, 0, hd), V(hw, h, hd), V(-hw, h, hd)), front, m);
  b.add(quadUV(V(-hw, 0, -hd), V(-hw, 0, hd), V(-hw, h, hd), V(-hw, h, -hd)), side, m);
  b.add(quadUV(V(hw, 0, hd), V(hw, 0, -hd), V(hw, h, -hd), V(hw, h, hd)), side, m);
  const wm = lam("owall" + wall, () => ({ color: wall }));
  b.add(boxGeo(V(-hw - 0.15, h, -hd - 0.15), V(hw + 0.15, h + 0.35, hd + 0.15)), wm, m); // parapet / roof slab
  if (o.dome) { const g = new THREE.SphereGeometry(Math.min(w, d) * 0.34, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2); g.scale(1, 1.2, 1); b.add(g, lam("odome" + o.dome, () => ({ color: o.dome })), m.clone().multiply(M4(0, h + 0.35, 0))); }
  if (o.awning) awning(b, -hw * 0.7, hw * 0.7, h * 0.42, hd, 1.1, o.awning, m);
}
/** gabled European house (Portugal, Europe, the Dutch canal: steep and narrow), facade texture + tiled roof */
export function gableHouse(b: Batch, x: number, z: number, w: number, d: number, h: number, wall: string, shutter: string, roof: string, o: { timber?: boolean; steep?: number; ry?: number; brick?: boolean } = {}) {
  const m = M4(x, 0, z, o.ry ?? 0), key = `gh${wall}${shutter}${w}${h}${o.timber ? 1 : 0}${o.brick ? 1 : 0}`;
  const front = lam("ofr" + key, () => ({ map: facadeHD("o" + key, w, h, { wall, shutter, door: true, timber: o.timber, brick: o.brick }) }));
  const side = lam("osd" + key, () => ({ map: facadeHD("os" + key, d, h, { wall, shutter, timber: o.timber, brick: o.brick }) }));
  const wm = lam("owall" + wall + (o.brick ? "b" : ""), () => ({ color: o.brick ? "#b8573a" : wall })), hw = w / 2, hd = d / 2, rh = w * (o.steep ?? 0.45), ov = 0.3;
  // gable faces the street (+z): front and back walls get the triangle, the ridge runs along z
  b.add(quadUV(V(-hw, 0, hd), V(hw, 0, hd), V(hw, h, hd), V(-hw, h, hd)), front, m);
  b.add(quadUV(V(-hw, 0, -hd), V(-hw, 0, hd), V(-hw, h, hd), V(-hw, h, -hd)), side, m);
  b.add(quadUV(V(hw, 0, hd), V(hw, 0, -hd), V(hw, h, -hd), V(hw, h, hd)), side, m);
  const tri = (zz: number) => { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute([-hw, h, zz, hw, h, zz, 0, h + rh, zz], 3)); g.computeVertexNormals(); return g; };
  b.add(tri(hd), wm, m);
  const rm = lam("oroof" + roof, () => ({ map: roofHD(roof), side: THREE.DoubleSide }));
  b.add(quadUV(V(-hw - ov, h - 0.2, hd + ov), V(-hw - ov, h - 0.2, -hd - ov), V(0, h + rh + 0.05, -hd - ov), V(0, h + rh + 0.05, hd + ov), 0, 0, d / 2, rh / 1.6), rm, m);
  b.add(quadUV(V(hw + ov, h - 0.2, -hd - ov), V(hw + ov, h - 0.2, hd + ov), V(0, h + rh + 0.05, hd + ov), V(0, h + rh + 0.05, -hd - ov), 0, 0, d / 2, rh / 1.6), rm, m);
}
/** Dutch stepped gable on top of a narrow brick house */
export function dutchHouse(b: Batch, x: number, z: number, w: number, h: number, wall: string, shutter: string) {
  gableHouse(b, x, z, w, 7, h, wall, shutter, "#5a4a52", { brick: true, steep: 0.9 });
  const m = M4(x, 0, z), wm = lam("dutchStep", () => ({ color: "#b8573a" })), tr = lam("dutchTrim", () => ({ color: "#f1ead6" }));
  const steps = 4, sw = w / 2, sh = (w * 0.9) / steps;
  for (let i = 0; i < steps; i++) { const ww = sw * (1 - i / steps); b.add(boxGeo(V(-ww, h + i * sh, 3.5), V(ww, h + (i + 1) * sh, 3.72)), wm, m); b.add(boxGeo(V(-ww - 0.06, h + (i + 1) * sh - 0.08, 3.5), V(ww + 0.06, h + (i + 1) * sh, 3.8)), tr, m); }
}
/** Chinese port house: red walls, dark green roof with upturned eave ends, lanterns */
export function chinaHouse(b: Batch, x: number, z: number, w: number, d: number, h: number) {
  flatHouse(b, x, z, w, d, h, "#c0473a", "#2f5a3a");
  const m = M4(x, 0, z), rm = lam("oroofJade", () => ({ map: roofHD("#3f6a52"), side: THREE.DoubleSide })), hw = w / 2 + 0.7, hd = d / 2 + 0.7, y0 = h + 0.3;
  b.add(quadUV(V(-hw, y0, hd), V(hw, y0, hd), V(hw * 0.55, y0 + 1.6, 0), V(-hw * 0.55, y0 + 1.6, 0), 0, 0, w / 2, 1), rm, m);
  b.add(quadUV(V(hw, y0, -hd), V(-hw, y0, -hd), V(-hw * 0.55, y0 + 1.6, 0), V(hw * 0.55, y0 + 1.6, 0), 0, 0, w / 2, 1), rm, m);
  for (const s of [-1, 1]) b.add(limb([V(s * hw * 0.95, y0 + 0.05, hd), V(s * (hw + 0.4), y0 + 0.5, hd + 0.3)], [0.12, 0.06], 6), rm, m); // upturned eave ends
  const lan = lam("lantern", () => ({ color: "#d9382c" }));
  for (const s of [-0.3, 0.3]) { b.add(new THREE.SphereGeometry(0.28, 14, 10).scale(1, 1.25, 1), lan, m.clone().multiply(M4(s * w, h * 0.62, d / 2 + 0.45))); b.add(limb([V(s * w, h * 0.62 + 0.35, d / 2 + 0.45), V(s * w, h * 0.62 + 0.75, d / 2 + 0.2)], [0.02, 0.02], 4), lam("rope", () => ({ color: "#4a3426" })), m); }
}
/** striped canvas awning on two poles */
export const stripeTex = (a: string, c: string) => ctex("stripe" + a + c, 256, 256, (g) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? c : a; g.fillRect(i * 32, 0, 32, 256); } g.fillStyle = "rgba(0,0,0,0.08)"; g.fillRect(0, 230, 256, 26); });
export function awning(b: Batch, x0: number, x1: number, y: number, z: number, dep: number, cols: string, m = new THREE.Matrix4()) {
  const [a, c] = cols.split("/"), mat = lam("awn" + cols, () => ({ map: stripeTex(a, c), side: THREE.DoubleSide }));
  b.add(quadUV(V(x0, y + 0.6, z), V(x1, y + 0.6, z), V(x1, y, z + dep), V(x0, y, z + dep), 0, 0, (x1 - x0) / 1.2, 1), mat, m);
  const pole = lam("awnPole", () => ({ color: "#6b4a30" }));
  for (const x of [x0 + 0.1, x1 - 0.1]) b.add(boxGeo(V(x - 0.04, 0, z + dep - 0.06), V(x + 0.04, y, z + dep + 0.02)), pole, m);
}
/** market stall: wooden table, striped awning, crates; returns the table-top centre (world) for fruit piles */
export function stall(b: Batch, x: number, z: number, w: number, cols: string, ry = 0): THREE.Vector3 {
  const m = M4(x, 0, z, ry), wood = lam("stallWood", () => ({ map: grainWood("stall", "#9a6a3e", 4) })), y = 0.92, hw = w / 2;
  b.add(boxGeo(V(-hw, y - 0.08, -0.45), V(hw, y, 0.45)), wood, m);
  b.add(boxGeo(V(-hw, 0.15, 0.38), V(hw, y - 0.08, 0.45)), wood, m);
  for (const sx of [-hw + 0.08, hw - 0.08]) for (const sz of [-0.4, 0.4]) b.add(boxGeo(V(sx - 0.05, 0, sz - 0.05), V(sx + 0.05, y, sz + 0.05)), wood, m);
  const [a, c] = cols.split("/"), mat = lam("awn" + cols, () => ({ map: stripeTex(a, c), side: THREE.DoubleSide }));
  b.add(quadUV(V(-hw - 0.2, 2.45, -0.6), V(hw + 0.2, 2.45, -0.6), V(hw + 0.2, 2.15, 0.85), V(-hw - 0.2, 2.15, 0.85), 0, 0, w / 1.2, 1), mat, m);
  for (const sx of [-hw, hw]) for (const sz of [-0.55, 0.8]) b.add(boxGeo(V(sx - 0.04, 0, sz - 0.04), V(sx + 0.04, sz < 0 ? 2.45 : 2.15, sz + 0.04)), wood, m);
  return V(x, y, z).applyMatrix4(new THREE.Matrix4().makeRotationY(0));
}
/** a pile of oranges (cone of spheres) at p; returns the mesh so it can grow */
const ORANGE_G = new THREE.SphereGeometry(0.075, 12, 9);
export const orangeMat = () => lam("orangeFruit", () => ({ color: "#f2861e" }));
export function orangePile(parent: THREE.Object3D, p: THREE.Vector3, n: number, rad: number, seed: number) {
  const r = rng(seed), b = new Batch();
  for (let i = 0; i < n; i++) { const a = r() * 6.283, d = Math.sqrt(r()) * rad, hgt = (1 - d / rad) * rad * 0.7; b.add(ORANGE_G, orangeMat(), M4(Math.cos(a) * d, 0.07 + hgt + r() * 0.03, Math.sin(a) * d * 0.6, r() * 3, 0.85 + 0.3 * r())); }
  const g = new THREE.Group(); g.position.copy(p); b.build(g); parent.add(g); return g; // local to its own centre, so it can grow
}
/** crate of oranges, optional stencil texture on the front */
export function crate(b: Batch, x: number, z: number, w: number, h: number, d: number, label?: THREE.Material, ry = 0) {
  const m = M4(x, 0, z, ry), wood = lam("crateWood", () => ({ map: grainWood("crate", "#b98a52", 3) }));
  b.add(boxGeo(V(-w / 2, 0, -d / 2), V(w / 2, h, d / 2)), wood, m);
  if (label) b.add(quadUV(V(-w / 2 + 0.03, 0.05, d / 2 + 0.006), V(w / 2 - 0.03, 0.05, d / 2 + 0.006), V(w / 2 - 0.03, h - 0.05, d / 2 + 0.006), V(-w / 2 + 0.03, h - 0.05, d / 2 + 0.006)), label, m);
}
/** orange tree: short trunk, round crown of foliage lumps, oranges dotted on the crown */
export function orangeTree(b: Batch, x: number, z: number, s: number, seed: number) {
  const M = KM(), r = rng(seed);
  b.add(limb([V(x, -0.1, z), V(x + 0.1 * s, 1.0 * s, z), V(x - 0.05 * s, 1.6 * s, z)], [0.16 * s, 0.12 * s, 0.09 * s], 8, 1, 8), M.bark);
  const lumps: THREE.Vector3[] = [];
  for (let i = 0; i < 6; i++) { const a = (i / 6) * 6.283 + r(), c = V(x + Math.cos(a) * 0.7 * s, (2.1 + 0.4 * r()) * s, z + Math.sin(a) * 0.6 * s); lumps.push(c); b.add(rock(seed * 31 + i, 0.95 * s, 0.8 * s, 0.9 * s, 0.95, 3, 0.12), M.leaf[i % 2], M4(c.x, c.y, c.z, r() * 3)); }
  b.add(rock(seed * 31 + 9, 1.2 * s, 0.9 * s, 1.1 * s, 0.95, 3, 0.12), M.leaf[0], M4(x, 2.7 * s, z));
  for (let i = 0; i < 16; i++) { const a = r() * 6.283, e = (r() - 0.3) * 1.2, R = 1.25 * s; b.add(ORANGE_G, orangeMat(), M4(x + Math.cos(a) * Math.cos(e) * R, 2.35 * s + Math.sin(e) * R * 0.8, z + Math.sin(a) * Math.cos(e) * R * 0.9, 0, 1.4 * s)); }
}
export { palm };

// ---------------- the hanging NAME SIGN ----------------
/** sign board texture: monospaced capitals on a painted board (slot i at x = 0.5 + (i - (n-1)/2) * adv), so letters can move */
const SIGN_W = 1400, SIGN_H = 420;
export const signAdv = (n: number) => Math.min(150, 1240 / Math.max(1, n));
export const signTex = (text: string, o: { board?: string; ink?: string; skip?: number[]; blur?: number; small?: string } = {}) =>
  ctex(`sign|${text}|${o.board ?? ""}|${(o.skip ?? []).join(",")}|${o.blur ?? 0}|${o.small ?? ""}`, SIGN_W, SIGN_H, (g) => drawSign(new Pen(g), text, o));
export const drawSign = (p: Pen, text: string, o: { board?: string; ink?: string; skip?: number[]; blur?: number; small?: string } = {}) => {
  const g = p.g, board = o.board ?? "#f3e2b8";
  g.fillStyle = INK; g.beginPath(); g.roundRect(6, 6, SIGN_W - 12, SIGN_H - 12, 36); g.fill();
  g.fillStyle = board; g.beginPath(); g.roundRect(22, 22, SIGN_W - 44, SIGN_H - 44, 26); g.fill();
  g.fillStyle = "rgba(120,80,40,0.12)"; for (let i = 0; i < 7; i++) g.fillRect(22, 40 + i * 52, SIGN_W - 44, 6);
  g.strokeStyle = "rgba(120,80,40,0.55)"; g.lineWidth = 8; g.beginPath(); g.roundRect(44, 44, SIGN_W - 88, SIGN_H - 88, 18); g.stroke();
  const n = text.length, adv = signAdv(n), px = Math.min(230, adv * 1.45);
  if (o.blur) g.filter = `blur(${o.blur}px)`;
  g.font = `900 ${o.small ? px * 0.85 : px}px 'DejaVu Serif', serif`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = o.ink ?? "#b8401e";
  const y = o.small ? SIGN_H * 0.42 : SIGN_H * 0.54;
  for (let i = 0; i < n; i++) if (!(o.skip ?? []).includes(i) && text[i] !== " ") { g.lineWidth = 10; g.strokeStyle = "rgba(255,250,235,0.9)"; g.strokeText(text[i], SIGN_W / 2 + (i - (n - 1) / 2) * adv, y); g.fillText(text[i], SIGN_W / 2 + (i - (n - 1) / 2) * adv, y); }
  if (o.small) { g.font = `700 ${68}px 'DejaVu Serif', serif`; g.fillStyle = "#4a3426"; g.fillText(o.small, SIGN_W / 2, SIGN_H * 0.8); }
  g.filter = "none";
};
/** one letter on a transparent card (the N that falls off) */
export const letterDraw = (ch: string, n: number) => (p: Pen) => { const g = p.g, px = Math.min(230, signAdv(n) * 1.45); g.font = `900 ${px}px 'DejaVu Serif', serif`; g.textAlign = "center"; g.textBaseline = "middle"; g.lineWidth = 10; g.strokeStyle = "rgba(255,250,235,0.95)"; g.strokeText(ch, 128, 128); g.fillStyle = "#b8401e"; g.fillText(ch, 128, 128); };
export type Sign = { g: THREE.Group; board: THREE.Mesh; set: (tex: THREE.Texture) => void; w: number; h: number };
/** a wooden gallows post with the board hanging from two short chains; w = board width in metres */
export function hangingSign(parent: THREE.Object3D, x: number, z: number, w: number, y = 2.55, ry = 0, post = true): Sign {
  const G = new THREE.Group(); G.position.set(x, 0, z); G.rotation.y = ry; parent.add(G);
  const b = new Batch(), wood = lam("signPost", () => ({ map: grainWood("post", "#7a5232", 3) })), iron = lam("signIron", () => ({ color: "#3a3440" }));
  const h = (w * SIGN_H) / SIGN_W, top = y + h / 2 + 0.45;
  if (post) { b.add(boxGeo(V(-w / 2 - 0.45, 0, -0.07), V(-w / 2 - 0.31, top + 0.15, 0.07)), wood); b.add(boxGeo(V(-w / 2 - 0.45, top, -0.06), V(w / 2 + 0.2, top + 0.13, 0.06)), wood);
    b.add(limb([V(-w / 2 - 0.38, top - 0.55, 0), V(-w / 2 + 0.1, top + 0.02, 0)], [0.04, 0.04], 5), wood); }
  b.build(G);
  const S = new THREE.Group(); S.position.set(0, top, 0); G.add(S); // swings about the bar
  const cb = new Batch(); for (const sx of [-w * 0.38, w * 0.38]) cb.add(limb([V(sx, 0, 0), V(sx, -0.45, 0)], [0.018, 0.018], 4), iron); cb.build(S);
  const mat = new THREE.MeshBasicMaterial({ map: signTex("") }), board = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  board.position.set(0, -0.45 - h / 2, 0.01); board.layers.set(NOINK); S.add(board);
  const back = new THREE.Mesh(new THREE.BoxGeometry(w * 0.99, h * 0.99, 0.05), lam("signBack", () => ({ color: "#7a5232" }))); back.position.set(0, -0.45 - h / 2, -0.03); S.add(back);
  return { g: S, board, w, h, set: (t) => { if (mat.map !== t) { mat.map = t; mat.needsUpdate = true; } } };
}

// ---------------- ships and sea ----------------
/** day sea: vertex-gradient water (deep near, pale at the horizon), soft swell lines; local y = 0 */
export function daySea(parent: THREE.Object3D, z0: number, near: string, far: string, len = 1400) {
  const dg = new THREE.PlaneGeometry(3000, len, 1, 60); dg.rotateX(-Math.PI / 2); dg.translate(0, 0, z0 - len / 2);
  const pos = dg.attributes.position as THREE.BufferAttribute, col: number[] = [], cN = new THREE.Color(near), cF = new THREE.Color(far), t = new THREE.Color();
  for (let i = 0; i < pos.count; i++) { const k = Math.min(1, Math.max(0, (z0 - pos.getZ(i)) / 500)) ** 0.6; t.copy(cN).lerp(cF, k); untone("#" + t.getHexString(), t); col.push(t.r, t.g, t.b); }
  dg.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  const sea = new THREE.Mesh(dg, new THREE.MeshBasicMaterial({ vertexColors: true, fog: false })); sea.layers.set(NOINK); parent.add(sea);
  const swT = ctex("swellDay", 512, 512, (g, r) => { g.clearRect(0, 0, 512, 512); g.lineCap = "round"; for (let i = 0; i < 46; i++) { const x = r() * 512, y = r() * 512, w = 50 + r() * 120; g.strokeStyle = `rgba(255,255,255,${0.16 + 0.18 * r()})`; g.lineWidth = 2 + r() * 2.5; for (const [dx, dy] of [[0, 0], [-512, 0], [512, 0], [0, -512], [0, 512]]) { g.beginPath(); g.moveTo(x + dx - w / 2, y + dy); g.quadraticCurveTo(x + dx, y + dy - 6, x + dx + w / 2, y + dy); g.stroke(); } } });
  swT.wrapS = swT.wrapT = THREE.RepeatWrapping; swT.repeat.set(160, 70); swT.anisotropy = 16;
  const sg = new THREE.PlaneGeometry(3000, len); sg.rotateX(-Math.PI / 2); sg.translate(0, 0.02, z0 - len / 2);
  const sw = new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ map: swT, transparent: true, depthWrite: false, fog: false })); sw.layers.set(NOINK); sw.renderOrder = 2; parent.add(sw);
  return { sea, swell: swT };
}
const sailTex = () => ctex("caravelSail", 512, 512, (g) => {
  g.fillStyle = "#f3ead2"; g.fillRect(0, 0, 512, 512); g.fillStyle = "rgba(160,130,90,0.18)"; for (let i = 0; i < 6; i++) g.fillRect(i * 86, 0, 6, 512);
  g.fillStyle = "#c2352c"; g.fillRect(226, 120, 60, 280); g.fillRect(140, 210, 232, 60); // the red cross of the Order of Christ, simplified
});
/** a 15th/16th-century caravel: hull, raised stern castle, two masts with square sails (red cross), bowsprit, rigging */
export function caravel(parent: THREE.Object3D, s = 1): THREE.Group {
  const G = new THREE.Group(); parent.add(G); const b = new Batch(), sb = new Batch();
  const hull = lam("hullWood", () => ({ map: grainWood("hull", "#7a4a2a", 6) })), dark = lam("hullDark", () => ({ color: "#3a2a24" })), deck = lam("deckWood", () => ({ map: grainWood("deck", "#b88a5a", 6) }));
  const L = 14 * s, Wd = 4.2 * s, H = 2.4 * s, sh = new THREE.Shape();
  sh.moveTo(-L / 2, -Wd * 0.38); sh.quadraticCurveTo(-L / 2 - 0.3 * s, 0, -L / 2, Wd * 0.38); sh.lineTo(L * 0.18, Wd / 2); sh.quadraticCurveTo(L * 0.45, Wd * 0.3, L / 2 + 0.6 * s, 0); sh.quadraticCurveTo(L * 0.45, -Wd * 0.3, L * 0.18, -Wd / 2); sh.closePath();
  const g = new THREE.ExtrudeGeometry(sh, { depth: H, bevelEnabled: false, curveSegments: 8 }); g.rotateX(-Math.PI / 2); g.translate(0, -0.9 * s, 0);
  b.add(g, hull); b.add(boxGeo(V(-L / 2 + 0.2, H - 0.9 * s, -Wd * 0.36), V(L * 0.3, H - 0.82 * s, Wd * 0.36)), deck);
  b.add(boxGeo(V(-L / 2, H - 0.9 * s, -Wd * 0.4), V(-L * 0.22, H + 0.6 * s, Wd * 0.4)), hull); // stern castle
  b.add(boxGeo(V(-L / 2 - 0.05, H + 0.6 * s, -Wd * 0.42), V(-L * 0.2, H + 0.72 * s, Wd * 0.42)), dark);
  b.add(boxGeo(V(-L / 2, -0.95 * s, -Wd * 0.3), V(L * 0.35, -0.6 * s, Wd * 0.3)), dark); // waterline band
  b.add(limb([V(L * 0.42, H - 0.6 * s, 0), V(L / 2 + 2.4 * s, H + 0.6 * s, 0)], [0.09 * s, 0.06 * s], 6), dark);
  const masts: [number, number, number][] = [[L * 0.08, 9.5 * s, 4.4 * s], [-L * 0.22, 7.6 * s, 3.4 * s]];
  const sail = lam("sail", () => ({ map: sailTex(), side: THREE.DoubleSide }));
  for (const [mx, mh, sw] of masts) {
    b.add(limb([V(mx, H - 0.9 * s, 0), V(mx, H + mh, 0)], [0.14 * s, 0.09 * s], 8), dark);
    b.add(limb([V(mx, H + mh * 0.78, -sw / 2 - 0.2), V(mx, H + mh * 0.78, sw / 2 + 0.2)], [0.06 * s, 0.06 * s], 6), dark);
    // bellied square sail: a curved quad grid
    const N = 6, top = H + mh * 0.78, bot = H + mh * 0.28, parts: THREE.BufferGeometry[] = [];
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const P = (u: number, v: number) => V(mx + 0.9 * s * Math.sin(Math.PI * u) * Math.sin(Math.PI * Math.min(1, v * 1.1)), top - (top - bot) * v, (u - 0.5) * sw);
      parts.push(quadUV(P(i / N, j / N), P((i + 1) / N, j / N), P((i + 1) / N, (j + 1) / N), P(i / N, (j + 1) / N), i / N, 1 - j / N, (i + 1) / N, 1 - (j + 1) / N));
    }
    for (const p of parts) sb.add(p, sail);
    for (const sz of [-1, 1]) b.add(limb([V(mx, H + mh, 0), V(mx - 3.5 * s, H - 0.6 * s, sz * Wd * 0.45)], [0.02 * s, 0.02 * s], 4), dark);
  }
  b.add(limb([V(L * 0.08, H + 9.5 * s, 0), V(L / 2 + 2.4 * s, H + 0.6 * s, 0)], [0.02 * s, 0.02 * s], 4), dark);
  b.add(limb([V(-L * 0.45, H + 0.7 * s, 0), V(-L * 0.45, H + 3.2 * s, 0)], [0.04 * s, 0.03 * s], 5), dark);
  const flag = lam("pennant", () => ({ color: "#c2352c", side: THREE.DoubleSide })); b.add(quadUV(V(L * 0.08, H + 9.5 * s, 0), V(L * 0.08 - 1.6 * s, H + 9.3 * s, 0), V(L * 0.08 - 1.6 * s, H + 9.1 * s, 0), V(L * 0.08, H + 9.0 * s, 0)), flag);
  b.build(G); sb.build(G, false);
  return G;
}
/** wooden quay / pier deck along x at z, with posts into the water (water level y = -0.9) */
export function quay(b: Batch, x0: number, x1: number, z0: number, z1: number) {
  const wood = lam("quayWood", () => ({ map: grainWood("quay", "#8a6a4a", 8) })), stoneM = lam("quayStone", () => ({ color: "#a39a8c" }));
  b.add(boxGeo(V(x0, -0.9, z1), V(x1, 0, z0)), stoneM);
  b.add(boxGeo(V(x0, -0.02, z1 + 0.02), V(x1, 0.02, z0 - 0.02)), wood);
  for (let x = x0 + 1; x < x1; x += 3) b.add(new THREE.CylinderGeometry(0.15, 0.18, 0.7, 10), lam("bollard", () => ({ color: "#3a3440" })), M4(x, 0.35, z1 + 0.3));
}
/** painted backdrop hill / far land as a lumpy half-dome */
export function hill(b: Batch, x: number, z: number, sx: number, sy: number, sz: number, col: string, seed: number) {
  const g = new THREE.SphereGeometry(1, 28, 10, 0, Math.PI * 2, 0, Math.PI / 2), p = g.attributes.position as THREE.BufferAttribute, rr = rng(seed), ph = [rr() * 6, rr() * 6];
  for (let i = 0; i < p.count; i++) { const X = p.getX(i), Y = p.getY(i), Z = p.getZ(i), k = 1 + 0.18 * Math.sin(4 * X + ph[0]) * Math.cos(3 * Z + ph[1]); p.setXYZ(i, X * sx, Math.pow(Y, 0.8) * sy * k, Z * sz); }
  g.computeVertexNormals(); b.add(g, lam("hill" + col, () => ({ color: col })), M4(x, -0.1, z));
}
/** Sintra-style palace on a hill: a cluster of coloured towers with domes and battlements */
export function palace(b: Batch, x: number, y: number, z: number, s: number) {
  const red = lam("palRed", () => ({ color: "#c9483c" })), yel = lam("palYel", () => ({ color: "#e8b93e" })), grey = lam("palGrey", () => ({ color: "#b7b4c4" })), whi = lam("palWhite", () => ({ color: "#efe7d6" }));
  const tower = (dx: number, dz: number, r: number, h: number, m: THREE.Material, top: THREE.Material) => {
    b.add(new THREE.CylinderGeometry(r, r * 1.05, h, 16), m, M4(x + dx * s, y + h / 2, z + dz * s));
    const d = new THREE.SphereGeometry(r * 1.05, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2); d.scale(1, 1.3, 1); b.add(d, top, M4(x + dx * s, y + h, z + dz * s));
    for (let i = 0; i < 10; i++) { const a = (i / 10) * 6.283; b.add(boxGeo(V(-0.12, 0, -0.12), V(0.12, 0.3, 0.12)), m, M4(x + dx * s + Math.cos(a) * r, y + h - 0.05, z + dz * s + Math.sin(a) * r)); }
  };
  const fac = lam("palFac", () => ({ map: facadeHD("palace", 12, 5, { wall: "#e8b93e", shutter: "#8c3b4a" }) })), fac2 = lam("palFac2", () => ({ map: facadeHD("palace2", 8, 7, { wall: "#c9483c", shutter: "#2f5ea8" }) }));
  b.add(quadUV(V(-6 * s, 0, 2.5 * s), V(6 * s, 0, 2.5 * s), V(6 * s, 5 * s, 2.5 * s), V(-6 * s, 5 * s, 2.5 * s)), fac, M4(x, y, z)); b.add(boxGeo(V(-6 * s, 0, -2.5 * s), V(6 * s, 5 * s, 2.49 * s)), yel, M4(x, y, z));
  for (let i = 0; i < 14; i++) b.add(boxGeo(V(-0.25, 0, -0.25), V(0.25, 0.6, 0.25)), yel, M4(x - 6 * s + (i + 0.5) * (12 * s / 14), y + 5 * s, z + 2.5 * s));
  b.add(quadUV(V(1.5 * s, 5 * s, 1.5 * s), V(5.5 * s, 5 * s, 1.5 * s), V(5.5 * s, 12 * s, 1.5 * s), V(1.5 * s, 12 * s, 1.5 * s)), fac2, M4(x, y, z)); b.add(boxGeo(V(1.5 * s, 5 * s, -2 * s), V(5.5 * s, 12 * s, 1.49 * s)), red, M4(x, y, z));
  tower(-4.8, 0.5, 2.0 * s, 9 * s, red, grey); tower(-1.2, -0.5, 1.5 * s, 7.5 * s, whi, red); tower(6.6, 0, 1.7 * s, 10.5 * s, yel, red);
}
/** camel on a card: simple cartoon silhouette, side view, 600 x 500 */
export const camelDraw = (step: number) => (p: Pen) => {
  const c = "#c99a5e", d = "#a8783e", k = step % 2 ? 1 : -1;
  for (const [x, ph] of [[175, 1], [215, -1], [390, -1], [430, 1]] as const) p.stroke([[x, 330], [x + 8 * k * ph, 410], [x + 4 * k * ph, 470]], 16, d);
  p.poly([[140, 300], [170, 210], [230, 170], [270, 210], [320, 160], [380, 175], [440, 230], [450, 300], [400, 350], [170, 350]], c, 9);
  p.stroke([[440, 250], [500, 170], [512, 110]], 30, c); p.ell(532, 105, 42, 26, c, 8, 0, 360, -10); p.dot(545, 96, 6); p.stroke([[150, 290], [120, 330]], 8, d);
  p.poly([[250, 175], [330, 150], [360, 180], [280, 205]], "#c2352c", 6); // saddle blanket
  for (let i = 0; i < 3; i++) p.ell(275 + i * 26, 150, 14, 12, "#f2861e", 4); // a few oranges in the saddle bag
};
export const swatchDraw = (k: number) => (p: Pen) => { p.poly([[20, 20], [380, 20], [380, 480], [20, 480]], "#f6efdc", 10); if (k > 0) { const g = p.g; g.fillStyle = "#f2861e"; g.beginPath(); g.ellipse(200, 250, 150 * k, 170 * k, -0.2, 0, 7); g.fill(); } };
export const paintPot = (p: Pen) => { p.poly([[60, 120], [240, 120], [220, 280], [80, 280]], "#8a6a4a", 9); p.ell(150, 120, 92, 26, "#f2861e", 8); };
export const appleDraw = (p: Pen) => { // a sweet orange labelled as "China's apple": a little red flag sticker with a yellow star
  p.ell(200, 220, 150, 140, "#f2861e", 10); p.g.fillStyle = "rgba(255,230,160,0.7)"; p.g.beginPath(); p.g.ellipse(150, 170, 40, 26, -0.6, 0, 7); p.g.fill();
  p.stroke([[200, 85], [215, 40]], 12, "#6b4a30"); p.poly([[215, 60], [300, 20], [270, 70]], "#4f8a3a", 7);
  p.poly([[230, 200], [330, 190], [334, 262], [234, 272]], "#d9382c", 6); const g = p.g; g.fillStyle = "#f7d33a"; g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 8 : 20; g.lineTo(262 + r * Math.cos(a), 222 + r * Math.sin(a)); } g.fill();
};
export const bubbleDraw = (text: string, w = 900) => (p: Pen) => {
  const g = p.g; g.fillStyle = "#ffffff"; g.strokeStyle = INK; g.lineWidth = 12; g.beginPath(); g.roundRect(20, 20, w - 40, 220, 90); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(w * 0.3, 236); g.lineTo(w * 0.22, 320); g.lineTo(w * 0.4, 236); g.fill(); g.beginPath(); g.moveTo(w * 0.3, 238); g.lineTo(w * 0.22, 320); g.lineTo(w * 0.4, 238); g.stroke();
  g.font = "italic 700 96px 'DejaVu Serif', serif"; g.fillStyle = "#4a2a20"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(text, w / 2, 132);
};
export const glowDraw = (p: Pen) => { const g = p.g, gr = g.createRadialGradient(128, 128, 4, 128, 128, 124); gr.addColorStop(0, "rgba(255,220,140,0.95)"); gr.addColorStop(0.4, "rgba(255,180,80,0.45)"); gr.addColorStop(1, "rgba(255,160,60,0)"); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); };
export const nailDraw = (p: Pen) => { p.stroke([[60, 40], [70, 200]], 18, "#7a7f8a"); p.ell(58, 40, 34, 12, "#9aa0aa", 6); };
export { KM as kitMats };
