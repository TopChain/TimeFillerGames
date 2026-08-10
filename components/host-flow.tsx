'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { BINGO_BOARDS, GAMES, LOCALES, TIME_PRESETS, type GameId, type Locale, type TimePreset } from '@/lib/product';
import { GROUP_CONTEXTS, evaluateReadiness, gamesForTime, getGame, type GroupContext, type RankingVisibility } from '@/lib/room-flow';
import { createLiveRoom, fetchRoomSnapshot, updateLiveRoom, type LiveRoom, type RoomSnapshot } from '@/lib/client-room';
import { startBingo } from '@/lib/client-bingo';
import { hasBrowserSupabaseConfig, permanentHostSession, requestHostMagicLink } from '@/lib/supabase/browser';
import { subscribeToRoom } from '@/lib/realtime-client';
import { BingoHostPanel } from '@/components/bingo-host-panel';
import { BingoResultsPanel } from '@/components/bingo-results-panel';

const STEPS = ['Choose time', 'Choose game', 'Configure', 'Open room', 'Run game', 'Results'] as const;
const BINGO_CARD_TIMERS = [10, 15, 20, 30, 60] as const;

export function HostFlow({ onExit }: { onExit: () => void }) {
  const [step, setStep] = useState(0);
  const [minutes, setMinutes] = useState<TimePreset>(5);
  const [context, setContext] = useState<GroupContext | null>('Classroom');
  const [gameId, setGameId] = useState<GameId>('bingo');
  const [hostCap, setHostCap] = useState<number | null>(null);
  const [roomLanguage, setRoomLanguage] = useState<Locale>('en');
  const [allowCustomPhotos, setAllowCustomPhotos] = useState(false);
  const [allowLateJoin, setAllowLateJoin] = useState(true);
  const [rankingVisibility, setRankingVisibility] = useState<RankingVisibility>('podium');
  const [bingoSize, setBingoSize] = useState(6);
  const [bingoCardChoiceSeconds, setBingoCardChoiceSeconds] = useState(20);
  const [answerTimer, setAnswerTimer] = useState(20);
  const [drawTimer, setDrawTimer] = useState(45);
  const [hostEmail, setHostEmail] = useState('');
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [hostUserId, setHostUserId] = useState<string | null>(null);
  const [authLabel, setAuthLabel] = useState('Checking Host sign-in…');
  const [liveRoom, setLiveRoom] = useState<LiveRoom | null>(null);
  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState('offline');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const compatible = useMemo(() => gamesForTime(minutes), [minutes]);
  const game = getGame(gameId);
  const setupComplete = gameId === 'bingo' ? bingoSize > 0 : gameId === 'majority-match' ? answerTimer > 0 : drawTimer > 0;
  const activePlayers = snapshot?.counts.active ?? 0;
  const reconnectingPlayers = snapshot?.counts.reconnecting ?? 0;
  const readiness = evaluateReadiness({ gameId, activePlayers, hostCap, setupComplete, reconnectingPlayers });

  useEffect(() => {
    let cancelled = false;
    if (!hasBrowserSupabaseConfig()) {
      setAuthLabel('Supabase staging credentials not configured');
      return;
    }
    permanentHostSession().then((session) => {
      if (cancelled) return;
      if (!session) {
        setAuthLabel('Sign in required to create a live room');
        return;
      }
      setAccessToken(session.access_token);
      setHostUserId(session.user.id);
      setAuthLabel(session.user.email ? `Signed in as ${session.user.email}` : 'Host signed in');
    }).catch((cause) => !cancelled && setAuthLabel(cause instanceof Error ? cause.message : 'Could not check Host sign-in.'));
    return () => { cancelled = true; };
  }, []);

  const refreshSnapshot = useCallback(async () => {
    if (!liveRoom || !accessToken) return;
    try {
      const next = await fetchRoomSnapshot(accessToken, liveRoom.join_code);
      setSnapshot(next);
      setLiveRoom(next.room);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not refresh room state.');
    }
  }, [accessToken, liveRoom]);

  useEffect(() => {
    if (!liveRoom || !accessToken || !hostUserId || liveRoom.status === 'closed') return;
    let cleanup: (() => Promise<void>) | undefined;
    let cancelled = false;
    const interval = window.setInterval(() => void refreshSnapshot(), 5000);
    void refreshSnapshot();
    void subscribeToRoom({
      accessToken,
      roomId: liveRoom.id,
      roomCode: liveRoom.join_code,
      userId: hostUserId,
      role: 'host',
      onChange: () => void refreshSnapshot(),
      onStatus: setRealtimeStatus,
      onPresence: () => void refreshSnapshot(),
    }).then((unsubscribe) => {
      if (cancelled) void unsubscribe();
      else cleanup = unsubscribe;
    }).catch((cause) => setError(cause instanceof Error ? cause.message : 'Realtime connection failed.'));
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      if (cleanup) void cleanup();
    };
  }, [accessToken, hostUserId, liveRoom?.id, liveRoom?.join_code, liveRoom?.status, refreshSnapshot]);

  function chooseTime(value: TimePreset) {
    setMinutes(value);
    const stillFits = GAMES.find((candidate) => candidate.id === gameId)?.times.includes(value);
    if (!stillFits) setGameId(gamesForTime(value)[0].id as GameId);
  }

  async function sendMagicLink() {
    setBusy(true);
    setError(null);
    try {
      if (!hostEmail.trim()) throw new Error('Enter the Host email address.');
      await requestHostMagicLink(hostEmail);
      setAuthLabel('Check your email and open the secure sign-in link, then return here.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not send sign-in link.');
    } finally {
      setBusy(false);
    }
  }

  async function createOrUpdateRoom() {
    setBusy(true);
    setError(null);
    try {
      const session = await permanentHostSession();
      if (!session) throw new Error('Sign in as Host before creating a live room.');
      setAccessToken(session.access_token);
      setHostUserId(session.user.id);
      const payload = { minutes, context, gameId, hostCap, roomLanguage, allowCustomPhotos, allowLateJoin, rankingVisibility };
      const result = liveRoom
        ? await updateLiveRoom(session.access_token, liveRoom.join_code, payload)
        : await createLiveRoom(session.access_token, payload);
      setLiveRoom(result.room);
      setStep(3);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not create the live room.');
    } finally {
      setBusy(false);
    }
  }

  async function patchRoom(input: Parameters<typeof updateLiveRoom>[2]) {
    if (!liveRoom || !accessToken) return;
    setBusy(true);
    setError(null);
    try {
      const result = await updateLiveRoom(accessToken, liveRoom.join_code, input);
      setLiveRoom(result.room);
      if (input.allowLateJoin !== undefined) setAllowLateJoin(input.allowLateJoin);
      if (input.allowCustomPhotos !== undefined) setAllowCustomPhotos(input.allowCustomPhotos);
      if (input.rankingVisibility !== undefined) setRankingVisibility(input.rankingVisibility);
      await refreshSnapshot();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update room.');
      throw cause;
    } finally {
      setBusy(false);
    }
  }

  async function startGame() {
    if (!liveRoom || !accessToken) return;
    if (gameId !== 'bingo') {
      await patchRoom({ status: 'playing' });
      setStep(4);
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await startBingo(accessToken, liveRoom.join_code, bingoSize, bingoCardChoiceSeconds);
      setStep(4);
      await refreshSnapshot();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not start Bingo.');
    } finally {
      setBusy(false);
    }
  }

  async function finishGame() {
    await patchRoom({ status: 'results' });
    setStep(5);
  }

  async function replay() {
    await patchRoom({ status: 'lobby' });
    setStep(3);
  }

  async function changeGame() {
    if (liveRoom?.status !== 'lobby') await patchRoom({ status: 'lobby' });
    setStep(1);
  }

  async function endRoom() {
    await patchRoom({ status: 'closed' });
    onExit();
  }

  return <main className="role-shell" data-app="host">
    <header className="role-topbar">
      <button className="text-button" onClick={onExit}>← TimeFillerGames</button>
      <div className="role-title"><span className="role-dot" /> Host</div>
      <span className="status-chip">{liveRoom ? `${liveRoom.join_code} · ${realtimeStatus}` : 'Release 1 setup'}</span>
    </header>

    <ol className="progress" aria-label="Host setup progress">
      {STEPS.map((label, index) => <li key={label} className={index === step ? 'current' : index < step ? 'done' : ''}><span>{index + 1}</span>{label}</li>)}
    </ol>

    {error && <div className="workspace narrow"><div className="notice warning" role="alert">{error}</div></div>}

    {step === 0 && <section className="workspace narrow">
      <div className="eyebrow">Time first</div>
      <h1>How much time does the group have?</h1>
      <p className="support">Normal sessions are designed around the four approved time targets. Lobby wait is separate from estimated play time.</p>
      <div className="choice-grid four">{TIME_PRESETS.map((value) => <button key={value} className={`choice-card ${minutes === value ? 'selected' : ''}`} onClick={() => chooseTime(value)}><strong>{value}</strong><span>minutes</span></button>)}</div>
      <div className="field-block"><label>Group context <span className="optional">optional</span></label><div className="chip-row">{GROUP_CONTEXTS.map((value) => <button key={value} className={`select-chip ${context === value ? 'selected' : ''}`} onClick={() => setContext(value)}>{value}</button>)}</div></div>
      <div className="primary-row"><button className="btn primary" onClick={() => setStep(1)}>Show compatible games →</button></div>
    </section>}

    {step === 1 && <section className="workspace">
      <div className="section-heading"><div><div className="eyebrow">Game library</div><h1>Games that fit {minutes} minutes</h1></div><button className="btn secondary" onClick={() => setStep(0)}>Change time</button></div>
      <div className="game-picker">{compatible.map((candidate) => <button key={candidate.id} className={`game-option ${gameId === candidate.id ? 'selected' : ''}`} onClick={() => setGameId(candidate.id as GameId)}>
        <div><span className={`game-accent ${candidate.accent}`} /><span className="release-label">{candidate.release}</span></div>
        <h2>{candidate.name}</h2><p>{candidate.mechanic}</p>
        <dl className="game-facts"><div><dt>Hard minimum</dt><dd>{candidate.hardMin}</dd></div><div><dt>Hard maximum</dt><dd>{candidate.hardMax ?? 'No game-rule maximum'}</dd></div><div><dt>Recommended</dt><dd>{candidate.recommended}</dd></div><div><dt>Shared screen</dt><dd>{candidate.sharedScreen}</dd></div><div><dt>Spectators</dt><dd>{candidate.spectator ? 'Supported' : 'Not default'}</dd></div></dl>
      </button>)}</div>
      <div className="primary-row"><button className="btn secondary" onClick={() => setStep(0)}>← Back</button><button className="btn primary" onClick={() => setStep(2)}>Configure {game.name} →</button></div>
    </section>}

    {step === 2 && <section className="workspace two-column">
      <div className="panel">
        <div className="eyebrow">Game setup</div><h1>{game.name}</h1><p className="support">Settings are server-validated when the live room is created or updated.</p>
        {gameId === 'bingo' && <>
          <div className="field-block"><label>Board size</label><div className="chip-row">{BINGO_BOARDS.filter((board) => board.normal).map((board) => <button key={board.size} className={`select-chip ${bingoSize === board.size ? 'selected' : ''}`} onClick={() => setBingoSize(board.size)}>{board.size}×{board.size} · {board.estimate}</button>)}</div></div>
          <div className="field-block"><label>Card-choice timer</label><div className="chip-row">{BINGO_CARD_TIMERS.map((seconds) => <button key={seconds} className={`select-chip ${bingoCardChoiceSeconds === seconds ? 'selected' : ''}`} onClick={() => setBingoCardChoiceSeconds(seconds)}>{seconds}s</button>)}</div><small>Players receive 3 candidate cards. If time expires, the server assigns one automatically.</small></div>
        </>}
        {gameId === 'majority-match' && <div className="field-block"><label>Answer timer</label><input type="range" min="10" max="45" step="5" value={answerTimer} onChange={(event) => setAnswerTimer(Number(event.target.value))} /><strong>{answerTimer} seconds</strong></div>}
        {gameId === 'quick-draw' && <div className="field-block"><label>Drawing / guessing timer</label><input type="range" min="30" max="90" step="15" value={drawTimer} onChange={(event) => setDrawTimer(Number(event.target.value))} /><strong>{drawTimer} seconds</strong></div>}
        {game.release !== 'R1' && <div className="notice warning">This game is specified for Release 1.1. Release 1 publication remains focused on Bingo, Majority Match, and Quick Draw & Guess.</div>}
        <div className="field-block"><label>Production Host sign-in</label><p className="support">{authLabel}</p>{!accessToken && <><input type="email" autoComplete="email" placeholder="host@company.com" value={hostEmail} onChange={(event) => setHostEmail(event.target.value)} /><button className="btn secondary" disabled={busy || !hasBrowserSupabaseConfig()} onClick={() => void sendMagicLink()}>Send secure sign-in link</button></>}</div>
      </div>
      <aside className="panel status-panel">
        <h2>Room defaults</h2>
        <label className="form-label">Room language<select value={roomLanguage} onChange={(event) => setRoomLanguage(event.target.value as Locale)}>{LOCALES.map((locale) => <option key={locale.id} value={locale.id}>{locale.label}</option>)}</select></label>
        <label className="form-label">Host participant cap<input type="number" min="1" placeholder="No host-set limit" value={hostCap ?? ''} onChange={(event) => setHostCap(event.target.value ? Number(event.target.value) : null)} /></label>
        <label className="toggle-row"><input type="checkbox" checked={allowLateJoin} onChange={(event) => setAllowLateJoin(event.target.checked)} /><span>Allow late joining between safe rounds</span></label>
        <label className="toggle-row"><input type="checkbox" checked={allowCustomPhotos} onChange={(event) => setAllowCustomPhotos(event.target.checked)} /><span>Allow custom photos {context === 'Classroom' && <small>(off by default in Classroom)</small>}</span></label>
        <label className="form-label">Lower ranking visibility<select value={rankingVisibility} onChange={(event) => setRankingVisibility(event.target.value as RankingVisibility)}><option value="podium">Podium + private placement</option><option value="top10">Top 10</option><option value="public">Fully public</option><option value="private">Private only</option></select></label>
      </aside>
      <div className="primary-row full"><button className="btn secondary" onClick={() => setStep(1)}>← Back</button><button className="btn primary" disabled={busy || !accessToken} onClick={() => void createOrUpdateRoom()}>{liveRoom ? 'Apply settings to room →' : 'Create live room →'}</button></div>
    </section>}

    {step === 3 && liveRoom && <section className="workspace two-column">
      <div className="panel room-status">
        <div className="live-line"><span className="live-dot" /> {realtimeStatus === 'SUBSCRIBED' ? 'LIVE ROOM' : 'CONNECTING'}</div>
        <div className="room-code">{liveRoom.join_code}</div>
        <p className="support">Players can join without creating a visible account. Their temporary authenticated session is used only to authorize this room and recover their seat.</p>
        <div className="share-grid"><div className="qr-placeholder" aria-label="QR code placeholder">QR</div><div><strong>Direct link</strong><code>/?join={liveRoom.join_code}</code><strong>Language</strong><span>{LOCALES.find((locale) => locale.id === liveRoom.room_language)?.label}</span></div></div>
        <div className="lobby-count"><strong>{snapshot?.counts.active ?? 0}</strong><span>active participants</span></div>
        <div className="meta"><span className="pill">Ready {snapshot?.counts.ready ?? 0}/{snapshot?.counts.active ?? 0}</span><span className="pill">Online {snapshot?.counts.online ?? 0}</span><span className="pill">Reconnecting {snapshot?.counts.reconnecting ?? 0}</span><span className="pill">Spectators {snapshot?.counts.spectators ?? 0}</span></div>
        <div className="participant-list">{snapshot?.participants.map((participant) => <div className="control-row" key={participant.id}><span>{participant.nickname} · {participant.role}</span><strong>{participant.ready ? '✓ Ready' : participant.online ? '● Online' : '○ Reconnecting'}</strong></div>)}</div>
      </div>
      <aside className="panel status-panel">
        <h2>Lobby controls</h2>
        <div className={`readiness ${readiness.state}`}><strong>{readiness.canStart ? '✓' : '!'} {readiness.state === 'ready' ? 'Ready' : 'Room status'}</strong><span>{readiness.message}</span></div>
        <button className="control-row" disabled={busy} onClick={() => void patchRoom({ locked: !liveRoom.locked })}><span>Room access</span><strong>{liveRoom.locked ? 'Locked' : 'Unlocked'}</strong></button>
        <button className="control-row" disabled={busy} onClick={() => void patchRoom({ allowLateJoin: !liveRoom.allow_late_join })}><span>Late joining</span><strong>{liveRoom.allow_late_join ? 'Between rounds' : 'Off'}</strong></button>
        <button className="control-row" disabled={busy} onClick={() => void patchRoom({ allowCustomPhotos: !liveRoom.allow_custom_photos })}><span>Custom photos</span><strong>{liveRoom.allow_custom_photos ? 'Allowed' : 'Disabled'}</strong></button>
        <div className="control-row"><span>Game</span><strong>{game.name}</strong></div><div className="control-row"><span>Duration target</span><strong>{minutes} min</strong></div>
        <button className="btn primary full-width" disabled={busy || !readiness.canStart} onClick={() => void startGame()}>{busy ? 'Starting…' : 'Start game'}</button>
      </aside>
      <div className="primary-row full"><button className="btn secondary" onClick={() => setStep(2)}>← Edit setup</button></div>
    </section>}

    {step === 4 && liveRoom && accessToken && gameId === 'bingo' && <section className="workspace two-column">
      <BingoHostPanel accessToken={accessToken} roomCode={liveRoom.join_code} boardSize={bingoSize} cardChoiceSeconds={bingoCardChoiceSeconds} onEnded={() => { setStep(5); void refreshSnapshot(); }} />
      <aside className="panel status-panel">
        <h2>Room controls</h2>
        <div className="control-row"><span>Active players</span><strong>{activePlayers}</strong></div>
        <div className="control-row"><span>Connection</span><strong>{realtimeStatus}</strong></div>
        <button className="btn secondary full-width" disabled={busy} onClick={() => void patchRoom({ status: liveRoom.status === 'paused' ? 'playing' : 'paused' })}>{liveRoom.status === 'paused' ? 'Resume room' : 'Pause room'}</button>
        <p className="support">Bingo draws remain manual. Pausing the room stops Host progression; the server remains authoritative for cards, draws, winners, and ties.</p>
      </aside>
    </section>}

    {step === 4 && liveRoom && gameId !== 'bingo' && <section className="workspace two-column">
      <div className="panel play-stage"><div className="live-line"><span className="live-dot" /> LIVE · {game.name}</div><h1>{liveRoom.status === 'paused' ? 'Game paused' : 'Round in progress'}</h1><p className="support">The room infrastructure is live. This Release 1 game engine is the next implementation slice.</p><div className="demo-board"><span>{minutes}:00</span><strong>{activePlayers} players</strong></div></div>
      <aside className="panel status-panel"><h2>Host controls</h2><button className="btn primary full-width" disabled={busy} onClick={() => void patchRoom({ status: liveRoom.status === 'paused' ? 'playing' : 'paused' })}>{liveRoom.status === 'paused' ? 'Resume' : 'Pause'}</button><button className="btn danger full-width" disabled={busy} onClick={() => void finishGame()}>End game</button></aside>
    </section>}

    {step === 5 && liveRoom && <section className="workspace narrow results-stage">
      <div className="eyebrow">Results</div><h1>Round complete</h1>
      {gameId === 'bingo' && accessToken ? <BingoResultsPanel accessToken={accessToken} roomCode={liveRoom.join_code} /> : <div className="notice">Server-backed results for this game arrive with its Release 1 engine.</div>}
      <p className="support">Ranking visibility for this room: <strong>{rankingVisibility}</strong>.</p>
      <div className="primary-row"><button className="btn primary" disabled={busy} onClick={() => void replay()}>Replay</button><button className="btn secondary" disabled={busy} onClick={() => void changeGame()}>Change game · keep room</button><button className="btn danger" disabled={busy} onClick={() => void endRoom()}>End room</button></div>
    </section>}
  </main>;
}
