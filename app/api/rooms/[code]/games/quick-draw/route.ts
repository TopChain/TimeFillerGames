import { NextResponse } from 'next/server';
import { validateRelease1GuessVisibility } from '@/lib/quick-draw-launch-policy';
import { getQuickDrawReadState } from '@/lib/quick-draw-read-service';
import { startQuickDraw } from '@/lib/quick-draw-service';
import { requireHostUser, requireUser } from '@/lib/supabase/auth';

export async function GET(request: Request, context: { params: Promise<{ code: string }> }) {
  try {
    const user = await requireUser(request);
    if (!user) return NextResponse.json({ error: 'Authentication is required to view Quick Draw state.' }, { status: 401 });
    const { code } = await context.params;
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('session');
    const roundRaw = url.searchParams.get('round');
    const afterRaw = url.searchParams.get('after');
    const roundIndex = roundRaw === null ? null : Number(roundRaw);
    const afterSequence = afterRaw === null ? null : Number(afterRaw);
    return NextResponse.json(await getQuickDrawReadState(code, user.id, { sessionId, roundIndex, afterSequence }), { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not load Quick Draw.' }, { status: 400 });
  }
}

export async function POST(request: Request, context: { params: Promise<{ code: string }> }) {
  try {
    const host = await requireHostUser(request);
    if (!host) return NextResponse.json({ error: 'A signed-in Host is required to start Quick Draw.' }, { status: 401 });
    const { code } = await context.params;
    const body = await request.json() as Record<string, unknown>;
    const guessVisibility = validateRelease1GuessVisibility(body.guessVisibility);
    return NextResponse.json(await startQuickDraw(code, host.id, {
      drawingSeconds: body.drawingSeconds,
      artistTurns: body.artistTurns,
      artistSelection: body.artistSelection,
      wordCategory: body.wordCategory,
      wordDifficulty: body.wordDifficulty,
      guessVisibility,
      audienceGuessing: body.audienceGuessing,
      timeBonus: body.timeBonus,
    }), { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not start Quick Draw.' }, { status: 400 });
  }
}
