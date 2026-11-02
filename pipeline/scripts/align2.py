import json, re, difflib, subprocess, sys, numpy as np
from faster_whisper import WhisperModel
wav, txt, out = sys.argv[1:4]
toks = open(txt).read().split()
norm = lambda s: re.sub(r'[^a-z0-9]', '', s.lower().replace('ü', 'u'))
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', wav, '-f', 'f32le', '-ac', '1', '-ar', '16000', '-'], capture_output=True).stdout
m = WhisperModel('small.en', device='cpu', compute_type='int8')
segs, _ = m.transcribe(np.frombuffer(raw, np.float32), word_timestamps=True)
hw = [(w.start, w.end, w.word) for s in segs for w in s.words]
parts, owner = [], []
for i, t in enumerate(toks):
    for p in re.split(r'[-]', t):
        if norm(p): parts.append(norm(p)); owner.append(i)
hyp = [{'i': 'one', 'ataturk': 'ataturk'}.get(norm(w[2]), norm(w[2])) for w in hw]
sm = difflib.SequenceMatcher(a=parts, b=hyp, autojunk=False)
st = [None] * len(toks); en = [None] * len(toks)
for a, b, n in sm.get_matching_blocks():
    for k in range(n):
        i = owner[a + k]; s, e = hw[b + k][:2]; st[i] = s if st[i] is None else min(st[i], s); en[i] = e if en[i] is None else max(en[i], e)
miss = [i for i in range(len(toks)) if st[i] is None]
for i in miss:
    p = max([j for j in range(i) if st[j] is not None], default=None); q = min([j for j in range(i + 1, len(toks)) if st[j] is not None], default=None)
    a = en[p] if p is not None else 0.0; b = st[q] if q is not None else a + 0.4; st[i] = a + (b - a) * 0.3; en[i] = a + (b - a) * 0.8
res = [[round(st[i], 3), round(en[i], 3), re.sub(r'[.,?!]+$', '', toks[i]).replace('...', ''), 0] for i in range(len(toks))]
for i in range(1, len(res)):
    if res[i][0] < res[i - 1][0]: res[i][0] = res[i - 1][0] + 0.02
json.dump(res, open(out, 'w')); print('unmatched:', [toks[i] for i in miss])
print(' '.join(f'{i}:{r[2]}@{r[0]}' for i, r in enumerate(res)))
