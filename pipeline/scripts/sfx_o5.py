# Ottoman Short — SFX from real recordings (Mixkit free licence) + a few synthesized low-end beds
import json, subprocess, numpy as np, scipy.signal as sg, scipy.io.wavfile as wf, sys
sys.path.insert(0, '/tmp/arch_scripts')
SR = 48000; W = json.load(open('/tmp/voo/words.json')); wt = lambda i: W[i][0]
D = W[-1][1] + 0.9; NS = int(D * SR); FX = np.zeros((2, NS + SR * 12)); rng = np.random.default_rng(3)
tt = lambda d: np.arange(int(d * SR)) / SR
def load(i, start=0.0, dur=None, fade=0.25):
    a = subprocess.run(['ffmpeg', '-v', 'error', '-i', f'/tmp/mkdl/{i}.mp3', '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'], capture_output=True).stdout
    x = np.frombuffer(a, np.float32).reshape(-1, 2).T.astype(float); x = x[:, int(start * SR):]
    if dur: x = x[:, :int(dur * SR)]
    n = min(int(fade * SR), x.shape[1]); x[:, -n:] *= np.linspace(1, 0, n) ** 2
    return x / (np.abs(x).max() + 1e-9)
def onset(x, th=0.35): e = np.abs(x).max(0); return int(np.argmax(e > th * e.max()))
def put(x, t, g=1.0, align=True):
    if x.ndim == 1: x = np.vstack([x, x])
    i = int(t * SR) - (onset(x) if align else 0); 
    if i < 0: x = x[:, -i:]; i = 0
    n = min(x.shape[1], FX.shape[1] - i); FX[:, i:i + n] += x[:, :n] * g
def sub(f0, f1, d, k): t = tt(d); return np.sin(2 * np.pi * np.cumsum(np.linspace(f0, f1, len(t))) / SR) * np.exp(-t * k)

STAMP = load(2182); BASS = load(2299); BLOW = load(2150); HAMMER = load(833)
def stamp_hit(t, g=1.0, heavy=0.6): put(STAMP, t, 1.0 * g); put(BASS, t, heavy * g); put(BLOW, t, 0.5 * g)

# 0.0 hook: cinematic whoosh into deep impact
put(load(1143, start=0.3, dur=2.3), 0.02, 0.8)
# STOLEN stamps (both ships) — stamp + metal
stamp_hit(wt(3), 1.0, 0.9); put(HAMMER, wt(3), 0.45)
stamp_hit(wt(5) + 0.05, 0.9, 0.7)
# THE MIDDLE EAST title flies in
put(load(1492), wt(10) - 0.02, 0.55)
# PAID IN FULL stamp
stamp_hit(wt(19), 1.0, 0.6)
# coins falling (people donated)
put(load(1993), wt(23) + 0.25, 1.0); put(load(2003), wt(23) + 0.45, 0.9); put(load(1989), wt(23) + 0.9, 0.7)
# KEPT stamp + lower metal
stamp_hit(wt(28), 1.0, 1.0); put(HAMMER, wt(28), 0.5)
# Germany sends warships: deep whoosh on the whip
w = load(2604); put(w, wt(30) - 0.05, 0.85)
# WORLD WAR I: bang
put(load(2800, dur=2.6, fade=1.2), wt(39), 1.0); put(BASS, wt(39), 0.8)
# losing side: power-down (synth)
t = tt(1.3); pdn = np.sin(2 * np.pi * np.cumsum(85 * (1 - 0.65 * (t / 1.3) ** 0.8)) / SR) * (1 - t / 1.3) ** 1.5 * 0.5; put(pdn, wt(44) - 0.05, 1.0, False)
# CARVED UP: pencil on paper for the whole drawing
pen = load(3194); pen2 = load(2376)
put(pen, wt(54) - 0.1, 1.1, False); put(pen2, wt(54) + 1.0, 0.8, False)
# ruler tap at end of the ruler slide
put(load(2182) * 0.5, wt(61) + 0.2, 0.4)
# BUT WHAT IF: tape rewind (screen says REWIND)
put(load(1088, dur=1.1, fade=0.4), wt(62) - 0.02, 0.55, False)
# NO IRAQ / SYRIA / JORDAN / LEBANON: stamped X bangs, growing
for k, i in enumerate((82, 84, 86, 88)): g = 0.8 + 0.1 * k; stamp_hit(wt(i) + 0.15, g, 0.8 + 0.15 * k); put(HAMMER, wt(i) + 0.15, 0.3)
# ONE EMPIRE: big impact
put(load(2901, start=1.0, dur=2.0, fade=1.0), wt(89), 1.0); put(BASS, wt(89), 0.9); put(STAMP, wt(89), 0.6)
# 1927 typewriter
TY0, C1, K0, C2 = wt(93) - 0.28, 12, wt(93) + 0.22, 16; keys = [load(1382), load(1369), load(1365)]
for n, (t0, c, s) in enumerate([(TY0, C1, '1927'), (K0, C2, 'KIRKUK')]):
    for j in range(len(s)): put(keys[(j + n) % 3], t0 + j / c, 1.0 if n == 0 else 0.75)
put(load(1368), K0 + 6 / C2 + 0.05, 0.35)
# OIL EXPLODES: high-pressure gas release + whump + rumble
put(load(849, dur=2.4, fade=1.0), wt(94) - 0.02, 0.9); put(load(1458), wt(94) - 0.02, 0.8); put(load(2447), wt(94) + 0.05, 0.5)
x = sub(70, 34, 2.8, 1.6) * 0.9; put(x, wt(94) - 0.02, 1.0, False)
# OTTOMAN EMPIRE stamp on the oil field
stamp_hit(wt(104), 0.8, 0.5)
# rich: coins again
put(load(2003), wt(106) + 0.4, 0.7); put(load(1993), wt(110) + 0.3, 0.75)
# Atatürk reticle: dry click
put(load(1365), wt(120) + 0.1, 0.45)
# NO REPUBLIC: stamp + bang
stamp_hit(wt(125), 1.0, 1.0); put(load(788, start=2.0, dur=1.6, fade=0.9), wt(125), 0.6)
# 2026: stamp
stamp_hit(wt(135), 1.0, 0.7)
# ALL BECAUSE OF 2 SHIPS: dramatic trailer hit
put(load(2908, start=0.78, dur=3.0, fade=1.6), wt(136), 1.0); put(BASS, wt(136), 0.9)

out = FX[:, :NS]; out = out / (np.abs(out).max() + 1e-9) * 0.95
wf.write('/tmp/voo/sfx_real.wav', SR, (out.T * 32767).astype(np.int16)); print('ok')
