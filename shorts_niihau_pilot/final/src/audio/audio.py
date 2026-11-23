# Original music bed + synthesized sound effects + mix for the Niihau short. Everything here is generated from code
# (numpy): no samples, no third-party recordings. Cue frames come from words.json (30 fps).
import numpy as np, json, wave, subprocess
from scipy.signal import butter, sosfilt
SR=48000; W=json.load(open("words.json")); N=int(W["total"]*SR); rng=np.random.default_rng(7)
F=lambda fr:int(fr/30*SR)
def env(n,a=0.005,d=0.3): t=np.arange(n)/SR; return np.minimum(1,t/a)*np.exp(-t/d)
def bp(x,lo,hi): return sosfilt(butter(2,[lo,hi],"bp",fs=SR,output="sos"),x)
def lp(x,f): return sosfilt(butter(2,f,"lp",fs=SR,output="sos"),x)
def hp(x,f): return sosfilt(butter(2,f,"hp",fs=SR,output="sos"),x)
def put(buf,fr,x,g=1.0,pan=0.0):
    i=F(fr) if not isinstance(fr,int) or fr<10**6 else fr; n=min(len(x),N-i)
    if n<=0: return
    buf[i:i+n,0]+=x[:n]*g*(1-max(0,pan)); buf[i:i+n,1]+=x[:n]*g*(1+min(0,pan))
def note(f,dur,kind="uke"):
    n=int(dur*SR); t=np.arange(n)/SR; y=np.zeros(n)
    hs={"uke":[(1,1),(2,.5),(3,.28),(4,.12),(5,.06)],"bass":[(1,1),(2,.3),(3,.1)],"bell":[(1,1),(2.76,.5),(5.4,.25),(8.9,.12)],"marimba":[(1,1),(4,.3),(9.2,.08)]}[kind]
    dec={"uke":.38,"bass":.5,"bell":1.1,"marimba":.22}[kind]
    for h,a in hs: y+=a*np.sin(2*np.pi*f*h*t)*np.exp(-t/(dec/(1+0.35*(h-1))))
    return y*np.minimum(1,t/0.003)
A4=440.0; mid=lambda m:A4*2**((m-69)/12)
music=np.zeros((N,2)); sfx=np.zeros((N,2))
def chords(f0,f1,prog,bpm,kind,strum=True,g=1.0,bassg=0.5,pattern=(0,1,2,1,3,1,2,1)):
    beat=60/bpm; t=f0/30; k=0
    while t<f1/30-0.05:
        ch=prog[(k//8)%len(prog)]; st=pattern[k%8]
        if k%8==0: put(music,int(t*30*1) if False else t*30,note(mid(ch[0]-12),beat*3.5,"bass"),bassg*g)
        if k%8==4: put(music,t*30,note(mid(ch[0]-12+7),beat*1.8,"bass"),bassg*g*0.7)
        if strum and st==0:
            for j,m in enumerate(ch): put(music,t*30+j*0.35,note(mid(m),beat*1.6,kind),0.2*g,pan=(j-1.5)*0.2)
        else: put(music,t*30,note(mid(ch[st%len(ch)]+(12 if st==3 else 0)),beat*0.9,kind),0.17*g,pan=0.3*np.sin(k))
        t+=beat/2; k+=1
C=[60,64,67,72]; Am=[57,60,64,69]; Fm=[53,57,60,65]; G=[55,59,62,67]; Dm=[50,53,57,62]; E=[52,56,59,64]
# day: bright ukulele feel; stops dead when the radio brings the news (frame 688); night: sparse minor pulse; mechanism: marimba; ending: ukulele returns
chords(0,633,[C,Am,Fm,G],112,"uke",g=1.0)
chords(633,690,[C,Am],112,"uke",g=0.55)
chords(741,1439,[Am,Fm,Dm,E],92,"marimba",strum=False,g=0.8,bassg=0.75,pattern=(0,2,1,2,0,3,1,2))
chords(1439,1689,[Fm,C,G,C],108,"marimba",g=0.9)
chords(1689,1890,[C,Am,Fm,G],112,"uke",g=1.0)
for j,m in enumerate([48,60,64,67,72]): put(music,1893+j*0.6,note(mid(m),2.6,"uke"),0.3)
# night drone
t=np.arange(F(1439)-F(741))/SR; dr=(np.sin(2*np.pi*55*t)+0.5*np.sin(2*np.pi*82.4*t+0.3*np.sin(2*np.pi*0.2*t)))*0.09*np.minimum(1,t/2)*np.minimum(1,(t[-1]-t)/1.5); put(music,741,dr)
# ---------------- sound effects ----------------
def noise(d): return rng.standard_normal(int(d*SR))
def thud(f=60,d=0.5,g=1): n=int(d*SR); t=np.arange(n)/SR; return (np.sin(2*np.pi*f*t*np.exp(-t*3))*np.exp(-t/0.14)+0.4*lp(noise(d),300)*np.exp(-t/0.08))*g
def crack(d=0.25): n=int(d*SR); t=np.arange(n)/SR; return bp(noise(d),900,5200)*np.exp(-t/0.035)+0.6*bp(noise(d),2500,8000)*np.exp(-np.abs(t-0.07)/0.012)
def click(f=2400,d=0.05): n=int(d*SR); t=np.arange(n)/SR; return np.sin(2*np.pi*f*t)*np.exp(-t/0.006)+0.5*hp(noise(d),3000)*np.exp(-t/0.004)
def whoosh(d=0.4,lo=300,hi=2600): n=int(d*SR); t=np.arange(n)/SR; return bp(noise(d),lo,hi)*np.sin(np.pi*t/d)**2
def paper(d=0.12): n=int(d*SR); t=np.arange(n)/SR; return hp(noise(d),2500)*np.sin(np.pi*t/d)**1.5*0.6
def ping(f=1150,d=1.6): n=int(d*SR); t=np.arange(n)/SR; y=np.sin(2*np.pi*f*t)*np.exp(-t/0.45); e=np.zeros(n); k=int(0.33*SR); e[k:]=y[:-k]*0.35; return y+e
def pop(d=0.3): n=int(d*SR); t=np.arange(n)/SR; return (bp(noise(d),500,3500)*np.exp(-t/0.03)+0.9*np.sin(2*np.pi*95*t*np.exp(-t*5))*np.exp(-t/0.07))
def boing(f0=520,f1=180,d=0.5): n=int(d*SR); t=np.arange(n)/SR; f=f0+(f1-f0)*(t/d); return np.sin(2*np.pi*np.cumsum(f)/SR+2.5*np.sin(2*np.pi*11*t))*np.exp(-t/0.25)
def tok(f=820): return note(f,0.25,"marimba")
def ding(f=1568): return note(f,1.6,"bell")
def static(d): n=int(d*SR); t=np.arange(n)/SR; return bp(noise(d),1200,4200)*(0.6+0.4*np.sin(2*np.pi*3.1*t)*np.sin(2*np.pi*0.7*t))
def crackle(d): n=int(d*SR); y=lp(noise(d),500)*0.25; idx=rng.integers(0,n-600,int(d*14)); 
def fire(d):
    n=int(d*SR); y=lp(noise(d),420)*0.35
    for i in rng.integers(0,n-800,int(d*16)): y[i:i+700]+=hp(rng.standard_normal(700),1800)*np.exp(-np.arange(700)/90)*rng.uniform(0.2,0.9)
    t=np.arange(n)/SR; return y*np.minimum(1,t/0.3)*np.minimum(1,(d-t)/0.4)
def wave_(d): n=int(d*SR); t=np.arange(n)/SR; return lp(noise(d),900)*np.sin(np.pi*t/d)**2
put(sfx,2,paper(0.3),0.5); put(sfx,54,thud(90,0.3),0.55); put(sfx,54,click(900),0.4)          # chart, EMPTY stamp
put(sfx,98,tok(990),0.5); put(sfx,104,tok(1180),0.45)                                         # chalk taps on "136"
put(sfx,246,ping(),0.32); put(sfx,264,ping(1150),0.2)                                         # the waiting submarine
put(sfx,283,thud(55,0.7),0.9); put(sfx,285,crack(0.3),0.5); put(sfx,283,fire(1.9)*0.5,0.5)     # he lands
put(sfx,318,crack(0.3),0.9,0.3); put(sfx,322,crack(0.22),0.7,-0.3); put(sfx,325,click(1500),0.5) # in a fence
put(sfx,398,whoosh(0.18,800,4000),0.4); put(sfx,402,click(1800),0.5); put(sfx,418,paper(0.2),0.7) # pistol, papers
put(sfx,500,boing(),0.3)                                                                      # no luck
put(sfx,576,whoosh(0.5,500,3000),0.25); 
put(sfx,633,static(2.35),0.2); put(sfx,686,static(0.45),0.42); put(sfx,703,click(700,0.08),0.7) # radio; the party stops
put(sfx,741,thud(120,0.25),0.5); put(sfx,743,click(1300,0.07),0.7)                             # locked up
put(sfx,776,wave_(2.4),0.45); put(sfx,790,thud(140,0.2),0.4)                                   # no boats: surf
for k in range(5): put(sfx,855+8*k,paper(0.12),0.75)                                            # calendar pages
put(sfx,922,click(900,0.06),0.8); put(sfx,927,click(1400,0.06),0.8)                             # shotgun
put(sfx,945,fire(16.4),0.22)                                                                    # fire through the night block
put(sfx,1050,ping(1900,0.9),0.15); put(sfx,1060,ping(2300,0.7),0.1)                            # cave drips
put(sfx,1160,whoosh(0.35),0.6)                                                                 # he jumps
for fr in (1204,1216,1226): put(sfx,fr,pop(),0.75)                                             # three shots
put(sfx,1296,thud(48,0.9),0.8)                                                                 # mad
put(sfx,1346,whoosh(0.45,250,2200),0.7); put(sfx,1357,thud(60,0.6),1.0); put(sfx,1358,crack(0.3),0.6) # thrown into the wall
put(sfx,1423,whoosh(0.2,600,3500),0.5); put(sfx,1425,tok(520),0.9); put(sfx,1425,thud(110,0.2),0.5)  # the rock
for j,fq in enumerate((2093,2637,3136)): put(sfx,1430+j*3,ding(fq)[:int(0.5*SR)],0.12)          # stars
put(sfx,1515,thud(150,0.2),0.6)                                                                # PRIVATE sign
for fr,fq in ((1573,700),(1599,620),(1617,880)): put(sfx,fr,tok(fq),0.6)
put(sfx,1646,whoosh(0.4,1500,6000),0.3)                                                        # curtains
put(sfx,1710,ding(),0.4); put(sfx,1730,ping(1150,1.4),0.25); put(sfx,1748,ping(1150,1.2),0.12) # medal; the submarine leaves
put(sfx,1769,whoosh(0.6,400,2000),0.2)
# ---------------- mix ----------------
raw=subprocess.run(["ffmpeg","-v","error","-i","voice.wav","-f","f32le","-ac","1","-ar",str(SR),"-"],capture_output=True).stdout
v=np.frombuffer(raw,dtype=np.float32)[:N]; v=np.pad(v,(0,N-len(v)))
import scipy.ndimage as nd
e=nd.uniform_filter1d(np.abs(v),int(0.25*SR)); duck=1-0.45*np.clip(e/0.05,0,1)                 # music ducks under the voice
music*= (0.115*duck)[:,None]; sfx*=0.3
music[F(690):F(741)]*=np.linspace(1,0,F(741)-F(690))[:,None]**3                               # the party ends quickly
mix=np.stack([v,v],1)*0.9+music+sfx
def wr(name,x): 
    x=np.clip(x,-1,1); w=wave.open(name,"wb"); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x*32767).astype(np.int16).tobytes()); w.close()
wr("stem_music.wav",music); wr("stem_sfx.wav",sfx); wr("premix.wav",mix/np.abs(mix).max()*0.9)
