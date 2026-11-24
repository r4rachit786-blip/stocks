import sys,json,subprocess,time,urllib.parse,os
UA='Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'
def q(term,extra=''):
    url='https://api.openverse.org/v1/audio/?q='+urllib.parse.quote(term)+'&license=cc0,pdm,by&page_size=20'+extra
    for t in range(4):
        r=subprocess.run(['curl','-s','-A',UA,'-w','\n%{http_code}',url],capture_output=True,text=True)
        body,code=r.stdout.rsplit('\n',1)
        if code=='200': return json.loads(body)
        time.sleep(15*(t+1))
    print('FAIL',term,code); return {'results':[]}
idx=json.load(open('ovm_index.json')) if os.path.exists('ovm_index.json') else {}
for term in sys.argv[1:]:
    d=q(term)
    print(f"## {term}: {d.get('result_count')}")
    for x in d['results']:
        dur=(x.get('duration') or 0)/1000
        print(f"  {x['id'][:8]} {dur:6.1f}s {x['license']:4} {x.get('source','')[:12]:12} {str(x.get('title'))[:50]:50} | {str(x.get('creator'))[:18]}")
        idx[x['id']]={k:x.get(k) for k in ['id','title','creator','creator_url','license','license_version','license_url','foreign_landing_url','url','duration','source','provider','filetype','sample_rate','category']}
    time.sleep(3)
json.dump(idx,open('ovm_index.json','w'))
