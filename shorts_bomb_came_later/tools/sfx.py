# "The Bomb Came Later" — viral SFX blueprint (real recordings: Mixkit + public-domain cicadas), phonk score automation
import json, subprocess, os, numpy as np, scipy.signal as sg, scipy.io.wavfile as wf
SR = 48000; W = json.load(open('/tmp/vob/words.json')); wt = lambda i: W[i][0]; we = lambda i: W[i][1]
D = we(len(W) - 1) + 0.9; NS = int(D * SR); FX = np.zeros((2, NS + SR * 12)); rng = np.random.default_rng(11)
tt = lambda d: np.arange(int(d * SR)) / SR
def load(i, start=0.0, dur=None, fade=0.2, rev=False, path=None):
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

# 0:00 — open ON the explosion peak: phone-rattling sub + distorted blast; anvil slam on 1950
at_peak(dist(load(2782, dur=3.2, fade=1.6), 2.2), 0.0, 1.0); at_peak(load(1700, dur=2.0, fade=1.0), 0.0, 0.7); put(phone_sub(2.2, 40), 0.0, 1.0)
at_onset(load(833), wt(8), 0.9); at_onset(load(1520), wt(8), 0.7); put(subdrop(80, 35, 0.8, 4), wt(8), 0.7)
# 0:03.7 — rewind: everything else cut; tape screech + sub-bass reverse riser into 1942
put(hp(load(1093, dur=1.0, fade=0.15), 1500), wt(9) - 0.02, 0.8); put(load(1088, dur=0.9, fade=0.2), wt(9), 0.45)
rr = lp(load(2782, dur=1.0, rev=True), 260); put(rr, wt(11) - rr.shape[1] / SR, 1.0)
# 0:04.5 — desk: mechanical keyboard on the title, hydraulic press thud on CANCELLED
keyboard('MANHATTAN PROJECT', wt(11) + 0.15, 22, 0.6)
put(hp(load(849, dur=0.35, fade=0.1), 900), wt(14) - 0.3, 0.6); at_onset(load(1520), wt(14), 0.8); at_onset(load(2299), wt(14), 0.9); at_onset(load(201), wt(14), 0.6)
# 0:07.9 — hangar: ticking-bomb counter, mech-suit whine, bass-boosted jet flyby
tk = hp(pitch(load(1053), 1.35), 600); n = int((wt(20) + 0.25 - wt(18)) * SR); put(tk[:, :n], wt(18) - 0.05, 0.9)
put(load(1061), wt(20) + 0.2, 0.6); keyboard('100,000 WORKERS', wt(23), 20, 0.45)
at_onset(load(3165), wt(28) - 0.35, 0.8); jet = load(1580, start=4.6, dur=3.6, fade=1.5); jet = jet + 0.8 * norm(lp(jet, 180)); put(norm(jet), wt(28) - 0.6, 1.0, pan=-0.7, pan_to=0.7)
# 0:11.9 — Hiroshima: cicadas slightly too loud, cut dead on "No flash"; distorted propeller drone in the void
cic = hp(load(None, start=20, dur=wt(34) + 0.05 - wt(32), fade=0.01, path='/tmp/wmc/dl/cicada_tw.mp3'), 2500); put(cic, wt(32), 1.0)
pr = dist(lp(load(1579, start=1.5, dur=wt(38) - wt(34) + 0.3, fade=1.0), 1800), 3.0); put(pr * env(pr.shape[1] / SR, 0.6, 0.4), wt(34) + 0.05, 0.4, pan=-0.6, pan_to=0.6)
keyboard('NOTHING HAPPENS.', wt(36), 18, 0.45)
# 0:15.0 — invasion map: deep low whooshes panned left->right with the arrows
dw = lp(load(2604, dur=1.4, fade=0.4), 900)
for k in range(5): put(dw, wt(38) + 0.05 + k * 0.1, 0.5, pan=-0.9 + 0.1 * k, pan_to=0.9)
# 0:16.3 — fleet: howitzer blasts on every muzzle flash; sub-drops on 1, 3 and 6
for k, d in enumerate([0, 0.35, 0.7, 1.0, 1.6, 2.2]):
    at_onset(load(1700, dur=1.0, fade=0.5), wt(43) + d, 0.95 if k in (0, 2, 5) else 0.7, pan=[-0.5, -0.3, -0.2, 0.4, -0.3, -0.5][k])
    if k in (0, 2, 5): put(subdrop(75, 30, 1.0, 3.5, 3), wt(43) + d, 0.9)
put(lp(load(2786, dur=5.5, fade=1.5), 900), wt(43), 0.35)
# 0:18.5 — warehouse: fluorescent buzz building, vault-door slam at 500,000 cuts it dead
bd = wt(53) - wt(49); t = tt(bd); buzz = (sum(np.sin(2 * np.pi * 120 * k * t) / k for k in (1, 2, 3, 4, 6)) * 0.3 + np.resize(hp(load(1452, dur=bd, fade=0.01)[0], 2000), len(t)) * 0.4) * (0.15 + 0.85 * (t / bd) ** 1.5)
put(buzz, wt(49), 0.6); tk2 = hp(pitch(load(1053), 1.5), 600); put(tk2[:, :int(bd * SR)], wt(49) - 0.05, 0.75)
at_onset(load(201), wt(53), 1.0); at_onset(load(3186), wt(53) + 0.02, 0.5); put(subdrop(60, 30, 1.0, 3), wt(53), 0.8)
# 0:20.6 — Hokkaido: aggressive blizzard howl, artillery a mile away through the snow
bz = load(1153, start=10, dur=wt(63) - wt(59) + 0.5, fade=0.4); put(bz * env(bz.shape[1] / SR, 0.15, 0.4), wt(59) - 0.05, 1.0)
art = lp(load(2786, start=0.5, dur=3.5, fade=1.0), 350); put(art, wt(59) + 0.2, 0.8)
# 0:22.3 — map split: blade schwing on the line; subtle low "vine boom" on each label
for k in range(3): put(lp(load(2604, dur=0.8, fade=0.3), 900), wt(63) + k * 0.08, 0.35, pan=0.6, pan_to=-0.2)
at_onset(load(2160), wt(64) - 0.05, 0.9); at_onset(load(2152), wt(64), 0.6)
def vboom(): t = tt(0.7); x = np.sin(2 * np.pi * np.cumsum(np.linspace(90, 45, len(t))) / SR) * np.exp(-t * 5); c = hp(rng.standard_normal(len(t)), 2000) * np.exp(-t * 60) * 0.3; return dist(x + c, 2.0) * np.exp(-t * 4)
put(vboom(), wt(65), 0.6); put(vboom(), wt(66), 0.6)
# 0:23.7 — standoff: two ultra-deep echoing heartbeats; wind killed on the second -> pure silence before WW3
wd = wt(72) - wt(67); wn = load(1157, start=2, dur=wd, fade=0.02); put(wn, wt(67), 0.5)
hb = verb(lp(load(498, dur=1.2, fade=0.4), 500), 1.8, 0.45); at_onset(norm(hb), wt(70), 1.0); at_onset(norm(hb), wt(72), 1.0)
# 0:25.7 — WW3 (mid-video peak): dirty phonk distortion hit, tank-track squeal
put(load(2756, start=2.0, dur=wt(86) - wt(74), fade=1.2), wt(74), 0.45); put(load(1579, start=0.5, dur=wt(86) - wt(74), fade=1.5), wt(74), 0.5, pan=0.6, pan_to=-0.6)
at_onset(load(2757), wt(74) + 0.15, 0.8); at_onset(load(2757), wt(83), 0.7)
hit = dist(load(2800, dur=2.0, fade=1.0) + 0.8 * load(2303, dur=2.0, fade=1.0), 6.0); at_onset(hit, wt(76), 1.0); put(subdrop(65, 25, 1.6, 2.0, 4), wt(76), 1.0)
# 0:30.3 — rocket abort: vintage computer beeps, reversed jet suck, glitch-pitched meltdown horn
ab = wt(91); T0 = wt(86) + 0.2; step = (ab - T0) / 3
put(lp(load(3122, dur=ab - wt(86), fade=0.2), 5000), wt(86), 0.3)
for k in range(3): t = tt(0.16); put(np.sin(2 * np.pi * (1200 if k < 2 else 1800) * t) * np.minimum(1, (0.16 - t) / 0.02) * 0.6, T0 + k * step, 0.7)
js = load(1580, start=4.0, dur=3.0, fade=0.05, rev=True); put(js, ab - js.shape[1] / SR + 0.05, 0.8)
alarm = stutter(pitch(load(999, dur=1.6, fade=0.4), 0.78), 9, 0.55); put(dist(alarm, 2.5), ab, 0.75); put(subdrop(70, 30, 1.0, 3), ab, 0.8)
# 0:32.4 — Moon: deep space vacuum hum; wet aggressive marker strike dead centre
put(load(1177, dur=wt(97) - wt(92), fade=0.5), wt(92), 0.5); keyboard('NO MOON LANDING', wt(92), 22, 0.4); at_onset(load(2998), wt(96) + 0.15, 1.0)
# 0:34.5 — historian's study: lo-fi vinyl crackle + muted keyboard taps, everything turned DOWN
cd = wt(106) - wt(97); cr = np.zeros(int(cd * SR)); idx = rng.integers(0, len(cr), int(cd * 120)); cr[idx] = rng.uniform(-1, 1, len(idx)) * rng.uniform(0.2, 1, len(idx)); cr = bp(cr, 1000, 7000) * 2 + lp(rng.standard_normal(len(cr)), 300) * 0.1
put(cr, wt(97), 0.25); put(load(701), wt(97), 0.3); [put(lp(KEYS[j % 3], 2500), wt(97) + 0.1 + j / 22, 0.18) for j in range(22)]
# 0:37.6 — THE TWIST: glitch zap -> massive braam -> exactly 1 s of absolute silence
at_onset(load(2951), wt(108), 0.9); br_t = we(109) - 0.05; br = dist(load(3111, dur=0.72, fade=0.02) + 0.6 * load(2291, dur=0.72, fade=0.02), 2.0); put(br, br_t, 1.0); put(subdrop(55, 30, 0.72, 1.5, 3), br_t, 1.0)
SILENT.append((br_t + 0.72, br_t + 1.72))
# 0:39.5 — lab: deep sub drop, grandfather clock ticking that pitches up exponentially like a racing heart
put(subdrop(60, 25, 2.0, 1.4, 2), wt(110), 1.0); ck = load(1072, start=2.0, dur=40, fade=0.05); seq = speedup(ck, 1.0, 5.5, wt(120) - wt(110)); put(norm(hp(seq, 250)) * np.linspace(0.8, 1.0, seq.shape[1]), wt(110), 1.0)
# 0:43.7 — skyline: lonely city hum, distant echoing siren, keyboard clacks; at the flash DEAD SILENCE, 1.5 s later the shockwave
fT = wt(126) + 0.1; ch = lp(rng.standard_normal(int((fT - wt(120)) * SR)), 220) * 3; put(ch * env(len(ch) / SR, 0.4, 0.01), wt(120), 0.35)
sn = verb(lp(load(1652, start=10, dur=fT - wt(120), fade=0.02), 1800), 2.0, 0.6); put(sn[:, :int((fT - wt(120)) * SR)], wt(120), 0.35)
keyboard('NO HIROSHIMA.', wt(122), 20, 0.45); SILENT.append((fT, fT + 1.5))
shk = lp(load(1686, dur=4.0, fade=2.0), 400) + 0.6 * lp(load(1278, start=0.9, dur=4.0, fade=2.0), 300); put(norm(shk), fT + 1.5, 1.0); put(subdrop(45, 22, 3.0, 0.9, 3), fT + 1.5, 1.0)
# 0:47.8 — valley slider: clean whip whooshes, sharp UI pops
k = wt(131); s0 = k
while k < wt(136): at_onset(hp(load(1511), 600), k, 0.5, pan=-0.5 if int((k - s0) / (np.pi / 2.2)) % 2 else 0.5); k += np.pi / 2.2
at_onset(load(2568), wt(136), 0.9); at_onset(load(2573), wt(138), 0.9)
# 0:51.3 — mushroom returns: distorted god-tier explosion + metallic crunch
at_onset(dist(load(2782, dur=2.6, fade=1.2), 2.5), wt(139), 1.0); at_onset(load(1687, dur=2.0, fade=1.0), wt(139), 0.8); put(phone_sub(1.6, 40), wt(139), 0.8)
# 0:54.2 — loop point: explosion whose peak sits on the very last frame, hard cut -> snaps into the 0:00 blast
fin = dist(load(2782, dur=0.6, fade=0.01), 2.2); put(fin[:, :int(0.45 * SR)], D - 0.45, 1.0); put(phone_sub(0.45, 40), D - 0.45, 0.9)
at_onset(load(2777, dur=1.2, fade=0.6), wt(151), 0.7)

out = FX[:, :NS]; out = out / (np.abs(out).max() + 1e-9) * 0.95
for a, b in SILENT: out[:, int(a * SR):int(b * SR)] = 0
wf.write('/tmp/vob/sfx3.wav', SR, (out.T * 32767).astype(np.int16)); json.dump(SILENT, open('/tmp/vob/silent.json', 'w'))
# ---- phonk score automation ----
a = subprocess.run(['ffmpeg', '-v', 'error', '-i', os.environ.get('SCORE', '/tmp/vob/phonk.wav'), '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'], capture_output=True).stdout
sc = np.frombuffer(a, np.float32).reshape(-1, 2).astype(float)[:NS]
if len(sc) < NS: sc = np.vstack([sc, np.zeros((NS - len(sc), 2))])
g = np.ones(NS)
def ramp(t0, t1, v0, v1): a_, b_ = int(t0 * SR), int(t1 * SR); g[a_:b_] = np.linspace(v0, v1, b_ - a_)
def hold(t0, t1, v): g[int(t0 * SR):int(t1 * SR)] = v
hold(wt(9) - 0.02, wt(11), 0.0); ramp(wt(32) - 0.1, wt(32) + 0.1, 1, 0.3); hold(wt(32) + 0.1, wt(34), 0.3); ramp(wt(34), wt(34) + 0.05, 0.3, 0.12); hold(wt(34) + 0.05, wt(38) - 0.1, 0.12); ramp(wt(38) - 0.1, wt(38), 0.12, 1); hold(wt(59), wt(63), 0.45); hold(wt(110) + 0.4, wt(115), 0.4); ramp(wt(115), wt(120), 0.4, 1); hold(wt(91), wt(92), 0.5); ramp(wt(11), wt(11) + 0.2, 0.0, 1.0)              # rewind: all other sound cut
hold(wt(72) + 0.1, wt(74) - 0.02, 0.0)                                                # silence before the WW3 shock
ramp(wt(97) - 0.2, wt(97) + 0.2, 1, 0.3); hold(wt(97) + 0.2, wt(106) - 0.1, 0.3)       # historian: breathing room
hold(wt(106) - 0.1, wt(110), 0.0); ramp(wt(110), wt(110) + 0.4, 0, 1)                 # twist
ramp(wt(151) - 0.15, wt(151) - 0.02, 1, 0); hold(wt(151) - 0.02, D, 0)                 # cut dead on "later"
sc = sc * g[:, None]
for a_, b_ in SILENT: sc[int(a_ * SR):int(b_ * SR)] = 0
sc /= np.abs(sc).max() + 1e-9; wf.write('/tmp/vob/score3.wav', SR, (sc * 0.9 * 32767).astype(np.int16)); print('ok', round(D, 2))
