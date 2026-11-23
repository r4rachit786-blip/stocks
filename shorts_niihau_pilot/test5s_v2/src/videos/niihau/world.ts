// The Niihau shot as one three.js scene (stripped copy of the kit's world.ts: same sky shader, light rig, two-tone
// uniforms, fog = horizon colour, per-frame card posing; the bridge, river and town are gone). The set is built in
// set.ts / plane.ts; update(f, camera, scene) poses camera, light, sky, clouds and the cast for frame f.
import * as THREE from "three";
import { Batch } from "./build";
import { cloudHD } from "./paint";
import { LIGHTS, LOOK } from "./lights";
import { TONE, CHAR, untone } from "./shade";
import { NOINK } from "./ink";
import { Pool, Actor, Fx } from "./cards";
import { stage } from "./cast";
import { camAt } from "./story";
import { V, rng } from "./geo";
import { islandTex } from "./paintx";
import { buildPlane } from "./plane";
import { mats, buildGround, buildEarth, buildRocks, stoneWall, buildFence, palm, kiawe, buildHouse, buildTufts, buildWindmill, spinWindmill } from "./set";

/** sun for the whole shot: kit "day" preset colours; azimuth turned so the key comes from upper screen-left and lights
 *  the plane's near flank and every face (kit per-shot override, like its front-lit town wide). Frozen: the camera
 *  only dollies along one axis, so a camera-relative sun and a fixed one are the same thing here. */
const SUN_AZ = -100, SUN_EL = 40;
/** sky stops (deg above the horizon): the kit day colours, pulled down so the deep blue reaches the top of a frame
 *  that only sees ~9 deg of sky in the wide (the kit spreads them over 40 deg for its low-angle shots) */
const SKY_E = [0, 1.6, 4.5, 9, 22];

export class World {
  root = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];
  private hemi: THREE.HemisphereLight; private sun: THREE.DirectionalLight;
  private sky: THREE.Mesh; private skyMat: THREE.ShaderMaterial;
  private fog = new THREE.Fog("#bccbec", 25, 300);
  private clouds: THREE.Mesh[] = [];
  private sunDir: THREE.Vector3;
  private frustum = new THREE.Frustum();
  private m4 = new THREE.Matrix4(); private v = new THREE.Vector3(); private sph = new THREE.Sphere();

  constructor() {
    const R = this.root;
    // ---- sky (kit shader: 5 colour stops by elevation, tone-map-inverted) ----
    this.skyMat = new THREE.ShaderMaterial({
      uniforms: { c0: { value: new THREE.Color() }, c1: { value: new THREE.Color() }, c2: { value: new THREE.Color() },
        c3: { value: new THREE.Color() }, c4: { value: new THREE.Color() }, e: { value: new THREE.Vector4() } },
      vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `uniform vec3 c0, c1, c2, c3, c4; uniform vec4 e; varying vec3 vP;
        void main(){ float el = asin(clamp(normalize(vP).y, -1.0, 1.0));
          vec3 c = mix(c0, c1, smoothstep(0.0, e.x, el));
          c = mix(c, c2, smoothstep(e.x, e.y, el));
          c = mix(c, c3, smoothstep(e.y, e.z, el));
          c = mix(c, c4, smoothstep(e.z, e.w, el));
          gl_FragColor = vec4(c, 1.0); }`,
      side: THREE.BackSide, depthWrite: false, fog: false,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1300, 48, 24), this.skyMat);
    this.sky.renderOrder = -1; this.sky.frustumCulled = false; this.sky.layers.set(NOINK);
    R.add(this.sky);
    // ---- light ----
    const az = THREE.MathUtils.degToRad(SUN_AZ), el = THREE.MathUtils.degToRad(SUN_EL), fx = 0, fz = -1; // view axis of the shot
    this.sunDir = new THREE.Vector3((fx * Math.cos(az) - fz * Math.sin(az)) * Math.cos(el), Math.sin(el), (fz * Math.cos(az) + fx * Math.sin(az)) * Math.cos(el)).normalize();
    this.hemi = new THREE.HemisphereLight("#cfe6ff", "#6c5c8c", 1.1);
    this.sun = new THREE.DirectionalLight("#fff0d6", 2.6);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(4096, 4096);
    R.add(this.hemi, this.sun, this.sun.target);
    // ---- clouds (kit cloudHD cards) over the sea, the neighbouring island on the horizon ----
    const cr = rng(8);
    const CL: [number, number, number, number][] = [[-34, 2.6, 120, 0], [-17, 6.2, 170, 1], [-4, 3.2, 100, 2], [9, 7.6, 190, 3], [22, 3.4, 130, 0], [36, 6.0, 150, 1], [-27, 11.5, 200, 2], [3, 13.5, 220, 3], [28, 12, 180, 0],
      [-48, 5, 160, 3], [50, 4, 150, 2], [-10, 19, 240, 1], [18, 21, 230, 2]];
    for (const [azd, eld, w, k] of CL) {
      const a = THREE.MathUtils.degToRad(azd), d = 760 + cr() * 80;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: cloudHD(k, LOOK.day.cloud), color: new THREE.Color(1.1, 1.1, 1.1), transparent: true, depthWrite: false, fog: false }));
      m.position.set(Math.sin(a) * d, d * Math.tan(THREE.MathUtils.degToRad(eld)), -Math.cos(a) * d); m.scale.set(w, w / 2, 1);
      m.layers.set(NOINK);
      this.clouds.push(m); R.add(m);
    }
    const isl = new THREE.Mesh(new THREE.PlaneGeometry(250, 52), new THREE.MeshBasicMaterial({ map: islandTex(), transparent: true, depthWrite: false, fog: false }));
    isl.position.set(8, 16.5, -1000); isl.renderOrder = -0.8; isl.layers.set(NOINK);
    R.add(isl);

    // ---- the set ----
    const M = mats();
    const { n, p } = buildGround(R, M);
    const b = new Batch();
    buildEarth(b, M, n, p);
    buildRocks(b, M);
    // the ranch wall the islanders stand behind (foreground), with a tumbled end; far walls across the field
    stoneWall(b, M, [-5.6, 12.15], [4.6, 11.2], 0.92, 3, { tumble: 9 });
    stoneWall(b, M, [-34, -24], [-3.5, -27.5], 1.0, 7, { big: 1.45, tumble: 6 });
    stoneWall(b, M, [2.5, -28], [40, -33], 1.0, 9, { big: 1.45, tumble: 6 });
    stoneWall(b, M, [-34, -24], [-44, 30], 1.0, 11, { big: 1.6 });
    buildFence(b, M, n, p);
    stoneWall(b, M, [-30, -72], [30, -78], 1.1, 13, { big: 1.9 });
    palm(b, M, -12.2, -38, 8.6, [1.5, 0.6], 21);
    palm(b, M, -14.6, -44, 7.4, [-1.3, 0.3], 22);
    palm(b, M, 7.4, -36, 8.4, [-1.6, 0.8], 23);
    palm(b, M, 10.6, -41, 7.2, [1.3, 0.2], 24);
    palm(b, M, -1.5, -64, 8.2, [0.9, 0], 25);
    palm(b, M, -5, -90, 8.6, [1.2, 0], 26);
    palm(b, M, 13.5, -86, 8.6, [-1.2, 0], 27);
    palm(b, M, 15.5, -92, 7.6, [0.8, 0], 28);
    kiawe(b, M, -17, -30, 1.0, 32);
    kiawe(b, M, 14.5, -55, 1.5, 33);
    kiawe(b, M, -22, -58, 1.4, 34);
    kiawe(b, M, -14, -86, 1.5, 36);
    buildWindmill(R, M, 5.6, -50);
    b.build(R);
    buildHouse(R, M, -5.2, -43, 0.2);
    R.add(buildPlane());
    // dry grass: thick along the wall foot, round the posts and rocks, thinning out over the field
    const tr = rng(55), tufts: [number, number, number][] = [];
    for (let i = 0; i < 46; i++) { const t = tr(); tufts.push([-5.6 + 10.2 * t + (tr() - 0.5) * 0.3, 12.15 - 0.95 * t + (tr() < 0.5 ? 0.42 : -0.42) + (tr() - 0.5) * 0.25, 0.3 + tr() * 0.34]); }
    for (let i = 0; i < 40; i++) tufts.push([(tr() - 0.5) * 9, 12.6 + tr() * 2.6, 0.3 + tr() * 0.35]);
    for (let i = 0; i < 190; i++) tufts.push([(tr() - 0.5) * 16, 11 - tr() * 24, 0.24 + tr() * 0.3]);
    for (let i = 0; i < 260; i++) tufts.push([(tr() - 0.5) * 80, -10 - tr() * 80, 0.35 + tr() * 0.4]);
    buildTufts(R, tufts.filter(([x, z]) => !(Math.abs(x * n.z - z * n.x) < 1.3 && x * n.x + z * n.z < 3 && x * n.x + z * n.z > -22) && !(Math.hypot(x, z) < 2.2)));
  }

  private actor(i: number) { while (this.actors.length <= i) this.actors.push(new Actor(this.root)); return this.actors[i]; }
  private fx(i: number) { while (this.fxs.length <= i) this.fxs.push(new Fx(this.root)); return this.fxs[i]; }

  update(f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const L = LIGHTS.day, K = LOOK.day;
    // ---- camera ----
    const c = camAt(f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.2; cam.far = 2000; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    cam.layers.enable(NOINK);
    // ---- light rig: kit day preset, two-tone uniforms; one fixed shadow frustum round the plane and the wall ----
    this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.hemiI;
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI;
    const centre = V(-0.5, 0.5, 5), Rr = 13.5;
    this.sun.position.copy(centre).addScaledVector(this.sunDir, 120); this.sun.target.position.copy(centre);
    const sc = this.sun.shadow.camera;
    sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 20; sc.far = 260; sc.updateProjectionMatrix();
    this.sun.shadow.bias = L.bias; this.sun.shadow.normalBias = L.normalBias * (Rr / 12);
    TONE.uLitCol.value.set(...L.lit); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = L.lambert; TONE.uSideK.value = L.sideK; TONE.uTerm.value = L.term; TONE.uBounce.value.set(...K.bounce); TONE.uSat.value = K.sat;
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade; CHAR.uGrad.value = L.charGrad;
    CHAR.uBodyGrad.value = L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);
    // ---- sky, fog = horizon colour, clouds ----
    const su = this.skyMat.uniforms;
    K.sky.c.forEach((h, i) => untone(h, su["c" + i].value));
    const e = SKY_E.map((deg) => THREE.MathUtils.degToRad(deg));
    su.e.value.set(e[1], e[2], e[3], e[4]);
    this.sky.position.copy(cam.position);
    untone(L.fog, this.fog.color); this.fog.near = L.fogNear; this.fog.far = L.fogFar;
    scene.fog = this.fog; scene.background = null;
    for (const m of this.clouds) m.lookAt(cam.position.x, m.position.y, cam.position.z);
    spinWindmill(f);
    // ---- cast + effects ----
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0);
    const st = stage(f, { pos: cam.position, right, sun: this.sunDir });
    this.frustum.setFromProjectionMatrix(this.m4.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
    let ai = 0;
    const used: Actor[] = [];
    for (const p of st.places) {
      const s2 = p.scale ?? 1;
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y + 1.1 * s2, p.z), 3.5))) continue;
      const a = this.actor(ai++);
      const [w, h, k] = p.size ?? [300, 500, 0.5];
      a.r = this.pool.req(p.key, w, h, k, p.draw);
      a.mesh.visible = true;
      a.mesh.position.set(p.x, p.y, p.z);
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
      ef.r = this.pool.req(p.key, p.cw, p.ch, 1, p.draw);
      ef.use(!!p.soft);
      ef.mesh.visible = true;
      ef.mesh.position.set(p.x, p.y, p.z);
      if (p.flat) ef.mesh.rotation.set(-Math.PI / 2, 0, p.rot ?? 0);
      else { ef.mesh.quaternion.copy(cam.quaternion); ef.mesh.rotateZ(p.rot ?? 0); }
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
