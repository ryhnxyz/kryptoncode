const ABBREVIATIONS = new Set([
  'dr', 'drs', 'dra', 'prof', 'mr', 'mrs', 'ms', 'no', 'nomor', 'jl', 'st', 'vs',
  'dll', 'dsb', 'dst', 'etc', 'e.g', 'i.e', 'a.m', 'p.m', 's.d',
]);

const DANGLING_WORDS = new Set([
  'dan', 'atau', 'tetapi', 'tapi', 'yang', 'untuk', 'dengan', 'dari', 'ke', 'di',
  'pada', 'karena', 'agar', 'jika', 'and', 'or', 'but', 'to', 'from', 'with',
  'for', 'the', 'a', 'an', 'of', 'in', 'on', 'because', 'if',
]);

function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function tokenBefore(text, index) {
  return text.slice(0, index).match(/([\p{L}\p{N}.]+)$/u)?.[1] || '';
}

function isProtectedPeriod(text, index) {
  const previous = text[index - 1] || '';
  const next = text[index + 1] || '';
  if (/\d/.test(previous) && /\d/.test(next)) return true;

  const token = tokenBefore(text, index).toLowerCase();
  if (ABBREVIATIONS.has(token)) return true;
  if (/^[a-z]$/i.test(token)) return true;
  if (/^(?:https?:\/\/|www\.)/i.test(text.slice(Math.max(0, index - 80), index + 1))) return true;

  const wordStart = Math.max(
    text.lastIndexOf(' ', index - 1),
    text.lastIndexOf('\n', index - 1),
    text.lastIndexOf('\t', index - 1)
  ) + 1;
  const wordEndMatch = text.slice(index + 1).match(/^[^\s]*/);
  const fullToken = text.slice(wordStart, index + 1 + (wordEndMatch?.[0].length || 0));
  const internalPeriod = !!next && !/[\s"'”’)]/.test(next);
  if (internalPeriod && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fullToken)) return true;
  if (internalPeriod && /^(?:https?:\/\/|www\.)\S+$/i.test(fullToken)) return true;
  if (internalPeriod && /^[\w-]+(?:\.[\w-]+)+\/?\S*$/i.test(fullToken) && !/^[A-Z][a-z]+\.$/.test(fullToken)) return true;
  return false;
}

function sentenceBoundary(text) {
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '\n') return index + 1;
    if (!'.!?…'.includes(character)) continue;
    if (character === '.' && isProtectedPeriod(text, index)) continue;

    let end = index + 1;
    while (end < text.length && '.!?…'.includes(text[end])) end += 1;
    while (end < text.length && /["'”’)]/.test(text[end])) end += 1;
    const candidate = text.slice(0, end).trim();
    if (countWords(candidate) >= 3) return end;
  }
  return -1;
}

function forcedBoundary(text, minimumWords, maximumWords, maximumCharacters) {
  const matches = [...text.matchAll(/\S+/g)];
  if (matches.length < minimumWords) return -1;

  const clauseLimit = Math.min(text.length, maximumCharacters);
  const clausePattern = /[,;:—–](?=\s)/g;
  let clause = -1;
  for (const match of text.slice(0, clauseLimit + 1).matchAll(clausePattern)) {
    const end = match.index + match[0].length;
    if (countWords(text.slice(0, end)) >= minimumWords) clause = end;
  }
  if (clause > 0) return clause;
  if (matches.length < maximumWords && text.length < maximumCharacters) return -1;

  const cappedWordIndex = Math.min(matches.length, maximumWords) - 1;
  let chosen = cappedWordIndex;
  while (
    chosen >= minimumWords - 1 &&
    matches[chosen].index + matches[chosen][0].length > maximumCharacters
  ) chosen -= 1;

  // A streamed token may end halfway through a word. Wait for whitespace or
  // another token before treating the current final word as a safe boundary.
  if (
    chosen === matches.length - 1 &&
    matches[chosen].index + matches[chosen][0].length === text.length &&
    !/\s$/.test(text)
  ) chosen -= 1;

  const safeFallback = chosen;
  while (chosen >= minimumWords - 1) {
    const word = matches[chosen]?.[0].replace(/[^\p{L}]/gu, '').toLowerCase();
    if (word && !DANGLING_WORDS.has(word)) break;
    chosen -= 1;
  }
  if (chosen < minimumWords - 1) chosen = safeFallback;
  return chosen >= minimumWords - 1 && matches[chosen]
    ? matches[chosen].index + matches[chosen][0].length
    : -1;
}

export function createSpeechChunker({
  firstMinimumWords = 5,
  firstMaximumWords = 9,
  nextMinimumWords = 7,
  nextMaximumWords = 15,
  firstMaximumCharacters = 72,
  nextMaximumCharacters = 120,
  maximumChunks = 8,
} = {}) {
  let pending = '';
  let emitted = 0;

  function drain(final = false) {
    const chunks = [];
    while (pending.trim()) {
      pending = pending.replace(/^\s+/, '');
      let boundary = sentenceBoundary(pending);
      if (boundary < 0 && !final && emitted < maximumChunks - 1) {
        boundary = forcedBoundary(
          pending,
          emitted === 0 ? firstMinimumWords : nextMinimumWords,
          emitted === 0 ? firstMaximumWords : nextMaximumWords,
          emitted === 0 ? firstMaximumCharacters : nextMaximumCharacters
        );
      }
      if (boundary < 0 && final) boundary = pending.length;
      if (boundary <= 0) break;

      const chunk = pending.slice(0, boundary).trim();
      pending = pending.slice(boundary);
      if (!chunk) continue;
      chunks.push(chunk);
      emitted += 1;
      if (emitted >= maximumChunks && !final) break;
    }
    return chunks;
  }

  return {
    push(delta) {
      pending += String(delta || '');
      return drain(false);
    },
    flush() {
      return drain(true);
    },
    get pendingText() {
      return pending;
    },
    get emittedChunks() {
      return emitted;
    },
  };
}
