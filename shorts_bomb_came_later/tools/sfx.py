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


rng = np.random.default_rng(7)
def noise(d): return rng.standard_normal(int(d * SR))
def bp(x, a, b): return sg.sosfilt(sg.butter(2, [a, b], 'band', fs=SR, output='sos'), x)
def lpf(x, f): return sg.sosfilt(sg.butter(2, f, 'low', fs=SR, output='sos'), x)
def env(d, a=0.3, r=0.4): t = tt(d); return np.minimum(1, t / a) * np.minimum(1, (d - t) / r)
def wind(d, strength=1.0): t = tt(d); g = 0.6 + 0.4 * np.sin(2 * np.pi * 0.25 * t + 1) * np.sin(2 * np.pi * 0.11 * t); return (lpf(noise(d), 700) * 1.5 + bp(noise(d), 900, 2500) * 0.4 * strength) * g * env(d)
def sea(d): t = tt(d); sw = (0.5 + 0.5 * np.sin(2 * np.pi * t / 3.2)) ** 2; return lpf(noise(d), 900) * (0.3 + sw) * env(d)
def hum(d, f=60, amp=1.0): t = tt(d); x = sum(np.sin(2 * np.pi * f * k * t) / k for k in (1, 2, 3, 5)); return x * 0.25 * amp * env(d, 0.2, 0.2)
def city(d): return (lpf(noise(d), 250) * 2 + bp(noise(d), 300, 1200) * 0.2) * env(d)
def cicada(d): t = tt(d); return bp(noise(d), 4200, 6500) * (0.5 + 0.5 * np.sin(2 * np.pi * 32 * t)) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.3 * t)) * env(d, 0.5, 0.5)
def crackle(d): x = np.zeros(int(d * SR)); idx = rng.integers(0, len(x), int(d * 60)); x[idx] = rng.uniform(-1, 1, len(idx)); return bp(x, 800, 6000) * 3 + lpf(noise(d), 200) * 0.6
def beep(f=1000, d=0.12): t = tt(d); return np.sign(np.sin(2 * np.pi * f * t)) * 0.3 * np.minimum(1, (d - t) / 0.02)
def buzzer(d=0.6): t = tt(d); return np.sign(np.sin(2 * np.pi * 110 * t)) * 0.35 * (np.sin(2 * np.pi * 6 * t) > 0) * env(d, 0.01, 0.05)
def glitch(d=0.25): x = noise(d); x = np.round(x * 3) / 3; return bp(x, 500, 8000) * env(d, 0.005, 0.05)
def swipe(d=0.25): return bp(noise(d), 1500, 7000) * (tt(d) / d) * 0.8
SC = lambda i: wt(i)
# ---- HOOK: blast + rising wind ----
put(load(2782, dur=3.2, fade=1.5), 0.1, 1.0); put(BASS, 0.1, 1.0); put(wind(3.4, 1.4), 0.2, 0.5, False)
put(glitch(0.3), wt(8), 0.6); put(BASS, wt(8), 0.6); put(HAMMER, wt(8), 0.35)
put(load(1088, dur=1.1, fade=0.4), wt(9) - 0.02, 0.7, False)
# ---- CANCEL: quiet office, typed file name, one real stamp ----
put(hum(wt(18) - wt(11), 50, 0.25), wt(11), 0.6, False); typing('MANHATTAN PROJECT', wt(11) + 0.15, 22, 0.35); stamp_hit(wt(14), 1.0, 0.8)
# ---- JETS: factory, sparks, counter, jet lunge ----
put(crackle(wt(32) - wt(18)) * 0.35, wt(18), 0.5, False); put(lpf(noise(wt(32) - wt(18)), 300) * env(wt(32) - wt(18)), wt(18), 0.25, False)
ticks(wt(18) - 0.05, wt(20) + 0.2, 1.0); typing('100,000 WORKERS', wt(23), 20, 0.3)
put(load(1580, start=1.5, dur=3.2, fade=1.4), wt(28) - 0.35, 0.9, False)
# ---- CALM: cicadas, a lone plane passes, nothing happens ----
put(cicada(wt(38) - wt(32)), wt(32), 0.35, False); put(lpf(load(1579, start=2.0, dur=4.0, fade=1.5)[0], 900), wt(34) - 0.3, 0.45, False); typing('NOTHING HAPPENS.', wt(36), 18, 0.35)
# ---- INVASION: map whooshes, then sea, battle bed and cannon fire on every muzzle flash ----
for k in range(5): put(swipe(0.4) * 0.6, wt(38) + 0.1 + k * 0.1, 0.4, False)
put(sea(wt(49) - wt(43) + 0.5), wt(43), 0.6, False); put(load(2786, dur=5.5, fade=1.5), wt(43), 0.5, False)
for k, d in enumerate([0, 0.35, 0.7, 1.0, 1.6, 2.2]): put(load(2809, dur=1.4, fade=0.7), wt(43) + d, 0.9 if k in (0, 4) else 0.55); 
put(BASS, wt(43), 0.7)
# ---- MEDALS: buzzing bulb, counter, one heavy hit ----
put(hum(wt(59) - wt(49), 120, 0.5) * (0.7 + 0.3 * np.sign(np.sin(2 * np.pi * 3.7 * tt(wt(59) - wt(49))))), wt(49), 0.35, False)
ticks(wt(49) - 0.05, wt(53), 1.0); put(BLOW, wt(53), 0.9); put(BASS, wt(53), 0.8)
# ---- HOKKAIDO: blizzard ----
put(wind(wt(63) - wt(59) + 0.6, 2.2), wt(59) - 0.1, 0.9, False); put(load(2786, start=1.0, dur=3.5, fade=1.0), wt(59), 0.45, False)
# ---- SPLIT: arrows, then the line slashes Japan ----
for k in range(3): put(swipe(0.5), wt(63) + k * 0.08, 0.45, False)
put(load(3194, dur=0.5, fade=0.2), wt(64) - 0.1, 0.8, False); put(BLOW, wt(64), 0.6); put(POP, wt(65), 0.35); put(POP, wt(66), 0.35)
# ---- STANDOFF: cold wind, two heartbeats ----
put(wind(wt(74) - wt(67), 0.7), wt(67), 0.45, False); hb = load(490); put(hb, wt(70), 1.0); put(hb, wt(72), 1.0); put(POP, wt(69) + 0.1, 0.3)
# ---- WW3: tanks, bombers overhead, fire; the big explosion ----
d = wt(86) - wt(74); put(load(2756, start=2.0, dur=d, fade=1.5), wt(74), 0.5, False); put(load(1579, start=0.5, dur=d, fade=2.0), wt(74), 0.6, False); put(crackle(d), wt(74), 0.25, False)
put(load(2800, dur=2.4, fade=1.0), wt(76), 1.0); put(BASS, wt(76), 1.0)
# ---- ROCKET: searchlight hum, countdown beeps, abort buzzer ----
ab = wt(91); put(hum(ab - wt(86), 55, 0.4), wt(86), 0.4, False)
for k in range(3): put(beep(880 if k < 2 else 1320), wt(86) + 0.2 + k * (ab - wt(86) - 0.2) / 3, 0.5, False)
rk = load(1715, dur=3.0, rev=True); put(rk, ab - rk.shape[1] / SR, 0.55, False); put(buzzer(0.9), ab, 0.7, False); put(BASS, ab, 0.6)
# ---- MOON: near-silence, typed line, marker strike ----
put(hum(wt(97) - wt(92), 40, 0.3), wt(92), 0.3, False); typing('NO MOON LANDING', wt(92), 22, 0.35); put(swipe(0.25), wt(96) + 0.15, 0.6, False)
# ---- OTHER SIDE ----
put(hum(wt(106) - wt(97), 50, 0.2), wt(97), 0.4, False); typing('JAPAN WAS ALREADY BEATEN', wt(97) + 0.1, 22, 0.2); put(BLOW, wt(105), 0.45)
# ---- TWIST: silence, glitch hit ----
put(glitch(0.4), wt(108), 0.8, False); put(load(1143, start=0.3, dur=1.6, fade=0.8), wt(108), 0.8); put(BASS, wt(108), 1.0)
# ---- LAB: ticking clock, accelerating, riser ----
put(sub(60, 28, 2.5, 1.8), wt(110), 1.0, False); tc = load(1060, dur=wt(115) - wt(110), fade=0.1); put(tc, wt(110) + 0.05, 1.0, False)
ft = load(1063, dur=2.5, fade=0.2); k = wt(115)
while k < wt(120) - 0.3: put(ft, k, 1.0 + 0.15 * (k - wt(115)), False); k += 2.4
put(riser(wt(120) - wt(115)), wt(115), 0.7, False)
# ---- SKYLINE: city, then dead silence at the flash, then the rumble ----
fT = wt(126) + 0.1; put(city(fT - wt(120)), wt(120), 0.5, False); typing('NO HIROSHIMA.', wt(122), 20, 0.3)
put(load(1690, dur=3.5, fade=1.5), fT + 0.55, 1.0); put(sub(45, 25, 3.0, 1.0), fT + 0.5, 0.9, False); typing('NO WARNING.', wt(127), 20, 0.4); typing('NO TABOO.', wt(129), 20, 0.4)
# ---- CHOICE: slider swings, button pops ----
k = wt(131)
while k < wt(136): put(swipe(0.35) * 0.5, k, 0.3, False); k += np.pi / 2.2
put(POP, wt(136), 0.8); put(POP, wt(138), 0.8)
# ---- END ----
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
