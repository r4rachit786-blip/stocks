# grade metrics vs the skill's measured targets (luma p2/p50/p98, <0.10 share, HSV S, hue budget) on a list of stills
import sys, numpy as np, colorsys
from PIL import Image
fs=sys.argv[1:]; rows=[]; allY=[]; allS=[]; H=[]; C=[]
for f in fs:
    a=np.asarray(Image.open(f).convert('RGB').resize((270,480)),dtype=np.float32)/255
    Y=0.2126*a[...,0]+0.7152*a[...,1]+0.0722*a[...,2]
    mx=a.max(-1); mn=a.min(-1); S=np.where(mx>0,(mx-mn)/np.maximum(mx,1e-6),0)
    r,g,b=a[...,0],a[...,1],a[...,2]; d=np.maximum(mx-mn,1e-6)
    h=np.where(mx==r,((g-b)/d)%6,np.where(mx==g,(b-r)/d+2,(r-g)/d+4))*60
    chroma=mx-mn; m=chroma>0.08
    rows.append((f.split('/')[-1],np.percentile(Y,2),np.percentile(Y,50),np.percentile(Y,98),(Y<0.10).mean(),np.median(S)))
    allY.append(Y.ravel()); allS.append(S.ravel()); H.append(h[m]); C.append(chroma[m])
for r in rows: print('%-12s p2 %.3f p50 %.3f p98 %.3f <.10 %.3f S %.2f'%r)
Y=np.concatenate(allY); S=np.concatenate(allS); h=np.concatenate(H); c=np.concatenate(C); tot=c.sum()
share=lambda a,b: c[(h>=a)&(h<b)].sum()/tot
print('ALL p2 %.3f p50 %.3f p98 %.3f below.10 %.3f  S median %.2f'%(np.percentile(Y,2),np.percentile(Y,50),np.percentile(Y,98),(Y<0.10).mean(),np.median(S)))
print('hue share (chroma-weighted): amber/orange 15-60 %.2f | red 340-15 %.2f | yellow-green 60-90 %.2f | green 90-165 %.2f | azure/cyan 165-210 %.2f | periwinkle-violet 210-300 %.2f | magenta 300-340 %.2f'%(share(15,60),share(340,360)+share(0,15),share(60,90),share(90,165),share(165,210),share(210,300),share(300,340)))
