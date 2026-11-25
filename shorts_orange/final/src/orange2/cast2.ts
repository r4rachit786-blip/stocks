// Orange v2 cast: flat bean-head cards (Niihau kit), take by take. Everything on ones: idle bob/sway from the real
// frame on every card (transform only, no redraw), blinks every 0.5-2.3 s plus a blink across every expression swap,
// expressions change on word onsets (0-1 f lead), gestures ease in over ~5 f and hold. Positions are set-local.
import * as THREE from "three";
import { Pen, bodyFront, fxStars, fxBurst, Outfit, Expr, FrontOpts, INK } from "../film/toon";
import { Stage, CamInfo, Place, tier, light2D, lidAt, blob, fkey, q } from "../film/cards";
import { takeAt, w, L, TOTAL, HOOK_PATH, CARAVAN_X, TRADER_PATH, SAILOR_PATH, CROWD_RUSH, DECK_Y, FORE_Y, smooth, ramp, V3 } from "./story";
import { bubbleDraw, glowDraw, letterDraw, signAdv } from "../orange/sets";

const SK = "#fbf1ea", SK2 = "#f6e6dc";
export const MERCHANT: Outfit = { jacket: "#f0862a", pants: "#f6efe2", boots: "#7a4a2a", hat: "turban", cap: "#f6c232", hatband: "#c8302a", skin: SK, moustache: "#2f211c", sash: "#2f7fc4", buttons: "#f6efe2" };
const SCHOLAR: Outfit = { jacket: "#f6f1e6", pants: "#f6f1e6", boots: "#8a5a34", hat: "hair", hair: "#e8e4dc", moustache: "#e8e4dc", skin: SK, sash: "#e0731e", plain: true, build: "stout" };
const PTRADER: Outfit = { jacket: "#7a3b8a", pants: "#3b3f52", boots: "#5a3a24", hat: "turban", cap: "#2f5ea8", hatband: "#f2c230", skin: SK, moustache: "#2a201a", sash: "#f2c230" };
const DYER: Outfit = { jacket: "#2f9aa8", pants: "#4a4a52", boots: "#5a3a24", hat: "turban", cap: "#f2e6cc", hatband: "#2f9aa8", skin: SK2, moustache: "#3a2a22", sleeve: "#2f9aa8" };
const ARAB: Outfit = { jacket: "#f6f2ea", dress: "#f6f2ea", pants: "#3b3f52", boots: "#7a5a3a", hat: "headcloth", cap: "#f6f2ea", hatband: "#2a2330", skin: SK, moustache: "#2f211c", sash: "#c8302a" };
const SAILOR: Outfit = { jacket: "#f6f2e8", stripes: "#2f5ea8", pants: "#4d6d9a", boots: "#4a3426", hat: "cap", cap: "#c2352c", skin: SK };
const DOCKER: Outfit = { jacket: "#c9a46a", pants: "#5d5348", boots: "#4a3426", hat: "hair", hair: "#2f211c", skin: SK2, moustache: "#2f211c" };
const CAPTAIN: Outfit = { jacket: "#2a3a6a", pants: "#3a2a24", boots: "#2a2226", hat: "cap", cap: "#2a2a30", skin: SK, moustache: "#4a3020", buttons: "#e8c45a", sash: "#c8302a", build: "stout" };
const EUW: Outfit = { jacket: "#c84a3c", dress: "#c84a3c", print: "#fbe6a8", pants: "#3b3f52", boots: "#5a3a24", hat: "bonnet", hair: "#5a3b2a", skin: SK };
const EUM: Outfit = { jacket: "#3f6aa8", pants: "#5d5348", boots: "#3a2a22", hat: "hair", hair: "#6a4a2a", skin: SK, buttons: "#e8eef4", moustache: "#6a4a2a" };
const KID: Outfit = { jacket: "#f6f2e8", stripes: "#2f8a5a", pants: "#4d6d9a", boots: "#fdebd8", hat: "hair", hair: "#5a3b2a", build: "kid", skin: SK, plain: true };
const CHSELL: Outfit = { jacket: "#2f6a8a", pants: "#2f3a52", boots: "#2a2a30", hat: "conical", cap: "#e3c27a", skin: SK, buttons: "#e8c45a" };
const FARMER: Outfit = { jacket: "#6a8a3a", pants: "#5d5348", boots: "#5a3a24", hat: "straw", skin: SK2, moustache: "#4a3020" };
const DUTCHW: Outfit = { jacket: "#3f6aa8", dress: "#3f6aa8", print: "#f6f2ea", pants: "#3b3f52", boots: "#7a5a3a", hat: "bonnet", hair: "#c9a24a", skin: SK };
const DUTCHM: Outfit = { jacket: "#2a2a34", pants: "#2a2a34", boots: "#2a2a30", hat: "hair", hair: "#c9a24a", skin: SK, buttons: "#d9b24a" };
const GOAKID: Outfit = { jacket: "#f6f2e8", stripes: "#e0731e", pants: "#3f6aa8", boots: "#fdebd8", hat: "hair", hair: "#2a1f1c", build: "kid", skin: SK, plain: true };
const BUYER: Outfit = { jacket: "#c2357a", dress: "#c2357a", print: "#f2c230", pants: "#3b3f52", boots: "#5a3a24", hat: "longhair", hair: "#2a1f1c", skin: SK };
const CROWD: Outfit[] = [EUM, EUW, { ...EUM, jacket: "#6a8a3a", hair: "#2f211c" }, { ...EUW, jacket: "#7a5aa8", dress: "#7a5aa8" }, { ...EUM, jacket: "#a8683a", hair: "#c9a24a" }, { ...EUW, jacket: "#2f9aa8", dress: "#2f9aa8", hair: "#c9a24a" }, KID];

type Ctx = { cam: CamInfo; out: Stage; f: number; rf: number; o: V3; staff: StaffReq[] };
export type StaffReq = { x: number; y: number; z: number; key: string; chain?: boolean; flip?: boolean };
type Extra = { s?: number; mirror?: boolean; noBlob?: boolean; y?: number; still?: boolean };
/** a character card with idle life: a breathing bob and a slow sway (transform only), seeded so nobody moves in step */
const P = (c: Ctx, okey: string, o: Outfit, seed: number, x: number, z: number, fo0: FrontOpts, e: Extra = {}) => {
  const X = x + c.o[0], Z = z + c.o[2], sc = e.s ?? 1, y0 = e.y ?? 0, d = c.cam.pos.distanceTo(new THREE.Vector3(X, y0 + 1.2, Z)) / sc, [cw, ch, k] = tier(d);
  const still = e.still || fo0.mode === "stroll";
  const bob = still ? 0 : 0.012 * sc * Math.sin(c.rf * 0.19 + seed * 1.7), roll = still ? 0 : 0.022 * Math.sin(c.rf * 0.11 + seed);
  const fo = { ...fo0, light: light2D(c.cam, !!e.mirror), seed };
  const pl: Place = { key: `F|${okey}|${fkey(fo)}`, x: X, y: y0 + bob, z: Z, scale: sc, mirror: e.mirror, roll, size: [cw, ch, k], draw: (p: Pen) => bodyFront(p, o, fo) };
  c.out.places.push(pl);
  if (!e.noBlob) blob(c.out, c.cam.sun, X, y0, Z, sc, 0.9);
};
const card = (c: Ctx, key: string, cw: number, ch: number, draw: (p: Pen) => void, x: number, y: number, z: number, wd: number, o: { flat?: boolean; rot?: number; tint?: number; soft?: boolean; alpha?: number } = {}) =>
  c.out.fx.push({ key, cw, ch, draw, x: x + c.o[0], y: y + c.o[1], z: z + c.o[2], w: wd, h: (Math.abs(wd) * ch) / cw, tint: 1, ...o });
const stand = (expr: Expr, o: Partial<FrontOpts> = {}): FrontOpts => ({ mode: "stand", expr, ...o });
const walk = (expr: Expr, phase: number, o: Partial<FrontOpts> = {}): FrontOpts => ({ mode: "stroll", expr, phase, ...o });
/** expression track: [frame, expr] pairs (word onsets); returns the expr and the swap frames for lidAt */
const track = (f: number, t: [number, Expr][]): [Expr, number[]] => { let e = t[0][1]; for (const [a, x] of t) if (f >= a - 1) e = x; return [e, t.slice(1).map(([a]) => a - 1)]; };
const ease = (f: number, a: number, n = 5) => smooth((f - a) / n);
const sparkle = (c: Ctx, x: number, y: number, z: number, f0: number, s = 0.5) => { if (c.f >= f0 && c.f < f0 + 12) { const u = q((c.f - f0) / 12, 12); card(c, `spark${u}`, 500, 500, (p) => fxBurst(p, u, "#fff3b0", 9, 20, 160), x, y, z, s, { tint: 1.6 }); } };
const glow = (c: Ctx, x: number, y: number, z: number, s: number) => card(c, "glow", 256, 256, glowDraw, x, y, z, s * (1 + 0.06 * Math.sin(c.rf * 0.3)), { soft: true, alpha: 0.8, tint: 1.4 });
/** right-hand prop position (orange etc.) relative to the card origin: forearm-up pose (toon), in metres */
const HAND_R = { dx: 0.37, dy: 1.25 }, HAND_L = { dx: -0.242, dy: 0.714 };
/** world point beside a card along the camera's right axis */
const side = (c: Ctx, x: number, z: number, dxm: number, mirror = false) => { const r = c.cam.right, k = mirror ? -dxm : dxm; return [x + r.x * k, z + r.z * k] as [number, number]; };
const staffAt = (c: Ctx, x: number, y: number, z: number, key: string, o: { chain?: boolean; flip?: boolean; mirror?: boolean } = {}) => {
  const [sx, sz] = side(c, x + c.o[0], z + c.o[2], HAND_L.dx, o.mirror); const away = c.cam.pos.clone().sub(new THREE.Vector3(sx, 0, sz)).setY(0).normalize();
  c.staff.push({ x: sx - away.x * 0.06, y: y + HAND_L.dy, z: sz - away.z * 0.06, key, chain: o.chain, flip: !!o.mirror !== !!o.flip });
};

// ---------------- takes ----------------
const hook = (c: Ctx) => { // T01 the merchant strides toward us through the bazaar with the glowing orange and his sign
  const f = c.f, h = HOOK_PATH(f), [ex, sw] = track(f, [[0, "grin"], [w("0.india"), "laugh"], [w("0.india") + 12, "grin"]]);
  P(c, "merch", MERCHANT, 4, h[0], h[2], walk(ex, (c.rf / 17) % 1, { prop: "bigorange", staffL: true, blink: lidAt(f, 7, sw), look: 0 }));
  const [gx, gz] = side(c, h[0] + c.o[0], h[2] + c.o[2], HAND_R.dx); card(c, "glow", 256, 256, glowDraw, gx - c.o[0], 1.24, gz - c.o[2], 0.9 * (1 + 0.06 * Math.sin(c.rf * 0.3)), { soft: true, alpha: 0.7, tint: 1.4 });
  staffAt(c, h[0], 0, h[2], "NARANGA");
  // a bazaar behind him: shoppers, a seller, a kid
  P(c, "sellerA", { ...DYER, jacket: "#3f9a5a", hat: "turban", cap: "#f6efe2" }, 41, -2.7, -4.6, stand(f > 20 ? "smile" : "neutral", { facing: 1, look: 1, blink: lidAt(f, 41) }), { mirror: false });
  P(c, "buyerA", BUYER, 42, 2.4, -7.0, stand("smile", { facing: -1, look: -1, prop: "basket", blink: lidAt(f, 42) }), { mirror: true });
  P(c, "kidA", GOAKID, 43, 1.6, -3.8, stand("grin", { facing: -1, look: -1, wave: q(Math.sin(c.rf * 0.5), 10), blink: lidAt(f, 43) }), { mirror: true, s: 0.8 });
  P(c, "buyerB", { ...EUM, jacket: "#e0731e", hat: "turban", cap: "#f6efe2" }, 44, -2.0, -10.5, stand("neutral", { facing: 1, look: 1 }), {});
};
const dunes = (c: Ctx) => { // T02 the merchant rides in the caravan, waving on "whole"
  const f = c.f, x = CARAVAN_X(f), wav = f >= w("0.whole") - 6;
  P(c, "rider", MERCHANT, 4, x - 0.05, 0.5, { mode: "sit", expr: wav ? "laugh" : "grin", wave: wav ? q(Math.sin(c.rf * 0.55), 10) : undefined, raise: ease(f, w("0.whole") - 6), prop: wav ? null : "bigorange", blink: lidAt(f, 7) }, { y: 2.4, noBlob: true });
  staffAt(c, x + 0.55, 1.65, 0.45, "NARANGA", { flip: true });
  P(c, "riderB", PTRADER, 21, x - 3.2, 0.5, { mode: "sit", expr: "smile", blink: lidAt(f, 21) }, { y: 2.4, noBlob: true });
  P(c, "walker", DOCKER, 22, x + 2.0, 0.9, walk("smile", (c.rf / 17 + 0.3) % 1, { facing: 1, look: 1 }), {});
};
const deck = (c: Ctx) => { // T03 on deck: the sign on the mast flips through the names; his eyes follow it
  const f = c.f, nn = w("0.new"), [ex, sw] = track(f, [[82, "grin"], [nn - 2, "wow"], [w("0.it"), "confused"], [w("0.went") + 4, "grin"]]);
  P(c, "merchD", MERCHANT, 4, 0.45, 0.9, stand(ex, { prop: "bigorange", look: f >= nn - 4 && f < w("0.went") + 4 ? -1 : 0, lookY: f >= nn - 4 && f < w("0.went") + 4 ? -1 : 0, headTilt: f >= w("0.it") && f < w("0.went") + 4 ? -6 : 0, blink: lidAt(f, 7, sw) }), { y: DECK_Y });
  const [gx, gz] = side(c, 0.45 + c.o[0], 0.9 + c.o[2], HAND_R.dx); card(c, "glow", 256, 256, glowDraw, gx - c.o[0], DECK_Y + 1.24, gz - c.o[2], 0.9, { soft: true, alpha: 0.7, tint: 1.4 });
  P(c, "sailorD", SAILOR, 51, 3.4, -0.4, stand(f >= nn ? "laugh" : "smile", { facing: -1, look: -1, lookY: f >= nn ? -0.6 : 0, blink: lidAt(f, 51) }), { y: DECK_Y, mirror: true });
  P(c, "sailorE", { ...SAILOR, cap: "#2f5ea8", stripes: "#c8302a" }, 52, -2.6, -0.9, stand("smile", { facing: 1, look: 1, prop: "chalk" }), { y: DECK_Y });
  for (const k of [110, 118, 126, 134, 140, 148]) if (f >= k && f < k + 6) { const u = q((f - k) / 6, 6); card(c, `flip${u}`, 500, 500, (p) => fxBurst(p, u, "#fff3b0", 8, 30, 200), -0.36, 3.2, 0.12, 1.9, { tint: 1.5 }); }
};
const scholar = (c: Ctx) => { // T04 the scholar writes the name on a palm leaf; the sign gets it
  const f = c.f, X = 22, nar = w("1.naranga"), [ex, sw] = track(f, [[L[1], "neutral"], [w("1.sanskrit"), "smile_closed"], [nar - 2, "grin"]]);
  P(c, "scholar", SCHOLAR, 10, X - 0.55, -1.25, { mode: "sit", expr: ex, facing: 1, look: f >= nar - 2 ? 0 : 1, lookY: f < nar - 2 ? 0.6 : 0, prop: f >= w("1.it") ? "scroll" : "brush", blink: lidAt(f, 11, sw) }, { y: 0.52, noBlob: true });
  const [m2, sw2] = track(f, [[L[1], "smile"], [nar, "wow"], [nar + 14, "grin"]]);
  P(c, "merchS", MERCHANT, 4, X + 0.6, 1.0, stand(m2, { facing: -1, look: -1, lookY: f < nar ? 0.4 : 0, prop: "bigorange", blink: lidAt(f, 7, sw2) }), { mirror: true });
  sparkle(c, X - 0.55, 2.45, -1.15, nar, 2.0);
  P(c, "pupil", KID, 12, X - 2.3, -1.9, { mode: "sit", expr: f >= nar ? "grin" : "smile", facing: 1, look: 1, blink: lidAt(f, 12) }, { y: 0.42, s: 0.8, noBlob: true });
};
const serai = (c: Ctx) => { // T05+T06 the Persian trader leads his camel in and wipes the A; the dyer lifts the new colour
  const f = c.f, t = TRADER_PATH(f), arrived = f >= L[2] + 36, wipe = f >= w("2.narang") - 8 && f < w("2.narang") + 8;
  const [ex, sw] = track(f, [[L[2], "smile"], [w("2.narang") - 8, "hesitant"], [w("2.narang") + 4, "grin"], [w("2.named"), "smile"], [w("2.too"), "laugh"]]);
  P(c, "trader", PTRADER, 21, t[0], t[2], arrived ? stand(ex, { facing: 1, look: 1, wave: wipe ? q(Math.sin(c.rf * 1.3), 10) : f >= w("2.too") - 2 ? 0.2 : undefined, raise: wipe ? 1 : f >= w("2.too") - 2 ? ease(f, w("2.too") - 2) : 0, blink: lidAt(f, 21, sw) }) : walk(ex, (c.rf / 17) % 1, { facing: 1, look: 1, blink: lidAt(f, 21, sw) }));
  const col = f >= w("2.color") - 2, [dx, dsw] = track(f, [[L[2], "neutral"], [w("2.color") - 2, "wow"], [w("2.color") + 12, "grin"]]);
  P(c, "dyer", DYER, 23, 4.3, -0.5, stand(dx, { facing: -1, look: -1, prop: col ? "cloth" : "brush", blink: lidAt(f, 23, dsw) }), { mirror: true });
  sparkle(c, 4.0, 1.6, -0.2, w("2.color"), 0.9);
  P(c, "boy", KID, 24, 1.8, 0.4, stand(f >= w("2.color") ? "wow" : "smile", { facing: 1, look: 1, blink: lidAt(f, 24) }), { s: 0.8 });
  P(c, "trader2", { ...PTRADER, jacket: "#2f6a8a", cap: "#c8302a" }, 25, -9.2, -3.0, stand("smile", { facing: 1, look: 1 }), {});
};
const souk = (c: Ctx) => { // T07 the G that won't come out; he twists it into a J
  const f = c.f, g0 = w("3.g") - 3, bec = w("3.became"), nj = w("3.naranj");
  const [ex, sw] = track(f, [[L[3], "smile"], [g0, "pained"], [bec, "confused"], [nj - 4, "grin"], [nj + 10, "laugh"]]);
  const pull = f >= g0 + 6 && f < bec;
  P(c, "arab", ARAB, 31, 0.45, -0.2, stand(ex, { facing: -1, look: -1, wave: pull ? -0.4 + 0.4 * Math.sin(c.rf * 0.9) : f >= bec - 2 && f < nj + 4 ? 0.6 : undefined, raise: pull ? 0.5 : f >= bec - 2 ? 0.95 : 0, blink: lidAt(f, 31, sw) }), { mirror: true });
  if (f >= g0 && f < bec + 2) { const u = clampN((f - g0) / 6), wob = pull ? 0.05 * Math.sin(c.rf * 1.1) : 0; card(c, "gG", 256, 256, (p) => bigLetter(p, "G"), 0.37 + wob, 1.27 + 0.02 * u, 0.0, 0.32 * u, { tint: 1.0 }); }
  if (f >= bec + 2 && f < nj) { const u = (f - bec - 2) / (nj - bec - 2), x = 0.9 + (-0.15 - 0.9) * smooth(u), y = 2.0 + 0.9 * Math.sin(Math.PI * u) + (2.66 - 2.0) * smooth(u); card(c, u < 0.5 ? "gG2" : "gJ", 256, 256, (p) => bigLetter(p, u < 0.5 ? "G" : "J"), x, y, -1.0, 0.36, { rot: 6.283 * smooth(u) }); }
  if (f >= nj && f < nj + 10) { const u = q((f - nj) / 10, 10); card(c, `pop${u}`, 500, 500, (p) => fxBurst(p, u, "#fff3b0", 10, 30, 210), -0.5, 2.75, -1.45, 2.2, { tint: 1.6 }); }
  P(c, "custA", { ...EUW, hat: "headcloth", cap: "#2f5ea8", dress: "#2f5ea8", jacket: "#2f5ea8" }, 33, -1.9, 0.3, stand(f >= nj ? "laugh" : f >= g0 ? "nervous" : "smile", { facing: 1, look: 1, prop: "basket", blink: lidAt(f, 33) }));
  P(c, "custB", KID, 34, -1.0, 0.9, stand(f >= nj ? "grin" : f >= g0 ? "shock" : "smile", { facing: 1, look: 1, blink: lidAt(f, 34) }), { s: 0.8 });
};
const clampN = (x: number) => Math.max(0, Math.min(1, x));
const bigLetter = (p: Pen, ch: string) => { const g = p.g; g.font = "900 200px 'DejaVu Serif', serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.lineWidth = 18; g.strokeStyle = INK; g.strokeText(ch, 128, 132); g.fillStyle = "#e0731e"; g.fillText(ch, 128, 132); };
const lisbon = (c: Ctx) => { // T08 sailor and docker unload; the sailor chalks the N into an L
  const f = c.f, la = w("3.laranja"), [ex, sw] = track(f, [[w("3.then"), "smile"], [la - 8, "smile_closed"], [la + 2, "grin"]]);
  const chalk = f >= la - 10 && f < la + 2;
  P(c, "sailor", SAILOR, 41, 0.5, -1.1, stand(ex, { facing: -1, look: -1, prop: "chalk", tilt: chalk ? -6 * ease(f, la - 10) : 0, blink: lidAt(f, 41, sw) }), { mirror: true });
  const dk = Math.min(1, Math.max(0, (f - w("3.then")) / 40));
  P(c, "docker", DOCKER, 42, -1.4 + 0.3 * dk, -0.2, f < w("3.then") + 40 ? walk("smile", (c.rf / 17) % 1, { facing: 1, look: 1, prop: "basket" }) : stand(f >= la ? "laugh" : "smile", { facing: 1, look: 1, prop: "basket", blink: lidAt(f, 42) }));
  sparkle(c, -0.3, 1.95, -2.3, la, 2.0);
  P(c, "sailorB", { ...SAILOR, cap: "#2f5ea8" }, 43, 3.5, -3.0, stand("smile", { facing: -1, look: -1 }), { mirror: true });
  P(c, "fishw", { ...EUW, dress: "#2f6a8a", jacket: "#2f6a8a" }, 44, -4.6, -1.0, stand("smile", { facing: 1, look: 1, prop: "basket" }), {});
};
const europe = (c: Ctx) => { // T09 "a narange" / "an orange?": the N falls off and hops onto the A
  const f = c.f, an = w("4.a"), on = w("4.an"), nN = w("4.n"), fell = w("4.fell");
  const [ew, sw] = track(f, [[L[4], "smile"], [an, "grin"], [w("4.slowly"), "smile_closed"], [nN, "shock"], [fell + 8, "laugh"]]);
  P(c, "euw", EUW, 51, -0.68, -0.35, stand(ew, { facing: 1, look: 1, lookY: f >= nN - 4 ? -1 : 0, wave: f >= an - 4 && f < an + 16 ? 0.5 : undefined, raise: ease(f, an - 4), blink: lidAt(f, 51, sw) }));
  const [em, sm] = track(f, [[L[4], "neutral"], [w("4.turned"), "confused"], [on, "hesitant"], [nN, "wow"], [fell + 8, "laugh"]]);
  P(c, "eum", EUM, 52, 0.72, -0.15, stand(em, { facing: -1, look: -1, lookY: f >= nN - 4 ? -1 : 0, wave: f >= w("4.turned") && f < on + 18 ? -0.9 : undefined, raise: ease(f, w("4.turned")) * 0.85, blink: lidAt(f, 52, sm) }), { mirror: true });
  P(c, "kidE", KID, 53, 0.1, 0.55, stand(f >= fell + 6 ? "laugh" : f >= nN ? "wow" : "grin", { facing: 1, look: 1, lookY: f >= nN - 4 ? -1 : 0, wave: f >= fell + 6 ? q(Math.sin(c.rf * 0.6), 12) : undefined }), { s: 0.78 });
  if (f >= an - 1 && f < an + 22) card(c, "bubA", 1000, 340, bubbleDraw("a narange!", 1000), -0.5, 2.1, 0.1, 0.9, { tint: 1.0 });
  if (f >= on - 1 && f < on + 26) card(c, "bubB", 1000, 340, bubbleDraw("an orange?", 1000), 0.48, 2.1, 0.15, 0.9, { tint: 1.0 });
  // the N: wobble on its nail (the), drop (fell), clink on the A board's end, hop into the empty slot after the A
  const n = 9, bw = 2.6, adv = signAdv(n), slot = (i: number) => (adv * (i - (n - 1) / 2) / 1400) * bw, by = 2.58, lw = (256 / 1400) * bw;
  if (f >= nN - 2 && f < fell + 16) {
    let x = slot(2), y = by, rot = 0;
    if (f < fell - 4) rot = 0.25 * Math.sin((f - nN) * 1.2) * Math.min(1, (f - nN + 2) / 6);
    else { const u = clampN((f - (fell - 4)) / 20); const drop = clampN(u / 0.45), hop = clampN((u - 0.45) / 0.55); y = by - 0.75 * drop * drop + (hop > 0 ? 0.75 * (1 - (1 - hop) ** 2) + 0.35 * Math.sin(Math.PI * hop) : 0); x = slot(2) + (slot(1) - slot(2)) * smooth(hop); rot = 2.2 * drop * (1 - hop) + 6.283 * smooth(hop); }
    card(c, "letterN", 256, 256, letterDraw("N", n), x, y, -1.48, lw, { rot, tint: 1.0 });
  }
  const land = fell + 4 + 9; if (f >= land && f < land + 8) { const u = q((f - land) / 8, 8); card(c, `clink${u}`, 500, 500, (p) => fxBurst(p, u, "#fff3b0", 8, 20, 150), slot(1), by, -1.7, 0.9, { tint: 1.5 }); }
  CROWD.slice(0, 4).forEach((o, i) => P(c, `bg${i}`, o, 60 + i, [-6.5, -4.2, 4.6, 7.4][i], [-5.0, -7.8, -6.2, -4.4][i], stand(f >= fell + 6 ? "laugh" : "smile", { facing: i < 2 ? 1 : -1, look: i < 2 ? 1 : -1, blink: lidAt(f, 60 + i) }), { mirror: i >= 2 }));
};
const sail = (c: Ctx) => { // T10 the captain on the forecastle points east with his spyglass
  const f = c.f, ch = w("5.china"), [ex, sw] = track(f, [[L[5], "smile"], [ch - 2, "grin"]]);
  P(c, "captain", CAPTAIN, 61, 6.6, 0.2, stand(ex, { facing: 1, look: 1, prop: f >= ch - 6 ? "spyglass" : null, wave: f < ch - 6 ? 0.5 : undefined, raise: f < ch - 6 ? 0.9 : 0, blink: lidAt(f, 61, sw) }), { y: FORE_Y, noBlob: true });
  P(c, "sailS1", SAILOR, 62, 2.6, 0.6, stand("smile", { facing: 1, look: 1 }), { y: DECK_Y, noBlob: true });
  P(c, "sailS2", { ...SAILOR, cap: "#2f5ea8" }, 63, -1.4, -0.5, stand("grin", { facing: 1, look: 1, wave: q(Math.sin(c.rf * 0.45), 10) }), { y: DECK_Y, noBlob: true });
};
const china = (c: Ctx) => { // T11 the sweeter orange: the sailor bites, his eyes light up; candy wrapper
  const f = c.f, sw0 = w("5.sweet"), eat = w("5.eat"), cand = w("5.candy");
  const [ex, sw] = track(f, [[w("5.and") + 12, "smile"], [w("5.sweeter"), "wow"], [sw0, "smile_closed"], [eat, "laugh"], [cand, "cheer"]]);
  P(c, "sailorC", SAILOR, 41, 0.65, -0.3, stand(ex, { facing: -1, look: -1, prop: f >= w("5.sweeter") ? "orange" : null, bite: f >= sw0 - 2 && f < eat, blink: f >= eat ? 0 : lidAt(f, 41, sw) }), { mirror: true });
  P(c, "seller", CHSELL, 71, -0.6, -0.55, stand(f >= eat ? "laugh" : "smile", { facing: 1, look: 1, prop: f < w("5.sweeter") ? "orange" : undefined, blink: lidAt(f, 71) }));
  if (f >= eat) { const u = q(((c.rf - eat) / 24) % 1, 24); card(c, `stars${u}`, 420, 210, (p) => fxStars(p, u), 0.65, 2.2, -0.1, 0.8, { tint: 1.2 }); }
  sparkle(c, 0.4, 1.5, 0.0, w("5.sweeter"), 0.6);
  if (f >= cand - 4) { const u = ease(f, cand - 4, 6); card(c, "candy", 600, 300, candyDraw, -0.1, 1.95, 0.1, 0.9 * u, { tint: 1.0 }); }
  P(c, "chkid", { ...KID, stripes: "#c8302a" }, 72, -2.4, -0.2, stand(f >= eat ? "laugh" : "smile", { facing: 1, look: 1, blink: lidAt(f, 72) }), { s: 0.8 });
  P(c, "porter", { ...CHSELL, jacket: "#8a5a34", cap: "#d6b26e" }, 73, 3.4, -2.6, stand("smile", { facing: -1, look: -1, prop: "basket" }), { mirror: true });
};
const candyDraw = (p: Pen) => { const g = p.g; for (const s of [-1, 1]) { g.fillStyle = "#f2c230"; g.strokeStyle = INK; g.lineWidth = 10; g.beginPath(); g.moveTo(300 + s * 90, 150); g.lineTo(300 + s * 250, 60); g.lineTo(300 + s * 220, 150); g.lineTo(300 + s * 250, 240); g.closePath(); g.fill(); g.stroke(); } g.fillStyle = "#f58a1f"; g.beginPath(); g.ellipse(300, 150, 110, 100, 0, 0, 7); g.fill(); g.stroke(); g.fillStyle = "rgba(255,240,190,0.85)"; g.beginPath(); g.ellipse(265, 115, 34, 22, -0.6, 0, 7); g.fill(); };
const sintra = (c: Ctx) => { // T12+T13 the farmer's grove, the town; then Europe rushes the cart
  const f = c.f, rush = CROWD_RUSH(f), [ex, sw] = track(f, [[L[6], "smile"], [w("6.sintra"), "grin"], [w("6.crazy") - 2, "shock"]]);
  P(c, "farmer", FARMER, 81, 0.7, -0.5, stand(ex, { facing: -1, look: -1, prop: "basket", blink: lidAt(f, 81, sw) }), { mirror: true });
  CROWD.forEach((o, i) => {
    const x0 = 11 + i * 1.5, x1 = 0.9 + (i % 4) * 0.75, z = -1.9 - (i % 3) * 0.6 - Math.floor(i / 4) * 0.4, x = x0 + (x1 - x0) * rush, ph = ((c.rf + i * 5) / 11) % 1;
    if (rush <= 0) return;
    P(c, `crowd${i}`, o, 82 + i, x, z, rush < 1 ? walk("cheer", ph, { facing: -1, look: -1 }) : stand(f >= w("6.crazy") ? "cheer" : "laugh", { facing: -1, look: -1, wave: q(Math.sin(c.rf * 0.5 + i), 12), raise: 1, blink: lidAt(f, 82 + i) }), { mirror: true, s: o === KID ? 0.78 : 1 });
  });
  if (f >= w("6.crazy")) for (let k = 0; k < 6; k++) { const t0 = w("6.crazy") + k * 4, u = (f - t0) / 22; if (u < 0 || u > 1) continue; card(c, "flyO", 128, 128, (p) => p.ell(64, 64, 52, 50, "#f58a1f", 8), 1.6 + k * 0.4, 1.0 + 2.6 * Math.sin(Math.PI * u), -2.8 + 2 * u, 0.16, { rot: u * 6 }); }
};
const dutch = (c: Ctx) => { // T14 SINAASAPPEL = China's apple
  const f = c.f, chs = w("7.chinas"), [ex, sw] = track(f, [[L[7], "smile"], [w("7.dutch"), "grin"], [chs - 2, "laugh"]]);
  P(c, "dutchw", DUTCHW, 91, -0.4, -0.3, stand(ex, { facing: 1, look: 1, prop: "orange", blink: lidAt(f, 91, sw) }));
  P(c, "dutchm", DUTCHM, 92, 1.4, -0.1, stand(f >= chs ? "wow" : "smile", { facing: -1, look: -1, lookY: f >= chs ? -1 : 0, blink: lidAt(f, 92) }), { mirror: true });
  P(c, "dkid", { ...KID, stripes: "#c8302a", hair: "#e8c45a" }, 93, -1.8, 0.5, stand("grin", { facing: 1, look: 1 }), { s: 0.78 });
  if (f >= chs - 2) { const u = ease(f, chs - 2, 6); card(c, "pagodaIcon", 400, 400, iconPagoda, -0.23, 3.5, -1.85, 0.5 * u, { tint: 1.0 }); }
  if (f >= w("7.apple") - 4) { const u = ease(f, w("7.apple") - 4, 6); card(c, "appleIcon", 400, 400, iconApple, 0.9, 3.5, -1.85, 0.5 * u, { tint: 1.0 }); }
  sparkle(c, 0.3, 2.95, -2.15, chs, 2.8);
};
const iconPagoda = (p: Pen) => { const g = p.g; g.fillStyle = "#fff6e0"; g.strokeStyle = INK; g.lineWidth = 12; g.beginPath(); g.arc(200, 200, 180, 0, 7); g.fill(); g.stroke(); for (let k = 0; k < 3; k++) { const y = 260 - k * 70, wd = 150 - k * 35; g.fillStyle = "#c8302a"; g.fillRect(200 - wd * 0.6, y - 40, wd * 1.2, 44); g.strokeRect(200 - wd * 0.6, y - 40, wd * 1.2, 44); g.fillStyle = "#2f7a5e"; g.beginPath(); g.moveTo(200 - wd - 10, y - 36); g.quadraticCurveTo(200, y - 70, 200 + wd + 10, y - 36); g.lineTo(200 + wd * 0.7, y - 46); g.lineTo(200 - wd * 0.7, y - 46); g.closePath(); g.fill(); g.stroke(); } };
const iconApple = (p: Pen) => { const g = p.g; g.fillStyle = "#fff6e0"; g.strokeStyle = INK; g.lineWidth = 12; g.beginPath(); g.arc(200, 200, 180, 0, 7); g.fill(); g.stroke(); g.fillStyle = "#d9382c"; g.beginPath(); g.ellipse(170, 220, 80, 95, 0, 0, 7); g.ellipse(232, 220, 80, 95, 0, 0, 7); g.fill(); g.stroke(); g.fillStyle = "#6b4a30"; g.fillRect(194, 100, 12, 40); g.fillStyle = "#4f9a3a"; g.beginPath(); g.ellipse(240, 115, 40, 18, -0.4, 0, 7); g.fill(); g.stroke(); };
const goa = (c: Ctx) => { // T15 the ship at the Goa quay; the sailor carries the crate down
  const f = c.f, s = SAILOR_PATH(f), moving = f >= w("8.brought") - 14 && f < w("8.brought") + 16;
  P(c, "sailorG", SAILOR, 41, s[0], s[2], moving ? walk("grin", (c.rf / 17) % 1, { facing: -1, look: -1 }) : stand("grin", { facing: -1, look: -1, blink: lidAt(f, 41) }), { mirror: true });
  const [cx, cz] = side(c, s[0] + c.o[0], s[2] + c.o[2], 0.02, true); crateCard(c, cx - c.o[0], 0.9 + (moving ? 0.03 * Math.abs(Math.sin(c.rf * 0.37)) : 0), cz - c.o[2] + 0.12, 0.85);
  P(c, "merchG", MERCHANT, 4, -0.8, -0.55, stand(f >= w("8.india") ? "grin" : "smile", { facing: 1, look: 1, blink: lidAt(f, 7) }));
  if (f < w("8.ships") + 4) P(c, "goakid", GOAKID, 101, -0.9, 0.8, stand(f >= L[8] + 10 ? "laugh" : "wow", { facing: 1, look: 1, wave: q(Math.sin(c.rf * 0.6), 10), raise: 1, blink: lidAt(f, 101) }), { s: 0.8 }); // seen from behind, waving at the ship (foreground lead in the WS)
  if (f < w("8.ships") + 4) P(c, "goaman", { ...DYER, jacket: "#e0731e", cap: "#f6efe2" }, 104, 0.2, -0.3, stand("grin", { facing: 1, look: 1, blink: lidAt(f, 104) }), {});
  P(c, "buyer", BUYER, 102, -4.2, -1.2, stand("smile", { facing: 1, look: 1, prop: "basket", blink: lidAt(f, 102) }));
  P(c, "sailorG2", { ...SAILOR, cap: "#2f5ea8" }, 103, 5.0, -3.6, stand("smile", { facing: -1, look: -1 }), { mirror: true });
};
/** the crate LARANJA DE SINTRA as a flat card (it travels in the sailor's arms and lands on the stall) */
export const CRATE_TXT = "LARANJA\nDE SINTRA";
const crateCard = (c: Ctx, x: number, y: number, z: number, wd: number, blur = 0) => card(c, `crate${blur}`, 800, 520, (p) => crateDraw(p, blur), x, y, z, wd, { tint: 1.0 });
const crateDraw = (p: Pen, blur: number) => { const g = p.g; g.fillStyle = "#c08f55"; g.strokeStyle = INK; g.lineWidth = 14; g.fillRect(20, 60, 760, 440); g.strokeRect(20, 60, 760, 440); g.fillStyle = "#f58a1f"; for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(80 + i * 80, 60, 42, Math.PI, 0); g.fill(); g.stroke(); } g.fillStyle = "rgba(90,50,20,0.25)"; for (let i = 0; i < 4; i++) g.fillRect(20, 120 + i * 100, 760, 6); g.fillStyle = "#8a5a34"; g.fillRect(20, 60, 30, 440); g.fillRect(750, 60, 30, 440); void blur; g.font = "900 120px 'DejaVu Serif', serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#3a2418"; g.fillText("LARANJA", 400, 220); g.font = "900 96px 'DejaVu Serif', serif"; g.fillText("DE SINTRA", 400, 360); g.filter = "none"; };
const wordDraw = (p: Pen, t: string) => { const g = p.g; g.font = "italic 900 120px 'DejaVu Serif', serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.lineWidth = 16; g.strokeStyle = INK; g.strokeText(t, 280, 100); g.fillStyle = "#fff3d6"; g.fillText(t, 280, 100); };
const stall = (c: Ctx) => { // T16-T18 the crate lands, the seller reads it, the whisper speeds up, SANTRA!
  const f = c.f, sw0 = w("9.say"), sa = w("10.santra"), wh = f >= sw0 - 4 && f < sa;
  let ex: Expr = "smile"; const sw: number[] = [];
  if (f < w("8.orange")) ex = "smile"; else if (f < L[9]) { ex = f >= w("8.sintra") ? "wow" : "confused"; sw.push(w("8.sintra") - 1); }
  if (wh) { const k = clampN((f - sw0) / (sa - sw0)), per = Math.max(2, Math.round(7 - 5 * k)); ex = Math.floor((f - sw0) / per) % 2 ? "wow" : "smile_closed"; }
  if (f >= sa) ex = f < sa + 30 ? "cheer" : f < w("10.hindi") ? "laugh" : "grin";
  P(c, "merchT", MERCHANT, 4, -0.55, -0.5, stand(ex, { facing: 1, look: wh ? 0 : 1, wave: f >= sa ? q(Math.sin(c.rf * 0.6), 10) : undefined, raise: f >= sa ? ease(f, sa, 4) : 0, waveL: f >= sa && f < sa + 40 ? -q(Math.sin(c.rf * 0.6 + 1), 10) : undefined, raiseL: f >= sa ? ease(f, sa, 4) : 0, blink: wh ? 0 : lidAt(f, 7, sw) }));
  const blur = f >= w("9.sintra") && f < sa ? Math.round(clampN((f - w("9.sintra")) / (w("9.fast") - w("9.sintra"))) * 4) * 2 : 0;
  if (f < sa) crateCard(c, -0.4, 0.92, -0.05, 1.0, blur); else { const k = ease(f, sa, 6); crateCard(c, -0.4 - 1.2 * k, 0.92 - 0.6 * k, -0.05 + 0.4 * k, 1.0, 0); } // SANTRA: he shoves the crate aside to cheer
  if (wh) { // "Sintra" words fly out of his mouth, faster and faster
    const a0 = w("9.say") + 4, gaps: number[] = []; let t = a0, g = 13; while (t < sa) { gaps.push(t); t += Math.max(3, Math.round(g)); g *= 0.8; }
    gaps.forEach((t0, i) => { const u = (f - t0) / 16; if (u < 0 || u > 1) return; const fast = i >= gaps.length - 4; card(c, `sw${fast ? 1 : 0}`, 560, 200, (p) => wordDraw(p, fast ? "S'ntra" : "Sintra"), -0.4 + 0.42 * u, 1.22 + 0.3 * u + 0.05 * (i % 3), -0.15, 0.36 * (0.7 + 0.5 * u), { tint: 1.0, rot: 0.15 * Math.sin(i) }); });
  }
  if (f >= sa && f < sa + 12) { const u = q((f - sa) / 12, 12); card(c, `pop${u}`, 500, 500, (p) => fxBurst(p, u, "#ffe27a", 12, 30, 230), -1.0, 2.75, -1.6, 2.8, { tint: 1.6 }); }
  P(c, "goakid", GOAKID, 101, 1.0, 0.25, stand(f >= sa ? "laugh" : wh ? "nervous" : "smile", { facing: -1, look: -1, wave: f >= sa ? q(Math.sin(c.rf * 0.7), 10) : undefined, blink: lidAt(f, 101) }), { mirror: true, s: 0.8 });
  // buyers come for "today": everyone holds up an orange
  const bk = smooth((f - (w("10.hindi") - 10)) / 26);
  if (f >= w("10.hindi") - 10) [BUYER, { ...DYER, jacket: "#e0731e" }, { ...GOAKID, stripes: "#2f7fc4" }, { ...MERCHANT, jacket: "#3f9a5a", cap: "#f6efe2", sash: "#c8302a" }].forEach((o, i) => {
    const x0 = [-6, 6.5, -5.2, 7.2][i], x1 = [-1.55, 1.75, -2.4, 2.3][i], z = [-0.9, -0.6, 0.9, -1.1][i];
    P(c, `buy${i}`, o, 110 + i, x0 + (x1 - x0) * bk, z, bk < 1 ? walk("smile", ((c.rf + i * 4) / 17) % 1, { facing: x0 < 0 ? 1 : -1, look: x0 < 0 ? 1 : -1 }) : stand("grin", { facing: x0 < 0 ? 1 : -1, look: x0 < 0 ? 1 : -1, prop: "orange", blink: lidAt(f, 110 + i) }), { mirror: x0 > 0, s: o.build === "kid" ? 0.8 : 1 });
  });
};
const ending = (c: Ctx) => { // T19 the merchant again: all the names hang from his staff now; "what do you call it?"
  const f = c.f, [ex, sw] = track(f, [[L[11], "smile"], [w("11.what"), "hesitant"], [w("11.call"), "grin"]]);
  P(c, "merchE", MERCHANT, 4, 0.1, -1.0, stand(ex, { prop: "bigorange", staffL: true, headTilt: f >= w("11.what") ? 6 * ease(f, w("11.what"), 6) : 0, blink: lidAt(f, 7, sw) }));
  const [gx, gz] = side(c, 0.1 + c.o[0], -1.0 + c.o[2], HAND_R.dx); card(c, "glow", 256, 256, glowDraw, gx - c.o[0], 1.24, gz - c.o[2], 1.0 * (1 + 0.06 * Math.sin(c.rf * 0.3)), { soft: true, alpha: 0.8, tint: 1.4 });
  staffAt(c, 0.1, 0, -1.0, "ALL", { chain: true });
  P(c, "kidEnd", GOAKID, 101, 1.5, -2.6, stand("grin", { facing: -1, look: -1, prop: "orange", blink: lidAt(f, 101) }), { mirror: true, s: 0.8 });
  P(c, "sellerEnd", { ...DYER, jacket: "#3f9a5a", hat: "turban", cap: "#f6efe2" }, 41, -2.5, -4.4, stand("smile", { facing: 1, look: 1, blink: lidAt(f, 41) }));
};
const DIR: Record<string, (c: Ctx) => void> = { hook, dunes, deck, scholar, serai, souk, lisbon, europe, sail, china, sintra, dutch, goa, stall, end: ending };
export const stage = (f: number, cam: CamInfo, rf: number, o: V3): { st: Stage; staff: StaffReq[] } => {
  const out: Stage = { places: [], fx: [] }, staff: StaffReq[] = [], t = takeAt(f);
  DIR[t.id]?.({ cam, out, f, rf, o, staff });
  void TOTAL; void ramp; void glow;
  return { st: out, staff };
};
