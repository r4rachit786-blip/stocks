# on ones: link every rendered frame into out/orange2/all/f%04d.jpeg; whip-pans get a horizontal motion smear (the
# camera yaws WHIP_DEG over 5 frames each side of a cut; smear length = yaw change per frame in px at 1080 wide)
import os, glob, re, numpy as np
from PIL import Image
S="/tmp/claude-0/-home-user-stocks/898ea701-1503-5cc7-b811-4df21447c708/scratchpad"; R=S+"/rm/out/orange2"; OUT=R+"/all"; os.makedirs(OUT,exist_ok=True)
TOTAL=1411; WH=[50,82,464]; N=5; DEG=16.0
src={}
for d in sorted(glob.glob(R+"/c*-*"), key=lambda d: "fix" in d):
    for p in glob.glob(d+"/f*.jpeg"): src[int(os.path.basename(p)[1:-5])]=p
def deg(f):
    for c in WH:
        if c-N<=f<c: return DEG*((f-(c-N)+1)/N)**2
        if c<=f<c+N: return -DEG*(1-(f-c+1)/N)**2
    return 0.0
fovh=2*np.degrees(np.arctan(np.tan(np.radians(44/2))*1080/1920))
missing=[f for f in range(TOTAL) if f not in src]; assert not missing, missing[:10]
for f in range(TOTAL):
    p=src[f]; dst=f"{OUT}/f{f:04d}.jpeg"
    if os.path.lexists(dst): os.remove(dst)
    v=(abs(deg(f+1)-deg(f)) if f in WH else abs(deg(f)-deg(f-1))) if (deg(f) or deg(f-1)) else 0.0; k=int(round(v*1080/fovh*0.7))
    if k<3: os.symlink(p,dst); continue
    a=np.asarray(Image.open(p).convert("RGB"),dtype=np.float32); q=np.pad(a,((0,0),(k//2+1,k-k//2),(0,0)),mode="edge"); c=np.cumsum(q,axis=1)
    Image.fromarray(np.clip((c[:,k:k+a.shape[1]]-c[:,:a.shape[1]])/k,0,255).astype(np.uint8)).save(dst,quality=96); print("smear",f,k)
print("frames",TOTAL,"sources",len(src))
