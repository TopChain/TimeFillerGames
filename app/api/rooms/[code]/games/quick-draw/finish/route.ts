import { NextResponse } from 'next/server';
import { finishQuickDrawRound } from '@/lib/quick-draw-service';
import { requireHostUser } from '@/lib/supabase/auth';

export async function POST(request: Request, context: { params: Promise<{ code: string }> }) {
  try {
    const host = await requireHostUser(request);
    if (!host) return NextResponse.json({ error: 'A signed-in Host is required to finish the drawing turn.' }, { status: 401 });
    const { code } = await context.params;
    const body = await request.json().catch(() => ({})) as { force?: unknown };
    return NextResponse.json(await finishQuickDrawRound(code, host.id, body.force === true));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not finish the drawing turn.' }, { status: 400 });
  }
}
