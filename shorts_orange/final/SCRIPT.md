# The orange that changed its name (Santra): final SCRIPT and take list

## Script (v11, as recorded; delivery tags in the line files are not spoken or captioned)
00 This fruit left India... travelled the whole world... and got a new name everywhere it went.
01 In Sanskrit, it was "naranga."
02 Persian traders took it home as "narang"... and named the color after it too.
03 Arabic had no "g" sound. So "narang" became "naranj." Then in Portugal: "laranja."
04 In Europe, "a narange" slowly turned into "an orange"... the N just fell off.
05 Then the Portuguese sailed to China... and found a sweeter one, sweet enough to eat like candy.
06 They grew it in a little town called Sintra... and Europe went crazy for it.
07 The Dutch still call it "China's apple."
08 In the 1500s, Portuguese ships brought it to India... as the orange from Sintra.
09 Now say "Sintra" ten times fast...
10 Santra! That's still the Hindi word for orange today.
11 So... what do you call it?

Voice: Liam (ElevenLabs via vidIQ), 12 line files. Built by pipeline/assemble.py: leading/trailing silence trimmed;
inner pauses over 0.35 s cut to 0.30 s (measured at -20 dB re each line's peak), the [pause] after "Santra!" kept at
0.5 s; lines joined with 0.10 s gaps, 0.35 s before line 09 (the whisper) and 0.25 s before line 10; then atempo 1.2
(pitch kept). 47.02 s, 1411 frames at 30 fps. Word timings: faster-whisper small.en on the final voice
(pipeline/words.json -> gen_timing.py -> src/videos/orange/timing.ts). Every cut and action is keyed to a word name in
timing.ts, so a new voice re-times the film by re-running gen_timing.py.

## Take list (frames at 30 fps on the final film; animated on twos: 706 rendered frames, each held 2 output frames)
Hard cuts between takes; one blurred whip-pan out of the souk into the Portuguese quay ("Then in Portugal").
One travelling idea: the fruit and the hanging NAME SIGN change at every stop.

| Take | Frames | Line | Place | What happens |
|---|---|---|---|---|
| Hook | 0-51 | 00 | India, an orange orchard | Wide: a merchant in a turban walks out of the orchard holding a glowing orange; the NARANGA sign hangs on a post at the edge. |
| Montage | 52-97 | 00 "travelled the whole world" | Persia, Portugal, Europe | Three quick hard cuts, one per word: the caravan town, the quay with the caravel (LARANJA), the town square (A NARANGE). |
| India | 98-221 | 00-01 | the orchard | Back home: a Sanskrit scholar with a palm-leaf manuscript beside the merchant; travel left to the scholar on "Sanskrit"; sparkle on the NARANGA sign. |
| Persia | 222-332 | 02 | caravan town: domes, sand, camels | Camels and a trader arrive; travel right to the painter, who repaints the sign to NARANG; on "named the color" he paints an orange swatch on his easel. |
| Arabia | 333-463 | 03 | a souk | The merchant tries the "g" (speech bubble "g ?"), the sign flips over to NARANJ. Whip-pan out on "Then". |
| Portugal | 464-510 | 03 | the quay, a caravel alongside | Sailors with crates of oranges under the LARANJA sign. |
| Europe | 511-682 | 04 | a town square | A NARANGE; on "the N" the N pops off its word, arcs over and drops beside the A with a clink (a nail falls out of its old place): AN ORANGE. |
| Open sea | 683-740 | 05 | the caravel sailing east | Camera tracks the ship across the swell. |
| China | 741-831 | 05 | a port: red houses, jade roofs, a pagoda, lanterns | A sailor holds a sweet orange; sparkle on "sweeter"; stars on "eat like candy". |
| Sintra | 832-952 | 06 | a hill town: the palace, orange groves | Slow crane from the palace down to the fruit cart and the SINTRA sign; on "Europe went crazy" a crowd rushes the cart. |
| The Dutch | 953-1026 | 07 | canal houses with stepped gables | Stall sign SINAASAPPEL = "CHINA'S APPLE"; an orange with a little red flag sticker on the counter. |
| India, 1500s | 1027-1338 | 08-10 | the port, a Portuguese ship | Ship at the quay; down to the fruit stall and the crate stencilled LARANJA DE SINTRA. Whisper: the seller mouths "Sintra Sintra Sintra" faster and faster (bubble), the camera pushes in slowly, the crate letters blur. "Santra!": a pop, the sign snaps from SINTRA to SANTRA, the stall fills with oranges, wide again. |
| Ending | 1339-1410 | 11 | the port at golden hour | The full chain of names on two ropes over the street (NARANGA, NARANG, NARANJ, LARANJA, ORANGE, SANTRA); the camera pulls back. |
