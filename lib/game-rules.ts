import { BINGO_BOARDS, type TimePreset } from './product';

export function canStart(hardMin: number, activePlayers: number, hardMax: number | null = null) {
  if (activePlayers < hardMin) return { ready: false, reason: `${hardMin - activePlayers} more player${hardMin-activePlayers===1?'':'s'} required.` };
  if (hardMax !== null && activePlayers > hardMax) return { ready: false, reason: `Move ${activePlayers - hardMax} player${activePlayers-hardMax===1?'':'s'} to spectators or choose another game.` };
  return { ready: true, reason: 'Ready to start.' };
}

export function bingoBoardForTime(minutes: TimePreset) {
  const size = minutes === 3 ? 5 : minutes === 5 ? 6 : minutes === 8 ? 7 : 8;
  return BINGO_BOARDS.find((board) => board.size === size)!;
}

export function rankWithCompetitionTies(scores: { id: string; score: number }[]) {
  const sorted = [...scores].sort((a,b)=>b.score-a.score);
  let previous: number | undefined;
  let rank = 0;
  return sorted.map((entry, index) => {
    if (entry.score !== previous) rank = index + 1;
    previous = entry.score;
    return { ...entry, rank };
  });
}
