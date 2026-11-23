// Who is in the shot and what they do on frame f: the dazed pilot in the cockpit, four islanders waving from behind
// the ranch wall, sheep in the far field, the engine smoke, the stars round the pilot's head, settling dust.
// Drawing = kit toon.ts (extended with the costumes); cards, pool, blinks, ground shadows = cards.ts (kit cast.ts).
import {
  Pen, bodyFront, bodySide, fxStars, fxSmoke, fxDust, sheep, Outfit, Expr, FrontOpts, SideOpts, INK,
} from "./toon";
import { Stage, CamInfo, Place, tier, light2D, lidAt, blob, fkey, q, hh } from "./cards";
import { PILOT, PILOT_S, EYE, COWL, F_SNAP, F_LOOK2, F_HES, F_WAVE, F_WAVE_UP, smooth, clamp01 } from "./story";
import * as THREE from "three";

// ---------------- wardrobe ----------------
export const PILOT_O: Outfit = { jacket: "#a8905c", pants: "#6b5a3c", boots: INK, hat: "pilot", goggles: true, scarf: "#fbf9f3", collar: "#6e4a2e",
  belt: "#d5c9a2", plain: true, skin: "#fff7ee" };
const RANCHER: Outfit = { jacket: "#eef0f4", check: "#2f4f93", sleeve: "#2f4f93", pants: "#75604a", boots: "#4a3426", hat: "straw", hatband: "#a8402f",
  moustache: "#3a2a22", skin: "#fbe8d4", buttons: "#f6f6f2" };
const WOMAN: Outfit = { jacket: "#2f9a8f", dress: "#2f9a8f", print: "#f7e3b4", pants: "#3b3f52", boots: "#fdeedd", hat: "longhair", hair: "#3a2620",
  flower: "#e8463f", lei: ["#fff6e6", "#f7c948", "#f48fb1", "#fff6e6", "#ff9e57"], skin: "#fdeedd" };
const MAN: Outfit = { jacket: "#6f94ba", suspenders: "#6b4a30", pants: "#5d5348", boots: "#4a3426", hat: "hair", hair: "#2f211c", skin: "#f8e2cc", buttons: "#e8eef4" };
const KID: Outfit = { jacket: "#f6f2e8", stripes: "#d0503f", pants: "#4d6d9a", boots: "#fdebd8", hat: "hair", hair: "#2f211c", build: "kid", skin: "#fdebd8", plain: true };

const tmp = new THREE.Vector3();
type View = { fo?: FrontOpts; so?: SideOpts; mirror?: boolean };
/** one character card in the 600 x 1000 design space, canvas sized by distance, painted light from the scene sun */
const person = (cam: CamInfo, okey: string, o: Outfit, seed: number, x: number, y: number, z: number, v: View, scale = 1): Place => {
  const d = cam.pos.distanceTo(tmp.set(x, y + 1.2, z)) / scale, [w, h, k] = tier(d);
  const mirror = !!v.mirror, light = light2D(cam, mirror);
  const fo = v.fo ? { ...v.fo, light, seed } : null, so = v.so ? { ...v.so, light, seed } : null;
  return {
    key: so ? `S|${okey}|${fkey(so)}` : `F|${okey}|${fkey(fo!)}`, x, y, z, scale, mirror,
    draw: (p: Pen) => (so ? bodySide(p, o, so) : bodyFront(p, o, fo!)), size: [w, h, k],
  };
};

// ---------------- the pilot ----------------
const pilot = (f: number, cam: CamInfo, out: Stage) => {
  let expr: Expr = "dazed", look = 0, lookY = 0, facing: -1 | 0 | 1 = 0, headTilt = 0, tilt = 0;
  let wave: number | undefined, raise = 0;
  if (f < F_SNAP) { // dazed: the head lolls in a slow figure of eight
    headTilt = 7 * Math.sin(f * 0.19) + 2 * Math.sin(f * 0.47); tilt = 2.2 * Math.sin(f * 0.19 - 0.8);
  } else {
    const n = f - F_SNAP;
    headTilt = n < 9 ? 6 * Math.sin(n * 1.4) * (1 - n / 9) : 1.5 * Math.sin(f * 0.07); // a quick shake, then nearly still
    tilt = 0.8 * Math.sin(f * 0.05);
    expr = f < F_HES ? "confused" : "hesitant";
    if (f < F_LOOK2) { look = -1; lookY = 0.9; facing = -1; }        // down at the rancher and the kid
    else if (f < F_HES) { look = 1; lookY = 0.9; facing = 0; }       // across to the others
    else { look = 0.3; lookY = 0.7; facing = 0; }
    if (f >= F_WAVE) { // one small, unsure wave: the hand comes up slowly, wags twice, stays half up
      raise = smooth((f - F_WAVE) / (F_WAVE_UP - F_WAVE)) * 0.86;
      const m = f - F_WAVE_UP;
      wave = m > 0 && m < 22 ? 0.42 * Math.sin((m / 22) * Math.PI * 4) * (1 - m / 30) : 0;
    }
  }
  const blink = lidAt(f, 7, [F_SNAP, F_LOOK2, F_HES]);
  const fo: FrontOpts = { mode: "sit", expr, look, lookY, facing, blink: expr === "dazed" ? 0 : blink, headTilt: q(headTilt, 4), tilt: q(tilt, 4),
    wave: wave === undefined ? undefined : q(wave, 20), raise: q(raise, 30), flutter: q((f / 20) % 1, 20), scarfDir: -1 };
  out.places.push(person(cam, "pilot", PILOT_O, 4, PILOT[0], PILOT[1], PILOT[2], { fo }, PILOT_S));
  if (f < F_SNAP + 3) { // stars circling the cap
    const u = q((f / 34) % 1, 34), pop = Math.min(1, (F_SNAP + 3 - f) / 5);
    out.fx.push({ key: `stars${u}`, cw: 420, ch: 210, draw: (p) => fxStars(p, u), x: EYE[0] + 0.02, y: EYE[1] + 0.52 + 0.02 * Math.sin(f * 0.3), z: EYE[2] + 0.06, w: 0.98 * pop, h: 0.49 * pop });
  }
};

// ---------------- islanders ----------------
type Isl = { key: string; o: Outfit; seed: number; x: number; z: number; s: number };
export const ISLANDERS: Isl[] = [
  { key: "rancher", o: RANCHER, seed: 2, x: -1.9, z: 9.55, s: 1.14 },
  { key: "kid", o: KID, seed: 5, x: -0.95, z: 10.0, s: 0.74 },
  { key: "man", o: MAN, seed: 6, x: -0.02, z: 9.5, s: 1.0 },
  { key: "woman", o: WOMAN, seed: 3, x: 0.74, z: 9.85, s: 0.95 },
];
const islanders = (f: number, cam: CamInfo, out: Stage) => {
  ISLANDERS.forEach((c, i) => {
    const sway = q(1.4 * Math.sin(f * 0.09 + i * 1.7), 4), nod = q(2.2 * Math.sin(f * 0.13 + i * 2.3), 4), blink = lidAt(f, 20 + i);
    let y = 0, fo: FrontOpts, k = 1;
    if (c.key === "rancher") { // big slow wave with the inner arm, looking up at the pilot
      fo = { mode: "stand", expr: "cheer", facing: 1, look: 1, lookY: -0.6, wave: q(Math.sin(f * 0.34), 16), tilt: sway, headTilt: nod, blink };
    } else if (c.key === "kid") { // jumping on the spot, both arms flapping
      const ph = (f % 20) / 20; y = 0.34 * Math.max(0, Math.sin(ph * Math.PI * 1.25)) ; k = y > 0.03 ? 0.55 : 1;
      fo = { mode: "stand", expr: "laugh", facing: 0, wave: q(Math.sin(f * 0.7), 12), waveL: q(Math.sin(f * 0.7 + 2.2), 12), tilt: q(3 * Math.sin(f * 0.31), 4), headTilt: nod };
    } else if (c.key === "man") { // quick friendly wave
      fo = { mode: "stand", expr: "wow", facing: 0, look: 0.2, lookY: -0.8, wave: q(Math.sin(f * 0.5 + 1), 16), tilt: sway, headTilt: nod, blink };
    } else { // the woman: gentle wave with the outer arm, the other hand at her side
      fo = { mode: "stand", expr: "cheer", facing: -1, look: -0.6, lookY: -0.6, wave: q(Math.sin(f * 0.4 + 2.4), 16), tilt: sway, headTilt: nod, blink };
    }
    out.places.push(person(cam, c.key, c.o, c.seed, c.x, y, c.z, { fo }, c.s));
    blob(out, cam.sun, c.x, 0, c.z, c.s, k);
  });
};

// ---------------- sheep, smoke, dust ----------------
const SHEEP: [number, number, number, boolean][] = [[-9.5, -19, 1.0, false], [-12.2, -23.5, 0.9, true], [7.2, -27, 1.0, true], [-4.4, -31, 0.85, false], [13, -36, 0.95, false]];
const flock = (f: number, cam: CamInfo, out: Stage) =>
  SHEEP.forEach(([x, z, s, flip], i) => {
    const h = q(smooth(0.5 + 0.9 * Math.sin(f * 0.035 + i * 2.1)), 6);
    out.fx.push({ key: `sheep${h}`, cw: 400, ch: 300, draw: (p) => sheep(p, h), x, y: 0.56 * s, z, w: (flip ? -1.5 : 1.5) * s, h: 1.12 * s, tint: 0.93 });
    blob(out, cam.sun, x, 0, z, 0.9 * s, 0.8);
  });

const smoke = (f: number, out: Stage) => {
  // a thin oily column: small dark inked puffs at the cowl that grow, pale and thin out as they climb and lean down-wind
  const N = 14, T = 140; // puffs, frames a puff lives
  for (let k = 0; k < N; k++) {
    const u0 = (((f + 400) / T + k / N) % 1), u = u0 ** 1.35, grow = smooth(u0 / 0.06); // bunched at the source
    const size = (0.42 + 1.75 * u ** 0.8) * grow * (0.85 + 0.3 * hh(k, 3));
    const wob = 0.25 * Math.sin(u * 8 + k * 2.4) * (0.3 + u);
    const tone = q(Math.min(1, u * 1.5), 5), v = k % 4, solid = u < 0.42;
    out.fx.push({ key: `smoke${v}|${tone}`, cw: 400, ch: 400, draw: (p) => fxSmoke(p, v, tone), soft: !solid, alpha: solid ? 1 : Math.max(0, 1 - (u - 0.42) / 0.5) ** 1.3,
      x: COWL[0] - 0.38 - 1.9 * u ** 0.9 + wob, y: COWL[1] - 0.1 + 7.8 * u ** 0.85, z: COWL[2] - 0.35 - 2.8 * u, w: size, h: size, rot: k * 1.3 + u * (k % 2 ? 0.9 : -0.9) });
  }
};
const dust = (f: number, out: Stage) => {
  for (const [x, z, k] of [[2.7, 2.2, 0], [-2.4, -0.2, 1], [-5.5, -2.6, 2]] as const) {
    const u = clamp01((f + 46 + k * 9) / 150);
    if (u >= 1) continue;
    out.fx.push({ key: `dust${q(u, 30)}`, cw: 300, ch: 300, draw: (p) => fxDust(p, q(u, 30)), x, y: 0.5 + 0.5 * u, z, w: 2.6 + 1.2 * u, h: 2.6 + 1.2 * u, soft: true });
  }
};

/** everything with a face (or drawn flat) at frame f */
export const stage = (f: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  pilot(f, cam, out);
  islanders(f, cam, out);
  flock(f, cam, out);
  smoke(f, out);
  dust(f, out);
  return out;
};
void hh;
