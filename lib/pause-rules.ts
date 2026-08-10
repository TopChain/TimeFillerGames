export function pauseDurationMs(pauseStartedAt: string | null | undefined, nowMs: number) {
  if (!pauseStartedAt) return 0;
  const startedMs = new Date(pauseStartedAt).getTime();
  if (!Number.isFinite(startedMs) || !Number.isFinite(nowMs)) return 0;
  return Math.max(0, nowMs - startedMs);
}

export function shiftIsoDeadline(deadline: string, deltaMs: number) {
  const deadlineMs = new Date(deadline).getTime();
  if (!Number.isFinite(deadlineMs) || !Number.isFinite(deltaMs) || deltaMs < 0) return deadline;
  return new Date(deadlineMs + deltaMs).toISOString();
}

export function remainingSecondsAt(deadline: string, nowMs: number, pauseStartedAt?: string | null) {
  const deadlineMs = new Date(deadline).getTime();
  if (!Number.isFinite(deadlineMs)) return 0;
  const pausedAtMs = pauseStartedAt ? new Date(pauseStartedAt).getTime() : Number.NaN;
  const referenceMs = Number.isFinite(pausedAtMs) ? pausedAtMs : nowMs;
  return Math.max(0, Math.ceil((deadlineMs - referenceMs) / 1000));
}
