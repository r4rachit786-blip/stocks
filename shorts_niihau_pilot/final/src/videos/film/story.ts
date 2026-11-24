// "The Island That Was Supposed To Be Empty": the full ~64 s film. Round 4: continuous takes. The 31 beats below
// only say which set / look a clause plays in; the camera comes from TRACKS (key-track travel between subjects,
// kit run() blend with glide + push holds) and location changes are hard cuts or two blurred whips. No dissolves.
// Sets: air (Pearl Harbor hook, the flight), field (census, landing, crash, fight, PRIVATE sign), lanai, studio
// (calendar, mechanism wall), cave, museum.
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

export type SetName = "field" | "lanai" | "studio" | "museum" | "cave" | "air";
export type LookName = "day" | "dusk" | "night" | "high" | "museum" | "air";
/** one beat per clause: set, look and (outside TRACKS) a start/end framing */
export type Shot = { id: number; a: number; set: SetName; look: LookName; p0: V3; l0: V3; f0: number; p1: V3; l1: V3; f1: number; r0?: number; r1?: number; cInf?: number; focus?: V3; fire?: number };
const EY = EYE[1];
const Z: V3 = [0, 0, 0];
const B = (id: number, a: number, set: SetName, look: LookName, fire?: number): Shot => ({ id, a, set, look, p0: Z, l0: Z, f0: 40, p1: Z, l1: Z, f1: 40, fire });
export const SHOTS: Shot[] = [
  B(1, 0, "air", "air"),        // hook: the pilot over the burning harbour, the briefing in a thought bubble
  B(2, 83, "field", "day"),     // dive through cloud to the census board
  B(3, 150, "air", "air"),      // the damaged Zero over the sea: island ahead, the waiting submarine
  B(4, 283, "field", "day"),    // take: the landing, the fence ...
  B(5, 312, "field", "day"),
  B(6, 338, "field", "day"),    // ... pulled out, pistol and papers
  B(7, 440, "field", "day"),    // ... asks for them back
  B(8, 521, "field", "day"),    // ... crane over to the islanders
  // 9 the party (dusk)
  { id: 9, a: 576, set: "lanai", look: "dusk", p0: [0.5, 1.0, 5.2], l0: [0.3, 1.2, 0], f0: 54, p1: [0.5, 1.0, 4.7], l1: [0.3, 1.2, 0], f1: 54, r0: -0.03, r1: 0.0 },
  B(10, 633, "lanai", "night"), // take: radio insert -> the frozen party
  B(11, 705, "lanai", "night"),
  B(12, 741, "lanai", "night"), // whip: prisoner
  B(13, 774, "lanai", "night"), // whip: no boats
  // 14 five days: the calendar
  { id: 14, a: 853, set: "studio", look: "night", p0: [0.25, 2.72, 1.2], l0: [0, 2.7, -1], f0: 36, p1: [0.12, 2.72, 0.85], l1: [0, 2.7, -1], f1: 35, r0: 0.05, r1: 0.02 },
  B(15, 903, "lanai", "night"), // take: helper with a shotgun -> the burning house
  B(16, 945, "lanai", "night", 1),
  // 17 they burn the plane
  { id: 17, a: 998, set: "field", look: "night", p0: [-0.75, 3.0, 17.5], l0: [-0.3, 1.1, 0], f0: 36, p1: [-0.75, 2.9, 16.4], l1: [-0.3, 1.1, 0], f1: 35, fire: 2 },
  // 18 the village hides in caves
  { id: 18, a: 1030, set: "cave", look: "night", p0: [0.3, 1.15, 5.3], l0: [0.05, 1.25, 0.3], f0: 44, p1: [0.25, 1.15, 4.8], l1: [0.05, 1.25, 0.3], f1: 43 },
  B(19, 1073, "field", "night", 2), // take: the fight
  B(20, 1115, "field", "night", 2),
  B(21, 1196, "field", "night", 2),
  B(22, 1248, "field", "night", 2),
  B(23, 1313, "field", "night", 2),
  B(24, 1385, "field", "night", 2),
  B(25, 1439, "field", "high"),  // never empty: the ranch, then the PRIVATE sign on the fence
  B(26, 1543, "studio", "high"), // one lateral travel along the ranch-house wall
  // 27 a house with the curtains drawn
  { id: 27, a: 1642, set: "lanai", look: "high", p0: [-5.089, 2.1, -2.934], l0: [-5.56, 2.12, -4.46], f0: 74, p1: [-5.16, 2.12, -3.16], l1: [-5.56, 2.14, -4.46], f1: 72 },
  // 28 the medal
  { id: 28, a: 1689, set: "field", look: "day", p0: [-10.55, 1.5, 9.1], l0: [-12, 1.48, 6], f0: 36, p1: [-10.65, 1.5, 8.8], l1: [-12, 1.5, 6], f1: 35 },
  // 29 the submarine never came
  { id: 29, a: 1726, set: "lanai", look: "dusk", p0: [0.6, 1.9, -20.4], l0: [1.0, -1.6, -50], f0: 44, p1: [0.6, 1.9, -20.9], l1: [1.0, -1.2, -50], f1: 42 },
  B(30, 1767, "museum", "museum"), // take: banner -> plane -> plaque -> the room
  B(31, 1833, "museum", "museum"),
];
export const shotAt = (f: number) => { let s = SHOTS[0]; for (const x of SHOTS) if (f >= x.a) s = x; return s; };
export const shotEnd = (s: Shot) => (s.id < SHOTS.length ? SHOTS[s.id].a : TOTAL);
/** frames since the shot began, and its 0..1 progress */
export const inShot = (f: number) => { const s = shotAt(f), n = f - s.a; return { s, n, u: n / Math.max(1, shotEnd(s) - s.a) }; };

// ---------------- the flight and the landing ----------------
const D2R = Math.PI / 180;
/** flight direction on the ground (the wreck's nose) and the perpendicular toward the lens */
export const NX = Math.cos(28 * D2R), NZ = Math.sin(28 * D2R), PX = -NZ, PZ = NX;
export const along = (t: number, w = 0, y = 0): V3 => [NX * t + PX * w, y, NZ * t + PZ * w];
export const CRASH = 320;          // the frame the nose meets the fence (word "fence" = 322)
export const TOUCH = 298, TOUCH2 = 306, REST = 336;
const VK: [number, number][] = [[283, 1.5], [298, 1.3], [308, 1.1], [319, 0.9], [321, 0.55], [332, 0]];
const vAt = (f: number) => { if (f <= VK[0][0]) return VK[0][1]; for (let i = 1; i < VK.length; i++) if (f <= VK[i][0]) { const [a, va] = VK[i - 1], [b, vb] = VK[i]; return va + ((vb - va) * (f - a)) / (b - a); } return 0; };
const TT: number[] = []; { let t = 0; for (let f = 332; f >= 270; f--) { TT[f] = t; t -= (vAt(f - 1) + vAt(f)) / 2; } }
/** distance along the flight line (0 = where the wreck stops) */
export const landT = (f: number) => { if (f >= 332) return 0; const i = Math.max(270, Math.floor(f)), k = f - i; return TT[i] + (TT[Math.min(332, i + 1)] - TT[i]) * k; };
const ramp = (f: number, a: number, b: number) => clamp01((f - a) / (b - a));
export type PlanePose = { pos: V3; yaw: number; pitch: number; roll: number; gear: boolean; vis: boolean };
const WHEELS = 1.62; // centre height when it stands on its wheels
/** the flying Zero (air set: it stays at the origin and the sea scrolls; field set: the approach up to the fence) */
export const flyAt = (f: number): PlanePose => {
  if (f < 83) { // strafing dive over the harbour; hit at 20
    const hit = f >= 20 ? Math.exp(-(f - 20) / 7) : 0;
    return { pos: [0, PLANE_Y + 0.06 * Math.sin(f * 0.23) - 0.25 * hit * Math.sin((f - 20) * 1.1), 0], yaw: -28 + 1.2 * Math.sin(f * 0.11), pitch: -9 + 1.5 * Math.sin(f * 0.17) + 5 * hit, roll: 13 + 2.5 * Math.sin(f * 0.13) - 14 * hit * Math.sin((f - 20) * 0.9), gear: false, vis: true };
  }
  if (f < 283) { // limping: slow wallow, a cough every ~40 frames
    const c = ((f - 150) % 41) / 41, cough = c < 0.2 ? Math.sin((c / 0.2) * Math.PI) : 0;
    return { pos: [0, PLANE_Y + 0.22 * Math.sin(f * 0.09) - 0.3 * cough, 0], yaw: -28 + 2.2 * Math.sin(f * 0.06), pitch: 1.5 + 2.6 * Math.sin(f * 0.11) - 3 * cough, roll: 7 * Math.sin(f * 0.075) + 3 * cough, gear: f >= 268, vis: f >= 150 };
  }
  const t = landT(f);
  let y = f < TOUCH ? WHEELS + 5.6 * (1 - ramp(f, 283, TOUCH)) ** 1.6 : f < TOUCH2 ? WHEELS + 1.25 * Math.sin((Math.PI * (f - TOUCH)) / (TOUCH2 - TOUCH)) : WHEELS + 0.14 * Math.abs(Math.sin((f - TOUCH2) * 0.9));
  const pitch = f < TOUCH ? 7 - 2 * ramp(f, 283, TOUCH) : f < TOUCH2 ? 5 - 9 * Math.sin((Math.PI * (f - TOUCH)) / (TOUCH2 - TOUCH)) * 0.5 : 3 - 4 * ramp(f, TOUCH2, CRASH);
  const roll = f < TOUCH ? 4 * Math.sin(f * 0.5) : -5 * Math.sin((f - TOUCH) * 0.55) * (1 - 0.5 * ramp(f, TOUCH, CRASH));
  if (f >= CRASH) y = WHEELS;
  return { pos: along(t, 0, y), yaw: -28, pitch, roll, gear: true, vis: f < CRASH };
};
/** the wreck: from the fence it digs in (tail up), drops on its belly and settles into the pose of the set */
export const wreckAt = (f: number): { pos: V3; yaw: number; pitch: number; roll: number; vis: boolean } => {
  if (f < CRASH) return { pos: [0, PLANE_Y, 0], yaw: PLANE_YAW, pitch: PLANE_PITCH, roll: PLANE_ROLL, vis: f >= CRASH };
  if (f >= REST + 6) return { pos: [0, PLANE_Y, 0], yaw: PLANE_YAW, pitch: PLANE_PITCH, roll: PLANE_ROLL, vis: true };
  const u = ramp(f, CRASH, 326), d = ramp(f, 326, REST + 4);
  const y = PLANE_Y + (WHEELS - PLANE_Y) * (1 - smooth(ramp(f, CRASH, 325))) + 0.12 * Math.sin(d * Math.PI) * (f > 326 ? 1 : 0);
  const pitch = f <= 326 ? -1 - 17 * smooth(u) : -18 + (18 + PLANE_PITCH) * (1 - (1 - d) ** 2 * Math.cos(d * 5.5));
  const roll = PLANE_ROLL * smooth(ramp(f, CRASH, 331)) + 3 * Math.sin(d * 7) * (1 - d);
  return { pos: along(landT(f), 0, y), yaw: PLANE_YAW, pitch, roll, vis: true };
};
/** where the plane (flying or wrecked) is at f; the cockpit is its origin */
export const planeAt = (f: number) => (f >= CRASH ? wreckAt(f) : flyAt(f));
/** air set: height over the sea and metres flown (the sea, harbour and submarine slide back by this) */
export const altAt = (f: number) => (f < 83 ? 62 - 0.12 * f : 30 - 9 * smooth(ramp(f, 150, 283)));
export const flownAt = (f: number) => (f < 83 ? 1.25 * f : 0.9 * (f - 150));
/** fire that grows in-shot (the house in the helper take) */
export const fireK = (f: number) => (f >= 945 && f < 998 ? smooth(ramp(f, 945, 962)) : 1);

// ---------------- camera: key tracks ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number; cInf: number; focus: V3 };
type Pose = { pos: V3; look: V3; fov: number; roll?: number; cInf?: number; focus?: V3 };
type Key = { f: number; dur?: number; arc?: number; push?: number; s: Pose | ((f: number) => Pose) };
type Track = { a: number; b: number; keys: Key[] };
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const full = (k: Key, f: number): Cam => {
  const p = typeof k.s === "function" ? k.s(f) : k.s, n = Math.max(0, f - k.f - (k.dur ?? 0) * 0.5), kk = (1 - (k.push ?? 0.0016)) ** n;
  return { pos: [p.look[0] + (p.pos[0] - p.look[0]) * kk, p.look[1] + (p.pos[1] - p.look[1]) * kk, p.look[2] + (p.pos[2] - p.look[2]) * kk], look: p.look, fov: p.fov, roll: p.roll ?? 0, cInf: p.cInf ?? 0, focus: p.focus ?? p.look };
};
const mix = (a: Cam, b: Cam, k: number): Cam => ({ pos: lerp3(a.pos, b.pos, k), look: lerp3(a.look, b.look, k), fov: lerp(a.fov, b.fov, k), roll: lerp(a.roll, b.roll, k), cInf: lerp(a.cInf, b.cInf, k * k), focus: lerp3(a.focus, b.focus, k) });
/** kit run(): each key glides in from whatever the camera was doing (symmetric smootherstep), then pushes slowly */
const run = (keys: Key[], f: number): Cam => {
  let cur = full(keys[0], f);
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (f < k.f) break;
    const u = glide((f - k.f) / (k.dur ?? 24));
    cur = mix(cur, full(k, f), u);
    if (k.arc) { const h = k.arc * Math.sin(Math.PI * clamp01((f - k.f) / (k.dur ?? 24))) ** 1.2; cur.pos = [cur.pos[0], cur.pos[1] + h, cur.pos[2]]; }
  }
  return cur;
};
/** smooth 1-D path through (frame, value) knots: monotone, flat at both ends */
const path1 = (kn: [number, number][]) => (f: number) => {
  if (f <= kn[0][0]) return kn[0][1];
  for (let i = 1; i < kn.length; i++) if (f <= kn[i][0]) {
    const [a, va] = kn[i - 1], [b, vb] = kn[i], h = b - a, u = (f - a) / h;
    const sl = (j: number) => (j <= 0 || j >= kn.length - 1 ? 0 : (kn[j + 1][1] - kn[j - 1][1]) / (kn[j + 1][0] - kn[j - 1][0]));
    const m0 = sl(i - 1) * h, m1 = sl(i) * h, u2 = u * u, u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * va + (u3 - 2 * u2 + u) * m0 + (-2 * u3 + 3 * u2) * vb + (u3 - u2) * m1;
  }
  return kn[kn.length - 1][1];
};
// the landing camera stands by the wall of the field and follows the plane in by pan + zoom + a slow dolly
const landCam = (f: number): Pose => {
  const k = ramp(f, 283, 326), pos: V3 = [1.5 - 0.5 * k, 1.62 - 0.1 * k, 12.6 - 2.4 * k], pl = planeAt(f).pos;
  const look: V3 = [pl[0] + 0.5, 0.75 + 0.45 * (pl[1] - PLANE_Y), pl[2]], dist = Math.hypot(pos[0] - look[0], pos[2] - look[2]);
  const W = 11.5 - 4.3 * smooth(k);
  return { pos, look, fov: Math.max(17, Math.min(50, (2 * Math.atan(W / 2 / (0.5625 * dist))) / D2R)) };
};
// orbit from the front quarter round the right wing to behind the tail, the plane in frame all the way, the island rising ahead
const seaOrbit = (f: number): Pose => {
  const u = glide((f - 196) / 42), az = (39 + 150 * u) * D2R, r = 15 - 6.1 * u, t = Math.cos(az) * r, w = Math.sin(az) * r, k = smooth((u - 0.62) / 0.38) ** 1.4;
  return { pos: [NX * t + PX * w, 2.5 + 1.6 * u, NZ * t + PZ * w], look: [0.5 + (NX * 60 - 0.5) * k, 1.15 - 14.15 * k, NZ * 60 * k], fov: 47 - 5 * u, roll: 0.04 - 0.07 * u };
};
const wallX = path1([[1543, -1.65], [1556, -1.65], [1581, -0.55], [1605, 0.55], [1627, 1.65], [1641, 1.65]]);
// submarine on the sea (air set, local to the plane): slides back as the plane flies on
export const subAt = (f: number): V3 => { const d = 0.9 * (f - 272); return [NX * (74 - d) + PX * -13, 0, NZ * (74 - d) + PZ * -13]; };
const BUB: V3 = [-0.42, EY + 1.42, 0.25]; // the thought bubble over the cockpit
export const BUBBLE = BUB;
export const SIGN: V3 = [-6.14, 0, 7.83];  // the PRIVATE sign on the fence
const TRACKS: Track[] = [
  // ---- hook: the pilot big in the cockpit over the harbour -> the briefing in his head ----
  { a: 0, b: 83, keys: [
    { f: 0, push: 0.0035, s: { pos: [-1.2, EY + 1.5, 5.9], look: [0.5, EY - 0.1, 0], fov: 37, roll: -0.05 } },
    { f: 31, dur: 28, push: 0.002, s: { pos: [-1.15, EY + 1.6, 5.9], look: [BUB[0] + 0.1, BUB[1] - 0.52, BUB[2]], fov: 36, roll: 0.02 } },
  ] },
  // ---- the island through cloud: a crane dive onto the census board ----
  { a: 83, b: 150, keys: [
    { f: 83, push: 0, s: { pos: [1.5, 52, 36], look: [0.05, 1.3, 9.4], fov: 46, roll: 0.1 } },
    { f: 84, dur: 40, push: 0.0018, s: { pos: [0.0, 1.5, 15.6], look: [0.05, 1.3, 9.4], fov: 46 } },
  ] },
  // ---- over the sea: the limping Zero -> the island ahead -> the submarine that should be waiting ----
  { a: 150, b: 283, keys: [
    { f: 150, push: 0.0022, s: { pos: [5.9, 2.5, 13.9], look: [0.5, 1.15, 0], fov: 47, roll: 0.04 } },
    { f: 196, dur: 42, push: 0, s: seaOrbit },
    { f: 242, dur: 28, push: 0.002, s: (f) => { const s = subAt(f); return { pos: [-7.1, 4.1, -5.4], look: [s[0] + PX * 3, -altAt(f), s[2] + PZ * 3], fov: 30 }; } },
  ] },
  // ---- the crash field: landing, fence, the dazed pilot, pulled out, pistol and papers, asks back, the islanders ----
  { a: 283, b: 576, keys: [
    { f: 283, push: 0, s: landCam },
    { f: 323, dur: 18, push: 0.002, s: { pos: [-1.05, EY + 0.02, 4.75], look: [0.07, EY - 0.06, 0], fov: 30, cInf: 5, focus: EYE } },
    { f: 346, dur: 30, push: 0.0014, s: { pos: [1.75, 1.45, 10.4], look: [1.86, 1.42, 5.6], fov: 42 } },
    { f: 394, dur: 24, push: 0.0014, s: { pos: [1.92, 1.45, 9.7], look: [2.08, 1.36, 5.6], fov: 37 } },
    { f: 436, dur: 24, push: 0.0018, s: { pos: [1.7, 1.55, 9.9], look: [1.74, 1.5, 5.6], fov: 41, roll: 0.03 } },
    { f: 493, dur: 20, push: 0.001, s: { pos: [1.9, 1.5, 9.6], look: [2.15, 1.5, 5.6], fov: 36 } },
    { f: 513, dur: 44, arc: 2.1, push: 0.0016, s: { pos: [-0.55, 1.45, 15.8], look: [-0.55, 1.4, 9.6], fov: 52 } },
  ] },
  // ---- the night yard: the battery radio -> the frozen party (the whips to the prisoner and the bluff follow) ----
  { a: 633, b: 741, keys: [
    { f: 633, push: 0.0022, s: { pos: [-1.74, 0.99, 1.75], look: [-1.56, 1.0, 0.1], fov: 38, roll: -0.06, cInf: 2.5, focus: [-1.5, 0.95, -0.15] } },
    { f: 698, dur: 30, push: 0.0026, s: { pos: [0.5, 1.02, 4.8], look: [0.33, 1.25, 0], fov: 53, roll: 0.02 } },
  ] },
  { a: 741, b: 774, keys: [{ f: 741, push: 0.003, s: { pos: [0.6, 1.2, 4.9], look: [0.9, 1.3, 0.4], fov: 48 } }] },
  { a: 774, b: 853, keys: [{ f: 774, push: 0.0014, s: { pos: [1.95, 1.4, -15.1], look: [2.15, 1.47, -22], fov: 46, roll: -0.02 } }] },
  // ---- the helper and his shotgun -> the house they set alight ----
  { a: 903, b: 998, keys: [
    { f: 903, push: 0.002, s: { pos: [0.55, 1.35, 5.3], look: [0.75, 1.5, 1.1], fov: 38 } },
    { f: 938, dur: 30, push: 0.0018, s: { pos: [1.95, 1.25, 5.0], look: [-2.2, 2.3, -6.5], fov: 52, roll: 0.03 } },
  ] },
  // ---- the fight by the burning plane, one take ----
  { a: 1073, b: 1439, keys: [
    { f: 1073, push: 0.002, s: { pos: [-0.3, 1.5, 13.4], look: [-0.5, 1.8, 9.5], fov: 36 } },
    { f: 1104, dur: 28, push: 0.001, s: { pos: [0.2, 1.45, 15.2], look: [0.2, 1.5, 9.5], fov: 51 } },
    { f: 1188, dur: 16, push: 0.002, s: { pos: [0.45, 1.5, 13.9], look: [0.55, 1.5, 9.5], fov: 40 } },
    { f: 1238, dur: 26, push: 0.004, s: { pos: [0.2, 1.7, 12.6], look: [0.25, 1.86, 9.5], fov: 31 } },
    { f: 1304, dur: 24, push: 0.0008, s: { pos: [0.85, 1.25, 14.6], look: [1.05, 2.0, 9.5], fov: 47, roll: -0.03 } },
    { f: 1377, dur: 24, push: 0.0022, s: { pos: [1.3, 1.45, 13.3], look: [1.38, 1.62, 9.6], fov: 36 } },
  ] },
  // ---- never empty: the ranch -> the sign on its fence ----
  { a: 1439, b: 1543, keys: [
    { f: 1439, push: 0.0016, s: { pos: [-13.5, 4.6, 17.5], look: [-8, 1.2, -40], fov: 40, roll: -0.03 } },
    { f: 1492, dur: 34, push: 0.0022, s: { pos: [SIGN[0] + 0.55, 1.2, SIGN[2] + 4.1], look: [SIGN[0] + 0.3, 0.92, SIGN[2] + 0.75], fov: 42 } },
  ] },
  // ---- the ranch-house wall: one lateral travel past four pictures ----
  { a: 1543, b: 1642, keys: [{ f: 1543, push: 0, s: (f) => { const x = wallX(f); return { pos: [x, 2.74, 2.45 - 0.003 * (f - 1543)], look: [x, 2.7, -1], fov: 42 }; } }] },
  // ---- the museum: banner -> the plane -> the plaque -> the room ----
  { a: 1767, b: TOTAL, keys: [
    { f: 1767, push: 0.001, s: { pos: [0.1, 2.9, 8.9], look: [0, 3.9, -4.9], fov: 40 } },
    { f: 1775, dur: 44, push: 0.0012, s: { pos: [-1.2, 1.7, 9.3], look: [-0.3, 1.7, -0.5], fov: 54 } },
    { f: 1828, dur: 32, push: 0.0018, s: { pos: [1.15, 1.2, 6.9], look: [1.2, 1.1, 3.9], fov: 34, roll: 0.02 } },
    { f: 1880, dur: 46, push: 0.0006, s: { pos: [0.6, 1.6, 9.2], look: [0.45, 1.32, 1.0], fov: 50 } },
  ] },
];
/** blurred whip-pans across a cut (post adds the smear): the outgoing shot swings away, the incoming one swings in */
export const WHIPS = [741, 774];
const WHIP_N = 5, WHIP_DEG = 15;
export const whipDeg = (f: number) => { for (const w of WHIPS) { if (f >= w - WHIP_N && f < w) return WHIP_DEG * ((f - (w - WHIP_N) + 1) / WHIP_N) ** 2; if (f >= w && f < w + WHIP_N) return -WHIP_DEG * (1 - (f - w + 1) / WHIP_N) ** 2; } return 0; };
/** impact shake: the offset flips sign every frame and is gone in ~7 frames (motion.md 2.1) */
const HITS: [number, number][] = [[TOUCH, 0.5], [TOUCH2, 0.4], [CRASH, 1.3], [1204, 0.5], [1216, 0.5], [1226, 0.5], [1357, 1.2], [1425, 0.6]];
export const camAt = (f: number): Cam => {
  let c: Cam;
  const tr = TRACKS.find((t) => f >= t.a && f < t.b);
  if (tr) c = run(tr.keys, f);
  else {
    const { s, u } = inShot(f), k = 0.55 * u + 0.45 * glide(u);
    c = { pos: lerp3(s.p0, s.p1, k), look: lerp3(s.l0, s.l1, k), fov: lerp(s.f0, s.f1, k), roll: lerp(s.r0 ?? 0, s.r1 ?? 0, k), cInf: s.cInf ?? 0, focus: s.focus ?? s.l0 };
  }
  const wd = whipDeg(f);
  if (wd) { const a = wd * D2R, dx = c.look[0] - c.pos[0], dz = c.look[2] - c.pos[2]; c = { ...c, look: [c.pos[0] + dx * Math.cos(a) - dz * Math.sin(a), c.look[1], c.pos[2] + dx * Math.sin(a) + dz * Math.cos(a)] }; }
  for (const [h, amp] of HITS) if (f >= h && f < h + 7) {
    const d = Math.hypot(c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]), e = amp * 0.0042 * d * (1 - (f - h) / 7) * ((f - h) % 2 ? -1 : 1);
    c = { ...c, look: add(c.look, [e * 0.6, e, 0]), roll: c.roll + e * 0.004 / Math.max(0.001, 0.0042 * d) };
  }
  return c;
};
export const dofAt = (f: number): { cInf: number; focus: V3 } => { const c = camAt(f); return { cInf: c.cInf, focus: c.focus }; };
