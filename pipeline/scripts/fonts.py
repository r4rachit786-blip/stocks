import re, base64, urllib.request, ssl, sys
css = open('/tmp/build/fonts/fonts.css').read()
blocks = re.findall(r'/\* ([\w-]+) \*/\s*(@font-face\s*\{[^}]*\})', css)
ctx = ssl.create_default_context(cafile='/root/.ccr/ca-bundle.crt')
out = []
for subset, b in blocks:
    if subset != 'latin': continue
    url = re.search(r'url\((https://[^)]+)\)', b).group(1)
    data = urllib.request.urlopen(url, context=ctx).read()
    b = b.replace(url, 'data:font/woff2;base64,' + base64.b64encode(data).decode())
    out.append(b)
open('/tmp/build/fonts/inline.css','w').write('\n'.join(out))
print(len(out), sum(len(x) for x in out))
