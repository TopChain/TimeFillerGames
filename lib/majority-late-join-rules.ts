export type MajorityLateJoinPhase = 'answering' | 'revealing' | 'ended' | string;

export function majorityLateJoinDisposition(options: {
  phase: MajorityLateJoinPhase;
  roundIndex: number;
  questionCount: number;
  availableSeats: number;
}) {
  const { phase, roundIndex, questionCount, availableSeats } = options;
  const hasNextQuestion = Number.isInteger(roundIndex) && Number.isInteger(questionCount) && roundIndex >= 0 && roundIndex + 1 < questionCount;
  if (phase === 'revealing' && hasNextQuestion && availableSeats > 0) return 'promote' as const;
  if ((phase === 'answering' || phase === 'revealing') && questionCount > 0) return 'queue' as const;
  return 'ignore' as const;
}
