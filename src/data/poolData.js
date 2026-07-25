// Demo dataset for the AI Pool dashboard.
// Mirrors the payload shape of https://api.kryptoncode.xyz/api/pool so the UI
// can fall back seamlessly when the backend is unreachable.

// Small deterministic PRNG so demo numbers look organic but stay stable.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MODELS = [
  {
    id: 'grok-4',
    owned_by: 'xai',
    provider: 'gcli',
    vision: true,
    tools: true,
    reasoning: true,
    contextWindow: 256000,
    maxOutput: 64000,
  },
  {
    id: 'grok-4-fast',
    owned_by: 'xai',
    provider: 'gcli',
    vision: true,
    tools: true,
    reasoning: true,
    contextWindow: 2000000,
    maxOutput: 30000,
  },
  {
    id: 'grok-3',
    owned_by: 'xai',
    provider: 'gcli',
    vision: false,
    tools: true,
    reasoning: false,
    contextWindow: 131072,
    maxOutput: 16384,
  },
  {
    id: 'grok-3-mini',
    owned_by: 'xai',
    provider: 'gcli',
    vision: false,
    tools: true,
    reasoning: true,
    contextWindow: 131072,
    maxOutput: 16384,
  },
  {
    id: 'grok-2-vision',
    owned_by: 'xai',
    provider: 'gcli',
    vision: true,
    tools: false,
    reasoning: false,
    contextWindow: 32768,
    maxOutput: 8192,
  },
];

const RECENT_MODELS = ['grok-4', 'grok-4-fast', 'grok-4-fast', 'grok-3-mini', 'grok-4', 'grok-3'];

function dateKeyFor(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

export function buildPoolDemoData() {
  const rand = mulberry32(20260725);

  // 14 days of usage, newest first (same ordering as the live API).
  const usageDaily = Array.from({ length: 14 }, (_, i) => {
    const weekend = [0, 6].includes(new Date(dateKeyFor(i)).getDay());
    const base = weekend ? 1400 : 2600;
    const requests = Math.round(base + rand() * 1900);
    return {
      dateKey: dateKeyFor(i),
      requests,
      cost: Number((requests * (0.011 + rand() * 0.004)).toFixed(4)),
    };
  });

  const lifetimeRequests = 128437;
  const todayRequests = usageDaily[0].requests;

  // Recent requests, newest first, spread over the last ~40 minutes.
  const usageRecent = Array.from({ length: 12 }, (_, i) => {
    const model = RECENT_MODELS[i % RECENT_MODELS.length];
    const promptTokens = Math.round(600 + rand() * 22000);
    const completionTokens = Math.round(120 + rand() * 3400);
    const cachedTokens = rand() > 0.45 ? Math.round(promptTokens * rand() * 0.7) : 0;
    return {
      timestamp: Date.now() - Math.round((i * 3 + rand() * 3) * 60 * 1000),
      model,
      provider: 'grok-cli',
      promptTokens,
      completionTokens,
      cachedTokens,
      cost: Number(((promptTokens * 0.6 + completionTokens * 2.4) / 1e6).toFixed(4)),
      status: i === 7 ? 'err' : 'ok',
    };
  });

  return {
    demo: true,
    stats: {
      lifetime: {
        requests: lifetimeRequests,
        promptTokens: 1927400000,
        completionTokens: 413800000,
        cost: 1834.62,
      },
      today: {
        requests: todayRequests,
        cost: usageDaily[0].cost,
      },
    },
    capacity: {
      usedPct: 34,
      remainingPct: 66,
      accountsTotal: 12,
      accountsHealthy: 10,
      accountsExhausted: 2,
      tokensUsed: 812400000,
      requests: 45210,
    },
    models: MODELS,
    usageDaily,
    usageRecent,
  };
}

export default buildPoolDemoData;
