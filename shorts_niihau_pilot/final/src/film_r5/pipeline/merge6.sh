#!/bin/bash
# merge r6 chunks into out/film/all6/f%04d.jpeg (symlinks), whip smear -> out/film/post6, encode with captions + master6
set -e
S=/tmp/claude-0/-home-user-stocks/898ea701-1503-5cc7-b811-4df21447c708/scratchpad; R=$S/rm/out/film
mkdir -p $R/all6; rm -f $R/all6/*
for d in $R/r6/c*; do for f in $d/f*.jpeg; do b=$(basename $f .jpeg); n=$((10#${b#f})); ln -sf $f $R/all6/$(printf "f%04d.jpeg" $n); done; done
ls $R/all6 | wc -l
cd $S/film && python3 post6.py $R/all6 $R/post6
