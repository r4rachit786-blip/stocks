// The Niihau ranch set, all built from code: dry pasture with earth decals and the plane's furrow, dry-stone
// walls laid stone by stone, the fence the Zero went through (posts, rails, splinters), coconut palms, kiawe trees,
// a small plantation house with a lanai, tin roof, water tank and washing line, loose rocks, grass tufts, low hills,
// the shore and the sea. Everything is a two-tone Lambert material (kit lam()) with a painted texture (paintx.ts).
import * as THREE from "three";
import { Batch, lam, boxGeo } from "./build";
import { rep } from "./paint";
import { twoTone } from "./shade";
import { NOINK } from "./ink";
import { V, rad, rng, rock, limb, quadUV, beamGeo, mergeNI } from "./geo";
import { dryGroundHD, dirtHD, rockHD, woodHD, boardWall, tinHD, palmTrunk, frondTex, foliageHD, tuftTex, furrowTex, patchTex, macroTex, seaTex } from "./paintx";
import { PLANE_YAW } from "./story";

type R = () => number;
const U = (r: R, a: number, b: number) => a + (b - a) * r();
const M4 = (pos: THREE.Vector3, ry = 0, rx = 0, rz = 0, s = 1) =>
  new THREE.Matrix4().compose(pos, new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, "YXZ")), V(s, s, s));
const hi = <T extends THREE.MeshLambertMaterial>(m: T) => { if (m.map) { m.map.anisotropy = 16; m.map.needsUpdate = true; } return m; };

export const mats = () => ({
  ground: hi(lam("dryGround", () => ({ map: dryGroundHD() }))),
  dirt: hi(lam("dirt", () => ({ map: dirtHD() }))),
  rock: [lam("rockA", () => ({ map: rockHD("A", "#9a8e82") })), lam("rockB", () => ({ map: rockHD("B", "#7a6f6a") })), lam("rockC", () => ({ map: rockHD("C", "#b3a590") })), lam("rockD", () => ({ map: rockHD("D", "#8d7a66") }))],
  wood: hi(lam("fenceWood", () => ({ map: woodHD("fence", "#a98a66") }))),
  woodDark: lam("woodDark", () => ({ map: woodHD("dark", "#7d5f44") })),
  white: lam("paintWhite", () => ({ color: "#ece6d2" })),
  trim: lam("trimGreen", () => ({ color: "#4d7a5c" })),
  tin: lam("tinRoof", () => ({ map: tinHD("roof", "#a9523c"), side: THREE.DoubleSide })),
  tank: lam("tinTank", () => ({ map: tinHD("tank", "#a7b0b6") })),
  trunk: lam("palmTrunk", () => ({ map: palmTrunk() })),
  bark: lam("bark", () => ({ map: woodHD("bark", "#75604e") })),
  frond: [0, 1].map((v) => lam("frond" + v, () => ({ map: frondTex(v), alphaTest: 0.5, side: THREE.DoubleSide }))),
  leaf: [lam("kiaweA", () => ({ map: foliageHD("kiawe", "#6f8a4e", "150,172,96", "58,84,52") })), lam("kiaweB", () => ({ map: foliageHD("kiaweB", "#62803f", "138,164,88", "52,78,50") }))],
  nut: lam("coconut", () => ({ color: "#6f5a34" })),
  cloth: ["#e9e4d6", "#c8473c", "#3f6aa8", "#e7c35a"].map((c) => lam("cloth" + c, () => ({ color: c, side: THREE.DoubleSide }))),
  dark: lam("underHouse", () => ({ color: "#4a3f44" })),
});
export type Mats = ReturnType<typeof mats>;
const decal = (key: string, map: THREE.Texture, opacity = 1) => lam("decal" + key, () => ({ map, transparent: true, opacity, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));

// ---------------- ground, shore, hills ----------------
export function buildGround(R: THREE.Object3D, M: Mats) {
  const b = new Batch();
  b.add(quadUV(V(-700, 0, 90), V(700, 0, 90), V(700, 0, -100), V(-700, 0, -100), 0, 0, 1400 / 6, 190 / 6), M.ground);
  // low bluff down to the beach
  b.add(quadUV(V(-700, -9, -99), V(700, -9, -99), V(700, 0, -100), V(-700, 0, -100), 0, 0, 500, 4), M.rock[1]);
  // low dry hills left and right of the field (Niihau's plateau), the pasture texture stretched over them
  const hillM = lam("hill", () => ({ map: rep(dryGroundHD(), 10, 5), color: "#e9d2b0" }));
  for (const [x, z, sx, sy, sz, seed] of [[-150, -92, 120, 22, 30, 3], [-52, -97, 36, 8.5, 9, 5], [190, -98, 120, 17, 26, 8]] as const) {
    const g = new THREE.SphereGeometry(1, 40, 14, 0, Math.PI * 2, 0, Math.PI / 2), p = g.attributes.position as THREE.BufferAttribute, r = rng(seed);
    const ph = [r() * 6, r() * 6, r() * 6];
    for (let i = 0; i < p.count; i++) {
      const X = p.getX(i), Y = p.getY(i), Z = p.getZ(i), k = 1 + 0.16 * Math.sin(3 * X + ph[0]) * Math.cos(2.2 * Z + ph[1]) + 0.1 * Math.sin(5 * X + ph[2]);
      p.setXYZ(i, X * sx, Math.pow(Y, 0.8) * sy * k, Z * sz);
    }
    g.computeVertexNormals();
    b.add(g, hillM, new THREE.Matrix4().makeTranslation(x, -0.4, z));
  }
  b.build(R, false);
  // sea: unlit gradient sheet from the surf to the horizon (the fog carries it into the sky colour)
  const sea = new THREE.Mesh(quadUV(V(-1500, -9, -99), V(1500, -9, -99), V(1500, -9, -1450), V(-1500, -9, -1450), 0, 0, 14, 1),
    new THREE.MeshBasicMaterial({ map: (() => { const t = seaTex(); t.wrapS = THREE.RepeatWrapping; t.needsUpdate = true; return t; })(), color: new THREE.Color(0.86, 0.86, 0.86) }));
  sea.layers.set(NOINK);
  R.add(sea);

  // decals: very broad tone drift, bare-earth patches, the trodden path to the house, the plane's furrow
  const d = new Batch();
  d.add(quadUV(V(-180, 0.012, 60), V(180, 0.012, 60), V(180, 0.012, -99.5), V(-180, 0.012, -99.5), 0, 0, 4, 1.8), decal("macro", macroTex(), 0.75));
  const r = rng(41), P = [decal("patch0", patchTex(0)), decal("patch1", patchTex(1))];
  for (let i = 0; i < 70; i++) {
    const near = i < 22, x = near ? U(r, -7, 7) : U(r, -40, 40), z = near ? U(r, 2, 14) : U(r, -90, 16), w = near ? U(r, 0.8, 2.2) : U(r, 3, 9), h = w * U(r, 0.5, 0.9), a = U(r, 0, 3.1), c = Math.cos(a), s = Math.sin(a);
    const pt = (dx: number, dz: number) => V(x + dx * c - dz * s, 0.02 + i * 0.0004, z + dx * s + dz * c);
    d.add(quadUV(pt(-w, h), pt(w, h), pt(w, -h), pt(-w, -h), 0, 0, 1, 1, V(0, 1, 0)), P[i % 3 === 0 ? 0 : 1]);
  }
  // furrow: from far behind the tail up to the nose, along the fuselage axis
  const ya = rad(PLANE_YAW), nx = Math.cos(ya), nz = -Math.sin(ya), px = -nz, pz = nx;
  const F = (t: number, w: number) => V(nx * t + px * w, 0.035, nz * t + pz * w);
  d.add(quadUV(F(-24, 2.1), F(2.6, 2.1), F(2.6, -2.1), F(-24, -2.1), 0, 0, 1, 1, V(0, 1, 0)), decal("furrow", furrowTex()));
  d.build(R, false);
  return { n: V(nx, 0, nz), p: V(px, 0, pz) };
}

// ---------------- earth thrown up by the crash, loose stones ----------------
export function buildEarth(b: Batch, M: Mats, n: THREE.Vector3, p: THREE.Vector3) {
  const r = rng(77);
  const at = (t: number, w: number, y = 0) => V(n.x * t + p.x * w, y, n.z * t + p.z * w);
  // mound ploughed up round the nose and along the belly
  for (const [t, w, sx, sy, sz] of [[2.5, 0.2, 1.1, 0.42, 0.9], [2.0, -0.95, 0.9, 0.36, 0.7], [1.9, 0.95, 0.9, 0.3, 0.7], [0.9, 0.85, 1.0, 0.22, 0.5], [-0.2, 0.75, 0.9, 0.2, 0.45], [2.95, -0.5, 0.6, 0.25, 0.5], [3.0, 0.7, 0.55, 0.2, 0.45]])
    b.add(rock(Math.round(t * 31 + w * 17 + 200), sx, sy, sz, 0.85, 2, 0.2), M.dirt, M4(at(t, w, -0.04), U(r, 0, 3)));
  // ridges of turned earth along both lips of the furrow, clods
  for (let i = 0; i < 46; i++) {
    const t = U(r, -20, 0.5), side = r() < 0.5 ? -1 : 1, w = side * U(r, 1.0, 1.9) * (1 + Math.max(0, -t) * 0.012), s = U(r, 0.16, 0.5);
    b.add(rock(300 + i, s * U(r, 1, 1.9), s * 0.55, s, 0.8, 1, 0.22), M.dirt, M4(at(t, w, s * 0.1), U(r, 0, 3)));
  }
  for (let i = 0; i < 26; i++) { const s = U(r, 0.05, 0.13); b.add(rock(500 + i, s * 1.3, s, s, 0.8, 1, 0.2), M.dirt, M4(at(U(r, -6, 4.5), U(r, -3.2, 3.2), s * 0.5), U(r, 0, 3))); }
}
export function buildRocks(b: Batch, M: Mats) {
  const r = rng(13);
  const spots: [number, number, number][] = [[-3.6, 6.2, 0.36], [3.4, 7.4, 0.3], [4.6, 2.6, 0.5], [-5.2, 1.2, 0.42], [5.6, -3.5, 0.6], [-6.5, -6, 0.7], [2.2, -7.5, 0.4], [-1.5, -9, 0.35], [8, -12, 0.8], [-10, -14, 0.9],
    [3.2, 10.6, 0.22], [-0.2, 12.9, 0.2], [-2.9, 12.2, 0.26]];
  for (let i = 0; i < 40; i++) spots.push([U(r, -32, 32), U(r, -80, -12), U(r, 0.25, 1.0)]);
  spots.forEach(([x, z, s], i) => {
    b.add(rock(700 + i, s * U(r, 1, 1.5), s * U(r, 0.55, 0.8), s * U(r, 0.8, 1.1), 0.7, s > 0.45 ? 2 : 1, 0.16), M.rock[i % 4], M4(V(x, s * 0.28, z), U(r, 0, 3), U(r, -0.1, 0.1)));
    if (r() < 0.5) b.add(rock(900 + i, s * 0.45, s * 0.3, s * 0.4, 0.7, 1, 0.16), M.rock[(i + 1) % 4], M4(V(x + s * 1.2, s * 0.13, z + s * 0.5), U(r, 0, 3)));
  });
}

// ---------------- dry-stone wall, laid stone by stone ----------------
export function stoneWall(b: Batch, M: Mats, A: [number, number], B: [number, number], H: number, seed: number, o: { big?: number; gaps?: [number, number][]; tumble?: number } = {}) {
  const r = rng(seed), big = o.big ?? 1, dx = B[0] - A[0], dz = B[1] - A[1], L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L, yaw = Math.atan2(-uz, ux);
  const hC = 0.27 * big, courses = Math.max(2, Math.round(H / hC));
  let id = seed * 1000;
  for (let c = 0; c < courses; c++) {
    let t = -U(r, 0, 0.3) * big;
    const top = c === courses - 1;
    while (t < L) {
      const w = U(r, top ? 0.24 : 0.3, top ? 0.5 : 0.78) * big, dep = U(r, 0.44, 0.56) * big * (1 - 0.06 * c), hh = hC * U(r, top ? 0.7 : 0.95, top ? 1.3 : 1.14);
      const tc = t + w / 2;
      t += w * 0.96;
      if (o.gaps?.some(([g0, g1]) => tc > g0 && tc < g1)) continue;
      const off = U(r, -0.04, 0.04) * big;
      b.add(rock(id++, w * 0.54, hh * 0.56, dep * 0.5, 0.42, 1, 0.13), M.rock[Math.floor(r() * 4)],
        M4(V(A[0] + ux * tc - uz * off, c * hC + hh * 0.5 - 0.03, A[1] + uz * tc + ux * off), yaw + U(r, -0.14, 0.14), U(r, -0.07, 0.07), U(r, -0.08, 0.08)));
    }
  }
  // fallen stones at the foot
  for (let i = 0; i < (o.tumble ?? 0); i++) {
    const tc = U(r, 0, L), side = r() < 0.5 ? -1 : 1, off = side * U(r, 0.45, 1.1) * big, s = U(r, 0.14, 0.24) * big;
    b.add(rock(id++, s * 1.3, s * 0.8, s, 0.55, 1, 0.12), M.rock[Math.floor(r() * 4)], M4(V(A[0] + ux * tc - uz * off, s * 0.5, A[1] + uz * tc + ux * off), U(r, 0, 3), U(r, -0.3, 0.3)));
  }
}

// ---------------- fence: posts + two rails; the Zero went through it ----------------
export function buildFence(b: Batch, M: Mats, n: THREE.Vector3, p: THREE.Vector3) {
  const r = rng(5);
  // the line crosses the flight path 4.6 m behind the cockpit; bays of 2.4 m; a 6 m gap where the plane came through
  const C = V(n.x * -4.6, 0, n.z * -4.6), d = V(p.x * 0.96 + n.x * 0.28, 0, p.z * 0.96 + n.z * 0.28).normalize();
  const P = (s: number, y = 0) => C.clone().addScaledVector(d, s).add(V(0, y, 0));
  const post = (s: number, lean = 0, leanZ = 0, h = 1.3) => {
    const base = P(s), top = base.clone().add(V(Math.sin(lean) * h * d.x + Math.sin(leanZ) * h * n.x, Math.cos(lean) * h, Math.sin(lean) * h * d.z + Math.sin(leanZ) * h * n.z));
    b.add(beamGeo(base.clone().add(V(0, -0.1, 0)), top, 0.15, 0.15, 1, U(r, -0.2, 0.2)), M.wood);
    return top;
  };
  const rail = (a: THREE.Vector3, c: THREE.Vector3) => b.add(beamGeo(a, c, 0.13, 0.045, 1), M.wood);
  for (const side of [-1, 1]) {
    let prev: THREE.Vector3 | null = null;
    for (let k = 0; k < 16; k++) {
      const s = side * (3.0 + k * 2.4), lean = k === 0 ? -side * 0.32 : U(r, -0.05, 0.05);
      const top = post(s, lean, k === 0 ? 0.2 : U(r, -0.03, 0.03));
      if (prev) for (const hgt of [0.52, 0.98]) {
        const a = P(s - side * 2.4, hgt).add(prev.clone().sub(P(s - side * 2.4, 1.3)).multiplyScalar(hgt / 1.3)), c = P(s, hgt).add(top.clone().sub(P(s, 1.3)).multiplyScalar(hgt / 1.3));
        rail(a.addScaledVector(d, -side * 0.12), c.addScaledVector(d, side * 0.12));
      }
      prev = top;
    }
    // the broken bay: rails still nailed to the leaning end post, snapped and hanging toward the gap
    const e = P(side * 3.0);
    rail(e.clone().add(V(0, 0.95, 0)), e.clone().addScaledVector(d, -side * 1.5).addScaledVector(n, 0.5).add(V(0, 0.16, 0)));
    rail(e.clone().add(V(0, 0.5, 0)), e.clone().addScaledVector(d, -side * 1.2).addScaledVector(n, 0.9).add(V(0, 0.05, 0)));
  }
  // wreckage dragged along with the plane: posts and rails on the ground, one rail over the near wing, splinters
  const lay = (x: number, z: number, len: number, yaw: number, y = 0.05, pitch = 0, w = 0.13, h = 0.045) => {
    const dir = V(Math.cos(yaw) * Math.cos(pitch), Math.sin(pitch), Math.sin(yaw) * Math.cos(pitch)), a = V(x, y, z);
    b.add(beamGeo(a, a.clone().addScaledVector(dir, len), w, h, 1, U(r, -0.3, 0.3)), M.wood);
  };
  lay(-1.9, 3.3, 2.3, 0.5, 0.07); lay(0.6, 4.3, 1.9, -0.35, 0.05); lay(2.5, 3.6, 2.1, 2.2, 0.06);
  lay(-0.4, 2.4, 2.4, 0.9, 0.2, 0.42);                      // rail propped on the near wing
  lay(3.3, 1.9, 1.5, 1.2, 0.05, 0.75, 0.15, 0.15);          // post speared into the earth by the nose
  lay(-3.4, 2.2, 1.35, 2.7, 0.08, 0, 0.15, 0.15);           // post lying flat
  lay(1.6, 5.6, 1.2, 0.2, 0.05); lay(-3.2, 5.0, 1.0, 1.9, 0.05); lay(4.2, 0.4, 1.6, 2.9, 0.05);
  for (let i = 0; i < 22; i++) lay(U(r, -4.5, 4.5), U(r, 0.5, 7), U(r, 0.2, 0.55), U(r, 0, 6.3), 0.03, U(r, 0, 0.25), U(r, 0.03, 0.06), 0.02); // splinters
}

// ---------------- coconut palm ----------------
export function palm(b: Batch, M: Mats, x: number, z: number, h: number, lean: [number, number], seed: number) {
  const r = rng(seed);
  const top = V(x + lean[0], h, z + lean[1]);
  b.add(limb([V(x, -0.2, z), V(x + lean[0] * 0.2, h * 0.3, z + lean[1] * 0.2), V(x + lean[0] * 0.62, h * 0.68, z + lean[1] * 0.62), top], [0.34, 0.23, 0.18, 0.16], 10, 1.2, 14), M.trunk);
  const n = 12;
  for (let i = 0; i < n; i++) {
    const az = (i / n) * Math.PI * 2 + U(r, -0.2, 0.2), up = i % 3 === 0 ? 62 : i % 3 === 1 ? 34 : 8, L = U(r, 3.0, 3.9) * (h / 8) ** 0.4, half = 0.62;
    const out = V(Math.cos(az), 0, Math.sin(az)), side = V(-Math.sin(az), 0, Math.cos(az));
    const N = 9, parts: THREE.BufferGeometry[] = [];
    let c = top.clone().addScaledVector(out, 0.1), prevL: THREE.Vector3 | null = null, prevR: THREE.Vector3 | null = null, prevC: THREE.Vector3 | null = null;
    for (let k = 0; k <= N; k++) {
      const t = k / N, e = rad(up - (95 + up * 0.4) * t * t), dir = out.clone().multiplyScalar(Math.cos(e)).add(V(0, Math.sin(e), 0));
      if (k) c = c.clone().addScaledVector(dir, L / N);
      const sag = V(0, -0.16 * Math.sin(Math.PI * t), 0); // leaflets hang a little either side of the rib
      const l = c.clone().addScaledVector(side, -half).add(sag), rr = c.clone().addScaledVector(side, half).add(sag);
      if (prevL && prevR && prevC)
        parts.push(quadUV(prevL, prevC, c, l, 0, (k - 1) / N, 0.5, k / N), quadUV(prevC, prevR, rr, c, 0.5, (k - 1) / N, 1, k / N));
      prevC = c; prevL = l; prevR = rr;
    }
    b.add(mergeNI(parts), M.frond[i % 2]);
  }
  for (let i = 0; i < 5; i++) { const a = (i / 5) * 6.28 + 0.4; b.add(new THREE.SphereGeometry(0.19, 10, 8), M.nut, new THREE.Matrix4().makeTranslation(top.x + Math.cos(a) * 0.26, top.y - 0.28, top.z + Math.sin(a) * 0.26)); }
}

// ---------------- kiawe (mesquite): twisted trunk, flat-topped feathery crown ----------------
export function kiawe(b: Batch, M: Mats, x: number, z: number, s: number, seed: number) {
  const r = rng(seed), P = (dx: number, y: number, dz: number) => V(x + dx * s, y * s, z + dz * s);
  b.add(limb([P(0, -0.2, 0), P(0.25, 1.1, 0.1), P(-0.2, 2.2, -0.1), P(0.1, 3.2, 0)], [0.36 * s, 0.27 * s, 0.2 * s, 0.14 * s], 8, 1, 12), M.bark);
  const ends: THREE.Vector3[] = [];
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * 6.28 + U(r, -0.3, 0.3), d = U(r, 1.6, 2.6), e = P(Math.cos(a) * d, U(r, 3.3, 4.1), Math.sin(a) * d);
    b.add(limb([P(-0.1, 1.9 + i * 0.12, 0), P(Math.cos(a) * d * 0.45, 2.9, Math.sin(a) * d * 0.45), e], [0.15 * s, 0.1 * s, 0.06 * s], 6, 1, 8), M.bark);
    ends.push(e);
  }
  ends.push(P(0.1, 4.2, 0));
  ends.forEach((e, i) => {
    b.add(rock(seed * 50 + i, U(r, 1.5, 2.3) * s, U(r, 0.75, 1.05) * s, U(r, 1.4, 2.0) * s, 0.95, 3, 0.13), M.leaf[i % 2], M4(e.clone().add(V(0, 0.35 * s, 0)), U(r, 0, 3)));
    if (i < 4) b.add(rock(seed * 50 + 20 + i, U(r, 0.9, 1.3) * s, U(r, 0.5, 0.7) * s, U(r, 0.9, 1.2) * s, 0.95, 3, 0.13), M.leaf[(i + 1) % 2], M4(e.clone().add(V(U(r, -1, 1) * s, 0.95 * s, U(r, -1, 1) * s)), U(r, 0, 3)));
  });
}

// ---------------- plantation house: board-and-batten on piers, hipped tin roof, lanai, steps, tank, washing ----------------
export function buildHouse(R: THREE.Object3D, M: Mats, x: number, z: number, yaw: number) {
  const G = new THREE.Group(); G.position.set(x, 0, z); G.rotation.y = yaw;
  const b = new Batch(), W = 7.2, D = 5.0, F = 0.7, Hh = 2.7, E = F + Hh, w2 = W / 2, d2 = D / 2;
  const wallM = (key: string, wm: number, o: Parameters<typeof boardWall>[3]) => lam("wall" + key, () => ({ map: boardWall(key, wm, Hh, o) }));
  // walls (front faces +z)
  b.add(quadUV(V(-w2, F, d2), V(w2, F, d2), V(w2, E, d2), V(-w2, E, d2)), wallM("front", W, { windows: [1.4, 5.8], door: 3.6 }));
  b.add(quadUV(V(w2, F, -d2), V(-w2, F, -d2), V(-w2, E, -d2), V(w2, E, -d2)), wallM("back", W, { windows: [2.2, 5.0] }));
  b.add(quadUV(V(-w2, F, -d2), V(-w2, F, d2), V(-w2, E, d2), V(-w2, E, -d2)), wallM("side", D, { windows: [1.5, 3.5] }));
  b.add(quadUV(V(w2, F, d2), V(w2, F, -d2), V(w2, E, -d2), V(w2, E, d2)), wallM("side", D, { windows: [1.5, 3.5] }));
  // corner boards, floor band, stone piers, dark under-floor
  for (const [cx, cz] of [[-w2, d2], [w2, d2], [-w2, -d2], [w2, -d2]]) b.add(boxGeo(V(cx - 0.09, F, cz - 0.09), V(cx + 0.09, E, cz + 0.09)), M.trim);
  b.add(boxGeo(V(-w2 - 0.06, F - 0.2, -d2 - 0.06), V(w2 + 0.06, F, d2 + 0.06)), M.trim);
  b.add(boxGeo(V(-w2 + 0.1, 0, -d2 + 0.1), V(w2 - 0.1, F - 0.2, d2 - 0.1)), M.dark);
  for (const px of [-w2 + 0.2, -1.2, 1.2, w2 - 0.2]) for (const pz of [-d2 + 0.2, d2 - 0.2, d2 + 1.75]) b.add(rock(Math.round(px * 7 + pz * 13 + 60), 0.24, 0.3, 0.24, 0.45, 1, 0.08), M.rock[0], M4(V(px, 0.25, pz)));
  // lanai: deck, posts, top rail, balusters, shed roof, steps
  const LD = 1.9, lz = d2 + LD;
  b.add(boxGeo(V(-w2, F - 0.14, d2), V(w2, F, lz), 1), M.woodDark);
  for (const px of [-w2 + 0.08, -1.25, 1.25, w2 - 0.08]) b.add(boxGeo(V(px - 0.07, F, lz - 0.14), V(px + 0.07, E - 0.38, lz)), M.white);
  for (const [x0, x1] of [[-w2, -1.25], [1.25, w2]]) {
    b.add(boxGeo(V(x0, F + 0.82, lz - 0.11), V(x1, F + 0.9, lz - 0.03)), M.white);
    for (let bx = x0 + 0.22; bx < x1 - 0.1; bx += 0.22) b.add(boxGeo(V(bx - 0.025, F, lz - 0.09), V(bx + 0.025, F + 0.82, lz - 0.05)), M.white);
  }
  for (let i = 0; i < 3; i++) b.add(boxGeo(V(-0.95, 0, lz + i * 0.3), V(0.95, F - 0.14 - i * 0.19, lz + (i + 1) * 0.3), 1), M.woodDark);
  // roofs: uv u along the eave (1.6 m tile), v up the slope
  const O = 0.55, RY = E + 1.55, rw = w2 + O, rd = d2 + O, ridge = w2 - 2.1, T = 1.6;
  const roofQ = (a: THREE.Vector3, c: THREE.Vector3, e: THREE.Vector3, f: THREE.Vector3) => {
    const g = quadUV(a, c, e, f), uv = g.attributes.uv as THREE.BufferAttribute, pts = [a, c, e, a, e, f], ax = c.clone().sub(a).normalize();
    for (let i = 0; i < 6; i++) { const dv = pts[i].clone().sub(a), u = dv.dot(ax); uv.setXY(i, u / T, dv.clone().addScaledVector(ax, -u).length() / T); }
    return g;
  };
  b.add(roofQ(V(-rw, E - 0.12, rd), V(rw, E - 0.12, rd), V(ridge, RY, 0), V(-ridge, RY, 0)), M.tin);
  b.add(roofQ(V(rw, E - 0.12, -rd), V(-rw, E - 0.12, -rd), V(-ridge, RY, 0), V(ridge, RY, 0)), M.tin);
  b.add(roofQ(V(-rw, E - 0.12, -rd), V(-rw, E - 0.12, rd), V(-ridge, RY, 0), V(-ridge, RY, 0)), M.tin);
  b.add(roofQ(V(rw, E - 0.12, rd), V(rw, E - 0.12, -rd), V(ridge, RY, 0), V(ridge, RY, 0)), M.tin);
  b.add(roofQ(V(-rw, E - 0.5, lz + 0.35), V(rw, E - 0.5, lz + 0.35), V(rw, E - 0.02, d2 - 0.1), V(-rw, E - 0.02, d2 - 0.1)), M.tin); // lanai roof
  b.add(boxGeo(V(-rw, E - 0.2, -rd), V(rw, E - 0.1, rd), 0, true), M.trim); // fascia / soffit slab under the eaves
  b.add(boxGeo(V(-ridge - 0.1, RY - 0.03, -0.07), V(ridge + 0.1, RY + 0.06, 0.07)), M.trim); // ridge cap
  // water tank on a timber stand, with a cone lid and a down pipe
  const tx = w2 + 1.9, tz = -0.6;
  for (const sx of [-0.8, 0.8]) for (const sz of [-0.8, 0.8]) b.add(boxGeo(V(tx + sx - 0.08, 0, tz + sz - 0.08), V(tx + sx + 0.08, 1.5, tz + sz + 0.08)), M.woodDark);
  b.add(boxGeo(V(tx - 1.05, 1.5, tz - 1.05), V(tx + 1.05, 1.62, tz + 1.05)), M.woodDark);
  const cyl = new THREE.CylinderGeometry(1.0, 1.0, 1.7, 20, 1, true), cu = cyl.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < cu.count; i++) cu.setXY(i, cu.getX(i) * 4, cu.getY(i));
  b.add(cyl, M.tank, new THREE.Matrix4().makeTranslation(tx, 2.47, tz));
  b.add(new THREE.ConeGeometry(1.08, 0.4, 20), M.tank, new THREE.Matrix4().makeTranslation(tx, 3.52, tz));
  // washing line beside the house
  const lx0 = -w2 - 4.6, lx1 = -w2 - 1.0, lzz = 1.5;
  for (const px of [lx0, lx1]) b.add(boxGeo(V(px - 0.05, 0, lzz - 0.05), V(px + 0.05, 2.0, lzz + 0.05)), M.woodDark);
  b.add(boxGeo(V(lx0, 1.93, lzz - 0.012), V(lx1, 1.955, lzz + 0.012)), M.dark);
  [[0.35, 0.75, 0.9, 0], [1.3, 0.55, 0.6, 1], [2.05, 0.7, 1.05, 2], [2.95, 0.5, 0.7, 3]].forEach(([o, w, h, c]) =>
    b.add(quadUV(V(lx0 + o, 1.93 - h, lzz), V(lx0 + o + w, 1.93 - h, lzz + 0.06), V(lx0 + o + w, 1.93, lzz), V(lx0 + o, 1.93, lzz)), M.cloth[c]));
  b.build(G);
  R.add(G);
}

// ---------------- dry grass tufts: crossed cut-out cards, lit like the ground (normals up), on the no-ink layer ----------------
export function buildTufts(R: THREE.Object3D, spots: [number, number, number][]) {
  const G = new THREE.Group(), b = new Batch();
  const TM = [0, 1, 2].map((v) => twoTone(new THREE.MeshLambertMaterial({ map: tuftTex(v), alphaTest: 0.5 })));
  const r = rng(99), up = V(0, 1, 0);
  spots.forEach(([x, z, s], i) => {
    const a0 = U(r, 0, 3.14);
    for (const a of [a0, a0 + 1.57]) {
      const dx = Math.cos(a) * s * 0.5, dz = Math.sin(a) * s * 0.5, lean = U(r, -0.12, 0.12) * s;
      const A = V(x - dx, -0.02, z - dz), B = V(x + dx, -0.02, z + dz), C = V(x + dx + lean, s * 0.92, z + dz), D = V(x - dx + lean, s * 0.92, z - dz);
      b.add(quadUV(A, B, C, D, 0, 0, 1, 1, up), TM[i % 3]); b.add(quadUV(B, A, D, C, 1, 0, 0, 1, up), TM[i % 3]); // both faces, both lit like the ground
    }
  });
  b.build(G, false);
  G.traverse((o) => o.layers.set(NOINK));
  R.add(G);
}

// ---------------- ranch windmill (water pump): lattice tower, fan wheel, tail vane ----------------
let FAN: THREE.Object3D | null = null;
export function buildWindmill(R: THREE.Object3D, M: Mats, x: number, z: number) {
  const G = new THREE.Group(); G.position.set(x, 0, z); G.rotation.y = 0.5;
  const b = new Batch(), Hh = 7.4, steel = lam("millSteel", () => ({ color: "#8b8f96" })), vane = lam("millVane", () => ({ color: "#b5483a", side: THREE.DoubleSide }));
  const leg = (sx: number, sz: number, y: number) => V(sx * (1.25 - 1.02 * (y / Hh)), y, sz * (1.25 - 1.02 * (y / Hh)));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.add(beamGeo(leg(sx, sz, 0), leg(sx, sz, Hh), 0.09, 0.09), steel);
  for (let k = 0; k < 4; k++) { // girts and cross braces on all four faces
    const y0 = (k * Hh) / 4, y1 = ((k + 1) * Hh) / 4;
    for (const [a, c] of [[[-1, -1], [1, -1]], [[1, -1], [1, 1]], [[1, 1], [-1, 1]], [[-1, 1], [-1, -1]]]) {
      b.add(beamGeo(leg(a[0], a[1], y1), leg(c[0], c[1], y1), 0.05, 0.05), steel);
      b.add(beamGeo(leg(a[0], a[1], y0), leg(c[0], c[1], y1), 0.035, 0.035), steel);
    }
  }
  b.add(boxGeo(V(-0.7, 0, -0.7), V(0.7, 0.5, 0.7), 1), M.woodDark); // well head
  b.add(quadUV(V(-2.6, Hh - 0.25, 0), V(-0.4, Hh + 0.05, 0), V(-0.4, Hh + 0.75, 0), V(-2.6, Hh + 1.05, 0)), vane); // tail vane
  b.add(beamGeo(V(-0.5, Hh + 0.4, 0), V(0.5, Hh + 0.4, 0), 0.08, 0.08), steel);
  b.build(G);
  const fan = new THREE.Group(); fan.position.set(0.55, Hh + 0.4, 0);
  const fb = new Batch(), bladeM = lam("millBlade", () => ({ color: "#aeb3b9", side: THREE.DoubleSide }));
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2, g = quadUV(V(0, 0.35, -0.1), V(0, 1.45, -0.26), V(0.12, 1.45, 0.26), V(0.12, 0.35, 0.1));
    g.rotateX(a); fb.add(g, bladeM);
  }
  fb.add(new THREE.TorusGeometry(1.45, 0.03, 6, 28).rotateY(Math.PI / 2), steel); fb.add(new THREE.TorusGeometry(0.4, 0.03, 6, 16).rotateY(Math.PI / 2), steel);
  fb.build(fan);
  fan.traverse((o) => { o.matrixAutoUpdate = true; });
  G.add(fan); FAN = fan;
  R.add(G);
}
export const spinWindmill = (f: number) => { if (FAN) { FAN.rotation.x = f * 0.085; FAN.updateMatrixWorld(true); } };
