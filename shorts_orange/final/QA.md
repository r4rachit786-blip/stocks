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
