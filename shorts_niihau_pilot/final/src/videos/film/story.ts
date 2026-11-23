// "The Island That Was Supposed To Be Empty": the full ~64 s film. 31 pictures, one per clause, each cut 2 frames
// before its word (voice timings in words.json -> frame numbers below). Sets: field (day crash, night fight), lanai
// (party, radio, lock-up, fire), studio (map / calendar / cave / pictogram inserts), museum.
// Colour beats: warm day -> warm dusk party -> ultramarine night with fire -> high-key mechanism -> warm ending.
export const FPS = 30;
export const TOTAL = 1935;
export const D0 = 0;
export type V3 = [number, number, number];
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const lerp3 = (a: V3, b: V3, k: number): V3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];

export const SU = 0.00216;
// ---- field set (the crash site): cockpit at the origin, nose toward screen right and the lens ----
export const PLANE_Y = 0.66, PLANE_YAW = -28, PLANE_PITCH = -3.5, PLANE_ROLL = 8.5, SILL = 0.4;
export const PILOT_S = 1.4;
export const COCKPIT: V3 = [0, PLANE_Y + SILL - 178 * SU * PILOT_S, 0];
export const EYE: V3 = [0, COCKPIT[1] + 400 * SU * PILOT_S, 0];
export const COWL: V3 = [1.72, 1.32, 0.92];
// ---- lanai set (the party yard) ----
export const TABLE = { x0: -2.3, x1: 0.15, z0: -0.25, z1: 0.7, y: 0.78 };
export const RADIO: V3 = [-1.62, TABLE.y, 0.18];
export const LANTERN: V3 = [-1.99, TABLE.y, 0.1];
export const BATTERY: V3 = [-1.26, TABLE.y, 0.46];
export const TORCH1: V3 = [1.62, 0, -1.3], TORCH2: V3 = [-1.72, 0, -1.6];
export const GUEST: V3 = [0.9, 0, 0.5];
export const HOUSE = { x: -4.2, z: -7.5, yaw: 0.3 };
export const MOON = { az: -1.5, el: 14 };

export type SetName = "field" | "lanai" | "studio" | "museum" | "cave";
export type LookName = "day" | "dusk" | "night" | "high" | "museum";
/** camera: start and end framing; the move runs the whole shot (never static), half linear, half eased */
export type Shot = { id: number; a: number; set: SetName; look: LookName; p0: V3; l0: V3; f0: number; p1: V3; l1: V3; f1: number; r0?: number; r1?: number; cInf?: number; focus?: V3; fire?: number;
  /** extra framings inside the shot (one picture per clause): each starts n frames into the shot */
  cuts?: { n: number; p0: V3; l0: V3; f0: number; p1: V3; l1: V3; f1: number }[] };
const EY = EYE[1];
export const SHOTS: Shot[] = [
  // 1 briefing chart: the plan
  { id: 1, a: 0, set: "studio", look: "museum", p0: [0.2, 3.1, 0.75], l0: [0.0, 0.78, 0.02], f0: 40, p1: [-0.22, 2.15, 0.9], l1: [-0.25, 0.78, 0.3], f1: 38, r0: 0.06, r1: 0.02 },
  // 2 census board: 136 people
  { id: 2, a: 83, set: "field", look: "day", p0: [0.0, 1.5, 15.6], l0: [0.05, 1.3, 9.4], f0: 46, p1: [0.1, 1.5, 14.9], l1: [0.12, 1.3, 9.4], f1: 44 },
  // 3 chart again: the submarine
  { id: 3, a: 150, set: "studio", look: "museum", p0: [-0.2, 2.3, 0.95], l0: [-0.2, 0.78, 0.28], f0: 38, p1: [0.02, 2.1, 1.1], l1: [0.0, 0.78, 0.4], f1: 36, r0: -0.05, r1: -0.02 },
  // 4 crash: the dazed pilot
  { id: 4, a: 283, set: "field", look: "day", p0: [-1.05, EY + 0.02, 4.75], l0: [0.07, EY - 0.06, 0], f0: 30, p1: [-1.0, EY + 0.02, 4.45], l1: [0.07, EY - 0.06, 0], f1: 30, cInf: 6, focus: EYE },
  // 5 the fence, the whole wreck
  { id: 5, a: 312, set: "field", look: "day", p0: [-2.3, 1.05, 6.4], l0: [0.45, 1.45, 0.3], f0: 36, p1: [-2.1, 1.05, 5.9], l1: [0.45, 1.47, 0.3], f1: 35, r0: 0.05, r1: 0.02 },
  // 6 pulled out; pistol and papers borrowed
  { id: 6, a: 338, set: "field", look: "day", p0: [-0.3, 1.45, 9.9], l0: [-0.12, 1.42, 4.6], f0: 42, p1: [-0.2, 1.5, 9.2], l1: [-0.08, 1.45, 4.6], f1: 40 },
  // 7 he asks for them back
  { id: 7, a: 440, set: "field", look: "day", p0: [-0.35, 1.55, 9.3], l0: [-0.12, 1.5, 4.6], f0: 40, p1: [-0.3, 1.55, 8.8], l1: [-0.1, 1.5, 4.6], f1: 39, r0: 0.03, r1: 0.0 },
  // 8 nobody knows there is a war
  { id: 8, a: 521, set: "field", look: "day", p0: [-0.55, 1.45, 15.9], l0: [-0.55, 1.4, 9.6], f0: 52, p1: [-0.55, 1.45, 15.3], l1: [-0.55, 1.4, 9.6], f1: 51 },
  // 9 the party (dusk)
  { id: 9, a: 576, set: "lanai", look: "dusk", p0: [0.5, 1.0, 5.2], l0: [0.3, 1.2, 0], f0: 54, p1: [0.5, 1.0, 4.7], l1: [0.3, 1.2, 0], f1: 54, r0: -0.03, r1: 0.0 },
  // 10 the battery radio
  { id: 10, a: 633, set: "lanai", look: "night", p0: [-1.74, 0.99, 1.75], l0: [-1.56, 1.0, 0.1], f0: 38, p1: [-1.7, 0.99, 1.5], l1: [-1.5, 1.0, 0.1], f1: 38, r0: -0.07, r1: -0.04, cInf: 2.5, focus: [-1.5, 0.95, -0.15] },
  // 11 the party ends
  { id: 11, a: 705, set: "lanai", look: "night", p0: [0.5, 1.0, 4.9], l0: [0.3, 1.2, 0], f0: 54, p1: [0.55, 1.05, 4.3], l1: [0.4, 1.3, 0], f1: 52, r0: 0.03, r1: 0.0 },
  // 12 prisoner
  { id: 12, a: 741, set: "lanai", look: "night", p0: [0.6, 1.2, 4.9], l0: [0.9, 1.3, 0.4], f0: 48, p1: [0.66, 1.2, 4.5], l1: [0.9, 1.3, 0.4], f1: 47 },
  // 13 no boats
  { id: 13, a: 774, set: "lanai", look: "night", p0: [1.75, 1.4, -16.4], l0: [2.25, 1.45, -22], f0: 46, p1: [1.8, 1.4, -17.0], l1: [2.3, 1.5, -22], f1: 45, r0: -0.03, r1: 0.0 },
  // 14 five days: the calendar
  { id: 14, a: 853, set: "studio", look: "night", p0: [0.25, 2.72, 1.2], l0: [0, 2.7, -1], f0: 36, p1: [0.12, 2.72, 0.85], l1: [0, 2.7, -1], f1: 35, r0: 0.05, r1: 0.02 },
  // 15 the helper with a shotgun
  { id: 15, a: 903, set: "lanai", look: "night", p0: [0.55, 1.35, 5.3], l0: [0.75, 1.5, 1.1], f0: 38, p1: [0.6, 1.35, 4.9], l1: [0.75, 1.5, 1.1], f1: 38 },
  // 16 they burn a house
  { id: 16, a: 945, set: "lanai", look: "night", p0: [1.7, 1.25, 4.3], l0: [-2.2, 2.3, -6.5], f0: 52, p1: [1.6, 1.25, 3.8], l1: [-2.3, 2.35, -6.5], f1: 51, r0: 0.04, r1: 0.01, fire: 1 },
  // 17 they burn the plane
  { id: 17, a: 998, set: "field", look: "night", p0: [-0.75, 3.0, 17.5], l0: [-0.3, 1.1, 0], f0: 36, p1: [-0.75, 2.9, 16.4], l1: [-0.3, 1.1, 0], f1: 35, fire: 2 },
  // 18 the village hides in caves
  { id: 18, a: 1030, set: "cave", look: "night", p0: [0.3, 1.15, 5.3], l0: [0.05, 1.25, 0.3], f0: 44, p1: [0.25, 1.15, 4.8], l1: [0.05, 1.25, 0.3], f1: 43 },
  // 19 one sheep rancher does not
  { id: 19, a: 1073, set: "field", look: "night", p0: [-0.3, 1.5, 13.4], l0: [-0.6, 1.8, 9.5], f0: 36, p1: [-0.4, 1.5, 12.9], l1: [-0.6, 1.82, 9.5], f1: 35, fire: 2 },
  // 20 caught with his wife; he jumps the pilot
  { id: 20, a: 1115, set: "field", look: "night", p0: [0.15, 1.45, 15.0], l0: [0.15, 1.45, 9.5], f0: 46, p1: [0.2, 1.45, 14.4], l1: [0.2, 1.5, 9.5], f1: 45, fire: 2 },
  // 21 three shots
  { id: 21, a: 1196, set: "field", look: "night", p0: [0.3, 1.5, 14.4], l0: [0.3, 1.5, 9.5], f0: 42, p1: [0.3, 1.5, 14.0], l1: [0.3, 1.5, 9.5], f1: 42, fire: 2 },
  // 22 that is when he got mad
  { id: 22, a: 1248, set: "field", look: "night", p0: [-0.25, 1.7, 12.6], l0: [-0.2, 1.86, 9.5], f0: 32, p1: [-0.22, 1.75, 11.6], l1: [-0.2, 1.88, 9.5], f1: 30, fire: 2 },
  // 23 lifted and thrown into the stone wall
  { id: 23, a: 1313, set: "field", look: "night", p0: [0.45, 1.25, 14.3], l0: [0.45, 2.0, 9.5], f0: 46, p1: [0.7, 1.25, 14.0], l1: [0.8, 1.95, 9.5], f1: 46, r0: -0.04, r1: 0.03, fire: 2 },
  // 24 his wife and the rock
  { id: 24, a: 1385, set: "field", look: "night", p0: [0.3, 1.45, 13.3], l0: [0.4, 1.6, 9.6], f0: 36, p1: [0.32, 1.5, 12.8], l1: [0.4, 1.62, 9.6], f1: 35, fire: 2 },
  // 25 never empty: private
  { id: 25, a: 1439, set: "studio", look: "high", p0: [0.2, 3.1, 0.75], l0: [0.0, 0.78, 0.02], f0: 40, p1: [-0.18, 2.1, 0.95], l1: [-0.18, 0.78, 0.28], f1: 38, r0: -0.06, r1: -0.02 },
  // 26 no phones, no power, one boat a week
  { id: 26, a: 1543, set: "studio", look: "high", p0: [-2.6, 2.75, 2.5], l0: [-2.6, 2.7, -1], f0: 38, p1: [-2.6, 2.72, 2.2], l1: [-2.6, 2.7, -1], f1: 38, cuts: [{ n: 0, p0: [-2.6, 2.75, 2.5], l0: [-2.6, 2.7, -1], f0: 38, p1: [-2.6, 2.72, 2.2], l1: [-2.6, 2.7, -1], f1: 38 }, { n: 30, p0: [-0.9, 2.75, 2.5], l0: [-0.9, 2.7, -1], f0: 38, p1: [-0.9, 2.72, 2.2], l1: [-0.9, 2.7, -1], f1: 38 }, { n: 56, p0: [0.9, 2.75, 2.5], l0: [0.9, 2.7, -1], f0: 38, p1: [0.9, 2.72, 2.2], l1: [0.9, 2.7, -1], f1: 38 }, { n: 74, p0: [2.6, 2.75, 2.5], l0: [2.6, 2.7, -1], f0: 38, p1: [2.6, 2.72, 2.2], l1: [2.6, 2.7, -1], f1: 38 }] },
  // 27 a house with the curtains drawn
  { id: 27, a: 1642, set: "lanai", look: "high", p0: [-5.089, 2.15, -2.934], l0: [-5.56, 2.2, -4.46], f0: 66, p1: [-5.178, 2.17, -3.221], l1: [-5.56, 2.2, -4.46], f1: 64 },
  // 28 the medal
  { id: 28, a: 1689, set: "field", look: "day", p0: [-10.55, 1.5, 9.1], l0: [-12, 1.48, 6], f0: 36, p1: [-10.65, 1.5, 8.8], l1: [-12, 1.5, 6], f1: 35 },
  // 29 the submarine never came
  { id: 29, a: 1726, set: "lanai", look: "dusk", p0: [0.6, 1.9, -20.4], l0: [1.0, -1.6, -50], f0: 44, p1: [0.6, 1.9, -20.9], l1: [1.0, -1.2, -50], f1: 42 },
  // 30 the plane in the museum
  { id: 30, a: 1767, set: "museum", look: "museum", p0: [-1.3, 1.7, 9.6], l0: [-0.3, 1.7, -0.5], f0: 54, p1: [-1.0, 1.7, 8.8], l1: [-0.3, 1.7, -0.5], f1: 53 },
  // 31 a souvenir from the island that was supposed to be empty
  { id: 31, a: 1833, set: "museum", look: "museum", p0: [1.15, 1.2, 6.9], l0: [1.2, 1.1, 3.9], f0: 34, p1: [0.6, 1.6, 9.2], l1: [0.45, 1.32, 1.0], f1: 50, r0: 0.03, r1: 0.0 },
];
export const shotAt = (f: number) => { let s = SHOTS[0]; for (const x of SHOTS) if (f >= x.a) s = x; return s; };
export const shotEnd = (s: Shot) => (s.id < SHOTS.length ? SHOTS[s.id].a : TOTAL);
/** frames since the shot began, and its 0..1 progress */
export const inShot = (f: number) => { const s = shotAt(f), n = f - s.a; return { s, n, u: n / Math.max(1, shotEnd(s) - s.a) }; };

export type Cam = { pos: V3; look: V3; fov: number; roll: number };
export const camAt = (f: number): Cam => {
  const { s, n, u: u0 } = inShot(f);
  let c: { p0: V3; l0: V3; f0: number; p1: V3; l1: V3; f1: number } = s, u = u0;
  if (s.cuts) { const len = shotEnd(s) - s.a; let a = 0, b = s.cuts[0].n; for (let i = 0; i < s.cuts.length; i++) if (n >= s.cuts[i].n) { c = s.cuts[i]; a = s.cuts[i].n; b = i + 1 < s.cuts.length ? s.cuts[i + 1].n : len; } u = (n - a) / Math.max(1, b - a); }
  const k = 0.55 * u + 0.45 * glide(u);
  if (c !== s) return { pos: lerp3(c.p0, c.p1, k), look: lerp3(c.l0, c.l1, k), fov: lerp(c.f0, c.f1, k), roll: 0 };
  return { pos: lerp3(s.p0, s.p1, k), look: lerp3(s.l0, s.l1, k), fov: lerp(s.f0, s.f1, k), roll: lerp(s.r0 ?? 0, s.r1 ?? 0, k) };
};
export const dofAt = (f: number): { cInf: number; focus: V3 } => { const s = shotAt(f); return { cInf: s.cInf ?? 0, focus: s.focus ?? s.l0 }; };
