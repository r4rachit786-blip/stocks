// Pearl Harbor from the air, built in 3D for the hook (round 5): Ford Island with its airfield and hangars,
// Battleship Row along its near shore (six different battleships, two destroyers), docks and cranes on the far
// shore, green hills behind, oil on the water, wakes. Local axes: +z toward the camera, units metres (group
// scaled by HARB.s). Fires, smoke, flak and aircraft are cards added by cast.ts on top.
import * as THREE from "three";
import { Batch, lam, boxGeo } from "./build";
import { V, rng, limb } from "./geo";
import { NOINK } from "./ink";
import { SHIPS, ShipSpec } from "./story";

const T = (x: number, y: number, z: number, ry = 0) => new THREE.Matrix4().makeRotationY(ry).setPosition(x, y, z);
const slab = (pts: [number, number][], h: number) => { const sh = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z))); const g = new THREE.ExtrudeGeometry(sh, { depth: h, bevelEnabled: false, curveSegments: 4 }); g.rotateX(-Math.PI / 2); return g; };
const blobPts = (cx: number, cz: number, rx: number, rz: number, seed: number, n = 22): [number, number][] => { const r = rng(seed), ph = [r() * 6, r() * 6]; return Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2, k = 1 + 0.13 * Math.sin(3 * a + ph[0]) + 0.08 * Math.sin(5 * a + ph[1]); return [cx + Math.cos(a) * rx * k, cz + Math.sin(a) * rz * k] as [number, number]; }); };

/** one warship: pointed hull, stepped superstructure, funnels, turrets with barrels, cage or tripod masts. v varies the class */
function ship(b: Batch, s: ShipSpec) {
  const M = {
    hull: lam("shipHull", () => ({ color: "#8d96a6" })), deck: lam("shipDeck", () => ({ color: "#b7ae98" })), sup: lam("shipSup", () => ({ color: "#a6afbe" })),
    dark: lam("shipDark", () => ({ color: "#59616f" })), boot: lam("shipBoot", () => ({ color: "#6d3a34" })),
  };
  const L = s.len, Wd = L * 0.15, small = L < 40, H = small ? 2.6 : 4.2, m = new THREE.Matrix4().makeRotationY(s.yaw).setPosition(s.x, 0, s.z);
  const add = (g: THREE.BufferGeometry, mat: THREE.Material, lx = 0, ly = 0, lz = 0) => b.add(g, mat, m.clone().multiply(new THREE.Matrix4().makeTranslation(lx, ly, lz)));
  const outline = (k: number): [number, number][] => [[-L / 2, 0], [-L * 0.42, -Wd / 2 * k], [L * 0.25, -Wd / 2 * k], [L / 2, 0], [L * 0.25, Wd / 2 * k], [-L * 0.42, Wd / 2 * k]];
  add(slab(outline(1.02), 0.7), M.boot, 0, -0.2, 0); add(slab(outline(1), H), M.hull, 0, 0.4, 0); add(slab(outline(0.93), 0.25), M.deck, 0, H + 0.4, 0);
  const D = H + 0.65, box = (x0: number, x1: number, w: number, h: number, y = D, mat: THREE.Material = M.sup) => add(boxGeo(V(x0, y, -w / 2), V(x1, y + h, w / 2)), mat);
  const turret = (x: number, y: number, dir: number, guns = 2) => {
    add(new THREE.CylinderGeometry(Wd * 0.26, Wd * 0.3, 1.5, 12), M.sup, x, y + 0.75, 0);
    for (let g = 0; g < guns; g++) { const z = (g - (guns - 1) / 2) * Wd * 0.2; add(limb([V(x, y + 0.9, z), V(x + dir * L * 0.1, y + 1.5, z)], [0.32, 0.26], 6), M.dark); }
  };
  const funnel = (x: number, h: number) => add(new THREE.CylinderGeometry(Wd * 0.13, Wd * 0.16, h, 12), M.dark, x, D + 2.4 + h / 2, 0);
  const cage = (x: number, h: number) => { add(new THREE.CylinderGeometry(0.7, 1.7, h, 10), M.dark, x, D + 2.4 + h / 2, 0); add(boxGeo(V(x - 1.5, D + 2.4 + h, -1.5), V(x + 1.5, D + 3.8 + h, 1.5)), M.sup); };
  const tripod = (x: number, h: number) => { for (const [dx, dz] of [[0, 0], [-2.2, 1.4], [-2.2, -1.4]]) add(limb([V(x + dx, D + 2, dz), V(x, D + 2 + h, 0)], [0.22, 0.18], 6), M.dark); add(boxGeo(V(x - 1.4, D + 1.4 + h, -1.4), V(x + 1.4, D + 3.0 + h, 1.4)), M.sup); add(limb([V(x, D + 3 + h, 0), V(x, D + 6.5 + h, 0)], [0.1, 0.08], 5), M.dark); };
  if (small) { // destroyer: low, two funnels, single guns
    box(-L * 0.12, L * 0.16, Wd * 0.6, 1.6); box(L * 0.06, L * 0.14, Wd * 0.5, 1.5, D + 1.6);
    add(new THREE.CylinderGeometry(0.7, 0.8, 2.4, 10), M.dark, -L * 0.02, D + 2.8, 0); add(new THREE.CylinderGeometry(0.7, 0.8, 2.4, 10), M.dark, -L * 0.14, D + 2.6, 0);
    add(limb([V(L * 0.1, D + 3, 0), V(L * 0.1, D + 8, 0)], [0.12, 0.08], 5), M.dark);
    for (const [x, d] of [[L * 0.3, 1], [-L * 0.3, -1]]) { add(boxGeo(V(x - 0.8, D, -0.8), V(x + 0.8, D + 0.9, 0.8)), M.sup); add(limb([V(x, D + 0.6, 0), V(x + d * 2.6, D + 1, 0)], [0.14, 0.12], 5), M.dark); }
    return;
  }
  const v = s.v % 6;
  // superstructure blocks: length, steps and bridge position differ per class
  const b0 = [-0.14, -0.1, -0.16, -0.12, -0.08, -0.15][v] * L, b1 = [0.16, 0.2, 0.12, 0.18, 0.14, 0.2][v] * L;
  box(b0, b1, Wd * 0.62, 2.4); box(b0 + L * 0.03, b1 - L * 0.04, Wd * 0.48, 2.0, D + 2.4);
  box(b1 - L * 0.12, b1 - L * 0.05, Wd * 0.4, [3, 4.5, 2.5, 5, 3.5, 4][v], D + 4.4);                    // bridge tower
  if (v === 1 || v === 4) box(b0 + L * 0.02, b0 + L * 0.08, Wd * 0.36, 2.6, D + 4.4);                       // after control
  if (v % 2 === 0) { funnel(L * 0.0, 5.5); if (v !== 2) funnel(-L * 0.07, 5); } else funnel(-L * 0.02, 6.5);
  if (v < 3) { cage(b1 - L * 0.085, [13, 15, 12][v]); cage(b0 + L * 0.05, [11, 12, 13][v]); } else { tripod(b1 - L * 0.085, [12, 14, 13][v - 3]); tripod(b0 + L * 0.05, [10, 9, 11][v - 3]); }
  const g3 = v === 1 || v === 3 || v === 5 ? 3 : 2;
  turret(L * 0.33, D, 1, g3); turret(L * 0.25, D + 1.5, 1, g3); turret(-L * 0.3, D, -1, g3); turret(-L * 0.22, D + 1.5, -1, g3);
  if (v === 2 || v === 5) turret(-L * 0.06 + b0 * 0, D + 4.4, -1, 2);                                        // a midships turret on two classes
  for (let i = 0; i < 5; i++) add(boxGeo(V(b0 + (i + 0.5) * (b1 - b0) / 5 - 0.9, D, Wd * 0.33), V(b0 + (i + 0.5) * (b1 - b0) / 5 + 0.9, D + 1.1, Wd * 0.42)), M.dark); // casemates / boats
}

export function buildHarbour() {
  const G = new THREE.Group(), b = new Batch();
  const grass = lam("hbGrass", () => ({ color: "#9cba74" })), grass2 = lam("hbGrass2", () => ({ color: "#86a862" })), sand = lam("hbSand", () => ({ color: "#e3d6a8" })), strip = lam("hbStrip", () => ({ color: "#cfc6a6" })),
    roofA = lam("hbRoofA", () => ({ color: "#c9bfa0" })), roofB = lam("hbRoofB", () => ({ color: "#a9744f" })), wall = lam("hbWall", () => ({ color: "#efe8d2" })), dock = lam("hbDock", () => ({ color: "#8a6a4a" })), steel = lam("hbSteel", () => ({ color: "#5f6672" })), tank = lam("hbTank", () => ({ color: "#d9dde2" }));
  // Ford Island: sand rim, grass top, the airfield strip with a taxi loop, hangars along the far side, a water tower
  b.add(slab(blobPts(0, 0, 178, 74, 3), 1.2), sand, T(0, -0.2, 0)); b.add(slab(blobPts(0, 0, 170, 68, 3), 1.4), grass, T(0, 0.9, 0));
  b.add(boxGeo(V(-120, 2.3, -6), V(125, 2.5, 12)), strip); b.add(boxGeo(V(-120, 2.3, -30), V(-104, 2.5, 12)), strip); b.add(boxGeo(V(108, 2.3, -30), V(125, 2.5, 12)), strip);
  for (let i = 0; i < 7; i++) { const x = -96 + i * 31, w = 20 + (i % 3) * 4; b.add(boxGeo(V(x, 2.3, -46), V(x + w, 9 + (i % 2) * 2, -28)), wall); b.add(boxGeo(V(x - 1, 9 + (i % 2) * 2, -47), V(x + w + 1, 10.5 + (i % 2) * 2, -27)), i % 2 ? roofB : roofA); }
  b.add(limb([V(132, 2.3, -34), V(132, 16, -34)], [1.1, 0.9], 8), steel); b.add(new THREE.CylinderGeometry(4, 4, 5, 12), tank, T(132, 18, -34));
  for (let i = 0; i < 9; i++) { const x = -92 + i * 22; b.add(boxGeo(V(x - 3, 2.5, 22), V(x + 3, 3.1, 23.2)), steel); b.add(boxGeo(V(x - 0.6, 2.5, 19.5), V(x + 0.6, 3.2, 25.5)), steel); } // parked aircraft, as crosses
  for (let i = 0; i < 6; i++) b.add(boxGeo(V(-150 + i * 58, -0.2, 70), V(-146 + i * 58, 2.2, 88)), dock);   // mooring quays of the row
  // far shore: yards, docks with cranes, oil tanks, town roofs, and the green hills behind
  b.add(slab([[-620, -150], [620, -150], [620, -560], [-620, -560]], 1.6), grass2, T(0, 0, 0));
  b.add(slab([[-620, -150], [-330, -150], [-300, 60], [-360, 260], [-620, 300]], 1.6), grass2); b.add(slab([[620, -150], [340, -150], [300, 40], [380, 250], [620, 300]], 1.6), grass2);
  for (let i = 0; i < 5; i++) { const x = -240 + i * 110; b.add(boxGeo(V(x, 0, -150), V(x + 14, 3, -96)), dock); }
  const crane = (x: number, z: number, h: number, ry: number) => { const m = T(x, 0, z, ry); b.add(boxGeo(V(-2.5, 1.6, -2.5), V(2.5, h, 2.5)), steel, m); b.add(boxGeo(V(-6, h, -1.2), V(26, h + 2.2, 1.2)), steel, m); b.add(boxGeo(V(-4, h + 2.2, -2), V(3, h + 6, 2)), wall, m); b.add(limb([V(24, h, 0), V(24, h - 12, 0)], [0.25, 0.25], 5), steel, m); };
  crane(-205, -128, 26, 0.5); crane(-90, -132, 22, -0.3); crane(25, -128, 28, 0.2); crane(140, -134, 24, -0.6); crane(250, -130, 26, 0.4);
  for (let i = 0; i < 8; i++) b.add(new THREE.CylinderGeometry(9, 9, 8, 14), tank, T(-380 + (i % 4) * 26, 5.6, -190 - Math.floor(i / 4) * 26));
  const r = rng(12);
  for (let i = 0; i < 46; i++) { const x = -260 + r() * 560, z = -175 - r() * 150, w = 8 + r() * 14, d = 7 + r() * 9, h = 4 + r() * 5; b.add(boxGeo(V(x, 1.6, z), V(x + w, 1.6 + h, z + d)), wall); b.add(boxGeo(V(x - 0.6, 1.6 + h, z - 0.6), V(x + w + 0.6, 2.8 + h, z + d + 0.6)), i % 3 ? roofB : roofA); }
  for (const [x, z, sx, sy, sz, sd] of [[-360, -520, 300, 95, 150, 3], [60, -560, 340, 130, 170, 5], [470, -520, 280, 85, 150, 8], [-120, -470, 180, 60, 100, 9]] as const) {
    const g = new THREE.SphereGeometry(1, 28, 10, 0, Math.PI * 2, 0, Math.PI / 2), p = g.attributes.position as THREE.BufferAttribute, rr = rng(sd), ph = [rr() * 6, rr() * 6];
    for (let i = 0; i < p.count; i++) { const X = p.getX(i), Y = p.getY(i), Z = p.getZ(i), k = 1 + 0.2 * Math.sin(4 * X + ph[0]) * Math.cos(3 * Z + ph[1]); p.setXYZ(i, X * sx, Math.pow(Y, 0.8) * sy * k, Z * sz); }
    g.computeVertexNormals(); b.add(g, sd % 2 ? grass : grass2, T(x, 0, z));
  }
  for (const s of SHIPS) ship(b, s);
  b.build(G);
  // on the water: oil slicks round the row, wakes behind the two destroyers (unlit decals)
  const flat = (x: number, z: number, rx: number, rz: number, col: string, op: number, ry = 0) => { const m = new THREE.Mesh(new THREE.CircleGeometry(1, 24), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: op, depthWrite: false })); m.rotation.set(-Math.PI / 2, 0, ry); m.scale.set(rx, rz, 1); m.position.set(x, 0.25, z); m.layers.set(NOINK); G.add(m); };
  flat(-90, 128, 70, 22, "#1c2030", 0.5, 0.1); flat(48, 134, 80, 26, "#1c2030", 0.45, -0.1); flat(-10, 160, 46, 16, "#232838", 0.4, 0.2); flat(120, 150, 40, 14, "#1c2030", 0.4);
  flat(-128, 176, 26, 3.2, "#f2fbff", 0.8, -0.5 + Math.PI / 2 * 0); flat(128, 196, 24, 3, "#f2fbff", 0.8, 0.7);
  G.traverse((o) => { o.frustumCulled = false; });
  return G;
}
