# Round 5b voice: 21 "Liam" line files (liam2/), NO tempo change. Trim lead/trail silence, shorten inner pauses
# > 0.35 s to 0.30 s (cut in silence, 10 ms crossfades), join with 0.10 s gaps (0.30 s before lines 8, 11, 18),
# high-pass 80 Hz, gentle compression, peak 0.89. Writes voice.wav + lines6.json.
import subprocess, numpy as np, json, wave
from scipy.signal import butter, sosfilt
import scipy.ndimage as nd
SR=48000; txt=[l.strip() for l in open("script6.txt") if l.strip()]; assert len(txt)==21
out=[]; lines=[]; t=0.2; cut_total=0.0; LONG={4:0.90,8:0.30,11:0.30,18:0.30}  # 0.9 s before "In a fence.": the fence crash plays in that beat
for i in range(21):
    raw=subprocess.run(["ffmpeg","-v","error","-i",f"../liam2/l{i:02d}.mp3","-ac","1","-ar",str(SR),"-f","f32le","-"],capture_output=True).stdout
    x=np.frombuffer(raw,dtype=np.float32).copy(); e=nd.maximum_filter1d(np.abs(x),int(0.02*SR)); th=0.02*e.max(); loud=e>th; idx=np.where(loud)[0]
    a=max(0,idx[0]-int(0.015*SR)); b=min(len(x),idx[-1]+int(0.05*SR)); seg=x[a:b]
    e2=nd.maximum_filter1d(nd.uniform_filter1d(np.abs(x),int(0.02*SR)),int(0.03*SR)); ld=(e2>0.06*e2.max())[a:b]  # inner pauses: below -24 dB re the line's peak (room tone, breaths)
    # inner pauses
    pieces=[]; k=0; n=len(seg); runs=[]; j=0
    while j<n:
        if not ld[j]:
            s=j
            while j<n and not ld[j]: j+=1
            if (j-s)/SR>0.35 and s>0 and j<n: runs.append((s,j))
        else: j+=1
    y=[]; pos=0; F=int(0.01*SR)
    for s,e2 in runs:
        keep=int(0.30*SR); m0=s+keep//2; m1=e2-keep//2  # remove the middle of the silence
        y.append(seg[pos:m0+F].copy()); pos=m1-F; cut_total+=(m1-m0)/SR
    y.append(seg[pos:].copy())
    z=y[0]
    for p in y[1:]:
        r=np.linspace(0,1,F); ov=z[-F:]*(1-r)+p[:F]*r; z=np.concatenate([z[:-F],ov,p[F:]])
    nn=int(0.008*SR); z[:nn]*=np.linspace(0,1,nn); z[-nn:]*=np.linspace(1,0,nn)
    if i in LONG: t+=LONG[i]-0.10
    lines.append({"i":i,"text":txt[i],"t0":round(t,3),"t1":round(t+len(z)/SR,3),"pauses_cut":len(runs)}); out.append((int(t*SR),z)); t+=len(z)/SR+0.10
total=t+0.5; yv=np.zeros(int(total*SR),dtype=np.float32)
for p,seg in out: yv[p:p+len(seg)]+=seg
yv=sosfilt(butter(2,80,"hp",fs=SR,output="sos"),yv)
e=nd.maximum_filter1d(np.abs(yv),int(0.01*SR)); e=nd.uniform_filter1d(e,int(0.05*SR)); thr=0.3; yv=yv*np.where(e>thr,(thr+(e-thr)/2.0)/np.maximum(e,1e-6),1.0); yv=yv/np.abs(yv).max()*0.89
wv=wave.open("voice.wav","wb"); wv.setnchannels(1); wv.setsampwidth(2); wv.setframerate(SR); wv.writeframes((yv*32767).astype(np.int16).tobytes()); wv.close()
json.dump({"total":round(total,3),"lines":lines},open("lines6.json","w")); print("total %.2f s, frames %d, pause time cut %.2f s"%(total,round(total*30),cut_total))
for l in lines: print(l["i"],l["t0"],l["t1"],l["pauses_cut"])
