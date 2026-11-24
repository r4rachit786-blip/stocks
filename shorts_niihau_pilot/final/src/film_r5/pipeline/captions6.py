# captions for the round-5b voice: 1-3 word groups (<= 13 characters), timed from words6.json, same style as round 4
import json, re
D=json.load(open("words6.json")); W=D["words"]
hdr=open("captions_r4.ass").read().split("[Events]")[0]+"[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n"
clean=lambda w: re.sub(r"[^A-Za-z0-9'\-]","",w)
raw={}
for l in D["lines"]: raw[l["i"]]=l["text"].split()
groups=[]; cur=[]
for i,w in enumerate(W):
    tok=raw[w["line"]][sum(1 for x in W[:i] if x["line"]==w["line"])]
    cur.append((clean(w["w"]),w)); txt=" ".join(c[0] for c in cur)
    nxt=W[i+1] if i+1<len(W) else None
    brk = tok[-1] in ".,:!?" or tok.endswith("...") or nxt is None or nxt["line"]!=w["line"] or len(txt)>=9 or (nxt and len(txt)+1+len(clean(nxt["w"]))>13)
    if brk: groups.append(cur); cur=[]
def ts(t): h=int(t//3600); m=int(t%3600//60); s=t%60; return "%d:%02d:%05.2f"%(h,m,s)
out=[]
for k,g in enumerate(groups):
    s=g[0][1]["t"]; e=g[-1][1]["t"]+g[-1][1]["d"]
    if k+1<len(groups): e=max(e,min(groups[k+1][0][1]["t"], e+0.35)) if groups[k+1][0][1]["t"]-e<0.35 else e+0.15
    out.append("Dialogue: 0,%s,%s,W,,0,0,0,,%s"%(ts(s),ts(e)," ".join(x[0] for x in g)))
open("captions6.ass","w").write(hdr+"\n".join(out)+"\n"); print(len(out),"captions"); print("\n".join(out[:12])); print(out[-3:])
