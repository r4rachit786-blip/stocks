// The film's cast and flat props, shot by shot. One design per person for the whole film (no identity changes):
// the pilot (cap, goggles, scarf; a lei at the party), the local man (blue shirt, braces), the rancher (straw hat,
// palaka shirt, moustache), his wife (teal dress, hair flower), the auntie, the kid, the helper (grey cap).
// Acting = single beats (STUDY.md D). Light is painted onto each card per look (relight, multiply: v4 method).
import * as THREE from "three";
import { Pen, bodyFront, relight, fxWaves, fxTicks, fxStars, fxBurst, fxSmoke, fxPlank, Outfit, Expr, FrontOpts, INK } from "./toon";
import { Stage, CamInfo, Place, tier, light2D, lidAt, blob, fkey, q } from "./cards";
import { Shot, inShot, shotEnd, COCKPIT, PILOT_S, EYE, COWL, GUEST, RADIO, LANTERN, TORCH1, TORCH2, HOUSE, TABLE, LookName } from "./story";
import { mapCard, chalkboard, calendar, noBoats, canoe, plaque, banner, fireBig, caveBack, portrait, conch, lampCard, boatCal, curtainCard, iboat, helmetCard, bunting, sleeve, ropeCard, photoFrame, paperSheet, displayCase, medal } from "./art2d";

const SKINW = "#fff8f0";
const PILOT_O: Outfit = { jacket: "#a8905c", pants: "#6b5a3c", boots: INK, hat: "pilot", goggles: true, scarf: "#fbf9f3", collar: "#6e4a2e", belt: "#d5c9a2", plain: true, skin: SKINW };
const PILOT_LEI: Outfit = { ...PILOT_O, scarf: undefined, lei: ["#fff6e6", "#f7c948", "#f48fb1", "#ff7a5a", "#fff6e6", "#c084e0"] };
const RANCHER: Outfit = { jacket: "#eef0f4", check: "#2f4f93", sleeve: "#2f4f93", pants: "#75604a", boots: "#4a3426", hat: "straw", hatband: "#a8402f", moustache: "#3a2a22", skin: SKINW, buttons: "#f6f6f2" };
const RANCHER_M: Outfit = { ...RANCHER, medal: true };
const WIFE: Outfit = { jacket: "#2f9a8f", dress: "#2f9a8f", print: "#f7e3b4", pants: "#3b3f52", boots: "#fdeedd", hat: "longhair", hair: "#3a2620", flower: "#e8463f", lei: ["#fff6e6", "#f7c948", "#f48fb1"], skin: SKINW };
const AUNTIE: Outfit = { jacket: "#d9694e", dress: "#d9694e", print: "#fbe6a8", pants: "#3b3f52", boots: "#fdeedd", hat: "longhair", hair: "#5a5560", flower: "#fff6e6", lei: ["#f7c948", "#ff9e57", "#fff6e6"], skin: SKINW, build: "stout" };
const MAN: Outfit = { jacket: "#6f94ba", suspenders: "#6b4a30", pants: "#5d5348", boots: "#4a3426", hat: "hair", hair: "#2f211c", skin: SKINW, buttons: "#e8eef4" };
const KID: Outfit = { jacket: "#f6f2e8", stripes: "#d0503f", pants: "#4d6d9a", boots: "#fdebd8", hat: "hair", hair: "#2f211c", build: "kid", skin: SKINW, plain: true };
const HELPER: Outfit = { jacket: "#8f927c", pants: "#4a4a52", boots: "#3a2a22", hat: "cap", cap: "#6a6f78", skin: SKINW, buttons: "#d8d8cc" };
const ELDER: Outfit = { jacket: "#b9a27a", pants: "#5d5348", boots: "#4a3426", hat: "hair", hair: "#d8d4cc", moustache: "#d8d4cc", skin: SKINW, buttons: "#f1ead6" };
const TOURIST: Outfit = { jacket: "#4f9a7a", pants: "#3b3f52", boots: "#f4f1ea", hat: "hair", hair: "#6a4a2a", skin: SKINW, plain: true };
const VISITOR: Outfit = { jacket: "#f2b84a", pants: "#3f5a8a", boots: "#f4f1ea", hat: "cap", cap: "#d0503f", build: "kid", skin: SKINW, plain: true };

const RELIGHT: Record<LookName, null | [string, string]> = { day: null, high: null, museum: null, dusk: ["255,236,214", "255,210,150"], night: ["180,188,255", "255,212,156"] };
const tmp = new THREE.Vector3();
type Warm = [number, number, number, number][];
const WARM_LANAI: Warm = [[LANTERN[0], LANTERN[1] + 0.2, LANTERN[2], 1.5], [TORCH1[0], 2.1, TORCH1[2], 2.6], [TORCH2[0], 2.1, TORCH2[2], 2.6], [HOUSE.x + 1.2, 2.0, HOUSE.z + 4.0, 2.0]];
type Ctx = { cam: CamInfo; out: Stage; look: LookName; warm: Warm; f: number };
type Extra = { s?: number; boost?: number; side?: number; mirror?: boolean; roll?: number; noBlob?: boolean; y?: number };
/** place one character card */
const P = (c: Ctx, okey: string, o: Outfit, seed: number, x: number, z: number, fo0: FrontOpts, e: Extra = {}) => {
  const scale = e.s ?? 1, y = e.y ?? 0, d = c.cam.pos.distanceTo(tmp.set(x, y + 1.2, z)) / scale, [w, h, k] = tier(d);
  const fo = { ...fo0, light: light2D(c.cam, !!e.mirror), seed }, rl = RELIGHT[c.look];
  let best = 0, side = 0;
  for (const [sx, sy, sz, I] of c.warm) {
    const dx = sx - x, dz = sz - z, s = I / (dx * dx + dz * dz + (sy - 1.4) ** 2 + 0.9);
    if (s > best) { best = s; const lat = (dx * c.cam.right.x + dz * c.cam.right.z) / Math.sqrt(dx * dx + dz * dz + 1e-6); side = lat > 0.12 ? 1 : lat < -0.12 ? -1 : 0; }
  }
  if (e.mirror) side = -side;
  const sd = e.side ?? side, wk = rl ? q(Math.min(0.95, (c.look === "dusk" ? 0.55 : 0.3) + best * (e.boost ?? 1)), 20) : 0;
  const pl: Place = { key: `F|${okey}|${fkey(fo)}|${c.look}|${sd}|${wk}`, x, y, z, scale, mirror: e.mirror, roll: e.roll, size: [w, h, k],
    draw: (p: Pen) => { bodyFront(p, o, fo); if (rl) relight(p, rl[0], 1, rl[1], sd, wk); } };
  c.out.places.push(pl);
  if (!e.noBlob) blob(c.out, c.cam.sun, x, 0, z, scale, y > 0.05 ? 0.5 : 0.9);
};
/** flat painted prop card (unlit; tint scales it into the scene's light) */
const card = (c: Ctx, key: string, cw: number, ch: number, draw: (p: Pen) => void, x: number, y: number, z: number, w: number, o: { flat?: boolean; rot?: number; tint?: number; soft?: boolean; alpha?: number } = {}) =>
  c.out.fx.push({ key, cw, ch, draw, x, y, z, w, h: (Math.abs(w) * ch) / cw, ...o });
const TINT: Record<LookName, number> = { day: 0.96, high: 1.0, museum: 0.95, dusk: 0.86, night: 0.62 };
const fire = (c: Ctx, x: number, y: number, z: number, s: number, i: number) => {
  const v = (Math.floor(c.f / 2) + i) % 4, k = 1 + 0.06 * Math.sin(c.f * 1.7 + i * 2);
  card(c, `fire${v}`, 400, 500, (p) => fireBig(p, v), x, y + s * 0.62 * k, z, s * (i % 2 ? -1 : 1), { tint: 2.3 });
};
const smoke = (c: Ctx, x: number, y: number, z: number, n: number, rise: number, dx: number) => {
  for (let k = 0; k < n; k++) {
    const u0 = ((c.f + 400) / 140 + k / n) % 1, u = u0 ** 1.35, size = (0.42 + 1.75 * u ** 0.8) * smooth01(u0 / 0.06), tone = q(Math.min(1, u * 1.5), 5), v = k % 4, solid = u < 0.42;
    card(c, `smoke${v}|${tone}`, 400, 400, (p) => fxSmoke(p, v, tone), x + dx * u ** 0.9 + 0.25 * Math.sin(u * 8 + k * 2.4) * (0.3 + u), y + rise * u ** 0.85, z - 2.8 * u, size,
      { soft: !solid, alpha: solid ? 1 : Math.max(0, 1 - (u - 0.42) / 0.5) ** 1.3, rot: k * 1.3 + u * (k % 2 ? 0.9 : -0.9), tint: TINT[c.look] });
  }
};
const smooth01 = (x: number) => { const u = Math.max(0, Math.min(1, x)); return u * u * (3 - 2 * u); };
const stand = (expr: Expr, o: Partial<FrontOpts> = {}): FrontOpts => ({ mode: "stand", expr, ...o });

// ---------------- shots ----------------
const DIR: Record<number, (c: Ctx, n: number, u: number, s: Shot) => void> = {
  1: (c, n) => { card(c, `map${n >= 52 ? 1 : 0}`, 1000, 1300, (p) => mapCard(p, n >= 52 ? 1 : 0), 0, TABLE.y + 0.012, 0.05, 1.0, { flat: true, tint: 0.97 }); },
  2: (c, n) => {
    card(c, "board", 900, 1100, chalkboard, 0.55, 0.86, 9.25, 1.42, { tint: TINT.day });
    P(c, "rancher", RANCHER, 2, -0.98, 9.55, stand("smile", { facing: 1, look: 1, blink: lidAt(c.f, 21) }), { s: 1.14 });
    P(c, "wife", WIFE, 3, -0.42, 9.9, stand("smile_closed", { facing: 1 }), { s: 0.97 });
    P(c, "kid", KID, 5, -0.2, 10.4, stand("grin", { facing: 1, look: 1, wave: n > 30 ? q(Math.sin(n * 0.5), 12) : undefined }), { s: 0.74 });
  },
  3: (c, n) => { card(c, `map${n >= 96 ? 2 : 1}`, 1000, 1300, (p) => mapCard(p, n >= 96 ? 2 : 1), 0, TABLE.y + 0.012, 0.05, 1.0, { flat: true, tint: 0.97 }); },
  4: (c, n) => {
    P(c, "pilot", PILOT_O, 4, COCKPIT[0], COCKPIT[2], { mode: "sit", expr: "dazed", headTilt: q(7 * Math.sin(n * 0.19) + 2 * Math.sin(n * 0.47), 4), tilt: q(2.2 * Math.sin(n * 0.19 - 0.8), 4), flutter: q((c.f / 20) % 1, 20), scarfDir: -1 }, { s: PILOT_S, y: COCKPIT[1], noBlob: true });
    const u = q((n / 34) % 1, 34); card(c, `stars${u}`, 420, 210, (p) => fxStars(p, u), EYE[0] + 0.02, EYE[1] + 0.56, 0.06, 0.98);
    smoke(c, COWL[0] - 0.38, COWL[1] - 0.1, COWL[2] - 0.35, 14, 7.8, -1.9);
  },
  5: (c, n) => { // in a fence: low by the nose, rails flying, the pilot clear in the cockpit behind
    P(c, "pilot", PILOT_O, 4, COCKPIT[0], COCKPIT[2], { mode: "sit", expr: "dazed", headTilt: q(6 * Math.sin(n * 0.19), 4), flutter: q((c.f / 20) % 1, 20), scarfDir: -1 }, { s: PILOT_S, y: COCKPIT[1], noBlob: true });
    const u = q((n / 34) % 1, 34); card(c, `stars${u}`, 420, 210, (p) => fxStars(p, u), EYE[0] + 0.02, EYE[1] + 0.56, 0.06, 0.98);
    smoke(c, COWL[0] - 0.38, COWL[1] - 0.1, COWL[2] - 0.35, 12, 7.8, -1.9);
    [[2.3, 1.6, 0.9, 2.2], [2.9, 2.2, 1.3, -1.6], [1.7, 2.5, 0.5, 3.0], [2.6, 1.2, 1.6, -2.4], [2.0, 2.0, 1.1, 1.4]].forEach(([vx, vy, vz, sp], i) => {
      const t = (n - 4 - i) / 30; if (t < 0 || t > 1.1) return;
      card(c, "plank", 320, 110, fxPlank, 0.2 + (vx - 2.3) * t * 1.6, 0.9 + vy * 2.2 * t - 4.2 * t * t, 2.9 + vz * t * 0.6, 0.8, { rot: sp * t * 3 + i, tint: TINT.day });
    });
  },
  6: (c, n) => { // helped out of the wreck; from frame 60 the local man holds the pistol and the papers
    const got = n >= 60;
    P(c, "pilot", PILOT_O, 4, -0.62, 4.6, stand(got ? "confused" : "dazed", { facing: 1, look: 1, headTilt: got ? 0 : q(5 * Math.sin(n * 0.2), 4), blink: lidAt(c.f, 7, [c.f - n + 60]), scarfDir: -1 }), { s: 1.1 });
    P(c, "man", MAN, 6, 0.42, 4.7, stand(got ? "smile_closed" : "smile", { facing: -1, look: -1, prop: got ? "loot" : null, blink: got ? 0 : lidAt(c.f, 23) }), {});
    smoke(c, COWL[0] - 0.38, COWL[1] - 0.1, COWL[2] - 0.35, 12, 7.8, -1.9);
  },
  7: (c, n) => { // "I would like those back": open hand out; at "No luck" the man shakes his head
    const no = n >= 58;
    P(c, "pilot", PILOT_O, 4, -0.62, 4.6, stand(no ? "nervous" : "hesitant", { facing: 1, look: 1, wave: 0.9, raise: 0.45, blink: lidAt(c.f, 7, [c.f - n + 58]), scarfDir: -1 }), { s: 1.1 });
    P(c, "man", MAN, 6, 0.42, 4.7, stand(no ? "smile_closed" : "smile", { facing: -1, look: -1, prop: "loot", headTilt: no ? q(7 * Math.sin((n - 58) * 0.9) * Math.max(0, 1 - (n - 58) / 16), 2) : 0 }), {});
  },
  8: (c, n) => {
    const cheer = n > 14;
    P(c, "rancher", RANCHER, 2, -1.9, 9.55, stand("cheer", { facing: 1, look: 0.5, wave: cheer ? q(Math.sin(n * 0.34), 16) : undefined, blink: lidAt(c.f, 21) }), { s: 1.14 });
    P(c, "kid", KID, 5, -0.95, 10.0, stand("laugh", { wave: q(Math.sin(n * 0.7), 12), waveL: q(Math.sin(n * 0.7 + 2.2), 12) }), { s: 0.74, y: cheer ? 0.3 * Math.max(0, Math.sin(((n % 20) / 20) * Math.PI * 1.25)) : 0 });
    P(c, "man", MAN, 6, -0.02, 9.5, stand("smile", { look: 0.2, prop: "loot", blink: lidAt(c.f, 23) }), {});
    P(c, "wife", WIFE, 3, 0.74, 9.85, stand("cheer", { facing: -1, look: -0.6, wave: cheer ? q(Math.sin(n * 0.4 + 2.4), 16) : undefined, blink: lidAt(c.f, 24) }), { s: 0.97 });
  },
  9: (c, n) => { // the party: everyone happy, the guest of honour eating
    P(c, "kid", KID, 5, -1.02, -0.4, stand("grin", { facing: 1, look: 1, wave: q(Math.sin(n * 0.6), 12) }), { s: 1.22 });
    P(c, "man", MAN, 6, -0.42, -0.85, stand("laugh", { facing: 1 }), {});
    P(c, "rancher", RANCHER, 2, 0.3, -0.6, stand("cheer", { facing: 1, look: 1, blink: lidAt(c.f, 21) }), { s: 1.12 });
    P(c, "auntie", AUNTIE, 8, -2.85, -0.45, stand("smile_closed", { facing: 1 }), { s: 0.98 });
    P(c, "wifeBack", WIFE, 3, -0.42, 2.3, stand("neutral", { back: true }), { s: 0.97, y: -0.75 });
    P(c, "pilotLei", PILOT_LEI, 4, GUEST[0], GUEST[2], stand("smile_closed", { prop: "plate", bite: true, facing: -1, headTilt: q(3 * Math.sin(n * 0.25), 2) }), { s: 1.15, boost: 2.2, side: 1 });
  },
  10: (c, n) => {
    const news = n >= 53;
    P(c, "kid", KID, 5, -1.1, -0.4, stand(news ? "shock" : "grin", { facing: -1, look: -1, blink: lidAt(c.f, 31, [c.f - n + 53]), headTilt: news ? 0 : -5 }), { s: 1.22, boost: 1.4 });
    if (news && n < 60) { const u = q((n - 53) / 7, 7); card(c, `ticks${u}`, 200, 200, (p) => fxTicks(p, u), -1.02, 1.72, -0.35, 0.36); }
    const u = q((c.f / 15) % 1, 15); card(c, `waves${u}`, 300, 300, (p) => fxWaves(p, u), RADIO[0] - 0.02, TABLE.y + 0.5, RADIO[2] + 0.14, 0.34, { rot: Math.PI / 2 - 0.25, tint: 1.25 });
  },
  11: (c, n) => {
    const t = (i: number) => n >= 6 + i * 3;
    P(c, "kid", KID, 5, -1.02, -0.4, stand("shock", { facing: t(0) ? 1 : -1, look: t(0) ? 1 : -1 }), { s: 1.22 });
    P(c, "man", MAN, 6, -0.42, -0.85, stand(t(1) ? "stern" : "neutral", { facing: t(1) ? 1 : -1, look: t(1) ? 1 : -1, blink: lidAt(c.f, 41, [c.f - n + 9]) }), {});
    P(c, "rancher", RANCHER, 2, 0.3, -0.6, stand(t(2) ? "stern" : "neutral", { facing: t(2) ? 1 : -1, look: t(2) ? 1 : -1, blink: lidAt(c.f, 42, [c.f - n + 12]) }), { s: 1.12 });
    P(c, "auntie", AUNTIE, 8, -2.85, -0.45, stand(t(3) ? "nervous" : "neutral", { facing: t(3) ? 1 : -1, look: t(3) ? 1 : -1 }), { s: 0.98 });
    P(c, "wifeBack", WIFE, 3, -0.42, 2.3, stand("neutral", { back: true, headTilt: t(2) ? 5 : -3 }), { s: 0.97, y: -0.75 });
    P(c, "pilotLei", PILOT_LEI, 4, GUEST[0], GUEST[2], stand(n >= 14 ? "frozen" : "smile_closed", { prop: "plate", bite: true, look: n >= 22 ? -1 : 0, blink: lidAt(c.f, 77, [c.f - n + 14]) * (n < 18 ? 1 : 0) }), { s: 1.15, boost: 2.2, side: 1 });
  },
  12: (c, n) => { // prisoner: wrists tied, guarded with his own pistol, by lantern light
    P(c, "man", MAN, 6, 0.1, 0.3, stand("stern", { facing: 1, look: 1, prop: "pistol", blink: lidAt(c.f, 41) }), {});
    P(c, "rancher", RANCHER, 2, 1.72, 0.15, stand("stern", { facing: -1, look: -1, blink: lidAt(c.f, 42) }), { s: 1.12 });
    P(c, "pilot", PILOT_O, 4, 0.92, 0.5, { mode: "sit", expr: "nervous", look: n < 14 ? -1 : 1, lookY: -0.3, blink: lidAt(c.f, 7), scarfDir: -1 }, { s: 1.15, y: 0.42, noBlob: true, boost: 2, side: 1 });
    card(c, "crate", 300, 200, (p) => { p.poly([[14, 30], [286, 30], [286, 190], [14, 190]], "#a8683a", 10); p.stroke([[14, 84], [286, 84]], 7); p.stroke([[14, 138], [286, 138]], 7); }, 0.92, 0.3, 0.46, 0.86, { tint: TINT.night * 1.1 });
    card(c, "rope", 300, 160, ropeCard, 0.92, 1.02, 0.6, 0.36, { tint: 0.85 });
    card(c, "lampc", 300, 520, lampCard, 0.36, 0.3, 1.0, 0.34, { tint: 1.7 });
  },
  13: (c) => { // the board, the chained canoe, and two islanders looking out at an empty moonlit sea
    card(c, "noboats", 900, 1000, noBoats, 2.45, 1.05, -22.0, 1.7, { tint: 0.82 });
    card(c, "canoe", 1200, 420, canoe, 3.3, 0.4, -21.0, 2.3, { tint: 0.66 });
    P(c, "elderBack", ELDER, 10, 1.42, -20.6, stand("neutral", { back: true }), {});
    P(c, "kidBack", KID, 5, 1.95, -20.2, stand("neutral", { back: true }), { s: 0.78 });
  },
  14: (c, n) => { // five days: pages 7 .. 12, one every 8 frames, then the 12 stays
    const day = Math.min(12, 7 + Math.floor(n / 8));
    card(c, `cal${day}`, 600, 800, (p) => calendar(p, day), 0, 2.7, -0.97, 0.72, { tint: 0.9, rot: ((n % 8) < 2 && day < 12 ? 0.05 : 0) + 0.02 });
  },
  15: (c, n) => {
    P(c, "pilot", PILOT_O, 4, 0.3, 1.2, stand("stern", { facing: 1, look: 1, blink: lidAt(c.f, 7), scarfDir: -1 }), { s: 1.15, boost: 1.6 });
    P(c, "helper", HELPER, 9, 1.25, 1.1, stand("nervous", { facing: -1, look: -1, prop: n >= 6 ? "shotgun" : null, blink: lidAt(c.f, 51) }), { boost: 1.6, mirror: true });
  },
  16: (c, n) => { // the house burns; papers fly out of the window; the two men lit orange, faces readable
    const H = (lx: number, ly: number, lz: number): [number, number, number] => [HOUSE.x + lx * Math.cos(HOUSE.yaw) + lz * Math.sin(HOUSE.yaw), ly, HOUSE.z - lx * Math.sin(HOUSE.yaw) + lz * Math.cos(HOUSE.yaw)];
    [[0, 3.6, 0.5, 5.4], [-2.4, 3.2, 1.2, 3.8], [2.3, 3.2, 1.0, 4.0], [-2.2, 1.6, 2.7, 1.5], [2.2, 1.6, 2.7, 1.5]].forEach(([lx, ly, lz, s], i) => { const [x, y, z] = H(lx, ly, lz); fire(c, x, y, z, s, i); });
    smoke(c, HOUSE.x, 5.5, HOUSE.z, 9, 9, 2.5);
    for (let i = 0; i < 7; i++) { const t = ((n + i * 9) % 46) / 46, [x, y, z] = H(2.2 + 1.2 * t + 0.3 * Math.sin(i), 2.2 + 2.4 * t - 2.6 * t * t + 0.2 * i, 2.8 + 4.5 * t); card(c, "sheet", 200, 240, paperSheet, x, y, z, 0.42, { rot: t * 5 + i, tint: 1.0 }); }
    P(c, "helper", HELPER, 9, 0.3, -0.7, stand("nervous", { facing: -1, look: -1, prop: "shotgun" }), { boost: 3, side: -1, mirror: true });
    P(c, "pilot", PILOT_O, 4, 0.98, 0.75, stand("stern", { facing: -1, look: -1, prop: "torch", scarfDir: 1 }), { s: 1.15, side: -1, boost: 3 });
  },
  17: (c) => {
    fire(c, 0.3, 0.9, 0.3, 3.6, 0); fire(c, -1.6, 0.7, -0.5, 2.6, 1); fire(c, 1.7, 0.6, 1.0, 2.4, 2); fire(c, -0.6, 0.3, 1.8, 1.8, 3);
    smoke(c, 0, 3.2, 0, 10, 9, -2.5);
    P(c, "pilot", PILOT_O, 4, -2.3, 7.4, stand("stern", { facing: 1, prop: "torch", scarfDir: -1 }), { s: 1.15, boost: 3 });
    P(c, "helper", HELPER, 9, -1.2, 7.9, stand("nervous", { facing: 1, prop: "shotgun" }), { boost: 3 });
  },
  18: (c, n) => { // the village in a sea cave: one kerosene lantern, worried faces, the moonlit sea outside
    card(c, "caveback", 1400, 2400, caveBack, -0.62, 1.6, -3.2, 5.0, { tint: 1.0 });
    card(c, "lampc", 300, 520, lampCard, 0.3, 0.3, 1.05, 0.34, { tint: 1.9 });
    P(c, "auntie", AUNTIE, 8, -0.72, 0.15, stand("nervous", { facing: 1, look: 1, lookY: -0.4, blink: lidAt(c.f, 43) }), { s: 0.98 });
    P(c, "elder", ELDER, 10, 0.95, 0.05, stand(n > 16 ? "shock" : "nervous", { facing: -1, look: n > 16 ? 1 : -1, blink: lidAt(c.f, 44, [c.f - n + 16]) }), {});
    P(c, "man", MAN, 6, 0.2, -0.45, stand("stern", { look: n > 20 ? 1 : 0, blink: lidAt(c.f, 41) }), {});
    P(c, "kid", KID, 5, -0.12, 0.8, stand("nervous", { look: n > 10 ? 1 : 0, lookY: -0.3, blink: lidAt(c.f, 31) }), { s: 0.74 });
  },
  19: (c, n) => { fire(c, 0.3, 0.9, 0.3, 3.6, 0); fire(c, -1.6, 0.7, -0.5, 2.6, 1); P(c, "rancher", RANCHER, 2, -0.6, 9.5, stand("stern", { look: n > 20 ? 1 : 0, blink: lidAt(c.f, 21) }), { s: 1.14, boost: 1.2 }); },
  20: (c, n) => { // caught: hands up; at frame 46 the rancher jumps the pilot
    const jump = n >= 46, k = jump ? smooth01((n - 46) / 9) : 0;
    fire(c, 0.3, 0.9, 0.3, 3.6, 0); fire(c, -1.6, 0.7, -0.5, 2.6, 1);
    P(c, "wife", WIFE, 3, -0.98, 9.9, stand(jump ? "shock" : "nervous", { facing: 1, look: 1, wave: 0, waveL: 0 }), { s: 0.97 });
    P(c, "rancher", RANCHER, 2, -0.38 + 0.75 * k, 9.5, stand(jump ? "pained" : "stern", { facing: 1, look: 1, wave: 0, waveL: 0, tilt: q(28 * k, 2) }), { s: 1.14, y: 0.55 * Math.sin(Math.PI * Math.min(1, k * 0.8)) });
    P(c, "pilot", PILOT_O, 4, 0.72, 9.45, stand(jump ? "shock" : "stern", { facing: 1, prop: "pistol", scarfDir: 1, tilt: q(-8 * k, 2) }), { s: 1.12, mirror: true });
    P(c, "helper", HELPER, 9, 1.32, 9.95, stand(jump ? "shock" : "nervous", { facing: -1, look: -1, prop: "shotgun" }), { mirror: true });
  },
  21: (c, n) => { // three shots: three flashes (frames 8, 20, 30); no wounds shown
    fire(c, 0.3, 0.9, 0.3, 3.6, 0);
    const hit = [8, 20, 30].findIndex((h) => n >= h && n < h + 5), flinch = [8, 20, 30].reduce((a, h) => a + (n >= h && n < h + 6 ? 1 - (n - h) / 6 : 0), 0);
    P(c, "rancher", RANCHER, 2, -0.35 - 0.1 * flinch, 9.5, stand(n >= 8 ? "pained" : "stern", { facing: 1, look: 1, tilt: q(-7 * flinch, 2) }), { s: 1.14 });
    P(c, "pilot", PILOT_O, 4, 0.95, 9.45, stand("shock", { facing: 1, prop: "pistol", scarfDir: 1 }), { s: 1.12, mirror: true });
    if (hit >= 0) { const u = q((n - [8, 20, 30][hit]) / 5, 5); card(c, `bang${u}`, 500, 500, (p) => fxBurst(p, u, "#fff3b0", 9, 30, 200), 0.18, 1.33, 9.5, 0.7, { tint: 2.4 }); }
  },
  22: (c, n) => { fire(c, 0.3, 0.9, 0.3, 3.6, 0); P(c, "rancher", RANCHER, 2, -0.2, 9.5, stand(n >= 44 ? "stern" : "pained", { look: 0.6, blink: lidAt(c.f, 21, [c.f - n + 44]), headTilt: n >= 44 ? -4 : 3 }), { s: 1.14, boost: 1.4 }); },
  23: (c, n) => { // lifted overhead, then thrown: the pilot leaves frame right, the wall answers with a burst and stars
    fire(c, 0.3, 0.9, 0.3, 3.6, 0);
    const thr = n >= 38, k = thr ? Math.min(1, (n - 38) / 7) : 0;
    P(c, "rancher", RANCHER, 2, 0, 9.5, stand("stern", { facing: 1, wave: thr ? 1 : 0, waveL: thr ? -1 : 0, tilt: thr ? 8 : 0 }), { s: 1.14 });
    if (k < 1) P(c, "pilot", PILOT_O, 4, -0.95 + 3.4 * k, 9.45, { mode: "fall", expr: "shock", scarfDir: -1 }, { s: 1.0, y: 2.55 - 0.9 * k * k, roll: -Math.PI / 2 - 1.2 * k, noBlob: true });
    if (n >= 44 && n < 52) { const u = q((n - 44) / 8, 8); card(c, `bigbang${u}`, 500, 500, (p) => fxBurst(p, u), 2.35, 1.1, 9.6, 1.6); }
    if (n >= 46) { const u = q(((n - 46) / 30) % 1, 30); card(c, `stars${u}`, 420, 210, (p) => fxStars(p, u), 2.3, 1.75, 9.7, 1.1); }
  },
  24: (c, n) => { // the rock goes up; the swing lands below the frame
    fire(c, 0.3, 0.9, 0.3, 3.6, 0);
    const sw = n >= 38;
    P(c, "wife", WIFE, 3, 0.4, 9.6, stand(sw ? "stern" : "nervous", { facing: 1, look: 1, lookY: 1, prop: "rock", wave: sw ? 1 : -0.6, raise: sw ? 0.35 : 1, blink: lidAt(c.f, 24, [c.f - n + 38]) }), { s: 0.97, boost: 1.3 });
    if (n >= 40 && n < 48) { const u = q((n - 40) / 8, 8); card(c, `bonk${u}`, 500, 500, (p) => fxBurst(p, u), 1.25, 0.62, 9.7, 1.0); }
    if (n >= 42) { const u = q(((n - 42) / 30) % 1, 30); card(c, `stars${u}`, 420, 210, (p) => fxStars(p, u), 1.25, 0.95, 9.75, 0.9); }
  },
  25: (c, n) => { card(c, `map${n >= 76 ? 3 : 0}`, 1000, 1300, (p) => mapCard(p, n >= 76 ? 3 : 0), 0, TABLE.y + 0.012, 0.05, 1.0, { flat: true }); },
  26: (c, n) => { // four pictures on the ranch-house wall: one family / no phones / no power / one boat a week
    const up = { y: 1.25, noBlob: true };
    if (n < 30) card(c, "portrait", 700, 900, portrait, -2.6, 2.95, -0.96, 0.95);
    else if (n < 56) { P(c, "man", MAN, 6, -0.98, -0.3, stand(n > 40 ? "confused" : "neutral", { facing: 1, look: 1, wave: -0.2, raise: 0.75, blink: lidAt(c.f, 41, [c.f - n + 40]) }), up); card(c, "conch", 300, 300, conch, -0.6, 2.74, -0.25, 0.28); }
    else if (n < 74) { P(c, "auntie", AUNTIE, 8, 0.72, -0.3, stand("smile", { facing: 1, look: 1, lookY: 0.5, wave: -0.6, raise: 0.5 }), { ...up, s: 0.98 }); card(c, "lampc", 300, 520, lampCard, 1.22, 2.72, -0.25, 0.3, { tint: 1.25 }); }
    else { card(c, "boatcal", 700, 900, boatCal, 2.75, 2.95, -0.96, 0.82); P(c, "kid", KID, 5, 2.2, -0.2, stand("grin", { facing: 1, look: 1, lookY: -0.5, wave: 0.3, raise: 0.9 }), { ...up, s: 0.8, y: 1.6 }); }
  },
  27: (c, n) => { // the curtains twitch shut on "drawn" (frame 29 of the shot)
    const open = n < 27 ? 0.55 : Math.max(0, 0.55 * (1 - (n - 27) / 4));
    card(c, `curtain${q(open, 20)}`, 400, 500, (p) => curtainCard(p, q(open, 20)), -5.548, 2.2, -4.42, 0.98, { tint: 0.97 });
  },
  28: (c, n) => { // the medal: pinned on by an officer's hand, bunting overhead
    card(c, "bunting", 1600, 300, bunting, -12.6, 3.0, 3.6, 5.2, { tint: 0.96 });
    P(c, "rancher", RANCHER, 2, -12, 6, stand(n > 16 ? "grin" : "smile", { blink: lidAt(c.f, 21, [c.f - n + 16]) }), { s: 1.14 });
    card(c, "medalBig", 200, 300, medal, -11.98, 1.24, 6.08, 0.2, { tint: 1.0 });
    const k = n < 12 ? 1 - n / 12 : 0; card(c, "sleeve", 700, 260, sleeve, -11.5 + 0.5 * k, 1.27, 5.93, 0.62, { tint: 0.96 });
    if (n >= 18 && n < 26) { const u = q((n - 18) / 8, 8); card(c, `glint${u}`, 500, 500, (p) => fxBurst(p, u, "#fff8d0", 8, 20, 150), -11.98, 1.2, 6.12, 0.34, { tint: 1.6 }); }
  },
  29: (c, n, u) => { // the submarine goes; the helmet stays on the bluff
    const w = 15 - 5 * u; card(c, "iboat", 1400, 360, iboat, 1.2 + 2 * u, -7 + 0.28 * (w * 360 / 1400) - 1.1 * u * u, -42 - 20 * u, w, { tint: 0.8 });
    card(c, "helmet", 420, 300, helmetCard, 0.95, 0.17, -24.0, 0.5, { tint: 0.86 });
  },
  30: (c) => {
    card(c, "banner", 1600, 400, banner, 0, 4.2, -4.94, 5.2);
    [[-3.3, 2.3, 0], [-2.1, 2.5, 1], [3.2, 2.4, 2]].forEach(([x, y, v]) => card(c, `photo${v}`, 500, 400, (p) => photoFrame(p, v), x, y, -4.93, 0.95));
    card(c, "wallmap", 1000, 1300, (p) => mapCard(p, 0), 4.6, 2.5, -4.93, 1.25);
    card(c, "case", 600, 800, displayCase, -3.5, 0.82, 2.6, 1.2);
    P(c, "tourist", TOURIST, 13, -2.3, 4.6, stand("smile", { facing: 1, look: 1, wave: 0.2, raise: 0.6, blink: lidAt(c.f, 62) }), {});
    P(c, "visitor", VISITOR, 12, 2.7, 4.7, stand("neutral", { back: true }), { s: 0.8 });
  },
  31: (c, n) => {
    card(c, "banner", 1600, 400, banner, 0, 4.2, -4.94, 5.2);
    [[-3.3, 2.3, 0], [-2.1, 2.5, 1], [3.2, 2.4, 2]].forEach(([x, y, v]) => card(c, `photo${v}`, 500, 400, (p) => photoFrame(p, v), x, y, -4.93, 0.95));
    card(c, "wallmap", 1000, 1300, (p) => mapCard(p, 0), 4.6, 2.5, -4.93, 1.25);
    card(c, "case", 600, 800, displayCase, -3.5, 0.82, 2.6, 1.2);
    P(c, "tourist", TOURIST, 13, -2.3, 4.6, stand("smile", { facing: 1, look: 1, wave: 0.2, raise: 0.6, blink: lidAt(c.f, 62) }), {});
    card(c, "plaque", 900, 560, plaque, 1.2, 1.05, 3.9, 0.8);
    P(c, "visitor", VISITOR, 12, 1.98, 4.6, stand(n > 40 ? "wow" : "neutral", { facing: -1, look: -1, blink: lidAt(c.f, 61, [c.f - n + 40]) }), { s: 0.8 });
  },
};

export const stage = (f: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] }, { s, n, u } = inShot(f);
  const warm: Warm = s.set === "cave" ? [[0.3, 0.5, 1.05, 3]] : s.set === "lanai" && s.look !== "high" ? (s.fire === 1 ? [[HOUSE.x, 3, HOUSE.z, 30], ...WARM_LANAI] : WARM_LANAI) : s.fire === 2 ? [[0.3, 1.6, 0.3, 40]] : s.look === "night" && s.set === "studio" ? [] : [];
  DIR[s.id]?.({ cam, out, look: s.look, warm, f }, n, u, s);
  void shotEnd;
  return out;
};
