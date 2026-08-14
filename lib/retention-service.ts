import 'server-only';

import { createAdminClient } from './supabase/admin';

export type RetentionCleanupResult = {
  deletedRooms: number;
  deletedRateLimitBuckets: number;
  cutoff: string;
};

export async function cleanupExpiredRelease1Data(now = new Date()): Promise<RetentionCleanupResult> {
  const admin = createAdminClient();
  const cutoff = now.toISOString();

  const { data: expiredRooms, error: roomLookupError } = await admin
    .from('rooms')
    .select('id')
    .lt('expires_at', cutoff)
    .limit(500);
  if (roomLookupError) throw new Error(roomLookupError.message);

  const roomIds = (expiredRooms ?? []).map((room) => room.id);
  if (roomIds.length) {
    const { error: roomDeleteError } = await admin.from('rooms').delete().in('id', roomIds);
    if (roomDeleteError) throw new Error(roomDeleteError.message);
  }

  const bucketCutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const { data: deletedBuckets, error: bucketDeleteError } = await admin
    .from('server_rate_limits')
    .delete()
    .lt('updated_at', bucketCutoff)
    .select('bucket_key');
  if (bucketDeleteError) throw new Error(bucketDeleteError.message);

  return {
    deletedRooms: roomIds.length,
    deletedRateLimitBuckets: deletedBuckets?.length ?? 0,
    cutoff,
  };
}
