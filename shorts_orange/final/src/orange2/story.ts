// Orange v2: takes and camera tracks. Every frame number is a word onset from timing.ts (whisper on the locked
// voice). One picture per clause; hard cuts on line onsets, whip-pans for the montage and the move to Portugal; camera
// travel between subjects inside a take; no dissolves (client). Eye line ~0.42 via ms().
import { TOTAL, L, W, WE } from "./timing";
export { TOTAL, L, W, WE };
export type V3 = [number, number, number];
export type SetName = "india" | "dunes" | "serai" | "souk" | "sea" | "lisbon" | "europe" | "china" | "sintra" | "dutch" | "goa";
export type LookName = "day" | "warm" | "gold" | "sea";
export const SETS: SetName[] = ["india", "dunes", "serai", "souk", "sea", "lisbon", "europe", "china", "sintra", "dutch", "goa"];
export const ORIGIN = (s: SetName): V3 => [SETS.indexOf(s) * 1500, 0, 0];
export type Take = { id: string; a: number; set: SetName; look: LookName };
export const w = (k: string) => { const v = W[k]; if (v === undefined) throw new Error("no word " + k); return v; };
export const TAKES: Take[] = [
  { id: "hook", a: 0, set: "india", look: "warm" },
  { id: "dunes", a: 50, set: "dunes", look: "warm" },
  { id: "deck", a: 82, set: "sea", look: "sea" },
  { id: "scholar", a: L[1], set: "india", look: "warm" },
  { id: "serai", a: L[2], set: "serai", look: "warm" },
  { id: "souk", a: L[3], set: "souk", look: "warm" },
  { id: "lisbon", a: w("3.then"), set: "lisbon", look: "day" },
  { id: "europe", a: L[4], set: "europe", look: "day" },
  { id: "sail", a: L[5], set: "sea", look: "sea" },
  { id: "china", a: w("5.and") + 12, set: "china", look: "day" },
  { id: "sintra", a: L[6], set: "sintra", look: "day" },
  { id: "dutch", a: L[7], set: "dutch", look: "day" },
  { id: "goa", a: L[8], set: "goa", look: "warm" },
  { id: "stall", a: w("8.as") - 2, set: "goa", look: "warm" },
  { id: "end", a: L[11], set: "india", look: "gold" },
];
export const takeAt = (f: number) => { let t = TAKES[0]; for (const x of TAKES) if (f >= x.a) t = x; return t; };
export const takeEnd = (t: Take) => { const i = TAKES.indexOf(t); return i + 1 < TAKES.length ? TAKES[i + 1].a : TOTAL; };

// ---------------- camera ----------------
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
export const ramp = (f: number, a: number, b: number) => clamp01((f - a) / (b - a));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const lerp3 = (a: V3, b: V3, k: number): V3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
export type Cam = { pos: V3; look: V3; fov: number; roll: number; cInf: number; focus: V3 };
type Pose = { pos: V3; look: V3; fov: number; roll?: number; cInf?: number; focus?: V3 };
type Key = { f: number; dur?: number; push?: number; arc?: number; s: Pose | ((f: number) => Pose) };
const full = (k: Key, f: number): Cam => {
  const p = typeof k.s === "function" ? k.s(f) : k.s, n = Math.max(0, f - k.f - (k.dur ?? 0) * 0.5), kk = (1 - (k.push ?? 0.0012)) ** n;
  return { pos: [p.look[0] + (p.pos[0] - p.look[0]) * kk, p.look[1] + (p.pos[1] - p.look[1]) * kk, p.look[2] + (p.pos[2] - p.look[2]) * kk], look: p.look, fov: p.fov, roll: p.roll ?? 0, cInf: p.cInf ?? 0, focus: p.focus ?? p.look };
};
const mixC = (a: Cam, b: Cam, k: number): Cam => ({ pos: lerp3(a.pos, b.pos, k), look: lerp3(a.look, b.look, k), fov: lerp(a.fov, b.fov, k), roll: lerp(a.roll, b.roll, k), cInf: lerp(a.cInf, b.cInf, k), focus: lerp3(a.focus, b.focus, k) });
const run = (keys: Key[], f: number): Cam => {
  let cur = full(keys[0], f);
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i]; if (f < k.f) break;
    const d = k.dur ?? 36, u = glide((f - k.f) / d);
    cur = mixC(cur, full(k, f), u);
    if (k.arc) { const h = k.arc * Math.sin(Math.PI * clamp01((f - k.f) / d)); cur.pos = [cur.pos[0], cur.pos[1] + h, cur.pos[2]]; }
  }
  return cur;
};
const D2R = Math.PI / 180;
/** frame a character standing at (x, yb, z) [scale sc]: camera d metres away at azimuth az (deg, 0 = from +z, + = from
 *  screen right side i.e. +x), lens height ch above yb, vertical fov; the look point is set so the eyes (1.44 m) sit
 *  at `ey` of the frame height from the top (skill rule 4: 0.42). dx shifts the subject sideways in frame (m). */
export const ms = (x: number, z: number, d: number, fov: number, o: { az?: number; ch?: number; ey?: number; yb?: number; sc?: number; dx?: number; roll?: number; cInf?: number } = {}): Pose => {
  const az = (o.az ?? 0) * D2R, yb = o.yb ?? 0, sc = o.sc ?? 1, eye = yb + 1.44 * sc, ch = yb + (o.ch ?? 1.5), Hf = 2 * d * Math.tan((fov * D2R) / 2);
  const ly = eye - ((0.5 - (o.ey ?? 0.42)) * Hf), dx = o.dx ?? 0, rx = Math.cos(az), rz = -Math.sin(az);
  const lx = x - dx * rx, lz = z - dx * rz;
  return { pos: [lx + Math.sin(az) * d, ch, lz + Math.cos(az) * d], look: [lx, ly + (ch - ly) * 0.0, lz], fov, roll: o.roll ?? 0, cInf: o.cInf ?? 0, focus: [x, eye, z] };
};
/** a plain pose */
const P = (pos: V3, look: V3, fov: number, roll = 0, cInf = 0): Pose => ({ pos, look, fov, roll, cInf });

// ---------------- performance paths (shared with cast.ts) ----------------
export const HOOK_PATH = (f: number): V3 => { const u = clamp01((f + 14) / 70); return [0.15 - 0.1 * u, 0, -5.4 + 4.3 * u]; };          // merchant strides toward the lens
export const CARAVAN_X = (f: number) => -5.5 + 0.12 * (f - 50);                                                                     // dunes: the caravan walks +x
export const TRADER_PATH = (f: number): V3 => { const u = smooth((f - L[2] + 10) / 46); return [-6.4 + 4.6 * u, 0, -0.2]; };     // serai: trader leads the camel in
export const SAILOR_PATH = (f: number): V3 => { const a = w("8.brought") - 14, u = smooth((f - a) / 30); return [3.4 - 2.3 * u, 0, -2.4 + 1.8 * u]; }; // goa: down the plank to the stall
export const CROWD_RUSH = (f: number) => smooth((f - (w("6.went") - 6)) / 26);
export const DECK_Y = 1.28;  // caravel waist deck height (kit2 caravel, s = 1)
export const FORE_Y = 2.48;  // forecastle top

const KEYS: Record<string, Key[]> = {
  // T01: merchant strides toward the lens through the bazaar; the camera backs away with him (face >= 25 % W by f8)
  hook: [{ f: 0, push: 0, s: (f) => { const h = HOOK_PATH(f), p = ms(h[0], h[2], 3.9 + 0.01 * f, 44, { ch: 1.55, az: -6, dx: 0.42 }); return p; } }],
  // T02: caravan crossing the dunes, the camera tracks alongside the merchant's camel (whip in at 50, out at 82)
  dunes: [{ f: 50, push: 0, s: (f) => { const x = CARAVAN_X(f); return ms(x, 0.5, 6.4, 42, { ch: 1.9, yb: 1.5, ey: 0.42, az: 10, dx: 0.2 }); } }],
  // T03: on deck at sea; MS on the merchant by the mast, then tilt/travel up to the sign as its names flip
  deck: [
    { f: 82, push: 0.0016, s: ms(0.45, 0.9, 4.4, 44, { yb: DECK_Y, az: 8, dx: 0.58 }) },
    { f: w("0.new") - 16, dur: 26, push: 0.0012, s: P([0.5, DECK_Y + 1.8, 4.4], [-0.3, DECK_Y + 1.75, 0.3], 44) },
    { f: w("0.went") - 2, dur: 16, push: 0.001, s: ms(0.45, 0.9, 4.4, 44, { yb: DECK_Y, az: 4, dx: 0.58 }) },
  ],
  // T04: the scholar's veranda: two-shot, push, rise to the hanging sign for NARANGA
  scholar: [
    { f: L[1], push: 0.0014, s: ms(22.05, 0.3, 4.6, 44, { az: -4, ch: 1.45 }) },
    { f: w("1.naranga") - 22, dur: 26, push: 0.0012, s: P([21.6, 2.05, 3.5], [21.45, 2.0, -0.95], 40) },
  ],
  // T05+T06: the caravanserai: track with the trader and his camel, push in on the sign as he wipes the A, then travel
  // right to the dyer at the vats
  serai: [
    { f: L[2], push: 0, s: (f) => { const t = TRADER_PATH(f); return ms(t[0] + 0.3, t[2], 4.2, 46, { az: -4, ch: 1.6 }); } },
    { f: w("2.narang") - 20, dur: 24, push: 0.0014, s: ms(-1.4, -0.3, 3.9, 44, { dx: -0.1, ey: 0.47 }) },
    { f: w("2.and") - 2, dur: 30, push: 0.0014, s: ms(4.2, -0.4, 3.5, 44, { az: 6 }) },
  ],
  // T07: the souk: MS on the merchant at his stall; push as the G sticks; rise to the sign for NARANJ
  souk: [
    { f: L[3], push: 0.0016, s: ms(0.0, -0.2, 4.6, 44, { az: -6 }) },
    { f: w("3.became") - 6, dur: 22, push: 0.0012, s: P([-0.15, 2.0, 4.4], [-0.2, 2.05, -1.25], 44) },
  ],
  // T08: Lisbon: whip in on the caravel at the quay, crane down to the sailor at the crates
  lisbon: [
    { f: w("3.then"), push: 0.0012, s: ms(0.25, -1.2, 4.8, 48, { az: 16, ch: 1.2, dx: -0.3 }) },
    { f: w("3.then") + 8, dur: 26, push: 0.0014, s: ms(0.0, -1.2, 4.3, 44, { az: 8 }) },
  ],
  // T09: the square: WS establishing -> two-shot -> sign insert with the townsfolk under it
  europe: [
    { f: L[4], push: 0.0016, s: ms(0.0, -0.2, 6.4, 46, { ch: 1.7 }) },
    { f: w("4.europe") + 4, dur: 26, push: 0.0014, s: ms(0.0, -0.2, 4.6, 44, { ch: 1.5 }) },
    { f: w("4.the") - 14, dur: 22, push: 0.001, s: P([0.0, 2.3, 5.4], [0.0, 2.15, -1.55], 42) },
  ],
  // T10: the caravel under full sail from water level, then crane up to the captain on the forecastle
  sail: [
    { f: L[5], push: 0, s: (f) => { const k = (f - L[5]) / 60; return P([10.4 - 0.5 * k, FORE_Y + 0.9, 3.6 + 0.4 * k], [6.3, FORE_Y + 1.1, 0.0], 46, -0.03); } },
    { f: w("5.sailed") + 2, dur: 30, arc: 1.2, push: 0.0012, s: ms(6.6, 0.2, 3.6, 44, { yb: FORE_Y, az: 52, dx: 0.4 }) },
  ],
  // T11: the Chinese port: two-shot at the stall, a short MCU on the bite (CU 1 of 2), back out for "candy"
  china: [
    { f: w("5.and") + 12, push: 0.0014, s: ms(0.05, -0.4, 4.3, 44, { az: 4 }) },
    { f: w("5.sweet") - 8, dur: 14, push: 0.0018, s: ms(0.65, -0.3, 2.0, 42, { az: 10, ey: 0.44, cInf: 3 }) },
    { f: w("5.like") - 6, dur: 14, push: 0.0012, s: ms(0.1, -0.4, 4.0, 44, { az: 4 }) },
  ],
  // T12+T13: Sintra: the farmer in the grove, a pull-out reveal of the palace and the town, then the crowd rush
  sintra: [
    { f: L[6], push: 0.0014, s: ms(0.7, -0.5, 3.4, 44, { az: -6, cInf: 3 }) },
    { f: w("6.town") - 6, dur: 36, push: 0.0006, s: ms(0.7, -0.5, 4.4, 52, { az: -10, ch: 1.25, dx: -0.6, ey: 0.46 }) },
    { f: w("6.and") - 2, dur: 26, push: 0.0014, s: ms(1.3, -1.9, 6.0, 46, { az: 10, ch: 2.0 }) },
  ],
  // T14: the Dutch stall: MS on the seller, rise to the sign; the sign splits on "China's"
  dutch: [
    { f: L[7], push: 0.0016, s: ms(-0.4, -0.3, 3.5, 44, { az: -6, dx: -0.3 }) },
    { f: w("7.it") - 10, dur: 20, push: 0.0012, s: P([0.3, 2.45, 4.6], [0.3, 2.6, -1.95], 42) },
  ],
  // T15: Goa: the caravel at the quay (WS), crane down to the sailor carrying the crate
  goa: [
    { f: L[8], push: 0.0012, s: ms(-0.9, 0.8, 3.6, 48, { sc: 0.8, ch: 1.1, dx: -0.5, az: -6 }) },
    { f: w("8.ships") - 4, dur: 30, push: 0.0012, s: (f) => { const s = SAILOR_PATH(f); return ms(s[0] - 0.3, s[2], 4.0, 44, { az: 10 }); } },
  ],
  // T16-T18: the stall: crate insert under the seller's face, the whisper creep (CU 2 of 2), the SANTRA pull-out
  stall: [
    { f: w("8.as") - 2, push: 0.0012, s: P([-0.2, 1.3, 2.75], [-0.4, 1.22, -0.2], 42) },
    { f: L[9] - 2, dur: 30, push: 0.0036, s: ms(-0.55, -0.5, 2.6, 42, { ey: 0.47, dx: -0.15, ch: 1.75 }) },
    { f: w("10.santra") - 3, dur: 8, push: 0.0012, s: P([0.2, 1.8, 4.3], [-0.25, 1.5, -1.0], 46) },
    { f: w("10.hindi") - 8, dur: 30, push: 0.001, s: P([0.5, 1.9, 5.3], [-0.1, 1.5, -1.0], 48) },
  ],
  // T19: back in the bazaar at golden hour: the merchant with every name on his staff; a slow pull-out
  end: [{ f: L[11], push: 0, s: (f) => { const u = smooth((f - L[11]) / (TOTAL - L[11])); return ms(0.1, -1.0, 4.6 + 0.6 * u, 44, { az: -4, dx: 0.6, ey: 0.5 }); } }],
};
/** whip-pans across cuts: (cut frame) -> the outgoing take swings away, the incoming one swings in (post adds smear) */
export const WHIPS = [50, 82, w("3.then")];
export const WHIP_N = 5;
const WHIP_DEG = 16;
export const whipDeg = (f: number) => { for (const c of WHIPS) { if (f >= c - WHIP_N && f < c) return WHIP_DEG * ((f - (c - WHIP_N) + 1) / WHIP_N) ** 2; if (f >= c && f < c + WHIP_N) return -WHIP_DEG * (1 - (f - c + 1) / WHIP_N) ** 2; } return 0; };
/** impact kicks (sign pops, the N's clink): offset flips sign every frame, gone in ~6 frames */
export const HITS: [number, number][] = [[w("10.santra"), 1.0], [w("4.fell") + 4, 0.5], [w("3.naranj"), 0.4]];
export const camAt = (f: number): Cam => {
  const t = takeAt(f), o = ORIGIN(t.set);
  let c = run(KEYS[t.id], f);
  const wd = whipDeg(f);
  if (wd) { const a = wd * D2R, dx = c.look[0] - c.pos[0], dz = c.look[2] - c.pos[2]; c = { ...c, look: [c.pos[0] + dx * Math.cos(a) - dz * Math.sin(a), c.look[1], c.pos[2] + dx * Math.sin(a) + dz * Math.cos(a)] }; }
  for (const [h, amp] of HITS) if (f >= h && f < h + 6) { const e = amp * 0.012 * (1 - (f - h) / 6) * ((f - h) % 2 ? -1 : 1); c = { ...c, look: [c.look[0] + e, c.look[1] + e, c.look[2]], roll: c.roll + e * 0.3 }; }
  const add = (p: V3): V3 => [p[0] + o[0], p[1] + o[1], p[2] + o[2]];
  return { ...c, pos: add(c.pos), look: add(c.look), focus: add(c.focus) };
};
