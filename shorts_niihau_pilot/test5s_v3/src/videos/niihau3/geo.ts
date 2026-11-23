// Small procedural-geometry helpers for the Niihau set (new for this shot; the kit only has boxes and strands):
// lofted skins (fuselage, wings, cowl), tapered limbs along a curve (palm trunks, branches), rounded rocks.
import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
export const rad = (d: number) => (d * Math.PI) / 180;
/** deterministic random stream */
export const rng = (seed: number) => {
  let s = (Math.floor(seed) * 9301 + 49297) % 233280 || 1;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
};

/** Skin over rings[i][j] (every ring has N points, not repeated). uv: u = us[i], v = j / N (or vs[j], N + 1 values).
 *  Faces are oriented outward automatically. Two rings at the same place give a hard edge (cockpit cut, cowl lip). */
export function loft(rings: THREE.Vector3[][], us: number[], o: { vs?: number[]; capA?: boolean; capB?: boolean; flip?: boolean } = {}) {
  const M = rings.length, N = rings[0].length, W = N + 1;
  const pos: number[] = [], uv: number[] = [], idx: number[] = [];
  for (let i = 0; i < M; i++) for (let j = 0; j <= N; j++) {
    const p = rings[i][j % N];
    pos.push(p.x, p.y, p.z); uv.push(us[i], o.vs ? o.vs[j] : j / N);
  }
  // orientation test on a middle quad: its normal must point away from the ring centroid
  const mid = Math.floor(M / 2) - (M > 1 && Math.floor(M / 2) === M - 1 ? 1 : 0), c = V(0, 0, 0);
  for (const p of rings[mid]) c.addScaledVector(p, 1 / N);
  let j0 = 0, best = 0;
  for (let j = 0; j < N; j++) { const d = rings[mid][j].distanceTo(c); if (d > best) { best = d; j0 = j; } }
  const A = rings[mid][j0], B = rings[mid][(j0 + 1) % N], C = rings[Math.min(M - 1, mid + 1)][j0];
  const nrm = B.clone().sub(A).cross(C.clone().sub(A));
  let out = nrm.dot(A.clone().sub(c)) > 0; // (a, b, c) = (A, B, C) is outward
  if (o.flip) out = !out;
  for (let i = 0; i < M - 1; i++) for (let j = 0; j < N; j++) {
    const a = i * W + j, b = a + 1, cc = a + W, d = cc + 1;
    if (out) idx.push(a, b, cc, b, d, cc); else idx.push(a, cc, b, b, cc, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  // close the v seam: the duplicated column gets the averaged normal
  const n = g.attributes.normal as THREE.BufferAttribute;
  for (let i = 0; i < M; i++) {
    const a = i * W, b = i * W + N;
    const x = n.getX(a) + n.getX(b), y = n.getY(a) + n.getY(b), z = n.getZ(a) + n.getZ(b), l = Math.hypot(x, y, z) || 1;
    n.setXYZ(a, x / l, y / l, z / l); n.setXYZ(b, x / l, y / l, z / l);
  }
  const parts = [g.toNonIndexed()];
  for (const [on, ring, u] of [[o.capA, rings[0], us[0]], [o.capB, rings[M - 1], us[M - 1]]] as const) {
    if (!on) continue;
    const cc = V(0, 0, 0);
    for (const p of ring) cc.addScaledVector(p, 1 / N);
    const cp: number[] = [], cu: number[] = [];
    for (let j = 0; j < N; j++) {
      const a = ring[j], b = ring[(j + 1) % N];
      cp.push(cc.x, cc.y, cc.z, a.x, a.y, a.z, b.x, b.y, b.z); cu.push(u, 0.5, u, j / N, u, (j + 1) / N);
    }
    const cg = new THREE.BufferGeometry();
    cg.setAttribute("position", new THREE.Float32BufferAttribute(cp, 3));
    cg.setAttribute("uv", new THREE.Float32BufferAttribute(cu, 2));
    cg.computeVertexNormals();
    // face away from the body
    const other = ring === rings[0] ? rings[Math.min(1, M - 1)] : rings[Math.max(0, M - 2)], oc = V(0, 0, 0);
    for (const p of other) oc.addScaledVector(p, 1 / N);
    const cn = cg.attributes.normal as THREE.BufferAttribute;
    if (V(cn.getX(0), cn.getY(0), cn.getZ(0)).dot(cc.clone().sub(oc)) < 0) {
      const pa = cg.attributes.position.array as Float32Array, ua = cg.attributes.uv.array as Float32Array;
      for (let t = 0; t < pa.length / 9; t++) {
        for (let k = 0; k < 3; k++) { const x = pa[t * 9 + 3 + k]; pa[t * 9 + 3 + k] = pa[t * 9 + 6 + k]; pa[t * 9 + 6 + k] = x; }
        for (let k = 0; k < 2; k++) { const x = ua[t * 6 + 2 + k]; ua[t * 6 + 2 + k] = ua[t * 6 + 4 + k]; ua[t * 6 + 4 + k] = x; }
      }
      cg.computeVertexNormals();
    }
    parts.push(cg);
  }
  return parts.length === 1 ? parts[0] : mergeNI(parts);
}
/** merge non-indexed geometries that carry position / normal / uv */
export function mergeNI(parts: THREE.BufferGeometry[]) {
  const g = new THREE.BufferGeometry();
  for (const [name, size] of [["position", 3], ["normal", 3], ["uv", 2]] as const) {
    const out: number[] = [];
    for (const p of parts) { const a = (p.index ? p.toNonIndexed() : p).attributes[name]; for (let i = 0; i < a.count * size; i++) out.push((a.array as Float32Array)[i]); }
    g.setAttribute(name, new THREE.Float32BufferAttribute(out, size));
  }
  return g;
}

/** superellipse ring in the plane x = const: half height ry, half width rz, centre (x, yc, 0). j = 0 at the bottom,
 *  then the +z side, the top, the -z side (v = 0.25 on the +z flank, 0.5 on the spine, 0.75 on the -z flank). */
export const ringX = (x: number, ry: number, rz: number, yc = 0, n = 2.4, N = 28, yMax = Infinity): THREE.Vector3[] => {
  // points spaced evenly along the outline (so v is arc length and painted discs stay round)
  const D = 720, pts: [number, number][] = [], cum = [0], e = 2 / n;
  for (let i = 0; i <= D; i++) {
    const a = (i / D) * Math.PI * 2, c = -Math.cos(a), s = Math.sin(a);
    pts.push([ry * Math.sign(c) * Math.abs(c) ** e, rz * Math.sign(s) * Math.abs(s) ** e]);
    if (i) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  }
  const out: THREE.Vector3[] = [];
  let k = 0;
  for (let j = 0; j < N; j++) {
    const t = (j / N) * cum[D];
    while (k < D - 1 && cum[k + 1] < t) k++;
    const f = (t - cum[k]) / Math.max(1e-9, cum[k + 1] - cum[k]);
    out.push(V(x, Math.min(yMax, yc + pts[k][0] + (pts[k + 1][0] - pts[k][0]) * f), pts[k][1] + (pts[k + 1][1] - pts[k][1]) * f));
  }
  return out;
};

/** tapered round limb along a smooth path (trunks, branches, struts); uv: u along (0..len / tile), v around */
export function limb(path: THREE.Vector3[], radii: number[], sides = 8, tile = 1, seg = 0) {
  const curve = new THREE.CatmullRomCurve3(path, false, "centripetal");
  const n = seg || Math.max(4, path.length * 4), fr = curve.computeFrenetFrames(n, false), len = curve.getLength();
  const rings: THREE.Vector3[][] = [], us: number[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, p = curve.getPointAt(t), rt = t * (radii.length - 1), i0 = Math.min(radii.length - 2, Math.floor(rt));
    const r = radii[i0] + (radii[i0 + 1] - radii[i0]) * (rt - i0);
    const ring: THREE.Vector3[] = [];
    for (let j = 0; j < sides; j++) {
      const a = (j / sides) * Math.PI * 2;
      ring.push(p.clone().addScaledVector(fr.normals[i], Math.cos(a) * r).addScaledVector(fr.binormals[i], Math.sin(a) * r));
    }
    rings.push(ring); us.push((t * len) / tile);
  }
  return loft(rings, us, { capA: true, capB: true });
}

/** rounded field stone: a boxed-up icosphere with soft lumps, smooth normals, wrapped uv (about 1 tile per metre) */
export function rock(seed: number, sx: number, sy: number, sz: number, boxy = 0.6, detail = 1, lump = 0.14) {
  const r = rng(seed * 7 + 3);
  const base = new THREE.IcosahedronGeometry(1, detail);
  base.deleteAttribute("uv"); base.deleteAttribute("normal");
  const g = mergeVertices(base, 1e-4);
  const p = g.attributes.position as THREE.BufferAttribute;
  const ph = [r() * 6.28, r() * 6.28, r() * 6.28];
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const k = 1 + lump * (Math.sin(3.1 * x + ph[0]) * Math.cos(2.7 * y + ph[1]) + 0.6 * Math.sin(4.3 * z + ph[2])) + (r() - 0.5) * lump * 0.5;
    x = Math.sign(x) * Math.abs(x) ** boxy; y = Math.sign(y) * Math.abs(y) ** boxy; z = Math.sign(z) * Math.abs(z) ** boxy;
    p.setXYZ(i, x * k * sx, y * k * sy, z * k * sz);
  }
  g.computeVertexNormals();
  const ni = g.toNonIndexed(), q = ni.attributes.position as THREE.BufferAttribute, uv: number[] = [];
  const S = Math.max(sx, sy, sz) * 2.2, o0 = r(), o1 = r();
  for (let t = 0; t < q.count; t += 3) {
    const us = [0, 1, 2].map((k) => Math.atan2(q.getZ(t + k), q.getX(t + k)) / (Math.PI * 2) + 0.5);
    const mx = Math.max(...us);
    for (let k = 0; k < 3; k++) {
      const u = us[k] < mx - 0.5 ? us[k] + 1 : us[k];
      uv.push(u * S * 1.4 + o0, (q.getY(t + k) / (sy * 2)) * Math.max(0.6, sy * 2) + o1);
    }
  }
  ni.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  return ni;
}

/** flat quad a, b, c, d (counter-clockwise seen from the front) with its own uv rectangle */
export function quadUV(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, d: THREE.Vector3, u0 = 0, v0 = 0, u1 = 1, v1 = 1, up?: THREE.Vector3) {
  const g = new THREE.BufferGeometry();
  const n = up ?? new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(d, a)).normalize();
  g.setAttribute("position", new THREE.Float32BufferAttribute([a, b, c, a, c, d].flatMap((v) => [v.x, v.y, v.z]), 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute([0, 1, 2, 3, 4, 5].flatMap(() => [n.x, n.y, n.z]), 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute([u0, v0, u1, v0, u1, v1, u0, v0, u1, v1, u0, v1], 2));
  return g;
}

/** box between two points with a square-ish section (rails, posts, splinters): length along a -> b, uv tiled */
export function beamGeo(a: THREE.Vector3, b: THREE.Vector3, w: number, h: number, tile = 1, twist = 0) {
  const len = a.distanceTo(b), g = new THREE.BoxGeometry(w, len, h);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  // BoxGeometry face order: +x, -x, +y, -y, +z, -z (4 verts each). Long faces: u across, v along.
  for (let i = 0; i < uv.count; i++) {
    const face = Math.floor(i / 4);
    if (face === 2 || face === 3) uv.setXY(i, uv.getX(i) * w / tile, uv.getY(i) * h / tile);
    else uv.setXY(i, uv.getX(i) * (face < 2 ? h : w) / tile * 2.5, uv.getY(i) * len / tile);
  }
  if (twist) g.rotateY(twist);
  const m = new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(0.5),
    new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize()), V(1, 1, 1));
  return g.applyMatrix4(m);
}
