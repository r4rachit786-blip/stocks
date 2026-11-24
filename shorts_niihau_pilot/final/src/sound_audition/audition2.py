import json,os,subprocess,html
OUT='/home/user/stocks/shorts_niihau_pilot/final/audition'; os.makedirs(OUT+'/music2',exist_ok=True)
log=json.load(open('music2_log.json')); VO='../film/voice.wav'; e=html.escape
SEL={'day':[('0be666c4',0,'+5.0'),('71e101bc',0,'+4.6'),('16586c09',0,'+4.0'),('5d248b6c',0,'+2.7')],
     'night':[('b04b3cf0',0,'+4.2'),('1081948a',40,'+3.9'),('4c83d8dd',10,'+3.9'),('1d81b521',30,'+3.7')],
     'ending':[('692250cb',0,'+3.4'),('aa0b4b0a',10,'+2.8')]}
WIN={'day':(0.0,19.2),'night':(30.1,48.0),'ending':(56.3,64.5)}
LBL={'day':('Day / opening block (Pearl Harbor, the flight, the crash; can lighten for the party)','under the narration of 0:00-0:19'),
     'night':('Night and fire block (helper, fires, the fight)','under the narration of 0:30-0:48'),
     'ending':('Ending (medal, submarine, museum)','under the narration of 0:56-1:04')}
H=['<h2 style="border-top:4px solid #b2271f">Music round 2: cinematic WW2</h2>',
 '<p>Serious orchestral, snare / low strings / brass. Pick one per block (for example <code>day 2, night 1, ending 1</code>). Each track twice: alone (-18 LUFS), then at bed level under the narration (mix at -14 LUFS). All found through Openverse; the licence was confirmed on each source page. CC0 tracks need no credit; CC BY tracks need the attribution line shown. No lyrics, no drum kits. The order is the earshot fit ranking (a hint only). I could not listen to them: check each for a theme you recognise before picking.</p>',
 '<p class="w">Effects are locked from your picks: fence crash A, radio news A, gunshots C, wall throw A, rock A, medal glint A, whoosh C.</p>']
sel_log=[]
for part in ('day','night','ending'):
    v0,v1=WIN[part]; d=v1-v0; da=max(d,15.0)
    H.append(f'<h3>{e(LBL[part][0])}</h3>')
    for i,(pre,st,z) in enumerate(SEL[part]):
        v=log[f'{part}__{pre}']; src=f'mus2/{part}__{pre}.wav'; a=f'music2/{part}_{i+1}_{pre}_alone.mp3'; b=f'music2/{part}_{i+1}_{pre}_under_voice.mp3'
        subprocess.run(['ffmpeg','-y','-v','error','-ss',str(st),'-t',str(da),'-i',src,'-af',f'loudnorm=I=-18:TP=-1.5:LRA=11,afade=t=in:d=0.3,afade=t=out:st={da-1}:d=1','-ar','48000','-b:a','160k',OUT+'/'+a],check=True)
        subprocess.run(['ffmpeg','-y','-v','error','-ss',str(st),'-t',str(d),'-i',src,'-ss',str(v0),'-t',str(d),'-i',VO,'-filter_complex',f'[0:a]loudnorm=I=-18:TP=-1.5:LRA=11,volume=-13dB,afade=t=in:d=0.3,afade=t=out:st={d-1}:d=1[m];[1:a]loudnorm=I=-16:TP=-1.5[v];[m][v]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11[o]','-map','[o]','-ar','48000','-b:a','160k',OUT+'/'+b],check=True)
        t=v['title'].replace('.wav','').replace('.mp3','')
        att='No credit needed (CC0).' if v['licence'].startswith('CC0') else f'Attribution line: <code>{e(chr(34)+t+chr(34))} by {e(str(v["creator"]))} ({e(v["source_url"])}), licensed under {e(v["licence"])} (https://creativecommons.org/licenses/by/{e(v["licence"].split()[-1])}/)</code>'
        H.append(f'<div class="o"><b>{i+1}. {e(t)}</b><span class="m">by {e(str(v["creator"]))} · {e(v["licence"])} · <a href="{e(v["source_url"])}">{e(v["source_url"])}</a> · earshot fit z {z}<br>{att}</span><audio controls preload="none" src="{a}"></audio><audio controls preload="none" src="{b}"></audio></div>')
        sel_log.append({**v,'block':part,'option':i+1,'files':[a,b]})
json.dump(sel_log,open(OUT+'/music2_log.json','w'),indent=1)
p=OUT+'/index.html'; s=open(p).read()
if 'Music round 2' in s: a=s.index('<h2 style="border-top:4px solid #b2271f">'); b=s.index('<!--r2end-->')+len('<!--r2end-->'); s=s[:a]+s[b:]
s=s.replace('<style>','<style>h3{margin-top:22px;font-size:17px}',1) if 'h3{' not in s else s
i=s.index('<h2>')  # first cue heading
s=s[:i]+'\n'.join(H)+'<!--r2end-->\n'+s[i:]
s=s.replace('<h2>Music: day bed','<h2>Round 1, REJECTED by the client. Music: day bed').replace('<h2>Music: night and fire block','<h2>Round 1, REJECTED by the client. Music: night and fire block')
open(p,'w').write(s)
import csv
with open(OUT+'/LICENSES.csv','a',newline='') as f:
    w=csv.writer(f)
    for v in sel_log: w.writerow([v['files'][0],'music2 '+v['block'],v['title'],v['creator'],v['source_url'],v['licence'],'yes'])
