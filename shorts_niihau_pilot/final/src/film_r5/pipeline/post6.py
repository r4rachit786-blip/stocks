# Round 5b post (whips on output frames from warp6.json): NO dissolves. Every frame is the rendered frame, except the two whip-pans (5 frames each side of
# frames 741 and 774), which get a horizontal motion smear proportional to the pan speed of that frame.
import os, sys, numpy as np
from PIL import Image
ALL, OUT = sys.argv[1], sys.argv[2]
import json
W6 = json.load(open("warp6.json"))["warp"]
def newF(g):
    for i in range(1, len(W6)):
        if g <= W6[i][1]:
            a, A = W6[i - 1]; b, B = W6[i]; return a + (b - a) * (g - A) / (B - A)
WHIPS, N, DEG, PXDEG = [round(newF(741)), round(newF(774))], 5, 15.0, 1920 / 48.0
TOTAL = W6[-1][0]
os.makedirs(OUT, exist_ok=True)
def deg(f):
    for w in WHIPS:
        if w - N <= f < w: return DEG * ((f - (w - N) + 1) / N) ** 2
        if w <= f < w + N: return -DEG * (1 - (f - w + 1) / N) ** 2
    return 0.0
for f in range(TOTAL):
    dst = f"{OUT}/f{f:04d}.jpeg"
    if os.path.lexists(dst): os.remove(dst)
    v = abs(deg(f) - deg(f - 1)) if deg(f) or deg(f - 1) else 0.0
    if any(f == w for w in WHIPS): v = abs(deg(f)) and abs(deg(f) - deg(f + 1)) or v   # first frame after the cut: speed of the incoming swing
    k = int(round(v * PXDEG * 0.6))
    if k < 3: os.symlink(os.path.realpath(f"{ALL}/f{f:04d}.jpeg"), dst); continue
    a = np.asarray(Image.open(f"{ALL}/f{f:04d}.jpeg").convert("RGB"), dtype=np.float32)
    p = np.pad(a, ((0, 0), (k // 2 + 1, k - k // 2), (0, 0)), mode="edge"); c = np.cumsum(p, axis=1)
    b = (c[:, k:k + a.shape[1]] - c[:, :a.shape[1]]) / k
    Image.fromarray(np.clip(b, 0, 255).astype(np.uint8)).save(dst, quality=96); print("whip smear", f, k, "px")
