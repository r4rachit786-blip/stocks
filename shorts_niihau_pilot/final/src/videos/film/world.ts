// The film's world: four sets (field, lanai, studio, museum) built once; each shot shows one set under one look.
// Lighting model for every look = night.ts (two-tone key/shade colours + real point lights from visible sources).
// On the island there is NO electric light (1941, no power): kerosene lanterns, candle paper lanterns on cord,
// torches, fires, moon, the battery radio dial. Electric light only in the briefing insert and the museum.
import * as THREE from "three";
import { Batch, lam, boxGeo } from "./build";
import { cloudHD, ctex, rep } from "./paint";
import { TONE, CHAR, untone } from "./shade";
import { NOINK } from "./ink";
import { Pool, Actor, Fx } from "./cards";
import { stage } from "./cast";
import { camAt, inShot, MOON, HOUSE, LookName, SetName, TABLE } from "./story";
import { V, rng, quadUV, limb, rock } from "./geo";
import { islandTex, dryGroundHD } from "./paintx";
import { seaNight, glitterTex, starsTex, flameTex, grainWood, windowGlow } from "./paint3";
import { boardWall } from "./paintx";
import { buildPlane } from "./plane";
import { mats, buildGround, buildEarth, buildRocks, stoneWall, buildFence, palm, kiawe, buildHouse, buildTufts, buildWindmill, spinWindmill } from "./set";
import { buildParty, Source } from "./props";
import { nightAll, halo, patch, poolTex, NIGHT, emissive } from "./night";
import { curtains } from "./art2d";
import { Pen } from "./toon";

type C3 = readonly [number, number, number];
type Look = { lit: C3; shade: C3; lift: C3; sat: number; ptK: number; sky: string[]; e: number[]; fog: string; fogNear: number; fogFar: number; az: number; el: number; night: boolean; cloud: number; sea: C3; vig: number };
export const LOOKS: Record<LookName, Look> = {
  // kit day preset; key from upper screen-left (lights the plane's near flank and the faces)
  day: { lit: [1.58, 1.5, 1.33], shade: [0.3, 0.29, 0.36], lift: [0.05, 0.06, 0.11], sat: 1.08, ptK: 0, sky: ["#b8d0ec", "#9cbfea", "#6a9fe0", "#4f8cdb", "#3373cc"], e: [0, 1.6, 4.5, 9, 22], fog: "#b8d0ec", fogNear: 25, fogFar: 300, az: -100, el: 40, night: false, cloud: 1.1, sea: [0.9, 1.1, 1.5], vig: 0.2 },
  // warm dusk for the party: low sun behind the lens, peach sky, lanterns already lit
  dusk: { lit: [1.5, 0.98, 0.6], shade: [0.34, 0.26, 0.5], lift: [0.05, 0.05, 0.12], sat: 1.05, ptK: 0.55, sky: ["#ffc98a", "#f8ae80", "#de8e8e", "#a07cae", "#5f5fa6"], e: [0, 3, 9, 20, 45], fog: "#eeb090", fogNear: 30, fogFar: 260, az: 158, el: 15, night: false, cloud: 1.0, sea: [1.5, 1.0, 1.1], vig: 0.26 },
  night: { lit: [0.26, 0.34, 0.92], shade: [0.095, 0.125, 0.47], lift: [0.018, 0.022, 0.09], sat: 0.5, ptK: 1, sky: ["#8a84e2", "#5d68d8", "#3848bc", "#252f98", "#161c6a"], e: [0, 2.5, 8, 18, 45], fog: "#5a62cc", fogNear: 16, fogFar: 190, az: 0, el: 0, night: true, cloud: 1, sea: [0.62, 0.62, 0.7], vig: 0.3 },
  // warm high key for the "you see" block
  high: { lit: [1.75, 1.6, 1.3], shade: [0.62, 0.52, 0.46], lift: [0.08, 0.07, 0.07], sat: 1.0, ptK: 0, sky: ["#fde9c4", "#f6dfb8", "#d9d8d0", "#a9c6e4", "#7aa6da"], e: [0, 3, 9, 20, 45], fog: "#f6dfb8", fogNear: 30, fogFar: 260, az: -60, el: 52, night: false, cloud: 1.15, sea: [1.2, 1.3, 1.5], vig: 0.16 },
  museum: { lit: [1.2, 1.12, 1.0], shade: [0.42, 0.4, 0.5], lift: [0.05, 0.05, 0.08], sat: 0.95, ptK: 0.8, sky: ["#2a2440", "#2a2440", "#2a2440", "#2a2440", "#2a2440"], e: [0, 3, 9, 20, 45], fog: "#2a2440", fogNear: 60, fogFar: 400, az: -40, el: 70, night: false, cloud: 0, sea: [1, 1, 1], vig: 0.3 },
};
const moonTex = () => ctex("moonN", 256, 256, (g) => {
  g.clearRect(0, 0, 256, 256);
  const gr = g.createRadialGradient(110, 104, 10, 128, 128, 122); gr.addColorStop(0, "#ffffff"); gr.addColorStop(0.8, "#e9eefc"); gr.addColorStop(1, "#cfd8f6");
  g.fillStyle = gr; g.beginPath(); g.arc(128, 128, 120, 0, 7); g.fill();
  g.fillStyle = "rgba(170,184,236,0.5)"; for (const [x, y, r] of [[90, 100, 26], [160, 84, 16], [150, 160, 30], [84, 168, 14], [188, 132, 12]]) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
});
const coneTex = () => ctex("coneN", 64, 256, (g) => { const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, "rgba(255,255,255,0.9)"); gr.addColorStop(1, "rgba(255,255,255,0.15)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 256); const m = g.createLinearGradient(0, 0, 64, 0); m.addColorStop(0, "rgba(0,0,0,0)"); m.addColorStop(0.5, "rgba(0,0,0,1)"); m.addColorStop(1, "rgba(0,0,0,0)"); g.globalCompositeOperation = "destination-in"; g.fillStyle = m; g.fillRect(0, 0, 64, 256); });
const checker = () => ctex("museumFloor", 512, 512, (g) => { for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.fillStyle = (i + j) % 2 ? "#d9d2c0" : "#8a93a8"; g.fillRect(i * 128, j * 128, 128, 128); g.strokeStyle = "rgba(40,36,60,0.35)"; g.lineWidth = 3; g.strokeRect(i * 128, j * 128, 128, 128); } });

export class World {
  root = new THREE.Group();
  vig = 0.3;
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];
  private sun: THREE.DirectionalLight;
  private sky: THREE.Mesh; private skyMat: THREE.ShaderMaterial;
  private fog = new THREE.Fog("#5a62cc", 16, 190);
  private far: THREE.Object3D[] = [];
  private nightFar: THREE.Object3D[] = []; private dayClouds: THREE.Mesh[] = [];
  private sets = {} as Record<SetName, THREE.Group>;
  private src: Source[] = [];
  private lamps: THREE.Object3D[] = []; private curt: THREE.Object3D[] = [];
  private sea!: THREE.MeshBasicMaterial; private glitter!: THREE.Mesh;
  private fireF: THREE.PointLight; private fireL: THREE.PointLight; private fireHF: THREE.Sprite; private fireHL: THREE.Sprite;
  private frustum = new THREE.Frustum();
  private m4 = new THREE.Matrix4(); private v = new THREE.Vector3(); private sph = new THREE.Sphere();

  constructor() {
    const R = this.root, D2R = Math.PI / 180, M = mats();
    this.skyMat = new THREE.ShaderMaterial({
      uniforms: { c0: { value: new THREE.Color() }, c1: { value: new THREE.Color() }, c2: { value: new THREE.Color() }, c3: { value: new THREE.Color() }, c4: { value: new THREE.Color() }, e: { value: new THREE.Vector4() } },
      vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `uniform vec3 c0, c1, c2, c3, c4; uniform vec4 e; varying vec3 vP;
        void main(){ float el = asin(clamp(normalize(vP).y, -1.0, 1.0));
          vec3 c = mix(c0, c1, smoothstep(0.0, e.x, el)); c = mix(c, c2, smoothstep(e.x, e.y, el)); c = mix(c, c3, smoothstep(e.y, e.z, el)); c = mix(c, c4, smoothstep(e.z, e.w, el));
          gl_FragColor = vec4(c, 1.0); }`,
      side: THREE.BackSide, depthWrite: false, fog: false,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1400, 48, 24), this.skyMat);
    this.sky.renderOrder = -1; this.sky.frustumCulled = false; this.sky.layers.set(NOINK); R.add(this.sky);
    this.sun = new THREE.DirectionalLight("#ffffff", 0); this.sun.castShadow = true; this.sun.shadow.mapSize.set(4096, 4096);
    R.add(this.sun, this.sun.target);
    // ---- far things that follow the camera ----
    const farAdd = (o: THREE.Object3D, order: number, night: boolean | null) => { o.renderOrder = order; o.layers.set(NOINK); o.frustumCulled = false; this.far.push(o); R.add(o); o.userData.p = o.position.clone(); if (night) this.nightFar.push(o); return o; };
    const st = new THREE.Mesh(new THREE.PlaneGeometry(1700, 850), new THREE.MeshBasicMaterial({ map: starsTex(), transparent: true, depthWrite: false, fog: false, color: new THREE.Color(1.5, 1.5, 1.7) }));
    st.position.set(100, 520, -1250); farAdd(st, -0.9, true);
    const az = MOON.az * D2R, el = MOON.el * D2R, moonDir = V(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)), mp = moonDir.clone().multiplyScalar(1200);
    const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: moonTex(), color: new THREE.Color(1.75, 1.85, 2.2), fog: false, depthWrite: false })); moon.position.copy(mp); moon.scale.setScalar(150); farAdd(moon, -0.7, true);
    farAdd(halo(R, mp, 620, "#a9c0ff", 0.6), -0.75, true);
    for (const [azd, eld, w, k] of [[-22, 7, 260, 0], [-15, 12.5, 300, 1], [22, 9.5, 260, 2], [4, 20.5, 360, 3], [-34, 16, 300, 2], [31, 22, 330, 0], [11, 9, 150, 1]]) {
      const a = azd * D2R, m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: cloudHD(k, { lit: "#b9c2f6", mid: "#6c7ad2", shade: "#3e499e" }), transparent: true, depthWrite: false, fog: false }));
      m.position.set(Math.sin(a) * 1000, 1000 * Math.tan(eld * D2R), -Math.cos(a) * 1000); m.scale.set(w, w / 2, 1); farAdd(m, -0.6, true);
    }
    for (const [azd, eld, w, k] of [[-34, 2.6, 160, 0], [-17, 6.2, 220, 1], [-4, 3.2, 130, 2], [9, 7.6, 250, 3], [22, 3.4, 170, 0], [36, 6, 200, 1], [-27, 11.5, 260, 2], [3, 13.5, 290, 3], [28, 12, 240, 0], [-10, 19, 320, 1], [18, 21, 300, 2]]) {
      const a = azd * D2R, m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: cloudHD(k), transparent: true, depthWrite: false, fog: false }));
      m.position.set(Math.sin(a) * 1000, 1000 * Math.tan(eld * D2R), -Math.cos(a) * 1000); m.scale.set(w, w / 2, 1); farAdd(m, -0.6, null); this.dayClouds.push(m);
    }
    const isl = new THREE.Mesh(new THREE.PlaneGeometry(330, 62), new THREE.MeshBasicMaterial({ map: islandTex(), transparent: true, depthWrite: false, fog: false }));
    isl.position.set(60, 22, -1150); farAdd(isl, -0.65, null); isl.userData.isl = true;

    const group = (n: SetName) => { const g = new THREE.Group(); this.sets[n] = g; R.add(g); return g; };
    // ================= FIELD (v2 crash site) =================
    {
      const G = group("field"), { n, p } = buildGround(G, M), b = new Batch();
      buildEarth(b, M, n, p); buildRocks(b, M);
      stoneWall(b, M, [-5.6, 12.15], [4.6, 11.2], 0.92, 3, { tumble: 9 });
      stoneWall(b, M, [2.25, 8.4], [2.75, 10.9], 1.25, 17, { big: 1.15, tumble: 3 }); // the wall the pilot meets
      stoneWall(b, M, [-34, -24], [-3.5, -27.5], 1.0, 7, { big: 1.45, tumble: 6 });
      stoneWall(b, M, [2.5, -28], [40, -33], 1.0, 9, { big: 1.45, tumble: 6 });
      buildFence(b, M, n, p);
      palm(b, M, -12.2, -38, 8.6, [1.5, 0.6], 21); palm(b, M, -14.6, -44, 7.4, [-1.3, 0.3], 22); palm(b, M, 7.4, -36, 8.4, [-1.6, 0.8], 23); palm(b, M, 10.6, -41, 7.2, [1.3, 0.2], 24); palm(b, M, -1.5, -64, 8.2, [0.9, 0], 25);
      kiawe(b, M, -17, -30, 1.0, 32); kiawe(b, M, 14.5, -55, 1.5, 33);
      b.build(G);
      buildHouse(G, M, -5.2, -43, 0.2); buildWindmill(G, M, 5.6, -50);
      G.add(buildPlane());
      const tr = rng(55), tufts: [number, number, number][] = [];
      for (let i = 0; i < 46; i++) { const t = tr(); tufts.push([-5.6 + 10.2 * t + (tr() - 0.5) * 0.3, 12.15 - 0.95 * t + (tr() < 0.5 ? 0.42 : -0.42), 0.3 + tr() * 0.34]); }
      for (let i = 0; i < 40; i++) tufts.push([(tr() - 0.5) * 9, 12.6 + tr() * 2.6, 0.3 + tr() * 0.35]);
      for (let i = 0; i < 190; i++) tufts.push([(tr() - 0.5) * 16, 11 - tr() * 24, 0.24 + tr() * 0.3]);
      for (let i = 0; i < 200; i++) tufts.push([(tr() - 0.5) * 80, -10 - tr() * 80, 0.35 + tr() * 0.4]);
      buildTufts(G, tufts.filter(([x, z]) => !(Math.abs(x * n.z - z * n.x) < 1.3 && x * n.x + z * n.z < 3 && x * n.x + z * n.z > -22) && !(Math.hypot(x, z) < 2.2) && !(Math.abs(z - 9.6) < 0.9 && Math.abs(x) < 2.6) && !(Math.abs(z - 4.6) < 0.7 && Math.abs(x) < 1.4)));
      this.fireF = new THREE.PointLight("#ff8030", 0, 30, 2); this.fireF.position.set(0.3, 2.2, 1.4); G.add(this.fireF);
      this.fireHF = halo(G, V(0.3, 2.4, 0.3), 9, "#ff9040", 0.5);
    }
    // ================= LANAI (v4 party yard) =================
    {
      const G = group("lanai"), b = new Batch();
      const gm = lam("dryGround", () => ({ map: dryGroundHD() }));
      b.add(quadUV(V(-200, 0, 40), V(200, 0, 40), V(200, 0, -26), V(-200, 0, -26), 0, 0, 400 / 6, 66 / 6), gm);
      b.add(quadUV(V(-200, -7, -25.5), V(200, -7, -25.5), V(200, 0, -26), V(-200, 0, -26), 0, 0, 160, 3), M.rock[1]);
      this.sea = new THREE.MeshBasicMaterial({ map: (() => { const t = seaNight(); t.wrapS = THREE.RepeatWrapping; t.needsUpdate = true; return t; })() });
      const sea = new THREE.Mesh(quadUV(V(-1600, -7, -25.5), V(1600, -7, -25.5), V(1600, -7, -1500), V(-1600, -7, -1500), 0, 0, 220, 1), this.sea); sea.layers.set(NOINK); G.add(sea);
      const mx = Math.sin(az), mz = -Math.cos(az), px = -mz, pz = mx, Q = (t: number, w: number) => V(mx * t + px * w, -6.95, mz * t + pz * w);
      this.glitter = patch(G, glitterTex(), Q(30, -10), Q(30, 10), Q(900, 34), Q(900, -34), "#cfe0ff", 1.3);
      stoneWall(b, M, [-0.5, -12.6], [14, -14.2], 0.95, 3, { big: 1.25, tumble: 5 }); stoneWall(b, M, [-13, -1], [-10.5, 9], 0.9, 5, { big: 1.25 }); stoneWall(b, M, [6.4, -3.2], [7.6, 6], 0.85, 7, { big: 1.2, tumble: 3 });
      palm(b, M, 4.2, -19.5, 9.5, [1.7, 0.4], 21); palm(b, M, 8.6, -16.5, 8.2, [-1.5, 0.3], 22); palm(b, M, 6.6, -22, 7.6, [-1.2, 0], 23); palm(b, M, -10.5, -12.5, 9.2, [1.4, 0.8], 24); palm(b, M, 11.5, -8.5, 8.8, [-1.6, 1.0], 25); palm(b, M, -8.2, 3.5, 8.4, [1.8, -0.6], 26);
      b.build(G);
      buildHouse(G, M, HOUSE.x, HOUSE.z, HOUSE.yaw);
      const tr = rng(56), tufts: [number, number, number][] = [];
      for (let i = 0; i < 170; i++) { const x = (tr() - 0.5) * 24, z = 7 - tr() * 30; if (x > -3.5 && x < 1.5 && z > -1.4 && z < 3.4) continue; if (x > -8 && x < 0 && z < -4.5 && z > -11) continue; tufts.push([x, z, 0.26 + tr() * 0.32]); }
      buildTufts(G, tufts);
      this.src = buildParty(G, M);
      // closed curtains over the windows and a shut door for the "house with the curtains drawn" (high-key look only)
      const H = new THREE.Group(); H.position.set(HOUSE.x, 0, HOUSE.z); H.rotation.y = HOUSE.yaw; G.add(H);
      const cm = new THREE.MeshBasicMaterial({ map: ctex("curtainsC", 256, 320, (g) => curtains(new Pen(g))), color: new THREE.Color(0.92, 0.9, 0.86) });
      for (const wx of [2.2]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.84, 1.14), cm); w.position.set(wx, 2.2, 2.512); w.layers.set(NOINK); H.add(w); this.curt.push(w); }
      const dm = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.94), new THREE.MeshBasicMaterial({ map: grainWood("door", "#6f4a34", 3), color: new THREE.Color(0.9, 0.9, 0.9) })); dm.position.set(0, 1.65, 2.512); dm.layers.set(NOINK); H.add(dm); this.curt.push(dm);
      G.traverse((o) => { // everything self-lit or additive in this set is a lamp piece: hidden in the daylight look
        const m = (o as THREE.Mesh).material as THREE.MeshBasicMaterial | undefined;
        if (!m || this.curt.includes(o) || o === sea) return;
        if ((o as THREE.Sprite).isSprite || m.blending === THREE.AdditiveBlending || (m.isMeshBasicMaterial && Math.max(m.color.r, m.color.g, m.color.b) > 1.2)) this.lamps.push(o);
      });
      this.fireL = new THREE.PointLight("#ff8030", 0, 40, 2); this.fireL.position.set(HOUSE.x + 1.5, 3, HOUSE.z + 5); G.add(this.fireL);
      this.fireHL = halo(G, V(HOUSE.x, 4.5, HOUSE.z + 1), 16, "#ff9040", 0.5);
      const plane = buildPlane(); plane.position.set(6.4, 0.66, -18.6); plane.rotation.y += 4.1; G.add(plane);
    }
    // ================= STUDIO (inserts: chart table, wall for calendar / cave / pictograms) =================
    {
      const G = group("studio"), b = new Batch();
      b.add(boxGeo(V(-2.2, TABLE.y - 0.08, -0.9), V(2.2, TABLE.y, 1.6), 1.3, true), lam("deskWood", () => ({ map: grainWood("desk", "#9a6238", 5) })));
      b.add(quadUV(V(-4, 0, -1.0), V(4, 0, -1.0), V(4, 4.2, -1.0), V(-4, 4.2, -1.0), 0, 0, 5, 1), lam("studioWall", () => ({ map: boardWall("studio", 8, 4.2, {}) })));
      b.add(quadUV(V(-4, 0, 3), V(4, 0, 3), V(4, 0, -1), V(-4, 0, -1), 0, 0, 4, 2), lam("studioFloor", () => ({ map: grainWood("floor", "#8a6238", 6) })));
      // desk things round the chart: brass dividers, pencil, mug, ruler
      b.add(limb([V(0.62, TABLE.y + 0.012, 0.42), V(0.9, TABLE.y + 0.012, 0.2)], [0.012, 0.004], 6), lam("pencilY", () => ({ color: "#e2b03a" })));
      b.add(boxGeo(V(-0.95, TABLE.y, 0.5), V(-0.6, TABLE.y + 0.008, 0.56)), lam("ruler", () => ({ color: "#d9c48a" })));
      b.add(new THREE.CylinderGeometry(0.05, 0.045, 0.1, 14), lam("mug", () => ({ color: "#ece6d6" })), new THREE.Matrix4().makeTranslation(0.78, TABLE.y + 0.05, -0.32));
      b.build(G);
      const pl = new THREE.PointLight("#ffc890", 5, 8, 2); pl.position.set(-0.6, TABLE.y + 0.9, -0.3); G.add(pl);
      this.src.push({ light: pl, base: 5, seed: 90, pool: [patch(G, poolTex(), V(-1.5, TABLE.y + 0.02, 1.1), V(1.3, TABLE.y + 0.02, 1.1), V(1.3, TABLE.y + 0.02, -0.8), V(-1.5, TABLE.y + 0.02, -0.8), "#ffb060", 0.3)] });
    }
    // ================= MUSEUM (present day: electric spots are fine here) =================
    {
      const G = group("museum"), b = new Batch();
      b.add(quadUV(V(-9, 0, 10), V(9, 0, 10), V(9, 0, -5), V(-9, 0, -5), 0, 0, 9, 7.5), lam("museumFloor", () => ({ map: checker() })));
      const wallM = lam("museumWall", () => ({ color: "#5a5a86" }));
      b.add(quadUV(V(-9, 0, -5), V(9, 0, -5), V(9, 6, -5), V(-9, 6, -5)), wallM); b.add(quadUV(V(-9, 0, 10), V(-9, 0, -5), V(-9, 6, -5), V(-9, 6, 10)), wallM); b.add(quadUV(V(9, 0, -5), V(9, 0, 10), V(9, 6, 10), V(9, 6, -5)), wallM);
      b.add(boxGeo(V(-4.6, 0, -4.0), V(4.6, 0.22, 3.0), 2), lam("plinth", () => ({ color: "#c9c2b0" })));
      const brass = lam("stanchion", () => ({ color: "#c9a04a" })), ropeM = lam("velvet", () => ({ color: "#a8323a" }));
      const posts: THREE.Vector3[] = []; for (let i = 0; i < 6; i++) posts.push(V(-4.2 + i * 1.68, 0, 3.7));
      posts.forEach((p, i) => { b.add(limb([p, p.clone().add(V(0, 0.95, 0))], [0.035, 0.03], 8), brass); b.add(new THREE.SphereGeometry(0.06, 10, 8), brass, new THREE.Matrix4().makeTranslation(p.x, 1.0, p.z)); if (i) { const q = posts[i - 1]; b.add(limb([q.clone().add(V(0, 0.9, 0)), q.clone().lerp(p, 0.5).add(V(0, 0.68, 0)), p.clone().add(V(0, 0.9, 0))], [0.022, 0.022], 6, 1, 10), ropeM); } });
      b.build(G);
      const plane = buildPlane(); plane.position.set(0, 0.9, -0.5); plane.rotation.y += 0.25; G.add(plane);
      const b2 = new Batch();
      for (const [x, z] of [[-2.2, 1.5], [2.0, 1.2], [0, -1.5]]) { const pl = new THREE.PointLight("#ffe2b0", 26, 14, 2); pl.position.set(x, 4.6, z); G.add(pl); patch(G, poolTex(), V(x - 3, 0.24, z + 3), V(x + 3, 0.24, z + 3), V(x + 3, 0.24, z - 3), V(x - 3, 0.24, z - 3), "#ffdca0", 0.22);
        patch(G, coneTex(), V(x - 2.2, 0.3, z), V(x + 2.2, 0.3, z), V(x + 0.25, 5.4, z), V(x - 0.25, 5.4, z), "#ffe6b8", 0.16); // visible light cone
        b2.add(new THREE.CylinderGeometry(0.16, 0.26, 0.4, 12), lam("spotCan", () => ({ color: "#2a2a34" })), new THREE.Matrix4().makeTranslation(x, 5.5, z)); }
      b2.build(G);
    }
    // ================= CAVE (the villagers' hiding place) =================
    {
      const G = group("cave"), b = new Batch();
      b.add(quadUV(V(-8, 0, 8), V(8, 0, 8), V(8, 0, -4), V(-8, 0, -4), 0, 0, 5, 4), M.rock[1]);
      for (const [x, z, sx, sy, sz, sd] of [[-2.3, 1.6, 1.3, 1.9, 1.0, 71], [2.5, 1.2, 1.2, 2.3, 1.0, 72], [-2.9, -1.2, 1.5, 2.6, 1.2, 73], [3.1, -1.6, 1.6, 2.8, 1.2, 74], [-1.5, 2.9, 0.7, 0.5, 0.6, 75], [1.7, 3.1, 0.8, 0.45, 0.6, 76]])
        b.add(rock(sd, sx, sy, sz, 0.6, 2, 0.16), M.rock[sd % 4], new THREE.Matrix4().makeTranslation(x, sy * 0.45, z));
      b.build(G);
      const pl = new THREE.PointLight("#ff9c48", 7, 9, 2); pl.position.set(0.3, 0.55, 1.15); G.add(pl);
      this.src.push({ light: pl, base: 7, seed: 95, flame: undefined, halo: halo(G, V(0.3, 0.45, 1.05), 1.7, "#ffd9a0", 0.7),
        pool: [patch(G, poolTex(), V(-1.6, 0.03, 2.6), V(2.2, 0.03, 2.6), V(2.2, 0.03, -0.6), V(-1.6, 0.03, -0.6), "#ff9a3c", 0.6)] });
    }
    nightAll(R);
  }

  private actor(i: number) { while (this.actors.length <= i) this.actors.push(new Actor(this.root)); return this.actors[i]; }
  private fx(i: number) { while (this.fxs.length <= i) this.fxs.push(new Fx(this.root)); return this.fxs[i]; }

  update(f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const { s } = inShot(f), L = LOOKS[s.look], c = camAt(f), D2R = Math.PI / 180;
    for (const k of Object.keys(this.sets) as SetName[]) this.sets[k].visible = k === s.set;
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.1; cam.far = 2400; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    cam.layers.enable(NOINK);
    // key light direction: the moon at night, else the look's sun (azimuth from the -z view axis toward +x)
    const az = (L.night ? MOON.az : L.az) * D2R, el = (L.night ? MOON.el : L.el) * D2R;
    const sunDir = L.night ? V(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)) : V(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
    const centre = V(c.look[0], 0.5, c.look[2] + (s.set === "field" && c.look[2] < 2 ? 4 : 0)), Rr = s.set === "field" ? 14 : 12;
    centre.x = Math.round(centre.x); centre.z = Math.round(centre.z); // snapped so the shadow map does not swim with the push
    this.sun.position.copy(centre).addScaledVector(sunDir, 120); this.sun.target.position.copy(centre);
    const sc = this.sun.shadow.camera; sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 20; sc.far = 260; sc.updateProjectionMatrix();
    this.sun.shadow.bias = -0.0004; this.sun.shadow.normalBias = 0.03;
    TONE.uLitCol.value.set(...L.lit); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = 0.35; TONE.uSideK.value = 0.83; TONE.uTerm.value = 0.22; TONE.uBounce.value.set(0, 0, 0); TONE.uSat.value = L.sat; NIGHT.uPtK.value = L.ptK;
    const lit = !L.night && s.look !== "dusk"; // cards: kit day shading in daylight, neutral when the light is painted in (relight)
    CHAR.uCharTint.value.set(1, lit ? 0.97 : 1, lit ? 0.95 : 1); CHAR.uCharShade.value = lit ? 0.88 : 0.93; CHAR.uGrad.value = lit ? 0.07 : 0.03; CHAR.uBodyGrad.value = lit ? 0.2 : 0.1; CHAR.uSideTint.value.set(0.92, 0.9, 0.98);
    const su = this.skyMat.uniforms;
    L.sky.forEach((h, i) => untone(h, su["c" + i].value));
    const e = L.e.map((d) => d * D2R); su.e.value.set(e[1], e[2], e[3], e[4]);
    this.sky.position.copy(cam.position);
    untone(L.fog, this.fog.color); this.fog.near = L.fogNear; this.fog.far = L.fogFar; scene.fog = this.fog; scene.background = null;
    const outdoors = s.set === "field" || s.set === "lanai";
    for (const o of this.far) { o.position.copy(o.userData.p as THREE.Vector3).add(cam.position); o.visible = outdoors && (o.userData.isl ? true : this.nightFar.includes(o) ? L.night : !L.night); if ((o as THREE.Mesh).isMesh && !(o as THREE.Sprite).isSprite) o.lookAt(cam.position.x, o.position.y, cam.position.z); }
    for (const m of this.dayClouds) (m.material as THREE.MeshBasicMaterial).color.setRGB(L.cloud * (s.look === "dusk" ? 1.15 : 1), L.cloud * (s.look === "dusk" ? 0.82 : 1), L.cloud * (s.look === "dusk" ? 0.74 : 1));
    this.sea.color.setRGB(...L.sea); this.glitter.visible = L.night || s.look === "dusk"; (this.glitter.material as THREE.MeshBasicMaterial).color.setRGB(...(L.night ? [1.05, 1.14, 1.3] : [1.3, 0.95, 0.6]) as [number, number, number]);
    for (const o of this.far) if (o.userData.isl) ((o as THREE.Mesh).material as THREE.MeshBasicMaterial).color.setRGB(...(L.night ? [0.2, 0.25, 0.72] : s.look === "dusk" ? [0.9, 0.62, 0.7] : [1, 1, 1]) as [number, number, number]);
    // ---- lamps: hidden in the daylight look; flames flicker; fires burn only in their shots ----
    const lampsOn = s.look !== "high" && s.look !== "day";
    for (const o of this.lamps) o.visible = lampsOn;
    for (const o of this.curt) o.visible = s.look === "high";
    for (const q of this.src) {
      const fl = q.flame ? 1 + 0.1 * Math.sin(f * 1.9 + q.seed) + 0.06 * Math.sin(f * 3.1 + q.seed * 2.3) : 1 + 0.05 * Math.sin(f * 0.9 + q.seed) + 0.03 * Math.sin(f * 2.3 + q.seed * 1.7);
      if (q.light) q.light.intensity = lampsOn ? q.base * fl : 0;
      if (q.halo) { const u = q.halo.userData; if (!u.s0) { u.s0 = q.halo.scale.x; u.c0 = q.halo.material.color.clone(); } q.halo.scale.setScalar(u.s0 * (0.94 + 0.06 * fl)); q.halo.material.color.copy(u.c0).multiplyScalar(fl); }
      for (const p of q.pool ?? []) { const mat = p.material as THREE.MeshBasicMaterial, u = p.userData; if (!u.c0) u.c0 = mat.color.clone(); mat.color.copy(u.c0).multiplyScalar(fl); }
      if (q.flame) { (q.flame.material as THREE.MeshBasicMaterial).map = flameTex((Math.floor(f / 2) + q.seed) % 4); q.flame.scale.set(1 + 0.08 * Math.sin(f * 2.3 + q.seed), fl, 1); q.flame.quaternion.copy(cam.quaternion); }
    }
    const ff = 1 + 0.14 * Math.sin(f * 1.7) + 0.08 * Math.sin(f * 3.3);
    this.fireF.intensity = s.fire === 2 ? 70 * ff : 0; this.fireHF.visible = s.fire === 2; this.fireHF.scale.setScalar(9 * (0.95 + 0.05 * ff));
    this.fireL.intensity = s.fire === 1 ? 90 * ff : 0; this.fireHL.visible = s.fire === 1; this.fireHL.scale.setScalar(16 * (0.95 + 0.05 * ff));
    spinWindmill(f);
    this.vig = L.vig;
    // ---- cast + effects ----
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0);
    const st = stage(f, { pos: cam.position, right, sun: sunDir });
    this.frustum.setFromProjectionMatrix(this.m4.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
    let ai = 0;
    const used: Actor[] = [];
    for (const p of st.places) {
      const s2 = p.scale ?? 1;
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y + 1.1 * s2, p.z), 3.5))) continue;
      const a = this.actor(ai++), [w, h, k] = p.size ?? [300, 500, 0.5];
      a.r = this.pool.req(p.key, w, h, k, p.draw);
      a.mesh.visible = true; a.mesh.position.set(p.x, p.y, p.z);
      a.mesh.rotation.set(0, p.yaw ?? Math.atan2(cam.position.x - p.x, cam.position.z - p.z), p.roll ?? 0);
      a.mesh.scale.set(p.mirror ? -s2 : s2, s2, s2);
      used.push(a);
    }
    for (let i = ai; i < this.actors.length; i++) this.actors[i].mesh.visible = false;
    let fi = 0;
    const fused: [Fx, number, number][] = [];
    for (const p of st.fx) {
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y, p.z), Math.max(Math.abs(p.w), p.h)))) continue;
      const ef = this.fx(fi++);
      ef.r = this.pool.req(p.key, p.cw, p.ch, 1, p.draw); ef.use(!!p.soft);
      ef.mesh.visible = true; ef.mesh.position.set(p.x, p.y, p.z);
      if (p.flat) ef.mesh.rotation.set(-Math.PI / 2, 0, p.rot ?? 0); else { ef.mesh.quaternion.copy(cam.quaternion); ef.mesh.rotateZ(p.rot ?? 0); }
      ef.mesh.scale.set(p.w, p.h, 1);
      fused.push([ef, p.tint ?? 1, p.alpha ?? 1]);
    }
    for (let i = fi; i < this.fxs.length; i++) this.fxs[i].mesh.visible = false;
    this.pool.flush();
    for (const a of used) a.bind();
    for (const [ef, tint, alpha] of fused) ef.bind(tint, alpha);
    return new THREE.Vector3(...c.look);
  }
}
void windowGlow; void emissive;
