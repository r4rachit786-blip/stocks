#!/bin/bash
set -e
cd /tmp/voo
D=$(python3 -I -c "import json; print(round(json.load(open('/tmp/voo/words.json'))[-1][1]+0.9,3))")
ffmpeg -v error -y -i voice_proc.wav -af "apad=whole_dur=$D" -ar 48000 -ac 2 voice_pad.wav
ffmpeg -v error -y -i fx.wav -af "apad=whole_dur=$D" -ar 48000 fx_pad.wav
ffmpeg -v error -y -i voice_pad.wav -i fx_pad.wav -i sfx_layer.wav -filter_complex "[2:a]apad=whole_dur=$D,acompressor=threshold=-24dB:ratio=3:attack=3:release=120:makeup=4,loudnorm=I=-13:TP=-1:LRA=14[sx0];[0:a]asplit=3[v1][v2][v3];[1:a]loudnorm=I=-24:TP=-4:LRA=20[fx0];[fx0][v1]sidechaincompress=threshold=0.04:ratio=2:attack=10:release=250[fx];[sx0][v2]sidechaincompress=threshold=0.2:ratio=1.5:attack=10:release=150[sx];[v3][sx][fx]amix=inputs=3:weights='1 1.15 0.8':normalize=0:duration=longest,alimiter=limit=0.92:attack=2:release=60,loudnorm=I=-13:TP=-1:LRA=12,apad=whole_dur=$D" -t $D -ar 48000 -c:a pcm_s16le mix.wav
mkdir -p /home/user/stocks/shorts_ottoman_whatif/social
enc(){ ffmpeg -v error -y -framerate 30 -i /tmp/frameso_$1/%05d.jpg -i mix.wav -map 0:v -map 1:a -c:v libx264 -preset slow -profile:v high -level 4.1 -crf 19 -maxrate 15M -bufsize 30M -pix_fmt yuv420p -color_primaries bt709 -color_trc bt709 -colorspace bt709 -c:a aac -b:a 192k -shortest -movflags +faststart "$2"; ffprobe -v error -show_entries format=duration,size -of compact "$2"; }
enc index /home/user/stocks/shorts_ottoman_whatif/ottoman-whatif.mp4
enc index_tiktok /home/user/stocks/shorts_ottoman_whatif/social/ottoman-whatif-tiktok.mp4
enc index_reels /home/user/stocks/shorts_ottoman_whatif/social/ottoman-whatif-reels.mp4
echo FINISHED
