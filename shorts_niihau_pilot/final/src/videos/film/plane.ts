// The wrecked Zero, built from code (no models available): lofted fuselage with the cockpit cut out, black cowl with
// the radial engine inside, spinner and three bent blades, tapered wings (far tip crumpled), tail, canopy frames
// and glass, seat, aerial mast, cannon stubs, one collapsed leg. Cartoon proportions: short, fat, big cockpit, so
// a 0.65 m wide flat head sits in it comfortably. Local axes: +x nose, +y up, +z the pilot's right (the near wing).
import * as THREE from "three";
import { lam } from "./build";
import { NOINK } from "./ink";
import { ctex } from "./paint";
import { twoTone } from "./shade";
import { V, rad, loft, ringX, limb, mergeNI, quadUV } from "./geo";
import { zeroFuselage, zeroWing, zeroTail, engineFace, propBlade, glassTex } from "./paintx";
import { SILL, PLANE_Y, PLANE_YAW, PLANE_PITCH, PLANE_ROLL } from "./story";

const X_TAIL = -3.8, X_FIRE = 1.45, LEN = X_FIRE - X_TAIL;
const CK_A = 0.62, CK_B = -0.52; // cockpit opening, front and back
const HALF = 3.6;                // half span

const discTex = () => ctex("propDisc", 256, 256, (g) => {
  g.clearRect(0, 0, 256, 256);
  const gr = g.createRadialGradient(128, 128, 8, 128, 128, 126); gr.addColorStop(0, "rgba(60,60,70,0.55)"); gr.addColorStop(0.25, "rgba(70,70,82,0.2)"); gr.addColorStop(0.86, "rgba(90,90,104,0.24)"); gr.addColorStop(0.93, "rgba(240,200,60,0.6)"); gr.addColorStop(1, "rgba(240,200,60,0.0)");
  g.fillStyle = gr; g.beginPath(); g.arc(128, 128, 126, 0, 7); g.fill();
  g.fillStyle = "rgba(40,40,50,0.3)"; for (let i = 0; i < 3; i++) { g.save(); g.translate(128, 128); g.rotate((i * Math.PI * 2) / 3); g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 118, -0.32, 0.32); g.closePath(); g.fill(); g.restore(); }
});
const swapUV = (g: THREE.BufferGeometry) => { const uv = g.attributes.uv as THREE.BufferAttribute; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getY(i), uv.getX(i)); return g; };
const mesh = (g: THREE.BufferGeometry, m: THREE.Material, cast = true) => { const o = new THREE.Mesh(g, m); o.castShadow = cast; o.receiveShadow = true; return o; };

type Sec = { le: THREE.Vector3; c: number; th: number };
/** aerofoil skin through sections (leading-edge point, chord along -x, thickness along tdir). v: 0..0.5 upper
 *  surface leading -> trailing edge, 0.5..1 lower surface back; u = us[i]. bend(p, i) may displace points. */
const foil = (secs: Sec[], us: number[], tdir: THREE.Vector3, bend?: (p: THREE.Vector3, i: number) => void) => {
  const K = 18, rings: THREE.Vector3[][] = [];
  secs.forEach((s, i) => {
    const ring: THREE.Vector3[] = [];
    for (let k = 0; k < K; k++) {
      const up = k < K / 2, xi = up ? k / (K / 2) : 1 - (k - K / 2) / (K / 2);
      const t = s.th * s.c * 2.6 * Math.sqrt(Math.max(xi, 0.0004)) * (1 - xi) ** 0.85 + (xi > 0.98 ? 0 : 0.004);
      const p = s.le.clone().add(V(-s.c * xi, 0, 0)).addScaledVector(tdir, up ? t : -t * 0.6);
      bend?.(p, i);
      ring.push(p);
    }
    rings.push(ring);
  });
  return loft(rings, us, { capA: true, capB: true });
};

/** fly: the same aircraft before the crash (straight wing, spinning prop disc, gear group "gear"), no baked pose */
export function buildPlane(o: { fly?: boolean } = {}) {
  const G = new THREE.Group(), fly = !!o.fly;
  G.position.set(0, PLANE_Y, 0);
  G.rotation.set(rad(PLANE_ROLL), rad(PLANE_YAW), rad(PLANE_PITCH), "YZX");

  const discX = -1.42, discU = (discX - X_TAIL) / LEN;
  const M = {
    fus: lam("zeroFus", () => ({ map: zeroFuselage(LEN, discU, 2.75) })),
    wing: lam("zeroWing", () => ({ map: zeroWing(HALF * 2, (u) => chord(Math.abs(u * 2 - 1) * HALF)) })),
    tail: lam("zeroTail", () => ({ map: zeroTail() })),
    cowl: twoTone(new THREE.MeshPhongMaterial({ color: "#3a3b45", specular: "#34343c", shininess: 22 }), 0.3),
    engine: lam("engineFace", () => ({ map: engineFace() })),
    metal: twoTone(new THREE.MeshPhongMaterial({ color: "#a9adb3", specular: "#c8c8c8", shininess: 50 }), 0.2),
    prop: lam("propBlade", () => ({ map: propBlade() })),
    leather: lam("leather", () => ({ color: "#7a5236" })),
    inside: lam("cockpitIn", () => ({ color: "#46523f" })),
    frame: lam("canFrame", () => ({ color: "#8d9479" })),
    tyre: lam("tyre", () => ({ color: "#3b3b43" })),
    glass: new THREE.MeshBasicMaterial({ map: glassTex(), transparent: true, depthWrite: false, side: THREE.DoubleSide }),
  };
  for (const m of [M.fus, M.wing, M.tail]) if (m.map) { m.map.anisotropy = 16; m.map.needsUpdate = true; }

  // ---- fuselage: stations (x, half height, half width, centre y); the cockpit bay is clamped to the sill ----
  const ST: [number, number, number, number, boolean][] = [
    [X_FIRE, 0.6, 0.585, 0, false], [1.05, 0.61, 0.57, 0, false], [CK_A, 0.61, 0.555, 0.005, false],
    [CK_A, 0.61, 0.555, 0.005, true], [0.05, 0.6, 0.53, 0.01, true], [CK_B, 0.57, 0.485, 0.02, true],
    [CK_B, 0.57, 0.485, 0.02, false], [-0.95, 0.52, 0.43, 0.035, false], [-1.5, 0.45, 0.36, 0.055, false], [-2.2, 0.35, 0.265, 0.09, false],
    [-3.0, 0.215, 0.15, 0.13, false], [-3.5, 0.11, 0.075, 0.16, false], [X_TAIL, 0.03, 0.025, 0.17, false],
  ];
  const rings = ST.map(([x, ry, rz, yc, cut]) => ringX(x, ry, rz, yc, 2.35, 32, cut ? SILL : Infinity));
  const us = ST.map(([x]) => (x - X_TAIL) / LEN);
  G.add(mesh(loft(rings, us, { capA: true, capB: true }), M.fus));

  // cockpit: dark floor at the sill, padded leather coaming, seat back with head rest
  G.add(mesh(quadUV(V(CK_B + 0.02, SILL + 0.004, 0.44), V(CK_A - 0.02, SILL + 0.004, 0.44), V(CK_A - 0.02, SILL + 0.004, -0.44), V(CK_B + 0.02, SILL + 0.004, -0.44)), M.inside, false));
  const rim: THREE.Vector3[] = [];
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a), e = 2 / 4.5;
    rim.push(V((CK_A + CK_B) / 2 + ((CK_A - CK_B) / 2 - 0.01) * Math.sign(c) * Math.abs(c) ** e, SILL + 0.03, 0.455 * Math.sign(s) * Math.abs(s) ** e));
  }
  G.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rim, true), 80, 0.05, 8, true), M.leather));

  // ---- cowl (ring lathe with an intake lip), engine face, exhaust stubs ----
  const CW: [number, number][] = [[X_FIRE - 0.02, 0.6], [X_FIRE + 0.02, 0.645], [1.75, 0.655], [2.1, 0.64], [2.28, 0.6], [2.37, 0.535], [2.385, 0.49], [2.36, 0.455], [2.24, 0.44]];
  G.add(mesh(loft(CW.map(([x, r]) => ringX(x, r, r, 0, 2, 32)), CW.map((_, i) => i / (CW.length - 1)), { capA: true }), M.cowl));
  const face = new THREE.CircleGeometry(0.445, 32); face.rotateY(Math.PI / 2); face.translate(2.25, 0, 0);
  G.add(mesh(face, M.engine, false));
  for (const s of [-1, 1]) G.add(mesh(limb([V(1.5, -0.42, s * 0.42), V(1.3, -0.47, s * 0.47), V(1.12, -0.5, s * 0.52)], [0.045, 0.045, 0.04], 7), M.metal));
  // cowl flap gills: a ring of slightly open plates at the back of the cowl (silhouette detail)
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + 0.2, g = new THREE.BoxGeometry(0.2, 0.025, 0.26);
    g.rotateZ(rad(-12)); g.translate(X_FIRE - 0.06, 0.66, 0); g.rotateX(a);
    G.add(mesh(g, M.cowl));
  }

  // ---- spinner + three blades, tips bent back by the ground ----
  const SP: [number, number][] = [[2.22, 0.15], [2.3, 0.175], [2.46, 0.17], [2.62, 0.13], [2.74, 0.07], [2.79, 0.012]];
  G.add(mesh(loft(SP.map(([x, r]) => ringX(x, r, r, 0, 2, 18)), SP.map((_, i) => i / (SP.length - 1)), { capA: true, capB: true }), M.metal));
  const blade = (ang: number, bendDeg: number, len: number) => {
    const N = 10, rg: THREE.Vector3[][] = [], uu: number[] = [];
    let p = V(2.42, 0.12, 0), dir = V(0, 1, 0);
    for (let i = 0; i <= N; i++) {
      const t = i / N, w = (0.12 + 0.13 * Math.sin(Math.PI * Math.min(1, t * 1.25)) ** 0.8) * (t > 0.9 ? 1 - (t - 0.9) * 6 : 1), th = 0.04 * (1 - 0.6 * t);
      const bend = rad(bendDeg) * Math.max(0, (t - 0.45) / 0.55) ** 1.6;
      dir = V(-Math.sin(bend), Math.cos(bend), 0);
      if (i) p = p.clone().addScaledVector(dir, len / N);
      const nx = V(Math.cos(bend), Math.sin(bend), 0); // blade thickness direction
      const ring: THREE.Vector3[] = [];
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2, pitch = rad(24);
        const cz = Math.cos(a) * w, cx = Math.sin(a) * th;
        ring.push(p.clone().add(V(0, 0, cz * Math.cos(pitch))).addScaledVector(nx, cx + cz * Math.sin(pitch)));
      }
      rg.push(ring); uu.push(t);
    }
    const g = swapUV(loft(rg, uu, { capB: true }));
    g.rotateX(ang);
    return mesh(g, M.prop);
  };
  if (!fly) G.add(blade(rad(-22), 58, 1.38), blade(rad(98), 34, 1.38), blade(rad(218), 80, 1.3));
  else { // spinning: a translucent disc with a yellow tip ring, plus one ghost blade so it never reads as a plate
    const dg = new THREE.CircleGeometry(1.5, 40); dg.rotateY(Math.PI / 2); dg.translate(2.5, 0, 0);
    const disc = new THREE.Mesh(dg, new THREE.MeshBasicMaterial({ map: discTex(), transparent: true, depthWrite: false, side: THREE.DoubleSide, opacity: 0.9 }));
    disc.name = "disc"; disc.layers.set(NOINK); disc.renderOrder = 3; G.add(disc);
  }

  // ---- wings ----
  function chord(s: number) { const c = 1.82 - 0.86 * (s / HALF); return s > 3.15 ? c * Math.sqrt(Math.max(0.02, 1 - ((s - 3.15) / 0.46) ** 2)) : c; }
  const NS = 30, secs: Sec[] = [], wu: number[] = [];
  for (let i = 0; i <= NS; i++) {
    const z = -HALF + (2 * HALF * i) / NS, s = Math.abs(z), c = chord(s);
    secs.push({ le: V(1.2 - 0.26 * (s / HALF) - (1.82 - 0.86 * (s / HALF) - c) * 0.35, -0.37 + s * Math.tan(rad(5.5)), z), c, th: 0.075 + 0.02 * (1 - s / HALF) });
    wu.push(i / NS);
  }
  const hinge = V(0, -0.37 + 2.45 * Math.tan(rad(5.5)), -2.45);
  G.add(mesh(foil(secs, wu, V(0, 1, 0), (p) => { // far wing: outer panel folded up and twisted by the fence
    if (fly || p.z > -2.45) return;
    const k = Math.min(1, (-2.45 - p.z) / 0.5), a = rad(46) * k, dz = p.z - hinge.z, dy = p.y - hinge.y;
    p.z = hinge.z + dz * Math.cos(a) + dy * Math.sin(a); p.y = hinge.y - dz * Math.sin(a) + dy * Math.cos(a) + 0.1 * k * (p.x - 0.4);
  }), M.wing));
  for (const z of [-1.45, 1.45]) G.add(mesh(limb([V(1.0, -0.2, z), V(1.5, -0.2, z)], [0.04, 0.035], 7), M.cowl)); // cannon barrels
  G.add(mesh(limb([V(0.95, 0.02, 3.2), V(1.25, 0.03, 3.2)], [0.018, 0.014], 6), M.metal)); // pitot tube on the near wing

  // ---- tail: tailplane, fin + rudder, tail wheel ----
  const tsec: Sec[] = [], tu: number[] = [];
  for (let i = 0; i <= 12; i++) { const z = -1.3 + (2.6 * i) / 12, s = Math.abs(z) / 1.3, c = (0.78 - 0.34 * s) * (s > 0.86 ? Math.sqrt(Math.max(0.03, 1 - ((s - 0.86) / 0.145) ** 2)) : 1); tsec.push({ le: V(-2.78 - 0.16 * s, 0.2, z), c, th: 0.07 }); tu.push(i / 12); }
  G.add(mesh(foil(tsec, tu, V(0, 1, 0)), M.tail));
  const fsec: Sec[] = [], fu: number[] = [];
  for (let i = 0; i <= 10; i++) { const s = i / 10, c = (1.02 - 0.5 * s) * (s > 0.84 ? Math.sqrt(Math.max(0.03, 1 - ((s - 0.84) / 0.165) ** 2)) : 1); fsec.push({ le: V(-2.72 - 0.42 * s, 0.2 + 1.08 * s, 0), c, th: 0.06 }); fu.push(s); }
  G.add(mesh(foil(fsec, fu, V(0, 0, 1)), M.tail));
  G.add(mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.07, 14).rotateX(Math.PI / 2).translate(-3.3, -0.16, 0), M.tyre));
  G.add(mesh(limb([V(-3.2, 0.05, 0), V(-3.3, -0.16, 0)], [0.03, 0.025], 6), M.metal));

  // ---- canopy: windscreen (two hoops + glass) ahead of the pilot, slid-back hood behind him, aerial mast ----
  const arch = (x0: number, xTop: number, h: number, w: number, n = 12) => Array.from({ length: n + 1 }, (_, i) => {
    const a = (i / n) * Math.PI;
    return V(x0 + (xTop - x0) * Math.sin(a), SILL + 0.02 + h * Math.sin(a) ** 0.8, -w * Math.cos(a));
  });
  const tube = (pts: THREE.Vector3[], r = 0.024) => mesh(limb(pts, [r, r], 6, 1, pts.length * 2), M.frame);
  const glassStrip = (a: THREE.Vector3[], b: THREE.Vector3[]) => {
    const parts: THREE.BufferGeometry[] = [];
    for (let i = 0; i < a.length - 1; i++) parts.push(quadUV(a[i], a[i + 1], b[i + 1], b[i], i / (a.length - 1), 0, (i + 1) / (a.length - 1), 1));
    const o = new THREE.Mesh(mergeNI(parts), M.glass); o.renderOrder = 3; return o;
  };
  const w1 = arch(CK_A + 0.36, CK_A + 0.2, 0.42, 0.4), w2 = arch(CK_A + 0.04, CK_A - 0.04, 0.66, 0.44);
  G.add(tube(w1), tube(w2), tube([w1[6], w2[6]]), tube([w1[3], w2[3]]), tube([w1[9], w2[9]]), glassStrip(w1, w2));
  const h1 = arch(CK_B - 0.02, CK_B - 0.02, 0.62, 0.45), h2 = arch(CK_B - 0.42, CK_B - 0.42, 0.57, 0.43), h3 = arch(CK_B - 0.84, CK_B - 0.84, 0.47, 0.39);
  G.add(tube(h1), tube(h2), tube(h3), tube([h1[6], h2[6], h3[6]]), tube([h1[3], h2[3], h3[3]]), tube([h1[9], h2[9], h3[9]]), glassStrip(h1, h2), glassStrip(h2, h3));
  G.add(mesh(limb([V(-1.55, 0.5, 0), V(-1.62, 0.95, 0.02), V(-1.5, 1.32, 0.1)], [0.03, 0.022, 0.014], 6), M.frame)); // bent aerial mast

  if (fly) { // main gear down: two legs, wheels, doors
    const gear = new THREE.Group(); gear.name = "gear";
    for (const z of [-1.3, 1.3]) {
      gear.add(mesh(limb([V(0.7, -0.4, z), V(0.82, -1.3, z)], [0.055, 0.045], 7), M.metal));
      const w = new THREE.Group(); w.add(mesh(new THREE.TorusGeometry(0.2, 0.095, 10, 20), M.tyre), mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.1, 14).rotateX(Math.PI / 2), M.metal));
      w.position.set(0.82, -1.32, z + Math.sign(z) * -0.12); gear.add(w);
      gear.add(mesh(new THREE.BoxGeometry(0.34, 0.8, 0.03).translate(0.76, -0.85, z + Math.sign(z) * 0.1), M.wing));
    }
    G.add(gear);
  } else {
  // ---- collapsed near leg folded under the wing: strut, wheel, door ----
    G.add(mesh(limb([V(0.75, -0.42, 1.25), V(0.2, -0.56, 1.55)], [0.05, 0.045], 7), M.metal));
    const wheel = new THREE.Group();
    wheel.add(mesh(new THREE.TorusGeometry(0.2, 0.095, 10, 20), M.tyre), mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.1, 14).rotateX(Math.PI / 2), M.metal));
    wheel.position.set(0.12, -0.52, 1.62); wheel.rotation.set(rad(68), rad(20), 0);
    G.add(wheel);
  }

  G.traverse((o) => { o.frustumCulled = false; });
  return G;
}
