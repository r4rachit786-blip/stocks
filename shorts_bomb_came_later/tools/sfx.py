# "The Bomb Came Later" — real-recording SFX (Mixkit) + music automation
import json, subprocess, numpy as np, scipy.signal as sg, scipy.io.wavfile as wf
SR = 48000; W = json.load(open('/tmp/vob/words.json')); wt = lambda i: W[i][0]; we = lambda i: W[i][1]
D = we(len(W) - 1) + 0.9; NS = int(D * SR); FX = np.zeros((2, NS + SR * 12))
tt = lambda d: np.arange(int(d * SR)) / SR
def load(i, start=0.0, dur=None, fade=0.25, rev=False):
    a = subprocess.run(['ffmpeg', '-v', 'error', '-i', f'/tmp/mkdl/{i}.mp3', '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'], capture_output=True).stdout
    x = np.frombuffer(a, np.float32).reshape(-1, 2).T.astype(float); x = x[:, int(start * SR):]
    if dur: x = x[:, :int(dur * SR)]
    if rev: x = x[:, ::-1].copy(); n = min(int(0.05 * SR), x.shape[1]); x[:, -n:] *= np.linspace(1, 0, n)
    else: n = min(int(fade * SR), x.shape[1]); x[:, -n:] *= np.linspace(1, 0, n) ** 2
    n = min(int(0.01 * SR), x.shape[1]); x[:, :n] *= np.linspace(0, 1, n)
    return x / (np.abs(x).max() + 1e-9)
def onset(x, th=0.35): e = np.abs(x).max(0); return int(np.argmax(e > th * e.max()))
def put(x, t, g=1.0, align=True):
    if x.ndim == 1: x = np.vstack([x, x])
    i = int(t * SR) - (onset(x) if align else 0)
    if i < 0: x = x[:, -i:]; i = 0
    n = min(x.shape[1], FX.shape[1] - i); FX[:, i:i + n] += x[:, :n] * g
def sub(f0, f1, d, k): t = tt(d); return np.sin(2 * np.pi * np.cumsum(np.linspace(f0, f1, len(t))) / SR) * np.exp(-t * k)
STAMP = load(2182); BASS = load(2299); BLOW = load(2150); HAMMER = load(833); WH = load(1492); POP = load(2364); KEYS = [load(1382), load(1369), load(1365)]
def stamp_hit(t, g=1.0, heavy=0.7): put(STAMP, t, g); put(BASS, t, heavy * g); put(BLOW, t, 0.5 * g)
def whoosh(t, g=0.5): put(WH, t - 0.02, g)
def ticks(t0, t1, g=0.5):
    tk = load(1053); n = int((t1 - t0) * SR); put(tk[:, :n] * np.linspace(0.6, 1, n), t0, g, False)
def typing(s, t0, cps, g=0.55):
    for j, ch in enumerate(s):
        if ch != ' ': put(KEYS[j % 3], t0 + j / cps, g)
def riser(d, f0=60, f1=260): t = tt(d); x = np.sin(2 * np.pi * np.cumsum(np.linspace(f0, f1, len(t))) / SR) * (t / d) ** 2; n = np.random.default_rng(1).standard_normal(len(t)); n = sg.sosfilt(sg.butter(2, [800, 6000], 'band', fs=SR, output='sos'), n) * (t / d) ** 3; return 0.6 * x + 0.35 * n

# HOOK
put(load(2782, dur=3.0, fade=1.5), 0.1, 1.0); put(BASS, 0.1, 1.0)
whoosh(wt(0) + 0.1, 0.4); put(HAMMER, wt(4), 0.6); put(BASS, wt(4), 0.8); stamp_hit(wt(8), 1.0, 1.0)
put(load(1088, dur=1.1, fade=0.4), wt(9) - 0.02, 0.7, False)
# CANCEL
whoosh(wt(11)); stamp_hit(wt(14), 1.0, 0.9); put(HAMMER, wt(14), 0.4)
# JETS
whoosh(wt(18)); ticks(wt(18) - 0.05, wt(20) + 0.2, 1.1); put(BLOW, wt(20) + 0.2, 0.7); put(POP, wt(23), 0.4)
put(load(1580, start=1.5, dur=3.0, fade=1.2), wt(28) - 0.3, 0.8, False); put(BASS, wt(28), 0.6)
# CALM (quiet, eerie)
typing('NO FLASH.', wt(34), 14, 0.5); typing('NOTHING HAPPENS.', wt(36), 18, 0.4)
# INVASION
put(load(2786, dur=5.0, fade=1.5), wt(38), 0.45, False)
for h in (wt(43), wt(47)): put(load(2809, dur=1.6, fade=0.8), h, 0.9); put(BASS, h, 0.7)
# MEDALS
whoosh(wt(49)); ticks(wt(49) - 0.05, wt(53), 1.1); stamp_hit(wt(53), 0.9, 0.9)
# HOKKAIDO
whoosh(wt(59)); put(load(2786, start=1.0, dur=3.0, fade=1.0), wt(59), 0.6, False); put(load(1704, dur=1.4, fade=0.7), wt(61), 0.6)
# SPLIT
put(load(3194, dur=0.6, fade=0.2), wt(64) - 0.1, 0.8, False); put(BLOW, wt(64), 0.7); put(BASS, wt(64), 0.7); put(POP, wt(65), 0.45); put(POP, wt(66), 0.45)
# STANDOFF
whoosh(wt(67)); hb = load(490); put(hb, wt(70), 0.95); put(hb, wt(72), 1.0)
# WW3
put(load(2756, start=2.0, dur=7.0, fade=2.0), wt(74), 0.45, False); put(load(1579, start=1.0, dur=5.0, fade=2.0), wt(74) + 0.3, 0.5, False)
put(load(2800, dur=2.2, fade=1.0), wt(76), 1.0); put(BASS, wt(76), 0.9); stamp_hit(wt(82), 0.9, 0.8); put(HAMMER, wt(83), 0.5)
# ROCKET (ignition played backwards, then denied)
whoosh(wt(86)); rk = load(1715, start=0.0, dur=3.5, rev=True); put(rk, wt(91) - rk.shape[1] / SR, 0.75, False)
stamp_hit(wt(91), 1.0, 0.9); t = tt(1.0); put(np.sin(2 * np.pi * np.cumsum(220 * (1 - 0.8 * t)) / SR) * (1 - t) * 0.4, wt(91) + 0.05, 1.0, False)
# MOON
stamp_hit(wt(93), 0.9, 0.7); put(BLOW, wt(96), 0.5)
# OTHER SIDE
whoosh(wt(97)); put(load(3194, start=0.6, dur=0.6), wt(97) + 0.1, 0.3, False); put(BLOW, wt(105), 0.6)
# TWIST: hit on the title, then silence until the drop
put(load(1143, start=0.3, dur=1.6, fade=0.8), wt(108), 0.8); put(BASS, wt(108), 0.9)
# LAB: bass drop, ticking clock speeding up, riser
put(sub(60, 28, 2.5, 1.8), wt(110), 1.0, False); put(BASS, wt(110), 0.9)
tc = load(1060, dur=wt(115) - wt(110), fade=0.1); put(tc, wt(110) + 0.05, 1.1, False)
ft = load(1063, dur=2.5, fade=0.2); k = wt(115)
while k < wt(120) - 0.3: put(ft, k, 1.0 + 0.1 * (k - wt(115)), False); k += 2.4
put(riser(wt(120) - wt(115)), wt(115), 0.7, False)
# SKYLINE: city falls silent, flash, deep rumble, stamps
whoosh(wt(120)); put(load(1690, dur=3.5, fade=1.5), wt(126) + 0.6, 1.0); put(sub(45, 25, 3.0, 1.0), wt(126) + 0.1, 0.9, False)
stamp_hit(wt(127), 1.0, 0.7); stamp_hit(wt(129), 1.0, 0.8)
# CHOICE
put(BLOW, wt(131), 0.6); put(POP, wt(136), 0.8); put(STAMP, wt(136), 0.5); put(POP, wt(138), 0.8); put(STAMP, wt(138), 0.5)
# END: the flash again, final boom on "later"
put(load(2782, dur=2.5, fade=1.2), wt(139), 0.9); put(BASS, wt(139), 0.8); put(load(2777, dur=2.5, fade=1.5), wt(151), 0.9); put(BASS, wt(151), 1.0)

out = FX[:, :NS]; out = out / (np.abs(out).max() + 1e-9) * 0.95
wf.write('/tmp/vob/sfx.wav', SR, (out.T * 32767).astype(np.int16))
# ---- music: automation ----
a = subprocess.run(['ffmpeg', '-v', 'error', '-i', '/tmp/vob/score.wav', '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'], capture_output=True).stdout
sc = np.frombuffer(a, np.float32).reshape(-1, 2).astype(float)[:NS]
if len(sc) < NS: sc = np.vstack([sc, np.zeros((NS - len(sc), 2))])
g = np.ones(NS)
def ramp(t0, t1, v0, v1): a_, b_ = int(t0 * SR), int(t1 * SR); g[a_:b_] = np.linspace(v0, v1, b_ - a_)
def hold(t0, t1, v): g[int(t0 * SR):int(t1 * SR)] = v
ramp(0, 0.15, 0, 1)
ramp(wt(32) - 0.1, wt(32) + 0.3, 1, 0.35); hold(wt(32) + 0.3, wt(38) - 0.2, 0.35); ramp(wt(38) - 0.2, wt(38), 0.35, 1)
ramp(wt(106) - 0.15, wt(106) - 0.02, 1, 0); hold(wt(106) - 0.02, wt(110) - 0.05, 0); ramp(wt(110) - 0.05, wt(110) + 1.0, 0, 1)
ramp(wt(126), wt(126) + 0.1, 1, 0); hold(wt(126) + 0.1, wt(126) + 0.8, 0); ramp(wt(126) + 0.8, wt(127), 0, 1)
ramp(wt(151) - 0.1, wt(151) - 0.02, 1, 0); hold(wt(151) - 0.02, D, 0)
sc = sc * g[:, None]; sc /= np.abs(sc).max() + 1e-9
wf.write('/tmp/vob/score_auto.wav', SR, (sc * 0.9 * 32767).astype(np.int16)); print('ok', round(D, 2))
