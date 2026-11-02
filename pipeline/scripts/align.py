import json, re, difflib, sys
from faster_whisper import WhisperModel
ref = json.load(open('/tmp/von2/words.json'))          # 116 script tokens (structure used by the edit)
m = WhisperModel('small.en', device='cpu', compute_type='int8')
import subprocess, numpy as np
raw = subprocess.run(['ffmpeg','-v','error','-i','/tmp/von3/raw.wav','-f','f32le','-ac','1','-ar','16000','-'],capture_output=True).stdout
audio = np.frombuffer(raw, np.float32)
segs, _ = m.transcribe(audio, word_timestamps=True, initial_prompt='Vasili Arkhipov, Leningrad, Washington, iPhone, YouTube, 1962')
hw = [(w.start, w.end, w.word) for s in segs for w in s.words]
norm = lambda s: re.sub(r'[^a-z0-9]', '', s.lower())
# expand reference tokens into parts
parts = []; owner = []
for i, (_, _, t, _) in enumerate(ref):
    for p in re.split(r'[\s,]+', t):
        if norm(p): parts.append(norm(p)); owner.append(i)
hyp = [norm(w[2]) for w in hw]
sm = difflib.SequenceMatcher(a=parts, b=hyp, autojunk=False)
st = [None] * len(ref); en = [None] * len(ref)
for a, b, n in sm.get_matching_blocks():
    for k in range(n):
        i = owner[a + k]; s, e = hw[b + k][0], hw[b + k][1]
        st[i] = s if st[i] is None else min(st[i], s); en[i] = e if en[i] is None else max(en[i], e)
miss = [i for i in range(len(ref)) if st[i] is None]
# interpolate any unmatched tokens between neighbours
for i in miss:
    p = max([j for j in range(i) if st[j] is not None], default=None); q = min([j for j in range(i + 1, len(ref)) if st[j] is not None], default=None)
    a = en[p] if p is not None else 0.0; b = st[q] if q is not None else a + 0.4
    st[i] = a + (b - a) * 0.3; en[i] = a + (b - a) * 0.8
out = [[round(st[i], 3), round(en[i], 3), ref[i][2], 0] for i in range(len(ref))]
for i in range(1, len(out)):
    if out[i][0] < out[i - 1][0]: out[i][0] = out[i - 1][0] + 0.02
json.dump(out, open('/tmp/von3/words.json', 'w'))
print('whisper words', len(hw), 'unmatched', [ref[i][2] for i in miss])
print(' '.join(f'{i}:{o[2]}@{o[0]}' for i, o in enumerate(out)))
