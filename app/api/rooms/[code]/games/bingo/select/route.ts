import { NextResponse } from 'next/server';
import { selectStandardBingoCard } from '@/lib/bingo-service';
import { requireUser } from '@/lib/supabase/auth';

export async function POST(request: Request, context: { params: Promise<{ code: string }> }) {
  try {
    const user = await requireUser(request);
    if (!user) return NextResponse.json({ error: 'Authentication is required to select a Bingo card.' }, { status: 401 });
    const { code } = await context.params;
    const body = await request.json() as { candidateIndex?: unknown };
    return NextResponse.json(await selectStandardBingoCard(code, user.id, body.candidateIndex));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not select Bingo card.' }, { status: 400 });
  }
}
