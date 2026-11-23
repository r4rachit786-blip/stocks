# QA record: niihau_pilot_short.mp4

## File
1080x1920, 30 fps, 1935 frames, 64.5 s, h264 (crf 16) + AAC 192k. Burned captions from the word timings.

## Loudness (ffmpeg ebur128 on the final mp4 / stems)
| Item | Integrated | Notes |
|---|---|---|
| Final mix | -13.9 LUFS, LRA 1.8 LU, peak -1.9 dBFS | target -14 LUFS, about -2 dB peak. Peak is sample peak from ebur128; true peak was not measured separately |
| Voice stem | -18.7 LUFS (before mastering) | |
| Music stem | -35.1 LUFS | 16.4 LU under the voice (target about 17), ducked a further 45 % under speech |
| SFX stem | -24.0 LUFS | cues placed on the frame of the illustrated word (table in CREDITS.md) |
Audio and picture are the same length (64.50 s).

## Frame scan (all 1935 frames, before the caption burn)
- Black frames: 0. White frames: 0. Frozen runs of 3+ frames: 0 (minimum frame-to-frame difference 0.26 grey levels: every frame moves).
- Jumps away from cuts: frames 877 and 885 (calendar pages flipping, intended) and 1292 (the rancher's face swap on "mad", intended).

## Review
There was no way to start a separate reviewer agent in this session (no local agent tool; cloud sessions cannot see the
scratch project), so the "fresh reviewer" pass was NOT done. What was done instead: two passes by the builder over
contact sheets with three frames per shot (sheets/sheet_1..4.jpg), against STUDY.md and the reference frames.

Pass 1 (one still per shot) found and fixed: chart inserts framed too tight (text cut); helper / man / guards cut by the
frame edge in shots 7, 8, 12; "NO BOATS" board too small; calendar, cave and pictogram cards sitting behind the desk;
fire cards drawn upside down (striped block); house shot too close to show the curtains; medal out of frame; museum
framing; the kid's face hidden behind the radio (he is now taller and beside it).
Pass 2 (full render) found and fixed by re-rendering seven frame ranges: man half out of frame in shot 2 (removed);
kid's face cut in the radio insert; wife out of frame and group too wide in the capture shot; rancher cut in the
three-shots picture; the throw unreadable (pilot now held over the rancher's head, then leaves frame right);
pictograms tiny (now stacked large); captions crossing the rancher's mouth in his close-up (moved lower, larger).

## Historical staging check
- No electric light on the island: lanai lanterns are paper candle lanterns on cord; windows and doorway glow from
  kerosene lamps; kerosene lantern and battery radio (dry cell shown) on the table; torches; fires; moon. All flames
  flicker. Electric light only in the chart insert (off-island briefing) and the museum. The calendar insert has a warm
  lamp pool with no fixture shown.
- No power lines or bulbs in any island set (the only pole with wires is the crossed-out "no power" pictogram).
- Zero: grey-green, black cowl, plain red discs on wings and fuselage, two blue fuselage bands, no lettering.
- Clothes: flying cap, goggles, scarf, flight suit; straw hat and checked palaka shirt; cotton dresses; braces. The museum visitor wears a modern cap and T-shirt.
- No real person is named in picture or sound. Text on screen: OAHU, KAUAI, NIIHAU, EMPTY, PRIVATE, NIIHAU POPULATION 136,
  DECEMBER 1941 + day numbers, NO BOATS / BY MILITARY ORDER / ALL SAILINGS CANCELLED, ALOHA, radio dial (KILOCYCLES,
  KGMB HONOLULU, TUNE, VOL), battery label, 1 x WEEK, PACIFIC WAR GALLERY / HAWAII 1941, museum plaque.
  The "NO BOATS" board is a story device: the sources say the islanders did not know about the ban.
  "KGMB Honolulu" on the dial is a real station of the period; that it was the station heard on Niihau is not verified.
- Violence: no blood or wounds; the three shots are three flashes; the rock lands below the frame; the helper's death is omitted.

## Known weak points (not fixed)
1. No independent review and nobody has listened to the mix: sync is by cue frames only.
2. Cuts are all hard cuts; the 8-frame dissolves on sentence onsets were not built.
3. Sound effects and music are synthesized, not real recordings (see CREDITS.md for why).
4. The pilot is small in the crash wide (shot 5); the sea in shots 13 and 29 has blocky white marks; the pictogram and
   calendar inserts sit on a plain wood-grain wall; the two back-view figures at the burning house read as dark shapes.
5. Narration is a British TTS voice at 3.9 words/s (top of the 3.3-4.0 range); "Niihau" is spoken from a phonetic respelling.
6. The glide speed targets and the per-look luma targets from the kit were not re-measured on the final film.
