'use client';

import { useEffect, useState } from 'react';
import { fetchBingo, type BingoSnapshot } from '@/lib/client-bingo';

export function BingoResultsPanel({ accessToken, roomCode, participantId }: { accessToken: string; roomCode: string; participantId?: string | null }) {
  const [snapshot, setSnapshot] = useState<BingoSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchBingo(accessToken, roomCode)
      .then((next) => { if (!cancelled) setSnapshot(next); })
      .catch((cause) => { if (!cancelled) setError(cause instanceof Error ? cause.message : 'Could not load Bingo results.'); });
    return () => { cancelled = true; };
  }, [accessToken, roomCode]);

  if (error) return <div className="notice warning" role="alert">{error}</div>;
  if (!snapshot) return <div className="notice">Loading server results…</div>;

  const winners = snapshot.session.winners;
  const own = participantId ? winners.find((winner) => winner.participant_id === participantId) : null;

  return <div className="bingo-results">
    {participantId && <div className="private-result">
      <span>Your private result</span>
      <strong>{own ? `#${own.placement}` : 'No winning line'}</strong>
      <small>{own ? `Completed on server draw ${own.completing_draw_index + 1}. Players completing on the same draw share placement.` : 'The server did not record a winning line for this card before the Host ended the round.'}</small>
    </div>}

    <div className="winner-list">
      {winners.length === 0 && <div className="notice">No winning line was recorded before the Host ended the round.</div>}
      {winners.map((winner) => <div className="control-row" key={winner.participant_id}>
        <span>#{winner.placement} {winner.nickname}</span>
        <strong>Draw {winner.completing_draw_index + 1}</strong>
      </div>)}
    </div>
  </div>;
}
