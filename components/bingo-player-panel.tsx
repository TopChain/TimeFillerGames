'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchBingo, selectBingoCard, type BingoSnapshot } from '@/lib/client-bingo';
import { fetchLatestBingoMode } from '@/lib/client-people-bingo';
import { BingoBoard } from './bingo-board';
import { PeopleBingoPlayerPanel } from './people-bingo-player-panel';

export function BingoPlayerPanel({ accessToken, roomCode, participantId }: { accessToken: string; roomCode: string; participantId: string }) {
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
  return <section className="panel bingo-live-panel"><div className="eyebrow">Bingo</div><h2>Loading Bingo mode…</h2>{modeError && <div className="notice warning" role="alert">{modeError}</div>}</section>;
}

function StandardBingoPlayerPanel({ accessToken, roomCode, participantId }: { accessToken: string; roomCode: string; participantId: string }) {
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

  if (!snapshot) {
    return <section className="panel bingo-live-panel"><div className="eyebrow">Standard Bingo</div><h2>Waiting for the Host to start the round.</h2>{error && <div className="notice warning" role="alert">{error}</div>}</section>;
  }

  const { session, ownCard } = snapshot;
  const paused = snapshot.room.status === 'paused' || session.status === 'paused';
  if (!ownCard) return <section className="panel bingo-live-panel"><div className="eyebrow">Standard Bingo</div><h2>Spectator view</h2>{paused && <div className="notice warning">The Host paused the game.</div>}<p className="support">This seat does not have an active Bingo card in the current round.</p></section>;

  if (session.state.phase === 'card-selection' && !ownCard.selected_card) {
    const expired = remaining <= 0;
    return <section className="panel bingo-live-panel player-bingo">
      <div className="eyebrow">Choose your card</div><h2>{paused ? `Paused · ${remaining}s saved` : expired ? 'Selection closed' : `${remaining}s remaining`}</h2>
      {paused && <div className="notice warning">The Host paused the room. Card selection is frozen and will resume with the same remaining time.</div>}
      <p className="support">{expired ? 'The timer expired. Waiting for the server to lock an automatic card assignment.' : 'Choose one of your three personal candidate cards. If time expires, the server assigns one automatically.'}</p>
      {error && <div className="notice warning" role="alert">{error}</div>}
      <div className="candidate-grid">{ownCard.candidate_cards.map((card, index) => <button className="candidate-card" disabled={busy || expired || paused} onClick={() => void choose(index)} key={index}><span className="pill">Card {index + 1}</span><BingoBoard numbers={card} size={session.config.boardSize} compact /><strong>{paused ? 'Paused' : expired ? 'Waiting…' : `Select card ${index + 1}`}</strong></button>)}</div>
    </section>;
  }

  const card = ownCard.selected_card ?? ownCard.candidate_cards[ownCard.selected_candidate ?? 0];
  const ownWinner = session.winners.find((winner) => winner.participant_id === participantId);
  return <section className="panel bingo-live-panel player-bingo">
    <div className="live-line"><span className="live-dot" /> {paused ? 'PAUSED · STANDARD BINGO' : session.state.phase === 'ended' ? 'ROUND ENDED' : 'LIVE STANDARD BINGO'}</div>
    {paused && <div className="notice warning">The Host paused the game. Your board stays locked and no new number can be drawn until resume.</div>}
    <div className="bingo-callout draw"><span>Latest draw</span><strong>{session.state.latestDraw ?? '—'}</strong></div>
    <BingoBoard numbers={card} size={session.config.boardSize} drawn={session.state.drawn} />
    <div className="meta"><span className="pill">Draws {session.state.drawn.length}</span><span className="pill">Automatically marked</span><span className="pill">One line wins</span></div>
    {ownWinner && <div className="notice success">You earned shared placement #{ownWinner.placement} on draw {ownWinner.completing_draw_index + 1}.</div>}
    {session.winners.length > 0 && <div className="winner-list">{session.winners.slice(0, 3).map((winner) => <div className="control-row" key={winner.participant_id}><span>#{winner.placement} {winner.nickname}</span><strong>Winner</strong></div>)}</div>}
  </section>;
}
