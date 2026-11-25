#!/bin/bash
# animate on twos: render every 2nd frame, 4 chunks in parallel (one per core)
cd /tmp/claude-0/-home-user-stocks/898ea701-1503-5cc7-b811-4df21447c708/scratchpad/rm
for r in 0-353 354-707 708-1061 1062-1410; do
  ( [ -f out/orange/$r.ok ] || { NTH=2 RANGE=$r TMPDIR=/tmp/rmt node scripts/render2.mjs src/orange.tsx OrangeFilm out/orange/c$r 1 > out/orange/$r.log 2>&1 && touch out/orange/$r.ok; } ) &
done
wait; echo ALLDONE > out/orange/all.done
