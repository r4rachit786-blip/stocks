import json,os,subprocess,numpy as np,soundfile as sf,html,shutil
S=os.path.dirname(os.path.abspath(__file__)); OUT='/home/user/stocks/shorts_niihau_pilot/final/audition'
os.makedirs(OUT+'/sfx',exist_ok=True); os.makedirs(OUT+'/music',exist_ok=True)
log=json.load(open('sfx_log.json')); EAR=[S+'/../tools/earshot/.venv/bin/python','-m','earshot','--threads','2']
SR=48000
def load(p):
    x,sr=sf.read(p,always_2d=True); assert sr==SR; return x.astype(np.float64)
def event(x,maxlen):
    m=np.abs(x).max(1); th=max(0.02,0.12*m.max()); i=int(np.argmax(m>th)); a=max(0,i-int(0.02*SR)); b=min(len(x),a+int(maxlen*SR))
    env=np.convolve(m[a:b],np.ones(2400)/2400,'same'); q=np.where(env>0.01*env.max())[0]; b=a+min(len(env),q[-1]+int(0.15*SR)) if len(q) else b
    y=x[a:b].copy(); n=min(len(y),int(0.08*SR)); y[-n:]*=np.linspace(1,0,n)[:,None]; return y
def match(y,target=-20.0):
    m=(y**2).mean(1); w=min(len(m),int(0.4*SR)); c=np.cumsum(np.r_[0,m]); r=((c[w:]-c[:-w])/w).max(); g=10**(target/20)/np.sqrt(r+1e-12)
    y=y*g; pk=np.abs(y).max(); lim=10**(-1/20)
    return y*(lim/pk) if pk>lim else y
CUES={ # cue: (title, where in the film, earshot description, max seconds, builder)
 'fence_crash':('Fence crash','0:10.7, the nose goes through the fence (frame 320)','a vehicle crashing through a wooden fence, planks breaking',3.2),
 'radio_news':('Radio news','0:22.9, the battery radio delivers the news (frame 686); cut to silence after','old radio static and tuning between stations',3.0),
 'gunshot':('Three gunshots','0:40.1, frames 1204 / 1216 / 1226 (played here as the three shots at film spacing)','a single pistol gunshot outdoors',1.2),
 'wall_throw':('Throw into the stone wall','0:45.2, the pilot meets the wall (frame 1357)','a heavy body hitting the ground with a thud',1.6),
 'rock':('The rock','0:47.5, the swing lands (frame 1425)','a rock knocking on something hard, a short dull knock',0.9),
 'medal_glint':('Medal glint','0:56.9, the medal catches the light (frame 1707)','a small bright bell ding',1.8),
 'whoosh':('Whoosh for the two whip-pans','0:24.7 and 0:25.8 (frames 741 and 774)','a short fast air whoosh',0.9),
}
page=[]
for cue,(title,where,desc,mx) in CUES.items():
    items=[v for v in log.values() if v['cue']==cue]; made=[]
    for v in items:
        x=load('lib/'+v['file']); y=event(x,mx)
        if cue=='gunshot':
            one=y; n=int(1.9*SR); z=np.zeros((n,2))
            for t in (0,12/30,22/30): a=int(t*SR); L=min(len(one),n-a); z[a:a+L]+=one[:L]
            y=z
        y=match(y); fn=f"sfx/{v['file'][:-4]}.wav"; sf.write(OUT+'/'+fn,y,SR,subtype='PCM_16'); made.append((v,fn))
    r=subprocess.run(EAR+['rank','--json',desc]+[OUT+'/'+fn for _,fn in made],capture_output=True,text=True)
    rk={}
    try:
        j=json.loads(r.stdout[r.stdout.index('{'):]); 
        for it in j.get('results',j.get('files',[])): rk[os.path.basename(it.get('path',it.get('file','')))]=(it.get('z'),it.get('verdict'))
    except Exception as e: print('rank parse',cue,e,r.stdout[:300],r.stderr[-300:])
    made.sort(key=lambda m:-(rk.get(os.path.basename(m[1]),(0,))[0] or 0))
    page.append((cue,title,where,desc,made,rk))
    print(cue,[(os.path.basename(fn),rk.get(os.path.basename(fn))) for _,fn in made])
# ---- music: excerpt alone and under the voice, all at the same loudness ----
MUS={'day':[('Sneaky Snitch','inc_Sneaky%20Snitch.mp3',2.0),('Scheming Weasel (faster version)','inc_Scheming%20Weasel%20faster.mp3',1.0),('Monkeys Spinning Monkeys','inc_Monkeys%20Spinning%20Monkeys.mp3',1.0),('Sneaky Adventure','inc_Sneaky%20Adventure.mp3',1.0)],
     'night':[('Hidden Agenda','inc_Hidden%20Agenda.mp3',2.0),('Investigations','inc_Investigations.mp3',2.0),("Marty Gots a Plan",'inc_Marty%20Gots%20a%20Plan.mp3',1.0)]}
VO=S+'/../film/voice.wav'; mus=[]
for part,(v0,v1) in {'day':(0.0,19.2),'night':(30.1,48.0)}.items():
    for name,f,st in MUS[part]:
        slug=part+'_'+name.lower().replace(' ','_').replace('(','').replace(')','')
        a=f'{OUT}/music/{slug}_alone.mp3'; b=f'{OUT}/music/{slug}_under_voice.mp3'; d=v1-v0
        subprocess.run(['ffmpeg','-y','-v','error','-ss',str(st),'-t',str(d),'-i','dl/'+f,'-af',f'loudnorm=I=-18:TP=-1.5:LRA=11,afade=t=in:d=0.3,afade=t=out:st={d-1}:d=1','-ar','48000','-b:a','160k',a],check=True)
        subprocess.run(['ffmpeg','-y','-v','error','-ss',str(st),'-t',str(d),'-i','dl/'+f,'-ss',str(v0),'-t',str(d),'-i',VO,'-filter_complex',f'[0:a]loudnorm=I=-18:TP=-1.5:LRA=11,volume=-13dB,afade=t=in:d=0.3,afade=t=out:st={d-1}:d=1[m];[1:a]loudnorm=I=-16:TP=-1.5[v];[m][v]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11[o]','-map','[o]','-ar','48000','-b:a','160k',b],check=True)
        mus.append((part,name,os.path.basename(a),os.path.basename(b)))
ATT=lambda n: f'"{n}" Kevin MacLeod (incompetech.com). Licensed under Creative Commons: By Attribution 4.0 License. http://creativecommons.org/licenses/by/4.0/'
e=html.escape
H=['<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sound audition: The island that was supposed to be empty</title>',
'<style>body{font:16px/1.5 system-ui,sans-serif;max-width:860px;margin:24px auto;padding:0 16px;color:#1c1b22;background:#faf8f3}h1{font-size:24px}h2{margin-top:36px;border-top:2px solid #d8d2c4;padding-top:16px;font-size:20px}.o{background:#fff;border:1px solid #d8d2c4;border-radius:8px;padding:12px 14px;margin:10px 0}.o b{display:block}.m{color:#5c5868;font-size:14px}audio{width:100%;margin-top:6px}code{background:#eee9dc;padding:1px 5px;border-radius:4px}.w{color:#5c5868}</style></head><body>',
'<h1>Sound audition</h1><p>Pick one option per cue and one music track per block; reply with the option letters (for example <code>fence B, radio A, shots C, wall A, rock B, medal A, whoosh A, day 1, night 2</code>). The final mix is built only after these picks. Every effect below is a real recording, found through Openverse, licence confirmed on the source page (CC0 only). All options of one cue are matched in level (loudest 0.4 s at the same RMS, peaks under -1 dBFS), so judge the sound, not the volume. The order inside a cue is the fit ranking from earshot (a listening tool), best first; it is a hint, not a decision.</p>']
for cue,title,where,desc,made,rk in page:
    H.append(f'<h2>{e(title)}</h2><p class="w">{e(where)}</p>')
    for i,(v,fn) in enumerate(made):
        z=rk.get(os.path.basename(fn)); zt=f' · earshot fit: {z[1]} (z {z[0]:+.1f})' if z and z[0] is not None else ''
        H.append(f'<div class="o"><b>{chr(65+i)}. {e(v["title"])}</b><span class="m">by {e(str(v["creator"]))} · {e(v["licence"])} · <a href="{e(v["source_url"])}">{e(v["source_url"])}</a>{e(zt)}</span><audio controls preload="none" src="{fn}"></audio></div>')
for part,label,note in (('day','Music: day bed (opening, crash, party, mechanism, ending)','Each track twice: alone, and at bed level under the narration of 0:00-0:19.'),('night','Music: night and fire block (helper, fires, fight)','Each track twice: alone, and at bed level under the narration of 0:30-0:48.')):
    H.append(f'<h2>{e(label)}</h2><p class="w">{e(note)} All excerpts at -18 LUFS alone, mixes at -14 LUFS.</p>')
    for i,(p,name,a,b) in enumerate([m for m in mus if m[0]==part]):
        H.append(f'<div class="o"><b>{i+1}. {e(name)}</b><span class="m">Kevin MacLeod · CC BY 4.0 · <a href="https://incompetech.com/music/royalty-free/music.html">incompetech.com</a><br>Attribution line for the description: <code>{e(ATT(name))}</code></span><audio controls preload="none" src="music/{a}"></audio><audio controls preload="none" src="music/{b}"></audio></div>')
H.append('<h2>Beds already sourced (no choice needed unless you object)</h2><p class="w">Real recordings, CC0, held ready for the mix: propeller aircraft (3), machine-gun burst (2), distant explosions (2), crowd cheer (2), ukulele (2), radio static (1). Still to source after your picks: fire, sea, sheep, night insects, wind, museum room tone, torch. Full log: <code>LICENSES.csv</code> and <code>sfx_log.json</code> in this folder.</p></body></html>')
open(OUT+'/index.html','w').write('\n'.join(H))
shutil.copy('LICENSES.csv',OUT); shutil.copy('sfx_log.json',OUT)
json.dump({'music':[{'block':p,'title':n,'artist':'Kevin MacLeod','source':'https://incompetech.com','licence':'CC BY 4.0','attribution':ATT(n)} for p,n,_,_ in mus]},open(OUT+'/music_log.json','w'),indent=1)
