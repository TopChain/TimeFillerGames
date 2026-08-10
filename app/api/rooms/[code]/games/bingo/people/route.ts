import { NextResponse } from 'next/server';
import { getPeopleBingoState, startPeopleBingo } from '@/lib/people-bingo-service';
import { requireHostUser, requireUser } from '@/lib/supabase/auth';

export async function GET(request: Request, context: { params: Promise<{ code: string }> }) {
  try {
    const user = await requireUser(request);
    if (!user) return NextResponse.json({ error: 'Authentication is required to view People Bingo state.' }, { status: 401 });
    const { code } = await context.params;
    return NextResponse.json(await getPeopleBingoState(code, user.id), { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not load People Bingo.' }, { status: 400 });
  }
}

export async function POST(request: Request, context: { params: Promise<{ code: string }> }) {
  try {
    const host = await requireHostUser(request);
    if (!host) return NextResponse.json({ error: 'A signed-in Host is required to start People Bingo.' }, { status: 401 });
    const { code } = await context.params;
    const body = await request.json() as { cardChoiceSeconds?: unknown };
    return NextResponse.json(await startPeopleBingo(code, host.id, { cardChoiceSeconds: body.cardChoiceSeconds }), { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not start People Bingo.' }, { status: 400 });
  }
}
