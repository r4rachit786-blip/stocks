# Minimal impacts only: deep, clean hits on the biggest beats (no imitation instruments)
import json, numpy as np, scipy.signal as sg, scipy.io.wavfile as wf
SR = 48000; W = json.load(open('/tmp/voo/words.json')); wt = lambda i: W[i][0]
D = W[-1][1] + 0.9; out = np.zeros((2, int(D * SR) + SR * 3)); rng = np.random.default_rng(5)
tt = lambda d: np.arange(int(d * SR)) / SR
lp = lambda x, f: sg.sosfilt(sg.butter(4, f, 'low', fs=SR, output='sos'), x)
hp = lambda x, f: sg.sosfilt(sg.butter(4, f, 'high', fs=SR, output='sos'), x)
def verb(x, d=2.5, mix=0.4):
    ir = rng.standard_normal(int(d * SR)) * np.exp(-tt(d) * 2.6); ir = lp(ir, 3500); y = sg.fftconvolve(x, ir)[:len(x) + int(d * SR)]; y /= np.abs(y).max() + 1e-9
    o = np.zeros(len(y)); o[:len(x)] += x * (1 - mix); return o + y * mix * np.abs(x).max()
def impact(f0=70, f1=38, d=2.4, air=0.25):
    t = tt(d); body = np.sin(2 * np.pi * np.cumsum(np.linspace(f0, f1, len(t))) / SR) * np.exp(-t * 2.4)
    body += 0.35 * np.sin(2 * np.pi * np.cumsum(np.linspace(f0 * 2, f1 * 2, len(t))) / SR) * np.exp(-t * 3.5)   # 2nd harmonic so phones hear it
    tr = lp(rng.standard_normal(int(0.05 * SR)), 2500) * np.exp(-tt(0.05) * 70) * air; body[:len(tr)] += tr
    return verb(body, 2.8, 0.35)
def low_rumble(d): t = tt(d); x = lp(np.cumsum(rng.standard_normal(len(t))), 90); x /= np.abs(x).max() + 1e-9; return x * np.minimum(1, t / (d * 0.8)) * np.minimum(1, (d - t) / 0.3) * 0.6
def add(sig, t, g):
    i = int(t * SR); n = min(len(sig), out.shape[1] - i); out[0, i:i + n] += sig[:n] * g; out[1, i:i + n] += sig[:n] * g
add(impact(75, 40), wt(3), 0.8)          # "stole"
add(impact(65, 34, air=0.35), wt(28), 1.0)  # "kept"
add(impact(60, 30, 3.0), wt(39), 1.1)    # "World War One"
add(impact(80, 45), wt(54), 0.7)         # "carved"
add(impact(55, 32, 3.2, 0.15), wt(89), 1.0)  # "One empire"
add(low_rumble(wt(94) - wt(91)), wt(91), 0.8); add(impact(50, 28, 3.4, 0.4), wt(94), 1.2)  # ground swells, then "oil explodes"
add(impact(70, 40, 2.0, 0.1), wt(125), 0.6)  # "No Republic"
o = out.T[:int(D * SR)]; o /= np.abs(o).max() + 1e-9; o *= 0.9
wf.write('/tmp/voo/impacts.wav', SR, (o * 32767).astype(np.int16)); print('impacts ok')
