import json, sys, time, urllib.request, urllib.parse, ssl, re
ctx = ssl.create_default_context(cafile='/root/.ccr/ca-bundle.crt')
UA = {'User-Agent': 'ShortsResearch/1.0 (r4rachit786 project)'}
def get(params):
    params.update(format='json')
    u = 'https://commons.wikimedia.org/w/api.php?' + urllib.parse.urlencode(params)
    for i in range(10):
        try: return json.load(urllib.request.urlopen(urllib.request.Request(u, headers=UA), context=ctx))
        except urllib.error.HTTPError as e:
            if e.code != 429: raise
            time.sleep(10 * (i + 1))
    raise SystemExit('rate limited')
for q in sys.argv[1:]:
    time.sleep(5)
    r = get(dict(action='query', generator='search', gsrsearch=q + ' filetype:bitmap', gsrnamespace=6, gsrlimit=8, prop='imageinfo', iiprop='url|size|extmetadata', iiurlwidth=1600))
    print('=== ', q)
    for p in sorted(r.get('query', {}).get('pages', {}).values(), key=lambda p: p.get('index', 0)):
        ii = p['imageinfo'][0]; m = ii.get('extmetadata', {})
        lic = m.get('LicenseShortName', {}).get('value', '?')
        print(f"  {p['title'][5:]} | {ii['width']}x{ii['height']} | {lic}")
