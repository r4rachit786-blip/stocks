# QA record: niihau_pilot_short.mp4 (round 5)

## File
1080x1920, 30 fps, 2293 frames, 76.46 s, h264 two-pass 4.6 Mb/s (preset slow, faststart) + AAC 192k 48 kHz, 45.6 MB.
Burned captions (captions_r5.ass, 103 groups of 1-3 words from the word timings; Niihau spelled "Niihau"; no delivery tags).

## Voice
Liam (ElevenLabs via vidIQ), 21 line files, no speed change (no atempo). Leading/trailing silence trimmed; inner pauses
over 0.35 s shortened to 0.30 s (cuts in silence, 10 ms crossfades): 4.2 s removed (measured at -24 dB re each line's
peak; the brief expected about 6 s, and the stated rule only finds 4.2 s, so the film is 76.5 s, not 69-71 s).
Gaps 0.10 s, 0.30 s before lines 8, 11, 18, and 0.90 s before line 4 (the fence crash plays whole in that beat).
faster-whisper small.en on voice.wav, on the master and on the final mp4: every one of the 21 lines is present and in
order (snd/mix6/whisper_final_mp4.txt). Both Niihau lines are heard as "Ni'ihao"/"Mi'ihau": understandable as Niihau.

## Loudness (ffmpeg ebur128 on the final mp4)
| Item | Value |
|---|---|
| Final mix | -14.0 LUFS integrated, LRA 4.8 LU, true peak -1.8 dBTP |
| Accents (crash, gunshots, wall, rock, medal, whooshes, torch) | peaks 6-8 dB under the voice peak (measured per cue; the fence crash raised +4.5 dB, gunshots/whooshes/torch +2.5..4 dB) |
| Music | three picked tracks, -15 dB re voice under speech, -9 dB between lines (raised versus round 4; the round-4 balance was not re-measured on the same scale) |
| Beds | -20 dB re voice under speech, -15 dB between lines; continuous from the census to the museum (wind, sea, crowd, insects, fire, sheep, room) |

## Frame scan (all 2293 frames of the final mp4)
Black frames 0, white frames 0, no frozen runs (longest run of near-identical frames: 2). Cuts are hard cuts; two
blurred whip-pans at 929 and 961; no dissolves.

## Round 5 picture changes checked at full size (sheets/round5_stills.jpg, sheets/takes_r5_1.jpg, takes_r5_2.jpg)
- Framing: the opening is a wide shot from 150 m (whole Zero, pilot in the cockpit, harbour below); pushes reduced and
  several keys widened (dazed pilot, helper two-shot, three shots, gate, medal, plaque). Close-ups only for "mad" and
  the frozen pilot at the radio.
- Pearl Harbor is 3D: Ford Island with airfield and hangars, six different battleships + two destroyers, cranes, oil
  tanks, town, hills; thick smoke columns, fires, flak, other aircraft, haze.
- Props: the pistol is now visible in the pilot's hand (it was drawn outside the 600 px character card) with a small
  muzzle flash on each of the three shots; the torch has a wooden handle, wrapped head and a round flame with glow,
  held apart from the helper's shotgun; papers, shotgun, rock, lamp (lit on "no power" with a match), conch, medal
  checked in their shots.
- "You see" onward: ranch wide with people and sheep, the PRIVATE ISLAND sign at the gate; a new interior set of the
  owners' house (board walls, sideboard, portrait, table with a kerosene lamp, chairs, rug, rocking chair, plates,
  window with the day outside, door with the boat-day calendar) in one lateral travel; medal ceremony medium-wide with
  bunting, 48-star flag and villagers; the submarine shot repainted (gradient sea, soft fine glints, swell lines, foam,
  the empty flying helmet on the bluff); museum banner never cut, the whole plane at the end, extra exhibits and visitors.
- The curtains take was dropped with its line.
- Historical staging: no electric light on Niihau (kerosene lamp, torches, fires, moon); electric spots only in the
  museum. No blood; no real names on screen.

## Known shortfalls
- Length 76.5 s instead of 69-71 s (see Voice).
- In the fight the walk-in at gunpoint plays about 3x fast between "One rancher does not." and "He jumps the pilot."
  (the new script has no time for the capture), and the lift before the throw is quick.
- The owners' room is lit flat by the day key (no strong window light shaft); the rug is still a little busy.
- Characters are flat cards (house style); the battleships are simple block models at close range.

## Previous rounds

## File
1080x1920, 30 fps, 1935 frames, 64.5 s, h264 (crf 18, preset slow, faststart) + AAC 192k, 70.4 MB. Burned captions from the word timings.

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

## Review round 3 (four small defects)
| Item | Result |
|---|---|
| 1 red wing disc read as blood (shots 5-7) | Shots 6 and 7: the two men now stand in front of the nose, clear of the wing; no red marking on the ground near them (the only red left is the warning stripes on a propeller tip in the earth). Shot 5: higher view, the disc sits inside a full wing panel with rivets, panel lines and the wing edge. The "In a fence" caption is raised so it does not cover the disc |
| 2 conch (shot 26, "no phones") | held to his ear in his raised hand; wall dressed with a pinned notice ("NO TELEPHONE ON THIS ISLAND / Send word by the boat"), a shelf and a hat on a peg. The notice is partly cut by the left frame edge but legible |
| 3 curtains (shot 27) | the lantern cap is gone (the lanterns nearest the eave were removed from the string); inside the window a kerosene lamp on the sill and a face peeking that vanishes as the curtains shut on "drawn". Still one window with wall boards and the eave line, not the whole house front; a soft glow disc remains behind the lamp |
| 4 "no boat" (shot 13) | camera pulled back: the old man and the kid are both fully in frame beside the board |

Checks on this final: frame scan black 0, white 0, frozen 0; jumps off cuts are the same six intended ones. Loudness -13.9 LUFS, peak -1.9 dBFS.
Full-size (1080x1920) frames looked at from the final mp4: f325 (shot 5), f389 (shot 6), f1590 (shot 26), f1650 (shot 27); shots 7 and 13 were checked on the reduced strip only.
Side effect to know: removing the eave lanterns changes the lanai set, but the party shots were not re-rendered, so those shots still show them.

## Review round 4 (continuous takes, no dissolves, new opening, sound audition)

**File.** niihau_pilot_short.mp4, 1080x1920, 30 fps, 1935 frames, 64.5 s, H.264 crf 23 preset slow, +faststart, 49.1 MB.
crf 20 as asked came out at 69.6 MB, over the 50 MB aim, so the size limit won; crf 20 can be re-encoded in a minute.

**Sound in this file is the narration only** (-18.7 LUFS integrated, peak -1.0 dBFS: the voice stem at its old level).
The synthesized music and effects are removed. The new mix is not built: the client picks accents and music by ear
from `audition/index.html` first. So the -14 LUFS / -2 dB target is open until then.

**Picture.**
- No dissolves. `src/audio/post4.py` links every rendered frame unchanged; the only frames it rewrites are the 20
  whip-pan frames (736-745, 769-778), which get a horizontal smear of 14-130 px.
- Frame scan (`qa_scan_r4.json`, all 1935 frames after post): black 0, white 0, blend suspects 0 (test: a frame equal
  to the mean of its neighbours while the neighbours differ strongly). Frozen: 1 (frame 84 repeats 83, the first
  frame of the crane dive).
- Takes: 19, of which 9 have travel inside them (see SCRIPT.md). Strips of every travelling take are in `strips/`
  and were looked at: both subjects stay in frame through each move except where noted below.
- Captions: same timings. Two captions ("empty", "island", 1.96-2.86 s) were raised to y 1165 so they sit between the
  thought bubble and the pilot's goggles instead of on his face. Checked on `sheets/captions_check.jpg`.
- Staging check: Zero with red discs on wings and fuselage and the two blue fuselage bands; the harbour is a daylight
  scene; no named people; no casualties, no blood; ships burn and smoke, nothing more. Island scenes: no electric
  light added (nothing changed in the night sets).

**Deviations and weak points.**
- Goggles are up on the brow, not down: with them down the eyes, which carry the acting, would be hidden.
- His own gunfire in the hook (tracers and muzzle flashes of the cowl guns) is off the right edge of the frame at
  this framing; the strafing reads from the dive, the flak and the other aircraft only.
- The harbour is a painted ground card with upright ship cards; the ships are the same two drawings.
- Wall take (1543-1641): four pictures in 99 frames forces about 35-42 px/frame of lateral travel, above the
  29 px/frame guide. The crane moves (84-124, 513-557) and the landing zoom are also faster than a normal glide.
- Landing: the dust is modest; the pilot's leap out of the cockpit (358-372) is a cartoon hop of 5.6 m.
- The wide of the fight (1104-1187) and the last crane of the crash field look over the low stone wall in the
  foreground, as the old shots did.
- Museum: the banner is notched by the light cone at the first frame.
- Not measured this round: per-move peak speed in px/frame from the rendered frames (strips were judged by eye).
- No independent reviewer watched the film in motion; review was on stills and strips.

**Sound pipeline status (client's video-sfx-pipeline skill).**
- Openverse: reachable now. 39 CC0 recordings fetched after confirming the licence on each source page. One
  candidate labelled CC0 by Openverse was CC BY on its source page and was rejected (EXT_Rocks_Impact_Short).
- Real SFX (Clipwing): cloned, `setup.py check` passes, uisfx bundle initialised. Not used yet: placement waits for
  the picks.
- earshot: installed with the listening models; used to rank the audition options per cue (shown on the page).
  The mix critique waits for the mix.
- Mixkit files downloaded earlier in this round are not used anywhere and are not in the repo.

**Round 4 follow-up.**
- Effects locked from the client's picks: fence A, radio A, gunshots C, wall A, rock A, medal A, whoosh C.
- Music round 1 (seven Kevin MacLeod tracks) rejected. Round 2 "cinematic WW2" is at the top of `audition/index.html`:
  4 day, 4 night, 2 ending options (5 CC0, 5 CC BY 4.0, all freesound.org via Openverse, licence confirmed on each
  page; one candidate with no licence link on its page was dropped, as was one titled "Star Wars Style").
- Remaining beds sourced CC0 (fire, torch, sea, sheep, night insects, wind, museum room tone): 14 files, logged.
- Cue list for Real SFX prepared (`src/sound_audition/cues.json`, 35 cues). The mix is still not rendered.
- "In a fence" caption moved down to the normal caption line so it no longer sits on the dazed pilot's chin
  (`sheets/fence_caption.jpg`). File re-encoded, 49.1 MB, picture otherwise identical.

## Final sound mix (after the picks)

**File.** niihau_pilot_short.mp4: picture stream unchanged (crf 23), new audio, 64.5 s video and audio.

**Loudness (ffmpeg ebur128 on the final mp4).** I: -14.0 LUFS  Peak: -1.6 dBFS (sample peak; earshot measures true peak -1.6 dBTP on the decoded AAC). Target -14 LUFS, -1 to -2 dBTP: met.

**How it was built.**
- Music in three blocks at a fixed level (no ducking, so no pump): "Where is the enemy?!" 0:00-0:22.9 (3 dB lower
  under the party), fade out 0.6 s into the radio news; silence over the news and the frozen party (only the night
  insects); "Suspenseful Increasing Dramatic" 0:24.7 (the prisoner) to 0:47.5, stopped with a 0.25 s fade on the
  rock; "Night in street" 0:48.0 to the end, covering the mechanism block and the ending, 1.5 s fade out.
  The mechanism block (0:48-0:56) had no pick of its own, so the ending track starts there.
- Effects: 34 cues placed by Real SFX `mix.py` from an explicit cue sheet (`src/sound_audition/realsfx_sheet.json`,
  every cue names its file and frame; word-locked cues were not moved), `--voice-safe --voice-depth light`.
- Master: voice + music + Real SFX track summed, ffmpeg loudnorm to -14 LUFS.

**earshot critique** (`src/sound_audition/earshot_critique.json`): VERDICT launch-grade, 23 of 23 scored metrics in
range, 0 critical, 0 major. Realness 0.96 (no window leans synthesized). Tips, not fixed: 7 of 25 picture events
have no sound of their own (0:11.2 the dazed close-up, 0:28.4 calendar, 0:51.4 and 0:54.7 wall, 0:56.3 and 0:57.5
medal cut), and a general note to keep effects out of 1-4 kHz under the voice.

**Fix rounds: 1.** The first Real SFX pass put the effects track at -16.9 LUFS, above the voice (-18.7); it was
re-run with the effects 8 dB lower (-24.8 LUFS). Section levels after that (LUFS, voice / music / effects):
opening -18.9 / -29.2 / -29.5; radio silence -18.1 / none / -53; night -19.0 / -28.2 / -23.2; ending -18.3 / -27.7 / -41.

**Music check.** earshot's tagger finds no singing or speech in any of the three tracks (top labels: timpani,
music, theme music, scary music, ambient). No swap was needed. A recognisable theme cannot be ruled out by a tool,
and nobody listened to the tracks or the mix: that check is the client's.

**Weak points.**
- Real SFX warned that two picked recordings are very quiet in their source and were raised a lot (radio static
  +19 dB, the rock +16 dB), so their noise floor comes up with them.
- Three picks are used three times each (gunshot, whoosh, body fall for both touchdowns and the wall).
- In the night block the effects sit only about 4 dB under the voice (fire bed, insects, gunshots).
- Block changes are fades, not cuts on a beat; no beat analysis was done.
- "No luck" (0:16.7) has no sound of its own.

## Mix fix after the transcription check (audio only, picture stream untouched)

Final file: 49.3 MB, 1935 frames, 64.5 s, -13.9 LUFS integrated, peak -1.7 dBFS (ffmpeg ebur128 on the mp4).
- **"In a fence" (10.7-11.4 s) was masked by the fence crash.** The crash is now only its first 0.45 s, low-passed at
  900 Hz and faded from 0.12 s, still starting on frame 320. Measured over 10.67-11.37 s: effects 13.6 dB under the
  voice full band (-36.6 vs -23.0 dB mean) and 17.4 dB under it in 1-4 kHz (-51.9 vs -34.5). The cost: the crash is
  now a short thud, not a long splintering.
- **"Then," (28.4-29.0 s).** Nothing but the night music and the insects plays there. The music is dipped 4.7 dB
  from 28.0 to 29.5 s (0.25 s in, 0.35 s out); in that window it sits 12.6 dB under the voice, the effects 50 dB under.
- **Night beds 3 dB lower** (insects, house fire, plane fire, surf). Between hits the bed is now about 29 dB under the
  voice (34-39 s: -51.4 vs -22.1 dB mean). The block's integrated effects figure stays near -23 LUFS because it is
  set by the gunshots, the wall hit and the rock, which were not lowered (locked picks, on their frames).
- Not re-run: speech recognition (not available here) and the earshot critique.
