import asyncio, sys, certifi
certifi.where = lambda: '/root/.ccr/ca-bundle.crt'
import edge_tts
T = ("In another timeline... this man said yes. And the world ended on a Saturday. "
     "October 27th, 1962, 11 PM. The nuclear torpedo fires. An entire American fleet... gone, in one flash. "
     "Washington doesn't know it was one scared submarine. They think World War Three just started.")
async def one(v, rate):
    c = edge_tts.Communicate(T, v, rate=rate)
    with open(f'/tmp/vsamp/{v}.mp3', 'wb') as f:
        async for ch in c.stream():
            if ch['type'] == 'audio': f.write(ch['data'])
async def main():
    for v, r in [('en-US-AndrewMultilingualNeural', '+6%'), ('en-US-BrianMultilingualNeural', '+6%'), ('en-GB-RyanNeural', '+4%')]:
        await one(v, r); print(v)
asyncio.run(main())
