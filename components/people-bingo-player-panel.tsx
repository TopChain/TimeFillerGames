'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchPeopleBingo, selectPeopleBingoCardClient, type PeopleBingoSnapshot } from '@/lib/client-people-bingo';
import { AVATARS } from '@/lib/room-flow';
import { PeopleBingoBoard } from './people-bingo-board';

function avatarFor(key: string | null) {
  return AVATARS.find((avatar) => avatar.id === key)?.emoji ?? '🙂';
}

export function PeopleBingoPlayerPanel({ accessToken, roomCode, participantId }: { accessToken: string; roomCode: string; participantId: string }) {
  const [snapshot, setSnapshot] = useState<PeopleBingoSnapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  const refresh = useCallback(async () => {
    try {
      setSnapshot(await fetchPeopleBingo(accessToken, roomCode));
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load People Bingo.');
    }
  }, [accessToken, roomCode]);

  useEffect(() => {
    void refresh();
    const poll = window.setInterval(() => void refresh(), 1200);
    const clock = window.setInterval(() => setNow(Date.now()), 250);
    return () => { window.clearInterval(poll); window.clearInterval(clock); };
  }, [refresh]);

  const remaining = useMemo(() => snapshot ? Math.max(0, Math.ceil((new Date(snapshot.session.state.selectionDeadline).getTime() - now) / 1000)) : 0, [now, snapshot]);

  async function choose(index: number) {
    setBusy(true); setError(null);
    try { setSnapshot(await selectPeopleBingoCardClient(accessToken, roomCode, index)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not lock this People Bingo card.'); }
    finally { setBusy(false); }
  }

  if (!snapshot) return <section className="panel"><div className="eyebrow">People Bingo 5×5</div><h2>Waiting for the Host to start.</h2>{error && <div className="notice warning">{error}</div>}</section>;
  const { session } = snapshot;
  const ownCard = session.ownCard;
  if (!ownCard) return <section className="panel"><div className="eyebrow">People Bingo 5×5</div><h2>Spectator view</h2><p className="support">This seat does not have an active People Bingo card in the current round.</p></section>;

  if (session.state.phase === 'card-selection' && !ownCard.selected_card) {
    const expired = remaining <= 0;
    return <section className="panel people-bingo-live-panel player-people-bingo">
      <div className="eyebrow">Choose your People Bingo card</div><h2>{expired ? 'Selection closed' : `${remaining}s remaining`}</h2>
      <p className="support">Each candidate contains 25 unique active participants. Choose one card; otherwise the server assigns one after timeout.</p>
      {error && <div className="notice warning" role="alert">{error}</div>}
      <div className="people-candidate-grid">{ownCard.candidate_cards.map((card, index) => <button className="people-candidate-card" key={index} disabled={busy || expired} onClick={() => void choose(index)}>
        <span className="pill">Card {index + 1}</span>
        <PeopleBingoBoard participantIds={card} directory={session.directory} compact />
        <strong>{expired ? 'Waiting for assignment…' : `Select card ${index + 1}`}</strong>
      </button>)}</div>
    </section>;
  }

  const card = ownCard.selected_card ?? ownCard.candidate_cards[ownCard.selected_candidate ?? 0];
  const ownWinner = session.winners.find((winner) => winner.participant_id === participantId);
  const latest = session.state.latestDraw ? session.directory[session.state.latestDraw] : null;
  return <section className="panel people-bingo-live-panel player-people-bingo">
    <div className="live-line"><span className="live-dot" /> {session.state.phase === 'ended' ? 'ROUND ENDED' : 'LIVE PEOPLE BINGO'}</div>
    <div className="people-bingo-callout"><span>Latest participant</span><strong>{latest ? `${avatarFor(latest.avatarKey)} ${latest.nickname}` : '—'}</strong></div>
    <PeopleBingoBoard participantIds={card} directory={session.directory} drawn={session.state.drawn} />
    <div className="meta"><span className="pill">Draws {session.state.drawn.length}</span><span className="pill">Automatic marking</span><span className="pill">One line wins</span></div>
    {ownWinner && <div className="notice success">You earned shared placement #{ownWinner.placement} on draw {ownWinner.completing_draw_index + 1}.</div>}
    {session.winners.length > 0 && <div className="winner-list">{session.winners.slice(0, 3).map((winner) => <div className="control-row" key={winner.participant_id}><span>#{winner.placement} {avatarFor(winner.avatarKey)} {winner.nickname}</span><strong>Winner</strong></div>)}</div>}
  </section>;
}
