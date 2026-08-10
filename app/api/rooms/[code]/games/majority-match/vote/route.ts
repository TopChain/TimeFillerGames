import { NextResponse } from 'next/server';
import { submitMajorityVote } from '@/lib/majority-match-service';
import { requireUser } from '@/lib/supabase/auth';

export async function POST(request: Request, context: { params: Promise<{ code: string }> }) {
  try {
    const user = await requireUser(request);
    if (!user) return NextResponse.json({ error: 'Authentication is required to vote.' }, { status: 401 });
    const { code } = await context.params;
    const body = await request.json() as { choice?: unknown };
    return NextResponse.json(await submitMajorityVote(code, user.id, body.choice));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not submit prediction.' }, { status: 400 });
  }
}
