import { NextResponse } from 'next/server';
import { endPeopleBingo } from '@/lib/people-bingo-service';
import { requireHostUser } from '@/lib/supabase/auth';

export async function POST(request: Request, context: { params: Promise<{ code: string }> }) {
  try {
    const host = await requireHostUser(request);
    if (!host) return NextResponse.json({ error: 'A signed-in Host is required to end People Bingo.' }, { status: 401 });
    const { code } = await context.params;
    return NextResponse.json(await endPeopleBingo(code, host.id));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not end People Bingo.' }, { status: 400 });
  }
}
