'use client';

import { useEffect, useState } from 'react';
import { fetchPeopleBingo, type PeopleBingoSnapshot } from '@/lib/client-people-bingo';
import { AVATARS } from '@/lib/room-flow';

function avatarFor(key: string | null) {
  return AVATARS.find((avatar) => avatar.id === key)?.emoji ?? '🙂';
}

export function PeopleBingoResultsPanel({ accessToken, roomCode, participantId }: { accessToken: string; roomCode: string; participantId?: string | null }) {
  const [snapshot, setSnapshot] = useState<PeopleBingoSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchPeopleBingo(accessToken, roomCode)
      .then((next) => { if (!cancelled) setSnapshot(next); })
      .catch((cause) => { if (!cancelled) setError(cause instanceof Error ? cause.message : 'Could not load People Bingo results.'); });
    return () => { cancelled = true; };
  }, [accessToken, roomCode]);

  if (error) return <div className="notice warning" role="alert">{error}</div>;
  if (!snapshot) return <div className="notice">Loading People Bingo results…</div>;

  const own = participantId ? snapshot.session.winners.find((winner) => winner.participant_id === participantId) : null;
  return <div className="people-bingo-results">
    {participantId && <div className="private-result"><span>Your private result</span><strong>{own ? `#${own.placement}` : 'No winning line'}</strong><small>{own ? `Your line completed on server draw ${own.completing_draw_index + 1}. Same-draw winners share placement.` : 'The server did not record a completed line before the Host ended the round.'}</small></div>}
    <div className="winner-list">
      {snapshot.session.winners.length === 0 && <div className="notice">No winning line was recorded before the Host ended the round.</div>}
      {snapshot.session.winners.map((winner) => <div className="control-row" key={winner.participant_id}><span>#{winner.placement} {avatarFor(winner.avatarKey)} {winner.nickname}</span><strong>Draw {winner.completing_draw_index + 1}</strong></div>)}
    </div>
  </div>;
}
