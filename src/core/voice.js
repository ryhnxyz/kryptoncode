// ─────────────────────────────────────────────────────────────────
// KRYPTON AI CORE · voice layer
// Mic analyser (sound-reactive orb), speech recognition with wake
// word "Hey Krypton", and a TTS persona that follows the site
// language (id default, en optional). All rule-based, on-device.
// ─────────────────────────────────────────────────────────────────
import { createRealtimeSpeech } from './realtimeVoice.js';

const SR = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

// Pure proximity classifier, exported so the acoustic gate can be regression-tested.
export function classifyNearFieldVoice({ rms = 0, peak = 0, noiseFloor = 0.006, voiceRatio = 0 } = {}) {
  const floor = Math.max(0.002, noiseFloor);
  const snr = rms / floor;
  const requiredRms = Math.max(0.018, floor * 3.2);
  const requiredPeak = Math.max(0.055, floor * 5);
  const near = rms >= requiredRms && peak >= requiredPeak && snr >= 3 && voiceRatio >= 0.38;
  const score = Math.min(1, Math.max(0, (rms / requiredRms - 0.65) * 0.65 + (voiceRatio - 0.25)));
  return { near, score, snr, requiredRms, requiredPeak };
}

// ── microphone → near-field speech analyser ──────────────────────
export function createMicAnalyser() {
  let ctx = null;
  let analyser = null;
  let sourceStream = null;
  let stream = null;
  let bins = null;
  let wave = null;
  let enabled = false;
  let enabling = null;
  let enableSession = 0;
  let noiseFloor = 0.006;

  const hasLiveTrack = (candidate = stream) => {
    const tracks = candidate?.getAudioTracks?.() || [];
    return tracks.some((track) => track.readyState === 'live' && track.enabled !== false);
  };

  async function enable() {
    if (enabled && hasLiveTrack()) return true;
    if (enabling) return enabling;
    const session = ++enableSession;
    enabling = (async () => {
      if (enabled || stream || sourceStream) disable(false);
      let nextSourceStream = null;
      let nextProcessedStream = null;
      let nextCtx = null;
      try {
        const supported = navigator.mediaDevices.getSupportedConstraints?.() || {};
        const audio = {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false,
          channelCount: { ideal: 1 },
          sampleRate: { ideal: 16000 },
        };
        if (supported.voiceIsolation) audio.voiceIsolation = true;
        nextSourceStream = await navigator.mediaDevices.getUserMedia({ audio });
        if (session !== enableSession || !hasLiveTrack(nextSourceStream)) throw new Error('microphone stream is not live');

        // Ask the browser again at track level; unsupported constraints are ignored.
        const inputTrack = nextSourceStream.getAudioTracks()[0];
        await inputTrack?.applyConstraints?.({
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false,
          ...(supported.voiceIsolation ? { voiceIsolation: true } : {}),
        }).catch(() => {});

        const AC = window.AudioContext || window.webkitAudioContext;
        nextCtx = new AC();
        if (nextCtx.state === 'suspended') await nextCtx.resume().catch(() => {});
        if (session !== enableSession) throw new Error('stale microphone session');

        const src = nextCtx.createMediaStreamSource(nextSourceStream);
        const highpass = nextCtx.createBiquadFilter();
        highpass.type = 'highpass';
        highpass.frequency.value = 90;
        highpass.Q.value = 0.7;
        const lowpass = nextCtx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.value = 3800;
        lowpass.Q.value = 0.7;
        const compressor = nextCtx.createDynamicsCompressor();
        compressor.threshold.value = -34;
        compressor.knee.value = 8;
        compressor.ratio.value = 3;
        compressor.attack.value = 0.006;
        compressor.release.value = 0.12;
        const nextAnalyser = nextCtx.createAnalyser();
        nextAnalyser.fftSize = 512;
        nextAnalyser.smoothingTimeConstant = 0.42;
        const destination = nextCtx.createMediaStreamDestination();

        src.connect(highpass);
        highpass.connect(lowpass);
        // Proximity detection must observe the uncompressed signal; otherwise a
        // compressor would amplify distant voices and defeat the distance gate.
        lowpass.connect(nextAnalyser);
        lowpass.connect(compressor);
        compressor.connect(destination);
        nextProcessedStream = destination.stream;
        if (!hasLiveTrack(nextProcessedStream)) throw new Error('processed microphone stream is not live');

        sourceStream = nextSourceStream;
        stream = nextProcessedStream;
        ctx = nextCtx;
        analyser = nextAnalyser;
        bins = new Uint8Array(analyser.frequencyBinCount);
        wave = new Uint8Array(analyser.fftSize);
        noiseFloor = 0.006;
        enabled = true;
        return true;
      } catch {
        try { nextSourceStream?.getTracks().forEach((track) => track.stop()); } catch { /* noop */ }
        try { nextProcessedStream?.getTracks().forEach((track) => track.stop()); } catch { /* noop */ }
        try { nextCtx?.close(); } catch { /* noop */ }
        if (session === enableSession) enabled = false;
        return false;
      }
    })();
    try { return await enabling; }
    finally { if (session === enableSession) enabling = null; }
  }

  function getData() {
    if (!enabled || !analyser || !hasLiveTrack()) return null;
    analyser.getByteFrequencyData(bins);
    analyser.getByteTimeDomainData(wave);

    let squareSum = 0;
    let peak = 0;
    for (let i = 0; i < wave.length; i++) {
      const value = (wave[i] - 128) / 128;
      squareSum += value * value;
      peak = Math.max(peak, Math.abs(value));
    }
    const rms = Math.sqrt(squareSum / wave.length);

    const hzPerBin = ctx.sampleRate / analyser.fftSize;
    let totalEnergy = 0;
    let voiceEnergy = 0;
    for (let i = 1; i < bins.length; i++) {
      const hz = i * hzPerBin;
      const energy = bins[i] * bins[i];
      if (hz >= 80 && hz <= 3800) totalEnergy += energy;
      if (hz >= 180 && hz <= 2200) voiceEnergy += energy;
    }
    const voiceRatio = totalEnergy > 0 ? voiceEnergy / totalEnergy : 0;
    const gate = classifyNearFieldVoice({ rms, peak, noiseFloor, voiceRatio });

    // Learn room noise slowly only while a near-field voice is absent.
    if (!gate.near && rms < Math.max(0.04, noiseFloor * 3)) {
      noiseFloor = Math.min(0.04, Math.max(0.002, noiseFloor * 0.97 + rms * 0.03));
    }
    const level = Math.min(1, Math.max(0, (rms - noiseFloor * 1.15) * 9));
    return {
      level,
      bins,
      rms,
      peak,
      noiseFloor,
      voiceRatio,
      nearVoice: gate.near,
      proximity: gate.score,
      snr: gate.snr,
    };
  }

  function disable(invalidate = true) {
    if (invalidate) enableSession += 1;
    try { stream?.getTracks().forEach((track) => track.stop()); } catch { /* noop */ }
    try { sourceStream?.getTracks().forEach((track) => track.stop()); } catch { /* noop */ }
    try { ctx?.close(); } catch { /* noop */ }
    ctx = null;
    analyser = null;
    sourceStream = null;
    stream = null;
    bins = null;
    wave = null;
    enabled = false;
    noiseFloor = 0.006;
    if (invalidate) enabling = null;
  }

  return {
    enable, disable, getData,
    get enabled() { return enabled && hasLiveTrack(); },
    get stream() { return stream; },
  };
}

// ── realtime neural voice (WebSocket PCM → AudioWorklet) ──────────
// Krypton Core no longer downloads or plays MP3 in the browser.
export function createNaturalSpeech(getLang, apiBase) {
  return createRealtimeSpeech(getLang, apiBase);
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
  let sessionId = 0;
  let current = null;

  const START_SUSTAIN_MS = 180; // reject distant voices and one-off noise spikes
  const SILENCE_MS = 480;       // fast turn-end without clipping normal phrasing
  const MAX_MS = 9000;          // hard cap
  const NOSPEECH_MS = 6000;     // give up if no near-field voice is detected

  const hasLiveAudioTrack = (stream) => {
    const tracks = stream?.getAudioTracks?.() || [];
    return tracks.some((track) => track.readyState === 'live' && track.enabled !== false);
  };

  function pickMime() {
    const opts = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
    for (const m of opts) { try { if (window.MediaRecorder.isTypeSupported(m)) return m; } catch { /* noop */ } }
    return '';
  }

  function clearVad(session) {
    if (session.vad) clearInterval(session.vad);
    session.vad = null;
  }

  function deliver(session, value) {
    if (session.delivered) return;
    session.delivered = true;
    clearVad(session);
    if (session.fetchAbort) session.fetchAbort = null;
    if (current === session) current = null;
    const cb = session.onResult;
    session.onResult = null;
    session.onPhase = null;
    cb?.(value);
  }

  function abortSession(session) {
    if (!session || session.delivered) return;
    session.aborted = true;
    clearVad(session);
    try { session.fetchAbort?.abort(); } catch { /* noop */ }
    session.fetchAbort = null;
    if (session.recording && !session.stopping) {
      session.stopping = true;
      try { if (session.recorder.state !== 'inactive') session.recorder.stop(); } catch { /* noop */ }
      session.recording = false;
    }
    deliver(session, null);
  }

  function start(cb, phaseCb) {
    if (!supported || current?.recording) return false;
    // A newer recording owns the callback lane and invalidates stale STT work.
    if (current) abortSession(current);
    const stream = mic?.stream;
    if (!hasLiveAudioTrack(stream)) return false;

    const session = {
      id: ++sessionId,
      stream,
      recorder: null,
      chunks: [],
      vad: null,
      fetchAbort: null,
      onResult: cb,
      onPhase: phaseCb || null,
      recording: false,
      stopping: false,
      finalizing: false,
      aborted: false,
      delivered: false,
    };
    const mime = pickMime();
    try {
      session.recorder = mime ? new window.MediaRecorder(stream, { mimeType: mime }) : new window.MediaRecorder(stream);
    } catch { return false; }
    session.recorder.ondataavailable = (event) => {
      if (!session.delivered && event.data?.size) session.chunks.push(event.data);
    };
    session.recorder.onstop = () => finalize(session);
    session.recorder.onerror = () => abortSession(session);
    try {
      session.recorder.start(120);
      session.recording = true;
      current = session;
    } catch {
      session.recorder.ondataavailable = null;
      session.recorder.onstop = null;
      session.recorder.onerror = null;
      return false;
    }

    const t0 = performance.now();
    let nearSince = 0;
    let speechStart = 0;
    let lastVoice = 0;
    session.vad = setInterval(() => {
      if (current !== session || session.delivered) { clearVad(session); return; }
      if (!hasLiveAudioTrack(stream)) { abortSession(session); return; }
      const data = mic?.getData?.();
      const now = performance.now();

      if (!speechStart) {
        if (data?.nearVoice) {
          if (!nearSince) nearSince = now;
          if (now - nearSince >= START_SUSTAIN_MS) {
            speechStart = nearSince;
            lastVoice = now;
          }
        } else {
          nearSince = 0;
        }
        if (!speechStart && now - t0 > NOSPEECH_MS) stop(true);
        return;
      }

      // Once a close speaker starts the turn, allow natural syllable dips while
      // still rejecting low-SNR background conversation from extending it.
      const continuingVoice = data?.nearVoice || (
        data &&
        data.rms >= Math.max(0.012, data.noiseFloor * 2.1) &&
        data.voiceRatio >= 0.28
      );
      if (continuingVoice) lastVoice = now;
      if (now - t0 > MAX_MS) { stop(false); return; }
      if (now - lastVoice > SILENCE_MS) stop(false);
    }, 45);
    return true;
  }

  function stop(abort = false) {
    const session = current;
    if (!session || session.delivered) return;
    if (abort) {
      sessionId += 1;
      abortSession(session);
      return;
    }
    if (!session.recording || session.stopping) return;
    clearVad(session);
    session.stopping = true;
    try {
      if (session.recorder.state !== 'inactive') session.recorder.stop();
      else finalize(session);
    } catch { finalize(session); }
  }

  async function finalize(session) {
    if (session.finalizing || session.delivered) return;
    session.finalizing = true;
    session.recording = false;
    clearVad(session);
    if (session.aborted || session.id !== sessionId || current !== session || !session.chunks.length) {
      deliver(session, null);
      return;
    }
    const blob = new Blob(session.chunks, { type: session.recorder?.mimeType || 'audio/webm' });
    session.chunks = [];
    if (blob.size < 1400) { deliver(session, null); return; } // too short to be speech
    session.onPhase?.('transcribing');
    if (session.delivered || session.aborted || session.id !== sessionId || current !== session) return;
    const fetchAbort = new AbortController();
    session.fetchAbort = fetchAbort;
    try {
      const res = await fetch(`${base}/api/core/stt?lang=${encodeURIComponent(getLang())}`, {
        method: 'POST',
        headers: { 'Content-Type': blob.type || 'audio/webm' },
        body: blob,
        signal: fetchAbort.signal,
      });
      if (!res.ok) throw new Error(`stt HTTP ${res.status}`);
      const json = await res.json();
      if (session.delivered || session.aborted || session.id !== sessionId || current !== session || fetchAbort.signal.aborted) return;
      deliver(session, String(json?.text || '').trim());
    } catch {
      if (!session.delivered) deliver(session, null);
    } finally {
      if (session.fetchAbort === fetchAbort) session.fetchAbort = null;
    }
  }

  function cancel() {
    sessionId += 1;
    abortSession(current);
  }

  return { start, stop, cancel, get active() { return !!current?.recording; }, supported };
}
