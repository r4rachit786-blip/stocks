#!/bin/bash
# post6 frames + captions6.ass + master6.wav -> h264 two-pass (~4.6 Mb/s) + AAC 192k, faststart
set -e
S=/tmp/claude-0/-home-user-stocks/898ea701-1503-5cc7-b811-4df21447c708/scratchpad; R=$S/rm/out/film; O=$R/r6_final.mp4
cd $S/film
ffmpeg -v error -y -framerate 30 -i $R/post6/f%04d.jpeg -vf "ass=captions6.ass,format=yuv420p" -c:v libx264 -preset slow -b:v 4600k -pass 1 -passlogfile $R/x264p -an -f mp4 /dev/null
ffmpeg -v error -y -framerate 30 -i $R/post6/f%04d.jpeg -i $S/snd/mix6/master6.wav -vf "ass=captions6.ass,format=yuv420p" -c:v libx264 -preset slow -b:v 4600k -maxrate 9000k -bufsize 9000k -pass 2 -passlogfile $R/x264p -c:a aac -b:a 192k -ar 48000 -movflags +faststart -shortest $O
ls -la $O; ffprobe -v error -show_entries format=duration,size -show_entries stream=codec_name,width,height,nb_frames -of compact $O
