import asyncio, certifi, subprocess, json
certifi.where = lambda: '/root/.ccr/ca-bundle.crt'
import edge_tts
V = 'en-US-AndrewMultilingualNeural'
# (text, rate, pitch, gap_after_seconds)
LINES = [
 ("If this bullet missed...", "+14%", "+2Hz", 0.16),
 ("you wouldn't exist.", "+10%", "-2Hz", 0.32),
 ("So let's make it miss!", "+20%", "+5Hz", 0.30),
 ("No World War One.", "+16%", "+3Hz", 0.26),
 ("Four empires survive.", "+18%", "+3Hz", 0.18),
 ("Russia, Germany, Austria, and the Ottomans keep ruling.", "+24%", "+3Hz", 0.28),
 ("No war...", "+14%", "+2Hz", 0.10),
 ("no Russian Revolution.", "+20%", "+3Hz", 0.18),
 ("No Soviet Union.", "+16%", "+2Hz", 0.45),
 ("And it gets darker...", "-4%", "-8Hz", 0.50),
 ("Hitler never becomes a soldier.", "+16%", "+0Hz", 0.20),
 ("He stays a failed painter in Vienna.", "+18%", "+2Hz", 0.26),
 ("Maybe no Nazis.", "+14%", "+2Hz", 0.16),
 ("Maybe no World War Two.", "+16%", "+3Hz", 0.32),
 ("Poland?", "+10%", "+8Hz", 0.12),
 ("Would have never existed.", "+14%", "-2Hz", 0.34),
 ("Your grandparents?", "+12%", "+6Hz", 0.12),
 ("Probably never meet.", "+14%", "-2Hz", 0.40),
 ("So... one bullet made you.", "+10%", "+0Hz", 0.40),
 ("Better world... or worse?", "+8%", "+4Hz", 0.0),
]
async def syn(i, text, rate, pitch):
    c = edge_tts.Communicate(text, V, rate=rate, pitch=pitch, volume='+15%', boundary='WordBoundary'); ws = []
    with open(f'/tmp/vo3/l{i:02d}.mp3', 'wb') as f:
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
                if attempt == 2: pitch = pitch.replace('+0Hz', '+1Hz')
        else: raise SystemExit('failed line %d' % i)
        a, b = max(0, ws[0][0] - 0.04), ws[-1][1] + 0.10
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', f'/tmp/vo3/l{i:02d}.mp3', '-af', f'atrim={a}:{b},asetpts=PTS-STARTPTS', '-ar', '48000', '-ac', '1', f'/tmp/vo3/c{i:02d}.wav'], check=True)
        for s, e, w in ws: words.append([round(t + s - a, 3), round(t + e - a, 3), w])
        parts.append((f'/tmp/vo3/c{i:02d}.wav', gap)); t += (b - a) + gap
    # concat with silences
    lst = open('/tmp/vo3/list.txt', 'w')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=mono', '-t', '0.05', '/tmp/vo3/s_lead.wav'], check=True); lst.write("file 's_lead.wav'\n")
    for j, (p, gap) in enumerate(parts):
        lst.write(f"file '{p.split('/')[-1]}'\n")
        if gap > 0:
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=mono', '-t', str(gap), f'/tmp/vo3/s{j:02d}.wav'], check=True); lst.write(f"file 's{j:02d}.wav'\n")
    lst.close()
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', '/tmp/vo3/list.txt', '-c:a', 'pcm_s16le', '/tmp/vo3/voice_raw.wav'], check=True)
    open('/tmp/vo3/words.tsv', 'w').write(''.join(f'{a:.3f}\t{b:.3f}\t{w}\n' for a, b, w in words))
    print(len(words), 'words, end', words[-1][1])
asyncio.run(main())
