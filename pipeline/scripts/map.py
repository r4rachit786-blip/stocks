from PIL import Image, ImageDraw, ImageFilter
import numpy as np, sys
src = Image.open('/tmp/assets/84640941.png').convert('RGB'); W, H = src.size; S = W / 1000
a = np.asarray(src).astype(int)
sea = (abs(a[...,0]-0x2f) < 40) & (abs(a[...,1]-0x95) < 40) & (a[...,2] > 180)
land = (a.sum(-1) > 690)
seeds = {'germany': [(440,340)], 'russia': [(700,250),(600,120),(560,330)], 'austria': [(500,410)], 'ottoman': [(720,520)]}
masks = {}
for k, pts in seeds.items():
    m = np.zeros((H, W), bool)
    for (x, y) in pts:
        im = Image.fromarray(np.where(land[..., None], 255, 0).astype(np.uint8).repeat(3, -1))
        ImageDraw.floodfill(im, (int(x*S), int(y*S)), (255, 0, 0), thresh=10)
        m |= (np.asarray(im)[..., 1] == 0) & (np.asarray(im)[..., 0] == 255)
    masks[k] = m; print(k, m.mean())
    Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5)).save(f'/tmp/maps/{k}.png')
# styled base map
out = np.zeros((H, W, 3), np.uint8)
out[:] = (24, 22, 20); out[land] = (214, 200, 168); border = ~(land | sea); out[border] = (40, 30, 24)
Image.fromarray(out).save('/tmp/maps/base.png')
prev = out.copy().astype(float)
for k, c in zip(masks, [(200,40,40),(40,120,200),(40,170,80),(200,150,30)]): prev[masks[k]] = prev[masks[k]] * 0.4 + np.array(c) * 0.6
Image.fromarray(prev.astype(np.uint8)).resize((1000, int(1000*H/W))).save('/tmp/check/map_fill.jpg')
