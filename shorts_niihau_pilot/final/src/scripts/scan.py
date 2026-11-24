import os, json, numpy as np
from PIL import Image
D='post4'; N=1935; prev=None; rows=[]
real=sum(1 for f in range(N) if not os.path.islink(f'{D}/f{f:04d}.jpeg'))
for f in range(N):
    a=np.asarray(Image.open(f'{D}/f{f:04d}.jpeg').convert('L').resize((135,240)),dtype=np.float32)
    d=float(np.abs(a-prev).mean()) if prev is not None else 0.0
    rows.append((f,float(a.mean()),float(a.min()),float(a.max()),d)); prev=a
m=np.array(rows)
black=[int(r[0]) for r in rows if r[1]<8]; white=[int(r[0]) for r in rows if r[1]>245]; frozen=[int(r[0]) for r in rows[1:] if r[4]<0.02]
cuts=[int(r[0]) for r in rows[1:] if r[4]>22]
# dissolve signature: frame close to the mean of its neighbours while the neighbours differ a lot
blend=[]
imgs={}
def L(f): return np.asarray(Image.open(f'{D}/f{f:04d}.jpeg').convert('L').resize((135,240)),dtype=np.float32)
for f in range(1,N-1):
    if rows[f][4]>6 and rows[f+1][4]>6:
        a,b,c=L(f-1),L(f),L(f+1); ac=np.abs(a-c).mean(); e=np.abs(b-(a+c)/2).mean()
        if ac>25 and e<0.2*ac: blend.append((f,round(float(ac),1),round(float(e),1)))
out={'frames':N,'files_not_symlinks(whip smear only)':real,'black':black,'white':white,'frozen':frozen,'cuts_detected':cuts,'blend_suspects':blend,'mean_luma_min':float(m[:,1].min()),'mean_luma_max':float(m[:,1].max()),'median_frame_diff':float(np.median(m[:,4]))}
json.dump(out,open('qa_scan_r4.json','w'),indent=1); print(json.dumps(out)[:1500])
