// The orange film's world: ten small sets built once from the Niihau kit; each take shows one set under one look.
// Same lighting model as Niihau (kit two-tone + sun with shadows, sky gradient, painted clouds); flat 2D cast on cards.
import * as THREE from "three";
import { Batch, lam, boxGeo, V } from "../film/build";
import { cloudHD, ctex } from "../film/paint";
import { TONE, CHAR, untone } from "../film/shade";
import { NOINK } from "../film/ink";
import { Pool, Actor, Fx } from "../film/cards";
import { nightAll, halo, NIGHT } from "../film/night";
import { quadUV, limb } from "../film/geo";
import { stage } from "./cast";
import { camAt, takeAt, SETS, SetName, LookName, ORIGIN, W, L, TOTAL } from "./story";
import { GROUND, ground, flatHouse, gableHouse, dutchHouse, chinaHouse, stall, orangePile, crate, orangeTree, palm, hangingSign, signTex, Sign, daySea, caravel, quay, hill, palace, awning, KM } from "./sets";

type C3 = readonly [number, number, number];
type Look = { lit: C3; shade: C3; lift: C3; sat: number; sky: string[]; e: number[]; fog: string; fogNear: number; fogFar: number; az: number; el: number; cloud: [number, number, number]; vig: number };
export const LOOKS: Record<LookName, Look> = {
  day: { lit: [1.58, 1.5, 1.33], shade: [0.3, 0.29, 0.36], lift: [0.05, 0.06, 0.11], sat: 1.08, sky: ["#cfe0f2", "#a9c8ec", "#7aa8e2", "#5b92dc", "#3d7bd0"], e: [0, 1.6, 4.5, 9, 22], fog: "#cfe0f2", fogNear: 40, fogFar: 420, az: -110, el: 42, cloud: [1.1, 1.1, 1.1], vig: 0.2 },
  warm: { lit: [1.66, 1.42, 1.08], shade: [0.34, 0.27, 0.36], lift: [0.06, 0.05, 0.1], sat: 1.1, sky: ["#f8dcb0", "#f2cfa8", "#c9c6dc", "#8fb0e0", "#5f90d6"], e: [0, 2, 6, 14, 30], fog: "#f2d8b4", fogNear: 40, fogFar: 380, az: -125, el: 30, cloud: [1.15, 1.02, 0.92], vig: 0.22 },
  gold: { lit: [1.6, 1.1, 0.62], shade: [0.36, 0.26, 0.48], lift: [0.06, 0.05, 0.12], sat: 1.06, sky: ["#ffc98a", "#f8ae80", "#de8e8e", "#a07cae", "#5f5fa6"], e: [0, 3, 9, 20, 45], fog: "#eeb090", fogNear: 40, fogFar: 300, az: 150, el: 13, cloud: [1.2, 0.86, 0.76], vig: 0.26 },
};
export type SignRef = { s: Sign; at: [number, number, number] };

export class World {
  root = new THREE.Group();
  vig = 0.2;
  private pool = new Pool(); private actors: Actor[] = []; private fxs: Fx[] = [];
  private sun = new THREE.DirectionalLight("#ffffff", 0);
  private skyMat: THREE.ShaderMaterial; private sky: THREE.Mesh;
  private fog = new THREE.Fog("#cfe0f2", 40, 420);
  private far: THREE.Object3D[] = []; private clouds: THREE.Mesh[] = [];
  sets = {} as Record<SetName, THREE.Group>;
  signs = {} as Record<string, Sign>;
  piles: THREE.Group[] = []; boat!: THREE.Group; seaSwell: THREE.Texture[] = [];
  chain: Sign[] = [];
  private frustum = new THREE.Frustum(); private m4 = new THREE.Matrix4(); private v = new THREE.Vector3(); private sph = new THREE.Sphere();
  constructor() {
    const R = this.root, M = KM();
    this.skyMat = new THREE.ShaderMaterial({
      uniforms: { c0: { value: new THREE.Color() }, c1: { value: new THREE.Color() }, c2: { value: new THREE.Color() }, c3: { value: new THREE.Color() }, c4: { value: new THREE.Color() }, e: { value: new THREE.Vector4() } },
      vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `uniform vec3 c0, c1, c2, c3, c4; uniform vec4 e; varying vec3 vP;
        void main(){ float el = asin(clamp(normalize(vP).y, -1.0, 1.0));
          vec3 c = mix(c0, c1, smoothstep(0.0, e.x, el)); c = mix(c, c2, smoothstep(e.x, e.y, el)); c = mix(c, c3, smoothstep(e.y, e.z, el)); c = mix(c, c4, smoothstep(e.z, e.w, el));
          gl_FragColor = vec4(c, 1.0); }`,
      side: THREE.BackSide, depthWrite: false, fog: false,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1400, 48, 24), this.skyMat); this.sky.renderOrder = -1; this.sky.frustumCulled = false; this.sky.layers.set(NOINK); R.add(this.sky);
    this.sun.castShadow = true; this.sun.shadow.mapSize.set(4096, 4096); R.add(this.sun, this.sun.target);
    const D2R = Math.PI / 180;
    for (const [azd, eld, w, k] of [[-34, 2.6, 160, 0], [-17, 6.2, 220, 1], [-4, 3.2, 130, 2], [9, 7.6, 250, 3], [22, 3.4, 170, 0], [36, 6, 200, 1], [-27, 11.5, 260, 2], [3, 13.5, 290, 3], [28, 12, 240, 0], [-10, 19, 320, 1], [18, 21, 300, 2]]) {
      const a = azd * D2R, m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: cloudHD(k), transparent: true, depthWrite: false, fog: false }));
      m.position.set(Math.sin(a) * 1000, 1000 * Math.tan(eld * D2R), -Math.cos(a) * 1000); m.scale.set(w, w / 2, 1); m.renderOrder = -0.6; m.layers.set(NOINK); m.frustumCulled = false; m.userData.p = m.position.clone(); R.add(m); this.clouds.push(m);
    }
    const group = (n: SetName) => { const g = new THREE.Group(); const o = ORIGIN(n); g.position.set(o[0], o[1], o[2]); this.sets[n] = g; R.add(g); return g; };
    const sign = (G: THREE.Group, key: string, x: number, z: number, w: number, text: string, y = 2.55) => { const s = hangingSign(G, x, z, w, y); s.set(signTex(text)); this.signs[key] = s; return s; };
    // ================= INDIA: an orange orchard by a village =================
    { const G = group("india"), b = new Batch(); ground(b, GROUND.earth());
      for (let r = 0; r < 4; r++) for (let i = 0; i < 7; i++) { const x = -13 + i * 4.2 + (r % 2) * 2.1; if (Math.abs(x) < 2.2 && r < 2) continue; orangeTree(b, x, -6 - r * 4.5, 1.0 + 0.1 * ((i + r) % 3), 100 + r * 10 + i); }
      flatHouse(b, -8.5, -26, 6, 5, 3.4, "#e9b97a", "#3f6aa8"); flatHouse(b, 7.5, -28, 5, 5, 3.0, "#f1d6a6", "#8c3b4a");
      palm(b, M, -12, -32, 9, [1.2, 0.3], 31); palm(b, M, 12, -30, 8.4, [-1, 0.4], 32); palm(b, M, 3, -38, 9.2, [0.6, 0], 33);
      hill(b, -40, -120, 70, 22, 30, "#8fae78", 3); hill(b, 50, -140, 90, 28, 40, "#7c9e6a", 5);
      b.build(G); sign(G, "india", -1.35, -1.6, 1.8, "NARANGA");
    }
    // ================= PERSIA: a caravan town: domes, sand, camels =================
    { const G = group("persia"), b = new Batch(); ground(b, GROUND.sand());
      flatHouse(b, -7, -11, 7, 6, 4.2, "#e7d2a6", "#2f6f8a", { dome: "#3f8fa8" }); flatHouse(b, 1, -13, 6, 6, 5.0, "#dcc296", "#8c3b4a", { dome: "#e8b93e" });
      flatHouse(b, 8.5, -10, 6, 5, 3.6, "#efdcb4", "#2f6f8a", { awning: "#c2352c/#f3e2b8" }); flatHouse(b, -14, -16, 6, 5, 3.4, "#e3c89a", "#3f6aa8");
      palm(b, M, -3, -18, 9, [0.8, 0], 41); palm(b, M, 5, -20, 8, [-0.8, 0.2], 42);
      hill(b, 0, -160, 140, 26, 40, "#d9b78a", 7);
      // the painter's easel
      const wood = lam("easel", () => ({ color: "#7a5232" }));
      b.add(boxGeo(V(3.6, 0, -0.95), V(3.66, 1.9, -0.9)), wood); b.add(boxGeo(V(4.5, 0, -0.95), V(4.56, 1.9, -0.9)), wood); b.add(boxGeo(V(3.55, 0.85, -0.95), V(4.6, 0.9, -0.85)), wood);
      b.build(G); sign(G, "persia", 1.6, -1.2, 2.0, "NARANGA"); }
    // ================= ARABIA: a souk with arches and striped awnings =================
    { const G = group("arab"), b = new Batch(); ground(b, GROUND.dry());
      flatHouse(b, -6.5, -8, 6, 5, 4.6, "#f1e6d0", "#2f6f8a", { awning: "#2f6f8a/#f3e2b8" }); flatHouse(b, 0.5, -9, 6, 5, 5.2, "#eadcc0", "#8c3b4a", { dome: "#f1e6d0", awning: "#c2352c/#f3e2b8" });
      flatHouse(b, 7.5, -8, 6, 5, 4.2, "#f4ead6", "#3f6aa8", { awning: "#e8b93e/#f3e2b8" });
      const top = stall(b, 0.6, -1.6, 2.4, "#2f6f8a/#f3e2b8"); crate(b, 2.3, -1.2, 0.7, 0.45, 0.5); crate(b, -0.9, -1.0, 0.6, 0.4, 0.5);
      palm(b, M, -11, -14, 9, [1, 0], 51);
      b.build(G); orangePile(G, V(top.x - 0.5, top.y, top.z), 40, 0.42, 3); orangePile(G, V(top.x + 0.5, top.y, top.z), 34, 0.38, 4);
      sign(G, "arab", -1.6, -1.1, 2.0, "NARANG"); }
    // ================= PORTUGAL: the quay, a caravel alongside =================
    { const G = group("quay"), b = new Batch(); b.add(quadUV(V(-70, 0, 30), V(70, 0, 30), V(70, 0, -4), V(-70, 0, -4), 0, 0, 30, 8), GROUND.cobble());
      quay(b, -70, 70, -4, -4.6); hill(b, 0, -300, 200, 30, 60, "#9ab48a", 9); hill(b, -60, -260, 80, 22, 40, "#9ab48a", 11);
      b.build(G);
      const hb = new Batch(); [[-10, -1, "#f4f0e6", "#2f5ea8"], [-15.5, -1.5, "#f2d8a6", "#2f6a43"], [10.5, -0.5, "#f6efe2", "#8c3b4a"], [16, -1.5, "#e9c99a", "#2f5ea8"]].forEach(([x, z, w, s]) => gableHouse(hb, x as number, z as number, 5, 7, 6, w as string, s as string, "#c9775a", { ry: 0 })); hb.build(G);
      const S2 = new THREE.Group(); S2.position.y = -0.9; G.add(S2); this.seaSwell.push(daySea(S2, -4.6, "#2f7fc4", "#a9d0ec").swell);
      const sh = caravel(G, 1); sh.position.set(3, -0.9, -12); sh.rotation.y = 0.75;
      const cb = new Batch(); crate(cb, -2.2, -2.6, 0.8, 0.5, 0.6); crate(cb, -1.4, -2.9, 0.8, 0.5, 0.6); cb.build(G); orangePile(G, V(-2.2, 0.5, -2.6), 18, 0.3, 5);
      sign(G, "quay", 0.6, -1.6, 2.0, "LARANJA"); }
    // ================= EUROPE: a town square =================
    { const G = group("europe"), b = new Batch(); ground(b, GROUND.cobble());
      [[-9.5, -9, "#f2e2c4", "#8c3b4a", true], [-4, -11, "#e6d2b0", "#2f6a43", false], [1.6, -11.5, "#f4efe2", "#2f5ea8", true], [7.2, -10.5, "#e9c99a", "#8c3b4a", false], [12.5, -9, "#f2e2c4", "#2f6a43", true]].forEach(([x, z, w, s, t]) => gableHouse(b, x as number, z as number, 5, 6, 7, w as string, s as string, "#b8574a", { timber: t as boolean, steep: 0.6 }));
      const st = lam("fountain", () => ({ color: "#c9c2b4" })); b.add(new THREE.CylinderGeometry(1.4, 1.5, 0.6, 24), st, new THREE.Matrix4().makeTranslation(-4.5, 0.3, -4.5)); b.add(new THREE.CylinderGeometry(0.18, 0.22, 1.8, 12), st, new THREE.Matrix4().makeTranslation(-4.5, 1.2, -4.5)); b.add(new THREE.CylinderGeometry(0.6, 0.3, 0.25, 16), st, new THREE.Matrix4().makeTranslation(-4.5, 2.1, -4.5));
      const top = stall(b, 2.6, -2.2, 2.2, "#c2352c/#f3e2b8");
      b.build(G); orangePile(G, V(top.x, top.y, top.z), 44, 0.5, 6);
      sign(G, "europe", 0, -1.0, 2.7, "A NARANGE", 2.75); }
    // ================= OPEN SEA: the caravel sailing east =================
    { const G = group("sea"); const S2 = new THREE.Group(); S2.position.y = 0; G.add(S2); this.seaSwell.push(daySea(S2, 60, "#2a78c0", "#b4d6ee", 1600).swell);
      this.boat = caravel(G, 1); this.boat.position.set(0, 0, 0); this.boat.rotation.y = 0.45; }
    // ================= CHINA: a port with red houses and jade roofs =================
    { const G = group("china"), b = new Batch(); b.add(quadUV(V(-70, 0, 30), V(70, 0, 30), V(70, 0, -3.5), V(-70, 0, -3.5), 0, 0, 30, 8), GROUND.cobble());
      quay(b, -70, 70, -3.5, -4.1); chinaHouse(b, -9, 0.5, 6, 5, 3.6); chinaHouse(b, 9.5, 0.5, 6, 5, 3.4);
      { const fb = new Batch(); fb.add(quadUV(V(-120, -0.5, -34), V(120, -0.5, -34), V(120, -0.5, -70), V(-120, -0.5, -70)), GROUND.cobble());
        [[-22, -40], [-12, -42], [-2, -41], [9, -43], [20, -40], [30, -42]].forEach(([x, z], i) => chinaHouse(fb, x, z, 7, 6, 4 + (i % 2) * 1.5));
        const tierM = lam("pagodaRed", () => ({ color: "#c0473a" })), roofM = lam("oroofJade2", () => ({ color: "#3f6a52" }));
        for (let k = 0; k < 4; k++) { fb.add(boxGeo(V(-2.2 + k * 0.4, 0, -2.2 + k * 0.4), V(2.2 - k * 0.4, 2.6, 2.2 - k * 0.4)), tierM, new THREE.Matrix4().makeTranslation(4, -0.5 + k * 3.2, -50)); fb.add(new THREE.ConeGeometry(3.6 - k * 0.5, 1.0, 4), roofM, new THREE.Matrix4().makeRotationY(Math.PI / 4).setPosition(4, -0.5 + k * 3.2 + 3.1, -50)); }
        const g2 = new THREE.Group(); fb.build(g2); G.add(g2); }
      { const lb = new Batch(), lan = lam("lantern", () => ({ color: "#d9382c" })), rope = lam("rope", () => ({ color: "#4a3426" }));
        lb.add(limb([V(-4, 3.3, -0.6), V(-1.4, 2.95, -0.6), V(1.2, 3.0, -0.6), V(4, 3.35, -0.6)], [0.015, 0.015, 0.015, 0.015], 4, 1, 12), rope);
        for (const x of [-3, -1.8, -0.6, 0.6, 1.8, 3]) lb.add(new THREE.SphereGeometry(0.18, 12, 9).scale(1, 1.25, 1), lan, new THREE.Matrix4().makeTranslation(x, 2.72 + 0.03 * Math.abs(x), -0.6));
        lb.build(G); }
      hill(b, -40, -220, 70, 40, 30, "#7c9e8a", 13); hill(b, 30, -260, 90, 55, 40, "#8aa898", 14);
      const top = stall(b, -1.4, -1.6, 2.2, "#d9382c/#f3e2b8");
      b.build(G); orangePile(G, V(top.x, top.y, top.z), 40, 0.5, 7);
      const S2 = new THREE.Group(); S2.position.y = -0.9; G.add(S2); this.seaSwell.push(daySea(S2, -4.1, "#2a7aa8", "#b4d6e2").swell);
      const sh = caravel(G, 1); sh.position.set(-7, -0.9, -20); sh.rotation.y = Math.PI - 0.7; }
    // ================= SINTRA: a hill town with a palace and orange groves =================
    { const G = group("sintra"), b = new Batch(); ground(b, GROUND.grass(), 160, 140);
      b.add(quadUV(V(-1.6, 0.01, 20), V(1.6, 0.01, 20), V(1.6, 0.01, -40), V(-1.6, 0.01, -40), 0, 0, 1, 12), GROUND.cobble());
      hill(b, 0, -62, 40, 16, 26, "#6f9a58", 15); palace(b, 0, 13.5, -60, 1.2); hill(b, -60, -90, 50, 26, 30, "#7fa868", 16); hill(b, 55, -95, 50, 22, 30, "#86ad6c", 17);
      [[-8, -12], [-5, -16], [7, -13], [10, -18], [4, -20], [-11, -20]].forEach(([x, z], i) => gableHouse(b, x, z, 4.5, 5, 4.2, "#f6f1e6", i % 2 ? "#2f5ea8" : "#e8b93e", "#c9775a", { steep: 0.5 }));
      for (let i = 0; i < 6; i++) { orangeTree(b, -4 - (i % 3) * 3.3, -3 - Math.floor(i / 3) * 3.6, 1.0, 200 + i); orangeTree(b, 4 + (i % 3) * 3.3, -3.5 - Math.floor(i / 3) * 3.6, 1.0, 220 + i); }
      // the fruit cart
      const wood = lam("cartWood", () => ({ color: "#8a5a34" })); b.add(boxGeo(V(-0.9, 0.55, -2.0), V(0.9, 1.0, -1.0)), wood);
      for (const sx of [-0.95, 0.95]) b.add(new THREE.CylinderGeometry(0.42, 0.42, 0.08, 18), lam("wheel", () => ({ color: "#5a3a24" })), new THREE.Matrix4().makeRotationZ(Math.PI / 2).setPosition(sx, 0.42, -1.5));
      b.add(boxGeo(V(0.9, 0.65, -1.55), V(2.2, 0.72, -1.45)), wood);
      b.build(G); orangePile(G, V(0, 0.95, -1.5), 70, 0.7, 8);
      sign(G, "sintra", -2.6, -0.4, 1.6, "SINTRA"); }
    // ================= THE DUTCH: canal houses and a fruit stall =================
    { const G = group("dutch"), b = new Batch(); ground(b, GROUND.cobble());
      [-7.5, -4.2, -0.9, 2.4, 5.7, 9.0].forEach((x, i) => dutchHouse(b, x, -11, 3.3, 7 + (i % 3) * 1.2, ["#f1ead6", "#e9d2b4", "#f4efe2"][i % 3], ["#2f6a43", "#8c3b4a", "#2f5ea8"][i % 3]));
      const wat = lam("canal", () => ({ color: "#4f7fa8" })); b.add(quadUV(V(-40, 0.01, -6.2), V(40, 0.01, -6.2), V(40, 0.01, -7.4), V(-40, 0.01, -7.4)), wat);
      const top = stall(b, 0.4, -1.6, 2.6, "#e86e2a/#f3e2b8");
      b.build(G); orangePile(G, V(top.x - 0.7, top.y, top.z), 36, 0.45, 9); orangePile(G, V(top.x + 0.8, top.y, top.z), 30, 0.4, 10);
      const s = hangingSign(G, 0.3, -1.25, 3.0, 2.95, 0, false); s.set(signTex("SINAASAPPEL", { small: "= \"CHINA'S APPLE\"" })); this.signs.dutch = s; }
    // ================= INDIA, 1500s: the port, a Portuguese ship, the fruit stall =================
    { const G = group("port"), b = new Batch(); b.add(quadUV(V(-70, 0, 30), V(70, 0, 30), V(70, 0, -4), V(-70, 0, -4), 0, 0, 14, 4), GROUND.earth());
      quay(b, -70, 70, -4, -4.6);
      flatHouse(b, -9, -1.5, 6, 5, 4.0, "#e9b97a", "#3f6aa8", { awning: "#c2352c/#f3e2b8" }); flatHouse(b, -15, -1.0, 5, 5, 3.4, "#f1d6a6", "#2f6a43");
      flatHouse(b, 11, -1.0, 6, 5, 3.8, "#efc79a", "#8c3b4a", { dome: "#f1e6d0" });
      palm(b, M, -6, -3.4, 8.6, [0.8, 0.1], 61); palm(b, M, 7.5, -3.2, 9.0, [-1, 0.2], 62);
      const top = stall(b, 0, -1.6, 2.6, "#e86e2a/#f6e7c0");
      const label = lam("crateStencil", () => ({ map: signTex("LARANJA DE SINTRA", { board: "#d8b27a", ink: "#3a2a20" }) })); this.crateLabel = label as THREE.MeshLambertMaterial;
      crate(b, 1.85, -0.75, 1.1, 0.62, 0.62, label); crate(b, 2.7, -1.3, 0.9, 0.5, 0.6);
      hill(b, 0, -320, 220, 26, 60, "#9ab48a", 18);
      b.build(G);
      this.piles = [orangePile(G, V(top.x - 0.8, top.y, top.z), 40, 0.45, 11), orangePile(G, V(top.x, top.y, top.z), 50, 0.5, 12), orangePile(G, V(top.x + 0.85, top.y, top.z), 40, 0.45, 13)];
      const S2 = new THREE.Group(); S2.position.y = -0.9; G.add(S2); this.seaSwell.push(daySea(S2, -4.6, "#2f7fc4", "#a9d0ec").swell);
      const sh = caravel(G, 1); sh.position.set(5, -0.9, -12.5); sh.rotation.y = 0.7;
      sign(G, "port", -1.5, -1.2, 2.0, "SINTRA");
      // the ending: the whole chain of names hanging along the street on a rope between posts
      const names = ["NARANGA", "NARANG", "NARANJ", "LARANJA", "ORANGE", "SANTRA"]; // the whole journey, two rows on ropes over the street
      names.forEach((n, i) => { const r = Math.floor(i / 3), k = i % 3; const s = hangingSign(G, -2.4 + k * 2.4, -2.6, 2.0, 5.0 - r * 1.25, 0, false); s.set(signTex(n)); this.chain.push(s); });
      const pb = new Batch(), rope = lam("rope", () => ({ color: "#4a3426" })), postM = lam("signPost", () => ({ color: "#7a5232" }));
      for (const x of [-4.0, 4.0]) pb.add(boxGeo(V(x - 0.1, 0, -2.7), V(x + 0.1, 5.9, -2.5)), postM);
      for (const y of [5.0 + 0.135 + 0.45 + 0.02, 3.75 + 0.135 + 0.45 + 0.02]) pb.add(limb([V(-4.0, y + 0.05, -2.6), V(0, y - 0.04, -2.6), V(4.0, y + 0.05, -2.6)], [0.02, 0.02, 0.02], 5, 1, 10), rope);
      const pg = new THREE.Group(); pb.build(pg); G.add(pg); this.chainPosts = pg;
    }
    nightAll(R);
    void halo; void awning; void ctex;
  }
  chainPosts!: THREE.Group; crateLabel!: THREE.MeshLambertMaterial;
  private actor(i: number) { while (this.actors.length <= i) this.actors.push(new Actor(this.root)); return this.actors[i]; }
  private fx(i: number) { while (this.fxs.length <= i) this.fxs.push(new Fx(this.root)); return this.fxs[i]; }

  update(f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene, rf = f) {
    const t = takeAt(f), Lk = LOOKS[t.look], c = camAt(f), D2R = Math.PI / 180, o = ORIGIN(t.set);
    for (const k of SETS) this.sets[k].visible = k === t.set;
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.1; cam.far = 2400; cam.updateProjectionMatrix(); cam.updateMatrixWorld(); cam.layers.enable(NOINK);
    const az = Lk.az * D2R, el = Lk.el * D2R, sunDir = V(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
    const centre = V(Math.round(c.look[0]), 0.5, Math.round(c.look[2]) + 2), Rr = 16;
    this.sun.position.copy(centre).addScaledVector(sunDir, 120); this.sun.target.position.copy(centre);
    const sc = this.sun.shadow.camera; sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 20; sc.far = 260; sc.updateProjectionMatrix();
    this.sun.shadow.bias = -0.0004; this.sun.shadow.normalBias = 0.03;
    TONE.uLitCol.value.set(...Lk.lit); TONE.uShadeCol.value.set(...Lk.shade); TONE.uShadeLift.value.set(...Lk.lift);
    TONE.uLambert.value = 0.35; TONE.uSideK.value = 0.83; TONE.uTerm.value = 0.22; TONE.uBounce.value.set(0, 0, 0); TONE.uSat.value = Lk.sat; NIGHT.uPtK.value = 0;
    CHAR.uCharTint.value.set(1, 0.97, 0.95); CHAR.uCharShade.value = 0.88; CHAR.uGrad.value = 0.07; CHAR.uBodyGrad.value = 0.2; CHAR.uSideTint.value.set(0.92, 0.9, 0.98);
    const su = this.skyMat.uniforms; Lk.sky.forEach((h, i) => untone(h, su["c" + i].value));
    const e = Lk.e.map((d) => d * D2R); su.e.value.set(e[1], e[2], e[3], e[4]);
    this.sky.position.copy(cam.position);
    untone(Lk.fog, this.fog.color); this.fog.near = Lk.fogNear; this.fog.far = Lk.fogFar; scene.fog = this.fog; scene.background = null;
    for (const m of this.clouds) { m.position.copy(m.userData.p as THREE.Vector3).add(cam.position); m.lookAt(cam.position.x, m.position.y, cam.position.z); (m.material as THREE.MeshBasicMaterial).color.setRGB(...Lk.cloud); }
    for (const s of this.seaSwell) s.offset.set((rf * 0.0006) % 1, (rf * 0.0011) % 1);
    // ---- the signs ----
    const sw = (s: Sign, k: number) => { s.g.rotation.x = 0.05 * Math.sin(rf * 0.09 + k) * 0.6; };
    for (const [k, s] of Object.entries(this.signs)) sw(s, k.length);
    const ps = this.signs.persia; ps.set(signTex(f >= W.narang2 - 4 ? "NARANG" : "NARANGA", f >= W.narang2 - 4 ? { small: " " } : {}));
    { const s = this.signs.arab, a0 = W.naranj - 6, k = Math.max(0, Math.min(1, (f - a0) / 8)); s.set(signTex(k >= 0.5 ? "NARANJ" : "NARANG")); s.g.rotation.x = Math.sin(Math.PI * k) * 1.4 * (k < 1 ? 1 : 0) + (k >= 1 ? 0.05 * Math.sin(rf * 0.09) : 0); s.board.scale.y = k > 0 && k < 1 ? Math.max(0.05, Math.abs(Math.cos(Math.PI * k))) : 1; }
    { const s = this.signs.europe, land = W.fell + 4; s.set(f < W.theN ? signTex("A NARANGE") : f < land ? signTex("A NARANGE", { skip: [2] }) : signTex("AN ORANGE")); if (f >= land && f < land + 8) s.g.rotation.x = 0.18 * Math.sin((f - land) * 1.3) * (1 - (f - land) / 8); }
    { const s = this.signs.port; s.set(f >= W.santra ? signTex("SANTRA") : signTex("SINTRA")); if (f >= W.santra && f < W.santra + 10) { const k = (f - W.santra) / 10; s.board.scale.setScalar(1 + 0.25 * Math.sin(Math.PI * k) * (1 - k)); } else s.board.scale.setScalar(1); }
    const ending = t.id === "end"; for (const s of this.chain) s.g.parent!.visible = ending; this.chainPosts.visible = ending; this.signs.port.g.parent!.visible = !ending;
    { const k = f >= W.sintraW && f < W.santra ? Math.min(1, (f - W.sintraW) / (W.fast - W.sintraW)) : 0, bl = Math.round(k * 5) * 3, tx = signTex("LARANJA DE SINTRA", { board: "#d8b27a", ink: "#3a2a20", blur: bl }); if (this.crateLabel.map !== tx) { this.crateLabel.map = tx; this.crateLabel.needsUpdate = true; } }
    // the stall fills with oranges on SANTRA
    const fill = f < W.santra ? 0.35 : Math.min(1.15, 0.35 + 0.8 * Math.min(1, (f - W.santra) / 6)) - (f >= W.santra + 6 ? 0.15 * Math.min(1, (f - W.santra - 6) / 6) : 0);
    this.piles.forEach((p, i) => { const k = Math.max(0.01, fill - (f >= W.santra ? 0 : i === 1 ? 0 : 0.2)); p.scale.setScalar(k); });
    // the caravel at sea moves east
    if (t.set === "sea") { const u = (f - TAKES_SEA_A()) / 60; this.boat.position.set(u * 6, 0.15 * Math.sin(rf * 0.12), 0); this.boat.rotation.set(0.03 * Math.sin(rf * 0.09), 0.45, 0.02 * Math.sin(rf * 0.11)); }
    this.vig = Lk.vig;
    // ---- cast + effects (cards) ----
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0);
    const st = stage(f, { pos: cam.position, right, sun: sunDir }, rf, o);
    this.frustum.setFromProjectionMatrix(this.m4.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
    let ai = 0; const used: Actor[] = [];
    for (const p of st.places) {
      const s2 = p.scale ?? 1;
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y + 1.1 * s2, p.z), 3.5))) continue;
      const a = this.actor(ai++), [w, h, k] = p.size ?? [300, 500, 0.5];
      a.r = this.pool.req(p.key, w, h, k, p.draw); a.mesh.visible = true; a.mesh.position.set(p.x, p.y, p.z);
      a.mesh.rotation.set(0, p.yaw ?? Math.atan2(cam.position.x - p.x, cam.position.z - p.z), p.roll ?? 0); a.mesh.scale.set(p.mirror ? -s2 : s2, s2, s2); used.push(a);
    }
    for (let i = ai; i < this.actors.length; i++) this.actors[i].mesh.visible = false;
    let fi = 0; const fused: [Fx, number, number][] = [];
    for (const p of st.fx) {
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y, p.z), Math.max(Math.abs(p.w), p.h)))) continue;
      const ef = this.fx(fi++); ef.r = this.pool.req(p.key, p.cw, p.ch, 1, p.draw); ef.use(!!p.soft); ef.mesh.visible = true; ef.mesh.position.set(p.x, p.y, p.z);
      if (p.flat) ef.mesh.rotation.set(-Math.PI / 2, 0, p.rot ?? 0); else { ef.mesh.quaternion.copy(cam.quaternion); ef.mesh.rotateZ(p.rot ?? 0); }
      ef.mesh.scale.set(p.w, p.h, 1); fused.push([ef, p.tint ?? 1, p.alpha ?? 1]);
    }
    for (let i = fi; i < this.fxs.length; i++) this.fxs[i].mesh.visible = false;
    this.pool.flush(); for (const a of used) a.bind(); for (const [ef, tint, alpha] of fused) ef.bind(tint, alpha);
    void L; void TOTAL;
  }
}
import { TAKES } from "./story";
const TAKES_SEA_A = () => TAKES.find((x) => x.id === "sea")!.a;
