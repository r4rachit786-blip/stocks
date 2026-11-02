import json, base64
REF='/root/.claude/plugins/synced/cfb5302e-c0aa-4c5c-b79d-c9e922c0f056_d798e97e-41a8-4ed4-946f-8b98f7760cad/ai-style-atlas/skills/vintage-newsprint/references/'
harness=open(REF+'harness.js').read(); sound=open(REF+'sound.js').read()
fonts=open('/tmp/buildg2/fonts/all.css').read(); main=open('/tmp/buildg2/main.js').read()
words=json.load(open('/tmp/vog2/words.json'))
vo=base64.b64encode(open('/tmp/vog2/voice.mp3','rb').read()).decode()
html=f'''<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Gandhi's Unfinished List — Short</title>
<style>
{fonts}
html,body{{margin:0;height:100%;background:#000;color:#eee;font:14px/1.3 Montserrat,sans-serif;overflow:hidden}}
#stage{{position:absolute;inset:0 0 52px 0;display:flex;align-items:center;justify-content:center}}
canvas{{background:#000;max-width:100%;max-height:100%;aspect-ratio:9/16;height:100%}}
#bar{{position:absolute;left:0;right:0;bottom:0;height:52px;display:flex;gap:10px;align-items:center;padding:0 12px;background:#111;box-sizing:border-box}}
#bar button,#bar label{{background:#222;color:#eee;border:1px solid #444;border-radius:4px;padding:6px 10px;font:inherit;cursor:pointer}}
#scrub{{flex:1}} #time{{font-variant-numeric:tabular-nums;min-width:92px}}
</style></head><body>
<div id="stage"><canvas id="cv" width="1080" height="1920"></canvas></div>
<div id="bar"><button id="play">Play</button><input id="scrub" type="range" min="0" max="1000" value="0"><span id="time">0.00</span>
<button id="snd">Sound: on</button><label>Load voiceover<input id="file" type="file" accept="audio/*" hidden></label></div>
<audio id="vo" preload="auto" src="data:audio/mpeg;base64,{vo}"></audio>
<script>window.VO_WORDS={json.dumps(words)};</script>
<script>{harness}</script>
<script>{sound}</script>
<script>{main}</script>
<script>
(() => {{
  const cv = document.getElementById('cv'), ctx = cv.getContext('2d');
  const D = window.DURATION, audio = document.getElementById('vo');
  let playing = false, soundOn = true, stopSound = null, clockT = 0, last = 0, useAudio = true;
  const draw = (t) => window.explainer(ctx, 1080, 1920, Math.max(0, Math.min(D - 1e-3, t)));
  window.seek = (t) => draw(t);
  const ui = (t) => {{ document.getElementById('scrub').value = Math.round(t / D * 1000); document.getElementById('time').textContent = t.toFixed(2) + ' / ' + D.toFixed(2); }};
  const cur = () => useAudio ? audio.currentTime : clockT;
  const stopS = () => {{ if (stopSound) {{ stopSound(); stopSound = null; }} }};
  const startS = () => {{ stopS(); if (soundOn) stopSound = SOUND.live(window.scoreSound, cur(), {{ voiceover: false }}); }};
  const play = () => {{ playing = true; document.getElementById('play').textContent = 'Pause'; if (useAudio) {{ audio.muted = !soundOn; audio.play().catch(() => {{ useAudio = false; }}); }} last = performance.now(); startS(); }};
  const pause = () => {{ playing = false; document.getElementById('play').textContent = 'Play'; audio.pause(); stopS(); }};
  const setT = (t) => {{ if (useAudio) audio.currentTime = t; clockT = t; draw(t); ui(t); if (playing) startS(); }};
  document.getElementById('play').onclick = () => playing ? pause() : play();
  document.getElementById('scrub').oninput = (e) => setT(e.target.value / 1000 * D);
  document.getElementById('snd').onclick = (e) => {{ soundOn = !soundOn; e.target.textContent = 'Sound: ' + (soundOn ? 'on' : 'off'); audio.muted = !soundOn; if (!soundOn) stopS(); else if (playing) startS(); }};
  document.getElementById('file').onchange = (e) => {{ const f = e.target.files[0]; if (!f) return; audio.src = URL.createObjectURL(f); pause(); setT(0); }};
  const tick = (now) => {{ if (playing) {{ if (useAudio) {{ if (audio.currentTime >= D - 0.03 || audio.ended) {{ audio.currentTime = 0; audio.play(); startS(); }} }} else {{ clockT += (now - last) / 1000; if (clockT >= D) {{ clockT = 0; startS(); }} }} last = now; const t = cur(); draw(t); ui(t); }} requestAnimationFrame(tick); }};
  const specs = ['400 100px "Anton"', '900 64px "Montserrat"', '400 80px "Permanent Marker"', '400 40px "Special Elite"', '700 50px "Caveat"'];
  window.ready = Promise.all(specs.map((s) => document.fonts.load(s, 'AZ09◀↓…’'))).then(() => window.loadAssets()).then(() => {{ draw(0); ui(0); requestAnimationFrame(tick); return true; }});
}})();
</script></body></html>'''
open('/home/user/stocks/shorts_gandhi_whatif/v2/index.html','w').write(html)
print(len(html), len(words))
