# Emotion-led sound design for "What If The Ottoman Empire Survived?" (all synthesised)
import json, numpy as np, scipy.signal as sg, scipy.io.wavfile as wf
SR = 48000
W = json.load(open('/tmp/voo/words.json')); wt = lambda i: W[i][0]; we = lambda i: W[i][1]
D = we(len(W) - 1) + 0.9; N = int(D * SR) + SR * 2
MUS = np.zeros((2, N)); FX = np.zeros((2, N))      # music-like layer (ducked more) and effects layer
rng = np.random.default_rng(11)
tt = lambda d: np.arange(int(d * SR)) / SR
noise = lambda d: rng.standard_normal(int(d * SR))
def lp(x, f, o=4): return sg.sosfilt(sg.butter(o, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, o=4): return sg.sosfilt(sg.butter(o, f, 'high', fs=SR, output='sos'), x)
def bp(x, lo, hi, o=2): return sg.sosfilt(sg.butter(o, [lo, hi], 'band', fs=SR, output='sos'), x)
def pink(d): x = noise(d); b = [0.049922035, -0.095993537, 0.050612699, -0.004408786]; a = [1, -2.494956002, 2.017265875, -0.522189400]; return sg.lfilter(b, a, x) * 6
def brown(d): x = np.cumsum(noise(d)); x -= np.convolve(x, np.ones(4800) / 4800, 'same'); return x / (np.abs(x).max() + 1e-9)
def reverb(x, d=2.0, mix=0.35, damp=5000):
    ir = noise(d) * np.exp(-tt(d) * 3.2); ir = lp(ir, damp); y = sg.fftconvolve(x, ir)[:len(x) + int(d * SR)]; y /= (np.abs(y).max() + 1e-9)
    out = np.zeros(len(y)); out[:len(x)] += x * (1 - mix); return out + y * mix * (np.abs(x).max() + 1e-9)
def fade(x, a=0.01, r=0.05): n = len(x); e = np.ones(n); ai = int(a * SR); ri = int(r * SR); e[:ai] = np.linspace(0, 1, ai) if ai else 1; e[n - ri:] = np.linspace(1, 0, ri) if ri else 1; return x * e
def put(buf, sig, t, g=1.0, pan=0.0):
    i = int(max(0, t) * SR); n = min(len(sig), N - i)
    if n <= 0: return
    buf[0, i:i + n] += sig[:n] * g * np.sqrt((1 - pan) / 2) * 1.41; buf[1, i:i + n] += sig[:n] * g * np.sqrt((1 + pan) / 2) * 1.41
mus = lambda s, t, g=1.0, p=0.0: put(MUS, s, t, g, p)
fx = lambda s, t, g=1.0, p=0.0: put(FX, s, t, g, p)
HZ = lambda n: 440 * 2 ** ((n - 69) / 12)

# ---------------- instruments ----------------
def oud(f, d=1.4, bright=0.5):   # Karplus-Strong pluck with a woody body
    n = int(d * SR); p = max(2, int(SR / f)); buf = rng.uniform(-1, 1, p); out = np.zeros(n)
    for i in range(n): out[i] = buf[i % p]; buf[i % p] = 0.5 * (buf[i % p] + buf[(i + 1) % p]) * (0.993 + 0.004 * bright)
    body = bp(out, 180, 2600) * 0.6 + out * 0.5; return fade(body * np.exp(-tt(d) * 1.6), 0.002, 0.08)
def phrase(notes, t0, step, g=0.5, pan=0.0):
    for k, (n, d) in enumerate(notes): mus(oud(HZ(n), d), t0 + k * step, g, pan + (k % 2 - 0.5) * 0.2)
def pad(freqs, d, a=0.8, r=1.0, cut=1400, g=0.25):  # warm string-like chord
    t = tt(d); x = sum(sum(2 * ((f * (1 + dt) * t) % 1) - 1 for dt in (-0.004, 0, 0.005)) for f in freqs) / (len(freqs) * 3)
    e = np.minimum(1, t / a) * np.minimum(1, (d - t) / r); return lp(x, cut) * e * g
def ney(f, d, vib=5.0):  # breathy flute
    t = tt(d); ph = 2 * np.pi * np.cumsum(f * (1 + 0.012 * np.sin(2 * np.pi * vib * t) * np.minimum(1, t / 0.6))) / SR
    tone = np.sin(ph) + 0.25 * np.sin(2 * ph) + 0.08 * np.sin(3 * ph); breath = bp(noise(d), f * 0.8, f * 3) * 0.35
    e = np.minimum(1, t / 0.35) * np.minimum(1, (d - t) / 0.5); return (tone * 0.5 + breath) * e
def davul(g=1.0):  # big frame drum
    d = 1.2; t = tt(d); body = np.sin(2 * np.pi * np.cumsum(np.linspace(95, 52, len(t))) / SR) * np.exp(-t * 4.5)
    skin = bp(noise(0.06), 200, 1600) * np.exp(-tt(0.06) * 60); body[:len(skin)] += skin * 0.8; return reverb(body * g, 1.4, 0.3)
def timpani(f=73):
    d = 2.4; t = tt(d); x = sum(a * np.sin(2 * np.pi * f * m * t) * np.exp(-t * (1.6 + m)) for m, a in [(1, 1), (1.5, 0.5), (1.99, 0.35), (2.44, 0.2)])
    att = bp(noise(0.04), 100, 2000) * np.exp(-tt(0.04) * 80); x[:len(att)] += att; return reverb(x, 2.0, 0.35)
def snare_roll(d, g=0.6):
    out = np.zeros(int(d * SR)); k = 0.0
    while k < d - 0.03: s = int(k * SR); hit = bp(noise(0.035), 900, 6000) * np.exp(-tt(0.035) * 90) * (0.4 + 0.6 * k / d); out[s:s + len(hit)] += hit[:len(out) - s]; k += 0.045 + rng.uniform(-0.005, 0.005)
    return out * g
def foghorn(d=2.6):
    t = tt(d); x = sum(2 * ((f * t) % 1) - 1 for f in (82, 86.5, 164)) / 3; x = lp(x, 520) * np.minimum(1, t / 0.25) * np.minimum(1, (d - t) / 0.9)
    return reverb(x, 3.0, 0.55, 2500)
def sea(d): x = lp(pink(d), 900); m = 0.55 + 0.45 * np.sin(2 * np.pi * tt(d) / 3.1) ** 2; return x * m * 0.25
def gull():
    d = 0.35; t = tt(d); f = 2100 - 900 * t / d + 200 * np.sin(2 * np.pi * 9 * t); ph = 2 * np.pi * np.cumsum(f) / SR
    return (np.sin(ph) + 0.4 * np.sin(2 * ph)) * np.sin(np.pi * t / d) ** 2 * 0.25
def chain(d=0.9):
    out = np.zeros(int(d * SR)); k = 0.0
    while k < d - 0.05:
        s = int(k * SR); L = int(0.07 * SR); tl = np.arange(L) / SR; f0 = rng.uniform(1800, 3200)
        clink = sum(np.sin(2 * np.pi * f0 * m * tl) / m for m in (1, 2.76, 5.4)) * np.exp(-tl * 55); out[s:s + L] += clink[:len(out) - s] * rng.uniform(0.4, 1); k += rng.uniform(0.03, 0.08)
    return reverb(out * 0.5, 0.8, 0.25)
def iron_door():
    d = 1.8; t = tt(d); thud = np.sin(2 * np.pi * np.cumsum(np.linspace(120, 50, len(t))) / SR) * np.exp(-t * 6)
    ring = sum(np.sin(2 * np.pi * f * t) * np.exp(-t * k) for f, k in [(310, 3), (523, 4), (847, 6)]) * 0.25; click = hp(noise(0.03), 2000) * np.exp(-tt(0.03) * 100)
    x = thud * 1.2 + ring; x[:len(click)] += click; return reverb(x, 1.6, 0.4)
def pen(d):  # pen scratching straight lines
    x = bp(noise(d), 2500, 7000); m = (np.sin(2 * np.pi * tt(d) * 3.2) > -0.3).astype(float); m = lp(m, 40); return x * m * 0.35
def tear(d=0.7): t = tt(d); x = bp(noise(d), 900, 5500) * (0.5 + 0.5 * rng.random(len(t)) ** 3) * np.sin(np.pi * t / d) ** 0.5; return x * 0.7
def rewind(d=0.45): t = tt(d); f = 300 + 2600 * (t / d) ** 2; return np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.12 * np.sin(np.pi * t / d) + bp(noise(d), 2000, 6000) * 0.1
def chime(f=1760, d=2.2): t = tt(d); x = sum(np.sin(2 * np.pi * f * m * t) * np.exp(-t * (2 + m)) / m for m in (1, 2.0, 3.01)); return reverb(x * 0.5, 2.2, 0.5)
def cymbal_swell(d=1.2): t = tt(d); return hp(noise(d), 4000) * (t / d) ** 2.5 * 0.5
def rumble(d): x = lp(brown(d), 120) * (tt(d) / d) ** 1.5 * 1.4; creak = lp(np.sign(np.sin(2 * np.pi * np.cumsum(38 + 6 * np.sin(2 * np.pi * 0.7 * tt(d))) / SR)), 300) * 0.12 * (tt(d) / d); return x + creak
def gusher(d=3.0):
    t = tt(d); roar = lp(brown(d), 300) * 1.4; hiss = hp(noise(d), 2500) * 0.45; gurgle = bp(noise(d), 150, 700) * (0.5 + 0.5 * np.sin(2 * np.pi * 7 * t + 3 * np.sin(2 * np.pi * 1.3 * t)))
    e = np.minimum(1, t / 0.05) * np.exp(-t * 0.5); return (roar + hiss + gurgle) * e
def crackle(d): x = np.zeros(int(d * SR)); g = hp(noise(0.02), 2500)
def fire(d):
    x = lp(pink(d), 600) * 0.3; idx = rng.integers(0, int(d * SR) - 1000, int(d * 45)); g = hp(noise(0.02), 2500)
    for i in idx: x[i:i + len(g)] += g * rng.uniform(0.1, 0.6) * np.exp(-tt(0.02) * 120)
    return x
def coin_drop(): L = int(0.4 * SR); tl = np.arange(L) / SR; f = rng.uniform(3000, 4500); x = np.zeros(L)
def coin(f):
    L = int(0.5 * SR); tl = np.arange(L) / SR; x = sum(np.sin(2 * np.pi * f * m * tl) * np.exp(-tl * (9 + 4 * m)) / m for m in (1, 2.2, 3.7)) * 0.35
    for b in (0.09, 0.16): s = int(b * SR); x[s:] += x[:L - s] * 0.35
    return x
def cascade(d=1.6, n=26):
    out = np.zeros(int((d + 0.6) * SR))
    for k in range(n): s = int(rng.uniform(0, d) * SR); c = coin(rng.uniform(2600, 5200)); out[s:s + len(c)] += c * rng.uniform(0.3, 0.9)
    return out
def bell_toll(f=110): d = 5.0; t = tt(d); x = sum(a * np.sin(2 * np.pi * f * m * t) * np.exp(-t * k) for m, a, k in [(1, 1, 0.6), (2.0, 0.6, 0.9), (2.4, 0.5, 1.1), (3.0, 0.35, 1.4), (4.5, 0.25, 2.0), (5.3, 0.15, 2.6)]); return reverb(x * 0.6, 3.0, 0.4)
def typewriter(n=8, gap=0.09):
    out = np.zeros(int((n * gap + 0.3) * SR))
    for k in range(n): s = int((k * gap + rng.uniform(0, 0.02)) * SR); c = hp(noise(0.015), 1500) * np.exp(-tt(0.015) * 160); c = c + np.sin(2 * np.pi * 180 * tt(0.015))[:len(c)] * np.exp(-tt(0.015) * 150)[:len(c)] * 0.6; out[s:s + len(c)] += c
    return out * 0.7
def boots(d, rate=2.0):
    out = np.zeros(int(d * SR)); k = 0.0
    while k < d - 0.2: s = int(k * SR); st = lp(noise(0.12), 400) * np.exp(-tt(0.12) * 30); st[:3840] += bp(noise(0.08), 1500, 4000) * np.exp(-tt(0.08) * 50) * 0.3; out[s:s + len(st)] += st[:len(out) - s]; k += 1 / rate
    return out * 0.5
def shimmer(d=2.0): t = tt(d); x = sum(np.sin(2 * np.pi * f * t) for f in (1568, 2093, 2637, 3136)) / 4 * np.exp(-t * 2.5) * 0.3; return reverb(x, 2.5, 0.6)

# ---------------- score: scale is D Hijaz (D Eb F# G A Bb C) ----------------
D4, Eb4, Fs4, G4, A4, Bb4, C5, D5 = 62, 63, 66, 67, 69, 70, 72, 74
# 1. Hook: harbour, foghorn, chain on "stole", low held note
fx(sea(wt(15) + 0.5), 0.0, 0.9); fx(foghorn(2.6), 0.05, 0.9); fx(gull(), 0.9, 0.6, -0.5); fx(gull(), 2.2, 0.45, 0.6)
fx(chain(0.9), wt(3) - 0.05, 1.0, 0.2); fx(chain(0.7), wt(5) - 0.05, 0.8, -0.2)
mus(pad([HZ(38), HZ(45)], wt(15), 1.5, 1.2, 700, 0.5), 0.0)
fx(timpani(73), wt(10), 0.6)                         # "Middle East" lands with a soft timpani
# 2. Paid / donated: warm oud melody + single coins
phrase([(D4, 1.2), (Eb4, 1.0), (Fs4, 1.0), (G4, 1.4), (A4, 1.2), (G4, 1.0), (Fs4, 1.0), (Eb4, 1.4)], wt(15) + 0.1, 0.38, 0.55)
mus(pad([HZ(50), HZ(57), HZ(62)], wt(27) - wt(15) + 0.2, 0.8, 0.15, 1300, 0.3), wt(15))
for k in range(4): fx(coin(rng.uniform(3000, 4200)), wt(23) + k * 0.33, 0.7, rng.uniform(-0.4, 0.4))
# 3. "Britain kept them": melody stops, iron door, dissonant swell
fx(iron_door(), wt(28) - 0.02, 1.2); mus(pad([HZ(50), HZ(51), HZ(57)], 2.6, 0.9, 1.0, 900, 0.35), wt(28) + 0.15)
# 4. Germany / WW1 / losing side: engine rumble, snare roll, timpani, sagging drone
fx(lp(brown(wt(39) - wt(30)), 160) * 0.6, wt(30), 0.9); fx(snare_roll(wt(39) - wt(35), 0.7), wt(35), 1.0)
fx(timpani(65), wt(39), 1.3); fx(timpani(49), wt(39) + 0.05, 0.8)
t0 = wt(42); dd = wt(46) - t0 + 0.6; tsag = tt(dd); sag = np.sin(2 * np.pi * np.cumsum(HZ(50) * (1 - 0.18 * tsag / dd)) / SR) * np.minimum(1, tsag / 0.2) * np.minimum(1, (dd - tsag) / 0.5) * 0.3; mus(lp(sag, 600), t0)
# 5. Carved up: quiet room, pen lines, paper tear, sad descending oud
fx(pen(wt(54) - wt(48)), wt(48), 0.9); fx(tear(0.75), wt(54) - 0.05, 1.1); fx(pen(1.4), wt(57), 0.8)
phrase([(D5, 1.4), (C5, 1.2), (Bb4, 1.2), (A4, 1.6), (G4, 1.8)], wt(55), 0.5, 0.45)
# 6. What if: short rewind squeal, a bright chime
fx(rewind(0.45), wt(62) - 0.05, 0.9); fx(chime(1760), wt(64), 0.7); fx(chime(2349), wt(68), 0.45)
# 7. The empire survives: warm rising major chord + oud flourish
mus(pad([HZ(50), HZ(54), HZ(57), HZ(62)], wt(81) - wt(71) + 0.4, 1.6, 0.6, 1800, 0.38), wt(71))
phrase([(D4, 0.9), (Fs4, 0.9), (A4, 0.9), (D5, 2.0)], wt(79) - 0.2, 0.16, 0.6)
fx(cymbal_swell(1.0), wt(80) - 1.0, 0.7)
# 8. No Iraq / Syria / Jordan / Lebanon: one davul per "No", growing; "One empire" lands
for k, i in enumerate((81, 83, 85, 87)): fx(davul(0.75 + 0.12 * k), wt(i), 1.0)
fx(cymbal_swell(1.0), wt(89) - 1.0, 0.8); fx(davul(1.3), wt(89), 1.2); mus(pad([HZ(38), HZ(50), HZ(54), HZ(57)], 2.4, 0.05, 1.4, 2200, 0.45), wt(89))
# 9. 1927: ground groans, then the gusher and fire
fx(rumble(wt(94) - wt(91)), wt(91), 1.2); fx(gusher(3.2), wt(94) - 0.02, 1.3); fx(fire(wt(106) - wt(94)), wt(94) + 0.5, 0.8)
# 10. Opulence: shimmer, one coin cascade, regal low chord
fx(shimmer(2.2), wt(106), 0.8); fx(cascade(1.6, 28), wt(110), 0.9); mus(pad([HZ(38), HZ(45), HZ(50), HZ(57)], wt(120) - wt(106), 0.8, 0.8, 1100, 0.35), wt(106))
phrase([(A4, 0.8), (Bb4, 0.8), (A4, 0.8), (G4, 0.8), (Fs4, 1.6)], wt(115), 0.14, 0.5)
# 11. Atatürk: faint boots, typewriter on the status line, a single bell toll
fx(boots(wt(125) - wt(120), 2.1), wt(120), 0.8); fx(typewriter(10, 0.07), wt(120) + 0.15, 0.8); fx(bell_toll(98), wt(125), 1.0)
# 12. Istanbul: water, gulls, breathy ney melody
fx(sea(wt(136) - wt(129) + 0.8), wt(129), 0.8); fx(gull(), wt(129) + 0.6, 0.5, -0.6); fx(gull(), wt(132) + 0.3, 0.4, 0.5)
for k, (n, d) in enumerate([(A4, 1.1), (Bb4, 0.7), (A4, 0.7), (G4, 1.0), (Fs4, 1.6)]): mus(ney(HZ(n), d), wt(129) + 0.2 + sum([1.1, 0.7, 0.7, 1.0][:k]) * 0.95, 0.45)
fx(timpani(73), wt(135), 0.6)
# 13. Ending: the foghorn returns, an unresolved chord, one last pluck
fx(foghorn(2.4), wt(136) + 0.05, 0.75); mus(pad([HZ(50), HZ(55), HZ(57)], D - wt(141) + 0.5, 1.0, 1.2, 1500, 0.35), wt(141))
mus(oud(HZ(G4), 2.0), wt(148) + 0.1, 0.6)

def phone_ready(x): low = lp(x, 160); return x * 0.85 + hp(np.tanh(low * 5) * 0.5, 180) * 0.9 + np.tanh(bp(x, 180, 3000) * 2) * 0.3
for name, B in (('mus', MUS), ('fx', FX)):
    out = np.stack([phone_ready(B[0]), phone_ready(B[1])], 1)[:int(D * SR)]; out /= (np.abs(out).max() + 1e-9); out *= 0.9
    wf.write(f'/tmp/voo/sd_{name}.wav', SR, (out * 32767).astype(np.int16))
print('layers written', round(D, 2))
