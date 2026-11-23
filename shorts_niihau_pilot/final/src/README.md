# Niihau pilot short: source and render commands

Remotion + three.js on the "cartoon-3d-short" kit. Copy `film.tsx` to `src/`, `videos/film/` to `src/videos/film/`,
`scripts/` to `scripts/` of a Remotion project (dependencies in `package.json`). Audio tools are in `audio/`.

## Picture
    mkdir -p <scratch>/remotion-tmp && ln -sfn <scratch>/remotion-tmp /tmp/rmt        # short temp path for Chromium
    node scripts/stills.mjs src/film.tsx NiihauFilm out/still/f_ 60,325,690,1210 0.34   # test stills
    for r in 0-499 500-999 1000-1499 1500-1934; do RANGE=$r node scripts/render.mjs src/film.tsx NiihauFilm out/film/c$r 2; done
Frames are written as `f<absolute frame>.jpeg`; a chunk that crashes keeps its finished frames. Re-render one shot with
`RANGE=a-b` (frame ranges per shot are in `../SCRIPT.md`). Headless without a GPU: Chromium + SwiftShader (`gl: "swangle"`).

## Sound (run inside `audio/`)
    python3 tts.py en-GB-RyanNeural "+28%" voice/ryan     # free edge-tts voice, one file + word timings per line
    python3 assemble.py                                    # voice.wav + words.json
    python3 audio.py                                       # music + sound effects (all synthesized) -> premix.wav + stems
    ffmpeg -i premix.wav -af "loudnorm=I=-14:TP=-2:LRA=7,alimiter=limit=0.79:level=false" -ar 48000 mix.wav

## Final
    ffmpeg -framerate 30 -i all/f%04d.jpeg -i mix.wav -vf "ass=captions.ass" -c:v libx264 -pix_fmt yuv420p -crf 15 -preset slow \
           -c:a aac -b:a 192k -shortest -movflags +faststart niihau_pilot_short.mp4

## Files in videos/film
story.ts (31 shots: frames, set, look, camera) · cast.ts (staging and acting per shot) · world.ts (four sets, five looks,
light sources) · art2d.ts (map, chalkboard, calendar, signs, cave, pictograms, submarine, plaque, fire) · props.ts (party
set) · set.ts / plane.ts / geo.ts / paintx.ts / paint3.ts (sets and textures) · night.ts (two-tone + point lights) ·
toon.ts / cards.ts (characters) · kit modules unchanged: shade.ts, ink.ts, lensblur.ts, grade.ts, paint.ts, cardshade.ts, build.ts, lights.ts.
