import { NextResponse } from 'next/server';
import { heartbeatHost } from '@/lib/host-recovery-service';
import { requireHostUser } from '@/lib/supabase/auth';

export async function POST(request: Request, context: { params: Promise<{ code: string }> }) {
  try {
    const host = await requireHostUser(request);
    if (!host) return NextResponse.json({ error: 'A signed-in Host is required.' }, { status: 401 });
    const { code } = await context.params;
    return NextResponse.json(await heartbeatHost(code, host.id));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Host heartbeat failed.' }, { status: 400 });
  }
}
