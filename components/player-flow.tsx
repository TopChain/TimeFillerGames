'use client';

import { useMemo, useState } from 'react';
import { LOCALES, type Locale } from '@/lib/product';
import { STRINGS } from '@/lib/i18n';
import { AVATARS, disambiguateNickname, generateNickname, nicknameIssue, normalizeRoomCode, type Avatar } from '@/lib/room-flow';

const CATEGORY_LABELS: Record<Avatar['category'], string> = {
  'chinese-zodiac': 'Chinese zodiac',
  'western-zodiac': 'Western zodiac',
  animals: 'Animals',
  vegetables: 'Vegetables',
  fruits: 'Fruits',
};

export function PlayerFlow({ onExit }: { onExit: () => void }) {
  const [step, setStep] = useState(0);
  const [roomCode, setRoomCode] = useState('');
  const [locale, setLocale] = useState<Locale>('en');
  const [category, setCategory] = useState<Avatar['category']>('animals');
  const [avatarId, setAvatarId] = useState(AVATARS.find((avatar) => avatar.label === 'Panda')!.id);
  const [nickname, setNickname] = useState('Happy Panda');
  const [ready, setReady] = useState(false);
  const copy = STRINGS[locale];
  const normalizedCode = normalizeRoomCode(roomCode);
  const avatars = useMemo(() => AVATARS.filter((avatar) => avatar.category === category), [category]);
  const selectedAvatar = AVATARS.find((avatar) => avatar.id === avatarId)!;
  const issue = nicknameIssue(nickname, true);

  function selectAvatar(avatar: Avatar) {
    setAvatarId(avatar.id);
    setNickname(disambiguateNickname(generateNickname(avatar), ['Lucky Mango']));
  }

  return (
    <main className="role-shell" data-app="player">
      <header className="role-topbar">
        <button className="text-button" onClick={onExit}>← TimeFillerGames</button>
        <div className="role-title"><span className="role-dot" /> Player</div>
        <span className="status-chip">Guest · no account required</span>
      </header>

      <ol className="progress compact" aria-label="Player progress">
        {['Join','Language','Identity','Lobby','Play','Result'].map((label, index) => <li key={label} className={index === step ? 'current' : index < step ? 'done' : ''}><span>{index + 1}</span>{label}</li>)}
      </ol>

      {step === 0 && <section className="workspace player-card narrow">
        <div className="eyebrow">Join quickly</div><h1>{copy.join}</h1><p className="support">Enter a PIN from the host, or arrive here from the room QR code or direct link.</p>
        <label className="form-label">{copy.roomCode}<input autoFocus inputMode="text" autoCapitalize="characters" placeholder="TFG 4821" value={roomCode} onChange={(event) => setRoomCode(event.target.value)} /></label>
        {roomCode && <div className="normalized-code"><span>Normalized</span><strong>{normalizedCode || '—'}</strong></div>}
        <button className="btn primary full-width" disabled={normalizedCode.length < 4} onClick={() => setStep(1)}>{copy.continue}</button>
      </section>}

      {step === 1 && <section className="workspace player-card narrow">
        <div className="eyebrow">Personal UI</div><h1>{copy.language}</h1><p className="support">Your interface language is personal. It does not change the room language for everyone else.</p>
        <div className="language-list">{LOCALES.map((option) => <button key={option.id} className={`language-option ${locale === option.id ? 'selected' : ''}`} onClick={() => setLocale(option.id)}><span>{option.label}</span>{locale === option.id && <strong>✓</strong>}</button>)}</div>
        <div className="primary-row"><button className="btn secondary" onClick={() => setStep(0)}>{copy.back}</button><button className="btn primary" onClick={() => setStep(2)}>{copy.continue}</button></div>
      </section>}

      {step === 2 && <section className="workspace player-card">
        <div className="section-heading"><div><div className="eyebrow">{copy.identity}</div><h1>{copy.avatar} + {copy.nickname}</h1></div><div className="identity-preview"><span className="avatar-large">{selectedAvatar.emoji}</span><strong>{nickname}</strong></div></div>
        <div className="chip-row avatar-categories">{(Object.keys(CATEGORY_LABELS) as Avatar['category'][]).map((value) => <button key={value} className={`select-chip ${category === value ? 'selected' : ''}`} onClick={() => { setCategory(value); const first = AVATARS.find((avatar) => avatar.category === value)!; selectAvatar(first); }}>{CATEGORY_LABELS[value]}</button>)}</div>
        <div className="avatar-grid">{avatars.map((avatar) => <button key={avatar.id} className={`avatar-option ${avatarId === avatar.id ? 'selected' : ''}`} aria-label={avatar.label} onClick={() => selectAvatar(avatar)}><span>{avatar.emoji}</span><small>{avatar.label}</small></button>)}</div>
        <label className="form-label nickname-field">{copy.nickname}<input value={nickname} maxLength={24} onChange={(event) => setNickname(event.target.value)} /><small>{issue ?? 'Generated from the selected built-in avatar. Host rules may restrict edits.'}</small></label>
        <div className="notice">Photo upload is host-controlled and is off by default in Classroom mode. Uploaded photos are not used to infer identity, age, gender, ethnicity, or nicknames.</div>
        <div className="primary-row"><button className="btn secondary" onClick={() => setStep(1)}>{copy.back}</button><button className="btn primary" disabled={Boolean(issue)} onClick={() => setStep(3)}>{copy.continue}</button></div>
      </section>}

      {step === 3 && <section className="workspace player-card narrow waiting-stage">
        <div className="avatar-hero">{selectedAvatar.emoji}</div><div className="eyebrow">{copy.joinedAs}</div><h1>{nickname}</h1><div className="waiting-pulse" aria-hidden="true" /><h2>{copy.waiting}</h2><p className="support">{copy.waitingDetail}</p>
        <div className="lobby-summary"><div><span>{copy.roomCode}</span><strong>{normalizedCode}</strong></div><div><span>{copy.playerCount}</span><strong>8</strong></div><div><span>{copy.gamePreview}</span><strong>Bingo · 5 min</strong></div></div>
        <button className={`btn ${ready ? 'secondary' : 'primary'} full-width`} onClick={() => setReady(!ready)}>{ready ? `✓ ${copy.ready}` : copy.ready}</button>
        <button className="text-button centered" onClick={() => setStep(2)}>{copy.back}</button>
        <div className="prototype-next"><button className="btn secondary full-width" onClick={() => setStep(4)}>Simulate host starting game →</button></div>
      </section>}

      {step === 4 && <section className="workspace player-card narrow play-stage player-play">
        <div className="live-line"><span className="live-dot" /> LIVE · Bingo</div><div className="eyebrow">Rules</div><h1>Complete one line.</h1><p className="support">Mark items as the server calls them. A horizontal, vertical, or diagonal line wins. Random draws and winner validation are server-authoritative in production.</p>
        <div className="mini-bingo" aria-label="Bingo interaction preview">{[12,28,31,48,63,5,17,42,50,70,7,19,'★',57,68,1,26,33,46,72,11,20,44,49,66].map((value, index) => <button key={`${value}-${index}`} className={index % 4 === 0 ? 'marked' : ''}>{value}</button>)}</div>
        <button className="btn primary full-width" onClick={() => setStep(5)}>View result preview</button>
      </section>}

      {step === 5 && <section className="workspace player-card narrow results-stage">
        <div className="eyebrow">{copy.results}</div><div className="avatar-hero">{selectedAvatar.emoji}</div><h1>Nice game, {nickname}.</h1>
        <div className="private-result"><span>Your private placement</span><strong>#4</strong><small>Only the public podium is shown to everyone by the Classroom default.</small></div>
        <div className="mini-podium"><span>🥈 Player B</span><strong>🥇 Player A</strong><span>🥉 Player C</span></div>
        <button className="btn primary full-width" onClick={() => setStep(3)}>Stay for Replay / Next Game</button><button className="btn secondary full-width" onClick={onExit}>Leave room</button>
      </section>}
    </main>
  );
}
