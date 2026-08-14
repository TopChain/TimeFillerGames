import { NextResponse } from 'next/server';
import { endStandardBingo } from '@/lib/bingo-service';
import { requireHostUser } from '@/lib/supabase/auth';

export async function POST(request: Request, context: { params: Promise<{ code: string }> }) {
  try {
    const host = await requireHostUser(request);
    if (!host) return NextResponse.json({ error: 'A signed-in Host is required to end Bingo.' }, { status: 401 });
    const { code } = await context.params;
    return NextResponse.json(await endStandardBingo(code, host.id));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not end Bingo.' }, { status: 400 });
  }
}
