# QA: Orange / santra (v2 rebuild, final)

Files: orange_santra_short.mp4 (1080x1920, 30 fps, 47.03 s, 43.5 MB, ~7.4 Mb/s two-pass) and orange_santra_short_HQ_upload.mp4 (12 Mb/s, 71.8 MB).

## Stream
```
stream|codec_name=h264|width=1080|height=1920|r_frame_rate=30/1|nb_frames=1411
stream|codec_name=aac|r_frame_rate=0/0|nb_frames=2205
format|duration=47.033333|size=43482417|bit_rate=7396017
```
1411 video frames = the locked voice length (47.03 s). Rendered on ones (every frame), 4 parallel chunks; Europe speech-bubble range f545-635 re-rendered after the first QA pass.

## Black / freeze scan
ffmpeg blackdetect (d 0.1 s, pix_th 0.10) + freezedetect (n 0.003, d 0.4 s): **0 events** (orange2/qa/scan.txt).

## Loudness (whole mp4)
Integrated **-16.04 LUFS** (target -16), true peak **-3.26 dBTP**, LRA 1.9 LU.
Mix (final_mix.py -19 -13): music -19 dB re voice under speech / -13 between lines (ducked); beds -24 / -19; accents peak -8.0 dB under the voice peak. Voice unchanged.

## Whisper small.en on the final mp4 (all 12 lines present)
```
This fruit left India, traveled the whole world, and got a new name everywhere it went.
In Sanskrit, it was Naranga.
Persian traders took it home as Narang, and named the color after it too.
Arabic had no g sound, so Narang became Naranj.
Then in Portugal, Larenja.
In Europe, a Narang slowly turned into an orange.
The end just fell off.
Then the Portuguese sailed to China and found a sweeter one, sweet enough to eat like candy.
They grew it in a little town called Sintra, and Europe went crazy for it.
The Dutch still call it China's apple.
In the 1500s, Portuguese ships brought it to India as the orange from Sintra.
Now say Sintra ten times fast.
Santra!
That's still the Hindi word for orange today.
So what do you call it?
```
Whisper's slips ("Larenja", "a Narang", "The end just fell off", "traveled") are the same as on the voice alone: the voice is locked.
Captions use the script spellings: naranga, narang, naranj, laranja, narange, Sintra, Santra, China's apple (captions.ass, 1-3 words, Niihau style).
The whisper-CU captions (39.3-41.4 s) are lifted off the LARANJA DE SINTRA crate so the joke stays readable.

## Picture checks
- Spot frames from every take of the final mp4: sheets/spot_final.jpg; every 12th frame: sheets/takes_v2_1.jpg, takes_v2_2.jpg.
- Stills gate v3 (client fixes): sheets/stills_v3.jpg + stills_v3/ (35 full frames). Metrics on those stills: ALL p2 0.110 p50 0.538 p98 0.901 below.10 0.011  S median 0.43 | hue share (chroma-weighted): amber/orange 15-60 0.47 | red 340-15 0.17 | yellow-green 60-90 0.00 | green 90-165 0.05 | azure/cyan 165-210 0.01 | periwinkle-violet 210-300 0.25 | magenta 300-340 0.04
- Transitions: 12 hard cuts on line onsets + 3 whip-pans (f50, f82, f464) with a horizontal motion smear in post; no dissolves.
- CUs: 2 (the bite f774-801, the whisper creep f1176-1245). DOF only on the bite CU and the Sintra farmer MS (~5 % of runtime), none on text.
- Niihau regression for the shared toon.ts additions: Niihau f400/f600/f1300 re-rendered vs the approved r7 frames, mean diff 1.0-1.5/255, 0 px > 24/255.

## Known soft points
- The tween between the trader and the dyer (f283-300) and between the stall WS and the sailor (f1080-1095) are camera travels with no face for ~15 f.
- The square bubbles sit over the top of the A NARANGE sign for ~0.8 s each (both readable).

## v5 flicker investigation (client: souk rugs/banners, serai cloth + bricks)
Method: 10 consecutive full-res frames per set (bazaar, serai, souk, square, China, Goa) through the final post chain (MSAA + ink + bloom),
(a) camera locked, (b) a slow real camera move (12 % speed, sub-pixel drift, so true motion cannot fake flicker), each run with the
pre-fix build (props `v4`) and the fixed build. A pixel "flickers" if its luma jumps >12/255 with an alternating sign >= 3 times in 10 frames.
Causes found, in order of size:
1. Z-fighting: the souk's hanging rugs were coplanar with the arcade wall face (z -4.30 = wall front); the serai's sat inside the wall.
   Fix: rugs 6 cm (souk) / 7 cm (serai) proud of the wall. Souk wall band: 11.08 % -> 0.04 % of pixels.
2. The v4 motion preview was rendered with MSAA OFF, so every thin edge (brick courses, cloth hems, bunting) crawled. The v5 preview
   and the final use MSAA 4 (the ink pass edges are then stable).
3. Ink pass toggling on sub-1 % depth steps (litter decals, far detail): ink now starts at a 2 % depth jump and fades out 60-170 m;
   ground litter is off the ink layer.
4. Shadow-map shimmer: the sun's shadow camera followed the moving camera; it is now fixed per take.
All world textures are mipmapped with anisotropy 16 (A/B showed no change: they already had mipmaps).
After the fixes the remaining "flicker" pixels in the locked runs are animated characters (walk cycles, blinks, the camels' legs).
Numbers: final/preview/flicker_numbers.md.

## v6 stills gate (no full render)
- Per-take luma (47 stills, final post chain): see scratchpad qa/luma_v6.txt. Hook p50 0.42, end 0.39, China 0.27, sail 0.22; all others 0.37-0.52.
- Hero table: qa/camera_table_v6.md (deck 22 % -> 51 %, sail 23 % -> 50 %).
- Supersample 1440x2560 measured at 1.0-1.2x the 1080 render cost -> adopted; lanczos + unsharp 5:5:0.6 in encode.

## v7 stills gate (no full render)
- Key-sign safe-area check (every non-whip frame, corners projected through the real camera): 0 of 14 signs cut. Table: scratchpad orange2/qa/signs_v7.md.
- Luma over the 48 v7 stills: p2 0.110, p50 0.337, p98 0.863 (references 0.091 / 0.333 / 0.905).
- Post chain: 1440x2560 render -> lanczos 1080x1920 -> captions. Unsharp removed (edge energy already ~2x the references).

## v8 stills + flicker test (no full render)
- 0 of 14 key signs cut (sheets/signs_v8.md). Luma over 48 stills: p2 0.110 / p50 0.329 / p98 0.863.
- Flicker test clips and numbers: preview/flicker_v8/ (flicker_numbers.md).

## FINAL v8 (rendered 2026-11-25)
- Files: orange_santra_short.mp4 (43.5 MB, 7.4 Mb/s two-pass) and orange_santra_short_HQ_upload.mp4 (71.9 MB, 12 Mb/s). 1080x1920, 30 fps, 1411 frames on ones, 47.03 s, AAC 48 kHz.
- Picture chain: every frame rendered at 1440x2560, lanczos to 1080x1920, no unsharp; whip smear on the 3 whip-pans (post.py); captions burned (captions.ass, standard band only).
- Black/freeze scan (blackdetect 0.1 s, freezedetect 0.4 s): 0 events.
- Loudness: -16.04 LUFS integrated, true peak -3.26 dBTP, LRA 1.9 (approved mix masterq.wav, unchanged).
- Whisper re-transcription of the final matches the locked v11 script line for line (ASR spellings "Larenja", "a Narang" are the known model spellings of laranja / a narange).
- Sign check over the whole render (14 key signs, every non-whip frame of every take): 0 cut. sheets/signs_final_v8.md.
- Luma of the final mp4 (every 3rd frame): p2 0.122, p50 0.322, p98 0.863 (refs 0.084 / 0.333 / 0.917).
- Flicker: preview/flicker_v8/ (before/after clips, numbers, maps); slowed-camera aliasing <= 0.3 % on static sets.
- Sheets: sheets/spot_final_v8.jpg (3 frames per take from the final mp4), sheets/final_v8_every6.jpg (every 6th frame), sheets/stills_v8.jpg.
- v8b blockers cleared before render: Goa duplicate sailor (restyled docker, moved 4 m away), floating "hexagon" (the caravel stern lantern now sits on a post; Goa stall lanterns hang from the sign beam on cords), second moon (a night cloud lobe; clouds off at night), Goa grey slabs (sails furled at the quay).
