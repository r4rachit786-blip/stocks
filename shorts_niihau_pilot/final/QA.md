# QA record: niihau_pilot_short.mp4

## File
1080x1920, 30 fps, 1935 frames, 64.5 s, h264 (crf 18, preset slow, faststart) + AAC 192k, 68.6 MB. Burned captions from the word timings.

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

## Review round 2 (coordinator's review; audio left untouched)
The coordinator reviewed the sheets and transcribed the mix (narration complete and in order; -13.9 LUFS / -1.9 dBFS confirmed).
Picture fixes made, each re-rendered only in its own frame range and checked on stills by the builder:
| Item | Result |
|---|---|
| 1 caves (shot 18) | rebuilt as a real set: rock floor and boulders, painted cave mouth with moonlit sea, lantern with pool and halo, four worried villagers. Done |
| 2 mechanism (shot 26) | four in-world pictures, one per clause, two of them character-led. Done; the wall behind them is plain boards |
| 3 sea and submarine (shots 13, 29) | sea repainted (smooth gradient, thin swell lines), glitter path remade as fine glints, I-boat silhouette with deck gun, helmet in the foreground, two islanders at the board. Done; water is still simpler than the kit's river shader |
| 4 curtains (shot 27) | one window square-on with patterned curtains closing on the word. Partly: it is a single window, not the whole house front, and a paper-lantern cap intrudes at the top edge |
| 5 burning house (shot 16) | house and fire clear, papers flying, both men facing camera and lit orange; the back-view figures are gone. Done |
| 6 fence (shot 5) | pilot now about 30 % of frame width. Partly: the bent propeller is not in this framing and only a few rails fly |
| 7 medal (shot 28) | large ribboned medal above the caption line, officer's hand, bunting, glint, away from the crash site. Done; no table |
| 8 prisoner (shot 12) | rope on the wrists, guarded with his own pistol, lamp. Done |
| 9 museum (shots 30-31) | wall dressed, spot cones, second visitor, strong final frame (sheets/final_frame.jpg). Done; the photographs are small |
| 10 dissolves | 25 eight-frame dissolves in post; five hard cuts kept. Done |
| 11 captions | checked on the named cases (sheets/captions_check.jpg); the "no phones / no power / one boat a week" captions are regrouped per clause; none covers a face, the medal or on-screen text in the frames checked |

Frame scan on the final mp4 (thumbnails of all 1935 frames): black 0, white 0, frozen runs 0 (minimum frame difference 0.57).
Jumps away from shot starts: 877, 885 (calendar pages), 1292 (face swap), 1573, 1599, 1617 (the cuts inside shot 26). All intended.
Loudness of the final mp4: -13.9 LUFS, peak -1.9 dBFS (unchanged mix).

Still weak after round 2: items 4 and 6 above; the conch floats beside the man's hand rather than at his ear; shots 9 and 11
(party wide) and the chart inserts were not touched; no independent reviewer other than the coordinator; camera-speed and
per-look brightness targets were not re-measured.
