# "The Bomb Came Later" — viral SFX blueprint (real recordings: Mixkit + public-domain cicadas), phonk score automation
import json, subprocess, os, numpy as np, scipy.signal as sg, scipy.io.wavfile as wf
SR = 48000; W = json.load(open('/tmp/vo15/dino_voice_words.json')); wt = lambda i: W[i][0]; we = lambda i: W[i][1]
D = 14.833; NS = int(D * SR); FX = np.zeros((2, NS + SR * 12)); rng = np.random.default_rng(11)
tt = lambda d: np.arange(int(d * SR)) / SR
def load(i, start=0.0, dur=None, fade=0.2, rev=False, path=None):
    if isinstance(i, str): path = '/tmp/sfxlib/' + i
    a = subprocess.run(['ffmpeg', '-v', 'error', '-i', path or f'/tmp/mkdl/{i}.mp3', '-ss', str(start)] + (['-t', str(dur)] if dur else []) + ['-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'], capture_output=True).stdout
    x = np.frombuffer(a, np.float32).reshape(-1, 2).T.astype(float).copy()
    if rev: x = x[:, ::-1].copy()
    n = min(int(fade * SR), x.shape[1]); x[:, -n:] *= np.linspace(1, 0, n) ** 2; m = min(int(0.004 * SR), x.shape[1]); x[:, :m] *= np.linspace(0, 1, m)
    return x / (np.abs(x).max() + 1e-9)
def st(x): return x if x.ndim == 2 else np.vstack([x, x])
def put(x, t, g=1.0, pan=0.0, pan_to=None):
    x = st(x); i = int(round(t * SR));
    if i < 0: x = x[:, -i:]; i = 0
    n = min(x.shape[1], FX.shape[1] - i)
    p = np.full(n, pan) if pan_to is None else np.linspace(pan, pan_to, n)
    gl, gr = np.sqrt((1 - p) / 2) * 1.414, np.sqrt((1 + p) / 2) * 1.414
    FX[0, i:i + n] += x[0, :n] * g * gl; FX[1, i:i + n] += x[1, :n] * g * gr
def at_peak(x, t, g=1.0, **k): e = np.abs(st(x)).max(0); put(x, t - np.argmax(e) / SR, g, **k)
def at_onset(x, t, g=1.0, th=0.3, **k): e = np.abs(st(x)).max(0); put(x, t - np.argmax(e > th * e.max()) / SR, g, **k)
sos = lambda kind, f: sg.butter(2, f, kind, fs=SR, output='sos')
lp = lambda x, f: sg.sosfilt(sos('low', f), x, axis=-1); hp = lambda x, f: sg.sosfilt(sos('high', f), x, axis=-1); bp = lambda x, a, b: sg.sosfilt(sos('band', [a, b]), x, axis=-1)
def dist(x, drive=4.0): y = np.tanh(x * drive); return y / (np.abs(y).max() + 1e-9)
def norm(x): return x / (np.abs(x).max() + 1e-9)
def env(d, a=0.3, r=0.4): t = tt(d); return np.minimum(1, t / max(a, 1e-3)) * np.minimum(1, (d - t) / max(r, 1e-3))
def loop(x, d): x = st(x); n = int(d * SR); reps = int(np.ceil(n / x.shape[1])); return np.tile(x, reps)[:, :n]
def verb(x, d=1.5, mix=0.4): x = st(x); ir = rng.standard_normal(int(d * SR)) * np.exp(-tt(d) * 4); y = np.vstack([sg.fftconvolve(c, ir)[:x.shape[1] + len(ir)] for c in x]); y = y / (np.abs(y).max() + 1e-9); o = np.zeros_like(y); o[:, :x.shape[1]] = x * (1 - mix); return o + y * mix
def subdrop(f0=70, f1=28, d=1.6, k=2.2, drive=2.5): t = tt(d); x = np.sin(2 * np.pi * np.cumsum(np.linspace(f0, f1, len(t))) / SR) * np.exp(-t * k); return dist(x, drive) * np.exp(-t * k)
def phone_sub(d=1.8, f=42): t = tt(d); x = np.sin(2 * np.pi * f * t) * np.exp(-t * 1.6); return dist(x, 3.5) * np.exp(-t * 1.6)  # harmonics so it rattles phone speakers
def speedup(x, r0, r1, d):  # play x with an exponentially increasing rate (pitch + tempo rise)
    x = st(x); t = tt(d); rate = r0 * (r1 / r0) ** (t / d); pos = np.cumsum(rate) / SR * SR; pos = pos[pos < x.shape[1] - 1]; return np.vstack([np.interp(pos, np.arange(x.shape[1]), c) for c in x])
def stutter(x, rate=12, duty=0.6): x = st(x); t = np.arange(x.shape[1]) / SR; return x * ((t * rate) % 1 < duty)
def pitch(x, f): x = st(x); n = int(x.shape[1] / f); return np.vstack([np.interp(np.linspace(0, x.shape[1] - 1, n), np.arange(x.shape[1]), c) for c in x])
KEYS = [hp(load(i, dur=0.25, fade=0.08), 400) for i in (2533, 2541, 2542)]
def keyboard(s, t0, cps, g=0.55):
    for j, ch in enumerate(s):
        if ch != ' ': at_onset(KEYS[j % 3], t0 + j / cps, g * rng.uniform(0.85, 1.0), pan=rng.uniform(-0.15, 0.15))
SILENT = []  # (t0, t1) windows forced to absolute zero (music + sfx)



# ---- "30 Seconds" sound design: one real file per sound ----
put(load(1976, dur=2.4, fade=0.8), 0.0, 1.0)                                   # T-rex roar right on frame 1 (loop lands here)
at_onset(load(1956, dur=1.6, fade=0.6), 1.7, 0.6)                              # low growl on the eye close-up
at_onset(load(2782, dur=2.4, fade=1.2), 3.55, 1.0); put(load('k_lowFrequency_explosion_000.wav', fade=0.5), 3.55, 0.9)   # coastal impact
put(load(1092, dur=0.55, fade=0.1), wt(21) - 0.35, 0.7)                        # rewind into "thirty seconds later"
at_onset(load(1198), 6.35, 1.0); at_onset(lp(load(1686, dur=2.5, fade=1.2), 600), 6.35, 0.8)   # deep-ocean splash
at_onset(load(3057), 8.32, 1.0)                                                 # giant foot stomps down
put(load(2434, start=5, dur=10.45 - 8.3, fade=0.3), 8.3, 0.35)                 # jungle birds
at_onset(load(2182), wt(32), 0.8)                                               # EXTINCTION CANCELLED stamp
at_onset(load(2568), wt(33) + 0.1, 0.7)                                         # "your ancestor" pop
put(load(1157, start=2, dur=12.0 - 10.45, fade=0.3), 10.45, 0.45)              # empty city wind
at_onset(load(2299), wt(36), 0.8); at_onset(load(2299), wt(38), 0.85)           # NO APES / NO HUMANS
at_onset(load(2182), wt(40), 1.0); put(load('k_lowFrequency_explosion_001.wav', fade=0.3), wt(40), 0.9)   # NO YOU
at_onset(load(1956, dur=1.8, fade=0.8), 12.5, 0.7)                             # the eye at the window
mw = load(3024, fade=0.01); at_peak(mw, D - 0.03, 1.0)                         # meteor whoosh peaks on the last frame -> loop

out = FX[:, :int(D * SR)]; out = out / (np.abs(out).max() + 1e-9) * 0.95
wf.write('/tmp/b15d/sfx.wav', SR, (out.T * 32767).astype(np.int16)); print('sfx ok', D)
