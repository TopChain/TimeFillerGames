export type Rng = () => number;

export function shuffle<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function generateBingoCandidates(size: number, count = 3, rng: Rng = Math.random) {
  if (!Number.isInteger(size) || size < 2 || size > 10) throw new Error('Unsupported Bingo board size');
  const pool = Array.from({ length: size * size * 3 }, (_, i) => i + 1);
  return Array.from({ length: count }, () => shuffle(pool, rng).slice(0, size * size));
}

export function drawNextUnused<T>(pool: readonly T[], drawn: readonly T[], rng: Rng = Math.random): T {
  const remaining = pool.filter((item) => !drawn.includes(item));
  if (!remaining.length) throw new Error('Draw pool exhausted');
  return remaining[Math.floor(rng() * remaining.length)];
}

export function isBingoWinner<T>(card: readonly T[], drawn: readonly T[], size: number) {
  if (card.length !== size * size) return false;
  const marked = new Set(drawn);
  for (let r = 0; r < size; r++) if (Array.from({ length:size },(_,c)=>card[r*size+c]).every(v=>marked.has(v))) return true;
  for (let c = 0; c < size; c++) if (Array.from({ length:size },(_,r)=>card[r*size+c]).every(v=>marked.has(v))) return true;
  if (Array.from({ length:size },(_,i)=>card[i*size+i]).every(v=>marked.has(v))) return true;
  if (Array.from({ length:size },(_,i)=>card[i*size+(size-1-i)]).every(v=>marked.has(v))) return true;
  return false;
}

export function bingoWinnersOnDraw<T>(cards: Record<string, readonly T[]>, previousDraws: readonly T[], newDraw: T, size: number) {
  const before = Object.entries(cards).filter(([,card])=>isBingoWinner(card, previousDraws, size)).map(([id])=>id);
  const after = Object.entries(cards).filter(([,card])=>isBingoWinner(card, [...previousDraws,newDraw], size)).map(([id])=>id);
  return after.filter((id)=>!before.includes(id));
}

export function majorityResult(votes: Record<string,string>) {
  const counts: Record<string,number> = {};
  Object.values(votes).forEach((choice)=>{ counts[choice]=(counts[choice]??0)+1; });
  const max = Math.max(0,...Object.values(counts));
  const majorityChoices = Object.entries(counts).filter(([,n])=>n===max).map(([choice])=>choice);
  const points = Object.fromEntries(Object.entries(votes).map(([participant,choice])=>[participant,majorityChoices.includes(choice)?1:0]));
  return { counts, majorityChoices, points };
}

export function normalizeGuess(value: string) {
  return value.normalize('NFKC').trim().toLocaleLowerCase('en').replace(/[\s\p{P}\p{S}]+/gu,'');
}

export function isAcceptedQuickDrawGuess(guess: string, answer: string) {
  return normalizeGuess(guess) === normalizeGuess(answer);
}

export function quickDrawGuesserPoints(msRemaining: number, roundMs: number) {
  const ratio = Math.max(0, Math.min(1, msRemaining / roundMs));
  return 500 + Math.round(500 * ratio);
}

export function quickDrawArtistPoints(correctGuessers: number, eligibleGuessers: number) {
  if (eligibleGuessers <= 0) return 0;
  return Math.round(1000 * Math.min(1, correctGuessers / eligibleGuessers));
}
