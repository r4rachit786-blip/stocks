import asyncio, json, subprocess, certifi
certifi.where = lambda: '/root/.ccr/ca-bundle.crt'
import edge_tts
T = ("Three men. One nuclear button. Two said yes. "
     "In this timeline... the third one said yes too. "
     "And this is how your world disappears. "
     "October 27th, 1962, 11 PM. The nuclear torpedo fires. "
     "An entire American fleet, gone, in one flash. "
     "Washington doesn't know it was one scared submarine. They think World War Three just started. "
     "Midnight. Missiles rise from Cuba. Miami, Washington, New York, gone before sunrise. "
     "Noon. America answers. Moscow, Leningrad, half of Europe, gone. "
     "Smoke blocks out the sun. Summer never comes. "
     "No Beatles, no moon landing, no internet, no iPhone, no YouTube. "
     "No... you. "
     "And history remembers Vasili Arkhipov as the man who ended the world. "
     "Lucky for you... in our timeline, he said no.")
async def main():
    c = edge_tts.Communicate(T, 'en-US-AndrewMultilingualNeural', rate='+22%', boundary='WordBoundary'); ws = []
    with open('/tmp/von2/raw.mp3', 'wb') as f:
        async for ch in c.stream():
            if ch['type'] == 'audio': f.write(ch['data'])
            elif ch['type'] == 'WordBoundary': ws.append([round(ch['offset'] / 1e7, 3), round((ch['offset'] + ch['duration']) / 1e7, 3), ch['text'], 0])
    json.dump(ws, open('/tmp/von2/words.json', 'w'))
    print(len(ws), ws[-1][1])
asyncio.run(main())
