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
    'Ini kondisi vmi3429943 sekarang. CPU santai di load 0,14 — memori terpakai 2,8 dari 12 giga. Semuanya sehat.',
    "Here's the live picture of vmi3429943. CPU is calm at 0.14 load, memory 2.8 of 12 gig. All healthy."
  ),
  processes: R(
    'Empat belas layanan online. api_kryptoncode itu backend-mu — sudah 25 jam menyala, 102 mega.',
    'Fourteen services online. api_kryptoncode is your backend — 25 hours up, 102 meg.'
  ),
  logs: R(
    'Log api_kryptoncode kualirkan langsung. Kalau ada yang janggal, langsung kuberi tahu.',
    "Streaming api_kryptoncode logs live. I'll flag anything that looks off."
  ),
  research: R(
    'Sumber paling relevan sudah kutarik — Vite 8, React 19, Tailwind 4. Mau kurangkum dampak migrasinya?',
    'Pulled the most relevant sources — Vite 8, React 19, Tailwind 4. Want me to summarize the migration impact?'
  ),
  code: R(
    'Draf jembatan suara realtime sudah jadi. Bilang saja, nanti kupasang ke ai-agent dan kubuka PR-nya.',
    "Drafted the realtime voice bridge. Say the word and I'll wire it into ai-agent and open a PR."
  ),
  deploy: R(
    'Men-deploy kryptoncode-backend sekarang — perhatikan core-nya.',
    'Deploying kryptoncode-backend now — watch the core.'
  ),
  deployDone: R(
    'Deployment selesai. api_kryptoncode di-reload tanpa downtime.',
    'Deployment complete. api_kryptoncode reloaded with zero downtime.'
  ),
  restartDone: R(
    'Beres. xaut-swap-bot kembali ke 41 mega. Terus kupantau.',
    "Done. xaut-swap-bot is back to 41 megs. I'll keep watching it."
  ),
  browse: R(
    'Aku sudah di halaman deploy. Tinggal bilang mau klik atau isi apa.',
    "I'm on the deploy page. Tell me what to click or fill."
  ),
  hide: R('Oke — sudah kusembunyikan.', 'Done — tucked that away.'),
  hideAll: R('Bersih. Tinggal kita berdua.', 'Cleared. Just us now.'),
  thanks: R('Kapan pun. Memang untuk ini aku ada.', "Anytime. This is what I'm here for."),
  fallback: R(
    'Bisa kubantu. Untuk demo ini coba: "status sistem", "log langsung", "deploy backend", atau "cari vite 8".',
    'I can act on that. For this demo try: "system status", "live logs", "deploy the backend", or "search vite 8".'
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
      [['log'], 'logs'],
      [['proses', 'process', 'pm2', 'layanan', 'service'], 'processes'],
      [['sistem', 'system', 'cpu', 'status', 'metrik', 'metric', 'memori', 'memory'], 'system'],
      [['riset', 'search', 'research', 'dok'], 'research'],
      [['kode', 'code'], 'code'],
      [['deploy'], 'deploy'],
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
    return { intent: 'logs', show: ['logs'], think: true, reply: REPLIES.logs, rest: 'reading' };
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

  // ── deploy / restart ──────────────────────────────────────────
  if (has('deploy', 'rilis', 'release', 'ship', 'luncurkan', 'push live')) {
    return { intent: 'deploy', show: ['deploy'], reply: REPLIES.deploy, state: 'deploying', rest: 'deploying' };
  }
  if (has('restart', 'mulai ulang', 'reload')) {
    return { intent: 'restartBot', show: ['restartBot'], reply: REPLIES.deploy, state: 'deploying', rest: 'deploying' };
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
