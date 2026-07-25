// ─────────────────────────────────────────────────────────────────
// KRYPTON AI CORE · voice layer
// Mic analyser (sound-reactive orb), speech recognition with wake
// word "Hey Krypton", and a TTS persona that follows the site
// language (id default, en optional). All rule-based, on-device.
// ─────────────────────────────────────────────────────────────────

const SR = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

export const voiceSupport = {
  recognition: !!SR,
  synthesis: typeof window !== 'undefined' && 'speechSynthesis' in window,
};

// ── microphone → analyser (drives the spectrum ring) ─────────────
export function createMicAnalyser() {
  let ctx = null;
  let analyser = null;
  let stream = null;
  let bins = null;
  let enabled = false;

  async function enable() {
    if (enabled) return true;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
      if (ctx.state === 'suspended') await ctx.resume().catch(() => {});
      const src = ctx.createMediaStreamSource(stream);
      analyser = ctx.createAnalyser();
      analyser.fftSize = 256;           // 128 bins
      analyser.smoothingTimeConstant = 0.55;
      src.connect(analyser);
      bins = new Uint8Array(analyser.frequencyBinCount);
      enabled = true;
      return true;
    } catch {
      enabled = false;
      return false;
    }
  }

  function getData() {
    if (!enabled || !analyser) return null;
    analyser.getByteFrequencyData(bins);
    // rms-ish level from mid bins
    let sum = 0;
    const from = 2, to = Math.min(64, bins.length);
    for (let i = from; i < to; i++) sum += bins[i] * bins[i];
    const rms = Math.sqrt(sum / (to - from)) / 255;
    const level = Math.max(0, rms - 0.05) * 1.6;
    return { level: Math.min(1, level), bins };
  }

  function disable() {
    try { stream?.getTracks().forEach((t) => t.stop()); } catch { /* noop */ }
    try { ctx?.close(); } catch { /* noop */ }
    ctx = null; analyser = null; stream = null; enabled = false;
  }

  return { enable, disable, getData, get enabled() { return enabled; } };
}

// ── TTS persona ──────────────────────────────────────────────────
// Curates the most natural available voice per language and speaks
// with a calm, confident cadence. (Phase 2: server-side neural TTS.)
export function createSpeech(getLang) {
  if (!voiceSupport.synthesis) {
    return { speak: (_t, o) => { o?.onend?.(); }, cancel: () => {}, supported: false };
  }
  const synth = window.speechSynthesis;
  let voices = [];
  const refresh = () => { voices = synth.getVoices(); };
  refresh();
  synth.onvoiceschanged = refresh;

  const pick = (lang) => {
    const want = lang === 'id' ? 'id' : 'en';
    const pool = voices.filter((v) => v.lang?.toLowerCase().startsWith(want));
    const score = (v) => {
      const n = (v.name || '').toLowerCase();
      let s = 0;
      if (/natural|neural|online/.test(n)) s += 5;
      if (/google/.test(n)) s += 4;
      if (/damayanti|ardi|gadis/.test(n)) s += 4;           // id voices (apple)
      if (/aria|jenny|samantha|ava|allison/.test(n)) s += 3; // en voices
      if (v.localService === false) s += 1;                  // cloud voices usually richer
      return s;
    };
    return pool.sort((a, b) => score(b) - score(a))[0] || voices[0] || null;
  };

  function speak(text, { onstart, onend } = {}) {
    try { synth.cancel(); } catch { /* noop */ }
    const lang = getLang();
    const u = new SpeechSynthesisUtterance(String(text).replace(/[◈✓▶"']/g, ''));
    const v = pick(lang);
    if (v) u.voice = v;
    u.lang = lang === 'id' ? 'id-ID' : 'en-US';
    u.rate = lang === 'id' ? 1.0 : 1.03;
    u.pitch = 1.0;
    u.volume = 0.95;
    let started = false;
    u.onstart = () => { started = true; onstart?.(); };
    u.onend = () => onend?.();
    u.onerror = () => onend?.();
    // safety: some engines never fire events
    setTimeout(() => { if (!started) onstart?.(); }, 350);
    try { synth.speak(u); } catch { onend?.(); }
  }

  return { speak, cancel: () => { try { synth.cancel(); } catch { /* noop */ } }, supported: true };
}

// ── active speech recognition (push-to-talk) ─────────────────────
export function createRecognizer(getLang, handlers = {}) {
  if (!SR) return { start: () => false, stop: () => {}, supported: false, get active() { return false; } };
  let rec = null;
  let active = false;

  function build() {
    rec = new SR();
    rec.lang = getLang() === 'id' ? 'id-ID' : 'en-US';
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;
    rec.onstart = () => { active = true; handlers.onstate?.(true); };
    rec.onresult = (e) => {
      let txt = '';
      for (const r of e.results) txt += r[0].transcript;
      handlers.onpartial?.(txt);
      if (e.results[e.results.length - 1].isFinal) handlers.onfinal?.(txt.trim());
    };
    rec.onerror = () => { active = false; handlers.onstate?.(false); };
    rec.onend = () => { active = false; handlers.onstate?.(false); };
  }

  return {
    start() {
      build();
      try { rec.start(); return true; } catch { return false; }
    },
    stop() { try { rec?.stop(); } catch { /* noop */ } },
    supported: true,
    get active() { return active; },
  };
}

// ── wake word ("hey krypton" / "krypton" / "kripton") ────────────
export function createWakeWord(getLang, onWake) {
  if (!SR) return { setEnabled: () => {}, supported: false };
  let rec = null;
  let want = false;
  let running = false;
  let backoff = 400;

  const WAKE = /\b(hey|hai|halo|oke|ok)?\s*(krypton|kripton|crypton)\b/i;

  function build() {
    rec = new SR();
    rec.lang = getLang() === 'id' ? 'id-ID' : 'en-US';
    rec.interimResults = true;
    rec.continuous = true;
    rec.onresult = (e) => {
      const last = e.results[e.results.length - 1];
      const t = last[0].transcript || '';
      if (WAKE.test(t)) {
        stop();
        onWake?.();
      }
    };
    rec.onend = () => {
      running = false;
      if (want) setTimeout(() => start(), backoff);
    };
    rec.onerror = (e) => {
      running = false;
      if (e?.error === 'not-allowed' || e?.error === 'service-not-allowed') want = false;
      else backoff = Math.min(5000, backoff * 1.6);
    };
  }

  function start() {
    if (running || !want) return;
    build();
    try { rec.start(); running = true; backoff = 400; } catch { running = false; }
  }
  function stop() { try { rec?.stop(); } catch { /* noop */ } running = false; }

  return {
    setEnabled(v) { want = !!v; if (v) start(); else stop(); },
    supported: true,
  };
}
