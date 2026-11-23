# Progress notes (full film)
- Script final (script.txt), voice + word timings done (voice.wav, words.json; edge-tts en-GB-RyanNeural +28 %), 64.5 s / 1935 f.
- Film source: $S/rm/src/videos/film (entry src/film.tsx, comp NiihauFilm). 31 shots in story.ts, cast.ts, world.ts, art2d.ts.
- Audio: audio.py -> stem_music.wav, stem_sfx.wav, premix.wav; mix.wav mastered (-13.9 LUFS, peak -2.0). captions.ass built.
- Render: chunks in $S/rm/out/film/c<range>/f<abs frame>.jpeg (RANGE=a-b node scripts/render.mjs src/film.tsx NiihauFilm out/film/c<a-b> 2).
- final/: SCRIPT.md, CREDITS.md written. TODO: finish render, contact sheets, review, fixes, encode + captions + audio, QA.md, src copy + README.
- review pass 1 done; fixing shots 2,10,13,20,21,23,26,29 (re-render ranges into out/film/fix)
- fix renders merged into out/film/all (symlinks). Next: check fixcheck.jpg, encode with captions+mix, QA.md, copy src.
- final mp4 encoded (captions+mix); sheets rebuilt from the mp4. Next: view captions_check, QA.md, copy src.
- DONE: final mp4, sheets, SCRIPT.md, CREDITS.md, QA.md, src copied to final/.
