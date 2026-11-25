#!/bin/bash
# frames (on ones) + captions.ass + master.wav -> final (two-pass ~7 Mb/s, < 50 MB) and an HQ upload copy (12 Mb/s)
set -e
S=/tmp/claude-0/-home-user-stocks/898ea701-1503-5cc7-b811-4df21447c708/scratchpad; R=$S/rm/out/orange2; F=/home/user/stocks/shorts_orange/final; A=$S/orange2/snd/masterq.wav
cd $S/orange2/build
for spec in "7200k:orange_santra_short.mp4" "12000k:orange_santra_short_HQ_upload.mp4"; do b=${spec%%:*}; o=${spec#*:}
  ffmpeg -v error -y -framerate 30 -i $R/all/f%04d.jpeg -vf "ass=captions.ass,format=yuv420p" -c:v libx264 -preset slow -b:v $b -pass 1 -passlogfile $R/x264o -an -f mp4 /dev/null
  ffmpeg -v error -y -framerate 30 -i $R/all/f%04d.jpeg -i $A -map 0:v:0 -map 1:a:0 -vf "ass=captions.ass,format=yuv420p" -c:v libx264 -preset slow -b:v $b -maxrate $((${b%k}*2))k -bufsize $((${b%k}*2))k -pass 2 -passlogfile $R/x264o -af apad -c:a aac -b:a 192k -ar 48000 -shortest -movflags +faststart $F/$o
  ls -la $F/$o; done
