# Orange v2 master (client levels): voice + three music blocks (ducked) + beds (lightly ducked) + accents; two-pass loudnorm -14 LUFS / -1.5 dBTP
import json, subprocess, numpy as np, wave, scipy.ndimage as nd, re, sys
S="/tmp/claude-0/-home-user-stocks/898ea701-1503-5cc7-b811-4df21447c708/scratchpad"; SR=48000
def load(f, ch=2):
    x=np.frombuffer(subprocess.run(["ffmpeg","-v","error","-i",f,"-ac",str(ch),"-ar",str(SR),"-f","f32le","-"],capture_output=True).stdout,dtype=np.float32)
    return x.reshape(-1,ch).copy()
def save(f,y):
    y=np.clip(y,-1,1); w=wave.open(f,"wb"); w.setnchannels(y.shape[1]); w.setsampwidth(2); w.setframerate(SR); w.writeframes((y*32767).astype(np.int16).tobytes()); w.close()
def lufs(f):
    o=subprocess.run(["ffmpeg","-hide_banner","-i",f,"-af","loudnorm=print_format=json","-f","null","-"],capture_output=True,text=True).stderr
    return json.loads(o[o.rindex("{"):])
T=47.033; N=int(T*SR)  # orange: the film length (1411 frames)
W=[[0,0],[1411,1411]]
def nt(g):
    for i in range(1,len(W)):
        if g<=W[i][1]: a,A=W[i-1];b,B=W[i]; return (a+(b-a)*(g-A)/(B-A))/30
fit=lambda x: np.pad(x,((0,max(0,N-len(x))),(0,0)))[:N]
voice=fit(load(S+"/orange2/build/voice.wav"))
# ---- music: day (0 .. radio news), night (the whip into the prisoner .. the rock), ending (You see .. end) ----
def block(f,t0,t1,off=0.0,fi=0.3,fo=0.6):
    x=load(f); a=int(off*SR); n=int((t1-t0)*SR); seg=x[a:a+n].copy()
    if len(seg)<n: seg=np.concatenate([seg,np.zeros((n-len(seg),2),np.float32)])
    ki,ko=int(fi*SR),int(fo*SR); seg[:ki]*=np.linspace(0,1,ki)[:,None]; seg[-ko:]*=np.linspace(1,0,ko)[:,None]
    y=np.zeros((N,2),np.float32); s=int(t0*SR); y[s:s+n]+=seg[:N-s]; return y
music=block(S+"/snd/lib/bed_ukulele__0bc07103.wav",0,T,0,0.3,1.8)  # "Ukulele quiet background melody", el_boss, CC0
beds=fit(load("beds_mix_sfx_track.wav")); acc=fit(load("acc_mix_sfx_track.wav"))
# ---- voice activity envelope (for ducking) ----
v=np.abs(voice[:,0]); e=nd.maximum_filter1d(v,int(0.05*SR)); act=(e>0.04).astype(np.float32)
act=nd.maximum_filter1d(act,int(0.15*SR)); act=nd.uniform_filter1d(act,int(0.12*SR))  # ~120 ms attack / release
def db(x): return 10**(x/20)
GM_ON, GM_OFF = float(sys.argv[1]) if len(sys.argv)>1 else -17, float(sys.argv[2]) if len(sys.argv)>2 else -10   # music re voice level, under speech / between lines
GB_ON, GB_OFF = -24, -19     # beds re voice level
ACC_PEAK = -8.0              # accents: peaks this many dB under the voice peak
save("_v.wav",voice); save("_m.wav",music); save("_b.wav",beds)
Lv=lufs("_v.wav")["input_i"]; Lm=lufs("_m.wav")["input_i"]; Lb=lufs("_b.wav")["input_i"]; Lv,Lm,Lb=float(Lv),float(Lm),float(Lb)
gm=(db(Lv+GM_ON-Lm)*act+db(Lv+GM_OFF-Lm)*(1-act))[:,None]
gb=(db(Lv+GB_ON-Lb)*act+db(Lv+GB_OFF-Lb)*(1-act))[:,None]
vp=np.abs(voice).max(); ap=np.abs(acc).max(); ga=vp*db(ACC_PEAK)/ap
mix=voice+music*gm+beds*gb+acc*ga
mix/=max(1.0,np.abs(mix).max()/0.95)
save("premixq.wav",mix)
# master: gain to -14 LUFS into a peak limiter at -2.2 dBFS (true peak lands about -1.9 dBTP); two passes on the gain
g=-16.0-float(lufs("premixq.wav")["input_i"])
for _ in range(3):
    subprocess.run(["ffmpeg","-v","error","-y","-i","premixq.wav","-af",f"volume={g:.2f}dB,alimiter=limit=0.74:attack=2:release=80:level=false","-ar","48000","masterq.wav"],check=True)
    li=float(lufs("masterq.wav")["input_i"]); 
    if abs(li+16)<0.1: break
    g+=-16.0-li
m2=lufs("masterq.wav")
# accent peaks vs voice peaks, measured in 50 ms windows on the stems at their mix gains
win=int(0.05*SR); pk=lambda x: nd.maximum_filter1d(np.abs(x).max(1),win)
print(json.dumps({"voice_LUFS":Lv,"music_LUFS":Lm,"beds_LUFS":Lb,"accent_peak_re_voice_peak_dB":round(float(20*np.log10(ap*ga/vp)),1),
  "music_gain_on_off_dB":[GM_ON,GM_OFF],"master":{k:m2[k] for k in ["input_i","input_tp","input_lra"]}},indent=1))
