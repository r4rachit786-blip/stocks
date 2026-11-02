import json, math
from PIL import Image, ImageDraw, ImageFilter
W, H = 2400, 2200
lam0, phi0 = math.radians(38), math.radians(30)
def P(lon, lat):
    l, p = math.radians(lon), math.radians(lat); c = 1 + math.sin(phi0) * math.sin(p) + math.cos(phi0) * math.cos(p) * math.cos(l - lam0)
    if c < 0.2: return None
    k = math.sqrt(2 / c); return k * math.cos(p) * math.sin(l - lam0), -k * (math.cos(phi0) * math.sin(p) - math.sin(phi0) * math.cos(p) * math.cos(l - lam0))
xa, _ = P(16, 30); xb, _ = P(62, 30); _, yt = P(38, 47); _, yb = P(38, 11)
S = min(W / (xb - xa), H / (yb - yt)); cx = (xa + xb) / 2; cy = (yt + yb) / 2
def T(lon, lat):
    q = P(lon, lat)
    return None if q is None else (W / 2 + (q[0] - cx) * S, H / 2 + (q[1] - cy) * S)
def polys(g): return [g['coordinates']] if g['type'] == 'Polygon' else g['coordinates']
def inview(pts): return not (max(p[0] for p in pts) < -200 or min(p[0] for p in pts) > W + 200 or max(p[1] for p in pts) < -200 or min(p[1] for p in pts) > H + 200)
d14 = json.load(open('/tmp/geo/world_1914.geojson')); d20 = json.load(open('/tmp/geo/world_1920.geojson'))
land = Image.new('L', (W, H), 0); ld = ImageDraw.Draw(land); bl = Image.new('L', (W, H), 0); bd = ImageDraw.Draw(bl)
ott = Image.new('L', (W, H), 0); od = ImageDraw.Draw(ott)
for f in d14['features']:
    g = f['geometry']
    if not g: continue
    for poly in polys(g):
        pts = [T(*c[:2]) for c in poly[0]]
        if any(p is None for p in pts) or not inview(pts): continue
        ld.polygon(pts, fill=255); bd.line(pts + [pts[0]], fill=255, width=2)
        if f['properties'].get('NAME') == 'Ottoman Empire': od.polygon(pts, fill=255)
cut = Image.new('L', (W, H), 0); cd = ImageDraw.Draw(cut)
for f in d20['features']:
    if f['properties'].get('NAME') not in ('Mesopotamia (GB)', 'Syria (France)', 'Mandatory Palestine (GB)', 'Hejaz', 'Ottoman Sultanate'): continue
    for poly in polys(f['geometry']):
        pts = [T(*c[:2]) for c in poly[0]]
        if any(p is None for p in pts) or not inview(pts): continue
        cd.line(pts + [pts[0]], fill=255, width=7)
cut = Image.composite(cut, Image.new('L', (W, H), 0), ott.filter(ImageFilter.MaxFilter(9)))
img = Image.new('RGB', (W, H), (10, 14, 22)); img.paste((40, 38, 44), mask=land); img.paste((95, 80, 60), mask=bl)
coast = land.filter(ImageFilter.FIND_EDGES).filter(ImageFilter.MaxFilter(3)); img.paste((150, 130, 95), mask=coast)
D = '/home/user/stocks/shorts_ottoman_whatif/assets/'
img.save(D + 'map_base.jpg', quality=92); ott.save(D + 'map_ottoman.png'); cut.save(D + 'map_cuts.png')
C = {'ISTANBUL': (28.98, 41.01), 'BAGHDAD': (44.36, 33.31), 'KIRKUK': (44.39, 35.47), 'DAMASCUS': (36.29, 33.51), 'BEIRUT': (35.5, 33.89), 'AMMAN': (35.93, 31.95), 'MECCA': (39.83, 21.42),
     'IRAQ': (43.8, 32.6), 'SYRIA': (38.6, 35.2), 'JORDAN': (36.9, 30.9), 'LEBANON': (35.9, 34.0)}
json.dump({k: [round(T(*v)[0] / W, 4), round(T(*v)[1] / H, 4)] for k, v in C.items()}, open('/tmp/geo/ott_points.json', 'w'))
prev = img.copy(); prev.paste((200, 150, 40), mask=ott.point(lambda v: v * 0.5)); prev.paste((230, 40, 40), mask=cut); prev.resize((800, 733)).save('/tmp/check/omap.jpg')
print(json.load(open('/tmp/geo/ott_points.json')))
