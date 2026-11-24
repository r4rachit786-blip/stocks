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

## Final script, round 6 (voice 1.2x; 212 words, 63.9 s, voice "Liam" sped up 1.2x, pitch kept; picture at normal speed)
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

Voice build: film/assemble6.py (21 line files, no speed change; leading/trailing silence trimmed; inner pauses over
0.35 s cut to 0.30 s; 0.10 s gaps, 0.30 s before lines 8, 11, 18, 0.90 s before line 4), then film/tempo12.py:
ffmpeg atempo=1.2 on the whole track (the file the client approved, voice_preview/liam_voice_1.2x.mp3), and the pause
before "In a fence." put back from 0.75 s to its old 0.90 s so the whole fence crash fits in it. Total 63.85 s (1916 frames).

## Take list, round 6 (frames at 30 fps on the final film)

The picture plays at normal speed. Its choreography is written on the round-4 timeline ("story frames") and pinned to
the new narration by a time warp (film/warp6.py -> warp6.json -> WARP in story.ts): every line start and key word maps
to the story frame of the same word, so cuts and actions land on the words; shots got shorter by cutting their holds.
Two actions that no longer had time were simplified instead of being played fast: the pilot and helper now walk the
rancher's wife in while "One rancher does not" is spoken (no separate capture beat), and the lift before the throw is a
quick grab right on "He throws". Hard cuts between takes; two blurred whip-pans (779 and 811). No dissolves.

| Take | Frames | Place | What happens |
|---|---|---|---|
| 1 Hook | 0-96 | over Pearl Harbor, morning, 150 m up | Wide: the whole Zero with the pilot, the 3D harbour below (Ford Island, airfield, hangars, six battleships, two destroyers, cranes, tanks, town, hills), fires, smoke columns, flak, other aircraft. Hit; travel up to the thought bubble, EMPTY stamp on "empty". |
| 2 Census | 97-175 | the ranch field | Crane dive through cloud to the board NIIHAU POPULATION 136 and three islanders. |
| 3 Over the sea | 176-288 | low over the sea | The damaged Zero, the island ahead ("land on tiny Niihau"), the waiting submarine. |
| 4 Crash field | 289-607 | the ranch field | Touchdown on "lands"; the fence crash (329) in the 0.9 s beat before "In a fence"; dazed pilot; pulled out; pistol and papers; asks back; "No luck"; the islanders. |
| 5 Party | 608-655 | the yard, dusk | The party table, the guest eating. |
| 6 Radio | 656-778 | the yard, night | Radio insert, news, the frozen party (close beat). |
| 7 Prisoner | 779-810 | the yard, night | Whip in: tied on a crate, guarded. |
| 8 No boats | 811-885 | the bluff, night | Whip in: NO BOATS board, chained canoe. |
| 9 Calendar | 886-945 | wall insert | Pages 7 to 12. |
| 10 Helper, burning house | 946-1059 | the yard, night | Shotgun up; the torch held apart from it; the house catches, papers fly. |
| 11 Burning plane | 1060-1091 | the field, night | The wreck burning. |
| 12 Caves | 1092-1141 | sea cave | Villagers round one kerosene lantern. |
| 13 The fight | 1142-1494 | by the burning plane | Rancher alone; pilot and helper walk his wife in at gunpoint during "One rancher does not"; the jump on "jumps"; three shots (1223, 1236, 1246) with the pistol and a small muzzle flash; push in on "mad" (close beat); grab, throw into the wall; the wife and the rock. |
| 14 Private | 1495-1585 | the ranch, high key | Ranch wide with people and sheep, down to the PRIVATE ISLAND sign at the gate. |
| 15 The owners' house | 1586-1687 | inside the ranch house | One lateral travel: portrait, owner with the conch, wife lighting the kerosene lamp, kid at the boat-day calendar. |
| 16 Medal | 1688-1722 | the field, day | Ceremony: bunting, flag, villagers, the officer pins the medal. |
| 17 Submarine | 1723-1757 | the bluff, sunset | The empty helmet on the bluff, the submarine leaving. |
| 18 Museum | 1758-1915 | museum, present day | The whole banner, the whole plane, plaque, the whole room. |
