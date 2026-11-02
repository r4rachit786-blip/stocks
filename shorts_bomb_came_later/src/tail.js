  // ---------------- sound (bed only; the cinematic SFX layer is mixed in separately) ----------------
  function scoreSound(k) {
    const D = DURATION;
    k.tone(0, { f: 'D2', type: 'sawtooth', dur: D, gain: 0.05, a: 0.8, hold: D - 2, filter: 'lowpass', f2: 320 });
    k.tone(0, { f: 'A2', type: 'sine', dur: D, gain: 0.045, a: 1.5, hold: D - 3 });
    k.tone(0, { f: 'D3', type: 'triangle', dur: D, gain: 0.02, a: 3, hold: D - 5, filter: 'lowpass', f2: 900 });
  }
  window.explainer = (ctx, W_, H_, t) => frame(ctx, t);
  window.scoreSound = scoreSound; window.DURATION = DURATION;
})();
