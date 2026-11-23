# Niihau look test v2 (5 s, 150 f, 1080x1920, 30 fps)

One shot, three.js inside Remotion, built on the "cartoon-3d-short" bridge kit (MIT).

## Layout (put this folder's contents in the root of a Remotion project)
- `niihau.tsx` -> `src/niihau.tsx` (entry, composition id `NiihauShot`)
- `videos/niihau/` -> `src/videos/niihau/`
- `scripts/` -> `scripts/`
- `package.json` lists the dependencies that were used (remotion 4, three 0.169, @react-three/fiber 8, postprocessing 6).

### Kit modules, unchanged copies
`shade.ts` (twoTone) · `lights.ts` (day preset) · `ink.ts` (InkPass, NOINK) · `lensblur.ts` · `grade.ts` · `paint.ts` (ctex, cloudHD ...) · `cardshade.ts` · `build.ts` (only `Batch`, `lam`, `boxGeo` are used)

### Kit modules, extended or stripped
- `toon.ts`: kit file plus the costumes and faces for this shot (flying cap + goggles, scarf, straw hat, long hair + flower, lei, palaka check, braces, stripes, dress print, round eyes, "confused / hesitant / cheer / wow", raised waving arms in front, side and seated views, smoke puff, sheep, dust).
- `cards.ts`: the generic half of the kit's `cast.ts` (canvas pool, Actor / Fx cards, blink timing, day contact shadow).
- `world.ts`, `Niihau.tsx`: stripped copies of the kit's `world.ts` / `Bridge.tsx` (same sky shader, light rig, post chain).

### New for this shot
`story.ts` (layout, camera, lens, cues) · `cast.ts` (who does what on each frame) · `plane.ts` (the Zero) · `set.ts` (ground, walls, fence, palms, kiawe, house, windmill, tufts) · `geo.ts` (lofts, limbs, rocks) · `paintx.ts` (painted textures)

## Render (headless Linux, no GPU: Chromium + SwiftShader via Remotion's `gl: "swangle"`)
Chromium's socket path must stay short, so the scripts use `/tmp/rmt` as temp dir; make it a symlink to a big folder first:

    mkdir -p <scratch>/remotion-tmp && ln -sfn <scratch>/remotion-tmp /tmp/rmt
    # stills (frames, scale):
    node scripts/stills.mjs src/niihau.tsx NiihauShot out/still/f_ 0,30,60,100,149 0.5
    # full image sequence, 2 browser tabs:
    node scripts/render.mjs src/niihau.tsx NiihauShot out/seq 2
    # encode (silent):
    ffmpeg -y -framerate 30 -i out/seq/f%03d.jpeg -c:v libx264 -pix_fmt yuv420p -crf 17 -movflags +faststart niihau_look_test_v2.mp4

`CHROME=/path/to/chrome` overrides the browser. On a machine with a GPU use `chromiumOptions = { gl: "angle" }` in both scripts.
