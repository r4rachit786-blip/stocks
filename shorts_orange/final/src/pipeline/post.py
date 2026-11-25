# on twos: output frame f shows rendered frame 2*floor(f/2) (chunks name frames by index from the chunk start);
# the one whip-pan (out of the souk) gets a horizontal motion smear on its 10 frames. Writes rm/out/orange/all/f%04d.jpeg
import os, glob, json, re, numpy as np
from PIL import Image
S="/tmp/claude-0/-home-user-stocks/898ea701-1503-5cc7-b811-4df21447c708/scratchpad"; R=S+"/rm/out/orange"; OUT=R+"/all"
t=open(S+"/rm/src/videos/orange/timing.ts").read(); TOTAL=int(re.search(r"TOTAL = (\d+)",t).group(1)); W=json.loads(re.search(r"export const W = (\{.*?\}) as const",t).group(1))
src={}
for d in sorted(glob.glob(R+"/c*-*"), key=lambda d: "fix" in d):  # re-render dirs (cfixA-B) override the main chunks
    a=int(re.sub(r"[^0-9]","",os.path.basename(d).split("-")[0]))
    for p in glob.glob(d+"/f*.jpeg"): src[a+2*int(os.path.basename(p)[1:-5])]=p
WH, N, DEG, PXDEG = W["then3"], 5, 16.0, 1920 / 52.0
def deg(f): return 16*((f-(WH-N)+1)/N)**2 if WH-N<=f<WH else (-16*(1-(f-WH+1)/N)**2 if WH<=f<WH+N else 0.0)
for f in range(TOTAL):
    g=f-(f%2); p=src[g]; dst=f"{OUT}/f{f:04d}.jpeg"
    if os.path.lexists(dst): os.remove(dst)
    v=abs(deg(g)-deg(g-2))/2 if (deg(g) or deg(g-2)) else 0.0; k=int(round(v*PXDEG*0.6*2))
    if k<3: os.symlink(p,dst); continue
    a=np.asarray(Image.open(p).convert("RGB"),dtype=np.float32); q=np.pad(a,((0,0),(k//2+1,k-k//2),(0,0)),mode="edge"); c=np.cumsum(q,axis=1)
    Image.fromarray(np.clip((c[:,k:k+a.shape[1]]-c[:,:a.shape[1]])/k,0,255).astype(np.uint8)).save(dst,quality=96); print("smear",f,k)
print("frames",TOTAL,"sources",len(src))
