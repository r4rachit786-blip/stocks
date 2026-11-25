#!/bin/bash
# QA on the final mp4: black/freeze scan, loudness, whisper small.en, take sheets
S=/tmp/claude-0/-home-user-stocks/898ea701-1503-5cc7-b811-4df21447c708/scratchpad; F=/home/user/stocks/shorts_orange/final; M=$F/orange_santra_short.mp4; Q=$S/orange2/qa
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,nb_frames:format=duration,size,bit_rate -of compact $M > $Q/probe.txt
ffmpeg -hide_banner -i $M -vf "blackdetect=d=0.1:pix_th=0.10,freezedetect=n=0.003:d=0.4" -an -f null - 2>&1 | grep -E "black_|freeze_" > $Q/scan.txt; echo "scan lines: $(wc -l < $Q/scan.txt)"
ffmpeg -hide_banner -i $M -af loudnorm=print_format=json -vn -f null - 2>&1 | tail -n 13 > $Q/loudness.json
python3 $S/orange/build/whisp.py $M x > $Q/whisper_final.txt 2>/dev/null
cat $Q/probe.txt $Q/loudness.json $Q/whisper_final.txt
