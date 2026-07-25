// ─────────────────────────────────────────────────────────────────
// KRYPTON AI CORE · orb engine
// A black soul: void sphere with smoky turbulence and a thin warm
// rim, wrapped in a circular dot-matrix spectrum that dances with
// live sound. Canvas 2D, DPR-aware, reduced-motion friendly.
// Palette follows the krypton design system (near-black canvas,
// warm off-white ink #faf7f2), with restrained state tints.
// ─────────────────────────────────────────────────────────────────

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;

// state → visual language. tint = rgb of rim/spectrum highlight.
export const ORB_STATES = {
  idle:        { tint: [250, 247, 242], energy: 0.35, spin: 0.12, turb: 0.55, gain: 0.55 },
  listening:   { tint: [250, 247, 242], energy: 0.85, spin: 0.18, turb: 0.75, gain: 1.25 },
  thinking:    { tint: [196, 181, 253], energy: 0.7,  spin: 0.6,  turb: 1.5,  gain: 0.7 },
  searching:   { tint: [125, 211, 252], energy: 0.75, spin: 0.95, turb: 1.1,  gain: 0.8 },
  browsing:    { tint: [147, 197, 253], energy: 0.65, spin: 0.7,  turb: 0.9,  gain: 0.75 },
  coding:      { tint: [134, 239, 172], energy: 0.7,  spin: 0.35, turb: 1.2,  gain: 0.85 },
  deploying:   { tint: [252, 211, 77],  energy: 0.9,  spin: 1.1,  turb: 1.3,  gain: 1.0 },
  reading:     { tint: [186, 203, 255], energy: 0.55, spin: 0.3,  turb: 0.7,  gain: 0.65 },
  speaking:    { tint: [255, 251, 240], energy: 0.95, spin: 0.22, turb: 0.85, gain: 1.35 },
  warning:     { tint: [252, 165, 165], energy: 0.9,  spin: 0.5,  turb: 1.8,  gain: 1.1 },
  celebrating: { tint: [253, 230, 138], energy: 1.0,  spin: 1.4,  turb: 1.6,  gain: 1.2 },
  completed:   { tint: [134, 239, 172], energy: 0.7,  spin: 0.25, turb: 0.6,  gain: 0.8 },
};

const SPEC_BINS = 88;   // angular spectrum bins around the orb
const DOT_PITCH = 5;    // px between spectrum dots (css px)
const DOT_R = 1.5;      // spectrum dot radius

export function createOrbEngine(canvas, opts = {}) {
  const ctx = canvas.getContext('2d');
  const reduced = opts.reducedMotion ?? window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let W = 0, H = 0, dpr = 1;
  let running = true;
  let raf = 0;
  let last = 0;

  // placement: 'dock' (bottom-right, small) ↔ 'center' (AI Space)
  let placement = 'dock';
  const cur = { x: 0, y: 0, r: 0 };
  const tgt = { x: 0, y: 0, r: 0 };

  // state visuals (lerped)
  let stateName = 'idle';
  const vis = { tint: [250, 247, 242], energy: 0.35, spin: 0.12, turb: 0.55, gain: 0.55 };
  const visT = { ...vis, tint: [...vis.tint] };

  // motion clocks
  let phase = Math.random() * TAU;
  let rot = 0;

  // audio
  let audioSource = null;      // () => ({ level:0..1, bins:Uint8Array|null })
  let speaking = false;        // synthetic speech envelope on top
  let speakEnv = 0;
  let amp = 0;                 // smoothed master amplitude 0..1
  const smooth = new Float32Array(SPEC_BINS); // smoothed per-bin values

  function resize() {
    dpr = clamp(window.devicePixelRatio || 1, 1, 2);
    W = canvas.width = Math.round(window.innerWidth * dpr);
    H = canvas.height = Math.round(window.innerHeight * dpr);
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    snapTargets();
  }

  function targets() {
    if (placement === 'center') {
      const r = clamp(Math.min(window.innerWidth, window.innerHeight) * 0.13, 80, 130);
      return { x: window.innerWidth / 2, y: window.innerHeight * 0.42, r };
    }
    return { x: window.innerWidth - 64, y: window.innerHeight - 64, r: 26 };
  }
  function snapTargets() {
    const t = targets();
    tgt.x = t.x * dpr; tgt.y = t.y * dpr; tgt.r = t.r * dpr;
  }

  function setPlacement(p, immediate = false) {
    placement = p;
    snapTargets();
    if (immediate) { cur.x = tgt.x; cur.y = tgt.y; cur.r = tgt.r; }
  }

  function setState(name) {
    stateName = ORB_STATES[name] ? name : 'idle';
    const d = ORB_STATES[stateName];
    visT.tint = [...d.tint];
    visT.energy = d.energy; visT.spin = d.spin; visT.turb = d.turb; visT.gain = d.gain;
  }

  // synthetic bins when mic is unavailable — layered sines like SpectrumBars
  function syntheticBins(t) {
    const out = new Float32Array(SPEC_BINS);
    const drive = vis.energy * (speaking ? 0.5 + speakEnv : 0.55);
    for (let i = 0; i < SPEC_BINS; i++) {
      const a =
        0.4 +
        0.3 * Math.sin(i * 0.31 + t * 1.9 * vis.turb) +
        0.2 * Math.sin(i * 0.11 - t * 1.15) +
        0.12 * Math.sin(i * 0.53 + t * 3.1);
      out[i] = clamp(a, 0.04, 1) * drive;
    }
    return out;
  }

  function sampleAudio(t) {
    let level = 0;
    let bins = null;
    if (audioSource) {
      const d = audioSource();
      if (d) { level = d.level || 0; bins = d.bins || null; }
    }
    // speech envelope (TTS output isn't capturable → synthesize cadence)
    if (speaking) {
      speakEnv = lerp(speakEnv, 0.35 + Math.abs(Math.sin(t * 5.1) * Math.sin(t * 2.3)) * 0.65, 0.25);
      level = Math.max(level, speakEnv * 0.9);
    } else {
      speakEnv = lerp(speakEnv, 0, 0.12);
    }

    const target = new Float32Array(SPEC_BINS);
    if (bins && bins.length) {
      // map mic FFT (skip lowest rumble) around the ring, mirrored for symmetry
      const usable = Math.min(bins.length, 96);
      const half = SPEC_BINS / 2;
      for (let i = 0; i < SPEC_BINS; i++) {
        const j = i < half ? i : SPEC_BINS - 1 - i;
        const bi = 2 + Math.floor((j / half) * (usable - 4));
        let v = bins[bi] / 255;
        v = Math.max(0, v - 0.06) * 1.18;             // noise floor gate
        target[i] = clamp(v, 0, 1);
      }
      if (speaking) {
        const syn = syntheticBins(t);
        for (let i = 0; i < SPEC_BINS; i++) target[i] = Math.max(target[i], syn[i]);
      }
    } else {
      const syn = syntheticBins(t);
      target.set(syn);
      if (level > 0.02) for (let i = 0; i < SPEC_BINS; i++) target[i] = clamp(target[i] + level * 0.5, 0, 1);
    }

    // temporal smoothing (fast attack, slow release)
    for (let i = 0; i < SPEC_BINS; i++) {
      const v = target[i];
      smooth[i] = v > smooth[i] ? lerp(smooth[i], v, 0.5) : lerp(smooth[i], v, 0.12);
    }
    amp = lerp(amp, clamp(level, 0, 1), level > amp ? 0.4 : 0.08);
  }

  function tintStr(alpha, boost = 0) {
    const [r, g, b] = vis.tint;
    const f = (c) => Math.round(clamp(c + boost, 0, 255));
    return `rgba(${f(r)},${f(g)},${f(b)},${alpha})`;
  }

  function draw(now) {
    if (!running) return;
    raf = requestAnimationFrame(draw);
    const dt = clamp((now - (last || now)) / 16.67, 0, 3);
    last = now;
    const t = now / 1000;

    // ease geometry + visuals
    const k = 1 - Math.pow(0.0012, dt / 60);
    cur.x = lerp(cur.x, tgt.x, clamp(k * 2.4, 0, 1));
    cur.y = lerp(cur.y, tgt.y, clamp(k * 2.4, 0, 1));
    cur.r = lerp(cur.r, tgt.r, clamp(k * 2.4, 0, 1));
    for (let i = 0; i < 3; i++) vis.tint[i] = lerp(vis.tint[i], visT.tint[i], clamp(k * 1.6, 0, 1));
    vis.energy = lerp(vis.energy, visT.energy, clamp(k * 1.4, 0, 1));
    vis.spin = lerp(vis.spin, visT.spin, clamp(k * 1.2, 0, 1));
    vis.turb = lerp(vis.turb, visT.turb, clamp(k * 1.2, 0, 1));
    vis.gain = lerp(vis.gain, visT.gain, clamp(k * 1.4, 0, 1));

    if (!reduced) {
      phase += dt * 0.02 * (0.7 + vis.energy);
      rot += dt * 0.0045 * vis.spin;
    }

    sampleAudio(t);

    ctx.clearRect(0, 0, W, H);
    const cx = cur.x, cy = cur.y;
    const breathe = reduced ? 1 : 1 + Math.sin(phase) * 0.035 * (0.5 + vis.energy) + amp * 0.14;
    const R = cur.r * breathe;
    const isDock = placement === 'dock';

    // ── halo (very soft, tinted) ─────────────────────────────────
    let g = ctx.createRadialGradient(cx, cy, R * 0.4, cx, cy, R * 2.9);
    g.addColorStop(0, tintStr(0.055 + vis.energy * 0.05 + amp * 0.05));
    g.addColorStop(1, tintStr(0));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, R * 2.9, 0, TAU); ctx.fill();

    // ── circular dot spectrum ────────────────────────────────────
    const pitch = DOT_PITCH * dpr;
    const dotR = DOT_R * dpr * (isDock ? 0.8 : 1);
    const base = R * 1.22;
    const maxLen = R * (isDock ? 0.65 : 0.95);
    for (let i = 0; i < SPEC_BINS; i++) {
      const a = (i / SPEC_BINS) * TAU - Math.PI / 2 + rot * 0.35;
      const v = clamp(smooth[i] * vis.gain, 0, 1);
      const len = v * maxLen;
      const dots = Math.max(1, Math.round(len / pitch));
      const ca = Math.cos(a), sa = Math.sin(a);
      for (let d = 0; d < dots; d++) {
        const rr = base + d * pitch;
        const frac = dots === 1 ? 0 : d / (dots - 1);
        const alpha = (0.5 - frac * 0.42) * (0.35 + v * 0.75);
        ctx.fillStyle = tintStr(alpha);
        ctx.beginPath();
        ctx.arc(cx + ca * rr, cy + sa * rr, dotR * (1 - frac * 0.35), 0, TAU);
        ctx.fill();
      }
    }

    // ── the black soul ───────────────────────────────────────────
    // body: void gradient (slightly lifted center so it reads as a sphere)
    g = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.35, R * 0.1, cx, cy, R);
    g.addColorStop(0, '#16181d');
    g.addColorStop(0.45, '#0b0c0f');
    g.addColorStop(1, '#030304');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();

    // inner smoke (soul turbulence) — clipped to the sphere
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, R * 0.985, 0, TAU); ctx.clip();
    for (let i = 0; i < 3; i++) {
      const aa = phase * (0.5 + i * 0.37) + i * 2.1;
      const bx = cx + Math.cos(aa) * R * 0.34 * vis.turb;
      const by = cy + Math.sin(aa * 1.23) * R * 0.28 * vis.turb;
      const br = R * (0.55 + 0.12 * Math.sin(phase * 0.8 + i));
      const sg = ctx.createRadialGradient(bx, by, 0, bx, by, br);
      sg.addColorStop(0, tintStr(0.045 + vis.energy * 0.035 + (speaking ? speakEnv * 0.05 : 0)));
      sg.addColorStop(0.55, 'rgba(24,26,32,0.18)');
      sg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = sg;
      ctx.beginPath(); ctx.arc(bx, by, br, 0, TAU); ctx.fill();
    }
    // deep center — the void
    const vg = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0.88)');
    vg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = vg;
    ctx.beginPath(); ctx.arc(cx, cy, R * 0.75, 0, TAU); ctx.fill();
    ctx.restore();

    // ── rim light ────────────────────────────────────────────────
    // full quiet ring
    ctx.lineWidth = 1.1 * dpr;
    ctx.strokeStyle = tintStr(0.16 + amp * 0.1);
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();
    // sweeping bright arc (the consciousness)
    const sweep = rot * 2 + phase * 0.35;
    const arcLen = 1.1 + Math.sin(phase * 0.9) * 0.25 + amp * 0.5;
    ctx.lineWidth = 1.6 * dpr;
    ctx.lineCap = 'round';
    ctx.strokeStyle = tintStr(0.5 + amp * 0.3, 10);
    ctx.beginPath(); ctx.arc(cx, cy, R, sweep, sweep + arcLen); ctx.stroke();
    ctx.strokeStyle = tintStr(0.22);
    ctx.beginPath(); ctx.arc(cx, cy, R, sweep + Math.PI, sweep + Math.PI + arcLen * 0.6); ctx.stroke();

    // specular sliver — glass depth
    ctx.lineWidth = 1 * dpr;
    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    ctx.beginPath(); ctx.arc(cx, cy, R * 0.86, -2.3, -1.25); ctx.stroke();
  }

  function start() { resize(); last = 0; raf = requestAnimationFrame(draw); }
  function destroy() { running = false; cancelAnimationFrame(raf); window.removeEventListener('resize', resize); }

  window.addEventListener('resize', resize);
  setPlacement('dock', true);
  start();

  return {
    setPlacement,
    setState,
    getState: () => stateName,
    setAudioSource(fn) { audioSource = fn; },
    setSpeaking(v) { speaking = !!v; },
    nudge() { amp = Math.max(amp, 0.6); },  // small reaction on tap
    destroy,
  };
}
