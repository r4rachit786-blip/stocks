# Reference study for v3 (what the references actually do)

Looked at: contact sheets short01, 02, 03, 05, 08, 12, 14, 17 (60 frames each) and all 38 frames in
`references/frames`. Read: lighting.md 2, 3, 5, 6, 10; depth.md 1, 3, 4, 5; motion.md 0, 2, 3, 6; textures.md 0, 4, 6;
characters.md 1; grade.md 2. The videos themselves could not be fetched, so camera motion is from motion.md plus what
neighbouring sheet frames show. Numbers are the reports' measurements; "seen" lines are my own reading of the images.

## A. Light sources
- **Every night / interior frame has its source on screen.** Seen: green pendant lamp over the shop counter (08),
  bare bulb over the betting desk (02), ceiling domes (17), wall lanterns on the ship (01), candles on the war table and
  the forge mouth (14), street lamps + rows of yellow windows (03), shop window wall of light (05), moon disc (08, 14, 11),
  headlamp on a cap (07), sign boards with their own lamps (05 "we buy summers", 19 "prize hall").
- **A source is three things at once:** (1) a small near-white core, (2) a broad flat halo, (3) a pool or pattern on the
  nearest surfaces. Examples seen: pendant = cone of lighter wall + bright ellipse on the counter; street lamp = disc on
  paving; shop window = warm trapezoid on the pavement and on the faces in front of it; candle = orange disc on the map and
  on the two heads leaning in; blinds = diagonal stripes over desk, wall, papers and the character (08 rows 5-6, 20_0180);
  window = light rectangle with the window cross on wall/face (lighting.md i08, i10).
- **Glow sizes** (lighting.md 6, px at 720 wide; core / r50 / r10): street lamp 4-8 / 12 / 18-42; lit window 8 / 34 / 114;
  paper lantern 24 / 42 / 46; moon 10-20 / 30-38 / 64-144; sconce 32 / 68 / 204; bare bulb 10-30 / 18-34 / 66-78;
  candle 6 / 42 / 174. Halo is flat: excess 0.25-0.5 at the edge, still 0.15-0.4 at +20 px, e-fold 14-21 px (depth.md 3).
  Colours: lamp core #ffeac8, halo #e1baac-#e9bf8a; lantern #fac777 / #efb56a; moon #e6eef7 / #bdd4f7.
- **White things do not bloom** (heads, clouds): hot edges are the crispest in the frame. Bloom = emissives only
  (threshold 1.0, 6 levels, radius 0.6, HDR x3, sparks x8) plus an additive halo sprite for big sources.
- **Warm / cool split.** Night = ultramarine everything (shadows hue 239 deg at strength 0.86, mids 242 deg), warm only
  where a source reaches. Night sand under a warm lamp: lit #a77065, shade #765161 (shade/lit .47 .51 .91): the shadow is
  the cool ambient, not black. Light patches are colour REPLACEMENTS (yellow patch on a green wall: blue x4.85), not a
  brighter version of the wall.
- **Night exposure** (grade.md): median luma 0.243, p5 0.087, p95 0.67, p99 0.82; 61 % of pixels below 0.3 yet never
  black; saturation median 0.61 (highest of all light types); vignette corner/centre 0.46 (day 0.86).
- **Night fog** is violet (#877aea); distant things fade into it. Moon scenes: big pale disc, soft halo, pink-violet band
  at the horizon (08 row 2-3), glitter path on water, silhouettes in front.
- **One colour identity per scene** (seen): shop green + red counter; claims office teal; waiting room yellow; night
  street ultramarine + amber; casino red + gold; forge orange + black; blueprint table blue + candle orange.
- Day key: side or 3/4 back (az 50-100, el 40-55), shadows about 0.5 x lit keeping the surface hue. Not used in v3.

## B. Camera
- **Shot mix** (depth.md 4.1): inserts 22 %, MS 27 %, FS 28 %, CU 3 %, WS 12 %, EWS 8 %. A prop insert opens or
  punctuates most beats (ticket, meter, dial, button, phone on table).
- **Heads are big.** MS: head top at y 0.35 (0.25-0.38), body cut at ~0.8. Seen: in MS/CU the head is 30-60 % of frame
  width (08 clerk 45 %, 05 kid 55 %, 17 gambler 40-50 %); even in full shots 12-20 %. v2's 9 % pilot was far below this.
- **Foreground element in 38 % of MS/CU:** blurred back of a head / shoulder / hat brim / prop at 0.3-0.5 x focus
  distance covering 10-25 % of a frame edge (08 customer's brown hair, 05 hooded figure, 17 red stool, 03 guard shoulder).
- **Lens height:** eye level 82 %, median 0.79 x character height; low angle 3 %, top-down 3 %, high 11 %. Seen: the
  wides that feel rich are low wide-angle with strong floor perspective (05 pavement, 08 tiled floor, 03 plaza) and
  inserts are near top-down or raking low over a table top. Horizon y 0.45 (0.39-0.50).
- **Roll:** 3.2 roll moves per 10 s, median 3.6 deg over 18 f (p75 8 deg); frames sitting tilted are rare (2 %) but tilted
  inserts are common in the sheets (08 ticket, 17 slot buttons, 05 ledger).
- **Moves:** symmetric ease-in-out, ~10 f in / ~10 f out, ~23 f typical, peak 14-16 px/f at 720 (p75 25); one move covers
  ~100 px and ~23 % zoom. Big crane pull-backs take 45 f up + 60 f down (peak 4.6 %/f). Never a static frame: push-in
  0.14 %/f median (p75 0.34), 0.6 %/f on punch beats. No hand-held float. Cuts only on big jumps; whips rare and blurred.
- **DOF** is a per-shot choice: on in ~1/3 of shots; CU/MS/inserts background blur radius ~12 px at 1080, foreground
  15-24 px, wides sharp. Focus on the eyes.

## C. Set dressing and detail
- **Flat colour fields + thin painted detail.** Surfaces are 2-3 flat tones; painted lines (board gaps, joints) only 3-5 px
  at 1080; textures are magnified at most 2-6 screen px per texel, so detail stays crisp. Nothing below L* 19 except ink.
- **Legible text everywhere** (seen): "KYLE" name tag, "REEL BIG CASH" ticket with numbers, "OUR WINNERS", "PRIZE CLAIMS",
  "BAIT - GAS", "HOT SHOT", "CARCASS / KEEP FROM FLAME", "SHOT", "STORM OIL", "LUCKY 7s", "YEARS AT WAR 099",
  "HAPPINESS" dial, odds board "MILK RUN 100-1", "CRASH SURVIVORS TUESDAYS 7PM". Hand-lettered, bold, 1-3 words, usually on
  the prop the beat is about.
- **Floor patterns carry the perspective:** teal/white checker (08, 05 barber), speckled terrazzo with confetti dots (08
  waiting room), plank floors with nail heads, radial paving rings (03), litter of betting slips (02).
- **Walls are dressed:** poster grids, framed pictures in rows, pin boards, clocks, calendars, shelves of coloured boxes,
  wallpaper pattern, wainscot. Tables hold 5-10 specific props (phone, cards, chips, plates in 04_0180).
- **Prop density:** an MS frame holds roughly 15-30 separately readable objects; an insert shows one hero prop with
  5-8 parts (dial + needle + screws + label + cable).
- Ink on the world is thin (~3 px at 1080 wide), only silhouettes / depth jumps / creases; at night it reads dark navy.

## D. Characters
- Proportions: adult 3.5 head heights (torso 1.1, legs 1.4), torso width 0.8 head width; kids 2.7-3.0.
  Head H/W 0.93, slightly pointed crown, fuller jaw, chin taper, bulge to the facing side.
- Limbs: single thin dark strokes (~0.055 head width), ink-dot hands, no feet detail beyond a dash.
- Outline: plum #201628-#2f1d28, 5 % of head width, thick/thin 3:1, thickest bottom-right (away from light).
- **Heads are white, not skin** (fill #fef9f6, luma 0.93-0.97 in every light), so they show the light colour: day #f8f1ef,
  warm lamp #fcdfbd, moonlight #b1ace7 / #edd9f7, window light #d9b5e7; saturation 0.03 day -> 0.21 night. Never below
  V 0.86. Side gradient ~14 % toward the key, top a little brighter, soft lavender crescent on the far side, no rim line.
- Eyes: default lidded half-discs (deadpan), dot ovals, or two white circles 0.21-0.24 head width almost touching with
  small pupils (used for worry / shock, and they dart). Eye spacing 0.26. Brows thick tapered, often one raised.
  No blush, no catchlights. Sweat drop for nerves (seen in 03, 08, 02, 12).
- Animation: on ones; no idle loops, standing figures are frozen until their acting beat; expression swaps are instant
  and land 0-3 f before the word, hidden by a 4-frame blink; blinks every 0.5-2.3 s.

## E. What this means for the v3 shot
1. Night party: ultramarine base (median luma ~0.25), every warm thing a visible emissive with core + halo + pool:
   kerosene lantern, radio dial, tiki torches, string of paper lanterns, house windows with window-shaped patches, moon.
2. Characters get the light painted in: lavender on the moon side, cream-orange on the side of the nearest source.
3. Three shot sizes like the reference: prop insert (radio) -> low wide-angle reveal -> MS of the pilot with a blurred
   over-the-shoulder head; heads 30 %+ of frame width in the insert and the MS.
4. Moves: one ~40 f symmetric glide with a few degrees of roll, pushes on every hold, one hard cut on the big jump.
5. Dressing: checked cloth, woven mat, wood grain, labelled battery, numbered dial, "ALOHA" sign, food, bottles, ukulele.
6. Acting: frozen figures, single beats (grin -> shock, heads turn, eyes dart), blinks; no perpetual waving (v2's mistake).

## Camera travel between subjects (round 4 re-study: motion.md 2, 5.1, 5.4; sheets short03, short08, short14)

1. One location = one take. short03 stays in the dome plaza for the first 11 pictures: two-shot at the button, crane
   back and up to the whole town, drop to the guard, then up the ladder. short14 holds the bridge for 9 pictures and
   only then cranes away over the river. short08 goes customer -> counter -> ticket -> clerk without leaving the shop.
2. Travel types seen: lateral truck or pan between two people standing side by side (short08 clerk/fisherman,
   short14 king/smith), crane up-and-back to reveal the place (short03 "town is around it", short14 "each finally"),
   tilt or dive down onto a prop lying flat (short08 ticket on the counter, short14 map and blueprint), and a push
   that ends as a close-up (short03 button glass, short08 clerk face).
3. Size of a move: mostly small, about a seventh of the frame (median 101 px at 720p, zoom 23 %). The big reveals are
   cranes, which take much longer: about 45 f speeding up and 60 f slowing down (short03 51 s).
4. Duration and ease: symmetric ease-in-out, attack 10 f, release 10 f, typical length about 23 f; peak 14 px/f median,
   25 px/f at p75 (720p; about 21 and 37 px/f at 1080p). The speed half-width is over 20 f, so nothing snaps.
5. Between moves the camera never stops: a slow dolly push (0.14 %/f median, 0.34 %/f p75) runs through every hold,
   and about 0.6 %/f for a second on the punch word.
6. Mid-move both subjects are in frame. In the sheets the subject being left slides to the edge while the new one
   enters (short08 "shrugs": the clerk's back of head stays as foreground while the fisherman lands). The move is
   never through empty set.
7. Landing: the new subject arrives on or just before its word, large and centred in the upper two thirds, with
   the caption band clear of the face. The move starts roughly half its length before the word, then the push takes
   over, which reads as a small settle. Focus is on the landing subject, never racked mid-travel.
8. Acting covers the travel: the person being left freezes in a held pose, the person being reached starts an action
   on landing (short14: the king's spear thrust lands as the camera does).
9. Location change: a hard cut on the sentence onset (short08 shop -> yacht -> truck -> prize office are all
   cuts), or a rare whip, 45-93 px/f at 720p for 7-25 f with a 2-3 f ramp and always smeared (0.45 per minute).
   The references also use a few light washes (short03 night -> morning, short14 forge flash); the client has ruled
   out every blended frame, so we use cuts and at most two blurred whips.
10. Inserts (map, blueprint, ticket) are props inside the set, reached by a tilt from the people who use them,
    not separate pictures on a desk.
11. What ours did wrong: 31 locked pictures, each with its own cast, joined by 8-frame dissolves; the same place
    was re-framed by cuts (crash field 5 times, fight 6 times, wall 4 times), and the opening was a paper chart.
12. Applied in round 4: a key-track camera (kit `run()` blend with `glide`, push holds), one cast function per take
    so every subject of the take stands in the set from its first frame, moves of 20-45 f that start about half
    their length before the word, crane arcs over heads for the reveals, DOF keyed on the landing, no dissolves.
