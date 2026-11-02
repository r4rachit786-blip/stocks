#!/bin/bash
for v in index index_tiktok index_reels; do rm -rf /tmp/frameso_$v; cd /tmp && node /tmp/build_scripts/rendero_$v.js 4 2>&1 | grep -v " / "; done
echo ALLDONE
