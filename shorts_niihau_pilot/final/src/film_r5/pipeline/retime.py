# re-time the round-5 cue sheets (1.30x voice timeline) onto the round-5b voice: t5 -> story (old r5 WARP) -> new (warp6)
import json, re
S="/tmp/claude-0/-home-user-stocks/898ea701-1503-5cc7-b811-4df21447c708/scratchpad"
W5=eval(re.search(r'const WARP[^=]*= (\[\[.*?\]\]);',open(S+"/rm/bak/story.r5a.ts").read()).group(1))
W6=json.load(open(S+"/film/warp6.json"))["warp"]
def oldF(W,f):
    for i in range(1,len(W)):
        if f<=W[i][0]: a,A=W[i-1];b,B=W[i]; return A+(B-A)*(f-a)/(b-a)
    return W[-1][1]
def newF(W,g):
    for i in range(1,len(W)):
        if g<=W[i][1]: a,A=W[i-1];b,B=W[i]; return a+(b-a)*(g-A)/(B-A)
    return W[-1][0]
conv=lambda t: newF(W6,oldF(W5,t*30))/30
story=lambda t: oldF(W5,t*30)
out={}
for name in ["sheetB","beds"]:
    src=json.load(open(S+f"/snd/mix5/{name}.json")); cues=src["cues"] if isinstance(src,dict) else src; new=[]
    for c in cues:
        c=dict(c); t0=c["t"]; st=story(t0)
        if 1642<=st<1689: print("drop (curtains)",c["label"]); continue
        c["t"]=round(conv(t0),3)
        if "max_dur" in c: c["max_dur"]=round(max(0.2,conv(t0+c["max_dur"])-c["t"]),3)
        c["story_f"]=round(st); new.append(c)
    out[name]=new
    for c in new: print(name, c["t"], c["story_f"], c["label"], c.get("max_dur"), c.get("gain_db"))
json.dump(out,open("retimed.json","w"),indent=1)
