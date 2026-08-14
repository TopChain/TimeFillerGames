import { createHash } from 'node:crypto';

function compact(value: string) {
  return createHash('sha256').update(value).digest('hex').slice(0, 32);
}

export function rateLimitBucket(scope: string, identity: string, resource?: string) {
  const safeScope = scope.replace(/[^a-z0-9:_-]/gi, '').slice(0, 48) || 'request';
  return [safeScope, compact(identity), resource ? compact(resource) : null].filter(Boolean).join(':');
}
