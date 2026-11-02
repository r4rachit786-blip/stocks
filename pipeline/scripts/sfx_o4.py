# Ottoman Short — SFX built to the agreed map + music automation (cuts/dips)
import json, numpy as np, scipy.signal as sg, scipy.io.wavfile as wf
SR = 48000
W = json.load(open('/tmp/voo/words.json')); wt = lambda i: W[i][0]; we = lambda i: W[i][1]
D = we(len(W) - 1) + 0.9; NS = int(D * SR)
FX = np.zeros((2, NS + SR * 4)); rng = np.random.default_rng(21)
tt = lambda d: np.arange(int(d * SR)) / SR
noise = lambda d: rng.standard_normal(int(d * SR))
lp = lambda x, f, o=4: sg.sosfilt(sg.butter(o, f, 'low', fs=SR, output='sos'), x)
hp = lambda x, f, o=4: sg.sosfilt(sg.butter(o, f, 'high', fs=SR, output='sos'), x)
bp = lambda x, a, b, o=2: sg.sosfilt(sg.butter(o, [a, b], 'band', fs=SR, output='sos'), x)
def room(x, d=0.9, mix=0.18):  # short, dry room, no long washes
    ir = noise(d) * np.exp(-tt(d) * 7); ir = lp(ir, 5000); y = sg.fftconvolve(x, ir)[:len(x) + int(d * SR)]; y /= np.abs(y).max() + 1e-9
    o = np.zeros(len(y)); o[:len(x)] += x * (1 - mix); return o + y * mix * (np.abs(x).max() + 1e-9)
def put(sig, t, g=1.0, pan=0.0):
    i = int(max(0, t) * SR); n = min(len(sig), FX.shape[1] - i)
    if n > 0: FX[0, i:i + n] += sig[:n] * g * np.sqrt((1 - pan) / 2) * 1.41; FX[1, i:i + n] += sig[:n] * g * np.sqrt((1 + pan) / 2) * 1.41
def sub(f0, f1, d, k): t = tt(d); return np.sin(2 * np.pi * np.cumsum(np.linspace(f0, f1, len(t))) / SR) * np.exp(-t * k)

# ---------------- sound models ----------------
def metal_slam(pitch=1.0, bright=1.0, d=1.6):
    """Steel hatch slam: sharp contact noise + inharmonic plate modes + short sub thump."""
    t = tt(d); modes = np.zeros(len(t))
    for f, a, k in [(187, 1.0, 5), (296, 0.8, 6), (431, 0.7, 7), (618, 0.55, 8), (911, 0.45, 10), (1340, 0.35, 13), (1987, 0.25, 17), (2810, 0.18, 22)]:
        f *= pitch * rng.uniform(0.98, 1.02); modes += a * np.sin(2 * np.pi * f * t + rng.uniform(0, 6)) * np.exp(-t * k)
    contact = bp(noise(0.03), 800, 7000) * np.exp(-tt(0.03) * 140) * 2.2 * bright
    x = modes * 0.45; x[:len(contact)] += contact
    x += sub(95 * pitch, 42 * pitch, d, 7) * 1.1                      # short sub so it lands on big speakers
    return room(x, 0.8, 0.2)
def ignition():  # tight cinematic attack + bass pulse at 0.0s
    x = sub(110, 48, 0.9, 6) * 1.1; c = hp(noise(0.02), 1500) * np.exp(-tt(0.02) * 200) * 1.2; x[:len(c)] += c
    pulse = sub(58, 55, 0.5, 8) * 0.5; x[int(0.22 * SR):int(0.22 * SR) + len(pulse)] += pulse; return room(x, 0.6, 0.12)
def rev_whoosh(d=0.38):  # fast reverse whoosh (air rushing toward the lock-in)
    x = bp(noise(d), 600, 5000) * (tt(d) / d) ** 2.6; return x * 0.9
def dry_low_hit(): x = sub(90, 48, 0.55, 9) * 1.1; k = bp(noise(0.025), 300, 3000) * np.exp(-tt(0.025) * 160) * 0.9; x[:len(k)] += k; return room(x, 0.5, 0.1)
def rubber_stamp():
    """Rubber stamp on paper: dull thunk (wood handle), paper slap, tiny table resonance."""
    x = sub(140, 95, 0.25, 22) * 1.0
    slap = bp(noise(0.05), 400, 3500) * np.exp(-tt(0.05) * 80) * 0.9; x[:len(slap)] += slap
    wood = np.sin(2 * np.pi * 620 * tt(0.08)) * np.exp(-tt(0.08) * 60) * 0.25; x[:len(wood)] += wood; return room(x, 0.4, 0.1)
def tension_pulse(d, bpm=96):  # restrained, building low pulse
    out = np.zeros(int(d * SR)); beat = 60 / bpm; k = 0.0
    while k < d - 0.1:
        g = 0.35 + 0.65 * (k / d) ** 1.4; p = sub(62, 55, 0.35, 10) * g; tick = bp(noise(0.02), 1500, 4000) * np.exp(-tt(0.02) * 150) * 0.25 * g
        s = int(k * SR); out[s:s + len(p)] += p[:len(out) - s]; out[s:s + len(tick)] += tick[:len(out) - s]; k += beat
    return out
def war_impact():  # one combined deep impact with a distant blast tail
    x = sub(70, 30, 2.8, 2.2) * 1.3; crack = bp(noise(0.06), 500, 5000) * np.exp(-tt(0.06) * 60) * 1.4; x[:len(crack)] += crack
    tail = lp(noise(2.6), 380) * np.exp(-tt(2.6) * 1.6) * 0.9; tail = room(tail, 1.6, 0.5)[:len(tail)]; x[int(0.06 * SR):int(0.06 * SR) + len(tail)] += tail[:len(x) - int(0.06 * SR)]
    return x
def power_down(d=1.3): t = tt(d); x = np.sin(2 * np.pi * np.cumsum(85 * (1 - 0.65 * (t / d) ** 0.8)) / SR) * (1 - t / d) ** 1.5; return lp(x, 400) * 0.9
def paper_rip(d=0.42):
    """Close, dry paper rip: dense crackle of fibres breaking, accelerating, band-limited."""
    out = np.zeros(int(d * SR)); k = 0.0
    while k < d - 0.01:
        rate = 0.0025 + 0.006 * (1 - k / d); s = int(k * SR); g = bp(noise(0.006), 1200, 7500) * np.hanning(int(0.006 * SR)) * rng.uniform(0.3, 1.0)
        out[s:s + len(g)] += g[:len(out) - s]; k += rate * rng.uniform(0.5, 1.5)
    body = bp(noise(d), 300, 1800) * np.sin(np.pi * tt(d) / d) ** 0.5 * 0.35; return (out + body) * 0.9
def pencil_scrape(d):
    x = bp(noise(d), 3000, 9000); grain = (rng.random(len(x)) < 0.02).astype(float); grain = lp(grain, 2500) * 6
    return x * (0.25 + grain) * 0.18 * np.minimum(1, tt(d) / 0.05) * np.minimum(1, (d - tt(d)) / 0.08)
def ruler_tap(): x = bp(noise(0.03), 900, 4500) * np.exp(-tt(0.03) * 120) * 0.6 + np.sin(2 * np.pi * 1100 * tt(0.03)) * np.exp(-tt(0.03) * 100) * 0.2; return x
def suction(d=0.55): x = bp(noise(d), 400, 6000) * (tt(d) / d) ** 3 + sub(40, 120, d, 0) * (tt(d) / d) ** 3 * 0.3; return x * 0.8
def warm_swell(d, f=73.4, peak=0.85):  # low tonal bloom (sine + octave + fifth), no sparkles
    t = tt(d); e = np.where(t < d * peak, (t / (d * peak)) ** 2, np.maximum(0, 1 - (t - d * peak) / (d * (1 - peak) + 1e-9)))
    x = np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * 2 * f * t) + 0.3 * np.sin(2 * np.pi * 1.5 * f * t); return lp(x, 900) * e * 0.35
def tom_knock(w=1.0):  # dry, muted low tom with stick contact
    x = sub(150 * (1 - 0.06 * w), 105, 0.32, 13) * (0.8 + 0.25 * w); stick = bp(noise(0.012), 1200, 6000) * np.exp(-tt(0.012) * 260) * 0.6; x[:len(stick)] += stick
    return room(x, 0.35, 0.08)
def wide_impact(): x = sub(65, 33, 1.6, 3.2) * 1.35; k = bp(noise(0.05), 250, 3500) * np.exp(-tt(0.05) * 90) * 1.1; x[:len(k)] += k; return room(x, 0.9, 0.25)
def counter_clack():  # one mechanical flip-digit clack
    a = bp(noise(0.008), 2000, 9000) * np.exp(-tt(0.008) * 400) * 1.2; b = bp(noise(0.012), 1500, 6000) * np.exp(-tt(0.012) * 300) * 0.8
    x = np.zeros(int(0.08 * SR)); x[:len(a)] += a; x[int(0.035 * SR):int(0.035 * SR) + len(b)] += b; x += np.sin(2 * np.pi * 2300 * tt(0.08)) * np.exp(-tt(0.08) * 90) * 0.12; return x
def pressure_burst(d=2.6):  # high-pressure release, then a low rumble that sits under the next phrase
    t = tt(d); hiss = hp(noise(d), 1200) * np.exp(-t * 2.2) * 0.9; whump = sub(80, 40, d, 3.2) * 0.9
    rumble = lp(np.cumsum(noise(d)), 120); rumble /= np.abs(rumble).max() + 1e-9; rumble *= np.minimum(1, t / 0.15) * np.exp(-t * 0.9) * 0.6
    att = bp(noise(0.03), 600, 6000) * np.exp(-tt(0.03) * 100) * 0.9; x = hiss + whump + rumble; x[:len(att)] += att; return x
def click(): return bp(noise(0.006), 2500, 9000) * np.exp(-tt(0.006) * 500) * 1.1 + np.sin(2 * np.pi * 3200 * tt(0.006)) * np.exp(-tt(0.006) * 400) * 0.3
def muted_impact(): x = sub(75, 45, 0.9, 6) * 0.9; k = bp(noise(0.03), 300, 2500) * np.exp(-tt(0.03) * 120) * 0.6; x[:len(k)] += k; return room(x, 0.5, 0.12)

# ---------------- placement (exactly per the map) ----------------
put(ignition(), 0.0, 1.0)                                              # 0.0  ignition / bass pulse
put(metal_slam(1.0), wt(3) - 0.01, 1.0)                                # stole: signature metal slam
put(rev_whoosh(0.38), wt(10) - 0.2, 0.7); put(dry_low_hit(), wt(10) + 0.18, 0.8)  # map title flies in, then locks
put(rubber_stamp(), wt(19) + 0.08, 0.9)                                # PAID IN FULL lands
put(metal_slam(0.82, 0.8), wt(28) - 0.01, 1.0)                         # kept: same slam, lower
put(tension_pulse(wt(39) - wt(30)), wt(30), 0.8)                       # Germany... building pulse
put(war_impact(), wt(39), 1.1)                                         # World War One
put(power_down(1.3), wt(44) - 0.05, 0.8)                               # losing side: power-down
put(paper_rip(0.42), wt(54) - 0.02, 1.0)                               # carved: dry rip on the split
ruler_end = wt(61) + 0.2; put(pencil_scrape(ruler_end - wt(56)), wt(56), 0.7); put(ruler_tap(), ruler_end, 0.6)
put(suction(0.55), wt(62) - 0.6, 0.8)                                  # suction ends just before "But"
put(warm_swell(wt(80) + 0.9 - (wt(80) - 1.9), peak=0.7), wt(80) - 1.9, 0.9)  # bloom under "survives"
for k, i in enumerate((81, 83, 85, 87)): put(tom_knock(1.0 + 0.12 * k), wt(i), 0.75 + 0.07 * k)
put(wide_impact(), wt(89), 1.05)                                       # One empire: payoff
put(counter_clack(), wt(91) + 0.12, 0.9)                               # 1927 settles (clock pops at scene start)
put(pressure_burst(2.6), wt(95) - 0.02, 1.0)                           # oil explodes: pressure release
put(warm_swell(wt(115) + 0.8 - wt(112), f=65.4, peak=0.8), wt(112), 0.8)  # building scale under "biggest oil fields"
put(click(), wt(120) + 0.1, 0.9)                                       # Atatürk reticle appears
put(muted_impact(), wt(125), 0.75)                                     # No Republic (smaller than One empire)
put(rubber_stamp(), wt(135) + 0.08, 0.9)                               # 2026 stamp
callback = lp(metal_slam(1.0, 0.5), 2200); put(callback, wt(139), 0.55)   # two ships: softer, filtered recall

out = FX[:, :NS].T; out = out / (np.abs(out).max() + 1e-9) * 0.9
wf.write('/tmp/voo/sfx_map.wav', SR, (out * 32767).astype(np.int16))

# ---------------- music automation (applied to the score before mixing) ----------------
sr_s, sc = wf.read('/tmp/voo/score48.wav'); sc = sc.astype(np.float64) / 32768.0
g = np.ones(len(sc))
def ramp(t0, t1, v0, v1): a, b = int(t0 * SR), int(t1 * SR); g[a:b] = np.linspace(v0, v1, b - a)
def hold(t0, t1, v): g[int(t0 * SR):int(t1 * SR)] = v
# dip before "kept", back up after the hit
ramp(wt(28) - 0.35, wt(28) - 0.05, 1, 0.35); ramp(wt(28) + 0.25, wt(28) + 0.8, 0.35, 1)
# "But what if": music-free gap around the turn (voice untouched)
ramp(wt(62) - 0.32, wt(62) - 0.22, 1, 0); hold(wt(62) - 0.22, wt(62) + 0.05, 0); ramp(wt(62) + 0.05, wt(62) + 0.9, 0, 1)
# Atatürk: brief dip to expose the question
ramp(wt(120) - 0.15, wt(120), 1, 0.4); ramp(wt(121), wt(121) + 0.5, 0.4, 1)
# "...or ours?": pull the music just before "ours", then silence
ramp(wt(148) - 0.18, wt(148) - 0.08, 1, 0); hold(wt(148) - 0.08, len(sc) / SR, 0)
sc = sc * g[:, None]
wf.write('/tmp/voo/score_auto.wav', SR, (np.clip(sc, -1, 1) * 32767).astype(np.int16))
print('sfx + music automation written', round(D, 2))
