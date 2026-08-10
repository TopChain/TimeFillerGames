import { NextResponse } from 'next/server';
import { getQuickDrawState, startQuickDraw } from '@/lib/quick-draw-service';
import { requireHostUser, requireUser } from '@/lib/supabase/auth';

export async function GET(request: Request, context: { params: Promise<{ code: string }> }) {
  try {
    const user = await requireUser(request);
    if (!user) return NextResponse.json({ error: 'Authentication is required to view Quick Draw state.' }, { status: 401 });
    const { code } = await context.params;
    return NextResponse.json(await getQuickDrawState(code, user.id), { headers: { 'cache-control': 'no-store' } });
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
    return NextResponse.json(await startQuickDraw(code, host.id, {
      drawingSeconds: body.drawingSeconds,
      artistTurns: body.artistTurns,
      artistSelection: body.artistSelection,
      wordCategory: body.wordCategory,
      wordDifficulty: body.wordDifficulty,
      guessVisibility: body.guessVisibility,
      audienceGuessing: body.audienceGuessing,
      timeBonus: body.timeBonus,
    }), { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not start Quick Draw.' }, { status: 400 });
  }
}
