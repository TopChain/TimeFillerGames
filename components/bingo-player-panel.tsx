'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchBingo, selectBingoCard, type BingoSnapshot } from '@/lib/client-bingo';
import { BingoBoard } from './bingo-board';

export function BingoPlayerPanel({ accessToken, roomCode }: { accessToken: string; roomCode: string }) {
  const [snapshot, setSnapshot] = useState<BingoSnapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  const refresh = useCallback(async () => {
    try { setSnapshot(await fetchBingo(accessToken, roomCode)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load Bingo.'); }
  }, [accessToken, roomCode]);

  useEffect(() => {
    void refresh();
    const poll = window.setInterval(() => void refresh(), 1500);
    const clock = window.setInterval(() => setNow(Date.now()), 250);
    return () => { window.clearInterval(poll); window.clearInterval(clock); };
  }, [refresh]);

  const remaining = useMemo(() => snapshot ? Math.max(0, Math.ceil((new Date(snapshot.session.state.selectionDeadline).getTime() - now) / 1000)) : 0, [now, snapshot]);

  async function choose(index: number) {
    setBusy(true); setError(null);
    try { setSnapshot(await selectBingoCard(accessToken, roomCode, index)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not lock this card.'); }
    finally { setBusy(false); }
  }

  if (!snapshot) return <section className="panel bingo-live-panel"><div className="eyebrow">Bingo</div><h2>Waiting for the Host to start the round.</h2>{error && <div className="notice warning">{error}</div>}</section>;
  const { session, ownCard } = snapshot;
  if (!ownCard) return <section className="panel bingo-live-panel"><div className="eyebrow">Bingo</div><h2>Spectator view</h2><p className="support">This seat does not have an active Bingo card in the current round.</p></section>;

  if (session.state.phase === 'card-selection' && !ownCard.selected_card) {
    return <section className="panel bingo-live-panel player-bingo"><div className="eyebrow">Choose your card</div><h2>{remaining}s remaining</h2><p className="support">Choose one of your three personal candidate cards. If time expires, the server assigns one automatically.</p>{error && <div className="notice warning" role="alert">{error}</div>}<div className="candidate-grid">{ownCard.candidate_cards.map((card, index) => <button className="candidate-card" disabled={busy} onClick={() => void choose(index)} key={index}><span className="pill">Card {index + 1}</span><BingoBoard numbers={card} size={session.config.boardSize} compact /><strong>Select card {index + 1}</strong></button>)}</div></section>;
  }

  const card = ownCard.selected_card ?? ownCard.candidate_cards[ownCard.selected_candidate ?? 0];
  const ownWinner = session.winners.find((winner) => winner.participant_id && winner.participant_id.length > 0 && ownCard && winner.participant_id);
  return <section className="panel bingo-live-panel player-bingo">
    <div className="live-line"><span className="live-dot" /> {session.state.phase === 'ended' ? 'ROUND ENDED' : 'LIVE BINGO'}</div>
    <div className="bingo-callout draw"><span>Latest draw</span><strong>{session.state.latestDraw ?? '—'}</strong></div>
    <BingoBoard numbers={card} size={session.config.boardSize} drawn={session.state.drawn} />
    <div className="meta"><span className="pill">Draws {session.state.drawn.length}</span><span className="pill">Automatically marked</span><span className="pill">One line wins</span></div>
    {ownWinner && <div className="notice success">A winning placement has been recorded by the server.</div>}
    {session.winners.length > 0 && <div className="winner-list">{session.winners.slice(0, 3).map((winner) => <div className="control-row" key={winner.participant_id}><span>#{winner.placement} {winner.nickname}</span><strong>Winner</strong></div>)}</div>}
  </section>;
}
