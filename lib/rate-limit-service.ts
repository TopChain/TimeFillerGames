import 'server-only';

import { createHash } from 'node:crypto';
import { createAdminClient } from './supabase/admin';

function compact(value: string) {
  return createHash('sha256').update(value).digest('hex').slice(0, 32);
}

export function rateLimitBucket(scope: string, identity: string, resource?: string) {
  const safeScope = scope.replace(/[^a-z0-9:_-]/gi, '').slice(0, 48) || 'request';
  return [safeScope, compact(identity), resource ? compact(resource) : null].filter(Boolean).join(':');
}

export async function consumeServerRateLimit(options: {
  scope: string;
  identity: string;
  resource?: string;
  limit: number;
  windowSeconds: number;
  message?: string;
}) {
  const admin = createAdminClient();
  const bucket = rateLimitBucket(options.scope, options.identity, options.resource);
  const { data, error } = await admin.rpc('consume_server_rate_limit', {
    p_bucket_key: bucket,
    p_limit: options.limit,
    p_window_seconds: options.windowSeconds,
  });
  if (error) throw new Error(`Rate-limit service unavailable: ${error.message}`);
  if (data !== true) throw new Error(options.message ?? 'Too many requests. Try again shortly.');
}
