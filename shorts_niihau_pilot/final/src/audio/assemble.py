import subprocess, numpy as np, glob, json, wave
from scipy.signal import butter, sosfilt
import scipy.ndimage as nd
SR=48000; out=[]; words=[]; lines=[]; t=0.2
files=sorted(glob.glob("voice/ryan/c*.mp3")); txt=[l.strip() for l in open("script.txt") if l.strip()]
for i,f in enumerate(files):
    raw=subprocess.run(["ffmpeg","-v","error","-i",f,"-ac","1","-ar",str(SR),"-f","f32le","-"],capture_output=True).stdout
    x=np.frombuffer(raw,dtype=np.float32).copy(); w=json.load(open(f[:-3]+"json"))
    a=max(0,int((w[0]["t"]-0.03)*SR)); b=min(len(x),int((w[-1]["t"]+w[-1]["d"]+0.06)*SR)); seg=x[a:b]
    n=int(0.01*SR); seg[:n]*=np.linspace(0,1,n); seg[-n:]*=np.linspace(1,0,n); off=t-a/SR
    for k in w: words.append({"w":k["w"],"t":round(k["t"]+off,3),"d":round(k["d"],3),"line":i})
    lines.append({"i":i,"text":txt[i],"t0":round(t,3),"t1":round(t+len(seg)/SR,3)})
    out.append((int(t*SR),seg)); t+=len(seg)/SR+(0.12 if txt[i][-1] in ".:" else 0.08)
total=t+1.0; y=np.zeros(int(total*SR),dtype=np.float32)
for p,seg in out: y[p:p+len(seg)]+=seg
y=sosfilt(butter(2,80,"hp",fs=SR,output="sos"),y)
e=nd.maximum_filter1d(np.abs(y),int(0.01*SR)); e=nd.uniform_filter1d(e,int(0.05*SR)); thr=0.25; y=y*np.where(e>thr,(thr+(e-thr)/2.5)/np.maximum(e,1e-6),1.0); y=y/np.abs(y).max()*0.89
wv=wave.open("voice.wav","wb"); wv.setnchannels(1); wv.setsampwidth(2); wv.setframerate(SR); wv.writeframes((y*32767).astype(np.int16).tobytes()); wv.close()
json.dump({"total":round(total,3),"words":words,"lines":lines},open("words.json","w"))
print("total %.2f s, %d words, %.2f w/s, frames %d"%(total,len(words),len(words)/(lines[-1]["t1"]-lines[0]["t0"]),round(total*30)))
print(" ".join("%d:%d"%(l["i"],round(l["t0"]*30)) for l in lines))
