const FEMALE_HINTS = ['female', 'woman', 'zira', 'samantha', 'aria', 'jenny', 'gadis', 'damayanti', 'siti', 'google indonesia'];

function pickVoice(locale) {
  const voices = window.speechSynthesis?.getVoices?.() || [];
  const language = locale.toLowerCase().split('-')[0];
  const matching = voices.filter((voice) => voice.lang.toLowerCase().startsWith(language));
  return matching.find((voice) => FEMALE_HINTS.some((hint) => voice.name.toLowerCase().includes(hint))) || matching.find((voice) => voice.localService) || matching[0] || voices[0];
}

export function createCinematicAudio() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  const context = new AudioContext();
  const master = context.createGain();
  const bed = context.createGain();
  master.gain.value = 0.0001;
  bed.gain.value = 1;
  bed.connect(master).connect(context.destination);
  const nodes = [];

  [[48, 'sine', 0.13], [72, 'sine', 0.045], [144, 'triangle', 0.012]].forEach(([frequency, type, volume]) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.value = volume;
    oscillator.connect(gain).connect(bed);
    oscillator.start();
    nodes.push(oscillator);
  });

  const cue = (scene = 0) => {
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = scene === 1 ? 'triangle' : 'sine';
    oscillator.frequency.setValueAtTime([196, 261.63, 329.63][scene] || 196, now);
    oscillator.frequency.exponentialRampToValueAtTime([392, 392, 659.25][scene] || 392, now + 1.5);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.065, now + 0.16);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.7);
    oscillator.connect(gain).connect(master);
    oscillator.start(now);
    oscillator.stop(now + 1.8);
  };

  const duck = (active) => {
    const now = context.currentTime;
    bed.gain.cancelScheduledValues(now);
    bed.gain.linearRampToValueAtTime(active ? 0.38 : 1, now + 0.32);
  };

  return {
    async start() {
      if (context.state === 'suspended') await context.resume();
      master.gain.exponentialRampToValueAtTime(0.22, context.currentTime + 1.6);
      cue(0);
    },
    cue,
    speak(text, locale, onEnd) {
      if (!window.speechSynthesis) { onEnd?.(); return; }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = locale;
      utterance.voice = pickVoice(locale) || null;
      utterance.rate = locale.startsWith('id') ? 0.9 : 0.88;
      utterance.pitch = 1.06;
      utterance.volume = 0.92;
      utterance.onstart = () => duck(true);
      utterance.onend = () => { duck(false); onEnd?.(); };
      utterance.onerror = () => { duck(false); onEnd?.(); };
      window.speechSynthesis.speak(utterance);
    },
    setMuted(muted) {
      if (muted) window.speechSynthesis?.cancel();
      master.gain.cancelScheduledValues(context.currentTime);
      master.gain.exponentialRampToValueAtTime(muted ? 0.0001 : 0.22, context.currentTime + 0.35);
    },
    stop() {
      window.speechSynthesis?.cancel();
      const now = context.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
      window.setTimeout(() => {
        nodes.forEach((node) => { try { node.stop(); } catch { /* already stopped */ } });
        context.close().catch(() => {});
      }, 500);
    },
  };
}
