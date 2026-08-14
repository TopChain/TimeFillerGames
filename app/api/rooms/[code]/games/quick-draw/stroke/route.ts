import { NextResponse } from 'next/server';
import { submitQuickDrawStroke } from '@/lib/quick-draw-service';
import { requireUser } from '@/lib/supabase/auth';

export async function POST(request: Request, context: { params: Promise<{ code: string }> }) {
  try {
    const user = await requireUser(request);
    if (!user) return NextResponse.json({ error: 'Authentication is required to draw.' }, { status: 401 });
    const { code } = await context.params;
    const body = await request.json() as { payload?: unknown };
    return NextResponse.json(await submitQuickDrawStroke(code, user.id, body.payload));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not sync drawing input.' }, { status: 400 });
  }
}
