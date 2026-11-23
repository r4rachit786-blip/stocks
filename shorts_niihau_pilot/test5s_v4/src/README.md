# Niihau night test v4 (5 s, 150 f, 1080x1920, 30 fps)

The welcome party and the battery radio, built to the findings in `../STUDY.md`. three.js inside Remotion, on the
"cartoon-3d-short" bridge kit.

## Layout (copy into the root of a Remotion project)
- `niihau4.tsx` -> `src/niihau4.tsx` (entry, composition id `NiihauNight`)
- `videos/niihau4/` -> `src/videos/niihau4/`
- `scripts/` -> `scripts/`; `package.json` lists the dependency versions used.

### Files
- Kit, unchanged: `shade.ts`, `lights.ts` (unused at night), `ink.ts`, `lensblur.ts`, `grade.ts`, `paint.ts`, `cardshade.ts`, `build.ts`.
- Kit, extended: `toon.ts` (v2 costumes + back view, plate, hand at the mouth, "frozen" face, `relight`, sound marks);
  `cards.ts` (generic half of the kit's cast.ts).
- From v2: `set.ts` (house, walls, palms, rocks, tufts), `plane.ts`, `geo.ts`, `paintx.ts`.
- New in v3: `night.ts` (night two-tone + point lights, halo / pool / window-patch pieces), `props.ts` (table, radio,
  battery, lantern, food, torches, lantern strings, ALOHA board, lit windows), `paint3.ts` (their textures and
  lettering), `story.ts` (layout, three framings, cues), `cast.ts` (acting + painted light), `world.ts`, `Niihau.tsx`.

## Render (headless Linux without a GPU: Chromium + SwiftShader, Remotion `gl: "swangle"`)
    mkdir -p <scratch>/remotion-tmp && ln -sfn <scratch>/remotion-tmp /tmp/rmt     # short temp path for Chromium sockets
    node scripts/stills.mjs src/niihau4.tsx NiihauNight out/still/f_ 0,20,45,65,90,120,149 0.5
    node scripts/render.mjs src/niihau4.tsx NiihauNight out/seq4 2
    ffmpeg -y -framerate 30 -i out/seq4/f%03d.jpeg -c:v libx264 -pix_fmt yuv420p -crf 12 -preset slow -movflags +faststart niihau_night_test_v4.mp4
`CHROME=/path/to/chrome` overrides the browser; with a GPU set `chromiumOptions = { gl: "angle" }` in both scripts.

## v4 = v3 with sharp characters
Same staging. Changes: `relight` is a multiply tint (ink stays dark, heads stay white), character canvases have no
mip chain and one more resolution tier, depth of field is 2.5 px in the insert / 0 in the wide / 4.5 px in the pilot
shot with near blur x3 for the over-the-shoulder head only, weaker lantern halos and bloom, vignette 0.3.
A/B test stills: `PROPS='{"post":{"lens":false}}' node scripts/stills.mjs ...` (also `pre`, `bloom`, `grade`, `ink`, `relight`).
Partial re-render: `RANGE=0-56 node scripts/render.mjs ...` (writes 2-digit file names; rename before encoding).
