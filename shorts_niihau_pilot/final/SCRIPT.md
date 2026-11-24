# The island that was supposed to be empty (Niihau, December 1941)

## Facts and sources (checked 2026-11-23)
| Claim in the script | Status | Source |
|---|---|---|
| Japanese navy designated Niihau, wrongly believed uninhabited, for damaged planes; pilots told to wait there for a rescue submarine | supported | Wikipedia "Niihau incident" |
| 136 inhabitants | supported by Wikipedia; one news summary gives "about 180". The film uses 136 | Wikipedia; search summary of other accounts |
| The Zero's wheels struck a wire fence and it nosed in | supported | HistoryNet, "Niihau incident" |
| A local man took the pilot's pistol and papers before he could react, and would not return them | supported | Wikipedia |
| The islanders held a party for him that afternoon | supported | Wikipedia |
| They heard of the attack that night on a battery-operated radio | supported | Wikipedia |
| No boat came: the US military had banned boat traffic between the islands (script says "the military", not "the navy") | supported, wording corrected | Wikipedia |
| A helper joined him on 12 December (five days after the 7th) with a shotgun; a house and the plane were burned in the early hours of 13 December | supported | Wikipedia, HistoryNet |
| Residents fled to caves, thickets and distant beaches | supported | Wikipedia |
| The man who fought him was a sheep rancher, captured with his wife | supported | HistoryNet ("6-foot native Hawaiian sheep rancher") |
| Shot three times | supported | Wikipedia (groin, stomach, upper leg) |
| "Then I got mad" | NOT verified as a direct quote. One secondary page (huapala.org) gives "that's when I got mad". The script now says "As he told it later, that is when he got mad" (reported speech, no quotation) | huapala.org (secondary) |
| He threw the pilot against a stone wall; his wife struck the pilot with a rock | supported (accounts differ on what followed; the film stops at the rock and shows no injury) | Wikipedia, HistoryNet |
| One family owned the island; no telephones, no electricity; the owner's boat came weekly | supported | Wikipedia |
| The rancher received a medal (Medal for Merit and Purple Heart, 1945) | supported | Wikipedia |
| The submarine never came (its commander was ordered elsewhere) | supported | HistoryNet |
| Wreckage of the plane is displayed at the Pearl Harbor Aviation Museum, Ford Island | supported | Wikipedia |
| "I would like those back" | invented line: removed as a quote. The script says "The pilot asks for them back. No luck." | - |

Not shown or named: no real person's name appears on screen or in the narration; the helper's death is omitted; no blood or wounds are drawn.

Sources: https://en.wikipedia.org/wiki/Niihau_incident · https://www.historynet.com/niihau-incident/ · https://www.huapala.org/T/They_Couldnt_Take_Niihau.html

## Final script, round 5 (212 words, 76.5 s, voice "Liam" at natural pace)
Spoken "Nee-ee-how" for Niihau; captions spell Niihau. Delivery tags in the line files are not spoken or captioned.

0. A Pearl Harbor pilot was told to crash on an empty island.
1. A hundred and thirty-six people were standing on it.
2. The plan: land on tiny Niihau... and wait for a submarine.
3. So he lands.
4. In a fence.
5. A local man pulls him out, and politely borrows his pistol and his papers.
6. The pilot wants them back. No luck.
7. Nobody here knows there's a war... so they throw him a party!
8. That night, a battery radio delivers the news.
9. The party ends quickly.
10. Now he's a prisoner. And no boat can come: the military has banned them all.
11. Five days later, he finds a helper... with a shotgun.
12. They burn a house looking for the papers. They burn the plane.
13. The village hides in caves. One rancher does not.
14. He jumps the pilot. The pilot shoots him three times.
15. As he told it later... that's when he got mad.
16. He throws the pilot into a stone wall.
17. His wife ends the argument with a rock.
18. You see, Niihau was never empty. It was private: one family, no phones, no power, one boat a week.
19. The rancher got a medal. The submarine never came.
20. And the plane? Still in a Hawaii museum... a souvenir from the island that was supposed to be empty.

Removed from the round-4 script: "His navy's plan for damaged planes", "caught, with his wife", "picks the pilot up",
"A house with the curtains drawn" (that take is no longer in the film).

Voice build (film/assemble6.py): 21 line files, no speed change; leading/trailing silence trimmed; pauses inside a line
longer than 0.35 s shortened to 0.30 s (cut in silence, 10 ms crossfades; 4.2 s removed in total); lines joined with
0.10 s gaps, 0.30 s before lines 8, 11 and 18, and 0.90 s before line 4 so the whole fence crash plays between
"So he lands." and "In a fence." Total 76.46 s (2294 frames).

## Take list, round 5 (frames at 30 fps on the final film)

The picture choreography is written on the round-4 timeline ("story frames") and mapped onto the new voice by a time
warp (film/warp6.py -> warp6.json -> WARP in story.ts): every line start and key word of the new narration is pinned
to the story frame of the same word, so cuts and actions land on the words. A new voice only needs warp6.py re-run.
Hard cuts between takes; two blurred whip-pans (929 and 961). No dissolves.

| Take | Frames | Place | What happens |
|---|---|---|---|
| 1 Hook | 0-115 | over Pearl Harbor, morning, 150 m up | Wide: the whole Zero with the pilot in the cockpit, below and behind it the 3D harbour: Ford Island with airfield and hangars, Battleship Row (six different battleships, two destroyers), cranes, oil tanks, town, green hills; fires and thick smoke columns, flak, other aircraft. Hit and holes; slow travel up to the thought bubble, EMPTY stamp on "empty". |
| 2 Census | 116-211 | the ranch field | Crane dive through cloud to the board: NIIHAU POPULATION 136, three waving islanders. |
| 3 Over the sea | 212-347 | low over the sea | The damaged Zero, orbit to behind the tail, island ahead ("land on tiny Niihau"), tilt down to the waiting submarine. |
| 4 Crash field | 348-724 | the ranch field | Landing: touchdown on "lands", the fence crash in the beat before "In a fence" (~394), dazed pilot (medium), pulled out, pistol and papers, asks back, "No luck", crane over to the islanders. |
| 5 Party | 725-781 | the yard, dusk | The party table, the guest eating. |
| 6 Radio | 782-928 | the yard, night | Radio insert, news, pull back to the frozen party (the frozen pilot is one of the two close beats). |
| 7 Prisoner | 929-960 | the yard, night | Whip in: the pilot tied on a crate, guard with the pistol, lantern. |
| 8 No boats | 961-1070 | the bluff, night | Whip in: NO BOATS board, chained canoe, empty moonlit sea. |
| 9 Calendar | 1071-1133 | wall insert | Pages 7 to 12. |
| 10 Helper, burning house | 1134-1261 | the yard, night | Medium-wide two-shot, shotgun up; the pilot's torch (wooden handle, wrapped head, round flame with glow) held apart from the shotgun; swing to the house as it catches, papers fly. |
| 11 Burning plane | 1262-1304 | the field, night | The wreck burning, the two men beside it. |
| 12 Caves | 1305-1364 | sea cave | Villagers round one kerosene lantern. |
| 13 The fight | 1365-1788 | the field by the burning plane | The rancher alone ("One rancher does not"); the pilot and helper walk him and his wife in at gunpoint (fast); "He jumps the pilot"; three shots, the pistol in the pilot's hand with a small muzzle flash on each; push in on "mad" (the second close beat); the throw into the stone wall; the wife and the rock. |
| 14 Private | 1789-1898 | the ranch, high key | Wide ranch: house, windmill, sheep, people; travel down to the PRIVATE ISLAND sign at the gate with the family. |
| 15 The owners' house | 1899-2019 | inside the ranch house, day | One lateral travel along a board wall with real furniture: the family portrait over the sideboard ("one family"), the owner holding a conch to his ear by the NO TELEPHONE notice ("no phones"), his wife striking a match and lighting the kerosene lamp on the table ("no power"), the kid by the door pointing at the boat-day calendar ("one boat a week"). |
| 16 Medal | 2020-2062 | the field, day | Medium-wide ceremony: bunting, 48-star flag, villagers, the officer pins the medal, glint. |
| 17 Submarine | 2063-2104 | the bluff, sunset | The pilot's empty flying helmet on the bluff, smooth dusk sea with soft glints and foam, the submarine leaving. |
| 18 Museum | 2105-2293 | museum, present day | The whole PACIFIC WAR GALLERY / HAWAII 1941 banner; the whole plane on its plinth; plaque (banner still whole); back out to the whole room: rope barrier, propeller and uniform exhibits, visitors. |
