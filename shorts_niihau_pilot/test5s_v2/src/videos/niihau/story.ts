// Niihau look test: ONE 5 s shot (150 f, 30 fps, 1080x1920). Layout constants, the camera move and the acting cues.
// World axes: +y up, the wide camera sits at +z looking toward -z (sea and the neighbouring island on the horizon).
// The pilot's cockpit is at the world origin (x = 0, z = 0); the Zero's nose points screen-right and toward the lens.
export const FPS = 30;
export const TOTAL = 150;
export const D0 = 0; // ground height (kit build.ts imports it)
export type V3 = [number, number, number];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
/** kit camera ease: symmetric smootherstep (attack = release) */
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const lerp3 = (a: V3, b: V3, k: number): V3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];

// ---------------- layout ----------------
export const SU = 0.00216;            // metres per character design unit (kit: 1000 units = 2.16 m)
export const PLANE_Y = 0.66;          // fuselage centre line above the ground (belly dug into the dirt)
export const PLANE_YAW = -28;         // deg about y: local +x (nose) -> world (0.88, 0, 0.47)
export const PLANE_PITCH = -3.5;      // deg, nose down
export const PLANE_ROLL = 8.5;        // deg, near (right) wing down
export const SILL = 0.40;             // cockpit sill above the centre line (plane local)
export const PILOT_S = 1.4;           // pilot card scale
/** pilot card origin (soles of the 600 x 1000 design) and eye point in world space */
export const PILOT: V3 = [0.0, PLANE_Y + SILL - 178 * SU * PILOT_S, 0.0];
export const EYE: V3 = [0.0, PILOT[1] + 400 * SU * PILOT_S, 0.0];
/** engine cowl (smoke source) in world space */
export const COWL: V3 = [1.72, 1.32, 0.92];

// ---------------- acting cues (frames) ----------------
export const F_PULL = 36, F_WIDE = 80;       // the one reveal move
export const F_SNAP = 54;                    // pilot comes round: stars stop, blink, confused
export const F_LOOK2 = 86;                   // looks at the other group
export const F_HES = 108;                    // hesitant face
export const F_WAVE = 114;                   // arm starts to rise
export const F_WAVE_UP = 124;                // arm is up, two small waves follow

// ---------------- camera ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
/** dolly toward the look point by factor k (subject grows 1 / k) */
const dolly = (pos: V3, look: V3, k: number): V3 => [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k];

// close-up: lens just left of the fuselage axis so the windscreen frame sits beside the face, not across it
const CU_POS: V3 = [-1.05, EYE[1] + 0.02, 4.75], CU_LOOK: V3 = [0.07, EYE[1] - 0.06, 0], CU_FOV = 30;
// wide: high three-quarter view; the pilot's eyes land near y = 0.42 of the frame, islanders along the lower third
const W_POS: V3 = [-0.75, 4.05, 21.4], W_LOOK: V3 = [-0.42, 0.86, 0], W_FOV = 31;

export const camAt = (f: number): Cam => {
  // 0-36: slow push-in 0.28 %/f; 36-80: one symmetric glide; 80-150: slow push 0.2 %/f (never a static hold)
  const a: Cam = { pos: dolly(CU_POS, CU_LOOK, Math.exp(-0.0028 * Math.min(f, F_WIDE))), look: CU_LOOK, fov: CU_FOV, roll: 0 };
  if (f <= F_PULL) return a;
  // hold = slow zoom push 0.16 %/f (a dolly would slide the islanders and the wall out of the bottom of the frame);
  // it already runs under the second half of the glide, so the move settles into the push without a stop
  const kb = Math.exp(0.0016 * (TOTAL - 1 - Math.max(f, F_PULL + 22)));
  const b: Cam = { pos: W_POS, look: W_LOOK, fov: (360 / Math.PI) * Math.atan(Math.tan((W_FOV * Math.PI) / 360) * kb), roll: 0 };
  const k = glide((f - F_PULL) / (F_WIDE - F_PULL));
  // the look point leads a little (it settles before the position), so the pilot never leaves the frame on the way out
  const kl = glide(Math.min(1, ((f - F_PULL) / (F_WIDE - F_PULL)) * 1.12));
  return { pos: lerp3(a.pos, b.pos, k), look: lerp3(a.look, b.look, kl), fov: lerp(a.fov, b.fov, k), roll: lerp(0.012, 0, k) * Math.sin(Math.PI * k) };
};

// ---------------- lens ----------------
/** thin-lens blur: cInf = blur-disc radius (px at 1080 wide) at infinity; focus = world point */
export const dofAt = (f: number): { cInf: number; focus: V3 } => {
  const k = glide((f - F_PULL) / (F_WIDE - F_PULL));
  // CU: eyes sharp, field soft (kit: close-ups 12-14). Wide: nearly sharp, a touch of depth on the wall and the far field.
  return { cInf: lerp(13, 3.2, k), focus: lerp3(EYE, [0, 1.2, 4.5], k) };
};
