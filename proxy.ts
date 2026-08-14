import { NextRequest, NextResponse } from 'next/server';
import { corsResponseHeaders, isAllowedApiOrigin } from '@/lib/api-cors';

function applyHeaders(response: NextResponse, origin: string) {
  for (const [key, value] of Object.entries(corsResponseHeaders(origin))) response.headers.set(key, value);
  return response;
}

export function proxy(request: NextRequest) {
  const origin = request.headers.get('origin');

  if (request.method === 'OPTIONS') {
    if (!origin || !isAllowedApiOrigin(origin)) {
      return new NextResponse(null, { status: 403, headers: { 'cache-control': 'no-store' } });
    }
    return applyHeaders(new NextResponse(null, { status: 204 }), origin);
  }

  const response = NextResponse.next();
  if (origin && isAllowedApiOrigin(origin)) applyHeaders(response, origin);
  return response;
}

export const config = {
  matcher: '/api/:path*',
};
