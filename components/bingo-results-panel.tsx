'use client';

import { useEffect, useState } from 'react';
import { BINGO_RESULT_UI_COPY } from '@/lib/bingo-result-ui-copy';
import { fetchBingo, type BingoSnapshot } from '@/lib/client-bingo';
import { fetchLatestBingoMode } from '@/lib/client-people-bingo';
import { usePlayerUiLocale } from '@/lib/use-player-ui-locale';
import { PeopleBingoResultsPanel } from './people-bingo-results-panel';

export function BingoResultsPanel({ accessToken, roomCode, participantId }: { accessToken: string; roomCode: string; participantId?: string | null }) {
  const locale = usePlayerUiLocale(accessToken, roomCode);
  const copy = BINGO_RESULT_UI_COPY[locale];
  const [mode, setMode] = useState<'standard-number' | 'people' | null>(null);
  const [modeError, setModeError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchLatestBingoMode(accessToken, roomCode)
      .then((result) => { if (!cancelled) setMode(result.mode); })
      .catch((cause) => { if (!cancelled) setModeError(cause instanceof Error ? cause.message : 'Could not identify Bingo mode.'); });
    return () => { cancelled = true; };
  }, [accessToken, roomCode]);

  if (mode === 'people') return <PeopleBingoResultsPanel accessToken={accessToken} roomCode={roomCode} participantId={participantId} />;
  if (mode === 'standard-number') return <StandardBingoResultsPanel accessToken={accessToken} roomCode={roomCode} participantId={participantId} />;
  return <div className="notice">{modeError ?? copy.loading}</div>;
}

function StandardBingoResultsPanel({ accessToken, roomCode, participantId }: { accessToken: string; roomCode: string; participantId?: string | null }) {
  const locale = usePlayerUiLocale(accessToken, roomCode);
  const copy = BINGO_RESULT_UI_COPY[locale];
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
  if (!snapshot) return <div className="notice">{copy.loading}</div>;

  const winners = snapshot.session.winners;
  const own = participantId ? winners.find((winner) => winner.participant_id === participantId) : null;

  return <div className="bingo-results">
    {participantId && <div className="private-result">
      <span>{copy.privateResult}</span>
      <strong>{own ? `#${own.placement}` : copy.noWinningLine}</strong>
      <small>{own ? `${copy.completedOnDraw} ${own.completing_draw_index + 1}. ${copy.sameDrawShares}` : copy.noLineBeforeEnd}</small>
    </div>}

    <div className="winner-list">
      {winners.length === 0 && <div className="notice">{copy.noWinnerRecorded}</div>}
      {winners.map((winner) => <div className="control-row" key={winner.participant_id}>
        <span>#{winner.placement} {winner.nickname}</span>
        <strong>{copy.draw} {winner.completing_draw_index + 1}</strong>
      </div>)}
    </div>
  </div>;
}
