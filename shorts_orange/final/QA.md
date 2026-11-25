# QA record: orange_santra_short.mp4

## Files
- orange_santra_short.mp4: 1080x1920, 30 fps, 1411 frames, 47.03 s, H.264 two-pass 6.5 Mb/s + AAC 192k, 39.7 MB.
- orange_santra_short_HQ_upload.mp4: the same picture and sound at 12 Mb/s (72.3 MB).
Burned captions (pipeline/captions.ass, 71 groups of 1-3 words, same style as Niihau) from the whisper word timings,
spelled naranga, narang, naranj, laranja, Sintra, Santra. No title cards: all names are lettering on the signs.

## Voice
Liam (ElevenLabs via vidIQ), 12 line files, assembled then atempo 1.2 (pitch kept): 47.02 s. The brief expected
44-46 s; cutting inner pauses by the stated rule (> 0.35 s -> 0.30 s) only removes 2.0 s at a -20 dB threshold, and a
stricter threshold would clip soft word ends, so the film is about 1 s longer than the target.

## Whisper check (faster-whisper small.en on the final mp4)
All 12 lines present and in order. "Santra!" is heard as "Santra" (an earlier, louder pop on it made whisper hear
"Sintra": the pop was lowered and moved 0.15 s earlier). Whisper writes "laranja" as "Larenja", "a narange" as "a Narang"
and "the N" as "the end" (homophones; the captions use the script spelling).

## Loudness (ffmpeg ebur128 on the final mp4)
-16.0 LUFS integrated, LRA 2.1 LU, true peak -3.3 dBTP. Niihau round 6c levels: music -19 dB re voice under speech,
-13 dB between lines; beds -24 / -19 dB; the loudest accent 8 dB under the voice peak.

## Frame scan (all 1411 frames)
Black 0, white 0. Animated on twos, so every rendered frame is held for 2 frames; no longer still runs (an 11-frame
static opening of the Sintra take was given a slow crane and re-rendered).

## Checked at full size
The hook (merchant, glowing orange, NARANGA sign in frame), the N falling off (A NARANGE -> AN ORANGE), the whisper (bubble
"Sintra Sintra Sintra", crate letters blurred) and the SANTRA reveal (pop, stall filled), the ending (all six names on
two ropes, the stall below). Contact sheets: sheets/takes_1.jpg, takes_2.jpg.

## Known weak points
- Characters are small in several wide shots (the hook, Sintra, the ending), by the wide-framing rule.
- The caravel's hull is a simple flat-sided block; the sails and the red cross carry the read.
- The China take is generic (red walls, jade roofs, a pagoda, lanterns); the Persian painter's swatch is a plain board.
- The palm-leaf manuscript held by the scholar is small on screen.
- On twos the whip-pan and the walking are a little steppy (by design, for render speed).
