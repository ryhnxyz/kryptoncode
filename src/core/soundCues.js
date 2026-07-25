// ─────────────────────────────────────────────────────────────────
// KRYPTON AI CORE · sound cues
// Tiny, restrained interaction sounds following the cinematicAudio
// pattern (sine sweeps, exponential ramps, near-silent levels).
// ─────────────────────────────────────────────────────────────────

export function createCues() {
  let context = null;
  let muted = false;

  function ensure() {
    if (context) return context;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    context = new AC();
    return context;
  }

  function blip({ from = 320, to = 480, dur = 0.35, vol = 0.05, type = 'sine' } = {}) {
    const ctx = ensure();
    if (!ctx || muted) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    const now = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(from, now);
    o.frequency.exponentialRampToValueAtTime(Math.max(40, to), now + dur * 0.8);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(vol, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    o.connect(g).connect(ctx.destination);
    o.start(now);
    o.stop(now + dur + 0.05);
  }

  return {
    unlock() { ensure()?.resume?.().catch(() => {}); },
    enter() { blip({ from: 220, to: 520, dur: 0.9, vol: 0.06 }); },
    exit() { blip({ from: 420, to: 180, dur: 0.55, vol: 0.045 }); },
    state() { blip({ from: 380, to: 460, dur: 0.22, vol: 0.03 }); },
    ok() { blip({ from: 440, to: 660, dur: 0.4, vol: 0.05 }); },
    warn() { blip({ from: 300, to: 210, dur: 0.5, vol: 0.055, type: 'triangle' }); },
    setMuted(v) { muted = !!v; },
  };
}
