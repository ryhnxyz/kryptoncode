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

  return {
    enable, disable, getData,
    get enabled() { return enabled; },
    get stream() { return stream; },
  };
}

// A tiny truly-silent WAV — played unmuted inside a user gesture, it unlocks
// the <audio> element so later programmatic playback is allowed.
function silentWavDataUri() {
  const sr = 8000, n = 400;
  const buf = new ArrayBuffer(44 + n * 2);
  const dv = new DataView(buf);
  const ws = (o, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)); };
  ws(0, 'RIFF'); dv.setUint32(4, 36 + n * 2, true); ws(8, 'WAVE'); ws(12, 'fmt ');
  dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
  dv.setUint32(24, sr, true); dv.setUint32(28, sr * 2, true); dv.setUint16(32, 2, true);
  dv.setUint16(34, 16, true); ws(36, 'data'); dv.setUint32(40, n * 2, true);
  let bin = ''; const u8 = new Uint8Array(buf);
  for (let i = 0; i < u8.length; i++) bin += String.fromCharCode(u8[i]);
  return 'data:audio/wav;base64,' + btoa(bin);
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

// ── natural neural voice (self-hosted TTS via backend) ───────────
// Plays MP3 streamed from /api/core/voice. Falls back to browser TTS
// if playback fails (autoplay blocked, offline, etc.).
export function createNaturalSpeech(getLang, apiBase) {
  const base = (apiBase || 'https://api.kryptoncode.xyz').replace(/\/+$/, '');
  const fallback = createSpeech(getLang);
  let audio = null;
  let unlocked = false;
  let curUrl = null;

  function ensureAudio() {
    if (!audio) {
      audio = new Audio();
      audio.preload = 'auto';
      audio.playsInline = true;
      audio.setAttribute('playsinline', '');
    }
    return audio;
  }

  // Call once from a real user gesture (click / key / tap). After this the
  // element is "unlocked" so later programmatic playback — wake word replies,
  // streamed chat answers — is allowed by the browser autoplay policy.
  function unlock() {
    if (unlocked) return;
    const a = ensureAudio();
    try {
      a.muted = false;
      a.src = silentWavDataUri();
      const p = a.play();
      const ok = () => { unlocked = true; try { a.pause(); a.currentTime = 0; } catch { /* noop */ } };
      if (p && p.then) p.then(ok).catch(() => { /* will retry on next gesture */ });
      else ok();
    } catch { /* noop */ }
  }

  // ── sequential clip queue (enables sentence-streamed speech) ──────
  let queue = [];
  let playing = false;
  let streamEnded = true;
  let started = false;
  let sess = 0;               // bumped on cancel/new stream to void stale work
  let cbStart = null;
  let cbEnd = null;

  function revoke() { if (curUrl) { try { URL.revokeObjectURL(curUrl); } catch { /* noop */ } curUrl = null; } }
  function finishSession() { started = false; playing = false; cbStart = null; cbEnd = null; }

  function onClipEnd(mySess) {
    if (mySess !== sess) return;
    revoke();
    if (queue.length) { fetchAndPlay(queue.shift(), mySess); }
    else { playing = false; if (streamEnded) { const cb = cbEnd; finishSession(); cb && cb(); } }
  }

  function fetchAndPlay(text, mySess) {
    const lang = getLang() === 'en' ? 'en' : 'id';
    const clean = String(text).replace(/[◈✓▶]/g, '').trim().slice(0, 500);
    if (!clean) { onClipEnd(mySess); return; }
    const a = ensureAudio();
    const fireStart = () => { if (mySess === sess && !started) { started = true; cbStart && cbStart(); } };
    a.onplaying = fireStart;
    a.onended = () => onClipEnd(mySess);
    a.onerror = () => {
      if (mySess !== sess) return;
      // one chunk failed → speak it with browser TTS, then continue the queue
      fallback.speak(clean, { onstart: fireStart, onend: () => onClipEnd(mySess) });
    };
    const url = `${base}/api/core/voice?lang=${encodeURIComponent(lang)}&text=${encodeURIComponent(clean)}`;
    fetch(url)
      .then((res) => { if (!res.ok) throw new Error('tts ' + res.status); return res.blob(); })
      .then((blob) => {
        if (mySess !== sess) return;
        revoke();
        curUrl = URL.createObjectURL(blob);
        a.muted = false;
        a.src = curUrl;
        const p = a.play();
        if (p && p.catch) p.catch(() => { if (mySess === sess && a.onerror) a.onerror(); });
      })
      .catch(() => { if (mySess === sess && a.onerror) a.onerror(); });
  }

  function beginStream({ onstart, onend } = {}) {
    sess += 1;
    queue = []; started = false; playing = false; streamEnded = false;
    cbStart = onstart || null; cbEnd = onend || null;
  }
  function feed(text) {
    const t = String(text || '').trim();
    if (!t || streamEnded) return;
    queue.push(t);
    if (!playing) { playing = true; fetchAndPlay(queue.shift(), sess); }
  }
  function endStream() {
    streamEnded = true;
    if (!playing && !queue.length) { const cb = cbEnd; finishSession(); cb && cb(); }
  }
  function speak(text, opts = {}) {
    beginStream(opts);
    const t = String(text || '').trim();
    if (t) feed(t);
    endStream();
  }

  function cancel() {
    sess += 1;                 // invalidate pending fetches + callbacks
    queue = []; playing = false; started = false; streamEnded = true; cbStart = null; cbEnd = null;
    try { if (audio) { audio.pause(); audio.removeAttribute('src'); audio.load(); } } catch { /* noop */ }
    revoke();
    fallback.cancel();
  }

  return { speak, beginStream, feed, endStream, cancel, unlock, isSpeaking: () => playing, supported: true };
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

// ── server-side voice capture (MediaRecorder → Whisper) ──────────
// Reliable, browser-agnostic replacement for Web Speech capture.
// Reuses the mic analyser's stream + levels for voice-activity detection,
// records until a natural pause, then POSTs the clip to /api/core/stt.
export function createVoiceCapture(mic, getLang, apiBase) {
  const base = (apiBase || 'https://api.kryptoncode.xyz').replace(/\/+$/, '');
  const supported = typeof window !== 'undefined' && typeof window.MediaRecorder !== 'undefined';
  let recorder = null;
  let chunks = [];
  let vad = null;
  let active = false;
  let aborted = false;
  let onResult = null;
  let onPhase = null;

  const START = 0.06;         // level to count as speech
  const STOP = 0.035;         // level considered silence
  const SILENCE_MS = 900;     // trailing silence to end a turn
  const MAX_MS = 9000;        // hard cap
  const NOSPEECH_MS = 6000;   // give up if nothing spoken

  function pickMime() {
    const opts = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
    for (const m of opts) { try { if (window.MediaRecorder.isTypeSupported(m)) return m; } catch { /* noop */ } }
    return '';
  }

  function start(cb, phaseCb) {
    if (active || !supported) return false;
    const stream = mic && mic.stream;
    if (!stream) return false;
    onResult = cb; onPhase = phaseCb || null;
    chunks = []; aborted = false; active = true;
    const mime = pickMime();
    try { recorder = mime ? new window.MediaRecorder(stream, { mimeType: mime }) : new window.MediaRecorder(stream); }
    catch { active = false; return false; }
    recorder.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
    recorder.onstop = finalize;
    try { recorder.start(120); } catch { active = false; return false; }

    const t0 = performance.now();
    let speechStart = 0;
    let lastLoud = 0;
    vad = setInterval(() => {
      const d = mic.getData && mic.getData();
      const lvl = d ? d.level : 0;
      const now = performance.now();
      if (lvl > START) { if (!speechStart) speechStart = now; lastLoud = now; }
      if (!speechStart) { if (now - t0 > NOSPEECH_MS) stop(true); return; }
      if (now - t0 > MAX_MS) { stop(false); return; }
      if (lvl < STOP && now - lastLoud > SILENCE_MS) stop(false);
    }, 60);
    return true;
  }

  function stop(abort) {
    if (!active) return;
    aborted = !!abort;
    if (vad) { clearInterval(vad); vad = null; }
    try {
      if (recorder && recorder.state !== 'inactive') recorder.stop();
      else finalize();
    } catch { finalize(); }
  }

  async function finalize() {
    if (!active) return;
    active = false;
    const cb = onResult; onResult = null;
    if (aborted || !chunks.length) { cb && cb(null); return; }
    const blob = new Blob(chunks, { type: (recorder && recorder.mimeType) || 'audio/webm' });
    chunks = [];
    if (blob.size < 1400) { cb && cb(null); return; } // too short to be speech
    onPhase && onPhase('transcribing');
    try {
      const res = await fetch(`${base}/api/core/stt?lang=${encodeURIComponent(getLang())}`, {
        method: 'POST',
        headers: { 'Content-Type': blob.type || 'audio/webm' },
        body: blob,
      });
      const j = await res.json();
      cb && cb(((j && j.text) || '').trim());
    } catch { cb && cb(null); }
  }

  return { start, stop, get active() { return active; }, supported };
}
