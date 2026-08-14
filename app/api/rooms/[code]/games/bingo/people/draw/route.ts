import { NextResponse } from 'next/server';
import { drawNextPeopleBingo, getPeopleBingoState } from '@/lib/people-bingo-service';
import { requireHostUser } from '@/lib/supabase/auth';

function isStaleDrawRetry(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return message.includes('Stale Bingo draw state')
    || message.includes('Bingo draw history is immutable')
    || message.includes('Invalid Bingo draw transition');
}

export async function POST(request: Request, context: { params: Promise<{ code: string }> }) {
  const host = await requireHostUser(request);
  if (!host) return NextResponse.json({ error: 'A signed-in Host is required to draw the next participant.' }, { status: 401 });
  const { code } = await context.params;

  try {
    return NextResponse.json(await drawNextPeopleBingo(code, host.id));
  } catch (error) {
    if (isStaleDrawRetry(error)) {
      try {
        return NextResponse.json(await getPeopleBingoState(code, host.id), { headers: { 'cache-control': 'no-store' } });
      } catch {
        // Fall through to the original error if the authoritative state cannot be read.
      }
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not draw the next People Bingo participant.' }, { status: 400 });
  }
}
