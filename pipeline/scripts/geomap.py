import json, math
from PIL import Image, ImageDraw, ImageFilter
W, H = 2400, 1731
lam0, phi0 = math.radians(20), math.radians(50)
def P(lon, lat):
    l, p = math.radians(lon), math.radians(lat)
    c = 1 + math.sin(phi0) * math.sin(p) + math.cos(phi0) * math.cos(p) * math.cos(l - lam0)
    if c < 0.2: return None
    k = math.sqrt(2 / c)
    return k * math.cos(p) * math.sin(l - lam0), -k * (math.cos(phi0) * math.sin(p) - math.sin(phi0) * math.cos(p) * math.cos(l - lam0))
x0, _ = P(-12, 48); x1, _ = P(56, 48); _, ytop = P(20, 71); _, ybot = P(20, 31)
sx = W / (x1 - x0); cy = (ytop + ybot) / 2; S = sx
def T(lon, lat):
    q = P(lon, lat)
    if q is None: return None
    return ((q[0] - x0) * S, H / 2 + (q[1] - cy) * S)
def rings(geom):
    if geom['type'] == 'Polygon': return [geom['coordinates']]
    return geom['coordinates']
def poly_pts(ring):
    pts = [T(*c[:2]) for c in ring]
    return None if any(p is None for p in pts) else pts
d14 = json.load(open('/tmp/geo/world_1914.geojson')); d20 = json.load(open('/tmp/geo/world_1920.geojson'))
base = Image.new('RGB', (W, H), (24, 22, 20)); bd = ImageDraw.Draw(base)
lines = Image.new('L', (W, H), 0); ld = ImageDraw.Draw(lines)
EMP = {'germany': 'German Empire', 'russia': 'Russian Empire', 'austria': 'Austro-Hungarian Empire', 'ottoman': 'Ottoman Empire'}
masks = {k: Image.new('L', (W, H), 0) for k in EMP}; cent = {k: [0, 0, 0] for k in EMP}
for f in d14['features']:
    name = f['properties'].get('NAME'); g = f['geometry']
    if not g: continue
    for poly in rings(g):
        pts = poly_pts(poly[0])
        if not pts or max(p[0] for p in pts) < -200 or min(p[0] for p in pts) > W + 200 or max(p[1] for p in pts) < -200 or min(p[1] for p in pts) > H + 200: continue
        bd.polygon(pts, fill=(214, 200, 168)); ld.line(pts + [pts[0]], fill=255, width=3)
        for k, n in EMP.items():
            if name == n:
                ImageDraw.Draw(masks[k]).polygon(pts, fill=255)
# borders
base.paste((70, 52, 40), mask=lines)
base.save('/home/user/stocks/shorts_ww1_whatif/pro/assets/map_base.jpg', quality=92)
for k, m in masks.items():
    m.save(f'/home/user/stocks/shorts_ww1_whatif/pro/assets/map_{k}.png')
# label anchors: centroid of the mask clipped to the frame, normalised
import numpy as np
for k, m in masks.items():
    a = np.asarray(m) > 0; ys, xs = np.nonzero(a); print(k, 'centroid', round(xs.mean() / W, 3), round(ys.mean() / H, 3), 'cov', round(a.mean(), 3))
# Poland 1920 outline (largest ring), normalised + simplified
pol = [f for f in d20['features'] if f['properties'].get('NAME') == 'Poland'][0]
best = max((poly[0] for poly in rings(pol['geometry'])), key=len)
pts = [T(*c[:2]) for c in best]
step = max(1, len(pts) // 400); pts = pts[::step]
norm = [[round(x / W, 4), round(y / H, 4)] for x, y in pts]
json.dump(norm, open('/tmp/geo/poland.json', 'w'))
xs = [p[0] for p in norm]; ys = [p[1] for p in norm]
print('poland pts', len(norm), 'bbox', min(xs), max(xs), min(ys), max(ys), 'centre', round(sum(xs) / len(xs), 3), round(sum(ys) / len(ys), 3))
prev = base.copy(); ImageDraw.Draw(prev).line(pts + [pts[0]], fill=(227, 36, 43), width=6)
ov = Image.new('RGB', (W, H), (227, 36, 43))
for k in masks: prev = Image.composite(Image.blend(prev, ov, 0.45), prev, masks[k])
prev.resize((1000, 721)).save('/tmp/check/geomap.jpg')
