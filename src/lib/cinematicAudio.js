export function createCinematicAudio() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;

  const context = new AudioContext();
  const master = context.createGain();
  master.gain.setValueAtTime(0.0001, context.currentTime);
  master.connect(context.destination);
  const nodes = [];

  const makeTone = (frequency, type, volume, detune = 0) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    oscillator.detune.value = detune;
    gain.gain.value = volume;
    oscillator.connect(gain).connect(master);
    oscillator.start();
    nodes.push(oscillator, gain);
  };

  makeTone(55, 'sine', 0.22);
  makeTone(82.41, 'sine', 0.07, -7);
  makeTone(164.81, 'triangle', 0.018, 5);

  const cue = (scene = 0) => {
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime([220, 277.18, 329.63][scene] || 220, now);
    oscillator.frequency.exponentialRampToValueAtTime([440, 554.37, 659.25][scene] || 440, now + 1.1);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.3);
    oscillator.connect(gain).connect(master);
    oscillator.start(now);
    oscillator.stop(now + 1.35);
  };

  return {
    async start() {
      if (context.state === 'suspended') await context.resume();
      master.gain.cancelScheduledValues(context.currentTime);
      master.gain.exponentialRampToValueAtTime(0.24, context.currentTime + 1.4);
      cue(0);
    },
    cue,
    setMuted(muted) {
      master.gain.cancelScheduledValues(context.currentTime);
      master.gain.exponentialRampToValueAtTime(muted ? 0.0001 : 0.24, context.currentTime + 0.35);
    },
    stop() {
      const now = context.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
      window.setTimeout(() => {
        nodes.forEach((node) => { try { node.stop?.(); } catch { /* already stopped */ } });
        context.close().catch(() => {});
      }, 550);
    },
  };
}
