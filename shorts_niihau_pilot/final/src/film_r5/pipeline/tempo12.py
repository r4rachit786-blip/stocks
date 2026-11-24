# Round 6 voice: the approved 1x assembly (voice_r6_1x.wav) through atempo=1.2 (pitch kept); then the pause before
# "In a fence." is lengthened by 0.15 s (0.75 -> 0.90 s, its old length) so the whole fence crash fits in it.
import subprocess, numpy as np, wave, json
SR=48000; K=1.2; ADD=0.15
x=np.frombuffer(subprocess.run(["ffmpeg","-v","error","-i","voice_r6_1x.wav","-af",f"atempo={K}","-ac","1","-ar",str(SR),"-f","f32le","-"],capture_output=True).stdout,dtype=np.float32).copy()
L=json.load(open("lines6_1x.json")); l3,l4=L["lines"][3],L["lines"][4]
cut=(l3["t1"]+l4["t0"])/2/K; i=int(cut*SR); print("insert at %.3f s, level there %.5f"%(cut,np.abs(x[i-2400:i+2400]).max()))
y=np.concatenate([x[:i],np.zeros(int(ADD*SR),np.float32),x[i:]])
w=wave.open("voice.wav","wb"); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(y,-1,1)*32767).astype(np.int16).tobytes()); w.close()
for l in L["lines"]:
    sh=ADD if l["i"]>=4 else 0.0; l["t0"]=round(l["t0"]/K+sh,3); l["t1"]=round(l["t1"]/K+sh,3)
L["total"]=round(len(y)/SR,3); L["tempo"]=K; L["crash_pause_added"]=ADD
json.dump(L,open("lines6.json","w")); print("total %.3f s, %d frames"%(L["total"],round(L["total"]*30)))
