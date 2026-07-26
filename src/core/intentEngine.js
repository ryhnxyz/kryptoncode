// ─────────────────────────────────────────────────────────────────
// KRYPTON AI CORE · rule-based intent engine (bilingual id/en)
// Pure module: takes raw text, returns an action descriptor.
// Phase 2 replaces this with the real ai-agent over WebSocket.
// ─────────────────────────────────────────────────────────────────

const R = (id, en) => ({ id, en });

const REPLIES = {
  greeting: R(
    'Aku Krypton — inti dari platform ini. Bicara saja dengan natural; antarmukanya akan kubentuk mengikuti kebutuhanmu.',
    "I'm Krypton — the core of this platform. Speak naturally; I'll shape the interface around what you need."
  ),
  system: R(
    'Platform sehat dan kapasitas tersedia.',
    'The platform is healthy and capacity is available.'
  ),
  processes: R(
    'Layanan inti berstatus sehat.',
    'Core services are healthy.'
  ),
  logs: R(
    'Detail operasional hanya tersedia untuk admin yang terautentikasi.',
    'Operational details are available only to authenticated administrators.'
  ),
  research: R(
    'Sumber paling relevan sudah kutarik — Vite 8, React 19, Tailwind 4. Mau kurangkum dampak migrasinya?',
    'Pulled the most relevant sources — Vite 8, React 19, Tailwind 4. Want me to summarize the migration impact?'
  ),
  code: R(
    'Draf kode sudah siap untuk ditinjau.',
    'The code draft is ready for review.'
  ),
  admin: R(
    'Aksi operasional hanya tersedia untuk admin yang terautentikasi.',
    'Operational actions are available only to authenticated administrators.'
  ),
  browse: R(
    'Halaman publik sudah terbuka. Bilang konten mana yang ingin kamu jelajahi.',
    'The public page is open. Tell me which content you want to explore.'
  ),
  hide: R('Oke — sudah kusembunyikan.', 'Done — tucked that away.'),
  hideAll: R('Bersih. Tinggal kita berdua.', 'Cleared. Just us now.'),
  thanks: R('Kapan pun. Memang untuk ini aku ada.', "Anytime. This is what I'm here for."),
  fallback: R(
    'Bisa kubantu. Coba tanyakan status platform, kesehatan layanan, atau minta riset topik tertentu.',
    'I can help. Ask about platform status, service health, or request research on a topic.'
  ),
};

// keyword helper: does text contain any of the words
const mk = (t) => (...words) => words.some((w) => t.includes(w));

/**
 * interpret(raw) → {
 *   intent, show:[panelIds], hide:[panelIds], hideAll:bool,
 *   reply:{id,en}, state: orb state while acting,
 *   rest: orb state after speaking, think: run thinking beat first,
 *   exit: leave AI Space
 * }
 */
export function interpret(raw) {
  const q = (raw || '').trim();
  if (!q) return null;
  const t = q.toLowerCase();
  const has = mk(t);

  // ── hide / close ──────────────────────────────────────────────
  if (has('sembunyikan', 'tutup panel', 'hapus panel', 'bersihkan', 'hide', 'close', 'remove', 'clear')) {
    if (has('semua', 'all', 'everything') || t === 'clear' || t === 'bersihkan') {
      return { intent: 'hideAll', hideAll: true, reply: REPLIES.hideAll, state: 'idle', rest: 'idle' };
    }
    const map = [
      [['proses', 'process', 'layanan', 'service'], 'processes'],
      [['sistem', 'system', 'status', 'metrik', 'metric'], 'system'],
      [['riset', 'search', 'research', 'dok'], 'research'],
      [['kode', 'code'], 'code'],
      [['browser', 'jelajah'], 'browser'],
    ];
    const hide = map.filter(([ws]) => has(...ws)).map(([, id]) => id);
    if (hide.length) return { intent: 'hide', hide, reply: REPLIES.hide, state: 'idle', rest: 'idle' };
    return { intent: 'hideAll', hideAll: true, reply: REPLIES.hideAll, state: 'idle', rest: 'idle' };
  }

  // ── greeting / identity ───────────────────────────────────────
  if (
    has('hey krypton', 'hai krypton', 'halo krypton', 'siapa kamu', 'kamu siapa', 'who are you', 'what are you') ||
    /^(halo|hai|hei|hello|hi|hey)\b/.test(t)
  ) {
    return { intent: 'greeting', reply: REPLIES.greeting, state: 'idle', rest: 'idle' };
  }

  // ── system status ─────────────────────────────────────────────
  if (has('status', 'sistem', 'system', 'server', 'vps', 'kesehatan', 'health', 'cpu', 'memori', 'memory', 'ram', 'metrik', 'metric')) {
    return { intent: 'system', show: ['system'], think: true, reply: REPLIES.system, rest: 'completed' };
  }

  // ── processes ─────────────────────────────────────────────────
  if (has('proses', 'process', 'pm2', 'layanan', 'service')) {
    return { intent: 'processes', show: ['processes'], think: true, reply: REPLIES.processes, rest: 'completed' };
  }

  // ── logs ──────────────────────────────────────────────────────
  if (has('log', 'tail')) {
    return { intent: 'logs', reply: REPLIES.logs, rest: 'idle' };
  }

  // ── research / search ─────────────────────────────────────────
  if (has('cari', 'carikan', 'riset', 'telusuri', 'search', 'research', 'look up', 'find', 'dokumentasi', 'docs', 'terbaru', 'latest', 'google')) {
    const arg = q
      .replace(/^(tolong\s+)?(cari(kan)?|riset|telusuri|search|research|look up|find|google)\s*(for|the|about|info|tentang|soal)?\s*/i, '')
      .trim();
    return { intent: 'research', show: ['research'], arg: arg || 'vite 8', state: 'searching', reply: REPLIES.research, rest: 'completed', replyDelay: 1800 };
  }

  // ── code ──────────────────────────────────────────────────────
  if (has('kode', 'koding', 'code', 'tulis', 'write', 'fungsi', 'function', 'implement', 'refactor', 'voice bridge')) {
    return { intent: 'code', show: ['code'], think: true, reply: REPLIES.code, rest: 'completed', acting: 'coding' };
  }

  // ── operational actions stay behind authenticated administration ─
  if (has('deploy', 'rilis', 'release', 'ship', 'luncurkan', 'push live', 'restart', 'mulai ulang', 'reload')) {
    return { intent: 'admin', reply: REPLIES.admin, state: 'idle', rest: 'idle' };
  }

  // ── browse ────────────────────────────────────────────────────
  if (has('buka', 'browse', 'navigasi', 'navigate', 'jelajah', 'kunjungi', 'open', 'go to', 'website')) {
    return { intent: 'browse', show: ['browser'], state: 'browsing', reply: REPLIES.browse, rest: 'completed', replyDelay: 1100 };
  }

  // ── thanks / praise ───────────────────────────────────────────
  if (has('terima kasih', 'makasih', 'thank', 'keren', 'mantap', 'bagus', 'nice', 'great', 'amazing', 'cool', 'love')) {
    return { intent: 'thanks', reply: REPLIES.thanks, state: 'celebrating', rest: 'idle' };
  }

  // ── exit ──────────────────────────────────────────────────────
  if (has('keluar', 'exit', 'tutup ruang', 'close space', 'sampai jumpa', 'bye')) {
    return { intent: 'exit', exit: true };
  }

  // ── fallback ──────────────────────────────────────────────────
  return { intent: 'fallback', think: true, reply: REPLIES.fallback, rest: 'idle' };
}

export { REPLIES };
