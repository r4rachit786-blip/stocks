// v3 night scene. Kit pieces kept: sky shader, card posing, two-tone uniforms (now moon = lit colour, ultramarine =
// shade colour). New: light comes from visible sources (night.ts / props.ts): lantern, radio dial, torches, paper
// lanterns, windows and doorway, moon with halo and glitter path. Sources flicker a little every frame.
import * as THREE from "three";
import { Batch, lam } from "./build";
import { cloudHD } from "./paint";
import { TONE, CHAR, untone } from "./shade";
import { NOINK } from "./ink";
import { Pool, Actor, Fx } from "./cards";
import { stage } from "./cast";
import { camAt, MOON, HOUSE } from "./story";
import { V, rng, quadUV } from "./geo";
import { islandTex, dryGroundHD } from "./paintx";
import { seaNight, glitterTex, starsTex, flameTex } from "./paint3";
import { buildPlane } from "./plane";
import { mats, buildRocks, stoneWall, palm, kiawe, buildHouse, buildTufts } from "./set";
import { buildParty, Source } from "./props";
import { nightAll, halo, patch, NIGHT } from "./night";
import { ctex } from "./paint";

/** night look (STUDY.md A): ultramarine base, median luma ~0.25, never black; warm only where a source reaches */
export const LOOK_N = {
  lit: [0.26, 0.34, 0.92] as const, shade: [0.095, 0.125, 0.47] as const, lift: [0.018, 0.022, 0.09] as const,
  lambert: 0.35, sideK: 0.82, term: 0.25, sat: 0.5, ptK: 1.0,
  sky: { c: ["#8a84e2", "#5d68d8", "#3848bc", "#252f98", "#161c6a"], e: [0, 2.5, 8, 18, 45] },
  fog: "#5a62cc", fogNear: 16, fogFar: 190,
  cloud: { lit: "#b9c2f6", mid: "#6c7ad2", shade: "#3e499e" },
};
const moonTex = () => ctex("moonN", 256, 256, (g) => {
  g.clearRect(0, 0, 256, 256);
  const gr = g.createRadialGradient(110, 104, 10, 128, 128, 122); gr.addColorStop(0, "#ffffff"); gr.addColorStop(0.8, "#e9eefc"); gr.addColorStop(1, "#cfd8f6");
  g.fillStyle = gr; g.beginPath(); g.arc(128, 128, 120, 0, 7); g.fill();
  g.fillStyle = "rgba(170,184,236,0.5)"; for (const [x, y, r] of [[90, 100, 26], [160, 84, 16], [150, 160, 30], [84, 168, 14], [188, 132, 12]]) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
});

export class World {
  root = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];
  private sun: THREE.DirectionalLight;
  private sky: THREE.Mesh; private skyMat: THREE.ShaderMaterial;
  private fog = new THREE.Fog("#5a62cc", 16, 190);
  private clouds: THREE.Mesh[] = [];
  private far: THREE.Object3D[] = [];
  private moonDir: THREE.Vector3;
  private src: Source[];
  private frustum = new THREE.Frustum();
  private m4 = new THREE.Matrix4(); private v = new THREE.Vector3(); private sph = new THREE.Sphere();

  constructor() {
    const R = this.root, D2R = Math.PI / 180;
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
    // moon = the shadow-casting "sun" of the two-tone model (its own three.js intensity is 0: only point lights add)
    const az = MOON.az * D2R, el = MOON.el * D2R;
    this.moonDir = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)).normalize();
    this.sun = new THREE.DirectionalLight("#ffffff", 0);
    this.sun.castShadow = true; this.sun.shadow.mapSize.set(4096, 4096);
    R.add(this.sun, this.sun.target);
    // ---- far things that follow the camera: stars, moon disc + halo, clouds ----
    const farAdd = (o: THREE.Object3D, order: number) => { o.renderOrder = order; o.layers.set(NOINK); o.frustumCulled = false; this.far.push(o); R.add(o); o.userData.p = o.position.clone(); return o; };
    const st = new THREE.Mesh(new THREE.PlaneGeometry(1700, 850), new THREE.MeshBasicMaterial({ map: starsTex(), transparent: true, depthWrite: false, fog: false, color: new THREE.Color(1.5, 1.5, 1.7) }));
    st.position.set(100, 520, -1250); farAdd(st, -0.9);
    const mp = this.moonDir.clone().multiplyScalar(1200);
    const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: moonTex(), color: new THREE.Color(1.75, 1.85, 2.2), fog: false, depthWrite: false })); moon.position.copy(mp); moon.scale.setScalar(150); farAdd(moon, -0.7);
    const mh = halo(R, mp, 620, "#a9c0ff", 0.6); farAdd(mh, -0.75);
    const CL: [number, number, number, number][] = [[-22, 7, 260, 0], [-15, 12.5, 300, 1], [22, 9.5, 260, 2], [4, 20.5, 360, 3], [-34, 16, 300, 2], [31, 22, 330, 0], [11, 9, 150, 1]];
    for (const [azd, eld, w, k] of CL) {
      const a = azd * D2R, d = 1000;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: cloudHD(k, LOOK_N.cloud), transparent: true, depthWrite: false, fog: false }));
      m.position.set(Math.sin(a) * d, d * Math.tan(eld * D2R), -Math.cos(a) * d); m.scale.set(w, w / 2, 1); farAdd(m, -0.6); this.clouds.push(m);
    }
    const isl = new THREE.Mesh(new THREE.PlaneGeometry(330, 62), new THREE.MeshBasicMaterial({ map: islandTex(), transparent: true, depthWrite: false, fog: false, color: new THREE.Color(0.2, 0.25, 0.72) }));
    isl.position.set(60, 22, -1150); farAdd(isl, -0.65);

    // ---- ground, bluff, night sea with the moon's glitter path ----
    const M = mats(), b = new Batch();
    const gm = lam("dryGround", () => ({ map: dryGroundHD() })); if (gm.map) { gm.map.anisotropy = 16; gm.map.needsUpdate = true; }
    b.add(quadUV(V(-200, 0, 40), V(200, 0, 40), V(200, 0, -26), V(-200, 0, -26), 0, 0, 400 / 6, 66 / 6), gm);
    b.add(quadUV(V(-200, -7, -25.5), V(200, -7, -25.5), V(200, 0, -26), V(-200, 0, -26), 0, 0, 160, 3), M.rock[1]);
    const sea = new THREE.Mesh(quadUV(V(-1600, -7, -25.5), V(1600, -7, -25.5), V(1600, -7, -1500), V(-1600, -7, -1500), 0, 0, 16, 1), new THREE.MeshBasicMaterial({ map: (() => { const t = seaNight(); t.wrapS = THREE.RepeatWrapping; t.needsUpdate = true; return t; })(), color: new THREE.Color(0.62, 0.62, 0.7) }));
    sea.layers.set(NOINK); R.add(sea);
    const mx = Math.sin(az), mz = -Math.cos(az), px = -mz, pz = mx, G = (t: number, w: number) => V(mx * t + px * w, -6.95, mz * t + pz * w);
    patch(R, glitterTex(), G(30, -10), G(30, 10), G(900, 34), G(900, -34), "#cfe0ff", 1.3);
    // ---- set dressing beyond the yard: wall, the Zero's tail, palms, kiawe, rocks, tufts ----
    stoneWall(b, M, [-0.5, -12.6], [14, -14.2], 0.95, 3, { big: 1.25, tumble: 5 });
    stoneWall(b, M, [-13, -1], [-10.5, 9], 0.9, 5, { big: 1.25 });
    stoneWall(b, M, [6.4, -3.2], [7.6, 6], 0.85, 7, { big: 1.2, tumble: 3 });
    buildRocks(b, M);
    palm(b, M, 4.2, -19.5, 9.5, [1.7, 0.4], 21); palm(b, M, 8.6, -16.5, 8.2, [-1.5, 0.3], 22); palm(b, M, 6.6, -22, 7.6, [-1.2, 0], 23);
    palm(b, M, -10.5, -12.5, 9.2, [1.4, 0.8], 24); palm(b, M, 11.5, -8.5, 8.8, [-1.6, 1.0], 25); palm(b, M, -8.2, 3.5, 8.4, [1.8, -0.6], 26);
    kiawe(b, M, 12.5, -20, 1.2, 31);
    b.build(R);
    buildHouse(R, M, HOUSE.x, HOUSE.z, HOUSE.yaw);
    const plane = buildPlane(); plane.position.set(6.4, 0.66, -18.6); R.add(plane);
    const tr = rng(55), tufts: [number, number, number][] = [];
    for (let i = 0; i < 170; i++) { const x = (tr() - 0.5) * 24, z = 7 - tr() * 30; if (x > -3.5 && x < 1.5 && z > -1.4 && z < 2.5) continue; if (x > -8 && x < 0 && z < -4.5 && z > -11) continue; tufts.push([x, z, 0.26 + tr() * 0.32]); }
    buildTufts(R, tufts);
    this.src = buildParty(R, M);
    nightAll(R);
  }

  private actor(i: number) { while (this.actors.length <= i) this.actors.push(new Actor(this.root)); return this.actors[i]; }
  private fx(i: number) { while (this.fxs.length <= i) this.fxs.push(new Fx(this.root)); return this.fxs[i]; }

  update(f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const L = LOOK_N, c = camAt(f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.1; cam.far = 2400; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    cam.layers.enable(NOINK);
    const centre = V(0, 0.5, -1), Rr = 13;
    this.sun.position.copy(centre).addScaledVector(this.moonDir, 120); this.sun.target.position.copy(centre);
    const sc = this.sun.shadow.camera;
    sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 20; sc.far = 260; sc.updateProjectionMatrix();
    this.sun.shadow.bias = -0.0004; this.sun.shadow.normalBias = 0.03;
    TONE.uLitCol.value.set(...L.lit); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = L.lambert; TONE.uSideK.value = L.sideK; TONE.uTerm.value = L.term; TONE.uBounce.value.set(0, 0, 0); TONE.uSat.value = L.sat;
    NIGHT.uPtK.value = L.ptK;
    // cards: the light is painted into the drawings (cast.ts relight), so the card shader stays neutral
    CHAR.uCharTint.value.set(1, 1, 1); CHAR.uCharShade.value = 0.93; CHAR.uGrad.value = 0.03; CHAR.uBodyGrad.value = 0.1; CHAR.uSideTint.value.set(0.9, 0.9, 1.0);
    const su = this.skyMat.uniforms;
    L.sky.c.forEach((h, i) => untone(h, su["c" + i].value));
    const e = L.sky.e.map((d) => (d * Math.PI) / 180); su.e.value.set(e[1], e[2], e[3], e[4]);
    this.sky.position.copy(cam.position);
    untone(L.fog, this.fog.color); this.fog.near = L.fogNear; this.fog.far = L.fogFar; scene.fog = this.fog; scene.background = null;
    for (const o of this.far) o.position.copy(o.userData.p as THREE.Vector3).add(cam.position);
    for (const m of this.clouds) m.lookAt(cam.position.x, m.position.y, cam.position.z);
    // ---- sources breathe: flames flicker (two sines + a per-source phase), halos and pools follow ----
    for (const s of this.src) {
      const fl = s.flame ? 1 + 0.1 * Math.sin(f * 1.9 + s.seed) + 0.06 * Math.sin(f * 3.1 + s.seed * 2.3) : 1 + 0.03 * Math.sin(f * 0.5 + s.seed);
      if (s.light) s.light.intensity = s.base * fl;
      if (s.halo) { const u = s.halo.userData; if (!u.s0) { u.s0 = s.halo.scale.x; u.c0 = s.halo.material.color.clone(); } s.halo.scale.setScalar(u.s0 * (0.94 + 0.06 * fl)); s.halo.material.color.copy(u.c0).multiplyScalar(fl); }
      for (const p of s.pool ?? []) { const mat = p.material as THREE.MeshBasicMaterial, u = p.userData; if (!u.c0) u.c0 = mat.color.clone(); mat.color.copy(u.c0).multiplyScalar(fl); }
      if (s.flame) { const mat = s.flame.material as THREE.MeshBasicMaterial; mat.map = flameTex((Math.floor(f / 2) + s.seed) % 4); s.flame.scale.set(1 + 0.08 * Math.sin(f * 2.3 + s.seed), fl, 1); s.flame.quaternion.copy(cam.quaternion); }
    }
    // ---- cast + effects (kit world.ts) ----
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0);
    const st = stage(f, { pos: cam.position, right, sun: this.moonDir });
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
