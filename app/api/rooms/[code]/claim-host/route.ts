import { NextResponse } from 'next/server';
import { claimHostAfterDisconnect } from '@/lib/host-recovery-service';
import { consumeServerRateLimit } from '@/lib/rate-limit-service';
import { requireUser } from '@/lib/supabase/auth';

export async function POST(request: Request, context: { params: Promise<{ code: string }> }) {
  try {
    const user = await requireUser(request);
    if (!user) return NextResponse.json({ error: 'Authentication is required.' }, { status: 401 });
    const { code } = await context.params;
    await consumeServerRateLimit({ scope: 'host-recovery', identity: user.id, resource: code, limit: 6, windowSeconds: 60, message: 'Too many Host recovery attempts. Wait briefly and try again.' });
    return NextResponse.json(await claimHostAfterDisconnect(code, user.id));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not recover Host control.' }, { status: 400 });
  }
}
