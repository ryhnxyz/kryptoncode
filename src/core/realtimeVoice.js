const PROTOCOL_VERSION = 1;
const FORMAT = 'pcm_s16le';
const WORKLET_URL = '/krypton-pcm-worklet.js';
const HIGH_BUFFER_MS = 1500;
const LOW_BUFFER_MS = 700;

function socketUrl(apiBase) {
  const url = new URL(apiBase || 'https://api.kryptoncode.xyz');
  url.protocol = url.protocol === 'http:' ? 'ws:' : 'wss:';
  url.pathname = '/api/core/voice-stream';
  url.search = '';
  url.hash = '';
  return url.toString();
}

function sessionId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `voice_${crypto.randomUUID().replace(/-/g, '')}`;
  }
  return `voice_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
}

function cleanSpeechText(text) {
  return String(text || '')
    .replace(/[*_#`>~]/g, '')
    .replace(/^\s*[-•]\s*/gm, '')
    .replace(/[◈✓▶]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500);
}

export function createRealtimeSpeech(getLang, apiBase) {
  const url = socketUrl(apiBase);
  let socket = null;
  let connectPromise = null;
  let audioContext = null;
  let workletNode = null;
  let workletPromise = null;
  let current = null;
  let tokenCounter = Math.floor(Math.random() * 0xffff) || 1;
  let heartbeat = null;
  let destroyed = false;

  function send(payload) {
    if (!socket || socket.readyState !== WebSocket.OPEN) throw new Error('voice socket unavailable');
    socket.send(JSON.stringify(payload));
  }

  function stopHeartbeat() {
    clearInterval(heartbeat);
    heartbeat = null;
  }

  function startHeartbeat() {
    stopHeartbeat();
    heartbeat = setInterval(() => {
      if (socket?.readyState === WebSocket.OPEN) {
        try { send({ type: 'ping' }); } catch { /* reconnect on demand */ }
      }
    }, 20_000);
  }

  function failSession(reason) {
    const session = current;
    if (!session || session.failed) return;
    session.failed = true;
    try {
      if (session.startedOnServer && socket?.readyState === WebSocket.OPEN) {
        send({ type: 'cancel', sessionId: session.id });
      }
    } catch { /* noop */ }
    try { workletNode?.port.postMessage({ type: 'cancel' }); } catch { /* noop */ }
    current = null;
    session.onerror?.(reason);
  }

  function closeSocket() {
    stopHeartbeat();
    const active = socket;
    socket = null;
    connectPromise = null;
    if (active && active.readyState <= WebSocket.OPEN) {
      try { active.close(1000, 'client reset'); } catch { /* noop */ }
    }
  }

  function handleControl(message) {
    if (!message || typeof message !== 'object') return;
    if (message.type === 'session_done') {
      const session = current;
      if (!session || message.sessionId !== session.id || message.token !== session.token) return;
      session.serverDone = true;
      workletNode?.port.postMessage({ type: 'end', token: session.token });
      return;
    }
    if (message.type === 'error') {
      const session = current;
      if (!session || !message.sessionId || message.sessionId === session.id) {
        failSession(message.code || 'voice server error');
      }
      return;
    }
    if (message.type === 'cancelled') {
      const session = current;
      if (session && message.sessionId === session.id && message.reason !== 'client_cancel') {
        failSession(message.reason || 'voice cancelled');
      }
    }
  }

  function handleBinary(data) {
    if (!(data instanceof ArrayBuffer) || data.byteLength < 12) return;
    const view = new DataView(data);
    const version = view.getUint8(0);
    const type = view.getUint8(1);
    const token = view.getUint16(2, false);
    const sequence = view.getUint32(4, false);
    const payloadBytes = view.getUint32(8, false);
    const session = current;
    if (!session || session.failed || version !== PROTOCOL_VERSION || type !== 1 || token !== session.token) return;
    if (payloadBytes !== data.byteLength - 12 || payloadBytes % 2 !== 0) {
      failSession('bad audio frame');
      return;
    }
    if (sequence !== session.expectedFrame) {
      failSession('audio sequence mismatch');
      return;
    }
    session.expectedFrame += 1;
    const payload = data.slice(12);
    workletNode?.port.postMessage({ type: 'pcm', token: session.token, buffer: payload }, [payload]);
  }

  function bindSocket(nextSocket, resolveReady, rejectReady) {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      rejectReady(new Error('voice websocket timeout'));
      try { nextSocket.close(); } catch { /* noop */ }
    }, 5000);

    nextSocket.binaryType = 'arraybuffer';
    nextSocket.onopen = () => {
      try {
        nextSocket.send(JSON.stringify({
          type: 'hello',
          version: PROTOCOL_VERSION,
          formats: [FORMAT],
        }));
      } catch (error) {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          rejectReady(error);
        }
      }
    };
    nextSocket.onmessage = (event) => {
      if (event.data instanceof ArrayBuffer) {
        handleBinary(event.data);
        return;
      }
      let message;
      try { message = JSON.parse(String(event.data)); }
      catch { return; }
      if (message.type === 'ready') {
        if (
          settled ||
          message.version !== PROTOCOL_VERSION ||
          message.format !== FORMAT ||
          Number(message.sampleRate) !== 24_000 ||
          Number(message.channels) !== 1
        ) {
          if (!settled) rejectReady(new Error('unsupported voice protocol'));
          settled = true;
          clearTimeout(timer);
          return;
        }
        settled = true;
        clearTimeout(timer);
        startHeartbeat();
        resolveReady();
        return;
      }
      handleControl(message);
    };
    nextSocket.onerror = () => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        rejectReady(new Error('voice websocket failed'));
      }
    };
    nextSocket.onclose = () => {
      if (socket === nextSocket) {
        socket = null;
        connectPromise = null;
        stopHeartbeat();
      }
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        rejectReady(new Error('voice websocket closed'));
      }
      if (current) failSession('voice connection closed');
    };
  }

  function ensureSocket() {
    if (destroyed) return Promise.reject(new Error('voice client destroyed'));
    if (socket?.readyState === WebSocket.OPEN && connectPromise) return connectPromise;
    if (connectPromise) return connectPromise;
    connectPromise = new Promise((resolve, reject) => {
      const nextSocket = new WebSocket(url);
      socket = nextSocket;
      bindSocket(nextSocket, resolve, reject);
    }).catch((error) => {
      closeSocket();
      throw error;
    });
    return connectPromise;
  }

  async function ensureAudioGraph() {
    if (destroyed) throw new Error('voice client destroyed');
    if (!audioContext) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass || !window.AudioWorkletNode) throw new Error('AudioWorklet unsupported');
      audioContext = new AudioContextClass({ latencyHint: 'interactive', sampleRate: 24_000 });
    }
    if (audioContext.state === 'suspended') await audioContext.resume();
    if (!workletPromise) {
      workletPromise = audioContext.audioWorklet.addModule(WORKLET_URL).then(() => {
        workletNode = new window.AudioWorkletNode(audioContext, 'krypton-pcm-ring', {
          numberOfInputs: 0,
          numberOfOutputs: 1,
          outputChannelCount: [1],
          processorOptions: { capacitySeconds: 4, sourceSampleRate: 24_000 },
        });
        workletNode.port.onmessage = (event) => {
          const message = event.data || {};
          const session = current;
          if (!session || Number(message.token) !== session.token) return;
          if (message.type === 'started' && !session.started) {
            session.started = true;
            session.onstart?.();
            return;
          }
          if (message.type === 'drained' && session.serverDone) {
            current = null;
            session.onend?.();
            return;
          }
          if (message.type === 'overflow') {
            failSession('audio buffer overflow');
            return;
          }
          if (message.type === 'buffer' && session.startedOnServer && socket?.readyState === WebSocket.OPEN) {
            const bufferedMs = Number(message.bufferedMs) || 0;
            if (!session.flowPaused && bufferedMs >= HIGH_BUFFER_MS) {
              session.flowPaused = true;
              try { send({ type: 'flow', sessionId: session.id, paused: true, bufferedMs }); } catch { /* noop */ }
            } else if (session.flowPaused && bufferedMs <= LOW_BUFFER_MS) {
              session.flowPaused = false;
              try { send({ type: 'flow', sessionId: session.id, paused: false, bufferedMs }); } catch { /* noop */ }
            }
          }
        };
        workletNode.connect(audioContext.destination);
      });
    }
    await workletPromise;
  }

  async function ensureTransport() {
    await Promise.all([ensureAudioGraph(), ensureSocket()]);
  }

  async function unlock() {
    try { await ensureTransport(); }
    catch { /* the active turn reports failure if voice is requested */ }
  }

  function beginStream({ onstart, onend, onerror } = {}) {
    cancel();
    tokenCounter = (tokenCounter + 1) & 0xffff;
    if (!tokenCounter) tokenCounter = 1;
    const session = {
      id: sessionId(),
      token: tokenCounter,
      sequence: 0,
      expectedFrame: 0,
      sendChain: Promise.resolve(),
      startedOnServer: false,
      streamEnded: false,
      started: false,
      serverDone: false,
      failed: false,
      flowPaused: false,
      onstart: onstart || null,
      onend: onend || null,
      onerror: onerror || null,
    };
    current = session;
    try { workletNode?.port.postMessage({ type: 'reset', token: session.token, sourceSampleRate: 24_000 }); }
    catch { /* graph may still be loading */ }

    session.sendChain = ensureTransport().then(() => {
      if (current !== session || session.failed) throw new Error('voice session cancelled');
      workletNode.port.postMessage({ type: 'reset', token: session.token, sourceSampleRate: 24_000 });
      send({ type: 'start', sessionId: session.id, token: session.token, lang: getLang() === 'en' ? 'en' : 'id' });
      session.startedOnServer = true;
    }).catch((error) => {
      if (current === session) failSession(error instanceof Error ? error.message : 'voice start failed');
    });
  }

  function feed(text) {
    const session = current;
    const clean = cleanSpeechText(text);
    if (!session || session.failed || session.streamEnded || !clean) return;
    const sequence = session.sequence++;
    session.sendChain = session.sendChain.then(() => {
      if (current !== session || session.failed) throw new Error('voice session cancelled');
      send({ type: 'segment', sessionId: session.id, seq: sequence, text: clean });
    }).catch((error) => {
      if (current === session) failSession(error instanceof Error ? error.message : 'voice segment failed');
    });
  }

  function endStream() {
    const session = current;
    if (!session || session.failed || session.streamEnded) return;
    session.streamEnded = true;
    session.sendChain = session.sendChain.then(() => {
      if (current !== session || session.failed) throw new Error('voice session cancelled');
      send({ type: 'end', sessionId: session.id });
    }).catch((error) => {
      if (current === session) failSession(error instanceof Error ? error.message : 'voice end failed');
    });
  }

  function speak(text, options = {}) {
    beginStream(options);
    feed(text);
    endStream();
  }

  function cancel() {
    const session = current;
    current = null;
    if (!session) return;
    session.failed = true;
    try {
      if (session.startedOnServer && socket?.readyState === WebSocket.OPEN) {
        send({ type: 'cancel', sessionId: session.id });
      }
    } catch { /* noop */ }
    try { workletNode?.port.postMessage({ type: 'cancel' }); } catch { /* noop */ }
  }

  function destroy() {
    destroyed = true;
    cancel();
    closeSocket();
    try { workletNode?.disconnect(); } catch { /* noop */ }
    workletNode = null;
    workletPromise = null;
    const context = audioContext;
    audioContext = null;
    try { context?.close(); } catch { /* noop */ }
  }

  return {
    speak,
    beginStream,
    feed,
    endStream,
    cancel,
    destroy,
    unlock,
    isSpeaking: () => !!current && !current.failed,
    supported: typeof window !== 'undefined' && !!(window.AudioContext || window.webkitAudioContext) && !!window.AudioWorkletNode && !!window.WebSocket,
  };
}
