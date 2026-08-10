import { NextResponse } from 'next/server';
import { getMajorityMatchState, startMajorityMatch } from '@/lib/majority-match-service';
import { requireHostUser, requireUser } from '@/lib/supabase/auth';

export async function GET(request: Request, context: { params: Promise<{ code: string }> }) {
  try {
    const user = await requireUser(request);
    if (!user) return NextResponse.json({ error: 'Authentication is required to view Majority Match state.' }, { status: 401 });
    const { code } = await context.params;
    return NextResponse.json(await getMajorityMatchState(code, user.id), { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not load Majority Match.' }, { status: 400 });
  }
}

export async function POST(request: Request, context: { params: Promise<{ code: string }> }) {
  try {
    const host = await requireHostUser(request);
    if (!host) return NextResponse.json({ error: 'A signed-in Host is required to start Majority Match.' }, { status: 401 });
    const { code } = await context.params;
    const body = await request.json() as Record<string, unknown>;
    const result = await startMajorityMatch(code, host.id, {
      category: body.category,
      questionCount: body.questionCount,
      answerSeconds: body.answerSeconds,
      anonymousResults: body.anonymousResults,
      showPercentages: body.showPercentages,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not start Majority Match.' }, { status: 400 });
  }
}
