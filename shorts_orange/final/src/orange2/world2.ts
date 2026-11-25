// Orange v2 world: eleven sets built once (sets2.ts), one visible per take; Niihau lighting model (two-tone world,
// lit cards, sun shadow, gradient sky, painted clouds). The sun is camera-relative and frozen per take (skill: front-
// lit faces, key from behind-left/right of the lens). The hero NAME SIGN on the merchant's staff is a real 3D board.
import * as THREE from "three";
import { Batch, lam, boxGeo, V } from "../film/build";
import { cloudHD } from "../film/paint";
import { TONE, CHAR, untone } from "../film/shade";
import { NOINK } from "../film/ink";
import { Pool, Actor, Fx } from "../film/cards";
import { nightAll, NIGHT } from "../film/night";
import { limb } from "../film/geo";
import { stage, StaffReq } from "./cast2";
import { camAt, takeAt, takeEnd, SETS, SetName, LookName, ORIGIN, w, L, CARAVAN_X, TRADER_PATH, TOTAL } from "./story";
import { BUILDERS, SetRefs } from "./sets2";
import { signTex } from "../orange/sets";

type C3 = readonly [number, number, number];
type Look = { lit: C3; shade: C3; lift: C3; sat: number; sky: string[]; e: number[]; fog: string; fogNear: number; fogFar: number; az: number; el: number; cloud: [number, number, number]; vig: number };
export const LOOKS: Record<LookName, Look> = {
  day: { lit: [1.48, 1.4, 1.26], shade: [0.48, 0.54, 1.06], lift: [0.05, 0.05, 0.1], sat: 1.06, sky: ["#dde3f0", "#c4d0ea", "#a2b6e0", "#8aa2d0", "#7f9dca"], e: [0, 2, 6, 14, 30], fog: "#d2dff0", fogNear: 50, fogFar: 460, az: 135, el: 38, cloud: [1.1, 1.08, 1.06], vig: 0.22 },
  warm: { lit: [1.52, 1.38, 1.18], shade: [0.48, 0.53, 1.06], lift: [0.05, 0.05, 0.11], sat: 1.04, sky: ["#e2e4ee", "#c8d2ea", "#a6b8e0", "#8ea4d2", "#7f9dca"], e: [0, 2, 6, 14, 30], fog: "#dcdeec", fogNear: 50, fogFar: 420, az: 130, el: 36, cloud: [1.15, 1.04, 0.98], vig: 0.24 },
  sea: { lit: [1.48, 1.42, 1.28], shade: [0.48, 0.54, 1.06], lift: [0.05, 0.05, 0.1], sat: 1.06, sky: ["#d6e2f2", "#b4cbea", "#8fb0e0", "#7f9dca", "#6a8cc8"], e: [0, 1.6, 5, 12, 28], fog: "#d0def0", fogNear: 120, fogFar: 1400, az: 135, el: 38, cloud: [1.1, 1.08, 1.06], vig: 0.22 },
  gold: { lit: [1.74, 1.24, 0.78], shade: [0.68, 0.5, 0.68], lift: [0.07, 0.05, 0.1], sat: 1.04, sky: ["#ffd592", "#ffc48a", "#f4a98a", "#cf94a0", "#8f7cac"], e: [0, 3, 9, 20, 45], fog: "#f2be98", fogNear: 40, fogFar: 340, az: 150, el: 24, cloud: [1.25, 0.9, 0.78], vig: 0.28 },
};
const NAMES = ["NARANGA", "NARANG", "NARANJ", "LARANJA", "ORANGE", "SINAASAPPEL", "SANTRA"];
const SIGN_RATIO = 420 / 1400;

/** the merchant's staff: pole from the fist up, a crossbar out to the side, one board (or the whole chain of names) */
class Staff {
  g = new THREE.Group(); board: THREE.Mesh; mat: THREE.MeshBasicMaterial; chain = new THREE.Group(); one = new THREE.Group();
  constructor(parent: THREE.Object3D) {
    parent.add(this.g); const b = new Batch(), wood = lam("staffW", () => ({ color: "#7a4a2a" })), cord = lam("staffC", () => ({ color: "#4a3426" }));
    b.add(limb([V(0, -0.65, 0), V(0, 1.45, 0)], [0.035, 0.03], 6), wood);
    b.add(new THREE.SphereGeometry(0.06, 10, 8), lam("staffK", () => ({ color: "#e8b93e" })), new THREE.Matrix4().makeTranslation(0, 1.5, 0));
    b.add(limb([V(0, 1.38, 0), V(-1.05, 1.38, 0)], [0.025, 0.025], 5), wood); b.build(this.g);
    { const xb = new Batch(); xb.add(limb([V(-1.0, 1.38, 0), V(-1.5, 1.38, 0)], [0.025, 0.025], 5), wood); xb.build(this.chain); }
    this.g.add(this.one, this.chain);
    const bw = 0.95, bh = bw * SIGN_RATIO; this.mat = new THREE.MeshBasicMaterial({ map: signTex("NARANGA") });
    const cb = new Batch(); for (const sx of [-0.33, 0.33]) cb.add(limb([V(-0.52 + sx * bw, 1.38, 0), V(-0.52 + sx * bw, 1.26, 0)], [0.012, 0.012], 4), cord); cb.build(this.one);
    this.board = new THREE.Mesh(new THREE.PlaneGeometry(bw, bh), this.mat); this.board.position.set(-0.52, 1.26 - bh / 2, 0.01); this.board.layers.set(NOINK); this.one.add(this.board);
    const back = new THREE.Mesh(new THREE.BoxGeometry(bw * 0.99, bh * 0.99, 0.04), lam("signBack", () => ({ color: "#7a5232" }))); back.position.set(-0.52, 1.26 - bh / 2, -0.015); this.one.add(back);
    // chain: two cords under the crossbar, small boards stacked on each (4 + 3)
    const cw = 0.68, ch = cw * SIGN_RATIO, cols = [[-1.12, 0, 4], [-0.4, 4, 3]] as const, kb = new Batch();
    for (const [x, i0, n] of cols) {
      for (let k = 0; k < n; k++) { const top = 1.38 - 0.05 - k * (ch + 0.06), up = k ? top + 0.06 : 1.38; for (const sx of [-0.36, 0.36]) kb.add(limb([V(x + sx * cw, up, -0.01), V(x + sx * cw, top, -0.01)], [0.008, 0.008], 3), cord); }
      for (let k = 0; k < n; k++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(cw, ch), new THREE.MeshBasicMaterial({ map: signTex(NAMES[i0 + k]) })); m.position.set(x, 1.38 - 0.05 - ch / 2 - k * (ch + 0.06), 0.012); m.layers.set(NOINK); this.chain.add(m); }
    }
    kb.build(this.chain);
    this.g.traverse((c) => { const m = c as THREE.Mesh; if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
    this.g.visible = false;
  }
  place(r: StaffReq | undefined, cam: THREE.Camera, rf: number) {
    if (!r) { this.g.visible = false; return; }
    this.g.visible = true; this.g.position.set(r.x, r.y, r.z);
    this.g.rotation.set(0, Math.atan2(cam.position.x - r.x, cam.position.z - r.z), 0.015 * Math.sin(rf * 0.13));
    this.g.scale.set(r.flip ? -1 : 1, 1, 1);
    this.chain.visible = !!r.chain; this.one.visible = !r.chain;
    for (const m of [this.board, ...this.chain.children]) if ((m as THREE.Mesh).geometry?.type === "PlaneGeometry") m.scale.x = r.flip ? -1 : 1;
    this.one.rotation.z = 0; this.board.rotation.x = 0.06 * Math.sin(rf * 0.17);
    if (!r.chain) { const t = signTex(r.key); if (this.mat.map !== t) { this.mat.map = t; this.mat.needsUpdate = true; } }
  }
}

export class World {
  root = new THREE.Group(); vig = 0.22;
  private pool = new Pool(); private actors: Actor[] = []; private fxs: Fx[] = [];
  private sun = new THREE.DirectionalLight("#ffffff", 0);
  private skyMat: THREE.ShaderMaterial; private sky: THREE.Mesh;
  private fog = new THREE.Fog("#cfe0f2", 40, 420);
  private clouds: THREE.Mesh[] = [];
  sets = {} as Record<SetName, THREE.Group>; R = {} as Record<SetName, SetRefs>;
  private staff: Staff;
  private frustum = new THREE.Frustum(); private m4 = new THREE.Matrix4(); private v = new THREE.Vector3(); private sph = new THREE.Sphere();
  private sunCache = new Map<string, THREE.Vector3>();
  constructor() {
    const R = this.root;
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
    for (const [azd, eld, wd, k] of [[-34, 2.6, 160, 0], [-17, 6.2, 220, 1], [-4, 3.2, 130, 2], [9, 7.6, 250, 3], [22, 3.4, 170, 0], [36, 6, 200, 1], [-27, 11.5, 260, 2], [3, 13.5, 290, 3], [28, 12, 240, 0], [-10, 19, 320, 1], [18, 21, 300, 2], [-48, 8, 220, 3], [50, 9, 240, 2]]) {
      const a = azd * D2R, m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: cloudHD(k), transparent: true, depthWrite: false, fog: false }));
      m.position.set(Math.sin(a) * 1000, 1000 * Math.tan(eld * D2R), -Math.cos(a) * 1000); m.scale.set(wd, wd / 2, 1); m.renderOrder = -0.6; m.layers.set(NOINK); m.frustumCulled = false; m.userData.p = m.position.clone(); R.add(m); this.clouds.push(m);
    }
    for (const n of SETS) { const g = new THREE.Group(); const o = ORIGIN(n); g.position.set(o[0], o[1], o[2]); R.add(g); this.sets[n] = g; this.R[n] = BUILDERS[n](g); }
    this.staff = new Staff(R);
    nightAll(R);
    void boxGeo;
  }
  private actor(i: number) { while (this.actors.length <= i) this.actors.push(new Actor(this.root)); return this.actors[i]; }
  private fx(i: number) { while (this.fxs.length <= i) this.fxs.push(new Fx(this.root)); return this.fxs[i]; }
  /** sun direction for a take: from behind the lens at `az` degrees off the view axis (frozen at the take's first frame) */
  private sunFor(tid: string, a: number, Lk: Look) {
    let s = this.sunCache.get(tid);
    if (!s) { const c = camAt(a), fx = c.look[0] - c.pos[0], fz = c.look[2] - c.pos[2], yaw = Math.atan2(fx, fz), az = yaw + Lk.az * Math.PI / 180 * (tid === "end" ? 1 : 1), el = (tid === "hook" || tid === "scholar" ? 54 : Lk.el) * Math.PI / 180; s = V(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).normalize(); this.sunCache.set(tid, s); }
    return s;
  }
  update(f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene, rf = f) {
    const t = takeAt(f), Lk = LOOKS[t.look], c = camAt(f), D2R = Math.PI / 180, o = ORIGIN(t.set), G = this.sets[t.set], Rf = this.R[t.set];
    for (const k of SETS) this.sets[k].visible = k === t.set;
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.1; cam.far = 2600; cam.updateProjectionMatrix(); cam.updateMatrixWorld(); cam.layers.enable(NOINK);
    const sunDir = this.sunFor(t.id, t.a, Lk);
    const centre = V(c.look[0] * 0.5 + c.pos[0] * 0.5, 0.5, c.look[2] * 0.5 + c.pos[2] * 0.5), Rr = 26;
    this.sun.position.copy(centre).addScaledVector(sunDir, 140); this.sun.target.position.copy(centre);
    const sc = this.sun.shadow.camera; sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 20; sc.far = 320; sc.updateProjectionMatrix();
    this.sun.shadow.bias = -0.0004; this.sun.shadow.normalBias = 0.03;
    TONE.uLitCol.value.set(...Lk.lit); TONE.uShadeCol.value.set(...Lk.shade); TONE.uShadeLift.value.set(...Lk.lift);
    TONE.uLambert.value = 0.35; TONE.uSideK.value = 0.83; TONE.uTerm.value = 0.22; TONE.uBounce.value.set(0, 0, 0); TONE.uSat.value = Lk.sat; NIGHT.uPtK.value = 0;
    if (t.look === "gold") { CHAR.uCharTint.value.set(1, 0.9, 0.8); TONE.uBounce.value.set(0.12, 0.07, 0.04); } else CHAR.uCharTint.value.set(1, 0.97, 0.95);
    CHAR.uCharShade.value = 0.88; CHAR.uGrad.value = 0.07; CHAR.uBodyGrad.value = 0.2; CHAR.uSideTint.value.set(0.92, 0.9, 0.98);
    const su = this.skyMat.uniforms; Lk.sky.forEach((h, i) => untone(h, su["c" + i].value));
    const e = Lk.e.map((d) => d * D2R); su.e.value.set(e[1], e[2], e[3], e[4]);
    this.sky.position.copy(cam.position);
    untone(Lk.fog, this.fog.color); this.fog.near = Lk.fogNear; this.fog.far = Lk.fogFar; scene.fog = this.fog; scene.background = null;
    for (const m of this.clouds) { m.position.copy(m.userData.p as THREE.Vector3).add(cam.position); m.lookAt(cam.position.x, m.position.y, cam.position.z); (m.material as THREE.MeshBasicMaterial).color.setRGB(...Lk.cloud); }
    for (const s of Rf.swell) s.offset.set((rf * (t.id === "sail" ? 0.004 : 0.0007)) % 1, (rf * 0.0013) % 1);
    for (const m of Rf.mills) m.rotation.z = rf * 0.02;
    this.vig = Lk.vig;
    this.animate(t.id, f, rf, Rf);
    // ---- cast + effects (cards) ----
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0);
    const { st, staff } = stage(f, { pos: cam.position, right, sun: sunDir }, rf, o);
    this.staff.place(staff[0], cam, rf);
    this.frustum.setFromProjectionMatrix(this.m4.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
    let ai = 0; const used: Actor[] = [];
    for (const p of st.places) {
      const s2 = p.scale ?? 1;
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y + 1.1 * s2, p.z), 2.5))) continue;
      const a = this.actor(ai++), [cw, ch, k] = p.size ?? [300, 500, 0.5];
      a.r = this.pool.req(p.key, cw, ch, k, p.draw); a.mesh.visible = true; a.mesh.position.set(p.x, p.y, p.z);
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
    void G; void takeEnd; void TOTAL;
  }
  /** per-take props: camels, signs, sails */
  private animate(id: string, f: number, rf: number, R: SetRefs) {
    const S = R.signs, swing = (k: string, a = 0.05) => { if (S[k]) S[k].g.rotation.x = a * Math.sin(rf * 0.09 + k.length); };
    const pop = (k: string, f0: number, n = 8, amp = 0.22) => { const s = S[k]; if (!s) return; if (f >= f0 && f < f0 + n) { const u = (f - f0) / n; s.board.scale.setScalar(1 + amp * Math.sin(Math.PI * u) * (1 - u)); } else s.board.scale.setScalar(1); };
    for (const k of Object.keys(S)) swing(k);
    for (const sl of R.sails) sl.forEach((g, i) => { g.scale.x = 1 + 0.05 * Math.sin(rf * 0.07 + i); });
    if (id === "dunes") R.camels.forEach((cm, i) => { const x = CARAVAN_X(f) + (i - 1) * 3.2 - (i === 1 ? 0 : 0), ph = ((rf / 22) + i * 0.27) % 1; cm.g.position.x = x - 0.0 + (i === 1 ? 0 : 0) - 0.0; cm.g.position.x = x + (i === 1 ? -0.05 : 0); cm.update(ph, true, rf); });
    if (id === "serai") { const cm = R.camels[0], t = TRADER_PATH(f), walking = f < L[2] + 36; cm.g.position.set(t[0] - 1.6, 0, -1.3); cm.update(((rf / 22) % 1), walking, rf); R.camels[1].update(0, false, rf); R.camels[2].update(0, false, rf);
      S.serai.set(signTex("NARANGA", f >= w("2.narang") - 2 ? { skip: [6] } : {})); pop("serai", w("2.narang") - 2, 8, 0.12); }
    if (id === "deck") { const steps: [number, string][] = [[0, "NARANGA"], [110, "NARANG"], [118, "NARANJ"], [126, "LARANJA"], [134, "ORANGE"], [140, "SINAASAPPEL"], [148, "?"]]; let txt = "NARANGA", f0 = -99; for (const [a, s] of steps) if (f >= a) { txt = s; f0 = a; } S.deck.set(signTex(txt)); S.deck.g.rotation.x = f - f0 < 2 ? 0.5 * Math.sin(Math.PI * (f - f0 + 0.5) / 2) : 0.05 * Math.sin(rf * 0.09); }
    if (id === "scholar") { const nar = w("1.naranga"); S.scholar.set(signTex(f >= nar ? "NARANGA" : "", {})); pop("scholar", nar, 10, 0.3); }
    if (id === "souk") { const bec = w("3.became"), nj = w("3.naranj"); S.souk.set(f >= nj ? signTex("NARANJ") : f >= bec + 2 ? signTex("NARANG", { skip: [5] }) : signTex("NARANG")); pop("souk", nj, 10, 0.25); }
    if (id === "lisbon") { const la = w("3.laranja"); S.lisbon.set(signTex(f >= la ? "LARANJA" : "NARANJ")); pop("lisbon", la, 10, 0.25); }
    if (id === "europe") { const nN = w("4.n"), fell = w("4.fell"), land = fell + 4 + 9; S.europe.set(f >= land ? signTex("AN ORANGE") : f >= nN - 2 ? signTex("A NARANGE", { skip: [2] }) : signTex("A NARANGE")); pop("europe", land, 8, 0.08); if (f >= land && f < land + 8) S.europe.g.rotation.x = 0.2 * Math.sin((f - land) * 1.4) * (1 - (f - land) / 8); }
    if (id === "dutch") { const chs = w("7.chinas"); S.dutch.set(signTex(f >= chs - 2 ? "SINAAS APPEL" : "SINAASAPPEL")); pop("dutch", chs - 2, 10, 0.18); }
    if (id === "stall" || id === "goa") { const sa = w("10.santra"), s = S.goa; s.set(signTex(f >= sa ? "SANTRA" : "SINTRA")); pop("goa", sa, 10, 0.35); if (f >= L[9] && f < sa) s.g.rotation.z = 0.04 * Math.sin(rf * (0.6 + 1.6 * (f - L[9]) / (sa - L[9]))); else s.g.rotation.z = 0; }
  }
}
void ORIGIN;
