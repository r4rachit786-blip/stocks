# stills contact sheet with take / frame / word labels -> final/sheets/stills_{PFX}.jpg
import json, sys
PFX=sys.argv[1] if len(sys.argv)>1 else 'v3'
from PIL import Image, ImageDraw, ImageFont
S='/tmp/claude-0/-home-user-stocks/898ea701-1503-5cc7-b811-4df21447c708/scratchpad'
w=json.load(open(S+'/orange2/build/words.json'))['words']
fr=[8,40,66,96,130,175,200,245,330,380,430,480,500,540,590,660,680,700,735,770,805,825,850,885,940,990,1015,1040,1095,1145,1215,1262,1320,1360,1405]
takes=[(0,'T01 hook'),(50,'T02 dunes'),(82,'T03 deck'),(159,'T04 scholar'),(224,'T05-06 serai'),(335,'T07 souk'),(464,'T08 Lisbon'),(513,'T09 square'),(685,'T10 sailing'),(742,'T11 China'),(834,'T12-13 Sintra'),(955,'T14 Dutch'),(1029,'T15 Goa'),(1116,'T16-18 stall'),(1341,'T19 ending')]
tk=lambda f: [n for a,n in takes if f>=a][-1]
def word(f):
    b=''
    for x in w:
        if x['t']<=f/30+0.05: b=x['w']
    return b.strip('".,!?')
cols=7; cw,ch=300,533; rows=(len(fr)+cols-1)//cols
W=Image.new('RGB',(cols*cw,rows*(ch+44)+70),'#1c1820'); d=ImageDraw.Draw(W)
F=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',18); FB=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',30)
d.text((16,18),f'Orange / santra: test stills {PFX} (full-size frames in stills_{PFX}/), 1080x1920, 47.0 s locked voice',fill='#ffe9c4',font=FB)
for i,f in enumerate(fr):
    im=Image.open(f'{S}/orange2/st/{PFX}_{f:04d}.jpg').resize((cw,ch),Image.LANCZOS); x=(i%cols)*cw; y=70+(i//cols)*(ch+44)
    W.paste(im,(x,y)); d.text((x+6,y+ch+4),f'{tk(f)}  f{f}',fill='#ffffff',font=F); d.text((x+6,y+ch+23),f'"{word(f)}"',fill='#f2c230',font=F)
W.save(f'/home/user/stocks/shorts_orange/final/sheets/stills_{PFX}.jpg',quality=88); print(W.size)
