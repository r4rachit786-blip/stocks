# Stills gate: verification against the 2d-animation skill's measured targets (orange v2 -> v3)
Method: scripted measurements (orange2/qa/measure.py on the 35 full-size stills in final/sheets/stills_v3/; eye line from
rm/qa/eye.ts projecting each take's lead character's eyes through camAt(), every 3rd frame), plus a frame-by-frame look at all 35.
(No agent-spawning tool exists inside this subagent, so no separate verifier agent could be launched.)

## v3 (after the client's 4 required fixes)
| Area | Target | v2 | v3 | Verdict |
|---|---|---|---|---|
| Luma p2 / p50 / p98 | .10-.13 / .44-.57 / .86-.97 | .115 / .576 / .919 | .110 / .538 / .901 | pass |
| Pixels < 0.10 | <= 2 % | 0.8 % | 1.1 % | pass |
| HSV S median | .43-.48 | .45 | .43 | pass |
| Amber/orange share of chroma | client: <= ~50 % | 64 % | 47 % | pass |
| Periwinkle/violet share | client: >= ~25 % | 14 % | 25 % | pass |
| Azure/cyan | <= 5 % | 1 % | 1 % | pass |
| DOF share of runtime | <= ~13 %, never on text | ~27 % incl. text inserts | ~5 % (bite CU f774-801, Sintra farmer f834-870); no blur on any sign/crate; crate text blur removed | pass |
| Hero face in wides within ~6 f | >= 15-20 % W | WS establishers with small people | Lisbon opens on the sailor (MS, ship behind), square opens 3-shot at 6.4 m (face ~17 % W), T10 opens on the captain at the bow under the sail, Sintra reveal keeps the farmer in the foreground with the palace chimneys and walls above, Goa opens on a kid + porter + merchant at the stall | pass |
| Eye line | 0.42 | median .435 | median .43 (sign inserts excluded) | pass |
| Camels | not toy-like | thin neck, odd head | long S neck, deep chest, peaked hump, long snout + droopy lower lip, heavy lids, laid-back ears, nostrils, knee calluses, fetlocks, padded feet | improved |
| Deck sign flip | reads cleanly | f128 mid-flip | flips in 2 f; every name holds 6-8 f; f130 reads LARANJA | pass |
| Client: no dissolves, <= 2 CUs, on ones | | | 12 cuts + 3 whips, 2 CUs, every frame rendered | pass |

Niihau regression (shared toon.ts edits): Niihau stills f400/f600/f1300 re-rendered and diffed against the approved r7 frames:
mean abs diff 1.0-1.5 /255 (JPEG noise), 0 % of pixels differ by more than 24/255 -> unchanged.

Score: 8.5/10. Remaining softer points: the T10 open shows the ship as deck + sail + sea rather than the whole hull (the whole
caravel is seen at the Lisbon and Goa quays and in T03); the blue-violet cast shadows are strong on pale floors (China, Goa).
