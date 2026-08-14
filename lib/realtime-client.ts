'use client';

import type { RealtimeChannel } from '@supabase/supabase-js';
import { getBrowserSupabase } from './supabase/browser';

export type PresenceMember = {
  participantId?: string;
  userId: string;
  role: 'host' | 'participant' | 'spectator' | 'cohost';
  nickname?: string;
  onlineAt: string;
};

type RoomRealtimeOptions = {
  accessToken: string;
  roomId: string;
  roomCode: string;
  userId: string;
  participantId?: string;
  nickname?: string;
  role: PresenceMember['role'];
  onChange?: () => void;
  onPresence?: (members: PresenceMember[]) => void;
  onStatus?: (status: string) => void;
};

function flattenPresence(state: Record<string, unknown[]>): PresenceMember[] {
  return Object.values(state)
    .flat()
    .filter((entry): entry is PresenceMember => Boolean(entry && typeof entry === 'object' && 'userId' in entry));
}

export async function subscribeToRoom(options: RoomRealtimeOptions): Promise<() => Promise<void>> {
  const supabase = getBrowserSupabase();
  supabase.realtime.setAuth(options.accessToken);

  const channel: RealtimeChannel = supabase.channel(`room:${options.roomCode}`, {
    config: {
      private: true,
      presence: { key: options.participantId ?? `host:${options.userId}` },
    },
  });

  channel
    .on('presence', { event: 'sync' }, () => {
      options.onPresence?.(flattenPresence(channel.presenceState() as Record<string, unknown[]>));
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${options.roomId}` }, () => options.onChange?.())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'participants', filter: `room_id=eq.${options.roomId}` }, () => options.onChange?.())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'game_sessions', filter: `room_id=eq.${options.roomId}` }, () => options.onChange?.());

  channel.subscribe(async (status) => {
    options.onStatus?.(status);
    if (status === 'SUBSCRIBED') {
      await channel.track({
        participantId: options.participantId,
        userId: options.userId,
        role: options.role,
        nickname: options.nickname,
        onlineAt: new Date().toISOString(),
      } satisfies PresenceMember);
    }
  });

  return async () => {
    await channel.untrack().catch(() => undefined);
    await supabase.removeChannel(channel);
  };
}
