# Credits

- **Story, script, design, animation:** original for this film; rendered with three.js inside Remotion on the "cartoon-3d-short" kit (MIT).
- **Voice:** Microsoft Edge online text-to-speech, voice `en-GB-RyanNeural`, rate +28 %, via the free `edge-tts` Python package (no paid service). Chosen by measurement from three candidates: Ryan f0 median 128 Hz, spread 12.3 semitones; Andrew (US) 118 Hz, 10.5; Brian (US) 122 Hz, 7.4. Check Microsoft's terms for the Edge read-aloud voices before commercial publication.
- **Music:** original, generated from code for this film (`src/audio/audio.py`): plucked-string "ukulele" pattern (C, Am, F, G) for the day, marimba pulse in A minor with a drone for the night, marimba in F for the explanation, ukulele reprise and final chord. No samples, no third-party recordings.
- **Sound effects:** all synthesized from code in the same file (noise and sine models). No third-party recordings, so there are no licences to log.

| Cue (frame) | Sound | Source | Licence |
|---|---|---|---|
| 2, 54 | chart paper, stamp | synthesized (audio.py) | own work |
| 98, 104 | chalk taps | synthesized | own work |
| 246, 264, 1730, 1748 | sonar pings | synthesized | own work |
| 283-325 | crash thud, fence cracks | synthesized | own work |
| 398-418, 500 | pistol / papers handling, "no luck" boing | synthesized | own work |
| 633-703 | radio static, switch click | synthesized | own work |
| 741-790 | lock, surf | synthesized | own work |
| 855-887 | calendar pages | synthesized | own work |
| 922, 927 | shotgun action | synthesized | own work |
| 945-1437 | fire crackle | synthesized | own work |
| 1160-1430 | jump whoosh, three shots, impact, wall, rock, star chimes | synthesized | own work |
| 1515-1646 | sign thunk, pictogram toks, curtain | synthesized | own work |
| 1710 | medal bell | synthesized | own work |

**SFX sourcing note.** The client's `video-sfx-pipeline` skill (Openverse -> Real SFX -> earshot) could not be run here: api.openverse.org answered HTTP 500 from this sandbox, and Real SFX / earshot need GitHub clones and about 1.1 GB of model downloads. The Mixkit files in `pipeline/sfx_mixkit` have numeric names and no licence log, so they were not used. Fallback, as the brief allows: synthesized effects. To replace them with real recordings, run the skill on a machine with open internet against `src/audio/cues` (frames above) and keep the word-locked frames.
