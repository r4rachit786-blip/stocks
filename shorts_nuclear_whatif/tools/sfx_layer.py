# Cinematic SFX layer for "One Vote From The End Of The World" (synthesised, no third-party samples)
import json, numpy as np, scipy.signal as sg, scipy.io.wavfile as wf
SR = 48000
W = json.load(open('/tmp/von3/words.json')); wt = lambda i: W[i][0]; we = lambda i: W[i][1]
D = we(len(W) - 1) + 0.9
N = int(D * SR) + SR
L = np.zeros(N); R = np.zeros(N)
rng = np.random.default_rng(7)

def add(sig, t, gain=1.0, pan=0.0):
    i = int(max(0, t) * SR); sig = sig * gain
    if sig.ndim == 1: l, r = sig * np.sqrt((1 - pan) / 2) * 1.414, sig * np.sqrt((1 + pan) / 2) * 1.414
    else: l, r = sig[0], sig[1]
    n = min(len(l), N - i)
    if n > 0: L[i:i + n] += l[:n]; R[i:i + n] += r[:n]

def tt(d): return np.arange(int(d * SR)) / SR
def env(d, a=0.005, rel=None, curve=3.0):
    t = tt(d); e = np.minimum(1, t / max(a, 1e-4))
    return e * (np.exp(-t * curve / d * 3) if rel is None else np.clip((d - t) / rel, 0, 1))
def lp(x, f, o=4): return sg.sosfilt(sg.butter(o, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, o=4): return sg.sosfilt(sg.butter(o, f, 'high', fs=SR, output='sos'), x)
def bp(x, lo, hi, o=2): return sg.sosfilt(sg.butter(o, [lo, hi], 'band', fs=SR, output='sos'), x)
def sweep_filter(x, f0, f1, kind='band', q=1.5, steps=60):
    out = np.zeros_like(x); n = len(x); seg = n // steps + 1
    for s in range(steps):
        a, b = s * seg, min(n, (s + 1) * seg + 512)
        if a >= n: break
        f = f0 * (f1 / f0) ** (s / (steps - 1))
        lo, hi = max(30, f / q), min(SR / 2 - 100, f * q)
        y = bp(x[max(0, a - 2048):b], lo, hi)[min(a, 2048):]
        w = np.ones(b - a); fade = min(512, b - a)
        if s: w[:fade] = np.linspace(0, 1, fade)
        if b < n: w[-fade:] = np.linspace(1, 0, fade)
        out[a:b] += y[:b - a] * w
    return out
def chirp(f0, f1, d, kind='sine'):
    t = tt(d); k = np.log(f1 / f0) / d; ph = 2 * np.pi * f0 * (np.exp(k * t) - 1) / k
    return np.sin(ph) if kind == 'sine' else (2 * ((ph / (2 * np.pi)) % 1) - 1)
def reverb(x, d=1.8, mix=0.35):
    ir = rng.standard_normal(int(d * SR)) * np.exp(-tt(d) * 4.5); ir = lp(ir, 6000)
    y = sg.fftconvolve(x, ir)[:len(x) + int(d * SR)]; y /= (np.abs(y).max() + 1e-9)
    out = np.zeros(len(y)); out[:len(x)] += x * (1 - mix); return out + y * mix * np.abs(x).max()
noise = lambda d: rng.standard_normal(int(d * SR))

# ---------------- sound library ----------------
def riser(d):
    n = sweep_filter(noise(d), 300, 6000, q=1.6) * (tt(d) / d) ** 2.2
    tone = (chirp(110, 880, d, 'saw') * 0.25 + chirp(55, 440, d) * 0.4) * (tt(d) / d) ** 2.5
    return n * 0.8 + lp(tone, 4000)
def reverse_swell(d):
    x = reverb(hp(noise(0.25), 800) * env(0.25, 0.002), 1.6, 0.8)[:int(d * SR)]
    x = x / (np.abs(x).max() + 1e-9); return x[::-1] * (tt(len(x) / SR) / (len(x) / SR)) ** 1.5
def whoosh(d=0.45):
    t = tt(d); shape = np.sin(np.pi * t / d) ** 2
    return sweep_filter(noise(d), 400, 3500, q=1.4) * shape * 1.3
def braam(d=3.0, f=41.2):
    t = tt(d); e = np.minimum(1, t / 0.02) * np.exp(-t * 1.1)
    saw = sum(chirp(f * m * 1.01 ** k, f * m * 0.97, d, 'saw') for m in (1, 1.5, 2) for k in (0, 1)) / 6
    body = np.tanh(lp(saw, 900) * 3) * e
    sub = np.sin(2 * np.pi * np.cumsum(np.linspace(f * 1.6, f * 0.75, len(t))) / SR) * e * 1.2
    crack = hp(noise(0.12), 1500) * env(0.12, 0.001) * 0.9
    out = body * 0.7 + sub; out[:len(crack)] += crack; return reverb(out, 2.2, 0.25)
def boom(d=2.2):
    t = tt(d); e = np.exp(-t * 2.2)
    sub = np.sin(2 * np.pi * np.cumsum(np.linspace(90, 28, len(t))) / SR) * e
    rumble = lp(noise(d), 260) * e * 2.5
    crack = lp(hp(noise(0.25), 200), 5000) * env(0.25, 0.001) * 1.4
    out = sub * 1.2 + rumble; out[:len(crack)] += crack; return reverb(out, 2.5, 0.3)
def hit(d=0.6):
    t = tt(d); thump = np.sin(2 * np.pi * np.cumsum(np.linspace(160, 45, len(t))) / SR) * np.exp(-t * 9)
    snap = hp(noise(0.08), 2000) * env(0.08, 0.0005) * 0.8
    out = thump * 1.2; out[:len(snap)] += snap; return reverb(out, 1.0, 0.25)
def subdrop(d=1.4): t = tt(d); return np.sin(2 * np.pi * np.cumsum(np.linspace(110, 30, len(t))) / SR) * np.exp(-t * 1.8) * 1.3
def glitch(d=0.35):
    out = np.zeros(int(d * SR)); pos = 0
    while pos < len(out):
        L_ = int(rng.uniform(0.01, 0.045) * SR); f = rng.uniform(200, 2500)
        seg = (np.sign(np.sin(2 * np.pi * f * tt(L_ / SR))) * 0.5 + hp(noise(L_ / SR), 1500) * 0.6) * (rng.random() > 0.25)
        m = min(len(seg), len(out) - pos); out[pos:pos + m] = seg[:m]; pos += L_
    return out * 0.7
def tapestop(d=0.7, f=220):
    t = tt(d); fr = f * (1 - t / d) ** 2 + 20; x = np.sign(np.sin(2 * np.pi * np.cumsum(fr) / SR)); return lp(x, 1800) * (1 - t / d) * 0.6
def beep(f=1800, d=0.07): return np.sin(2 * np.pi * f * tt(d)) * env(d, 0.002, rel=0.02) * 0.5
def lock():
    out = np.zeros(int(0.45 * SR))
    for s0, f in [(0, 1400), (0.1, 1400), (0.2, 1400), (0.3, 2100)]: b = beep(f, 0.06); out[int(s0 * SR):int(s0 * SR) + len(b)] += b
    return out
def tick(): return hp(noise(0.012), 3000) * env(0.012, 0.0005) * 0.6
def heartbeat(): out = np.zeros(int(0.6 * SR)); h = lp(np.sin(2 * np.pi * 50 * tt(0.15)) * np.exp(-tt(0.15) * 25), 200) * 1.4; out[:len(h)] += h; out[int(0.2 * SR):int(0.2 * SR) + len(h)] += h * 0.7; return out
def siren(d):
    t = tt(d); f = 650 + 300 * np.sin(2 * np.pi * t / 0.9); return lp(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)), 2200) * 0.12 * np.minimum(1, t / 0.2)
def crackle(d):
    x = np.zeros(int(d * SR)); idx = rng.integers(0, len(x) - 200, int(d * 60)); g = hp(noise(0.5), 2500)
    for i in idx: x[i:i + 120] += g[:120] * rng.uniform(0.2, 1)
    return x * 0.5 + lp(noise(d), 500) * 0.15
def wind(d): return sweep_filter(noise(d), 300, 600, q=2.5) * 0.6 * np.minimum(1, tt(d) / 1.0) * np.minimum(1, (d - tt(d)) / 1.0)
def launch(d=2.5): t = tt(d); return lp(noise(d), 700) * np.minimum(1, t / 0.4) * np.exp(-t * 0.6) * 1.6 + hp(noise(d), 3000) * 0.15 * np.exp(-t)
def shimmer(d=1.5): t = tt(d); return reverb(sum(np.sin(2 * np.pi * f * t) for f in (880, 1320, 1760)) / 3 * np.exp(-t * 3) * 0.4, 2.0, 0.6)
def stamp_hit(): return hit(0.5) * 1.1

# ---------------- placement on the narration ----------------
SCENES = [0, 8, 17, 24, 26, 30, 38, 53, 58, 62, 65, 68, 73, 74, 82, 93, 95, 107]
whip_cuts = [24, 26, 30, 38, 65, 74]; zoom_cuts = [8, 58, 68, 107]; flash_cuts = [17, 53, 62, 73, 95]
# hook
add(boom(2.5), 0.0, 0.7)
for k in range(int(wt(8) / 0.8)): add(heartbeat(), 0.05 + k * 0.8, 0.9)
for i in range(3): add(whoosh(0.3), wt(0) + i * 0.12 - 0.05, 0.35, pan=(i - 1) * 0.6)
add(subdrop(0.8), wt(2), 0.6); add(beep(440, 0.25), wt(2), 0.6)
add(stamp_hit(), wt(5), 1.0, -0.4); add(stamp_hit(), wt(7), 1.0, 0.0)
# the third one said yes
add(riser(wt(15) - wt(8)), wt(8), 0.55); add(reverse_swell(1.0), wt(15) - 1.0, 0.6)
add(lock(), wt(12) - 0.05, 0.5); add(braam(3.0), wt(15), 1.1); add(glitch(0.25), wt(15) + 0.05, 0.5)
# your world disappears
add(hit(0.7), wt(17), 0.8); add(whoosh(0.35), wt(21) - 0.2, 0.5); add(hit(0.6), wt(21), 0.8); add(boom(2.0), wt(23), 0.9); add(glitch(0.4), wt(23) + 0.25, 0.7)
# transitions
for i in whip_cuts: add(whoosh(0.4), wt(i) - 0.22, 0.75, pan=rng.uniform(-0.5, 0.5))
for i in zoom_cuts: add(reverse_swell(0.6), wt(i) - 0.6, 0.45); add(whoosh(0.35), wt(i) - 0.15, 0.5)
for i in flash_cuts: add(hit(0.5), wt(i), 0.6)
# clock + sonar + torpedo
for k in range(4): add(beep(1000, 0.05), wt(24) + 0.1 + k * 0.5, 0.35)
for k in range(3): add(reverb(np.sin(2 * np.pi * 1250 * tt(0.4)) * np.exp(-tt(0.4) * 8) * 0.5, 1.5, 0.5), wt(26) + k * 1.1, 0.5)
hitT = wt(29) + 0.45; add(riser(hitT - wt(28)), wt(28), 0.6); add(boom(2.5), hitT, 1.0)
# fleet: lock-on, then the flash
add(lock(), wt(30) + 0.9, 0.5); add(reverse_swell(1.2), wt(37) - 1.2, 0.8); add(braam(3.2, 36.7), wt(37), 1.2); add(boom(2.5), wt(37) + 0.05, 0.8)
# Washington
for k in range(10): add(tick(), wt(38) + 0.1 + k * 0.04, 0.5)
add(lock(), wt(38) + 0.3, 0.45); add(siren(wt(53) - wt(46)), wt(46) - 0.1, 1.0); add(riser(wt(48) - wt(46)), wt(46), 0.4); add(braam(2.6), wt(48), 1.0)
# midnight: Cuba launch
for k in range(3): add(beep(800, 0.06), wt(53) + 0.1 + k * 0.45, 0.4)
add(lock(), wt(54) - 0.1, 0.45); add(riser(wt(55) - wt(53)), wt(53), 0.35); add(launch(2.6), wt(55), 0.9)
# US strikes
for i in (58, 59, 60): add(whoosh(0.5), wt(i) - 0.5, 0.6); add(boom(2.0), wt(i), 0.75)
add(hit(0.6), wt(62), 0.8); add(crackle(wt(65) - wt(62)), wt(62), 0.6)
# noon
for k in range(3): add(beep(700, 0.06), wt(65) + 0.1 + k * 0.45, 0.4)
add(launch(2.2), wt(66), 0.8)
for i in (68, 69, 70, 71, 72): add(whoosh(0.45), wt(i) - 0.45, 0.45, pan=rng.uniform(-0.6, 0.6)); add(boom(1.8), wt(i), 0.6)
add(braam(2.4), wt(73), 1.0); add(crackle(1.0), wt(73), 0.6)
# ash: wind, sub drop on "summer"
add(wind(wt(82) - wt(74)), wt(74), 0.9); add(subdrop(1.4), wt(79), 0.9)
# deleted from history: glitch + tape-stop on each
for i in (83, 85, 88, 90, 92): add(glitch(0.15), wt(i - 1) - 0.08, 0.6); add(tapestop(0.45, 300), wt(i), 0.7); add(hit(0.4), wt(i), 0.5)
# "no... you"
add(reverse_swell(0.8), wt(94) - 0.8, 0.7); add(subdrop(1.2), wt(94), 1.0); add(glitch(0.5), wt(94) + 0.3, 0.8); add(tapestop(0.8, 180), wt(94) + 0.3, 0.6)
# history remembers... ended the world
add(riser(wt(104) - wt(97)), wt(97), 0.4); add(reverse_swell(0.9), wt(104) - 0.9, 0.6); add(braam(3.0), wt(104), 1.1)
# lucky for you... he said no
add(whoosh(0.4), wt(107) - 0.2, 0.5); add(shimmer(1.8), wt(107), 0.6); add(reverse_swell(1.0), wt(115) - 1.0, 0.55); add(hit(0.8), wt(115), 0.9); add(shimmer(2.0), wt(115) + 0.05, 0.6)

st = np.stack([L, R], 1)[:int(D * SR)]
st /= (np.abs(st).max() + 1e-9); st *= 0.9
wf.write('/tmp/von3/sfx_layer.wav', SR, (st * 32767).astype(np.int16))
print('sfx layer', st.shape[0] / SR, 's')
