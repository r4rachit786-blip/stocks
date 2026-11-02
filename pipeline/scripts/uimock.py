# Draw approximate TikTok / Reels UI zones over frames to check safe areas
import sys
from PIL import Image, ImageDraw
app = sys.argv[1]; times = sys.argv[2:]
Z = {'tiktok': [((0, 0, 1080, 130), 'top bar'), ((935, 880, 1080, 1620), 'buttons'), ((0, 1560, 1080, 1920), 'username / caption / sound')],
     'reels': [((0, 0, 1080, 230), 'Reels header'), ((945, 1000, 1080, 1660), 'buttons'), ((0, 1470, 1080, 1920), 'username / caption / audio')]}[app]
tiles = []
for t in times:
    im = Image.open(f'/tmp/shots_{app}/t{float(t):.2f}.jpg').convert('RGBA'); ov = Image.new('RGBA', im.size, (0, 0, 0, 0)); d = ImageDraw.Draw(ov)
    for box, lab in Z: d.rectangle(box, fill=(255, 0, 200, 70), outline=(255, 0, 200, 255), width=4); d.text((box[0] + 10, box[1] + 10), lab, fill=(255, 255, 255, 255))
    tiles.append(Image.alpha_composite(im, ov).convert('RGB').resize((360, 640)))
s = Image.new('RGB', (360 * len(tiles), 640)); [s.paste(t, (i * 360, 0)) for i, t in enumerate(tiles)]; s.save(f'/tmp/check/ui_{app}.jpg')
