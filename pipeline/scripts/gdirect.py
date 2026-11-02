import hashlib, subprocess, sys, os, time, json, urllib.parse
out='/tmp/gassets'; meta=json.load(open(out+'/meta.json'))
for name in sys.argv[1:]:
    n=name.replace(' ','_'); h=hashlib.md5(n.encode()).hexdigest(); q=urllib.parse.quote(n)
    fn=os.path.join(out, str(abs(hash(name))%10**8)+'.jpg')
    for w in (1920,1280,960):
        url=f'https://upload.wikimedia.org/wikipedia/commons/thumb/{h[0]}/{h[:2]}/{q}/{w}px-{q}'
        code=subprocess.run(['curl','-sS','-A','WW1ShortVideo/1.0 (https://github.com/r4rachit786-blip/stocks) curl/8','-o',fn,'-w','%{http_code}',url],capture_output=True,text=True).stdout
        print(name[:60], w, code, flush=True); time.sleep(2)
        if code=='200':
            meta.setdefault(name,{}).update(file=fn, page='https://commons.wikimedia.org/wiki/File:'+q); break
    json.dump(meta,open(out+'/meta.json','w'),indent=1)
