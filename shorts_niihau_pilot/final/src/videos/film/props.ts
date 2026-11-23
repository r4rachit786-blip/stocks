// The party set for v3: table with checked cloth, battery radio (glowing numbered dial), dry cell and wires,
// kerosene lantern, plates of food, bottles, cups, ukulele, lauhala mat, tiki torches, the string of paper lanterns,
// the ALOHA board, lit house windows with their light patches. Every light source is returned so world.ts can
// flicker it: { core mesh / halo sprite / pool patch / point light }.
import * as THREE from "three";
import { Batch, lam, boxGeo } from "./build";
import { rep } from "./paint";
import { NOINK } from "./ink";
import { V, rad, limb, quadUV, beamGeo, loft, ringX } from "./geo";
import { checkCloth, lauhala, grainWood, radioFront, batteryLabel, alohaSign, plateTex, ukeTex, windowGlow, flameTex } from "./paint3";
import { halo, patch, poolTex, paneTex, emissive } from "./night";
import { TABLE, RADIO, LANTERN, BATTERY, TORCH1, TORCH2, HOUSE } from "./story";
import { Mats } from "./set";

export type Source = { halo?: THREE.Sprite; pool?: THREE.Mesh[]; light?: THREE.PointLight; flame?: THREE.Mesh; base: number; seed: number };
const WARM = "#ffb45e", LAMP = "#ffd9a0";
const lathe = (pts: [number, number][], seg = 16) => { // [y, r] profile round the y axis
  const g = loft(pts.map(([y, r]) => ringX(y, r, r, 0, 2, seg)), pts.map((_, i) => i / (pts.length - 1)), { capA: true, capB: true });
  g.rotateZ(Math.PI / 2); return g; // ringX rings lie in planes x = const: turn x into +y
};
const T = (x: number, y: number, z: number, ry = 0) => new THREE.Matrix4().makeRotationY(ry).setPosition(x, y, z);
const flat = (tex: THREE.Texture, w: number, d: number) => { // cut-out card lying flat (plates, ukulele)
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2), lam("flat" + tex.uuid, () => ({ map: tex, alphaTest: 0.5 })));
  m.receiveShadow = true; return m;
};

export function buildParty(R: THREE.Object3D, M: Mats) {
  const b = new Batch(), src: Source[] = [], ty = TABLE.y;
  const wood = lam("tableWood", () => ({ map: grainWood("table", "#a8683a") })), cab = lam("radioCab", () => ({ map: grainWood("cab", "#8a5228", 1) }));
  const tin = lam("lampTin", () => ({ color: "#6f7f8a" })), brass = lam("brass", () => ({ color: "#c9a04a" })), glassB = lam("bottleBrown", () => ({ color: "#7a4a22" })), glassG = lam("bottleGreen", () => ({ color: "#3f7a52" }));
  const enamel = lam("enamel", () => ({ color: "#ece6d6" })), rope = lam("rope", () => ({ color: "#3a3040" })), bamboo = lam("bamboo", () => ({ color: "#b89a58" }));

  // ---- lauhala mat on the ground, table (plank top showing at the far end), checked cloth ----
  b.add(quadUV(V(-3.3, 0.02, 2.3), V(1.3, 0.02, 2.3), V(1.3, 0.02, -1.2), V(-3.3, 0.02, -1.2), 0, 0, 4.6 / 0.8, 3.5 / 0.8), lam("lauhala", () => ({ map: lauhala() })));
  b.add(boxGeo(V(-3.36, 0, 2.3), V(-3.3, 0.035, -1.2)), M.woodDark); b.add(boxGeo(V(1.3, 0, 2.3), V(1.36, 0.035, -1.2)), M.woodDark);
  b.add(boxGeo(V(TABLE.x0, ty - 0.06, TABLE.z0), V(TABLE.x1 + 0.5, ty - 0.012, TABLE.z1), 1.2, true), wood);
  for (const x of [TABLE.x0 + 0.1, TABLE.x1 + 0.4]) for (const z of [TABLE.z0 + 0.08, TABLE.z1 - 0.08]) b.add(boxGeo(V(x - 0.045, 0, z - 0.045), V(x + 0.045, ty - 0.06, z + 0.045), 1), wood);
  const cloth = lam("cloth", () => ({ map: checkCloth() }));
  b.add(boxGeo(V(TABLE.x0 - 0.03, ty - 0.36, TABLE.z0 - 0.03), V(TABLE.x1, ty, TABLE.z1 + 0.03), 1), cloth);

  // ---- battery radio: cabinet with a rounded top, painted front, glowing dial overlay, aerial wire ----
  const rw = 0.46, rh = 0.32, rd = 0.22, G = new THREE.Group();
  G.position.set(RADIO[0], RADIO[1], RADIO[2]); G.rotation.y = 0.16;
  const prof: THREE.Vector3[][] = [];
  for (const z of [-rd / 2, rd / 2]) { const ring: THREE.Vector3[] = []; for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a), e = 2 / 5; ring.push(V((rw / 2) * Math.sign(c) * Math.abs(c) ** e, rh / 2 + (rh / 2) * Math.sign(s) * Math.abs(s) ** e, z)); } prof.push(ring); }
  const cabM = new THREE.Mesh(loft(prof, [0, 1], { capA: true }), cab); cabM.castShadow = cabM.receiveShadow = true; G.add(cabM);
  const front = new THREE.Mesh(new THREE.PlaneGeometry(rw, rh).translate(0, rh / 2, rd / 2 + 0.002), lam("radioFront", () => ({ map: radioFront(false), alphaTest: 0 })));
  front.receiveShadow = true; G.add(front);
  const dial = new THREE.Mesh(new THREE.PlaneGeometry(rw, rh).translate(0, rh / 2, rd / 2 + 0.004), new THREE.MeshBasicMaterial({ map: radioFront(true), color: new THREE.Color(3.0, 2.3, 1.3), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false }));
  dial.layers.set(NOINK); dial.renderOrder = 5; G.add(dial);
  for (const s of [-1, 1]) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6).translate(s * 0.17, 0.005, 0.06), cab); G.add(f); }
  R.add(G);
  const dialPos = V(RADIO[0] + 0.1, ty + 0.2, RADIO[2] + 0.16);
  src.push({ halo: halo(R, dialPos, 0.62, "#ffb040", 0.55), pool: [patch(R, poolTex(), V(RADIO[0] - 0.25, ty + 0.004, RADIO[2] + 0.62), V(RADIO[0] + 0.5, ty + 0.004, RADIO[2] + 0.62), V(RADIO[0] + 0.5, ty + 0.004, RADIO[2] + 0.08), V(RADIO[0] - 0.25, ty + 0.004, RADIO[2] + 0.08), "#ff9a30", 0.7)], base: 1, seed: 1 });

  // ---- dry cell with brass terminals, two wires to the radio ----
  const bat = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.17, 0.1), [0, 1, 2, 3, 4, 5].map((i) => (i === 2 || i === 3 ? lam("batTop", () => ({ color: "#2a2a34" })) : lam("batLabel" + (i < 2 ? "s" : "f"), () => ({ map: i < 2 ? rep(batteryLabel(), 0.25, 1) : rep(batteryLabel(), 0.5, 1) })))));
  bat.position.set(BATTERY[0], ty + 0.085, BATTERY[2]); bat.rotation.y = 0.1; bat.castShadow = bat.receiveShadow = true; R.add(bat);
  for (const [dx, col] of [[-0.05, "#c2352c"], [0.05, "#2a2a34"]] as const) {
    b.add(new THREE.CylinderGeometry(0.012, 0.012, 0.035, 8), brass, T(BATTERY[0] + dx, ty + 0.185, BATTERY[2]));
    b.add(limb([V(BATTERY[0] + dx, ty + 0.2, BATTERY[2]), V(BATTERY[0] + dx * 2 + 0.02, ty + 0.25, BATTERY[2] - 0.14), V(RADIO[0] + 0.3 + dx, ty + 0.03, RADIO[2] - 0.02), V(RADIO[0] + 0.2 + dx, ty + 0.12, RADIO[2] - 0.13)], [0.007, 0.007], 5, 1, 14), lam("wire" + col, () => ({ color: col })));
  }

  // ---- kerosene lantern: tank, burner, glass chimney (emissive), cap, bail handle ----
  const L = V(LANTERN[0], ty, LANTERN[2]);
  b.add(lathe([[0, 0.075], [0.012, 0.085], [0.06, 0.085], [0.08, 0.05], [0.1, 0.045]]), tin, T(L.x, L.y, L.z));
  b.add(lathe([[0.26, 0.05], [0.275, 0.06], [0.3, 0.035], [0.33, 0.03], [0.34, 0.012]]), tin, T(L.x, L.y, L.z));
  for (const s of [-1, 1]) b.add(limb([V(L.x + s * 0.085, L.y + 0.07, L.z), V(L.x + s * 0.09, L.y + 0.2, L.z), V(L.x + s * 0.06, L.y + 0.29, L.z)], [0.006, 0.006], 5, 1, 8), tin);
  b.add(limb([V(L.x - 0.09, L.y + 0.2, L.z), V(L.x - 0.06, L.y + 0.4, L.z + 0.02), V(L.x + 0.06, L.y + 0.4, L.z + 0.02), V(L.x + 0.09, L.y + 0.2, L.z)], [0.005, 0.005], 5, 1, 16), tin);
  const chim = new THREE.Mesh(lathe([[0.1, 0.04], [0.15, 0.062], [0.21, 0.06], [0.26, 0.042]], 14), emissive("#ffc060", 2.3));
  chim.position.copy(L); chim.layers.set(NOINK); R.add(chim);
  const wick = new THREE.Mesh(new THREE.PlaneGeometry(0.045, 0.09), new THREE.MeshBasicMaterial({ map: flameTex(0), color: new THREE.Color(3.2, 2.8, 2.0), transparent: true, depthWrite: false, fog: false }));
  wick.position.set(L.x, L.y + 0.175, L.z); wick.layers.set(NOINK); wick.renderOrder = 5; R.add(wick);
  const lanL = new THREE.PointLight("#ff9c48", 3.4, 9, 2); lanL.position.set(L.x, L.y + 0.2, L.z + 0.05); R.add(lanL);
  src.push({ halo: halo(R, V(L.x, L.y + 0.19, L.z), 1.5, LAMP, 0.8), flame: wick, light: lanL, base: 3.4, seed: 2,
    pool: [patch(R, poolTex(), V(L.x - 0.85, ty + 0.005, L.z + 0.75), V(L.x + 1.0, ty + 0.005, L.z + 0.75), V(L.x + 1.0, ty + 0.005, L.z - 0.5), V(L.x - 0.85, ty + 0.005, L.z - 0.5), "#ff9a3c", 0.55)] });

  // ---- food and drink: plates, bowl of poi, bottles, enamel cups, coconut halves, bananas, ukulele, a lei ----
  const put = (o: THREE.Object3D, x: number, z: number, y = ty + 0.006, ry = 0) => { o.position.set(x, y, z); o.rotation.y = ry; R.add(o); };
  put(flat(plateTex(0), 0.27, 0.27), -1.86, 0.52); put(flat(plateTex(2), 0.25, 0.25), -1.5, 0.56, ty + 0.007, 0.8); put(flat(plateTex(1), 0.27, 0.27), -0.95, 0.3, ty + 0.007, 0.6); put(flat(plateTex(2), 0.27, 0.27), -0.45, 0.48, ty + 0.008, 1.4); put(flat(plateTex(1), 0.24, 0.24), -0.9, -0.08, ty + 0.007, 2.2);
  put(flat(ukeTex(), 0.6, 0.225), -0.32, 0.12, ty + 0.03, 0.5);
  b.add(new THREE.BoxGeometry(0.5, 0.05, 0.19), lam("ukeSide", () => ({ color: "#8a5226" })), T(-0.36, ty + 0.004, 0.14, 0.5));
  for (const [x, z, m] of [[-1.05, 0.55, glassB], [-0.72, -0.1, glassG], [-0.62, -0.02, glassB]] as const) b.add(lathe([[0, 0.034], [0.01, 0.038], [0.13, 0.038], [0.17, 0.016], [0.24, 0.014], [0.245, 0.018], [0.255, 0.018]], 12), m, T(x, ty, z));
  for (const [x, z] of [[-1.02, 0.6], [-0.7, 0.36], [-1.95, -0.2], [-0.2, 0.52]]) { b.add(lathe([[0, 0.03], [0.07, 0.038], [0.075, 0.04]], 12), enamel, T(x, ty, z)); b.add(new THREE.TorusGeometry(0.022, 0.006, 6, 12), enamel, T(x + 0.045, ty + 0.04, z)); }
  b.add(lathe([[0, 0.05], [0.02, 0.1], [0.07, 0.125], [0.075, 0.12]], 16), lam("bowlWood", () => ({ color: "#6a4024" })), T(-1.22, ty, 0.12));
  b.add(new THREE.CircleGeometry(0.112, 16).rotateX(-Math.PI / 2), lam("poi", () => ({ color: "#8a6aa6" })), T(-1.22, ty + 0.062, 0.12));
  for (let i = 0; i < 4; i++) b.add(limb([V(-0.1 + i * 0.035, ty + 0.03, 0.36), V(-0.04 + i * 0.035, ty + 0.06, 0.28), V(-0.06 + i * 0.035, ty + 0.03, 0.18)], [0.012, 0.02, 0.01], 6, 1, 8), lam("banana", () => ({ color: "#f0d24a" })));
  const leiCols = ["#fff6e6", "#f7c948", "#f48fb1", "#ff9e57"]; // a lei left on the cloth
  for (let i = 0; i < 22; i++) { const a = (i / 22) * Math.PI * 2; b.add(new THREE.SphereGeometry(0.022, 6, 5), lam("leiF" + (i % 4), () => ({ color: leiCols[i % 4] })), T(-1.52 + Math.cos(a) * 0.13, ty + 0.02, -0.02 + Math.sin(a) * 0.085)); }

  // ---- tiki torches: bamboo pole, bound head, flame card + halo + pool + point light ----
  for (const [i, P] of [TORCH1, TORCH2].entries()) {
    b.add(limb([V(P[0], -0.1, P[2]), V(P[0] + 0.03, 0.9, P[2]), V(P[0] + 0.02, 1.75, P[2])], [0.032, 0.028, 0.026], 7, 0.4, 10), bamboo);
    b.add(lathe([[1.7, 0.03], [1.74, 0.07], [1.9, 0.085], [1.93, 0.05]], 10), lam("torchHead", () => ({ color: "#7a5a34" })), T(P[0] + 0.02, 0, P[2]));
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.6), new THREE.MeshBasicMaterial({ map: flameTex(i), color: new THREE.Color(2.6, 2.2, 1.6), transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide }));
    fl.position.set(P[0] + 0.02, 2.2, P[2]); fl.layers.set(NOINK); fl.renderOrder = 5; R.add(fl);
    const pl = new THREE.PointLight("#ff8a3a", 9, 12, 2); pl.position.set(P[0], 2.15, P[2] + 0.1); R.add(pl);
    src.push({ halo: halo(R, V(P[0] + 0.02, 2.2, P[2]), 2.6, WARM, 0.6), flame: fl, light: pl, base: 9, seed: 5 + i,
      pool: [patch(R, poolTex(), V(P[0] - 2.4, 0.04, P[2] + 2.4), V(P[0] + 2.4, 0.04, P[2] + 2.4), V(P[0] + 2.4, 0.04, P[2] - 2.4), V(P[0] - 2.4, 0.04, P[2] - 2.4), "#ff8a34", 0.42)] });
  }

  // ---- string of paper lanterns: two sagging lines from the lanai to poles in the yard ----
  const cols = ["#ffd27a", "#ff7a5a", "#ffe9b0", "#6fd0c0", "#ffb05a", "#ff9ab0"];
  const strands: [THREE.Vector3, THREE.Vector3][] = [[V(-2.2, 3.05, -4.9), V(3.1, 3.3, 2.4)], [V(-5.4, 3.05, -4.2), V(-3.6, 3.3, 3.0)], [V(3.1, 3.3, 2.4), V(5.6, 3.1, -6.5)]];
  for (const P of [strands[0][1], strands[1][1], strands[2][1]]) b.add(limb([V(P.x, -0.1, P.z), V(P.x, P.y + 0.1, P.z)], [0.05, 0.035], 7, 1, 6), M.woodDark);
  strands.forEach(([a, c], si) => {
    const n = si === 2 ? 12 : 13, pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 16; i++) { const t = i / 16; pts.push(a.clone().lerp(c, t).add(V(0, -0.75 * 4 * t * (1 - t), 0))); }
    b.add(limb(pts, [0.008, 0.008], 4, 1, 32), rope);
    for (let i = si === 1 ? 3 : si === 0 ? 1 : 0; i < n; i++) { // (the lantern nearest the eave is left off: it hung in front of the window in the curtain shot)
      const t = (i + 0.6) / n, p = a.clone().lerp(c, t).add(V(0, -0.75 * 4 * t * (1 - t) - 0.2, 0)), col = cols[(i + si * 2) % cols.length];
      const lan = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 8).scale(1, 1.15, 1), emissive(col, 1.6));
      lan.position.copy(p); lan.layers.set(NOINK); R.add(lan);
      b.add(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 8), rope, T(p.x, p.y + 0.18, p.z)); b.add(new THREE.CylinderGeometry(0.06, 0.06, 0.03, 8), rope, T(p.x, p.y - 0.18, p.z));
      src.push({ halo: halo(R, p, 0.8, col, 0.26), base: 1, seed: 20 + si * 10 + i });
    }
  });

  // ---- ALOHA board on two posts by the lanai steps, lit by its own little lamp ----
  const sx = -1.25, sz = -2.6;
  for (const s of [-1, 1]) b.add(boxGeo(V(sx + s * 0.85 - 0.04, 0, sz - 0.04), V(sx + s * 0.85 + 0.04, 2.78, sz + 0.04), 1), M.woodDark);
  b.add(boxGeo(V(sx - 0.95, 2.2, sz - 0.02), V(sx + 0.95, 2.8, sz + 0.02), 0, true), M.woodDark);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.56), new THREE.MeshBasicMaterial({ map: alohaSign(), color: new THREE.Color(0.95, 0.8, 0.62), fog: false }));
  sign.position.set(sx, 2.5, sz + 0.03); sign.layers.set(NOINK); R.add(sign);
  src.push({ halo: halo(R, V(sx, 2.58, sz + 0.2), 2.3, "#ffb060", 0.2), base: 1, seed: 60 });

  // ---- bottom of the wide: a crate of coconuts, a calabash and a bottle on the mat by the lens ----
  b.add(boxGeo(V(0.72, 0, 2.55), V(1.28, 0.34, 3.0), 0.6, true), M.wood);
  for (const [x, z] of [[0.86, 2.68], [1.08, 2.7], [0.97, 2.88], [1.16, 2.9]]) b.add(new THREE.SphereGeometry(0.105, 12, 9), M.nut, T(x, 0.4, z));
  b.add(lathe([[0, 0.08], [0.03, 0.17], [0.12, 0.2], [0.2, 0.15], [0.22, 0.16]], 16), lam("calabash", () => ({ color: "#8a5a30" })), T(0.2, 0.02, 3.05));
  b.add(lathe([[0, 0.034], [0.01, 0.038], [0.13, 0.038], [0.17, 0.016], [0.24, 0.014], [0.255, 0.018]], 12), glassG, T(0.5, 0.02, 3.2));
  b.build(R);

  // ---- house windows and door: emissive panes + halo + window-shaped patches on the lanai deck and the yard ----
  const H = new THREE.Group(); H.position.set(HOUSE.x, 0, HOUSE.z); H.rotation.y = HOUSE.yaw; R.add(H);
  const wm = emissive("#ffffff", 1.75, windowGlow());
  for (const wx of [1.4 - 3.6, 5.8 - 3.6]) {
    const w = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.1), wm); w.position.set(wx, 0.7 + 2.7 * 0.555, 2.505); w.layers.set(NOINK); H.add(w);
    halo(H, V(wx, 2.2, 2.7), 3.4, "#ffb860", 0.34);
    patch(H, paneTex(), V(wx - 0.55, 0.705, 4.38), V(wx + 0.75, 0.705, 4.38), V(wx + 0.45, 0.705, 2.55), V(wx - 0.45, 0.705, 2.55), "#ffb050", 0.75);        // on the lanai deck
    patch(H, paneTex(), V(wx - 1.2, 0.04, 8.2), V(wx + 1.6, 0.04, 8.2), V(wx + 0.8, 0.04, 4.6), V(wx - 0.6, 0.04, 4.6), "#ff9c40", 0.5);                     // thrown out onto the yard
  }
  const door = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 1.9), emissive("#ffc070", 1.5)); door.position.set(0, 0.7 + 0.95, 2.506); door.layers.set(NOINK); H.add(door);
  patch(H, poolTex(), V(-1.5, 0.04, 9.4), V(1.9, 0.04, 9.4), V(0.75, 0.04, 4.4), V(-0.55, 0.04, 4.4), "#ffa040", 0.55);
  const hl = new THREE.PointLight("#ff9c48", 14, 14, 2); hl.position.set(0, 2.0, 4.0); H.add(hl);
  src.push({ light: hl, base: 14, seed: 70 });
  return src;
}
