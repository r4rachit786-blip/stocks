// Night lighting built from visible sources (STUDY.md A): every source = emissive core (HDR, blooms) + flat additive
// halo sprite + a warm pool on the nearest surfaces. The world keeps the kit's two-tone model (moon = "lit" colour,
// ultramarine = "shade" colour) and ADDS three's own point lights on top, which the kit's twoTone() throws away.
import * as THREE from "three";
import { TONE, LFB } from "./shade";
import { ctex } from "./paint";
import { NOINK } from "./ink";

export const NIGHT = { uPtK: { value: 1.0 } };

const NIGHT_TONE = /* glsl */ `
#if NUM_DIR_LIGHTS > 0
{
  vec3 warm = reflectedLight.directDiffuse;                                   // point lights only (the moon light has intensity 0)
  vec3 sunV = directionalLights[ 0 ].direction;
  vec3 upV = normalize( ( viewMatrix * vec4( 0.0, 1.0, 0.0, 0.0 ) ).xyz );
  float ndl = max( dot( geometryNormal, sunV ), 0.0 );
  float sunTerm = sunVis * smoothstep( 0.0, uTerm, ndl );
  float skyK = mix( uSideK, 1.0, 0.5 + 0.5 * dot( geometryNormal, upV ) );
  vec3 lit = uLitCol * mix( 1.0, ndl, uLambert );
  float lum = dot( diffuseColor.rgb, vec3( 0.2126, 0.7152, 0.0722 ) );
  vec3 alb = max( mix( vec3( lum ), diffuseColor.rgb, uSat ), 0.0 );
  // warm light is a colour replacement, not a brighter blue: where it lands the cool base fades out
  float w = clamp( dot( warm, vec3( 0.5 ) ) * 1.6, 0.0, 1.0 );
  reflectedLight.directDiffuse = alb * mix( uShadeCol, lit, sunTerm ) * skyK * ( 1.0 - 0.75 * w ) + uShadeLift * ( 1.0 - sunTerm ) + warm * uPtK;
  reflectedLight.indirectDiffuse = vec3( 0.0 );
}
#endif
`;
const DECL = "#include <common>\nuniform vec3 uLitCol; uniform vec3 uShadeCol; uniform vec3 uShadeLift; uniform float uLambert; uniform float uSideK; uniform float uTerm; uniform float uSat; uniform float uPtK;";
/** turn a kit two-tone material into the night version (call once per material after the set is built) */
export function nightTone(m: THREE.Material) {
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, TONE, NIGHT);
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", DECL)
      .replace("#include <lights_fragment_begin>", "float sunVis = 1.0;\n" + LFB)
      .replace("#include <lights_fragment_end>", "#include <lights_fragment_end>\n" + NIGHT_TONE);
  };
  m.customProgramCacheKey = () => "nightTone2";
  m.needsUpdate = true;
  return m;
}
export function nightAll(root: THREE.Object3D) {
  const seen = new Set<THREE.Material>();
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    for (const m of (Array.isArray(mesh.material) ? mesh.material : [mesh.material]) as THREE.Material[]) {
      if (!m || seen.has(m)) continue;
      seen.add(m);
      if (m.customProgramCacheKey && m.customProgramCacheKey().startsWith("twoTone")) nightTone(m);
    }
  });
}

// ---------------- glow pieces ----------------
/** flat-topped halo (reference: excess ~0.4 at the edge, 0.25 at mid radius, long soft tail) */
export const haloTex = () => ctex("haloN", 256, 256, (g) => {
  const im = g.createImageData(256, 256);
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
    const u = Math.hypot(x - 127.5, y - 127.5) / 128;
    const a = (0.5 * Math.exp(-((u / 0.2) ** 2)) + 0.34 * Math.exp(-((u / 0.52) ** 2))) * (1 - Math.min(1, Math.max(0, (u - 0.75) / 0.25)));
    const i = (y * 256 + x) * 4; im.data[i] = im.data[i + 1] = im.data[i + 2] = 255; im.data[i + 3] = Math.round(255 * Math.min(1, a));
  }
  g.putImageData(im, 0, 0);
});
/** soft pool for ground / table / wall (additive decal) */
export const poolTex = () => ctex("poolN", 256, 256, (g) => {
  const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.35, "rgba(255,255,255,0.72)"); gr.addColorStop(0.7, "rgba(255,255,255,0.2)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
});
/** window-shaped light patch: four panes with the glazing bars as gaps, soft edges */
export const paneTex = () => ctex("paneN", 256, 256, (g) => {
  g.clearRect(0, 0, 256, 256);
  g.filter = "blur(5px)"; g.fillStyle = "#fff";
  for (const [x, y] of [[26, 22], [136, 22], [26, 134], [136, 134]]) g.fillRect(x, y, 94, 100);
  g.filter = "none";
  const m = g.createLinearGradient(0, 0, 0, 256); m.addColorStop(0, "rgba(0,0,0,1)"); m.addColorStop(1, "rgba(0,0,0,0.45)"); // falls off away from the wall
  g.globalCompositeOperation = "destination-in"; g.fillStyle = m; g.fillRect(0, 0, 256, 256); g.globalCompositeOperation = "source-over";
});
export const halo = (parent: THREE.Object3D, pos: THREE.Vector3, size: number, col: THREE.ColorRepresentation, k = 1) => {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex(), color: new THREE.Color(col).multiplyScalar(k), fog: false, depthWrite: false, transparent: true, blending: THREE.AdditiveBlending }));
  s.position.copy(pos); s.scale.setScalar(size); s.renderOrder = 6; s.layers.set(NOINK);
  parent.add(s);
  return s;
};
/** additive light patch lying on a surface: corners a, b, c, d counter-clockwise seen from the lit side */
export const patch = (parent: THREE.Object3D, tex: THREE.Texture, a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, d: THREE.Vector3, col: THREE.ColorRepresentation, k = 1) => {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute([a, b, c, a, c, d].flatMap((v) => [v.x, v.y, v.z]), 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1], 2));
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(col).multiplyScalar(k), transparent: true, depthWrite: false, fog: false,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }));
  m.renderOrder = 4; m.layers.set(NOINK);
  parent.add(m);
  return m;
};
/** self-lit thing (lamp glass, bulb, dial, window): HDR colour so the bloom picks it up */
export const emissive = (col: THREE.ColorRepresentation, k: number, map?: THREE.Texture) =>
  new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(k), map: map ?? null, fog: false });
