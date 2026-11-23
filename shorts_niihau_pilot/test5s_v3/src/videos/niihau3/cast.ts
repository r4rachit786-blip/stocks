// v3 cast: who stands where and their single acting beats (STUDY.md D: figures are frozen until their beat; swaps
// are instant and hidden by a blink). Scene light is painted onto each card (relight): moon-lavender wash, then warm
// light from the side of the nearest lamp / torch / doorway.
import * as THREE from "three";
import { Pen, bodyFront, relight, fxWaves, fxTicks, Outfit, Expr, FrontOpts, INK } from "./toon";
import { Stage, CamInfo, Place, tier, light2D, lidAt, blob, fkey, q } from "./cards";
import { PILOT, PILOT_S, RADIO, LANTERN, TORCH1, TORCH2, HOUSE, F_NEWS, F_TURN, F_CUT, F_DART, TABLE, shotAt } from "./story";

const PILOT_O: Outfit = { jacket: "#a8905c", pants: "#6b5a3c", boots: INK, hat: "pilot", goggles: true, collar: "#6e4a2e", belt: "#d5c9a2", plain: true, skin: "#fffaf4",
  lei: ["#fff6e6", "#f7c948", "#f48fb1", "#ff7a5a", "#fff6e6", "#c084e0"] };
const RANCHER: Outfit = { jacket: "#eef0f4", check: "#2f4f93", sleeve: "#2f4f93", pants: "#75604a", boots: "#4a3426", hat: "straw", hatband: "#a8402f", moustache: "#3a2a22", skin: "#fff6ec", buttons: "#f6f6f2" };
const WOMAN: Outfit = { jacket: "#2f9a8f", dress: "#2f9a8f", print: "#f7e3b4", pants: "#3b3f52", boots: "#fdeedd", hat: "longhair", hair: "#3a2620", flower: "#e8463f", lei: ["#fff6e6", "#f7c948", "#f48fb1"], skin: "#fff6ec" };
const AUNTIE: Outfit = { jacket: "#d9694e", dress: "#d9694e", print: "#fbe6a8", pants: "#3b3f52", boots: "#fdeedd", hat: "longhair", hair: "#5a5560", flower: "#fff6e6", lei: ["#f7c948", "#ff9e57", "#fff6e6"], skin: "#fff6ec", build: "stout" };
const MAN: Outfit = { jacket: "#6f94ba", suspenders: "#6b4a30", pants: "#5d5348", boots: "#4a3426", hat: "hair", hair: "#2f211c", skin: "#fff6ec", buttons: "#e8eef4", lei: ["#ff9e57", "#fff6e6", "#f48fb1"] };
const KID: Outfit = { jacket: "#f6f2e8", stripes: "#d0503f", pants: "#4d6d9a", boots: "#fdebd8", hat: "hair", hair: "#2f211c", build: "kid", skin: "#fffaf4", plain: true };

/** warm sources that reach the cast: position (lamp height) and strength */
const WARM: [number, number, number, number][] = [
  [LANTERN[0], LANTERN[1] + 0.2, LANTERN[2], 1.5], [TORCH1[0], 2.1, TORCH1[2], 2.6], [TORCH2[0], 2.1, TORCH2[2], 2.6],
  [HOUSE.x + 1.2, 2.0, HOUSE.z + 4.0, 2.0],
];
const tmp = new THREE.Vector3();
const person = (cam: CamInfo, okey: string, o: Outfit, seed: number, x: number, y: number, z: number, fo0: FrontOpts, scale = 1, warmBoost = 1): Place => {
  const d = cam.pos.distanceTo(tmp.set(x, y + 1.2, z)) / scale, [w, h, k] = tier(d);
  const fo = { ...fo0, light: light2D(cam, false), seed };
  // strongest warm source: which side of the card it is on (seen from this camera) and how strong
  let best = 0, side = 0;
  for (const [sx, sy, sz, I] of WARM) {
    const dx = sx - x, dz = sz - z, dd = dx * dx + dz * dz + (sy - 1.4) ** 2, s = I / (dd + 0.9);
    if (s > best) { best = s; const lat = (dx * cam.right.x + dz * cam.right.z) / Math.sqrt(dx * dx + dz * dz + 1e-6); side = lat > 0.12 ? 1 : lat < -0.12 ? -1 : 0; }
  }
  const wk = q(Math.min(0.95, 0.3 + best * 1.0 * warmBoost), 20);
  return { key: `F|${okey}|${fkey(fo)}|${side}|${wk}`, x, y, z, scale, size: [w, h, k],
    draw: (p: Pen) => { bodyFront(p, o, fo); relight(p, "100,108,236", 0.47, "255,198,124", side, wk); } };
};

const turnAt = (f: number, i: number) => f >= F_TURN + i * 3;
export const stage = (f: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] }, shot = shotAt(f);
  const news = f >= F_NEWS;
  // ---- the kid at the radio ----
  {
    const t = turnAt(f, 0), expr: Expr = !news ? "grin" : "shock";
    const fo: FrontOpts = { mode: "stand", expr, facing: t ? 1 : -1, look: t ? 1 : -1, blink: lidAt(f, 31, [F_NEWS, F_TURN]), headTilt: news ? 0 : -5, tilt: news ? 0 : -2 };
    out.places.push(person(cam, "kid", KID, 5, -1.1, 0, -0.4, fo, 1.02, 1.4));
    if (f >= F_NEWS && f < F_NEWS + 7) { const u = q((f - F_NEWS) / 7, 7); out.fx.push({ key: `ticks${u}`, cw: 200, ch: 200, draw: (p) => fxTicks(p, u), x: -1.1, y: 1.5, z: -0.35, w: 0.36, h: 0.36 }); }
  }
  // ---- the others round the table ----
  const folk: [string, Outfit, number, number, number, number, Expr, Expr, number][] = [
    ["man", MAN, 6, -0.42, -0.85, 1.0, "laugh", "stern", 1],
    ["rancher", RANCHER, 2, 0.3, -0.6, 1.12, "cheer", "shock", 2],
    ["auntie", AUNTIE, 8, -2.85, -0.45, 0.98, "smile_closed", "nervous", 3],
  ];
  for (const [key, o, seed, x, z, s, e0, e1, i] of folk) {
    const t = turnAt(f, i), listen = news && !t;
    const fo: FrontOpts = { mode: "stand", expr: t ? e1 : listen ? "neutral" : e0, facing: t ? 1 : -1, look: t ? 1 : listen ? -1 : 0, lookY: t ? 0 : 0.5,
      blink: lidAt(f, 40 + i, [F_NEWS + 2 + i, F_TURN + i * 3]), headTilt: t ? 0 : i === 2 ? 3 : -3 };
    if (shot === 2 && key !== "rancher") continue;
    out.places.push(person(cam, key, o, seed, x, 0, z, fo, s));
    blob(out, cam.sun, x, 0, z, s, 0.9);
  }
  // ---- the woman with her back to us: foreground frame in the wide, over-the-shoulder head in the pilot shot ----
  {
    let x = -0.42, z = 2.3; // (in the wide the same back-view card is a toddler at the bottom edge)
    if (shot === 2) { // cheated onto the lens axis after the cut: 1.9 m in front of the lens, left and low
      const fw = tmp.set(PILOT[0] - cam.pos.x, 0, PILOT[2] - cam.pos.z).normalize();
      x = cam.pos.x + fw.x * 1.75 - cam.right.x * 0.43; z = cam.pos.z + fw.z * 1.75 - cam.right.z * 0.43;
    }
    const fo: FrontOpts = { mode: "stand", back: true, facing: 0, headTilt: shot === 2 ? 4 : f >= F_TURN + 6 ? 5 : -3, tilt: 0 };
    out.places.push(person(cam, "womanBack", WOMAN, 3, x, shot === 2 ? -0.46 : 0, z, fo, shot === 2 ? 0.97 : 0.56, 0.8));
    if (shot === 1) blob(out, cam.sun, x, 0, z, 0.56, 0.9);
  }
  // ---- the pilot: happy guest with a plate; then he stops chewing ----
  {
    const frozen = f >= F_TURN + 9;
    let look = 0;
    if (shot === 2) { look = 0.2; F_DART.forEach((fd, i) => { if (f >= fd) look = [-1, 1, -1, 0][i]; }); }
    const fo: FrontOpts = { mode: "stand", expr: frozen ? "frozen" : "smile_closed", prop: "plate", bite: true, facing: shot === 2 ? 0 : -1, look, lookY: frozen ? 0.15 : 0,
      blink: frozen ? lidAt(f, 77, [F_TURN + 9, F_CUT + 30]) * (f > F_CUT && f < F_CUT + 28 ? 0 : 1) : 0, headTilt: frozen ? 0 : 4 };
    out.places.push(person(cam, "pilot", PILOT_O, 4, PILOT[0], 0, PILOT[2], fo, PILOT_S, 1.15));
    blob(out, cam.sun, PILOT[0], 0, PILOT[2], PILOT_S, 0.9);
  }
  // ---- sound marks from the speaker (they stop when the room goes quiet) ----
  if (f < F_TURN + 14) {
    const u = q((f / 15) % 1, 15);
    out.fx.push({ key: `waves${u}`, cw: 300, ch: 300, draw: (p) => fxWaves(p, u), x: RADIO[0] - 0.02, y: TABLE.y + 0.5, z: RADIO[2] + 0.14, w: 0.34, h: 0.34, rot: Math.PI / 2 - 0.25, tint: 1.25 });
  }
  return out;
};
