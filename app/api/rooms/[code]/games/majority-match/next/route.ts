import { NextResponse } from 'next/server';
import { promotePendingMajorityLateJoiners } from '@/lib/majority-late-join-service';
import { advanceMajorityQuestion } from '@/lib/majority-match-service';
import { requireHostUser } from '@/lib/supabase/auth';

export async function POST(request: Request, context: { params: Promise<{ code: string }> }) {
  try {
    const host = await requireHostUser(request);
    if (!host) return NextResponse.json({ error: 'A signed-in Host is required to advance the game.' }, { status: 401 });
    const { code } = await context.params;
    await promotePendingMajorityLateJoiners(code, host.id);
    return NextResponse.json(await advanceMajorityQuestion(code, host.id));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not advance Majority Match.' }, { status: 400 });
  }
}
