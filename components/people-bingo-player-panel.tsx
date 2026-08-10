'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { BINGO_UI_COPY } from '@/lib/bingo-ui-copy';
import { fetchPeopleBingo, selectPeopleBingoCardClient, type PeopleBingoSnapshot } from '@/lib/client-people-bingo';
import { AVATARS } from '@/lib/room-flow';
import { usePlayerUiLocale } from '@/lib/use-player-ui-locale';
import { PeopleBingoBoard } from './people-bingo-board';

function avatarFor(key: string | null) {
  return AVATARS.find((avatar) => avatar.id === key)?.emoji ?? '🙂';
}

export function PeopleBingoPlayerPanel({ accessToken, roomCode, participantId }: { accessToken: string; roomCode: string; participantId: string }) {
  const locale = usePlayerUiLocale(accessToken, roomCode);
  const copy = BINGO_UI_COPY[locale];
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

  const remaining = useMemo(() => {
    if (!snapshot) return 0;
    const reference = snapshot.room.status === 'paused' && snapshot.session.state.pauseStartedAt
      ? new Date(snapshot.session.state.pauseStartedAt).getTime()
      : now;
    return Math.max(0, Math.ceil((new Date(snapshot.session.state.selectionDeadline).getTime() - reference) / 1000));
  }, [now, snapshot]);

  async function choose(index: number) {
    setBusy(true); setError(null);
    try { setSnapshot(await selectPeopleBingoCardClient(accessToken, roomCode, index)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not lock this People Bingo card.'); }
    finally { setBusy(false); }
  }

  if (!snapshot) return <section className="panel"><div className="eyebrow">{copy.peopleTitle}</div><h2>{copy.waitingStart}</h2>{error && <div className="notice warning">{error}</div>}</section>;
  const { session } = snapshot;
  const paused = snapshot.room.status === 'paused' || session.status === 'paused';
  const ownCard = session.ownCard;
  if (!ownCard) return <section className="panel"><div className="eyebrow">{copy.peopleTitle}</div><h2>{copy.spectatorView}</h2>{paused && <div className="notice warning">{copy.paused}</div>}<p className="support">{copy.noActiveCard}</p></section>;

  if (session.state.phase === 'card-selection' && !ownCard.selected_card) {
    const expired = remaining <= 0;
    return <section className="panel people-bingo-live-panel player-people-bingo">
      <div className="eyebrow">{copy.chooseCard}</div><h2>{paused ? `${copy.paused} · ${remaining}s ${copy.pausedSaved}` : expired ? copy.selectionClosed : `${remaining}s ${copy.remaining}`}</h2>
      {paused && <div className="notice warning">{copy.pauseSelection}</div>}
      <p className="support">{expired ? copy.serverAssigning : copy.peopleChoiceHelp}</p>
      {error && <div className="notice warning" role="alert">{error}</div>}
      <div className="people-candidate-grid">{ownCard.candidate_cards.map((card, index) => <button className="people-candidate-card" key={index} disabled={busy || expired || paused} onClick={() => void choose(index)}>
        <span className="pill">{copy.card} {index + 1}</span>
        <PeopleBingoBoard participantIds={card} directory={session.directory} compact />
        <strong>{paused ? copy.paused : expired ? copy.waiting : `${copy.select} ${copy.card.toLocaleLowerCase(locale)} ${index + 1}`}</strong>
      </button>)}</div>
    </section>;
  }

  const card = ownCard.selected_card ?? ownCard.candidate_cards[ownCard.selected_candidate ?? 0];
  const ownWinner = session.winners.find((winner) => winner.participant_id === participantId);
  const latest = session.state.latestDraw ? session.directory[session.state.latestDraw] : null;
  return <section className="panel people-bingo-live-panel player-people-bingo">
    <div className="live-line"><span className="live-dot" /> {paused ? `${copy.paused} · ${copy.peopleTitle}` : session.state.phase === 'ended' ? copy.roundEnded : copy.livePeople}</div>
    {paused && <div className="notice warning">{copy.pauseBoardPeople}</div>}
    <div className="people-bingo-callout"><span>{copy.latestParticipant}</span><strong>{latest ? `${avatarFor(latest.avatarKey)} ${latest.nickname}` : '—'}</strong></div>
    <PeopleBingoBoard participantIds={card} directory={session.directory} drawn={session.state.drawn} />
    <div className="meta"><span className="pill">{copy.draws} {session.state.drawn.length}</span><span className="pill">{copy.autoMarking}</span><span className="pill">{copy.oneLineWins}</span></div>
    {ownWinner && <div className="notice success">{copy.sharedPlacement} #{ownWinner.placement} {copy.onDraw} {ownWinner.completing_draw_index + 1}.</div>}
    {session.winners.length > 0 && <div className="winner-list">{session.winners.slice(0, 3).map((winner) => <div className="control-row" key={winner.participant_id}><span>#{winner.placement} {avatarFor(winner.avatarKey)} {winner.nickname}</span><strong>{copy.winner}</strong></div>)}</div>}
  </section>;
}
