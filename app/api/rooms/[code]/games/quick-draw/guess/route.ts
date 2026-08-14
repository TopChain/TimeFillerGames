import { NextResponse } from 'next/server';
import { submitQuickDrawGuess } from '@/lib/quick-draw-service';
import { requireUser } from '@/lib/supabase/auth';

export async function POST(request: Request, context: { params: Promise<{ code: string }> }) {
  try {
    const user = await requireUser(request);
    if (!user) return NextResponse.json({ error: 'Authentication is required to guess.' }, { status: 401 });
    const { code } = await context.params;
    const body = await request.json() as { guess?: unknown };
    return NextResponse.json(await submitQuickDrawGuess(code, user.id, body.guess));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not submit Quick Draw guess.' }, { status: 400 });
  }
}
