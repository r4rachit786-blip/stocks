import json, math
from PIL import Image, ImageDraw, ImageFilter
W, H = 2000, 2400
lam0, phi0 = math.radians(78), math.radians(24)
def P(lon, lat):
    l, p = math.radians(lon), math.radians(lat)
    c = 1 + math.sin(phi0) * math.sin(p) + math.cos(phi0) * math.cos(p) * math.cos(l - lam0)
    if c < 0.2: return None
    k = math.sqrt(2 / c); return k * math.cos(p) * math.sin(l - lam0), -k * (math.cos(phi0) * math.sin(p) - math.sin(phi0) * math.cos(p) * math.cos(l - lam0))
xa, _ = P(58, 24); xb, _ = P(98, 24); _, yt = P(78, 40); _, yb = P(78, 4)
S = min(W / (xb - xa), H / (yb - yt)); cx = (xa + xb) / 2; cy = (yt + yb) / 2
T = lambda lon, lat: (W / 2 + (P(lon, lat)[0] - cx) * S, H / 2 + (P(lon, lat)[1] - cy) * S)
d = json.load(open('/tmp/geo/world_1960.geojson'))
land = Image.new('L', (W, H), 0); ld = ImageDraw.Draw(land)
for f in d['features']:
    g = f['geometry']
    if not g: continue
    polys = [g['coordinates']] if g['type'] == 'Polygon' else g['coordinates']
    for poly in polys:
        ring = poly[0]
        if not any(40 < c[0] < 120 and -10 < c[1] < 55 for c in ring): continue
        ld.polygon([T(c[0], c[1]) for c in ring], fill=255)
# no political borders: land as one parchment mass with a soft coastline
img = Image.new('RGB', (W, H), (24, 22, 20)); img.paste((214, 200, 168), mask=land)
edge = land.filter(ImageFilter.FIND_EDGES).filter(ImageFilter.MaxFilter(3)); img.paste((70, 52, 40), mask=edge)
img.save('/home/user/stocks/shorts_gandhi_whatif/assets/map_base.jpg', quality=92)
cities = {'DELHI': (77.21, 28.61), 'LAHORE': (74.36, 31.55), 'KARACHI': (67.01, 24.86), 'BOMBAY': (72.88, 19.08), 'CALCUTTA': (88.36, 22.57)}
out = {k: [round(T(*v)[0] / W, 4), round(T(*v)[1] / H, 4)] for k, v in cities.items()}
json.dump(out, open('/tmp/geo/ind_cities.json', 'w')); print(out)
img.resize((500, 600)).save('/tmp/check/indmap.jpg')
