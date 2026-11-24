import sys
from PIL import Image, ImageDraw
name=sys.argv[1]; fr=[int(x) for x in sys.argv[2].split(',')]; src=sys.argv[3] if len(sys.argv)>3 else 'all'
W=Image.new('RGB',(270*len(fr),480+22),'white'); d=ImageDraw.Draw(W)
for i,f in enumerate(fr):
    W.paste(Image.open(f'{src}/f{f:04d}.jpeg').resize((270,480)),(i*270,22)); d.text((i*270+6,4),f'f{f}',fill='black')
W.save(name,quality=88)
