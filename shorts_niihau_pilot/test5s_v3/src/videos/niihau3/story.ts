// Niihau night test (v3): 150 f, 30 fps, 1080x1920. The welcome party; the battery radio brings the news.
// Three shot sizes like the reference (STUDY.md B): prop insert -> low wide-angle reveal -> MS of the pilot with a
// blurred over-the-shoulder head. One ~40 f symmetric glide with roll, a push on every hold, one hard cut.
// World: +y up, yard in front of the house, cameras on the +z side looking toward -z (bluff, sea, moon).
export const FPS = 30;
export const TOTAL = 150;
export const D0 = 0;
export type V3 = [number, number, number];
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const lerp3 = (a: V3, b: V3, k: number): V3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];

export const SU = 0.00216;
// the wrecked Zero beyond the wall (plane.ts reads these)
export const PLANE_Y = 0.66, PLANE_YAW = 205, PLANE_PITCH = -3.5, PLANE_ROLL = 8.5, SILL = 0.4;

// ---------------- layout (metres) ----------------
export const TABLE = { x0: -2.3, x1: 0.15, z0: -0.25, z1: 0.7, y: 0.78 };
export const RADIO: V3 = [-1.62, TABLE.y, 0.18];        // centre of its base
export const LANTERN: V3 = [-1.99, TABLE.y, 0.1];
export const BATTERY: V3 = [-1.26, TABLE.y, 0.46];
export const TORCH1: V3 = [1.62, 0, -1.3], TORCH2: V3 = [-1.72, 0, -1.6];
export const PILOT: V3 = [1.02, 0, 0.5];
export const PILOT_S = 1.15;
export const PILOT_EYE: V3 = [PILOT[0], (975 - 404) * SU * PILOT_S, PILOT[2]];
export const HOUSE = { x: -4.2, z: -7.5, yaw: 0.3 };
/** moon: azimuth from -z toward +x, elevation (deg) */
export const MOON = { az: 3.5, el: 17 };

// ---------------- cues (frames) ----------------
export const F_NEWS = 24;                 // the announcement: the kid's grin drops
export const F_PULL = 38, F_WIDE = 78;    // the reveal glide (40 f, symmetric)
export const F_TURN = 70;                 // heads start to turn to the pilot (staggered 3 f each)
export const F_CUT = 94;                  // hard cut to the pilot
export const F_DART = [104, 116, 127, 138]; // his eyes flick left / right / left / camera

// ---------------- camera ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
const dolly = (pos: V3, look: V3, k: number): V3 => [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k];
const zoom = (fov: number, k: number) => (360 / Math.PI) * Math.atan(Math.tan((fov * Math.PI) / 360) * k);

// insert: lens just above the table top, raking over the cloth at the radio, tilted
const IN_POS: V3 = [-1.74, 0.99, 1.72], IN_LOOK: V3 = [-1.56, 1.0, 0.1], IN_FOV = 38, IN_ROLL = -0.07;
// wide: lens at knee height looking up under the lantern string, wide lens
const W_POS: V3 = [0.5, 0.9, 4.7], W_LOOK: V3 = [0.2, 1.34, 0], W_FOV = 54;
// pilot MS over the woman's shoulder: low eye level, slight up angle
export const P_POS: V3 = [0.12, 1.34, 4.15], P_LOOK: V3 = [0.95, 1.6, 0.5], P_FOV = 38;

export const shotAt = (f: number) => (f < F_CUT ? 1 : 2);
export const camAt = (f: number): Cam => {
  if (f >= F_CUT) { // push 0.3 %/f settling to 0.15 %/f, a breath of roll
    const n = f - F_CUT, k = Math.exp(-0.0015 * n - 0.06 * (1 - Math.exp(-n / 18)));
    return { pos: dolly(P_POS, P_LOOK, k), look: P_LOOK, fov: P_FOV, roll: 0.035 - 0.012 * smooth(n / 50) };
  }
  const a: Cam = { pos: dolly(IN_POS, IN_LOOK, Math.exp(-0.003 * Math.min(f, F_PULL + 14))), look: IN_LOOK, fov: IN_FOV, roll: IN_ROLL };
  if (f <= F_PULL) return a;
  const kb = Math.exp(0.002 * (F_CUT - Math.max(f, F_PULL + 20)));
  const b: Cam = { pos: W_POS, look: W_LOOK, fov: zoom(W_FOV, kb), roll: 0.02 };
  const u = (f - F_PULL) / (F_WIDE - F_PULL), k = glide(u);
  // rise first, then travel back (so the lens clears the table edge); roll swings through +4 deg and settles
  const ky = glide(Math.min(1, u * 1.25));
  const pos = lerp3(a.pos, b.pos, k); pos[1] = lerp(a.pos[1], b.pos[1] + 0.35 * Math.sin(Math.PI * k), ky);
  return { pos, look: lerp3(a.look, b.look, glide(Math.min(1, u * 1.1))), fov: lerp(a.fov, b.fov, k), roll: lerp(a.roll, b.roll, k) + 0.07 * Math.sin(Math.PI * k) };
};

/** thin-lens blur: cInf px at 1080 wide, focus point (reference: inserts / MS ~12 px, wides sharp) */
export const dofAt = (f: number): { cInf: number; focus: V3 } => {
  if (f >= F_CUT) return { cInf: 13, focus: PILOT_EYE };
  const k = glide((f - F_PULL) / (F_WIDE - F_PULL));
  return { cInf: lerp(14, 2.5, k), focus: lerp3([RADIO[0], 0.95, RADIO[2] + 0.1], [0, 1.4, 0], k) };
};
