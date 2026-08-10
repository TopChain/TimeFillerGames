'use client';

import { AVATARS } from '@/lib/room-flow';
import type { PeopleDirectoryEntry } from '@/lib/client-people-bingo';

function avatarFor(key: string | null) {
  if (!key) return '🙂';
  return AVATARS.find((avatar) => avatar.id === key)?.emoji ?? '🙂';
}

export function PeopleBingoBoard({
  participantIds,
  directory,
  drawn = [],
  compact = false,
}: {
  participantIds: string[];
  directory: Record<string, PeopleDirectoryEntry>;
  drawn?: string[];
  compact?: boolean;
}) {
  const drawnSet = new Set(drawn);
  return <div className={`people-bingo-board ${compact ? 'compact' : ''}`} role="grid" aria-label="People Bingo card">
    {participantIds.map((participantId, index) => {
      const person = directory[participantId] ?? { nickname: 'Player', avatarKey: null };
      const marked = drawnSet.has(participantId);
      return <div
        key={`${participantId}-${index}`}
        className={`people-bingo-cell ${marked ? 'marked' : ''}`}
        role="gridcell"
        aria-label={`${person.nickname}${marked ? ', drawn and marked' : ''}`}
      >
        <span className="people-bingo-avatar" aria-hidden="true">{avatarFor(person.avatarKey)}</span>
        <strong>{person.nickname}</strong>
        {marked && <span className="people-bingo-check" aria-label="Marked">✓</span>}
      </div>;
    })}
  </div>;
}
