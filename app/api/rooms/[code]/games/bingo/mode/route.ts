import { NextResponse } from 'next/server';
import { getLatestBingoMode } from '@/lib/people-bingo-service';
import { requireUser } from '@/lib/supabase/auth';

export async function GET(request: Request, context: { params: Promise<{ code: string }> }) {
  try {
    const user = await requireUser(request);
    if (!user) return NextResponse.json({ error: 'Authentication is required to inspect Bingo mode.' }, { status: 401 });
    const { code } = await context.params;
    return NextResponse.json(await getLatestBingoMode(code, user.id), { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not inspect Bingo mode.' }, { status: 400 });
  }
}
