import asyncio, certifi, subprocess, json
certifi.where = lambda: '/root/.ccr/ca-bundle.crt'
import edge_tts
V = 'en-IN-PrabhatNeural'
# (text, rate, pitch, gap_after_seconds)
LINES = [
 ("The day before he was killed, Gandhi wrote a plan to shut down the Congress party.", "+20%", "+2Hz", 0.30),
 ("And that was just one thing on his unfinished list.", "+20%", "+1Hz", 0.27),
 ("Number one: turn Congress into a public service group, out of politics.", "+22%", "+2Hz", 0.24),
 ("Number two: travel to Pakistan, on a peace mission.", "+22%", "+2Hz", 0.24),
 ("Number three: live to a hundred and twenty-five.", "+20%", "+2Hz", 0.09),
 ("He was seventy-eight.", "+14%", "-2Hz", 0.30),
 ("Three bullets cancelled all three.", "+12%", "-4Hz", 0.38),
 ("So imagine they missed.", "+18%", "+3Hz", 0.22),
 ("No Congress in power.", "+22%", "+2Hz", 0.15),
 ("Gandhi in Lahore.", "+22%", "+3Hz", 0.15),
 ("Kashmir at a table, not a battlefield.", "+22%", "+2Hz", 0.30),
 ("Which one would have changed India the most?", "+20%", "+4Hz", 0.14),
 ("Comment one, two, or three.", "+18%", "+2Hz", 0.0),
]
async def syn(i, text, rate, pitch):
    c = edge_tts.Communicate(text, V, rate=rate, pitch=pitch, volume='+15%', boundary='WordBoundary'); ws = []
    with open(f'/tmp/vog2/l{i:02d}.mp3', 'wb') as f:
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
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', f'/tmp/vog2/l{i:02d}.mp3', '-af', f'atrim={a}:{b},asetpts=PTS-STARTPTS', '-ar', '48000', '-ac', '1', f'/tmp/vog2/c{i:02d}.wav'], check=True)
        for s, e, w in ws: words.append([round(t + s - a, 3), round(t + e - a, 3), w, i])
        parts.append((f'/tmp/vog2/c{i:02d}.wav', gap)); t += (b - a) + gap
    # concat with silences
    lst = open('/tmp/vog2/list.txt', 'w')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=mono', '-t', '0.05', '/tmp/vog2/s_lead.wav'], check=True); lst.write("file 's_lead.wav'\n")
    for j, (p, gap) in enumerate(parts):
        lst.write(f"file '{p.split('/')[-1]}'\n")
        if gap > 0:
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=mono', '-t', str(gap), f'/tmp/vog2/s{j:02d}.wav'], check=True); lst.write(f"file 's{j:02d}.wav'\n")
    lst.close()
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', '/tmp/vog2/list.txt', '-c:a', 'pcm_s16le', '/tmp/vog2/voice_raw.wav'], check=True)
    import json as J; J.dump(words, open('/tmp/vog2/words.json', 'w'))
    print(len(words), 'words, end', words[-1][1])
asyncio.run(main())
