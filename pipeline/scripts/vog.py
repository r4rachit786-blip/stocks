import asyncio, certifi, subprocess, json
certifi.where = lambda: '/root/.ccr/ca-bundle.crt'
import edge_tts
V = 'en-US-AndrewMultilingualNeural'
# (text, rate, pitch, gap_after_seconds)
LINES = [
 ("If these three bullets missed...", "+14%", "+2Hz", 0.12),
 ("India and Pakistan might have been friends.", "+16%", "+2Hz", 0.32),
 ("So let's make them miss!", "+20%", "+5Hz", 0.30),
 ("Gandhi was seventy-eight.", "+14%", "+1Hz", 0.12),
 ("But he once said he wanted to live to a hundred and twenty-five.", "+20%", "+3Hz", 0.30),
 ("His next plan?", "+14%", "+6Hz", 0.10),
 ("A trip to Pakistan, on a peace mission.", "+18%", "+2Hz", 0.28),
 ("His last fast had already pushed India to pay Pakistan fifty-five crore rupees.", "+22%", "+2Hz", 0.30),
 ("Maybe Kashmir ends at a table...", "+14%", "+2Hz", 0.08),
 ("not a border.", "+14%", "-2Hz", 0.34),
 ("And the day before he died...", "+6%", "-4Hz", 0.10),
 ("he wrote a plan to shut down the Congress party.", "+18%", "+2Hz", 0.30),
 ("No Congress...", "+12%", "+3Hz", 0.08),
 ("means a very different India.", "+16%", "+1Hz", 0.36),
 ("One man.", "+6%", "-2Hz", 0.16),
 ("Three bullets.", "+6%", "-2Hz", 0.16),
 ("A whole subcontinent.", "+8%", "+1Hz", 0.40),
 ("Better India... or worse?", "+8%", "+4Hz", 0.0),
]
async def syn(i, text, rate, pitch):
    c = edge_tts.Communicate(text, V, rate=rate, pitch=pitch, volume='+15%', boundary='WordBoundary'); ws = []
    with open(f'/tmp/vog/l{i:02d}.mp3', 'wb') as f:
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
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', f'/tmp/vog/l{i:02d}.mp3', '-af', f'atrim={a}:{b},asetpts=PTS-STARTPTS', '-ar', '48000', '-ac', '1', f'/tmp/vog/c{i:02d}.wav'], check=True)
        for s, e, w in ws: words.append([round(t + s - a, 3), round(t + e - a, 3), w, i])
        parts.append((f'/tmp/vog/c{i:02d}.wav', gap)); t += (b - a) + gap
    # concat with silences
    lst = open('/tmp/vog/list.txt', 'w')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=mono', '-t', '0.05', '/tmp/vog/s_lead.wav'], check=True); lst.write("file 's_lead.wav'\n")
    for j, (p, gap) in enumerate(parts):
        lst.write(f"file '{p.split('/')[-1]}'\n")
        if gap > 0:
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=mono', '-t', str(gap), f'/tmp/vog/s{j:02d}.wav'], check=True); lst.write(f"file 's{j:02d}.wav'\n")
    lst.close()
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', '/tmp/vog/list.txt', '-c:a', 'pcm_s16le', '/tmp/vog/voice_raw.wav'], check=True)
    import json as J; J.dump(words, open('/tmp/vog/words.json', 'w'))
    print(len(words), 'words, end', words[-1][1])
asyncio.run(main())
