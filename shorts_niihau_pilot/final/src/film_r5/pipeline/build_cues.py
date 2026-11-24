# Round 6: rebuild acc.json + beds.json from retimed.json (retime.py, current warp6.json) with every round-5 tweak:
# fence crash cut to end 60 ms before "In a fence." (lowpass 9 kHz, +4.5 dB), raised accents, five added beds.
import json, glob
S="/tmp/claude-0/-home-user-stocks/898ea701-1503-5cc7-b811-4df21447c708/scratchpad"
R=json.load(open("retimed.json")); L=json.load(open(S+"/film/lines6.json")); dur=L["total"]
W=json.load(open(S+"/film/warp6.json"))["warp"]
def nt(g):
    for i in range(1,len(W)):
        if g<=W[i][1]: a,A=W[i-1];b,B=W[i]; return (a+(b-a)*(g-A)/(B-A))/30
up={"the hit":2.5,"PICK whoosh C":3,"torch":4,"house fire":3,"PICK gunshot C 1":3,"PICK gunshot C 2":2.5,"PICK gunshot C 3":2.5}
acc=[]
for c in R["sheetB"]:
    c=dict(c); c.pop("story_f",None)
    if "fence" in c["label"]: c["max_dur"]=round(L["lines"][4]["t0"]-0.06-c["t"],3); c["fade_out"]=0.25; c["lowpass"]=9000; c["gain_db"]=c.get("gain_db",0)+4.5
    if c["label"] in up: c["gain_db"]=c.get("gain_db",0)+up[c["label"]]
    acc.append(c)
beds=[dict(c) for c in R["beds"]]
for c in beds: c.pop("story_f",None)
lib=lambda k: sorted(glob.glob(S+f"/snd/lib/{k}__*.wav"))
def bed(label,f0,f1,file,g,fi,fo):
    t0,t1=nt(f0),nt(f1); beds.append({"t":round(t0,3),"label":label,"file":file,"role":"ambience","gain_db":g,"anchor":"start","loop_to":round(t1-t0,3),"max_dur":round(t1-t0,3),"fade_in":fi,"fade_out":fo})
bed("field wind",283,575,lib("bed_wind")[1],2,0.2,0.4); bed("ranch wind",1439,1543,lib("bed_wind")[0],0,0.1,0.2)
bed("room: wind outside",1543,1688,lib("bed_wind")[1],-6,0.1,0.15); bed("medal crowd",1689,1725,lib("bed_crowd")[1],8,0.05,0.2)
bed("helmet bluff surf",1726,1766,lib("bed_sea")[1],4,0.05,0.2)
for n,cues in [("acc",acc),("beds",beds)]: json.dump({"duration":dur,"keep_audio":"no","cues":cues},open(f"{n}.json","w"),indent=1)
f=[c for c in acc if "fence" in c["label"]][0]
print("duration",dur,"fence crash %.3f-%.3f, In a fence at %.3f"%(f["t"],f["t"]+f["max_dur"],L["lines"][4]["t0"]))
