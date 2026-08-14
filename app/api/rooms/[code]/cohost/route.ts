import { NextResponse } from 'next/server';
import { designateCoHost, getHostRecoveryState, revokeCoHost } from '@/lib/host-recovery-service';
import { consumeServerRateLimit } from '@/lib/rate-limit-service';
import { requireHostUser, requireUser } from '@/lib/supabase/auth';

export async function GET(request: Request, context: { params: Promise<{ code: string }> }) {
  try {
    const user = await requireUser(request);
    if (!user) return NextResponse.json({ error: 'Authentication is required.' }, { status: 401 });
    const { code } = await context.params;
    return NextResponse.json(await getHostRecoveryState(code, user.id), { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not load Host recovery state.' }, { status: 400 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ code: string }> }) {
  try {
    const host = await requireHostUser(request);
    if (!host) return NextResponse.json({ error: 'A signed-in Host is required.' }, { status: 401 });
    const { code } = await context.params;
    await consumeServerRateLimit({ scope: 'cohost-management', identity: host.id, resource: code, limit: 20, windowSeconds: 60, message: 'Too many co-host changes. Wait briefly and try again.' });
    const body = await request.json() as { participantId?: unknown };
    const participantId = String(body.participantId ?? '').trim();
    if (!participantId) return NextResponse.json({ error: 'Participant ID is required.' }, { status: 400 });
    return NextResponse.json(await designateCoHost(code, host.id, participantId));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not designate co-host.' }, { status: 400 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ code: string }> }) {
  try {
    const host = await requireHostUser(request);
    if (!host) return NextResponse.json({ error: 'A signed-in Host is required.' }, { status: 401 });
    const { code } = await context.params;
    await consumeServerRateLimit({ scope: 'cohost-management', identity: host.id, resource: code, limit: 20, windowSeconds: 60, message: 'Too many co-host changes. Wait briefly and try again.' });
    const body = await request.json() as { participantId?: unknown };
    const participantId = String(body.participantId ?? '').trim();
    if (!participantId) return NextResponse.json({ error: 'Participant ID is required.' }, { status: 400 });
    return NextResponse.json(await revokeCoHost(code, host.id, participantId));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not revoke co-host.' }, { status: 400 });
  }
}
