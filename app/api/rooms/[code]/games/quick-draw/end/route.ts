import { NextResponse } from 'next/server';
import { endQuickDraw } from '@/lib/quick-draw-service';
import { requireHostUser } from '@/lib/supabase/auth';

export async function POST(request: Request, context: { params: Promise<{ code: string }> }) {
  try {
    const host = await requireHostUser(request);
    if (!host) return NextResponse.json({ error: 'A signed-in Host is required to end Quick Draw.' }, { status: 401 });
    const { code } = await context.params;
    return NextResponse.json(await endQuickDraw(code, host.id));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not end Quick Draw.' }, { status: 400 });
  }
}
