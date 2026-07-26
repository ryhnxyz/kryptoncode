// ─────────────────────────────────────────────────────────────────
// KRYPTON AI CORE · public, non-sensitive presentation data
// Infrastructure identifiers and operational details never belong here.
// ─────────────────────────────────────────────────────────────────

export const RESEARCH_RESULTS = [
  {
    title: 'Vite 8.0 — migration & performance notes',
    source: 'vite.dev/blog',
    summary: {
      id: 'Build bertenaga Rolldown, cold start lebih cepat; Environment API stabil.',
      en: 'Rolldown-powered builds, faster cold starts; environment API stabilized.',
    },
  },
  {
    title: 'React 19 concurrent features in production',
    source: 'react.dev',
    summary: {
      id: 'Actions, use(), dan interaksi compiler baru dengan Vite.',
      en: 'Actions, use(), and the new compiler interplay with Vite.',
    },
  },
  {
    title: 'Tailwind v4 engine (Oxide)',
    source: 'tailwindcss.com/blog',
    summary: {
      id: 'Konfigurasi CSS-first; full build 5× lebih cepat.',
      en: 'CSS-first config; five times faster full builds.',
    },
  },
];

export const CODE_SNIPPET = [
  [['cm', '// Krypton realtime voice bridge']],
  [['kw', 'export async function '], ['fn', 'openVoiceSession'], ['n', '(ws) {']],
  [['n', '  '], ['kw', 'const '], ['n', 'agent = '], ['kw', 'await '], ['fn', 'connectCore'], ['n', '({ persona: '], ['st', "'krypton-v2'"], ['n', ' });']],
  [['n', '  agent.'], ['fn', 'on'], ['n', '('], ['st', "'partial'"], ['n', ', t => ws.'], ['fn', 'send'], ['n', '({ t, live: '], ['kw', 'true'], ['n', ' }));']],
  [['n', '  agent.'], ['fn', 'on'], ['n', '('], ['st', "'speech'"], ['n', ', pcm => ws.'], ['fn', 'send'], ['n', '(pcm));']],
  [['n', '  '], ['kw', 'return'], ['n', ' agent;']],
  [['n', '}']],
];

// UI strings for the core, self-contained (id / en).
export const STRINGS = {
  dockHint: {
    id: ['Sentuh core-nya', 'atau ucapkan "Hey Krypton"'],
    en: ['Tap the core', 'or say "Hey Krypton"'],
  },
  placeholder: {
    id: 'Tanya Krypton, atau ucapkan "Hey Krypton"…',
    en: 'Ask Krypton, or say "Hey Krypton"…',
  },
  contextLine: {
    id: 'konteks · ruang publik · privasi aktif',
    en: 'context · public space · privacy active',
  },
  chips: {
    id: [
      ['Status platform', 'tampilkan status platform'],
      ['Layanan inti', 'tampilkan kesehatan layanan'],
      ['Riset Vite 8', 'cari info terbaru vite 8'],
    ],
    en: [
      ['Platform status', 'show platform status'],
      ['Core services', 'show service health'],
      ['Research Vite 8', 'search the latest on vite 8'],
    ],
  },
  panelTitles: {
    system: { id: 'Status platform', en: 'Platform status' },
    processes: { id: 'Kesehatan layanan', en: 'Service health' },
    research: { id: 'Riset', en: 'Research' },
    code: { id: 'Draf', en: 'Draft' },
    browser: { id: 'Browser · kryptoncode.xyz', en: 'Browser · kryptoncode.xyz' },
  },
  stateLabels: {
    idle: { id: 'Siaga', en: 'Idle' },
    listening: { id: 'Mendengarkan', en: 'Listening' },
    thinking: { id: 'Berpikir', en: 'Thinking' },
    searching: { id: 'Mencari', en: 'Searching' },
    browsing: { id: 'Menjelajah', en: 'Browsing' },
    coding: { id: 'Menulis kode', en: 'Coding' },
    deploying: { id: 'Deploy', en: 'Deploying' },
    reading: { id: 'Membaca', en: 'Reading' },
    speaking: { id: 'Berbicara', en: 'Speaking' },
    warning: { id: 'Peringatan', en: 'Warning' },
    celebrating: { id: 'Merayakan', en: 'Celebrating' },
    completed: { id: 'Selesai', en: 'Completed' },
  },
};

export function greeting(lang) {
  const h = new Date().getHours();
  if (lang === 'en') {
    const g = h < 12 ? 'Morning' : h < 18 ? 'Good afternoon' : 'Evening';
    return `${g}. Krypton is ready. What are we building?`;
  }
  const g = h < 11 ? 'Selamat pagi' : h < 15 ? 'Selamat siang' : h < 19 ? 'Selamat sore' : 'Selamat malam';
  return `${g}. Krypton siap. Kita bangun apa hari ini?`;
}
