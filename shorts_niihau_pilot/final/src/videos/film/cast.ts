// The film's cast and flat props, shot by shot. One design per person for the whole film (no identity changes):
// the pilot (cap, goggles, scarf; a lei at the party), the local man (blue shirt, braces), the rancher (straw hat,
// palaka shirt, moustache), his wife (teal dress, hair flower), the auntie, the kid, the helper (grey cap).
// Acting = single beats (STUDY.md D). Light is painted onto each card per look (relight, multiply: v4 method).
import * as THREE from "three";
import { Pen, bodyFront, relight, fxWaves, fxTicks, fxStars, fxBurst, fxSmoke, fxPlank, Outfit, Expr, FrontOpts, INK } from "./toon";
import { Stage, CamInfo, Place, tier, light2D, lidAt, blob, fkey, q } from "./cards";
import { Shot, inShot, shotEnd, COCKPIT, PILOT_S, EYE, COWL, GUEST, RADIO, LANTERN, TORCH1, TORCH2, HOUSE, TABLE, LookName, PLANE_Y, NX, NZ, PX, PZ, along, landT, planeAt, flyAt, altAt, flownAt, subAt, fireK, CRASH, TOUCH, TOUCH2, BUBBLE, SIGN } from "./story";
import { thought, harbour, battleship, farPlane, tracer, hole, vapour, cloudPuff, subTop, privateSign, splash } from "./art2d";
import { sheep, fxDust } from "./toon";
import { shelfCard, hatHook, noticeCard } from "./art2d";
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

const RELIGHT: Record<LookName, null | [string, string]> = { day: null, air: null, high: null, museum: null, dusk: ["255,236,214", "255,210,150"], night: ["180,188,255", "255,212,156"] };
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
const TINT: Record<LookName, number> = { day: 0.96, air: 0.96, high: 1.0, museum: 0.95, dusk: 0.86, night: 0.62 };
const fire = (c: Ctx, x: number, y: number, z: number, s: number, i: number) => {
  const v = (Math.floor(c.f / 2) + i) % 4, k = 1 + 0.06 * Math.sin(c.f * 1.7 + i * 2);
  card(c, `fire${v}`, 400, 500, (p) => fireBig(p, v), x, y + s * 0.62 * k, z, s * (i % 2 ? -1 : 1), { tint: 2.3 });
};
const smoke = (c: Ctx, x: number, y: number, z: number, n: number, rise: number, dx: number, born = -1e9, S = 1, dark = false) => {
  for (let k = 0; k < n; k++) {
    const u0 = ((c.f + 400) / 140 + k / n) % 1, u = u0 ** 1.35, size = (0.42 + 1.75 * u ** 0.8) * smooth01(u0 / 0.06) * S, tone = dark ? q(Math.min(0.4, u * 0.5), 5) : q(Math.min(1, u * 1.5), 5), v = k % 4, solid = u < 0.42;
    if (c.f - u0 * 140 < born) continue;
    card(c, `smoke${v}|${tone}`, 400, 400, (p) => fxSmoke(p, v, tone), x + (dx * u ** 0.9 + 0.25 * Math.sin(u * 8 + k * 2.4) * (0.3 + u)) * S, y + rise * u ** 0.85 * S, z - 2.8 * u * S, size,
      { soft: !solid, alpha: solid ? 1 : Math.max(0, 1 - (u - 0.42) / 0.5) ** 1.3, rot: k * 1.3 + u * (k % 2 ? 0.9 : -0.9), tint: TINT[c.look] });
  }
};
const smooth01 = (x: number) => { const u = Math.max(0, Math.min(1, x)); return u * u * (3 - 2 * u); };
const stand = (expr: Expr, o: Partial<FrontOpts> = {}): FrontOpts => ({ mode: "stand", expr, ...o });

// ---------------- takes (round 4): every subject of a take stands in the set for the whole take ----------------
const _e = new THREE.Euler(), _v = new THREE.Vector3(), R2 = Math.PI / 180;
/** world position of a point given in the plane's own axes (+x nose, +y up, +z the near wing) */
const planePt = (f: number, lx: number, ly: number, lz: number): [number, number, number] => {
  const pl = planeAt(f); _e.set(pl.roll * R2, pl.yaw * R2, pl.pitch * R2, "YZX"); _v.set(lx, ly, lz).applyEuler(_e);
  return [pl.pos[0] + _v.x, pl.pos[1] + _v.y, pl.pos[2] + _v.z];
};
/** the pilot in the cockpit of the moving plane */
const inCockpit = (c: Ctx, fo: FrontOpts) => { const pl = planeAt(c.f); P(c, "pilot", PILOT_O, 4, pl.pos[0], pl.pos[2], { mode: "sit", scarfDir: -1, ...fo }, { s: PILOT_S, y: COCKPIT[1] + pl.pos[1] - PLANE_Y, noBlob: true }); };
const HOLES: [number, number, number][] = [[-0.62, 0.16, 0.5], [-0.86, 0.02, 0.47], [-1.08, 0.2, 0.44], [-1.3, 0.06, 0.4]];
const holes = (c: Ctx, from = -1e9) => HOLES.forEach(([x, y, z], i) => { if (c.f >= from + i) { const [wx, wy, wz] = planePt(c.f, x, y, z + 0.03); card(c, "hole", 120, 120, hole, wx, wy, wz, 0.19, { rot: i * 1.3, tint: 0.95 }); } });
/** something streaming back from the plane: soft puffs that grow, sink and fade */
const stream = (c: Ctx, o: [number, number, number], n: number, step: number, size: number, drop: number, col: string, a0 = 0.85) => {
  for (let k = 0; k < n; k++) {
    const age = k + ((c.f * 0.8) % 1), u = age / n;
    card(c, `vap${col}`, 200, 200, (p) => vapour(p, col), o[0] - NX * age * step + 0.05 * Math.sin(k * 2.3 + c.f * 0.4), o[1] - drop * age ** 1.25 + 0.04 * Math.sin(k * 1.7), o[2] - NZ * age * step, size * (0.6 + 1.6 * u), { soft: true, alpha: a0 * (1 - u) ** 1.2, tint: 1.0 });
  }
};
const flock = (c: Ctx, list: [number, number, number, number][], run = 0) => list.forEach(([x, z, dir, ph], i) => {
  const k = run > 0 ? Math.max(0, run - i * 2) : 0, hop = k > 0 ? 0.32 * Math.abs(Math.sin(k * 0.55 + ph)) : 0, dip = k > 0 ? 0 : q(0.5 + 0.5 * Math.sin(c.f * 0.07 + ph), 6);
  card(c, `sheep${dip}`, 400, 300, (p) => sheep(p, dip), x + PX * dir * 0.3 * k, 0.5 + hop, z + PZ * dir * 0.3 * k, 1.35 * (dir * PX > 0 ? 1 : -1), { tint: TINT[c.look], rot: k > 0 ? 0.12 * Math.sin(k * 0.55 + ph) : 0 });
});

/** outlined tan dust cloud (the smoke shapes, recoloured) */
const dustDraw = (v: number) => (p: Pen) => { fxSmoke(p, v, 1); const g = p.g; g.globalCompositeOperation = "source-atop"; g.fillStyle = "rgba(232,196,136,0.78)"; g.fillRect(0, 0, 400, 400); g.globalCompositeOperation = "source-over"; };
const dust = (c: Ctx, x: number, y: number, z: number, w: number, u: number, i: number) => card(c, `dustc${i % 4}`, 400, 400, dustDraw(i % 4), x, y, z, w, { soft: u > 0.55, alpha: u > 0.55 ? Math.max(0, 1 - (u - 0.55) / 0.45) : 1, rot: i * 1.3 + u, tint: 1.0 });
// ---- hook: strafing dive over the burning harbour, the hit, the briefing remembered ----
const hook = (c: Ctx) => {
  const f = c.f, d = flownAt(f), sea = -altAt(f);
  // ground things slide back as he flies: lat = metres to screen right, dist = metres away from the lens
  const W = (lat: number, dist: number): [number, number] => [0.962 * lat + 0.271 * dist + NX * (52 - d), 0.271 * lat - 0.962 * dist + NZ * (52 - d)];
  { const [x, z] = W(10, 640); card(c, "harbour", 1600, 1600, harbour, x, sea + 0.8, z, 1250, { flat: true, rot: -0.28, tint: 0.98 }); }
  const ships: [number, number, number, boolean][] = [[62, 400, 1, true], [-6, 500, 0, false], [84, 585, 0, true], [22, 700, 1, false], [-70, 660, 0, true]];
  ships.forEach(([lat, dist, v, burn], i) => {
    const [x, z] = W(lat, dist), w = 118;
    card(c, `bship${v}`, 1200, 440, (p) => battleship(p, v), x, sea + (w * 440) / 1200 / 2 - 3.5, z, w * (i % 2 ? -1 : 1), { tint: 0.97 });
    if (burn) { fire(c, x + 8, sea + 10, z + 1, 26, i); fire(c, x - 20, sea + 8, z + 1, 16, i + 1); smoke(c, x + 4, sea + 26, z - 2, 9, 8.5, -3.2, -1e9, 16, true); }
  });
  for (const [lat, dist, f0] of [[30, 330, 8], [-50, 560, 40]]) if (f >= f0 && f < f0 + 30) { const [x, z] = W(lat, dist), u = (f - f0) / 30; card(c, "splash", 300, 600, splash, x, sea + 16 * Math.sin(Math.PI * Math.min(1, u * 1.2)) - 2, z, 14, { tint: 1.0 }); }
  // flak bursts in the sky and the other aircraft of the raid (far, small)
  [[-40, 300, 44, 2], [70, 420, 60, 12], [10, 520, 78, 22], [-80, 480, 52, 34], [90, 640, 90, 44], [-10, 380, 70, 54], [50, 560, 66, 64], [-60, 600, 96, 6]].forEach(([lat, dist, h, f0], i) => {
    if (f < f0) return; const [x, z] = W(lat, dist), u = Math.min(1, (f - f0) / 26), v = i % 4;
    card(c, `smoke${v}|0`, 400, 400, (p) => fxSmoke(p, v, 0), x, sea + h + 3 * u, z, 6 + 12 * u ** 0.5, { tint: 0.9, rot: i });
    if (f < f0 + 3) card(c, "flakflash", 500, 500, (p) => fxBurst(p, 0.3, "#fff3b0", 9, 30, 200), x, sea + h, z, 14, { tint: 2.2 });
  });
  [[-70, 350, 58, 1.3, 0], [40, 470, 84, -1.1, 1], [100, 600, 70, 1.0, 0], [-20, 620, 104, -0.9, 1], [20, 300, 96, 1.6, 0]].forEach(([lat, dist, h, vx, v], i) => {
    const [x, z] = W(lat + vx * f, dist); card(c, `fplane${v}`, 300, 200, (p) => farPlane(p, v), x, sea + h - 0.12 * f * (i % 2), z, 15 * (vx > 0 ? 1 : -1), { tint: 0.95, rot: v ? 0.5 : -0.12 * Math.sign(vx) });
  });
  // his own guns, then the hit: a stitched row of holes behind the cockpit and fuel streaming from the wing tank
  if (f >= 3 && f < 19) for (const z of [-0.22, 0.22]) { // the two cowl guns
    for (let k = 0; k < 2; k++) { const ph = ((f + k * 3 + (z > 0 ? 1 : 0)) % 6) / 6, a = planePt(f, 2.9 + ph * 7, 0.5, z); card(c, "tracer", 300, 40, tracer, a[0], a[1], a[2], 1.3, { rot: -0.42, tint: 2.2 }); }
    if ((f + (z > 0 ? 1 : 0)) % 3 === 0) { const [x, y, zz] = planePt(f, 1.5, 0.62, z); card(c, "muzzle", 500, 500, (p) => fxBurst(p, 0.25, "#fff3b0", 8, 30, 200), x, y, zz, 0.6, { tint: 2.4 }); }
  }
  holes(c, 20);
  for (let i = 0; i < 4; i++) if (f >= 20 + i && f < 24 + i) { const [x, y, z] = planePt(f, HOLES[i][0], HOLES[i][1], HOLES[i][2] + 0.1), u = q((f - 20 - i) / 4, 4); card(c, `hit${u}`, 500, 500, (p) => fxBurst(p, u, "#fff3b0", 8, 30, 200), x, y, z, 0.6, { tint: 2.4 }); }
  if (f >= 24) stream(c, planePt(f, -0.25, -0.5, 1.05), 9, 0.34, 0.34, 0.035, "255,246,214");
  const hit = f >= 20 && f < 34;
  inCockpit(c, { expr: f < 20 ? "stern" : hit ? "shock" : "nervous", look: f < 34 ? 0.3 : -0.4, lookY: f >= 36 ? 1 : 0, headTilt: hit ? q(6 * Math.sin((f - 20) * 0.9), 2) : f >= 36 ? -5 : 0, flutter: q((f / 9) % 1, 9), blink: lidAt(f, 7, [20]) });
  if (f >= 30) { const k = smooth01((f - 30) / 8), pop = 1 + 0.12 * Math.sin(Math.PI * k) + (f >= 59 ? 0.07 * Math.max(0, 1 - (f - 59) / 5) : 0), st = f >= 59 ? 1 : 0; card(c, `thought${st}`, 900, 820, (p) => thought(p, st), BUBBLE[0], BUBBLE[1], BUBBLE[2], 1.62 * k * pop, { tint: 1.0 }); }
};
// ---- over the sea: fuel trail, a coughing engine, the island ahead, the submarine that should be waiting ----
const overSea = (c: Ctx) => {
  const f = c.f, sea = -altAt(f), cy = ((f - 150) % 41) / 41;
  holes(c);
  stream(c, planePt(f, -0.25, -0.5, 1.05), 14, 0.5, 0.36, 0.03, "255,246,214");
  for (let k = 0; k < 5; k++) { const age = ((f - 150) % 41) - 2 - k * 2; if (age < 0 || age > 22) continue; const o = planePt(f - age, 1.9, 0.5, 0.2), u = age / 22, v = k % 4; card(c, `smoke${v}|1`, 400, 400, (p) => fxSmoke(p, v, 0.2), o[0] - NX * age * 0.55, o[1] + 0.3 * u, o[2] - NZ * age * 0.55, 0.5 + 1.3 * u, { soft: u > 0.5, alpha: u > 0.5 ? 2 * (1 - u) : 1, tint: 0.95, rot: k }); }
  inCockpit(c, { back: f >= 219, expr: cy < 0.25 ? "shock" : f >= 242 ? "relief" : "nervous", look: 0.6, lookY: f >= 242 ? -0.6 : 0, headTilt: q(3 * Math.sin(f * 0.11), 2), flutter: q((f / 10) % 1, 10), blink: lidAt(f, 7) });
  const s = subAt(f); card(c, "subtop", 1200, 360, subTop, s[0], sea + 0.6, s[2], 19, { flat: true, rot: 2.2, tint: 0.95 });
};
// ---- the island through cloud, then down to the census board ----
const census = (c: Ctx, n: number) => {
  card(c, "board", 900, 1100, chalkboard, 0.55, 0.86, 9.25, 1.42, { tint: TINT.day });
  P(c, "rancher", RANCHER, 2, -0.98, 9.55, stand("smile", { facing: 1, look: 1, blink: lidAt(c.f, 21) }), { s: 1.14 });
  P(c, "wife", WIFE, 3, -0.42, 9.9, stand("smile_closed", { facing: 1 }), { s: 0.97 });
  P(c, "kid", KID, 5, -0.2, 10.4, stand("grin", { facing: 1, look: 1, wave: n > 34 ? q(Math.sin(n * 0.5), 12) : undefined }), { s: 0.74 });
  flock(c, SHEEP);
  if (n < 16) for (const [x, y, z, w] of [[-4.5, 41, 30.5, 11], [5.5, 37, 29, 12], [-2.5, 28, 25, 9], [5, 21, 22, 8]]) card(c, "cloudA", 600, 400, cloudPuff, x, y, z, w, { soft: true, alpha: 0.9 * (1 - smooth01((n - 4) / 12)), tint: 1.0 });
};
const SHEEP: [number, number, number, number][] = [[...along(-30, 4.2)].filter((_, i) => i !== 1).concat([1, 0.3]) as [number, number, number, number], [...along(-21, -4.4)].filter((_, i) => i !== 1).concat([-1, 1.9]) as [number, number, number, number], [...along(-13, 5.0)].filter((_, i) => i !== 1).concat([1, 3.1]) as [number, number, number, number], [-9.5, -12, -1, 4.4], [9, -9, 1, 5.2]];
// ---- the crash field in one take: landing, fence, the dazed pilot, pulled out, pistol and papers, asked back, the islanders ----
const fieldTake = (c: Ctx) => {
  const f = c.f, pl = planeAt(f), t = landT(f);
  flock(c, SHEEP, f >= 289 ? f - 289 : 0);
  // dust: both touchdowns, the roll, the fence
  for (const [f0, w] of [[TOUCH, 1.5], [TOUCH2, 1.8]]) if (f >= f0 && f < f0 + 20) { const u = (f - f0) / 20; for (const sd of [-1.2, 1.2]) { const a = along(landT(f0) - 0.4 - 1.5 * u, sd * (1 + 0.5 * u)); dust(c, a[0], 0.4 + 0.9 * u, a[2], w * (0.5 + 1.2 * u), u, sd > 0 ? 0 : 1); } }
  for (let b = Math.max(TOUCH2 + 2, f - 20); b <= Math.min(f, 333); b += 3) { const u = (f - b) / 20, a = along(landT(b) - 1.6, b % 2 ? 1.2 : -1.2); dust(c, a[0], 0.35 + 0.8 * u, a[2], 0.8 + 1.9 * u, u, b); }
  if (f >= CRASH && f < CRASH + 26) {
    const u = (f - CRASH) / 26, g = along(-4.4, 0);
    if (f < CRASH + 6) { const v = q((f - CRASH) / 6, 6); card(c, `bigbang${v}`, 500, 500, (p) => fxBurst(p, v), g[0] + 1.2, 1.5, g[2] + 2.2, 4.6); }
    for (let i = 0; i < 6; i++) { const a = along(-4.6 + 2.6 * u, (i - 2.5) * 1.5 * (1 + 0.5 * u)); dust(c, a[0], 0.7 + 1.5 * u + 0.3 * (i % 2), a[2] + 0.4, 1.4 + 2.8 * u, u, i); }
  }
  [[1.5, 1.7, 2.6, 2.2], [0.9, 2.4, -2.2, -1.6], [2.2, 2.9, 0.6, 3.0], [1.2, 1.3, 3.4, -2.4], [1.9, 2.1, -3.0, 1.4], [0.7, 3.2, 1.6, 2.0], [2.6, 1.9, -1.2, -2.8], [1.4, 2.6, 0.2, 1.1]].forEach(([vt, vy, vw, sp], i) => {
    const u = (f - CRASH - (i % 3)) / 30; if (u < 0 || u > 1.15) return;
    const a = along(-4.6 + vt * 4.4 * u, vw * (0.4 + 0.9 * u));
    card(c, i % 3 === 2 ? "post" : "plank", 320, 110, fxPlank, a[0], 0.8 + vy * 2.4 * u - 4.4 * u * u, a[2], i % 3 === 2 ? 1.25 : 0.95, { rot: sp * u * 3.4 + i, tint: TINT.day });
  });
  if (f >= CRASH + 5) smoke(c, pl.pos[0] + COWL[0] - 0.38, pl.pos[1] - PLANE_Y + COWL[1] - 0.1, pl.pos[2] + COWL[2] - 0.35, 14, 7.8, -1.9, CRASH + 5);
  // the pilot: braced on the way in, dazed after the fence, pulled out on "pulls him out" (358-372)
  const OUT0 = 358, OUT1 = 372, got = f >= 398, ask = f >= 442, no = f >= 500;
  if (f < OUT0) {
    const dz = f >= CRASH + 4;
    inCockpit(c, { expr: f < TOUCH ? "nervous" : dz ? "dazed" : "shock", headTilt: dz ? q(7 * Math.sin(f * 0.19) + 2 * Math.sin(f * 0.47), 4) : f >= TOUCH ? q(5 * Math.sin(f * 1.3), 2) : 0, tilt: dz ? q(2.2 * Math.sin(f * 0.19 - 0.8), 4) : 0, flutter: q((f / (dz ? 20 : 8)) % 1, 20), look: f < CRASH ? 0.5 : 0 });
    if (f >= CRASH + 8) { const u = q(((f - CRASH) / 34) % 1, 34); card(c, `stars${u}`, 420, 210, (p) => fxStars(p, u), EYE[0] + 0.02, EYE[1] + 0.56, 0.06, 0.98); }
  } else if (f < OUT1) {
    const u = smooth01((f - OUT0) / (OUT1 - OUT0));
    P(c, "pilot", PILOT_O, 4, 1.35 * u, 5.6 * u, stand("shock", { facing: 1, look: 1, tilt: q(-14 * Math.sin(Math.PI * u), 2), wave: 0.6, waveL: 0.4, scarfDir: -1 }), { s: PILOT_S + (1.1 - PILOT_S) * u, y: COCKPIT[1] * (1 - u) + 1.1 * Math.sin(Math.PI * u), noBlob: true });
  } else {
    P(c, "pilot", PILOT_O, 4, 1.35, 5.6, stand(no ? "nervous" : ask ? "hesitant" : got ? "confused" : "dazed", { facing: 1, look: 1, wave: ask ? 0.9 : undefined, raise: ask ? 0.45 : undefined, headTilt: got ? 0 : q(5 * Math.sin(f * 0.2), 4), blink: lidAt(f, 7, [398, 500]), scarfDir: -1 }), { s: 1.1 });
  }
  // the local man walks in from the right as the dust settles, reaches up, and comes away with the pistol and the papers
  if (f >= 336) {
    const k = smooth01((f - 336) / 18), reach = f >= 352 && f < OUT1;
    P(c, "man", MAN, 6, 2.38 + 2.3 * (1 - k), 5.7, stand(no ? "smile_closed" : got ? "smile_closed" : "smile", { facing: -1, look: -1, prop: got ? "loot" : null, wave: reach ? -0.8 : undefined, raise: reach ? 0.8 : undefined, blink: got ? 0 : lidAt(f, 23), headTilt: no ? q(7 * Math.sin((f - 500) * 0.9) * Math.max(0, 1 - (f - 500) / 16), 2) : 0 }), { y: k < 1 ? 0.06 * Math.abs(Math.sin(f * 0.8)) : 0 });
  }
  // the islanders: behind the lens until the camera cranes back over them
  if (f >= 506) {
    const n = f - 521, cheer = f >= 535;
    P(c, "rancher", RANCHER, 2, -1.9, 9.55, stand(cheer ? "cheer" : "smile", { facing: 1, look: 0.5, wave: cheer ? q(Math.sin(n * 0.34), 16) : undefined, blink: lidAt(f, 21) }), { s: 1.14 });
    P(c, "kid", KID, 5, -0.95, 10.0, stand("laugh", { wave: q(Math.sin(n * 0.7), 12), waveL: q(Math.sin(n * 0.7 + 2.2), 12) }), { s: 0.74, y: cheer ? 0.3 * Math.max(0, Math.sin(((n % 20) / 20) * Math.PI * 1.25)) : 0 });
    P(c, "auntie", AUNTIE, 8, -0.02, 9.5, stand("smile", { look: 0.2, blink: lidAt(f, 23) }), { s: 0.98 });
    P(c, "wife", WIFE, 3, 0.74, 9.85, stand(cheer ? "cheer" : "smile", { facing: -1, look: -0.6, wave: cheer ? q(Math.sin(n * 0.4 + 2.4), 16) : undefined, blink: lidAt(f, 24) }), { s: 0.97 });
  }
  void t;
};
// ---- the night yard: the radio brings the news, the party freezes (one cast for the insert and the wide) ----
const nightParty = (c: Ctx) => {
  const f = c.f, news = f >= 686, t = (i: number) => f >= 711 + i * 3;
  P(c, "kid", KID, 5, -1.06, -0.4, stand(news ? "shock" : "grin", { facing: t(0) ? 1 : -1, look: t(0) ? 1 : -1, blink: lidAt(f, 31, [686]), headTilt: news ? 0 : -5 }), { s: 1.22, boost: 1.4 });
  if (news && f < 693) { const u = q((f - 686) / 7, 7); card(c, `ticks${u}`, 200, 200, (p) => fxTicks(p, u), -1.0, 1.72, -0.35, 0.36); }
  if (f < 712) { const u = q((f / 15) % 1, 15); card(c, `waves${u}`, 300, 300, (p) => fxWaves(p, u), RADIO[0] - 0.02, TABLE.y + 0.5, RADIO[2] + 0.14, 0.34, { rot: Math.PI / 2 - 0.25, tint: 1.25 }); }
  P(c, "man", MAN, 6, -0.42, -0.85, stand(t(1) ? "stern" : news ? "neutral" : "laugh", { facing: t(1) || !news ? 1 : -1, look: t(1) ? 1 : news ? -1 : 0, blink: lidAt(f, 41, [714]) }), {});
  P(c, "rancher", RANCHER, 2, 0.3, -0.6, stand(t(2) ? "stern" : news ? "neutral" : "cheer", { facing: t(2) || !news ? 1 : -1, look: t(2) || !news ? 1 : -1, blink: lidAt(f, 42, [717]) }), { s: 1.12 });
  P(c, "auntie", AUNTIE, 8, -2.85, -0.45, stand(t(3) ? "nervous" : news ? "neutral" : "smile_closed", { facing: 1, look: t(3) ? 1 : 0 }), { s: 0.98 });
  P(c, "wifeBack", WIFE, 3, -0.42, 2.3, stand("neutral", { back: true, headTilt: t(2) ? 5 : -3 }), { s: 0.97, y: -0.75 });
  P(c, "pilotLei", PILOT_LEI, 4, GUEST[0], GUEST[2], stand(f >= 719 ? "frozen" : "smile_closed", { prop: "plate", bite: true, look: f >= 727 ? -1 : 0, blink: lidAt(f, 77, [719]) * (f < 723 ? 1 : 0), facing: f < 719 ? -1 : undefined, headTilt: f < 719 ? q(3 * Math.sin(f * 0.25), 2) : 0 }), { s: 1.15, boost: 2.2, side: 1 });
};
// ---- the helper and his shotgun, then the house they set alight behind them ----
const helperTake = (c: Ctx) => {
  const f = c.f, turn = f >= 937, burn = f >= 945, fk = fireK(f);
  if (burn) {
    const H = (lx: number, ly: number, lz: number): [number, number, number] => [HOUSE.x + lx * Math.cos(HOUSE.yaw) + lz * Math.sin(HOUSE.yaw), ly, HOUSE.z - lx * Math.sin(HOUSE.yaw) + lz * Math.cos(HOUSE.yaw)];
    [[0, 3.6, 0.5, 5.4], [-2.4, 3.2, 1.2, 3.8], [2.3, 3.2, 1.0, 4.0], [-2.2, 1.6, 2.7, 1.5], [2.2, 1.6, 2.7, 1.5]].forEach(([lx, ly, lz, s], i) => { const [x, y, z] = H(lx, ly, lz), k = smooth01((f - 945 - i * 2) / 12); if (k > 0) fire(c, x, y - (1 - k) * 0.8, z, s * (0.25 + 0.75 * k), i); });
    smoke(c, HOUSE.x, 5.5, HOUSE.z, 9, 9, 2.5, 950);
    if (f >= 954) for (let i = 0; i < 7; i++) { const n = f - 945, tt = ((n + i * 9) % 46) / 46, [x, y, z] = H(2.2 + 1.2 * tt + 0.3 * Math.sin(i), 2.2 + 2.4 * tt - 2.6 * tt * tt + 0.2 * i, 2.8 + 4.5 * tt); if (f - tt * 46 >= 952) card(c, "sheet", 200, 240, paperSheet, x, y, z, 0.42, { rot: tt * 5 + i, tint: 1.0 }); }
  }
  const boost = 1.6 + 1.4 * (burn ? fk : 0);
  P(c, "pilot", PILOT_O, 4, 0.3, 1.2, stand("stern", { facing: turn ? -1 : 1, look: turn ? -1 : 1, prop: turn ? "torch" : null, blink: lidAt(f, 7), scarfDir: turn ? 1 : -1 }), { s: 1.15, boost, side: burn ? -1 : undefined });
  P(c, "helper", HELPER, 9, 1.25, 1.1, stand("nervous", { facing: -1, look: -1, prop: f >= 909 ? "shotgun" : null, blink: lidAt(f, 51) }), { boost, mirror: true, side: burn ? -1 : undefined });
};
// ---- the fight by the burning plane, one take: alone, caught, the jump, three shots, mad, the throw, the rock ----
const fightTake = (c: Ctx) => {
  const f = c.f, Zr = 9.5;
  fire(c, 0.3, 0.9, 0.3, 3.6, 0); fire(c, -1.6, 0.7, -0.5, 2.6, 1);
  const eIn = smooth01((f - 1102) / 18), walk = eIn > 0 && eIn < 1 ? 0.07 * Math.abs(Math.sin(f * 0.8)) : 0;
  const JUMP = 1161, jump = f >= JUMP, kj = smooth01((f - JUMP) / 9), back = smooth01((f - 1172) / 9);
  const SH = [1204, 1216, 1226], hitI = SH.findIndex((h) => f >= h && f < h + 5), flinch = SH.reduce((a, h) => a + (f >= h && f < h + 6 ? 1 - (f - h) / 6 : 0), 0);
  const LIFT = 1318, THROW = 1351, lift = smooth01((f - LIFT) / 12), thr = f >= THROW, kt = thr ? Math.min(1, (f - THROW) / 7) : 0;
  const rx = -0.5 + 0.75 * kj - 0.1 * flinch, mad = f >= 1292;
  // the rancher
  const rexpr: Expr = f >= LIFT ? "stern" : f >= 1248 ? (mad ? "stern" : "pained") : f >= SH[0] ? "pained" : jump && !back ? "pained" : "stern";
  const up = f >= 1124 && !jump;
  P(c, "rancher", RANCHER, 2, rx, Zr, stand(rexpr, { facing: f >= 1093 ? 1 : 0, look: f >= 1093 ? 1 : 0, wave: f >= LIFT + 4 ? 1 : up ? 0 : undefined, waveL: f >= LIFT + 4 ? -1 : up ? 0 : undefined, tilt: q(28 * kj * (1 - back) - 7 * flinch + (thr ? 8 : 0), 2), headTilt: f >= 1248 && f < LIFT ? (mad ? -4 : 3) : 0, blink: lidAt(f, 21, [1292]) }), { s: 1.14, y: 0.55 * Math.sin(Math.PI * Math.min(1, kj * 0.8)) * (1 - back), boost: 1.3 });
  // his wife: brought in with him, watches, then walks over with the rock
  const wk = smooth01((f - 1368) / 20), sw = f >= 1423, wx = -3.9 + 2.9 * eIn + 2.25 * wk;
  P(c, "wife", WIFE, 3, wx, wk > 0 ? 9.6 : 9.9, stand(sw ? "stern" : jump ? (wk > 0 ? "nervous" : "shock") : "nervous", { facing: 1, look: 1, lookY: wk >= 1 ? 1 : 0, prop: f >= 1380 ? "rock" : null, wave: f >= 1380 ? (sw ? 1 : -0.6) : up || (jump && f < 1200) ? 0 : undefined, waveL: up ? 0 : undefined, raise: f >= 1380 ? (sw ? 0.35 : 1) : undefined, blink: lidAt(f, 24, [1423]) }), { s: 0.97, boost: 1.3, y: (eIn < 1 ? walk : 0) + (wk > 0 && wk < 1 ? 0.07 * Math.abs(Math.sin(f * 0.8)) : 0) });
  if (f >= 1425 && f < 1433) { const u = q((f - 1425) / 8, 8); card(c, `bonk${u}`, 500, 500, (p) => fxBurst(p, u), 2.0, 0.62, 9.7, 1.0); }
  if (f >= 1427) { const u = q(((f - 1427) / 30) % 1, 30); card(c, `stars${u}`, 420, 210, (p) => fxStars(p, u), 2.0, 0.95, 9.75, 0.9); }
  // the pilot: walks them in at gunpoint, is jumped, fires three times, is lifted and thrown at the wall
  if (f >= 1102 && kt < 1) {
    const px0 = 0.72 + 3.6 * (1 - eIn) + 0.33 * back;
    if (f < LIFT) P(c, "pilot", PILOT_O, 4, px0, 9.45, stand(jump ? "shock" : "stern", { facing: 1, prop: "pistol", scarfDir: 1, tilt: q(-8 * kj * (1 - back), 2) }), { s: 1.12, mirror: true, y: walk });
    else P(c, "pilot", PILOT_O, 4, thr ? rx - 0.6 + 2.9 * kt : px0 + (rx - 0.6 - px0) * lift, 9.45, { mode: "fall", expr: "shock", scarfDir: -1 }, { s: 1.0 + 0.12 * (1 - lift), y: 2.55 * lift - 0.9 * kt * kt, roll: (-Math.PI / 2) * lift - 1.2 * kt, noBlob: true });
  }
  if (hitI >= 0) { const u = q((f - SH[hitI]) / 5, 5); card(c, `bang${u}`, 500, 500, (p) => fxBurst(p, u, "#fff3b0", 9, 30, 200), 0.62, 1.33, Zr, 0.7, { tint: 2.4 }); }
  if (f >= 1357 && f < 1365) { const u = q((f - 1357) / 8, 8); card(c, `bigbang${u}`, 500, 500, (p) => fxBurst(p, u), 2.3, 1.1, 9.6, 1.6); }
  if (f >= 1359 && f < 1400) { const u = q(((f - 1359) / 30) % 1, 30); card(c, `stars${u}`, 420, 210, (p) => fxStars(p, u), 2.25, 1.75, 9.7, 1.1); }
  // the helper: comes in behind the pilot, bolts when the fight starts
  if (f >= 1102 && f < 1200) { const run = smooth01((f - 1176) / 18); P(c, "helper", HELPER, 9, 1.32 + 3.6 * (1 - eIn) + 3.6 * run, 9.95, stand(jump ? "shock" : "nervous", { facing: -1, look: run > 0 ? 1 : -1, prop: "shotgun" }), { mirror: run === 0, y: walk + (run > 0 ? 0.08 * Math.abs(Math.sin(f * 0.9)) : 0) }); }
};
// ---- never empty: the ranch in the sun, then the sign on its fence ----
const privateTake = (c: Ctx) => {
  card(c, "psign", 700, 760, privateSign, SIGN[0] + 0.3, 0.68, SIGN[2] + 0.75, 1.25, { tint: 0.98 });
  flock(c, [[-9.5, 2, 1, 0.4], [-11.5, -5, -1, 1.7], [-4.2, -11, 1, 2.9], [-8.4, -16, -1, 4.0], [-13, -22, 1, 5.3], [-2.5, -24, -1, 0.9]]);
};
// ---- the ranch-house wall: four pictures side by side, the camera travels along them ----
const wallTake = (c: Ctx) => {
  const f = c.f, up = { y: 1.25, noBlob: true };
  card(c, "portrait", 700, 900, portrait, -1.65, 2.95, -0.96, 0.8);
  card(c, "notice", 520, 640, noticeCard, -0.98, 3.2, -0.96, 0.36); card(c, "hathook", 400, 360, hatHook, -0.98, 2.52, -0.96, 0.26);
  P(c, "man", MAN, 6, -0.5, -0.3, stand(f > 1583 ? "confused" : "neutral", { facing: -1, look: 1, wave: -0.9, raise: 1, blink: lidAt(f, 41, [1583]) }), up);
  card(c, "conch", 300, 300, conch, -0.175, 2.7, -0.22, 0.27, { rot: 0.5 });
  P(c, "auntie", AUNTIE, 8, 0.42, -0.3, stand("smile", { facing: 1, look: 1, lookY: 0.5, wave: -0.6, raise: 0.5, blink: lidAt(f, 43) }), { ...up, s: 0.98 });
  card(c, "lampc", 300, 520, lampCard, 0.92, 2.72, -0.25, 0.3, { tint: 1.25 });
  card(c, "boatcal", 700, 900, boatCal, 1.88, 2.95, -0.96, 0.72);
  P(c, "kid", KID, 5, 1.36, -0.2, stand("grin", { facing: 1, look: 1, lookY: -0.5, wave: 0.3, raise: 0.9 }), { ...up, s: 0.8, y: 1.6 });
};
// ---- the museum: banner, the plane on its plinth, the plaque, the room ----
const museumTake = (c: Ctx) => {
  const f = c.f;
  card(c, "banner", 1600, 400, banner, 0, 4.2, -4.94, 5.2);
  [[-3.3, 2.3, 0], [-2.1, 2.5, 1], [3.2, 2.4, 2]].forEach(([x, y, v]) => card(c, `photo${v}`, 500, 400, (p) => photoFrame(p, v), x, y, -4.93, 0.95));
  card(c, "wallmap", 1000, 1300, (p) => mapCard(p, 0), 4.6, 2.5, -4.93, 1.25);
  card(c, "case", 600, 800, displayCase, -3.5, 0.82, 2.6, 1.2);
  P(c, "tourist", TOURIST, 13, -2.3, 4.6, stand("smile", { facing: 1, look: 1, wave: 0.2, raise: 0.6, blink: lidAt(f, 62) }), {});
  card(c, "plaque", 900, 560, plaque, 1.2, 1.05, 3.9, 0.8);
  P(c, "visitor", VISITOR, 12, 1.98, 4.6, stand(f > 1873 ? "wow" : "neutral", { facing: -1, look: -1, blink: lidAt(f, 61, [1873]) }), { s: 0.8 });
};

// ---------------- beats ----------------
const DIR: Record<number, (c: Ctx, n: number, u: number, s: Shot) => void> = {
  1: hook, 2: census, 3: overSea, 4: fieldTake, 5: fieldTake, 6: fieldTake, 7: fieldTake, 8: fieldTake,
  10: nightParty, 11: nightParty, 15: helperTake, 16: helperTake,
  19: fightTake, 20: fightTake, 21: fightTake, 22: fightTake, 23: fightTake, 24: fightTake,
  25: privateTake, 26: wallTake, 30: museumTake, 31: museumTake,
  9: (c, n) => { // the party: everyone happy, the guest of honour eating
    P(c, "kid", KID, 5, -1.02, -0.4, stand("grin", { facing: 1, look: 1, wave: q(Math.sin(n * 0.6), 12) }), { s: 1.22 });
    P(c, "man", MAN, 6, -0.42, -0.85, stand("laugh", { facing: 1 }), {});
    P(c, "rancher", RANCHER, 2, 0.3, -0.6, stand("cheer", { facing: 1, look: 1, blink: lidAt(c.f, 21) }), { s: 1.12 });
    P(c, "auntie", AUNTIE, 8, -2.85, -0.45, stand("smile_closed", { facing: 1 }), { s: 0.98 });
    P(c, "wifeBack", WIFE, 3, -0.42, 2.3, stand("neutral", { back: true }), { s: 0.97, y: -0.75 });
    P(c, "pilotLei", PILOT_LEI, 4, GUEST[0], GUEST[2], stand("smile_closed", { prop: "plate", bite: true, facing: -1, headTilt: q(3 * Math.sin(n * 0.25), 2) }), { s: 1.15, boost: 2.2, side: 1 });
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
};

export const stage = (f: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] }, { s, n, u } = inShot(f);
  const warm: Warm = s.set === "cave" ? [[0.3, 0.5, 1.05, 3]] : s.set === "lanai" && s.look !== "high" ? (s.fire === 1 ? [[HOUSE.x, 3, HOUSE.z, 30], ...WARM_LANAI] : WARM_LANAI) : s.fire === 2 ? [[0.3, 1.6, 0.3, 40]] : s.look === "night" && s.set === "studio" ? [] : [];
  DIR[s.id]?.({ cam, out, look: s.look, warm, f }, n, u, s);
  void shotEnd; void flyAt; void TOUCH; void medal; void calendar; void noBoats; void canoe; void curtainCard; void iboat; void helmetCard; void bunting; void sleeve; void ropeCard; void shelfCard; void caveBack;
  return out;
};
