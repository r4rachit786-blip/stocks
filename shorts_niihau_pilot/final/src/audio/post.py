# Post: 8-frame cross-dissolves on sentence onsets, built from the rendered frames (before the caption burn).
# Hard cuts stay where the script snaps: "In a fence", "The party ends quickly", the three shots, the throw, the rock.
import re, os, sys
from PIL import Image
ALL, OUT = sys.argv[1], sys.argv[2]
story = open(sys.argv[3]).read()
starts = [int(x) for x in re.findall(r"\{ id: \d+, a: (\d+),", story)]
HARD = {0, 312, 705, 1196, 1313, 1385}
os.makedirs(OUT, exist_ok=True)
for f in range(1935):
    dst = f"{OUT}/f{f:04d}.jpeg"
    if os.path.lexists(dst): os.remove(dst)
    os.symlink(os.path.realpath(f"{ALL}/f{f:04d}.jpeg"), dst)
n = 0
for a in starts:
    if a in HARD: continue
    for k in range(-4, 4):
        f = a + k
        A = Image.open(f"{ALL}/f{min(f, a - 1):04d}.jpeg").convert("RGB"); B = Image.open(f"{ALL}/f{max(f, a):04d}.jpeg").convert("RGB")
        dst = f"{OUT}/f{f:04d}.jpeg"; os.remove(dst)
        Image.blend(A, B, (k + 4.5) / 8).save(dst, quality=96)
    n += 1
print("dissolves:", n, "hard cuts:", sorted(HARD - {0}))
