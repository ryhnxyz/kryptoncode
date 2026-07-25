// ─────────────────────────────────────────────────────────────────
// KRYPTON AI CORE · mock data layer
// Mirrors the real VPS (vmi3429943) so phase 2 only swaps this file
// for live endpoints (terminal API / kryptoncode-backend).
// ─────────────────────────────────────────────────────────────────

export const VPS = {
  host: 'vmi3429943',
  cpus: 6,
  totalMemMB: 11961,
  usedMemMB: 2804,
  load: [0.14, 0.14, 0.2],
  uptimeDays: 15.9,
  servicesOnline: 14,
};

export const SERVICES = [
  { name: 'api_kryptoncode', mem: '102.5mb', uptime: '25h', cpu: '0%' },
  { name: '9router', mem: '73.2mb', uptime: '4D', cpu: '0%' },
  { name: 'vps-web-terminal', mem: '75.4mb', uptime: '4h', cpu: '0%' },
  { name: 'router-proxy', mem: '24.6mb', uptime: '25h', cpu: '0%' },
  { name: 'temp-email', mem: '21.0mb', uptime: '2D', cpu: '0%' },
  { name: 'xaut-swap-bot', mem: '96.4mb', uptime: '31h', cpu: '0%' },
];

// Rotating fake log stream for the Logs panel.
export const LOG_LINES = [
  [['t', '[12:41:02] '], ['ac', 'GET '], ['n', '/v1/pools/apex → '], ['ok', '200 '], ['t', '23ms']],
  [['t', '[12:41:03] '], ['ac', 'POST '], ['n', '/v1/exec → '], ['ok', '200 '], ['t', '8ms']],
  [['t', '[12:41:05] '], ['wn', 'warn '], ['n', 'pool cache miss, refetching upstream']],
  [['t', '[12:41:06] '], ['ac', 'GET '], ['n', '/v1/products → '], ['ok', '200 '], ['t', '19ms']],
  [['t', '[12:41:08] '], ['ok', '✓ '], ['n', 'settlement worker tick complete']],
  [['t', '[12:41:11] '], ['ac', 'WS '], ['n', 'client connected · sess a91f']],
  [['t', '[12:41:13] '], ['ok', '✓ '], ['n', 'db pool 4/20 · healthy']],
];

export const DEPLOY_SCRIPTS = {
  backend: [
    { kind: 'ac', text: '▶ git pull origin main' },
    { kind: 'n', text: '  3 files changed · src/routes, src/workers' },
    { kind: 'ac', text: '▶ npm run build' },
    { kind: 'ok', text: '✓ tsc → dist/ (2.1s)' },
    { kind: 'ac', text: '▶ pm2 reload api_kryptoncode' },
    { kind: 'ok', text: '✓ api_kryptoncode online · 0 downtime' },
    { kind: 'ok', text: '✓ health /v1/health → 200' },
  ],
  restartBot: [
    { kind: 'ac', text: '▶ pm2 reload xaut-swap-bot' },
    { kind: 'ok', text: '✓ reloaded · mem 41mb · online' },
    { kind: 'ok', text: '✓ watcher re-armed' },
  ],
};

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
    id: 'konteks · console · vmi3429943 · 14 layanan',
    en: 'context · console · vmi3429943 · 14 services',
  },
  chips: {
    id: [
      ['Status sistem', 'tampilkan status sistem'],
      ['Proses', 'tampilkan proses'],
      ['Log langsung', 'tampilkan log'],
      ['Riset Vite 8', 'cari info terbaru vite 8'],
      ['Deploy backend', 'deploy backend'],
    ],
    en: [
      ['System status', 'show system status'],
      ['Processes', 'show processes'],
      ['Live logs', 'show live logs'],
      ['Research Vite 8', 'search the latest on vite 8'],
      ['Deploy backend', 'deploy the backend'],
    ],
  },
  toast: {
    id: {
      text: 'Perhatian — memori xaut-swap-bot naik ke 96 MB (+38% dalam 2 jam).',
      sub: 'Kemungkinan slow leak · restart akan membersihkannya.',
      action: 'Restart',
    },
    en: {
      text: 'Heads up — xaut-swap-bot memory crept to 96 MB (+38% in 2h).',
      sub: 'Possible slow leak · a restart clears it.',
      action: 'Restart it',
    },
  },
  panelTitles: {
    system: { id: 'Sistem', en: 'System' },
    processes: { id: 'Proses · pm2', en: 'Processes · pm2' },
    logs: { id: 'Log langsung · api_kryptoncode', en: 'Live logs · api_kryptoncode' },
    research: { id: 'Riset', en: 'Research' },
    code: { id: 'Draf · voiceGateway.js', en: 'Draft · voiceGateway.js' },
    deploy: { id: 'Deployment · kryptoncode-backend', en: 'Deployment · kryptoncode-backend' },
    restartBot: { id: 'pm2 reload · xaut-swap-bot', en: 'pm2 reload · xaut-swap-bot' },
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
    return `${g}. Krypton online — everything is healthy on vmi3429943. What are we building?`;
  }
  const g = h < 11 ? 'Selamat pagi' : h < 15 ? 'Selamat siang' : h < 19 ? 'Selamat sore' : 'Selamat malam';
  return `${g}. Krypton aktif — semua sehat di vmi3429943. Kita bangun apa hari ini?`;
}
