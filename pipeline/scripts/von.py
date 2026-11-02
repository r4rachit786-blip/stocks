import asyncio, certifi, subprocess, json
certifi.where = lambda: '/root/.ccr/ca-bundle.crt'
import edge_tts
V = 'en-US-GuyNeural'
# (text, rate, pitch, gap_after_seconds)
LINES = [
 ("In another timeline...", "+9%", "-6Hz", 0.08),
 ("this man said yes.", "+15%", "-4Hz", 0.18),
 ("And the world ended on a Saturday.", "+19%", "-2Hz", 0.32),
 ("October 27th, 1962, 11 PM.", "+23%", "+0Hz", 0.10),
 ("The nuclear torpedo fires.", "+23%", "+2Hz", 0.13),
 ("An entire American fleet... gone in one flash.", "+25%", "+2Hz", 0.24),
 ("Washington doesn't know it was one scared submarine.", "+27%", "+2Hz", 0.10),
 ("They think World War Three just started.", "+25%", "+3Hz", 0.24),
 ("Midnight, missiles rise from Cuba.", "+23%", "+2Hz", 0.10),
 ("Miami, Washington, New York, gone before sunrise.", "+25%", "+3Hz", 0.24),
 ("Noon, America answers.", "+21%", "+1Hz", 0.10),
 ("Moscow, Leningrad, half of Europe, gone.", "+25%", "+3Hz", 0.26),
 ("Smoke blocks out the sun, summer never comes.", "+19%", "-3Hz", 0.29),
 ("No Beatles, no moon landing, no internet,", "+29%", "+4Hz", 0.06),
 ("no iPhone, no YouTube.", "+29%", "+5Hz", 0.11),
 ("No... you.", "+9%", "-6Hz", 0.40),
 ("And history remembers Vasili Arkhipov...", "+19%", "-2Hz", 0.06),
 ("as the man who ended the world.", "+17%", "-4Hz", 0.32),
 ("Lucky for you... in this timeline, he said no.", "+17%", "+2Hz", 0.0),
]
async def syn(i, text, rate, pitch):
    c = edge_tts.Communicate(text, V, rate=rate, pitch=pitch, volume='+15%', boundary='WordBoundary'); ws = []
    with open(f'/tmp/von/l{i:02d}.mp3', 'wb') as f:
        async for ch in c.stream():
            if ch['type'] == 'audio': f.write(ch['data'])
            elif ch['type'] == 'WordBoundary': ws.append((ch['offset'] / 1e7, (ch['offset'] + ch['duration']) / 1e7, ch['text']))
    return ws
async def main():
    words, parts, t = [], [], 0.05
    for i, (text, rate, pitch, gap) in enumerate(LINES):
        for attempt in range(4):
            try: ws = await syn(i, text, rate, pitch); break
            except Exception as e:
                print('retry', i, text, type(e).__name__, flush=True); await asyncio.sleep(2)
                if attempt == 2: pitch = pitch.replace('+1Hz', '+1Hz')
        else: raise SystemExit('failed line %d' % i)
        a, b = max(0, ws[0][0] - 0.04), ws[-1][1] + 0.10
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', f'/tmp/von/l{i:02d}.mp3', '-af', f'atrim={a}:{b},asetpts=PTS-STARTPTS', '-ar', '48000', '-ac', '1', f'/tmp/von/c{i:02d}.wav'], check=True)
        for s, e, w in ws: words.append([round(t + s - a, 3), round(t + e - a, 3), w, i])
        parts.append((f'/tmp/von/c{i:02d}.wav', gap)); t += (b - a) + gap
    # concat with silences
    lst = open('/tmp/von/list.txt', 'w')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=mono', '-t', '0.05', '/tmp/von/s_lead.wav'], check=True); lst.write("file 's_lead.wav'\n")
    for j, (p, gap) in enumerate(parts):
        lst.write(f"file '{p.split('/')[-1]}'\n")
        if gap > 0:
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=mono', '-t', str(gap), f'/tmp/von/s{j:02d}.wav'], check=True); lst.write(f"file 's{j:02d}.wav'\n")
    lst.close()
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', '/tmp/von/list.txt', '-c:a', 'pcm_s16le', '/tmp/von/voice_raw.wav'], check=True)
    import json as J; J.dump(words, open('/tmp/von/words.json', 'w'))
    print(len(words), 'words, end', words[-1][1])
asyncio.run(main())
