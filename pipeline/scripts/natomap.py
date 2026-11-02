import json, math
from PIL import Image, ImageDraw, ImageFilter
W, H = 2800, 1800
lam0, phi0 = math.radians(-25), math.radians(45)
def P(lon, lat):
    l, p = math.radians(lon), math.radians(lat)
    c = 1 + math.sin(phi0) * math.sin(p) + math.cos(phi0) * math.cos(p) * math.cos(l - lam0)
    if c < 0.15: return None
    k = math.sqrt(2 / c); return k * math.cos(p) * math.sin(l - lam0), -k * (math.cos(phi0) * math.sin(p) - math.sin(phi0) * math.cos(p) * math.cos(l - lam0))
xa, _ = P(-108, 28); xb, _ = P(64, 56); _, yt = P(-25, 73); _, yb = P(-80, 12)
S = min(W / (xb - xa), H / (yb - yt)); cx = (xa + xb) / 2; cy = (yt + yb) / 2
def T(lon, lat):
    q = P(lon, lat); return None if q is None else (W / 2 + (q[0] - cx) * S, H / 2 + (q[1] - cy) * S)
d = json.load(open('/tmp/geo/world_1960.geojson'))
land = Image.new('L', (W, H), 0); bl = Image.new('L', (W, H), 0); ld = ImageDraw.Draw(land); bd = ImageDraw.Draw(bl)
for f in d['features']:
    g = f['geometry']
    if not g: continue
    for poly in ([g['coordinates']] if g['type'] == 'Polygon' else g['coordinates']):
        pts = [T(*c[:2]) for c in poly[0]]
        if any(p is None for p in pts): continue
        if max(p[0] for p in pts) < -100 or min(p[0] for p in pts) > W + 100 or max(p[1] for p in pts) < -100 or min(p[1] for p in pts) > H + 100: continue
        ld.polygon(pts, fill=255); bd.line(pts + [pts[0]], fill=255, width=2)
img = Image.new('RGB', (W, H), (6, 12, 18))
img.paste((22, 34, 42), mask=land); img.paste((70, 170, 190), mask=bl)
coast = land.filter(ImageFilter.FIND_EDGES).filter(ImageFilter.MaxFilter(3)); img.paste((95, 227, 255), mask=coast)
img.save('/home/user/stocks/shorts_nuclear_whatif/assets/map.jpg', quality=92)
C = {'HAVANA': (-82.36, 23.13), 'MIAMI': (-80.19, 25.76), 'WASHINGTON': (-77.04, 38.9), 'NEW YORK': (-74.0, 40.71), 'MOSCOW': (37.62, 55.75), 'LENINGRAD': (30.31, 59.94), 'LONDON': (-0.13, 51.5), 'PARIS': (2.35, 48.86), 'BERLIN': (13.4, 52.52), 'SUB': (-66.0, 27.0), 'NEBRASKA': (-99.0, 41.0)}
out = {k: [round(T(*v)[0] / W, 4), round(T(*v)[1] / H, 4)] for k, v in C.items()}
json.dump(out, open('/tmp/geo/nato_cities.json', 'w')); print(out)
img.resize((900, 600)).save('/tmp/check/natomap.jpg')
