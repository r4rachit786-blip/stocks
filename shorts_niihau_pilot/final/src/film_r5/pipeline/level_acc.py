# Round 6: set every accent's peak (over its whole span) to a target re the voice peak, from the rendered acc track.
# final_mix.py scales the track so its loudest point is 6 dB under the voice peak; targets here are relative to that.
import json, subprocess, numpy as np
SR=48000; S="/tmp/claude-0/-home-user-stocks/898ea701-1503-5cc7-b811-4df21447c708/scratchpad"
ld=lambda f: np.frombuffer(subprocess.run(["ffmpeg","-v","error","-i",f,"-ac","1","-ar",str(SR),"-f","f32le","-"],capture_output=True).stdout,dtype=np.float32)
a=ld("acc_sfx_track.wav"); A=json.load(open("acc.json")); R=json.load(open("acc_resolved_cues.json")); R=R["cues"] if isinstance(R,dict) else R
# target dB under the track max (which final_mix puts at -6 re voice peak): hits 0..-1.5, whooshes/engine -3, beds-like cues left alone
T={"PICK fence crash A":0,"PICK gunshot C 1":-1,"PICK gunshot C 2":-1,"PICK gunshot C 3":-0.5,"PICK wall A":0,"PICK rock A":-0.5,"PICK medal A":-1.5,
   "harbour explosions":-0.5,"cowl guns":-2,"the hit":-1.5,"touchdown":-1.5,"second touchdown":-4,"PICK whoosh C":-2,"torch":-2,"house fire":-2,"the throw":-3,"zero engine dive":-3}
top=None; pk={}
for c,r in zip(A["cues"],R):
    s=int(max(0,r["t"]-0.05)*SR); e=int((r["t"]+min(0.6,(c.get("max_dur") or 1.5))+0.05)*SR); pk[c["label"]+str(r["t"])]=np.abs(a[s:e]).max()
ref=max(pk[c["label"]+str(r["t"])] for c,r in zip(A["cues"],R) if c["label"] in T)
for c,r in zip(A["cues"],R):
    if c["label"] not in T: continue
    cur=20*np.log10(pk[c["label"]+str(r["t"])]/ref); d=T[c["label"]]-cur; c["gain_db"]=round(float(c.get("gain_db",0)+d),1); print("%-20s %5.1f -> %5.1f"%(c["label"],cur,T[c["label"]]))
json.dump(A,open("acc.json","w"),indent=1)
