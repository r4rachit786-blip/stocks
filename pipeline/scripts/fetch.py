# batch-resolve titles -> thumb urls in ONE api call, then download thumbs politely
import json, sys, time, urllib.request, urllib.parse, ssl, os
ctx = ssl.create_default_context(cafile='/root/.ccr/ca-bundle.crt')
UA = {'User-Agent': 'WW1ShortVideo/1.0 (https://github.com/r4rachit786-blip/stocks) python-urllib'}
out = sys.argv[1]; titles = sys.argv[2:]
os.makedirs(out, exist_ok=True)
def req(u):
    for i in range(14):
        try: return urllib.request.urlopen(urllib.request.Request(u, headers=UA), context=ctx).read()
        except urllib.error.HTTPError as e:
            if e.code != 429: raise
            time.sleep(10 * (i + 1))
    raise SystemExit('rate limited: ' + u)
q = dict(action='query', titles='|'.join('File:' + t for t in titles), prop='imageinfo', iiprop='url|size|extmetadata', iiurlwidth=1920, format='json')
r = json.loads(req('https://commons.wikimedia.org/w/api.php?' + urllib.parse.urlencode(q)))
meta = {}
for p in r['query']['pages'].values():
    if 'imageinfo' not in p: print('MISSING', p['title']); continue
    ii = p['imageinfo'][0]; m = ii.get('extmetadata', {})
    name = p['title'][5:]; url = ii.get('thumburl') or ii['url']
    fn = os.path.join(out, str(abs(hash(name)) % 10**8) + os.path.splitext(urllib.parse.urlparse(url).path)[1])
    if not os.path.exists(fn):
        time.sleep(6)
        import subprocess
        code = subprocess.run(['curl','-sS','-A','WW1ShortVideo/1.0 (https://github.com/r4rachit786-blip/stocks) curl/8','-o',fn+'.part','-w','%{http_code}',url],capture_output=True,text=True).stdout
        if code != '200': print('FAIL', code, name, flush=True); continue
        os.rename(fn+'.part', fn)
    meta[name] = dict(file=fn, license=m.get('LicenseShortName', {}).get('value'), artist=m.get('Artist', {}).get('value', '')[:200], page=ii['descriptionurl'])
    print(name, '->', fn, meta[name]['license'], flush=True)
    old = json.load(open(out + '/meta.json')) if os.path.exists(out + '/meta.json') else {}
    old.update(meta); json.dump(old, open(out + '/meta.json', 'w'), indent=1)
old = json.load(open(out + '/meta.json')) if os.path.exists(out + '/meta.json') else {}
old.update(meta); json.dump(old, open(out + '/meta.json', 'w'), indent=1)
