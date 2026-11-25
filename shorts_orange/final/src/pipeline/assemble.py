# Orange voice: 12 Liam lines -> trim lead/trail silence, inner pauses > 0.35 s -> 0.30 s (line 10's [pause] kept ~0.5 s),
# gaps 0.10 s (0.35 s before line 9, 0.25 s before line 10), high-pass, gentle compression, then atempo 1.2 (pitch kept).
import subprocess, numpy as np, json, wave
from scipy.signal import butter, sosfilt
import scipy.ndimage as nd
SR=48000; K=1.2; V="/tmp/claude-0/-home-user-stocks/898ea701-1503-5cc7-b811-4df21447c708/scratchpad/orange/voice"
txt=[l.strip() for l in open("script.txt") if l.strip()]; assert len(txt)==12
GAP={9:0.35,10:0.25}; out=[]; lines=[]; t=0.15; cut=0.0
for i in range(12):
    x=np.frombuffer(subprocess.run(["ffmpeg","-v","error","-i",f"{V}/o{i:02d}.mp3","-ac","1","-ar",str(SR),"-f","f32le","-"],capture_output=True).stdout,dtype=np.float32).copy()
    e=nd.maximum_filter1d(np.abs(x),int(0.02*SR)); idx=np.where(e>0.02*e.max())[0]
    a=max(0,idx[0]-int(0.015*SR)); b=min(len(x),idx[-1]+int(0.05*SR)); seg=x[a:b]
    e2=nd.maximum_filter1d(nd.uniform_filter1d(np.abs(x),int(0.02*SR)),int(0.03*SR)); ld=(e2>0.10*e2.max())[a:b]
    runs=[]; j=0; n=len(seg)
    while j<n:
        if not ld[j]:
            s=j
            while j<n and not ld[j]: j+=1
            if (j-s)/SR>0.35 and s>0 and j<n: runs.append((s,j))
        else: j+=1
    keep=0.50 if i==10 else 0.30
    if i==10 and runs: runs=[r for r in runs]  # the [pause] after "Santra!" is the longest run: keep it at 0.5 s
    y=[]; pos=0; F=int(0.01*SR)
    for s,e3 in runs:
        kp=int((keep if (i==10 and (e3-s)==max(r[1]-r[0] for r in runs)) else 0.30)*SR)
        if (e3-s)<=kp: continue
        m0=s+kp//2; m1=e3-kp//2; y.append(seg[pos:m0+F].copy()); pos=m1-F; cut+=(m1-m0)/SR
    y.append(seg[pos:].copy()); z=y[0]
    for p in y[1:]:
        r=np.linspace(0,1,F); z=np.concatenate([z[:-F],z[-F:]*(1-r)+p[:F]*r,p[F:]])
    nn=int(0.008*SR); z[:nn]*=np.linspace(0,1,nn); z[-nn:]*=np.linspace(1,0,nn)
    if i in GAP: t+=GAP[i]-0.10
    lines.append({"i":i,"text":txt[i],"t0":t,"t1":t+len(z)/SR,"pauses":[round((e3-s)/SR,2) for s,e3 in runs]}); out.append((int(t*SR),z)); t+=len(z)/SR+0.10
total=t+0.4; yv=np.zeros(int(total*SR),np.float32)
for p,z in out: yv[p:p+len(z)]+=z
yv=sosfilt(butter(2,80,"hp",fs=SR,output="sos"),yv)
e=nd.maximum_filter1d(np.abs(yv),int(0.01*SR)); e=nd.uniform_filter1d(e,int(0.05*SR)); thr=0.3; yv=yv*np.where(e>thr,(thr+(e-thr)/2.0)/np.maximum(e,1e-6),1.0); yv=yv/np.abs(yv).max()*0.89
def wr(f,y):
    w=wave.open(f,"wb"); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(y,-1,1)*32767).astype(np.int16).tobytes()); w.close()
wr("voice_1x.wav",yv)
subprocess.run(["ffmpeg","-v","error","-y","-i","voice_1x.wav","-af",f"atempo={K}","-ar",str(SR),"voice.wav"],check=True)
for l in lines: l["t0"]=round(l["t0"]/K,3); l["t1"]=round(l["t1"]/K,3)
T=round(total/K,3); json.dump({"total":T,"lines":lines},open("lines.json","w"))
print("1x %.2f s, 1.2x %.2f s (%d frames), inner pause cut %.2f s"%(total,T,round(T*30),cut))
for l in lines: print(l["i"],l["t0"],l["t1"],l["pauses"])
