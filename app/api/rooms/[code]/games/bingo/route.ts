import { NextResponse } from 'next/server';
import { getStandardBingoState, startStandardBingo } from '@/lib/bingo-service';
import { requireHostUser, requireUser } from '@/lib/supabase/auth';

export async function GET(request: Request, context: { params: Promise<{ code: string }> }) {
  try {
    const user = await requireUser(request);
    if (!user) return NextResponse.json({ error: 'Authentication is required to view Bingo state.' }, { status: 401 });
    const { code } = await context.params;
    return NextResponse.json(await getStandardBingoState(code, user.id), { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not load Bingo.' }, { status: 400 });
  }
}

export async function POST(request: Request, context: { params: Promise<{ code: string }> }) {
  try {
    const host = await requireHostUser(request);
    if (!host) return NextResponse.json({ error: 'A signed-in Host is required to start Bingo.' }, { status: 401 });
    const { code } = await context.params;
    const body = await request.json() as { boardSize?: unknown; cardChoiceSeconds?: unknown };
    const result = await startStandardBingo(code, host.id, body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not start Bingo.' }, { status: 400 });
  }
}
