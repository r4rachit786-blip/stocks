# word timings from faster-whisper (small.en) on voice.wav, mapped back onto the script words (script spelling kept)
import json, re, sys, difflib
from faster_whisper import WhisperModel
wav=sys.argv[1] if len(sys.argv)>1 else "voice.wav"
m=WhisperModel("small.en",device="cpu",compute_type="int8")
import subprocess, numpy as np
aud=np.frombuffer(subprocess.run(["ffmpeg","-v","error","-i",wav,"-ac","1","-ar","16000","-f","f32le","-"],capture_output=True).stdout,dtype=np.float32)
segs,_=m.transcribe(aud,word_timestamps=True,vad_filter=False,beam_size=5)
hw=[]; text=[]
for s in segs:
    text.append(s.text.strip())
    for w in s.words: hw.append((re.sub(r"[^a-z0-9']","",w.word.lower()),w.start,w.end))
print("\n".join(text))
if len(sys.argv)>2: sys.exit()
L=json.load(open("lines.json")); sw=[]
for l in L["lines"]:
    for w in l["text"].replace("Niihau","Niihau").split(): sw.append((w,l["i"]))
norm=lambda w: re.sub(r"[^a-z0-9']","",w.lower())
a=[norm(w) for w,_ in sw]; b=[w for w,_,_ in hw]
sm=difflib.SequenceMatcher(None,a,b,autojunk=False); t=[None]*len(sw)
for tag,i1,i2,j1,j2 in sm.get_opcodes():
    if tag=="equal":
        for k in range(i2-i1): t[i1+k]=(hw[j1+k][1],hw[j1+k][2])
    elif tag=="replace" and j2>j1:   # spread the heard span over the script words
        s0,s1=hw[j1][1],hw[j2-1][2]; n=i2-i1
        for k in range(n): t[i1+k]=(s0+(s1-s0)*k/n,s0+(s1-s0)*(k+1)/n)
# fill gaps by interpolation inside the line
for i in range(len(sw)):
    if t[i] is None:
        p=next((t[j] for j in range(i-1,-1,-1) if t[j]),None); n=next((t[j] for j in range(i+1,len(sw)) if t[j]),None)
        s=p[1] if p else L["lines"][sw[i][1]]["t0"]; e=n[0] if n else s+0.2; t[i]=(s,max(s+0.05,min(e,s+0.3)))
words=[]
for (w,li),(s,e) in zip(sw,t):
    l=L["lines"][li]; s=min(max(s,l["t0"]-0.05),l["t1"]); words.append({"w":w.strip(".,:"),"t":round(s,3),"d":round(max(0.05,e-s),3),"line":li})
json.dump({"total":L["total"],"words":words,"lines":L["lines"]},open("words.json","w"))
print(len(words),"words; unmatched ops:",[(tag,a[i1:i2],b[j1:j2]) for tag,i1,i2,j1,j2 in sm.get_opcodes() if tag!="equal"])
