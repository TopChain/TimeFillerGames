import { NextResponse } from 'next/server';
import { revealMajorityQuestion } from '@/lib/majority-match-service';
import { requireHostUser } from '@/lib/supabase/auth';

export async function POST(request: Request, context: { params: Promise<{ code: string }> }) {
  try {
    const host = await requireHostUser(request);
    if (!host) return NextResponse.json({ error: 'A signed-in Host is required to reveal results.' }, { status: 401 });
    const { code } = await context.params;
    const body = await request.json().catch(() => ({})) as { force?: unknown };
    return NextResponse.json(await revealMajorityQuestion(code, host.id, body.force === true));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not reveal Majority Match result.' }, { status: 400 });
  }
}
