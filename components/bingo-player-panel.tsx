'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { BINGO_UI_COPY } from '@/lib/bingo-ui-copy';
import { fetchBingo, selectBingoCard, type BingoSnapshot } from '@/lib/client-bingo';
import { fetchLatestBingoMode } from '@/lib/client-people-bingo';
import { usePlayerUiLocale } from '@/lib/use-player-ui-locale';
import { BingoBoard } from './bingo-board';
import { PeopleBingoPlayerPanel } from './people-bingo-player-panel';

export function BingoPlayerPanel({ accessToken, roomCode, participantId }: { accessToken: string; roomCode: string; participantId: string }) {
  const locale = usePlayerUiLocale(accessToken, roomCode);
  const copy = BINGO_UI_COPY[locale];
  const [mode, setMode] = useState<'standard-number' | 'people' | null>(null);
  const [modeError, setModeError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchLatestBingoMode(accessToken, roomCode)
      .then((result) => { if (!cancelled) setMode(result.mode); })
      .catch((cause) => { if (!cancelled) setModeError(cause instanceof Error ? cause.message : 'Could not identify Bingo mode.'); });
    return () => { cancelled = true; };
  }, [accessToken, roomCode]);

  if (mode === 'people') return <PeopleBingoPlayerPanel accessToken={accessToken} roomCode={roomCode} participantId={participantId} />;
  if (mode === 'standard-number') return <StandardBingoPlayerPanel accessToken={accessToken} roomCode={roomCode} participantId={participantId} />;
  return <section className="panel bingo-live-panel"><div className="eyebrow">Bingo</div><h2>{copy.loadingMode}</h2>{modeError && <div className="notice warning" role="alert">{modeError}</div>}</section>;
}

function StandardBingoPlayerPanel({ accessToken, roomCode, participantId }: { accessToken: string; roomCode: string; participantId: string }) {
  const locale = usePlayerUiLocale(accessToken, roomCode);
  const copy = BINGO_UI_COPY[locale];
  const [snapshot, setSnapshot] = useState<BingoSnapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  const refresh = useCallback(async () => {
    try {
      setSnapshot(await fetchBingo(accessToken, roomCode));
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load Bingo.');
    }
  }, [accessToken, roomCode]);

  useEffect(() => {
    void refresh();
    const poll = window.setInterval(() => void refresh(), 1500);
    const clock = window.setInterval(() => setNow(Date.now()), 250);
    return () => {
      window.clearInterval(poll);
      window.clearInterval(clock);
    };
  }, [refresh]);

  const remaining = useMemo(() => {
    if (!snapshot) return 0;
    const reference = snapshot.room.status === 'paused' && snapshot.session.state.pauseStartedAt
      ? new Date(snapshot.session.state.pauseStartedAt).getTime()
      : now;
    return Math.max(0, Math.ceil((new Date(snapshot.session.state.selectionDeadline).getTime() - reference) / 1000));
  }, [now, snapshot]);

  async function choose(index: number) {
    setBusy(true);
    setError(null);
    try {
      setSnapshot(await selectBingoCard(accessToken, roomCode, index));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not lock this card.');
    } finally {
      setBusy(false);
    }
  }

  if (!snapshot) return <section className="panel bingo-live-panel"><div className="eyebrow">{copy.standardTitle}</div><h2>{copy.waitingStart}</h2>{error && <div className="notice warning" role="alert">{error}</div>}</section>;

  const { session, ownCard } = snapshot;
  const paused = snapshot.room.status === 'paused' || session.status === 'paused';
  if (!ownCard) return <section className="panel bingo-live-panel"><div className="eyebrow">{copy.standardTitle}</div><h2>{copy.spectatorView}</h2>{paused && <div className="notice warning">{copy.paused}</div>}<p className="support">{copy.noActiveCard}</p></section>;

  if (session.state.phase === 'card-selection' && !ownCard.selected_card) {
    const expired = remaining <= 0;
    return <section className="panel bingo-live-panel player-bingo">
      <div className="eyebrow">{copy.chooseCard}</div><h2>{paused ? `${copy.paused} · ${remaining}s ${copy.pausedSaved}` : expired ? copy.selectionClosed : `${remaining}s ${copy.remaining}`}</h2>
      {paused && <div className="notice warning">{copy.pauseSelection}</div>}
      <p className="support">{expired ? copy.serverAssigning : copy.standardChoiceHelp}</p>
      {error && <div className="notice warning" role="alert">{error}</div>}
      <div className="candidate-grid">{ownCard.candidate_cards.map((card, index) => <button className="candidate-card" disabled={busy || expired || paused} onClick={() => void choose(index)} key={index}><span className="pill">{copy.card} {index + 1}</span><BingoBoard numbers={card} size={session.config.boardSize} compact /><strong>{paused ? copy.paused : expired ? copy.waiting : `${copy.select} ${copy.card.toLocaleLowerCase(locale)} ${index + 1}`}</strong></button>)}</div>
    </section>;
  }

  const card = ownCard.selected_card ?? ownCard.candidate_cards[ownCard.selected_candidate ?? 0];
  const ownWinner = session.winners.find((winner) => winner.participant_id === participantId);
  return <section className="panel bingo-live-panel player-bingo">
    <div className="live-line"><span className="live-dot" /> {paused ? `${copy.paused} · ${copy.standardTitle}` : session.state.phase === 'ended' ? copy.roundEnded : copy.liveStandard}</div>
    {paused && <div className="notice warning">{copy.pauseBoardStandard}</div>}
    <div className="bingo-callout draw"><span>{copy.latestDraw}</span><strong>{session.state.latestDraw ?? '—'}</strong></div>
    <BingoBoard numbers={card} size={session.config.boardSize} drawn={session.state.drawn} />
    <div className="meta"><span className="pill">{copy.draws} {session.state.drawn.length}</span><span className="pill">{copy.autoMarking}</span><span className="pill">{copy.oneLineWins}</span></div>
    {ownWinner && <div className="notice success">{copy.sharedPlacement} #{ownWinner.placement} {copy.onDraw} {ownWinner.completing_draw_index + 1}.</div>}
    {session.winners.length > 0 && <div className="winner-list">{session.winners.slice(0, 3).map((winner) => <div className="control-row" key={winner.participant_id}><span>#{winner.placement} {winner.nickname}</span><strong>{copy.winner}</strong></div>)}</div>}
  </section>;
}
