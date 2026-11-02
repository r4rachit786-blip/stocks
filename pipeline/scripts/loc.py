import json, sys, time, urllib.request, urllib.parse, ssl
ctx = ssl.create_default_context(cafile='/root/.ccr/ca-bundle.crt')
for q in sys.argv[1:]:
    u = 'https://www.loc.gov/photos/?' + urllib.parse.urlencode({'q': q, 'fo': 'json', 'c': 12})
    try: d = json.load(urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'}), context=ctx))
    except Exception as e: print('ERR', q, e); continue
    print('=== ', q)
    for r in d.get('results', []):
        im = (r.get('image_url') or [''])[-1].split('#')[0]
        rights = ' '.join(r.get('rights_advisory', []) if isinstance(r.get('rights_advisory'), list) else [str(r.get('rights_advisory', ''))])[:40]
        print('  ', r.get('title', '')[:80], '|', r.get('date'), '|', im.replace('https://tile.loc.gov/storage-services/service/', ''), '|', rights)
    time.sleep(1)
