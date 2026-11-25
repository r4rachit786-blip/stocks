// "The orange that changed its name" (Santra): takes, camera key tracks. Every frame number is a word time from
// timing.ts (generated from the voice), so a new voice re-times the film by re-running gen_timing.py.
// One travelling idea: the fruit and its hanging NAME SIGN change at every stop. Wide framing, camera travel between
// subjects inside a take, hard cuts / one whip-pan between takes, no dissolves.
import { TOTAL, L, W } from "./timing";
export { TOTAL, L, W };
export type V3 = [number, number, number];
export type SetName = "india" | "persia" | "arab" | "quay" | "europe" | "sea" | "china" | "sintra" | "dutch" | "port";
export type LookName = "day" | "warm" | "gold";
export const SETS: SetName[] = ["india", "persia", "arab", "quay", "europe", "sea", "china", "sintra", "dutch", "port"];
/** each set's origin (sets sit far apart so their far scenery never meets) */
export const ORIGIN = (s: SetName): V3 => [SETS.indexOf(s) * 600, 0, 0];
export type Take = { id: string; a: number; set: SetName; look: LookName };
const c = (w: number) => Math.max(0, w - 2); // cut two frames before the word lands
export const TAKES: Take[] = [
  { id: "hook", a: 0, set: "india", look: "warm" },
  { id: "m1", a: W.travelled, set: "persia", look: "day" },       // montage: "travelled the whole world"
  { id: "m2", a: W.whole, set: "quay", look: "day" },
  { id: "m3", a: W.world, set: "europe", look: "day" },
  { id: "india", a: c(W.newname) - 10, set: "india", look: "warm" }, // back home: the scholar, NARANGA
  { id: "persia", a: c(L[2]), set: "persia", look: "day" },
  { id: "arab", a: c(L[3]), set: "arab", look: "day" },
  { id: "quay", a: W.then3, set: "quay", look: "day" },               // whip-pan in from the souk
  { id: "europe", a: c(L[4]), set: "europe", look: "day" },
  { id: "sea", a: c(L[5]), set: "sea", look: "day" },
  { id: "china", a: c(W.found), set: "china", look: "day" },
  { id: "sintra", a: c(L[6]), set: "sintra", look: "day" },
  { id: "dutch", a: c(L[7]), set: "dutch", look: "day" },
  { id: "port", a: c(L[8]), set: "port", look: "warm" },
  { id: "end", a: c(L[11]), set: "port", look: "gold" },
];
export const takeAt = (f: number) => { let t = TAKES[0]; for (const x of TAKES) if (f >= x.a) t = x; return t; };
export const takeEnd = (t: Take) => { const i = TAKES.indexOf(t); return i + 1 < TAKES.length ? TAKES[i + 1].a : TOTAL; };

// ---------------- camera ----------------
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const lerp3 = (a: V3, b: V3, k: number): V3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Pose = { pos: V3; look: V3; fov: number; roll?: number };
type Key = { f: number; dur?: number; push?: number; s: Pose | ((f: number) => Pose) };
const full = (k: Key, f: number): Cam => {
  const p = typeof k.s === "function" ? k.s(f) : k.s, n = Math.max(0, f - k.f - (k.dur ?? 0) * 0.5), kk = (1 - (k.push ?? 0.0006)) ** n;
  return { pos: [p.look[0] + (p.pos[0] - p.look[0]) * kk, p.look[1] + (p.pos[1] - p.look[1]) * kk, p.look[2] + (p.pos[2] - p.look[2]) * kk], look: p.look, fov: p.fov, roll: p.roll ?? 0 };
};
const mix = (a: Cam, b: Cam, k: number): Cam => ({ pos: lerp3(a.pos, b.pos, k), look: lerp3(a.look, b.look, k), fov: lerp(a.fov, b.fov, k), roll: lerp(a.roll, b.roll, k) });
const run = (keys: Key[], f: number): Cam => { let cur = full(keys[0], f); for (let i = 1; i < keys.length; i++) { const k = keys[i]; if (f < k.f) break; cur = mix(cur, full(k, f), glide((f - k.f) / (k.dur ?? 24))); } return cur; };
/** pose in a set's own coordinates */
const P = (pos: V3, look: V3, fov: number, roll = 0): Pose => ({ pos, look, fov, roll });
export const TRAVELLER_PATH = (f: number): V3 => { const u = smooth((f - 6) / 120); return [0.2 + 0.8 * u, 0, -6.5 + 6 * u]; }; // walks out of the orchard toward us
const KEYS: Record<string, Key[]> = {
  hook: [
    { f: 0, push: 0, s: (f) => { const t = TRAVELLER_PATH(f); return P([t[0] - 0.8, 2.8, t[2] + 11.5], [t[0] - 1.0, 1.9, t[2] - 2], 50); } },
  ],
  m1: [{ f: W.travelled, push: 0.0015, s: P([-3.5, 2.6, 12], [-2.5, 1.9, -2], 54) }],
  m2: [{ f: W.whole, push: 0.0015, s: P([0, 3.0, 13], [1.5, 2.6, -6], 54) }],
  m3: [{ f: W.world, push: 0.0015, s: P([0, 2.6, 11.5], [0, 2.3, -3], 54) }],
  india: [
    { f: c(W.newname) - 10, push: 0.0005, s: P([0.6, 2.2, 9.5], [0.4, 1.7, -1], 50) },
    { f: W.sanskrit - 6, dur: 30, push: 0.0005, s: P([-0.6, 2.1, 8.8], [-0.3, 1.9, -1], 48) },
  ],
  persia: [
    { f: c(L[2]), push: 0.0004, s: P([-3.4, 2.4, 10.5], [-2.8, 1.7, -2], 50) },
    { f: W.narang2 - 18, dur: 26, push: 0.0005, s: P([1.8, 2.2, 8.8], [1.9, 1.85, -1], 48) },
    { f: W.named - 4, dur: 22, push: 0.0005, s: P([2.9, 2.0, 8.6], [3.0, 1.6, -1], 48) },
  ],
  arab: [
    { f: c(L[3]), push: 0.0005, s: P([0.2, 2.2, 9.2], [-0.2, 1.8, -1], 50) },
    { f: W.became - 10, dur: 24, push: 0.0005, s: P([-0.6, 2.2, 8.6], [-1.0, 2.0, -1], 48) },
  ],
  quay: [{ f: W.then3, push: 0.0007, s: P([-0.4, 2.4, 10.5], [0.8, 2.3, -3], 52) }],
  europe: [
    { f: c(L[4]), push: 0.0004, s: P([0, 2.5, 11.0], [0, 2.1, -2], 52) },
    { f: W.slowly, dur: 34, push: 0.0004, s: P([0, 2.6, 8.4], [0, 2.4, -1], 46) },
  ],
  sea: [{ f: c(L[5]), push: 0, s: (f) => { const u = (f - c(L[5])) / (c(W.found) - c(L[5])); return P([-6 + 6 * u, 4.2, 26], [-2 + 6 * u, 4.0, 0], 48, -0.02); } }],
  china: [
    { f: c(W.found), push: 0.0004, s: P([0.2, 2.2, 9.6], [-0.2, 1.8, -1.5], 50) },
    { f: W.eat - 6, dur: 24, push: 0.0005, s: P([0.6, 2.0, 7.4], [0.4, 1.8, -0.5], 46) },
  ],
  sintra: [
    { f: c(L[6]), push: 0, s: (f) => { const k = f - c(L[6]); return P([-1.2 + 0.05 * k, 6.0 - 0.03 * k, 20 - 0.06 * k], [0, 9.5 - 0.02 * k, -50], 50); } }, // slow crane toward the town
    { f: W.sintra6 - 10, dur: 30, push: 0.0005, s: P([0.2, 2.4, 10.5], [0, 2.4, -6], 52) },
    { f: W.europe6 - 6, dur: 24, push: 0.0003, s: P([1.4, 2.6, 11.5], [0.6, 1.6, -1], 54) },
  ],
  dutch: [{ f: c(L[7]), push: 0.0006, s: P([0.3, 2.3, 9.6], [0.2, 2.0, -2], 50) }, { f: W.chinas - 8, dur: 24, push: 0.0005, s: P([0.6, 2.0, 7.4], [0.6, 1.6, -1], 46) }],
  port: [
    { f: c(L[8]), push: 0.0003, s: P([4.0, 3.2, 13.5], [2.4, 2.4, -6], 52) },              // the ship at the quay
    { f: W.india8 - 4, dur: 30, push: 0.0004, s: P([0.8, 2.2, 9.5], [0.4, 1.6, -1], 50) },  // down to the stall and the crate
    { f: W.say - 4, dur: 20, push: 0.0024, s: P([0.6, 1.9, 7.8], [0.6, 1.5, -0.8], 46) }, // whisper: a slow push in
    { f: W.santra - 3, dur: 7, push: 0.0003, s: P([0.2, 2.3, 9.8], [0.0, 2.0, -1], 52) },   // SANTRA: snap back wide
  ],
  end: [{ f: c(L[11]), push: 0, s: (f) => { const u = smooth((f - c(L[11])) / (TOTAL - c(L[11]))); return P([0.2, 2.4 + 1.4 * u, 9.0 + 4.5 * u], [0.1, 2.3 + 1.1 * u, -3], 50 + 4 * u); } }],
};
/** the one whip-pan: out of the souk into the Portuguese quay (5 output frames each side) */
export const WHIP = W.then3, WHIP_N = 5;
export const whipDeg = (f: number) => (f >= WHIP - WHIP_N && f < WHIP ? 16 * ((f - (WHIP - WHIP_N) + 1) / WHIP_N) ** 2 : f >= WHIP && f < WHIP + WHIP_N ? -16 * (1 - (f - WHIP + 1) / WHIP_N) ** 2 : 0);
const D2R = Math.PI / 180;
export const camAt = (f: number): Cam => {
  const t = takeAt(f), o = ORIGIN(t.set);
  let cm = run(KEYS[t.id], f);
  const wd = whipDeg(f);
  if (wd) { const a = wd * D2R, dx = cm.look[0] - cm.pos[0], dz = cm.look[2] - cm.pos[2]; cm = { ...cm, look: [cm.pos[0] + dx * Math.cos(a) - dz * Math.sin(a), cm.look[1], cm.pos[2] + dx * Math.sin(a) + dz * Math.cos(a)] }; }
  return { ...cm, pos: [cm.pos[0] + o[0], cm.pos[1] + o[1], cm.pos[2] + o[2]], look: [cm.look[0] + o[0], cm.look[1] + o[1], cm.look[2] + o[2]] };
};
