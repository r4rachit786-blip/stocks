// Orange v2: the eleven places. Each builder fills its own group (set origin applied by world.ts) and returns the
// handles the animation needs (signs, camels, ships, sails). Layout rule: the camera looks toward -z, the cast stands
// around the origin, props crowd the middle ground, buildings z -6 .. -30, landmarks and hills beyond.
import * as THREE from "three";
import { Batch, V, M4, C, T, ground, GROUNDS, oranges, crate, basket, sack, spiceHeap, pot, barrel, brassLantern, paperLantern, rug, stall, fruitStall,
  marigolds, bunting, litter, clothLine, well, fountain, cart, bollard, ropeCoil, bench, planter, flag, orangeTree, cypress, roundTree, flatHouse, arcade, dome, minaret,
  shikhara, gableHouse, dutchHouse, chinaHall, pagoda, paifang, chapel, sintraPalace, castleWall, riverTower, windmill, hill, caravel, junk, rowBoat, Camel,
  label, labelTex, archFrame, boxGeo, lam, shade2 } from "./kit2";
import { palm, mats } from "../film/set";
import { hangingSign, signTex, Sign, daySea } from "../orange/sets";
import { limb, rng, quadUV } from "../film/geo";
import { ctex } from "../film/paint";

export type SetRefs = { signs: Record<string, Sign>; camels: Camel[]; ships: THREE.Group[]; sails: THREE.Object3D[][]; swell: THREE.Texture[]; mills: THREE.Group[]; extra: Record<string, THREE.Object3D> };
const refs = (): SetRefs => ({ signs: {}, camels: [], ships: [], sails: [], swell: [], mills: [], extra: {} });
let _M: ReturnType<typeof mats> | null = null; const KM = () => (_M ??= mats());
const sign = (R: SetRefs, G: THREE.Group, key: string, x: number, z: number, w: number, text: string, y = 2.55, ry = 0, post = true) => { const s = hangingSign(G, x, z, w, y, ry, post); s.set(signTex(text)); R.signs[key] = s; return s; };
const shrubs = (b: Batch, n: number, x0: number, x1: number, z0: number, z1: number, seed: number, col = "#8a9a52", s = 0.5) => { const r = rng(seed); for (let i = 0; i < n; i++) { const x = x0 + (x1 - x0) * r(), z = z0 + (z1 - z0) * r(); b.add(new THREE.IcosahedronGeometry(s * (0.6 + 0.6 * r()), 1).scale(1, 0.6, 1), C(i % 3 ? col : shade2(col, 0.85)), M4(x, 0.15, z)); } };
const signBeam = (b: Batch, x: number, z: number, w: number, top: number) => { const wd = C("#6b4426"); b.add(boxGeo(V(-w / 2, top - 0.06, -0.06), V(w / 2, top + 0.08, 0.06)), wd, M4(x, 0, z)); for (const s of [-1, 1]) b.add(boxGeo(V(-0.07, 0, -0.07), V(0.07, top + 0.08, 0.07)), wd, M4(x + s * w / 2, 0, z)); };

// ================= INDIA: the bazaar street (hook, scholar's veranda, golden ending) =================
export function buildIndia(G: THREE.Group): SetRefs {
  const R = refs(), b = new Batch(), M = KM();
  ground(b, GROUNDS.earth());
  b.add(quadUV(V(-2.6, 0.006, 6), V(2.6, 0.006, 6), V(2.6, 0.006, -40), V(-2.6, 0.006, -40), 0, 0, 2, 18), GROUNDS.plaza());
  litter(b, -3.4, 3.4, 4, -24, 260, 31, ["#f6a21e", "#f2c230", "#e9761c", "#d94a2a"]); litter(b, -4, 4, 4, -24, 30, 32, ["#cfa27a", "#d9b48a"], "stone"); litter(b, -4, 4, 4, -20, 50, 33, ["#d9b46a", "#c9a24a"], "straw");
  const walls = ["#c9d3ea", "#e7845a", "#b7c4e6", "#e9a3b5", "#f3d39a", "#9fc2a8", "#d6cdea"], shut = ["#2f6fa8", "#3f8a5a", "#8c3b4a", "#2f5ea8"];
  // two rows of houses facing the street (street along z, the merchant walks down it toward the lens)
  for (let i = 0; i < 7; i++) {
    const z = 2 - i * 6.2;
    flatHouse(b, -7.6, z, 6, 5, 4.6 + (i % 3) * 1.2, walls[i % 7], shut[i % 4], { ry: Math.PI / 2, balcony: i % 2 === 0, dome: i === 3 ? "#f2f0e8" : undefined });
    flatHouse(b, 7.6, z - 2.5, 6, 5, 4.2 + ((i + 1) % 3) * 1.3, walls[(i + 3) % 7], shut[(i + 1) % 4], { ry: -Math.PI / 2, balcony: i % 2 === 1 });
  }
  // stalls down both sides with awnings, fruit, baskets, sacks of spice, brass pots
  const awn = ["#e0392b/#f6e7c0", "#f28a1e/#fff3d6", "#2f7fc4/#f6efe0", "#3f9a5a/#f6efe0", "#c2357a/#fbe6f0"];
  for (let i = 0; i < 6; i++) {
    const z = -1.5 - i * 4.4;
    fruitStall(b, -3.7, z, 2.4, awn[i % 5], 10 + i, Math.PI / 2);
    if (i % 2) fruitStall(b, 3.7, z - 1.5, 2.2, awn[(i + 2) % 5], 30 + i, -Math.PI / 2);
    else { stall(b, 3.7, z - 1.5, 2.2, awn[(i + 2) % 5], -Math.PI / 2); for (let k = 0; k < 3; k++) { sack(b, 3.4, 0.88, z - 2.3 + k * 0.75, 0.8, ["#e0a52a", "#d94a2a", "#8a5a34"][k], 50 + i * 3 + k); } }
    for (let k = 0; k < 3; k++) pot(b, -2.7 + (k % 2) * 0.2, 0, z + 0.9 + k * 0.45, 1 + 0.2 * (k % 2), k % 2 ? "#d9a441" : "#c9773e", k % 3);
    sack(b, 2.7, 0, z - 0.3, 0.9, ["#f2c230", "#d94a2a", "#9a6a3e"][i % 3], 70 + i);
    basket(b, -2.6, 0, z - 1.2, 0.3, 0.3, true, 80 + i);
  }
  // foreground: the merchant's own baskets and crates by the lens (foreground plane, rule 4)
  crate(b, -1.95, 0, 2.2, 0.8, 0.5, 0.55, 0.3, true, 90); basket(b, 1.9, 0, 2.0, 0.36, 0.36, true, 91); crate(b, 2.3, 0, 1.2, 0.7, 0.45, 0.5, -0.4, true, 92);
  sack(b, -2.4, 0, 1.0, 1, "#f2c230", 93); pot(b, 2.6, 0, 0.0, 1.3, "#d9a441", 1);
  basket(b, 1.35, 0, -2.2, 0.34, 0.34, true, 94); crate(b, -1.45, 0, -3.4, 0.75, 0.45, 0.5, 0.4, true, 97); sack(b, 1.5, 0, -5.6, 0.9, "#d94a2a", 98); pot(b, -1.3, 0, -6.8, 1.4, "#c9773e", 0); basket(b, 1.4, 0, -8.6, 0.3, 0.3, true, 99); crate(b, -1.5, 0, -9.8, 0.7, 0.45, 0.5, -0.2, true, 100);
  // marigold strings and bunting across the street
  for (let i = 0; i < 6; i++) { const z = 0.5 - i * 5.5; marigolds(b, V(-5.0, 5.0, z), V(5.0, 5.0, z - 1.2), 0.8, 26); }
  for (let i = 0; i < 4; i++) { const z = -3 - i * 7; bunting(b, V(-5.0, 4.4, z), V(5.0, 4.4, z + 1.5), 0.6, 14, ["#e0392b", "#f2c230", "#3f9a5a", "#f28a1e", "#2f7fc4"]); }
  // the temple at the end of the street, palms, far hills
  shikhara(b, 0.5, -52, 1.7, "#e8c49a");
  palm(b, M, -12, -40, 9.5, [1.0, 0.2], 301); palm(b, M, 12.5, -36, 8.8, [-1.1, 0.4], 302); palm(b, M, -5, -62, 10, [0.7, 0], 303); palm(b, M, 9, -60, 9, [-0.6, 0], 304);
  hill(b, -60, -160, 80, 24, 40, "#9db57a", 3); hill(b, 70, -170, 90, 30, 40, "#8fae6c", 5);
  // the scholar's veranda (off the street at x = 22): platform, carved pillars, beam, palm-leaf bundles, oil lamp, tulsi pot
  {
    const X = 22;
    const plat = C("#d6ccd8"), pil = C("#a8603e"), beam = C("#7a4a2a");
    b.add(boxGeo(V(-4.5, 0, -3.2), V(4.5, 0.42, 0.6)), plat, M4(X, 0, 0));
    b.add(boxGeo(V(-4.5, 0, -3.4), V(4.5, 4.2, -3.2)), T("verWall", (() => { const t = ctex("o2verWall", 1024, 512, (g) => { g.fillStyle = "#dcd4e6"; g.fillRect(0, 0, 1024, 512); g.fillStyle = "#c94a3a"; g.fillRect(0, 440, 1024, 22); g.fillStyle = "#3f8a5a"; g.fillRect(0, 470, 1024, 14); for (let i = 0; i < 6; i++) { g.fillStyle = "#7a4a2a"; g.beginPath(); g.roundRect(70 + i * 160, 120, 90, 230, [45, 45, 0, 0]); g.fill(); g.fillStyle = "#3a2a24"; g.beginPath(); g.roundRect(80 + i * 160, 130, 70, 220, [35, 35, 0, 0]); g.fill(); } }); return t; })()), M4(X, 0, 0));
    for (const px of [-4, -1.4, 1.4, 4]) { b.add(new THREE.CylinderGeometry(0.16, 0.2, 3.4, 10), pil, M4(X + px, 0.42 + 1.7, 0.25)); b.add(boxGeo(V(-0.28, 0, -0.28), V(0.28, 0.25, 0.28)), beam, M4(X + px, 0.42, 0.25)); b.add(boxGeo(V(-0.3, 0, -0.3), V(0.3, 0.25, 0.3)), beam, M4(X + px, 3.6, 0.25)); }
    b.add(boxGeo(V(-4.8, 3.85, -3.4), V(4.8, 4.15, 0.7)), beam, M4(X, 0, 0)); b.add(boxGeo(V(-5.2, 4.15, -3.6), V(5.2, 4.35, 1.0)), C("#c9775a"), M4(X, 0, 0));
    b.add(boxGeo(V(-0.9, 0.42, -1.4), V(0.9, 0.72, -0.9)), beam, M4(X - 0.6, 0, 0)); // low writing desk
    for (let k = 0; k < 4; k++) b.add(boxGeo(V(-0.32, 0, -0.06), V(0.32, 0.05, 0.06)), C("#e6cf8a"), M4(X - 1.1 + (k % 2) * 0.1, 0.72 + k * 0.05, -1.15)); // stacked palm-leaf manuscripts
    for (let k = 0; k < 5; k++) b.add(boxGeo(V(-0.34, 0, -0.07), V(0.34, 0.06, 0.07)), C(k % 2 ? "#e6cf8a" : "#d8bc72"), M4(X - 3.2, 0.42 + k * 0.065, -2.6, 0.2 * k)); // more bundles by the wall
    pot(b, X + 2.8, 0.42, -2.4, 1.4, "#d9a441", 1); pot(b, X + 3.3, 0.42, -2.6, 1.1, "#c9773e", 0); pot(b, X - 2.2, 0.42, -0.4, 0.5, "#d9a441", 2); // brass vessels and the little oil lamp
    b.add(boxGeo(V(-0.4, 0, -0.4), V(0.4, 0.8, 0.4)), C("#e8dcc4"), M4(X + 3.4, 0, 1.6)); b.add(new THREE.IcosahedronGeometry(0.4, 1).scale(1, 0.9, 1), C("#4f8a3e"), M4(X + 3.4, 1.2, 1.6)); // tulsi planter
    rug(b, X - 0.3, 0.42, -1.6, 2.6, 1.4, 7, ["#b83a3a", "#f2c230", "#2f5ea8"]);
    marigolds(b, V(X - 4.4, 3.7, 0.4), V(X + 4.4, 3.7, 0.4), 0.5, 30);
    basket(b, X + 1.8, 0, 1.4, 0.32, 0.32, true, 95); crate(b, X - 3.6, 0, 1.3, 0.7, 0.45, 0.5, 0.2, true, 96);
    sign(R, G, "scholar", X - 0.55, -0.95, 1.6, "NARANGA", 2.45, 0, false);
    b.add(limb([V(X - 1.3, 3.15, -0.95), V(X + 0.2, 3.15, -0.95)], [0.03, 0.03], 5), beam); b.add(limb([V(X - 1.3, 3.15, -0.95), V(X - 1.3, 3.85, -0.95)], [0.03, 0.03], 5), beam); b.add(limb([V(X + 0.2, 3.15, -0.95), V(X + 0.2, 3.85, -0.95)], [0.03, 0.03], 5), beam);
    palm(b, M, X + 8, -8, 9, [-0.6, 0.2], 305); palm(b, M, X - 8, -9, 8, [0.6, 0], 306); shikhara(b, X + 3, -40, 1.3, "#e8c49a");
  }
  b.build(G);
  return R;
}

// ================= DUNES: the caravan crossing =================
export function buildDunes(G: THREE.Group): SetRefs {
  const R = refs(), b = new Batch();
  ground(b, GROUNDS.dune(), -200, 200, 60, -300);
  const sandC = ["#ead8bc", "#e4ceb0", "#efe0c8"];
  for (let i = 0; i < 14; i++) { const r = rng(400 + i); hill(b, -120 + i * 18 + r() * 8, -22 - r() * 50 - (i % 3) * 20, 14 + r() * 16, 4 + r() * 6, 8 + r() * 6, sandC[i % 3], 400 + i); }
  for (let i = 0; i < 8; i++) { const r = rng(500 + i); hill(b, -200 + i * 55, -160 - r() * 40, 50 + r() * 30, 18 + r() * 12, 30, "#e2d0b8", 500 + i); }
  shrubs(b, 40, -40, 40, 8, -40, 7, "#9aa05a", 0.35);
  for (let i = 0; i < 18; i++) { const r = rng(600 + i); b.add(new THREE.DodecahedronGeometry(0.2 + r() * 0.4, 0), C("#c9a27a"), M4(-30 + r() * 60, 0.1, 6 - r() * 26, r() * 3)); }
  const M = KM(); palm(b, M, 34, -70, 9, [0.5, 0], 410); palm(b, M, 40, -74, 8, [-0.5, 0], 411); palm(b, M, 28, -76, 10, [0.3, 0], 412); // a far oasis
  minaret(b, -60, -140, 14, "#e9d5ac", "#3f8fa8"); // a far town
  b.build(G);
  for (let i = 0; i < 4; i++) R.camels.push(new Camel(G, 0, -0.2 - (i % 2) * 0.1, 0, { load: true, blanket: ["#c8302a", "#2f5ea8", "#3f8a5a", "#e0a52a"][i] }));
  return R;
}

// ================= SERAI: the caravanserai courtyard (Persian traders, the dyer) =================
export function buildSerai(G: THREE.Group): SetRefs {
  const R = refs(), b = new Batch();
  litter(b, -10, 10, 4, -7, 120, 61, ["#d9b46a", "#c9a24a"], "straw"); litter(b, -10, 10, 4, -7, 80, 62, ["#b98a62", "#cfb08a"], "stone");
  ground(b, GROUNDS.sand());
  b.add(quadUV(V(-14, 0.01, 3), V(14, 0.01, 3), V(14, 0.01, -8), V(-14, 0.01, -8), 0, 0, 7, 3), T("seraiPave", (GROUNDS.plaza() as THREE.MeshLambertMaterial).map!));
  arcade(b, 0, -9.5, 9, 2.0, 3.1, 5.0, 1.6, "#e6dac8"); // back wall of arches
  arcade(b, -13.5, -1, 5, 2.0, 3.1, 5.0, 1.4, "#e2d6c4", Math.PI / 2); arcade(b, 13.5, -3, 5, 2.0, 3.1, 5.0, 1.4, "#e2d6c4", -Math.PI / 2);
  // the great gate (iwan) with a pointed arch, tiles in blue
  b.add(boxGeo(V(-3.2, 0, -10.2), V(3.2, 9.5, -9.4)), T("iwan", ctex("o2iwan", 512, 768, (g) => { g.fillStyle = "#e6dac8"; g.fillRect(0, 0, 512, 768); g.fillStyle = "#2f7fa8"; g.fillRect(40, 40, 432, 40); g.fillStyle = "#3a8fb8"; g.beginPath(); g.moveTo(110, 768); g.lineTo(110, 380); g.quadraticCurveTo(110, 170, 256, 130); g.quadraticCurveTo(402, 170, 402, 380); g.lineTo(402, 768); g.fill(); g.fillStyle = "#3a2a24"; g.beginPath(); g.moveTo(150, 768); g.lineTo(150, 400); g.quadraticCurveTo(150, 220, 256, 190); g.quadraticCurveTo(362, 220, 362, 400); g.lineTo(362, 768); g.fill(); g.fillStyle = "#f2c230"; for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(60 + i * 49, 60, 9, 0, 7); g.fill(); } })), M4(0, 0, 0));
  dome(b, -7, 5.3, -12.5, 2.6, "#3a8fb8", "#e6dac8"); dome(b, 7, 5.3, -12.5, 2.2, "#2f9aa8", "#e6dac8"); minaret(b, 11, -14, 13, "#e6dac8", "#2f7fa8");
  const M = KM(); palm(b, M, -10, -16, 10, [0.6, 0], 501); palm(b, M, 3.5, -17, 11, [-0.4, 0.2], 502); palm(b, M, 15, -12, 9, [-0.8, 0], 503);
  well(b, -3.4, -4.2);
  for (const [x, z, ry] of [[-9.5, -5.5, 0.3], [-8.4, -5.2, -0.2], [9, -6, 0.1], [9.6, -5.2, 0.4]] as const) crate(b, x, 0, z, 0.8, 0.5, 0.6, ry, true, Math.round(x * 10));
  crate(b, -9.0, 0.5, -5.4, 0.7, 0.45, 0.5, 0.1, true, 7); barrel(b, 7.4, 0, -6.6); barrel(b, 8.1, 0, -7.2, 0.9);
  rug(b, -6.8, 0, -2.6, 2.2, 1.4, 1, ["#9a2a3a", "#f2c230", "#2f5ea8"]); rug(b, 5.8, 0, -3.8, 2.0, 1.3, 2, ["#2f5ea8", "#f6e7c0", "#c8302a"]);
  for (let i = 0; i < 5; i++) rug(b, -8 + i * 2.2, 4.4, -8.6, 1.4, 2.2, 10 + i, [["#9a2a3a", "#2f5ea8", "#3f8a5a", "#c8302a", "#6a3a8a"][i], "#f2c230", "#f6e7c0"], true);
  for (let i = 0; i < 6; i++) sack(b, -12 + (i % 3) * 0.6, 0, -6.8 + Math.floor(i / 3) * 0.6, 0.9, ["#e0a52a", "#d94a2a", "#8a5a34"][i % 3], 520 + i);
  // the dyer's corner: vats, cloths drying on lines (the new colour among them), jars with the colour names
  for (const [x, z, col] of [[3.5, -1.1, "#f28a1e"], [5.2, -1.5, "#2f5ea8"], [6.6, -0.8, "#c8302a"]] as const) { b.add(new THREE.CylinderGeometry(0.55, 0.5, 0.75, 18, 1, true), T("vatW", (GROUNDS.deck() as THREE.MeshLambertMaterial).map!, { side: THREE.DoubleSide }), M4(x, 0.37, z)); b.add(new THREE.CylinderGeometry(0.52, 0.52, 0.04, 18), C(col), M4(x, 0.68, z)); b.add(new THREE.TorusGeometry(0.55, 0.04, 6, 18).rotateX(Math.PI / 2), C("#4a4048"), M4(x, 0.74, z)); }
  clothLine(b, 2.2, 9.2, 3.2, -3.4, ["#2f5ea8", "#c8302a", "#f6e7c0", "#3f8a5a", "#c8302a", "#2f5ea8"]);
  clothLine(b, 1.8, 7.4, 3.0, -5.6, ["#e0a52a", "#6a3a8a", "#f6e7c0", "#2f9aa8"]);
  for (let k = 0; k < 4; k++) pot(b, 7.4 + k * 0.45, 0, -2.0, 1.1, ["#c9773e", "#d9a441", "#9a5a3e", "#c9773e"][k], k % 2);
  const jar = label(G, labelTex("NARENJI", { board: "#f6efdc", ink: "#d8621a", font: 120 }), 7.9, 0.95, -1.7, 1.0, 0.36);
  R.extra.jar = jar;
  sign(R, G, "serai", -1.0, -1.3, 1.6, "NARANGA", 2.0);
  b.build(G);
  R.camels.push(new Camel(G, -6.4, -1.3, 0, { load: true, blanket: "#c8302a" }));
  R.camels.push(new Camel(G, -8.6, -3.6, 0.5, { kneel: true, load: true, blanket: "#2f5ea8" }));
  R.camels.push(new Camel(G, 10.5, -3.0, -2.6, { kneel: true, blanket: "#3f8a5a" }));
  return R;
}

// ================= SOUK: the Arab market street =================
export function buildSouk(G: THREE.Group): SetRefs {
  const R = refs(), b = new Batch();
  litter(b, -5, 5, 4, -4, 120, 91, ["#d94a2a", "#f2c230", "#8a5a34"]);
  ground(b, GROUNDS.plaza());
  arcade(b, 0, -5.5, 7, 1.8, 2.9, 4.4, 1.2, "#ece6dc");
  for (let i = 0; i < 3; i++) { flatHouse(b, -6.5 - i * 6.5, -9 - i * 2, 6, 5, 6 + i, ["#ece6dc", "#d9d6e6", "#efe8de"][i], "#2f6f8a", { dome: i === 1 ? "#f2f0e8" : undefined }); flatHouse(b, 7 + i * 6.5, -9 - i * 2.5, 6, 5, 5.5 + i * 0.8, ["#efe8de", "#cfd8ea", "#ece6dc"][i], "#8c3b4a", { awning: "#2f6f8a/#f3e2b8" }); }
  minaret(b, -4, -26, 16, "#ece6dc", "#2f7fa8"); dome(b, 5, 6, -24, 3.2, "#2f9aa8", "#ece6dc");
  // the merchant's stall, brass lanterns, rugs, pottery, spice heaps
  stall(b, -0.7, -1.8, 2.6, "#2f6f8a/#f3e2b8", 0, { h: 2.4 });
  for (let k = 0; k < 4; k++) spiceHeap(b, -1.75 + k * 0.7, 0.88, -1.85, 0.22, ["#d94a2a", "#f2c230", "#8a5a34", "#3f8a5a"][k]);
  oranges(b, 0.4, 0.88, -1.6, 26, 0.3, 61, 0.8);
  for (let k = 0; k < 7; k++) brassLantern(b, -3.4 + k * 1.15, 2.95 + (k % 2) * 0.25, -3.4, 1.1);
  for (let k = 0; k < 4; k++) rug(b, -4.5 + k * 3.0, 4.2, -4.3, 1.3, 2.4, 20 + k, [["#9a2a3a", "#2f5ea8", "#c8302a", "#6a3a8a"][k], "#f2c230", "#f6e7c0"], true);
  for (let k = 0; k < 8; k++) pot(b, 2.2 + (k % 4) * 0.5, 0, -2.4 - Math.floor(k / 4) * 0.55, 1.1 + 0.3 * (k % 2), ["#c9773e", "#2f6f8a", "#d9a441", "#9a5a3e"][k % 4], k % 3);
  for (let k = 0; k < 5; k++) sack(b, -3.6 + (k % 3) * 0.6, 0, -2.6 - Math.floor(k / 3) * 0.6, 0.85, ["#e0a52a", "#d94a2a", "#8a5a34"][k % 3], 630 + k);
  basket(b, 1.8, 0, -0.9, 0.32, 0.3, true, 64); crate(b, -2.6, 0, -0.6, 0.7, 0.45, 0.5, 0.3, true, 65); crate(b, 2.6, 0, 1.4, 0.8, 0.5, 0.55, -0.3, true, 66);
  pot(b, -2.4, 0, 1.6, 1.6, "#c9773e", 0); barrel(b, 2.9, 0, -0.3, 0.9);
  bunting(b, V(-6, 4.6, -2.5), V(6, 4.6, -2.2), 0.5, 14, ["#2f6f8a", "#f2c230", "#c8302a", "#f6e7c0"]);
  sign(R, G, "souk", -0.5, -1.25, 1.5, "NARANG", 2.75, 0, false);
  signBeam(b, -0.5, -1.25, 2.4, 3.42);
  b.build(G);
  return R;
}

// ================= SEA: the caravel on open water (deck scene and sailing) =================
export function buildSea(G: THREE.Group): SetRefs {
  const R = refs(), S2 = new THREE.Group(); G.add(S2); R.swell.push(daySea(S2, 80, "#2c7cc4", "#b4d6ee", 1700).swell);
  const { g, sails } = caravel(G, 1); R.ships.push(g); R.sails.push(sails);
  const b = new Batch(); // deck cargo: crates of oranges, barrels, coils, the hatch
  for (const [x, z, ry] of [[2.6, -1.0, 0.1], [3.4, -0.4, -0.2], [2.9, -1.5, 0.3], [-3.0, 0.9, 0.2]] as const) crate(b, x, 1.33, z, 0.75, 0.48, 0.55, ry, true, Math.round(x * 13 + z * 7));
  crate(b, 2.8, 1.81, -1.1, 0.7, 0.45, 0.5, 0.2, true, 77);
  barrel(b, -1.8, 1.33, -1.3); barrel(b, -2.4, 1.33, -0.9, 0.9); ropeCoil(b, 1.2, 1.33, -1.6); ropeCoil(b, -1.2, 1.33, 1.6, 0.3);
  b.add(boxGeo(V(-0.8, 0, -0.6), V(0.8, 0.25, 0.6)), C("#7a4f2e"), M4(4.6, 1.33, 0.2));
  b.build(g);
  // distant ships and gulls' horizon
  for (const [x, z, s] of [[-180, -420, 0.9], [260, -520, 0.8]] as const) { const o = caravel(G, s); o.g.position.set(x, 0, z); o.g.rotation.y = 0.4; }
  sign(R, g as THREE.Group, "deck", -0.36, 0.3, 1.5, "NARANGA", 3.2, 0, false);
  { const yb = new Batch(); yb.add(limb([V(-1.2, 3.9, 0.3), V(0.5, 3.9, 0.3)], [0.04, 0.04], 5), C("#5a3a24")); yb.add(limb([V(-0.36, 3.9, 0.3), V(-0.36, 3.9, 0.0)], [0.04, 0.04], 5), C("#5a3a24")); yb.build(g); }
  return R;
}

// ================= LISBON: the quay, a caravel alongside, tiled houses, the river tower =================
export function buildLisbon(G: THREE.Group): SetRefs {
  const R = refs(), b = new Batch();
  litter(b, -6, 6, 6, -4, 60, 81, ["#d9b46a", "#c9a24a"], "straw");
  b.add(quadUV(V(-80, 0, 40), V(80, 0, 40), V(80, 0, -4.2), V(-80, 0, -4.2), 0, 0, 16, 9), GROUNDS.cobble());
  b.add(boxGeo(V(-80, -1.2, -4.8), V(80, 0, -4.2)), C("#cfc6b4"));
  for (let x = -20; x <= 20; x += 4) bollard(b, x + 0.5, -4.0);
  const S2 = new THREE.Group(); S2.position.y = -1.0; G.add(S2); R.swell.push(daySea(S2, -4.8, "#2f7fc4", "#a9d0ec").swell);
  const { g, sails } = caravel(G, 1); g.position.set(1.0, -1.0, -9.6); R.ships.push(g); R.sails.push(sails);
  b.add(quadUV(V(-0.6, 0.02, -4.2), V(0.6, 0.02, -4.2), V(0.6, 0.3, -7.6), V(-0.6, 0.3, -7.6), 0, 0, 1, 3), T("plank", (GROUNDS.deck() as THREE.MeshLambertMaterial).map!), M4(3.5, 0, 0)); // gangplank
  const tile = (key: string, a: string) => ctex("o2azul" + key, 256, 256, (g2) => { g2.fillStyle = "#f6f4ee"; g2.fillRect(0, 0, 256, 256); g2.strokeStyle = a; g2.lineWidth = 6; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const x = i * 64 + 32, y = j * 64 + 32; g2.beginPath(); g2.arc(x, y, 20, 0, 7); g2.stroke(); g2.beginPath(); g2.moveTo(x - 30, y); g2.lineTo(x + 30, y); g2.moveTo(x, y - 30); g2.lineTo(x, y + 30); g2.stroke(); } });
  for (let i = 0; i < 4; i++) { gableHouse(b, -10 - i * 5.4, 3 - i * 0.6, 5, 7, 6.5 + (i % 2), ["#f4f0e6", "#f2d8a6", "#e8c0b0", "#f6efe2"][i], ["#2f5ea8", "#2f6a43", "#8c3b4a", "#2f5ea8"][i], "#c9775a", { ry: Math.PI / 2 - 0.2 }); gableHouse(b, 11 + i * 5.4, 3 - i * 0.4, 5, 7, 6 + (i % 2), ["#f6efe2", "#e9c99a", "#f4f0e6", "#f2d8a6"][i], ["#8c3b4a", "#2f5ea8", "#2f6a43", "#8c3b4a"][i], "#c9775a", { ry: -Math.PI / 2 + 0.2 }); }
  b.add(boxGeo(V(-1.6, 0, -0.1), V(1.6, 2.6, 0.1)), T("azul1", tile("1", "#2f5ea8")), M4(-8.0, 0, 0.6, Math.PI / 2 - 0.2)); // tiled panel
  riverTower(b, -34, -46, 1.0); hill(b, 20, -260, 160, 26, 50, "#9ab48a", 9); hill(b, -100, -240, 90, 20, 40, "#a8bf94", 11);
  // quay clutter: crate stacks, barrels, coils, nets, a cart
  for (const [x, z, ry] of [[-2.2, -2.4, 0.1], [-1.4, -2.7, -0.2], [-2.0, -3.1, 0.3], [-3.2, -2.2, 0.15], [1.8, -2.8, -0.1]] as const) crate(b, x, 0, z, 0.8, 0.5, 0.6, ry, true, Math.round(x * 11 - z * 3));
  crate(b, -1.8, 0.5, -2.6, 0.75, 0.48, 0.55, 0.05, true, 81); crate(b, -2.3, 1.0, -2.65, 0.7, 0.45, 0.5, -0.1, true, 82);
  barrel(b, 2.8, 0, -2.2); barrel(b, 3.4, 0, -2.8, 0.9); barrel(b, 4.4, 0, -1.6, 1, 0.4, true); ropeCoil(b, 0.6, 0, -3.4); ropeCoil(b, 5.2, 0, -3.2, 0.3);
  cart(b, -6.2, -1.0, 0.4, true, 83); basket(b, -4.4, 0, -0.6, 0.32, 0.32, true, 84); basket(b, 2.2, 0, 1.8, 0.36, 0.36, true, 85); crate(b, -1.9, 0, 2.3, 0.8, 0.5, 0.55, 0.3, true, 86);
  flag(b, 6.8, 4.2, -3.6, 1.6, 1.0, ctex("o2ptflag", 256, 160, (g2) => { g2.fillStyle = "#f6f4ee"; g2.fillRect(0, 0, 256, 160); g2.fillStyle = "#2f5ea8"; g2.fillRect(96, 30, 64, 80); g2.fillStyle = "#f6f4ee"; for (let i = 0; i < 5; i++) { g2.beginPath(); g2.arc(128, 45 + i * 14, 5, 0, 7); g2.fill(); } }));
  sign(R, G, "lisbon", -0.3, -2.1, 1.6, "NARANJ", 1.95);
  b.build(G);
  return R;
}

// ================= EUROPE: the market square =================
export function buildEurope(G: THREE.Group): SetRefs {
  const R = refs(), b = new Batch();
  ground(b, GROUNDS.cobble());
  const hs: [number, number, string, string, boolean, number][] = [[-11, -11, "#f2e2c4", "#8c3b4a", true, 0.2], [-5.4, -13, "#e6c8a0", "#2f6a43", false, 0.05], [0.4, -13.5, "#f4efe2", "#2f5ea8", true, 0], [6.0, -13, "#e9c99a", "#8c3b4a", false, -0.05], [11.6, -11, "#f2e2c4", "#2f6a43", true, -0.2],
    [-16, -4, "#efd9b6", "#2f5ea8", true, Math.PI / 2 - 0.3], [16, -5, "#f4e4c8", "#8c3b4a", false, -Math.PI / 2 + 0.3]];
  hs.forEach(([x, z, wl, sh, t, ry], i) => gableHouse(b, x, z, 5.4, 7, 6.5 + (i % 3) * 1.3, wl, sh, i % 2 ? "#b8573a" : "#c9775a", { timber: t, steep: 0.65, ry }));
  // church: nave + bell tower with a spire
  gableHouse(b, -1, -30, 9, 16, 9, "#e8dcc4", "#5a4a52", "#9a5a40", { steep: 0.5 });
  b.add(boxGeo(V(-1.8, 0, -1.8), V(1.8, 17, 1.8)), T("tower", (GROUNDS.quay() as THREE.MeshLambertMaterial).map!), M4(7, 0, -26)); b.add(new THREE.ConeGeometry(2.4, 7, 4).rotateY(Math.PI / 4), C("#5a6a8a"), M4(7, 20.5, -26));
  fountain(b, -5.2, -5.4, 1.0);
  // market around: stalls, crates, barrels, flower boxes, bunting
  fruitStall(b, 0, -2.4, 2.8, "#c8302a/#f3e2b8", 700);
  stall(b, -8.5, -6.6, 2.4, "#2f7fc4/#f6efe0", 0.35); stall(b, 8.4, -7.0, 2.4, "#3f8a5a/#f6efe0", -0.35);
  for (let k = 0; k < 3; k++) { basket(b, -8.8 + k * 0.7, 0.88, -6.4, 0.25, 0.25, k !== 1, 710 + k, "#c9934e"); oranges(b, 8.0 + k * 0.6, 0.88, -7.0, 18, 0.24, 720 + k, 0.8); }
  for (const [x, z] of [[-3.4, -1.2], [3.2, -1.6], [4.0, -0.9], [-10, -3], [9.4, -3.6]] as const) crate(b, x, 0, z, 0.75, 0.45, 0.5, x * 0.1, true, Math.round(x * 17));
  barrel(b, 3.0, 0, -3.0); barrel(b, -3.3, 0, -3.4, 0.9); barrel(b, 10.2, 0, -5.2); bench(b, -7.4, -2.0, 1.6, 0.5);
  for (let i = 0; i < 5; i++) planter(b, -12 + i * 6, -9.2, "#c9775a");
  for (let i = 0; i < 3; i++) bunting(b, V(-11, 5.2 - i * 0.3, -9 + i * 1.5), V(11, 5.2 - i * 0.3, -9.5 + i * 1.5), 0.8, 20);
  b.add(boxGeo(V(-3.2, 0, -0.06), V(3.2, 0.12, 0.06)), C("#5a3a24"), M4(0, 3.45, -1.55)); // the sign beam
  for (const s of [-1, 1]) b.add(boxGeo(V(-0.06, 0, -0.06), V(0.06, 3.5, 0.06)), C("#5a3a24"), M4(s * 3.1, 0, -1.55));
  b.build(G);
  // the sign: "A NARANGE" on one long board (slots let the N move)
  const s = hangingSign(G, 0, -1.55, 2.6, 2.58, 0, false); s.set(signTex("A NARANGE")); R.signs.europe = s;
  return R;
}

// ================= CHINA: the port =================
export function buildChina(G: THREE.Group): SetRefs {
  const R = refs(), b = new Batch();
  litter(b, -4, 4, 4, -4, 90, 41, ["#e0392b", "#f2c230", "#f58a1f"]); litter(b, -5, 5, 4, -4, 60, 42, ["#8a8278", "#a8a094"], "stone");
  b.add(quadUV(V(-80, 0, 40), V(80, 0, 40), V(80, 0, -5.2), V(-80, 0, -5.2), 0, 0, 16, 9), GROUNDS.plaza());
  b.add(boxGeo(V(-80, -1.2, -5.8), V(80, 0, -5.2)), C("#cfc6b4"));
  const S2 = new THREE.Group(); S2.position.y = -1.0; G.add(S2); R.swell.push(daySea(S2, -5.8, "#2a86b0", "#b4d6e2").swell);
  for (const [x, z, ry, s] of [[-8, -14, 0.3, 1], [9, -19, -0.4, 1.1], [-22, -30, 0.6, 1.2], [26, -36, -0.2, 1.3]] as const) { const j = junk(G, s); j.position.set(x, -1.0, z); j.rotation.y = ry; R.ships.push(j); }
  chinaHall(b, -10, -0.5, 7, 5, 3.6, "#3f7a5e", 0.25); chinaHall(b, 10.5, -1.0, 7, 5, 3.4, "#2f6a8a", -0.25);
  paifang(b, 5.2, -3.6, 4.2, 4.6);
  { const hb = new Batch(); hill(hb, -30, -90, 40, 26, 22, "#7ea888", 13); hill(hb, 25, -110, 60, 36, 30, "#8fb09a", 14); hill(hb, -80, -130, 50, 30, 30, "#9fbca4", 15); hb.build(G); }
  pagoda(b, -28, -82, 1.4, 6);
  for (let i = 0; i < 6; i++) chinaHall(b, -40 + i * 15, -60 - (i % 2) * 6, 9, 6, 4, i % 2 ? "#3f7a5e" : "#2f6a8a");
  // lantern strings over the quay, the fruit stall, baskets, crates, jars
  for (let k = 0; k < 2; k++) { const z = -1.2 - k * 2.4; b.add(limb([V(-6, 3.6, z), V(0, 3.2, z), V(6, 3.6, z)], [0.012, 0.012, 0.012], 4, 1, 12), C("#4a3426")); for (let i = 0; i < 9; i++) paperLantern(b, -5 + i * 1.25, 3.1 + 0.25 * ((i - 4) / 4) ** 2 - 0.12, z, 0.9, i % 3 ? "#e0392b" : "#f2c230"); }
  fruitStall(b, -0.2, -2.0, 2.8, "#e0392b/#f2c230", 800);
  for (let k = 0; k < 4; k++) basket(b, -3.2 + k * 0.7, 0, -1.0 - (k % 2) * 0.6, 0.32, 0.26, true, 810 + k, "#d6b26e");
  for (let k = 0; k < 6; k++) pot(b, 2.6 + (k % 3) * 0.55, 0, -1.4 - Math.floor(k / 3) * 0.6, 1.4, ["#2f5ea8", "#e8e2d4", "#2f6a43"][k % 3], 0);
  crate(b, 3.6, 0, 1.2, 0.8, 0.5, 0.55, -0.3, true, 820); basket(b, -2.4, 0, 1.8, 0.38, 0.32, true, 821, "#d6b26e"); barrel(b, -3.8, 0, -3.6);
  b.build(G);
  return R;
}

// ================= SINTRA: groves, the palace with its two chimneys, the Moorish walls =================
export function buildSintra(G: THREE.Group): SetRefs {
  const R = refs(), b = new Batch();
  litter(b, -12, 12, 6, -16, 260, 71, ["#4f8a3e", "#6aa04a", "#f58a1f"]); litter(b, -1.5, 1.5, 6, -16, 60, 72, ["#b98a62", "#a8785a"], "stone");
  ground(b, GROUNDS.grass(), -120, 120, 50, -160);
  b.add(quadUV(V(-1.5, 0.01, 30), V(1.5, 0.01, 30), V(1.5, 0.01, -30), V(-1.5, 0.01, -30), 0, 0, 1, 10), GROUNDS.earth());
  // groves: rows of orange trees both sides of the road, low stone walls
  let n = 0; for (let r = 0; r < 5; r++) for (let i = 0; i < 5; i++) { for (const sd of [-1, 1]) { const x = sd * (3.4 + i * 3.4), z = 2 - r * 3.8 + (i % 2) * 0.6; if (sd > 0 && r === 0 && i === 0) continue; orangeTree(b, x, z, 0.95 + 0.1 * ((i + r) % 3), 900 + n++); } }
  for (const sd of [-1, 1]) { const st = C("#c9c2b2"); b.add(boxGeo(V(-0.25, 0, -24), V(0.25, 0.7, 6)), st, M4(sd * 2.1, 0, 0)); }
  // the hill town
  { const hb = new Batch(); hill(hb, 0, -78, 46, 22, 28, "#6f9a58", 15); hill(hb, -50, -95, 46, 30, 30, "#7fa868", 16); hill(hb, 55, -100, 50, 26, 30, "#86ad6c", 17); hill(hb, 10, -130, 80, 40, 40, "#8fb47a", 18); hb.build(G); }
  sintraPalace(b, 2, 13.5, -66, 1.0);
  castleWall(b, [[-30, 33, -120], [-18, 37, -118], [-6, 38, -121], [6, 36, -119], [18, 33, -122]], 2.4);
  for (const [x, z, ry, wl] of [[-11, -22, 0.2, "#f6f1e6"], [-6, -26, -0.1, "#f2d8a6"], [8, -22, 0.1, "#f6efe2"], [13, -27, -0.2, "#e8c0b0"], [-15, -30, 0.3, "#f6f1e6"]] as const) gableHouse(b, x, z, 4.5, 5, 4.2, wl, x > 0 ? "#2f5ea8" : "#e8b93e", "#c9775a", { steep: 0.45, ry });
  for (let i = 0; i < 8; i++) cypress(b, -24 + i * 7 + (i % 2) * 2, -38 - (i % 3) * 4, 7 + (i % 3), 950 + i);
  // the farmer's things: baskets, crates, ladder, the cart
  for (let k = 0; k < 3; k++) basket(b, -0.9 + k * 0.55, 0, -1.6 - (k % 2) * 0.4, 0.3, 0.3, true, 960 + k);
  crate(b, 2.6, 0, 0.6, 0.8, 0.5, 0.55, 0.2, true, 963); crate(b, 2.8, 0.5, 0.5, 0.7, 0.45, 0.5, -0.1, true, 964);
  b.add(limb([V(-3.4, 0, -2.2), V(-3.1, 3.0, -2.6)], [0.04, 0.04], 4), C("#8a5a34")); b.add(limb([V(-2.9, 0, -2.2), V(-2.6, 3.0, -2.6)], [0.04, 0.04], 4), C("#8a5a34"));
  for (let k = 1; k < 7; k++) b.add(limb([V(-3.4 + k * 0.05, k * 0.43, -2.2 - k * 0.06), V(-2.9 + k * 0.05, k * 0.43, -2.2 - k * 0.06)], [0.025, 0.025], 4), C("#8a5a34"));
  cart(b, 1.6, -3.0, -0.3, true, 965);
  sign(R, G, "sintra", -1.6, -1.0, 1.5, "SINTRA", 2.3);
  b.build(G);
  return R;
}

// ================= DUTCH: canal, stepped gables, a windmill, the stall =================
export function buildDutch(G: THREE.Group): SetRefs {
  const R = refs(), b = new Batch();
  b.add(quadUV(V(-80, 0, 40), V(80, 0, 40), V(80, 0, -5.6), V(-80, 0, -5.6), 0, 0, 16, 9), GROUNDS.cobble());
  b.add(quadUV(V(-80, -0.6, -5.6), V(80, -0.6, -5.6), V(80, -0.6, -8.4), V(-80, -0.6, -8.4)), C("#4f86b8"));
  b.add(boxGeo(V(-80, -0.7, -5.75), V(80, 0, -5.6)), C("#b8573a")); b.add(boxGeo(V(-80, -0.7, -8.55), V(80, 0, -8.4)), C("#b8573a"));
  b.add(quadUV(V(-80, 0, -8.55), V(80, 0, -8.55), V(80, 0, -20), V(-80, 0, -20), 0, 0, 16, 3), GROUNDS.cobble());
  const walls = ["#f1ead6", "#e9d2b4", "#f4efe2", "#dcc3a2"], shut = ["#2f6a43", "#8c3b4a", "#2f5ea8", "#2f6a43"];
  for (let i = 0; i < 9; i++) dutchHouse(b, -14 + i * 3.5, -12.6, 3.3, 7 + (i % 3) * 1.3, walls[i % 4], shut[i % 4], i % 2 ? "#b8573a" : "#9a4a34");
  R.mills.push(windmill(G, -26, -40, 1.2), windmill(G, 22, -55, 1.0));
  rowBoat(b, -3.5, -7.0, 0.05, "#2f6a43"); rowBoat(b, 6.5, -7.1, -0.08, "#c8302a");
  for (let x = -10; x <= 10; x += 2.5) { b.add(limb([V(x, 0, -5.3), V(x, 0.9, -5.3)], [0.04, 0.04], 5), C("#2a2a30")); }
  b.add(limb([V(-10, 0.85, -5.3), V(10, 0.85, -5.3)], [0.03, 0.03], 4, 1, 4), C("#2a2a30"));
  for (let i = 0; i < 6; i++) roundTree(b, -15 + i * 6, -10, 0.8, 990 + i, "#6aa04a");
  fruitStall(b, 0.3, -2.4, 2.8, "#e86e2a/#f6efe0", 980);
  for (const [x, z] of [[-3.0, -1.6], [-3.6, -2.4], [3.4, -1.4]] as const) crate(b, x, 0, z, 0.75, 0.45, 0.5, x * 0.1, true, Math.round(x * 19));
  basket(b, 2.6, 0, -0.6, 0.34, 0.3, true, 985); barrel(b, 4.4, 0, -2.6); bench(b, -5.2, -3.6, 1.6, 0.2);
  for (let k = 0; k < 5; k++) b.add(new THREE.SphereGeometry(0.16, 10, 8), C(["#e0392b", "#f2c230", "#c2357a", "#f28a1e", "#f6f2e6"][k]), M4(-1.7 + k * 0.12, 0.2, 1.4)); // tulip pot
  b.add(lathe2(), C("#c9773e"), M4(-1.45, 0, 1.4));
  signBeam(b, 0.3, -1.95, 3.0, 3.75);
  b.build(G);
  const s = hangingSign(G, 0.3, -1.95, 2.4, 2.94, 0, false); s.set(signTex("SINAASAPPEL")); R.signs.dutch = s;
  return R;
}
const lathe2 = () => new THREE.LatheGeometry([[0.2, 0], [0.32, 0.3], [0.34, 0.34]].map(([r, h]) => new THREE.Vector2(r, h)), 14);

// ================= GOA, 1500s: the quay, the caravel, palms, a white chapel, the fruit stall =================
export function buildGoa(G: THREE.Group): SetRefs {
  const R = refs(), b = new Batch(), M = KM();
  litter(b, -5, 5, 6, -4, 160, 51, ["#f6a21e", "#f2c230", "#e9761c"]); litter(b, -6, 6, 8, -4, 80, 52, ["#b98a62", "#a8785a"], "stone"); litter(b, -6, 6, 8, -4, 60, 53, ["#d9b46a", "#c9a24a"], "straw");
  b.add(quadUV(V(-80, 0, 40), V(80, 0, 40), V(80, 0, -5.0), V(-80, 0, -5.0), 0, 0, 16, 9), GROUNDS.earth());
  b.add(boxGeo(V(-80, -1.2, -5.6), V(80, 0, -5.0)), C("#cbb79a"));
  for (let x = -14; x <= 14; x += 4) bollard(b, x, -4.8);
  const S2 = new THREE.Group(); S2.position.y = -1.0; G.add(S2); R.swell.push(daySea(S2, -5.6, "#2a86b8", "#b4d6ea").swell);
  const { g, sails } = caravel(G, 1); g.position.set(3.0, -1.0, -10.6); R.ships.push(g); R.sails.push(sails);
  b.add(quadUV(V(-0.6, 0.02, -5.0), V(0.6, 0.02, -5.0), V(0.6, 0.3, -8.6), V(-0.6, 0.3, -8.6), 0, 0, 1, 3), T("plank", (GROUNDS.deck() as THREE.MeshLambertMaterial).map!), M4(4.0, 0, 0));
  chapel(b, -24, -18, 1.1, 0.5);
  flatHouse(b, 14, -1.5, 6, 5, 5.4, "#efc79a", "#2f5ea8", { balcony: true, ry: -0.3 }); flatHouse(b, 19.5, -4, 5, 5, 4.6, "#f1d6a6", "#3f8a5a", { ry: -0.3, awning: "#c2352c/#f3e2b8" });
  flatHouse(b, -11, -0.5, 6, 5, 4.4, "#e9b97a", "#3f6aa8", { awning: "#e0392b/#f6e7c0", ry: 0.25 }); flatHouse(b, -16.5, 0.5, 5, 5, 3.8, "#f3d39a", "#8c3b4a", { ry: 0.35 });
  for (const [x, z, h, l] of [[-6.5, -3.8, 8.6, [0.8, 0.1]], [8.0, -3.6, 9.2, [-1, 0.2]], [-8.6, -4.2, 7.6, [-0.6, 0.3]], [11, -3.4, 7.8, [0.6, 0]], [-30, -12, 10, [0.5, 0]], [30, -14, 9, [-0.5, 0]]] as const) palm(b, M, x, z, h, l as [number, number], Math.round(x * 7));
  { const hb = new Batch(); hill(hb, 0, -330, 230, 26, 60, "#8fb07a", 18); hill(hb, -120, -300, 90, 30, 40, "#9db88a", 19); hb.build(G); }
  for (const [x, z, ry, c] of [[-14, -14, 0.3, "#c8302a"], [16, -16, -0.2, "#2f7fc4"], [24, -22, 0.4, "#3f8a5a"]] as const) rowBoat(b, x, z, ry, c);
  // the quay arch with the date
  b.add(archFrame(2.4, 3.6, 0.5, false), C("#e6dcc8"), M4(-5.6, 0, -4.4)); label(G, labelTex("1510", { board: "#e6dcc8", ink: "#6a4a3a", font: 200, w: 512, h: 256 }), -5.6, 4.35, -4.25, 0.9, 0.45);
  // the stall and all its fruit, crates, baskets; the crate LARANJA DE SINTRA (label is animated)
  fruitStall(b, 0, -1.9, 2.8, "#e86e2a/#f6e7c0", 1100);
  for (let k = 0; k < 4; k++) basket(b, -3.0 + k * 0.6, 0, -0.6 - (k % 2) * 0.5, 0.3, 0.28, true, 1110 + k);
  for (const [x, z] of [[3.2, -2.6], [3.9, -2.0], [-3.6, -2.4], [5.2, -3.4]] as const) crate(b, x, 0, z, 0.8, 0.5, 0.55, x * 0.08, true, Math.round(x * 23));
  barrel(b, 5.8, 0, -2.2); ropeCoil(b, 6.4, 0, -3.8); pot(b, -2.6, 0, 1.6, 1.5, "#c9773e", 0); sack(b, 2.4, 0, 1.5, 1, "#f2c230", 1120);
  marigolds(b, V(-1.6, 2.45, -1.45), V(1.6, 2.45, -1.45), 0.2, 18);
  signBeam(b, -1.0, -1.35, 2.4, 3.44);
  b.build(G);
  sign(R, G, "goa", -1.0, -1.35, 1.6, "SINTRA", 2.75, 0, false);
  return R;
}
export const BUILDERS: Record<string, (G: THREE.Group) => SetRefs> = { india: buildIndia, dunes: buildDunes, serai: buildSerai, souk: buildSouk, sea: buildSea, lisbon: buildLisbon, europe: buildEurope, china: buildChina, sintra: buildSintra, dutch: buildDutch, goa: buildGoa };
void flag; void lam; void label;
