import json,subprocess,re,os,time,csv,sys
UA='Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'
idx=json.load(open('ovm_index.json'))
PICK=json.load(open('mpicks.json'))
log=json.load(open('music2_log.json')) if os.path.exists('music2_log.json') else {}
os.makedirs('mus2',exist_ok=True)
def curl(url,out):
    for t in range(3):
        r=subprocess.run(['curl','-sL','-A',UA,'-o',out,'-w','%{http_code}',url],capture_output=True,text=True)
        if r.stdout=='200': return True
        time.sleep(8*(t+1))
    return False
for cue,ids in PICK.items():
    for pre in ids:
        m=[v for k,v in idx.items() if k.startswith(pre)]
        if not m: print('NOIDX',pre); continue
        x=m[0]; name=f"{cue}__{pre}"
        if name in log: continue
        if not curl(x['foreign_landing_url'],'ov/landing.html'): print('LANDING FAIL',pre); continue
        h=open('ov/landing.html',errors='ignore').read()
        lic=set(re.findall(r'creativecommons\.org/(publicdomain/zero|publicdomain/mark|licenses/[a-z\-]+)',h)); ver=(re.findall(r'creativecommons\.org/licenses/by/([0-9.]+)',h) or ['4.0'])[0]
        ok = lic in ({'publicdomain/zero'},{'publicdomain/mark'},{'licenses/by'})
        if not ok: print('LICENCE MISMATCH',pre,x['title'],lic); continue
        if not curl(x['url'],f'ov/{name}.src'): print('DL FAIL',pre); continue
        subprocess.run(['ffmpeg','-y','-v','error','-i',f'ov/{name}.src','-ar','48000','-ac','2',f'mus2/{name}.wav'])
        log[name]={'file':f'{name}.wav','cue':cue,'title':x['title'],'creator':x['creator'],'source_url':x['foreign_landing_url'],'download_url':x['url'],'licence':'CC0 1.0' if 'zero' in list(lic)[0] else ('CC BY '+ver if 'by' in list(lic)[0] else 'Public Domain Mark'),'licence_checked_on_source_page':True,'found_via':'Openverse','openverse_id':x['id']}
        print('OK',name,x['title'][:40],'|',x['creator'])
        time.sleep(2)
json.dump(log,open('music2_log.json','w'),indent=1)
