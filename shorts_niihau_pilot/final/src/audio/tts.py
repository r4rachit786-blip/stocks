import certifi
certifi.where = lambda: "/root/.ccr/ca-bundle.crt"
import asyncio, edge_tts, json, sys, os
os.environ.setdefault("SSL_CERT_FILE","/root/.ccr/ca-bundle.crt")
voice, rate, out = sys.argv[1], sys.argv[2], sys.argv[3]
lines=[l.strip() for l in open("script.txt") if l.strip()]
if len(sys.argv)>4: lines=lines[:int(sys.argv[4])]
async def one(i,t):
    c=edge_tts.Communicate(t.replace("Niihau","Nee-ee-how"),voice,rate=rate,boundary="WordBoundary"); words=[]
    with open(f"{out}/c{i:02d}.mp3","wb") as f:
        async for ch in c.stream():
            if ch["type"]=="audio": f.write(ch["data"])
            elif ch["type"]=="WordBoundary": words.append({"w":ch["text"],"t":ch["offset"]/1e7,"d":ch["duration"]/1e7})
    json.dump(words,open(f"{out}/c{i:02d}.json","w"))
async def main():
    os.makedirs(out,exist_ok=True)
    for i,t in enumerate(lines):
        for k in range(8):
            try: await one(i,t); break
            except Exception as e:
                print("retry",i,type(e).__name__); await asyncio.sleep(2+k)
asyncio.run(main())
