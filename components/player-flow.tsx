'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { LOCALES, type Locale } from '@/lib/product';
import { STRINGS } from '@/lib/i18n';
import { AVATARS, disambiguateNickname, generateNickname, getGame, nicknameIssue, normalizeRoomCode, type Avatar } from '@/lib/room-flow';
import { fetchRoomSnapshot, heartbeatRoom, joinLiveRoom, leaveLiveRoom, reconnectLiveRoom, setReadyState, type LiveRoom, type ParticipantSession, type RoomSnapshot } from '@/lib/client-room';
import { currentSession, ensureParticipantSession, hasBrowserSupabaseConfig } from '@/lib/supabase/browser';
import { subscribeToRoom } from '@/lib/realtime-client';
import { BingoPlayerPanel } from '@/components/bingo-player-panel';
import { BingoResultsPanel } from '@/components/bingo-results-panel';
import { MajorityMatchPlayerPanel } from '@/components/majority-match-player-panel';
import { MajorityMatchResultsPanel } from '@/components/majority-match-results-panel';

const CATEGORY_LABELS: Record<Avatar['category'], string> = {
  'chinese-zodiac': 'Chinese zodiac',
  'western-zodiac': 'Western zodiac',
  animals: 'Animals',
  vegetables: 'Vegetables',
  fruits: 'Fruits',
};

function seatStorageKey(roomCode: string) { return `timefillergames:seat:${roomCode}`; }

export function PlayerFlow({ onExit }: { onExit: () => void }) {
  const [step, setStep] = useState(0);
  const [roomCode, setRoomCode] = useState('');
  const [locale, setLocale] = useState<Locale>('en');
  const [category, setCategory] = useState<Avatar['category']>('animals');
  const [avatarId, setAvatarId] = useState(AVATARS.find((avatar) => avatar.label === 'Panda')!.id);
  const [nickname, setNickname] = useState('Happy Panda');
  const [ready, setReady] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [room, setRoom] = useState<LiveRoom | null>(null);
  const [participant, setParticipant] = useState<ParticipantSession | null>(null);
  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState('offline');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const copy = STRINGS[locale];
  const normalizedCode = normalizeRoomCode(roomCode);
  const avatars = useMemo(() => AVATARS.filter((avatar) => avatar.category === category), [category]);
  const selectedAvatar = AVATARS.find((avatar) => avatar.id === avatarId) ?? AVATARS[0];
  const issue = nicknameIssue(nickname, true);
  const game = room ? getGame(room.game_type) : null;

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const code = normalizeRoomCode(query.get('join') ?? query.get('room') ?? '');
    if (code) setRoomCode(code);
  }, []);

  const refreshSnapshot = useCallback(async () => {
    if (!room || !accessToken) return;
    try {
      const next = await fetchRoomSnapshot(accessToken, room.join_code);
      setSnapshot(next);
      setRoom(next.room);
      const own = next.participants.find((candidate) => candidate.id === participant?.id);
      if (own) {
        setReady(Boolean(own.ready));
        setParticipant((current) => current ? { ...current, ...own, session_token: current.session_token } : current);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not refresh room state.');
    }
  }, [accessToken, participant?.id, room]);

  useEffect(() => {
    if (!room || !participant || !accessToken || !authUserId || room.status === 'closed') return;
    let cleanup: (() => Promise<void>) | undefined;
    let cancelled = false;
    const beat = () => void heartbeatRoom(accessToken, room.join_code, participant.session_token).catch(() => undefined);
    beat();
    const heartbeatTimer = window.setInterval(beat, 15000);
    const snapshotTimer = window.setInterval(() => void refreshSnapshot(), 5000);
    void refreshSnapshot();
    void subscribeToRoom({
      accessToken,
      roomId: room.id,
      roomCode: room.join_code,
      userId: authUserId,
      participantId: participant.id,
      nickname: participant.nickname,
      role: participant.role,
      onChange: () => void refreshSnapshot(),
      onPresence: () => void refreshSnapshot(),
      onStatus: setRealtimeStatus,
    }).then((unsubscribe) => { if (cancelled) void unsubscribe(); else cleanup = unsubscribe; })
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Realtime connection failed.'));
    return () => {
      cancelled = true;
      window.clearInterval(heartbeatTimer);
      window.clearInterval(snapshotTimer);
      if (cleanup) void cleanup();
    };
  }, [accessToken, authUserId, participant?.id, participant?.session_token, room?.id, room?.join_code, room?.status, refreshSnapshot]);

  useEffect(() => {
    if (!room || step < 3) return;
    if (room.status === 'lobby') setStep(3);
    if (room.status === 'playing' || room.status === 'paused') setStep(4);
    if (room.status === 'results') setStep(5);
    if (room.status === 'closed') setError('The Host ended this room.');
  }, [room?.status, step]);

  function selectAvatar(avatar: Avatar) {
    setAvatarId(avatar.id);
    setNickname(disambiguateNickname(generateNickname(avatar), ['Lucky Mango']));
  }

  function applyRecoveredIdentity(recoveredRoom: LiveRoom, recovered: ParticipantSession, token: string, userId: string) {
    setRoom(recoveredRoom);
    setParticipant(recovered);
    setAccessToken(token);
    setAuthUserId(userId);
    setLocale(recovered.ui_language);
    setNickname(recovered.nickname);
    setReady(Boolean(recovered.ready));
    if (recovered.avatar_key && AVATARS.some((avatar) => avatar.id === recovered.avatar_key)) {
      setAvatarId(recovered.avatar_key);
      setCategory(AVATARS.find((avatar) => avatar.id === recovered.avatar_key)!.category);
    }
    setStep(recoveredRoom.status === 'results' ? 5 : recoveredRoom.status === 'playing' || recoveredRoom.status === 'paused' ? 4 : 3);
  }

  async function continueFromCode() {
    setBusy(true); setError(null);
    try {
      if (!hasBrowserSupabaseConfig()) throw new Error('The staging Supabase connection has not been configured yet.');
      const session = await currentSession();
      const stored = window.localStorage.getItem(seatStorageKey(normalizedCode));
      if (session && stored) {
        try {
          const result = await reconnectLiveRoom(session.access_token, normalizedCode, stored);
          applyRecoveredIdentity(result.room, result.participant, session.access_token, session.user.id);
          return;
        } catch {
          window.localStorage.removeItem(seatStorageKey(normalizedCode));
        }
      }
      setStep(1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not continue.');
    } finally { setBusy(false); }
  }

  async function joinRoom() {
    setBusy(true); setError(null);
    try {
      const session = await ensureParticipantSession();
      const result = await joinLiveRoom(session.access_token, normalizedCode, { uiLanguage: locale, avatarId, nickname });
      window.localStorage.setItem(seatStorageKey(result.room.join_code), result.participant.session_token);
      applyRecoveredIdentity(result.room, { ...result.participant, ready: Boolean(result.participant.ready) }, session.access_token, session.user.id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not join room.');
    } finally { setBusy(false); }
  }

  async function toggleReady() {
    if (!room || !participant || !accessToken || participant.role !== 'participant') return;
    setBusy(true); setError(null);
    try {
      const result = await setReadyState(accessToken, room.join_code, participant.session_token, !ready);
      setParticipant(result.participant);
      setReady(result.participant.ready);
      await refreshSnapshot();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update Ready state.');
    } finally { setBusy(false); }
  }

  async function leaveRoom() {
    if (room && participant && accessToken) {
      try { await leaveLiveRoom(accessToken, room.join_code, participant.session_token); } catch { /* exit locally even if the server is unavailable */ }
      window.localStorage.removeItem(seatStorageKey(room.join_code));
    }
    onExit();
  }

  return <main className="role-shell" data-app="player">
    <header className="role-topbar"><button className="text-button" onClick={onExit}>← TimeFillerGames</button><div className="role-title"><span className="role-dot" /> Player</div><span className="status-chip">{room ? `${room.join_code} · ${realtimeStatus}` : 'Guest · no visible account required'}</span></header>
    <ol className="progress compact" aria-label="Player progress">{['Join','Language','Identity','Lobby','Play','Result'].map((label, index) => <li key={label} className={index === step ? 'current' : index < step ? 'done' : ''}><span>{index + 1}</span>{label}</li>)}</ol>
    {error && <div className="workspace player-card narrow"><div className="notice warning" role="alert">{error}</div></div>}

    {step === 0 && <section className="workspace player-card narrow"><div className="eyebrow">Join quickly</div><h1>{copy.join}</h1><p className="support">Enter a PIN from the Host, scan the room QR code, or open the room link. A saved seat on this browser is recovered automatically where possible.</p><label className="form-label">{copy.roomCode}<input autoFocus inputMode="text" autoCapitalize="characters" placeholder="TFG 4821" value={roomCode} onChange={(event) => setRoomCode(event.target.value)} /></label>{roomCode && <div className="normalized-code"><span>Normalized</span><strong>{normalizedCode || '—'}</strong></div>}<button className="btn primary full-width" disabled={busy || normalizedCode.length < 4} onClick={() => void continueFromCode()}>{busy ? 'Checking room…' : copy.continue}</button></section>}

    {step === 1 && <section className="workspace player-card narrow"><div className="eyebrow">Personal UI</div><h1>{copy.language}</h1><p className="support">Your interface language is personal. It does not change the room language for everyone else.</p><div className="language-list">{LOCALES.map((option) => <button key={option.id} className={`language-option ${locale === option.id ? 'selected' : ''}`} onClick={() => setLocale(option.id)}><span>{option.label}</span>{locale === option.id && <strong>✓</strong>}</button>)}</div><div className="primary-row"><button className="btn secondary" onClick={() => setStep(0)}>{copy.back}</button><button className="btn primary" onClick={() => setStep(2)}>{copy.continue}</button></div></section>}

    {step === 2 && <section className="workspace player-card"><div className="section-heading"><div><div className="eyebrow">{copy.identity}</div><h1>{copy.avatar} + {copy.nickname}</h1></div><div className="identity-preview"><span className="avatar-large">{selectedAvatar.emoji}</span><strong>{nickname}</strong></div></div><div className="chip-row avatar-categories">{(Object.keys(CATEGORY_LABELS) as Avatar['category'][]).map((value) => <button key={value} className={`select-chip ${category === value ? 'selected' : ''}`} onClick={() => { setCategory(value); const first = AVATARS.find((avatar) => avatar.category === value)!; selectAvatar(first); }}>{CATEGORY_LABELS[value]}</button>)}</div><div className="avatar-grid">{avatars.map((avatar) => <button key={avatar.id} className={`avatar-option ${avatarId === avatar.id ? 'selected' : ''}`} aria-label={avatar.label} onClick={() => selectAvatar(avatar)}><span>{avatar.emoji}</span><small>{avatar.label}</small></button>)}</div><label className="form-label nickname-field">{copy.nickname}<input value={nickname} maxLength={24} onChange={(event) => setNickname(event.target.value)} /><small>{issue ?? 'Generated from the selected built-in avatar. The server applies room moderation rules when you join.'}</small></label><div className="notice">Photo upload remains Host-controlled and is off by default in Classroom mode. Uploaded photos are not used to infer identity, age, gender, ethnicity, or nicknames.</div><div className="primary-row"><button className="btn secondary" onClick={() => setStep(1)}>{copy.back}</button><button className="btn primary" disabled={busy || Boolean(issue)} onClick={() => void joinRoom()}>{busy ? 'Joining…' : copy.continue}</button></div></section>}

    {step === 3 && room && participant && <section className="workspace player-card narrow waiting-stage"><div className="avatar-hero">{selectedAvatar.emoji}</div><div className="eyebrow">{copy.joinedAs}</div><h1>{participant.nickname}</h1><div className="waiting-pulse" aria-hidden="true" /><h2>{copy.waiting}</h2><p className="support">{copy.waitingDetail}</p><div className="lobby-summary"><div><span>{copy.roomCode}</span><strong>{room.join_code}</strong></div><div><span>{copy.playerCount}</span><strong>{snapshot?.counts.online ?? 1}</strong></div><div><span>Ready</span><strong>{snapshot?.counts.ready ?? 0}/{snapshot?.counts.active ?? 0}</strong></div><div><span>{copy.gamePreview}</span><strong>{game?.name ?? room.game_type} · {room.duration_minutes} min</strong></div></div>{participant.role === 'spectator' && <div className="notice warning">You joined as a spectator because the active-player cap was reached or the round is already in progress.</div>}{participant.role === 'participant' && <button className={`btn ${ready ? 'secondary' : 'primary'} full-width`} disabled={busy} onClick={() => void toggleReady()}>{busy ? 'Updating…' : ready ? `✓ ${copy.ready}` : copy.ready}</button>}</section>}

    {step === 4 && room && participant && accessToken && room.game_type === 'bingo' && <section className="workspace player-card play-stage player-play"><BingoPlayerPanel accessToken={accessToken} roomCode={room.join_code} participantId={participant.id} /></section>}

    {step === 4 && room && accessToken && room.game_type === 'majority-match' && <section className="workspace player-card play-stage player-play"><MajorityMatchPlayerPanel accessToken={accessToken} roomCode={room.join_code} /></section>}

    {step === 4 && room && room.game_type !== 'bingo' && room.game_type !== 'majority-match' && <section className="workspace player-card narrow play-stage player-play"><div className="live-line"><span className="live-dot" /> {room.status === 'paused' ? 'PAUSED' : 'LIVE'} · {game?.name ?? room.game_type}</div><div className="eyebrow">Rules</div><h1>{room.status === 'paused' ? 'Waiting for Host.' : 'Round in progress.'}</h1><p className="support">The room transition is live and server-controlled. This Release 1 game engine is the next implementation slice.</p><div className="notice">Authoritative accepted answers, scores, ties, and rankings are never taken from this browser.</div></section>}

    {step === 5 && room && participant && <section className="workspace player-card narrow results-stage"><div className="eyebrow">{copy.results}</div><div className="avatar-hero">{selectedAvatar.emoji}</div><h1>Round complete, {participant.nickname}.</h1>{room.game_type === 'bingo' && accessToken ? <BingoResultsPanel accessToken={accessToken} roomCode={room.join_code} participantId={participant.id} /> : room.game_type === 'majority-match' && accessToken ? <MajorityMatchResultsPanel accessToken={accessToken} roomCode={room.join_code} /> : <div className="private-result"><span>Your private placement</span><strong>Pending</strong><small>This game’s result will come from its server-authoritative Release 1 score engine.</small></div>}<p className="support">Stay in the room. When the Host chooses Replay or Change Game, this screen automatically returns to the lobby.</p><button className="btn secondary full-width" onClick={() => void leaveRoom()}>Leave room</button></section>}
  </main>;
}
