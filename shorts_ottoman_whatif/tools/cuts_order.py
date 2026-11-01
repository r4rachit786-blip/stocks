import numpy as np, json
from PIL import Image
from scipy import ndimage as nd
from collections import deque
a=np.array(Image.open('/home/user/stocks/shorts_ottoman_whatif/assets/map_cuts.png')).astype(float)
m=a>40; lab,n=nd.label(m,structure=np.ones((3,3))); H,W=m.shape; OBJ=nd.find_objects(lab)
order=np.zeros(m.shape); comps=[]
def bfs(src,mask):
    d=-np.ones(mask.shape,int); q=deque([src]); d[src]=0
    while q:
        y,x=q.popleft()
        for dy in(-1,0,1):
            for dx in(-1,0,1):
                yy,xx=y+dy,x+dx
                if 0<=yy<H and 0<=xx<W and mask[yy,xx] and d[yy,xx]<0: d[yy,xx]=d[y,x]+1; q.append((yy,xx))
    return d
for c in range(1,n+1):
    mk=lab==c; sz=mk.sum()
    if sz<30: order[mk]=0.0; continue
    ys,xs=np.nonzero(mk); sl=OBJ[c-1]
    sub=mk[sl].copy(); p=(ys[0]-sl[0].start,xs[0]-sl[1].start)
    H,W=sub.shape; d1=bfs(p,sub); far=np.unravel_index(np.argmax(d1),sub.shape)
    # start from the end that is further north-west (ruler sweep feel)
    d2=bfs(far,sub); other=np.unravel_index(np.argmax(d2),sub.shape)
    s=far if (far[0]+far[1])<(other[0]+other[1]) else other
    d=bfs(s,sub).astype(float); d=d/d.max()
    full=order[sl]; full[sub]=d[sub]; comps.append((int(sz),c,sl))
    H,W=m.shape
comps.sort(reverse=True); print(n,'components; sizes',[c[0] for c in comps[:12]])
o8=np.where(m,np.clip(order*250+3,1,255),0).astype(np.uint8)
Image.fromarray(o8).save('/home/user/stocks/shorts_ottoman_whatif/assets/map_cuts_order.png')
tips=[]
for k in range(61):
    u=k/60; mk=m&(order<=u)&(order>=u-0.03)&(order>0)
    l2,n2=nd.label(mk,structure=np.ones((3,3))); row=[]
    if n2:
        sz=nd.sum(mk,l2,range(1,n2+1)); cm=nd.center_of_mass(mk,l2,range(1,n2+1))
        for j in np.argsort(-sz)[:4]:
            if sz[j]>15: row.append([float(cm[j][1]/m.shape[1]),float(cm[j][0]/m.shape[0])])
    tips.append(row)
json.dump(tips,open('/home/user/stocks/shorts_ottoman_whatif/assets/cut_tips.json','w'))
print([len(r) for r in tips])
