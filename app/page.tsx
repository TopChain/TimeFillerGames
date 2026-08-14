'use client';

import { useEffect, useMemo, useState } from 'react';
import { HostFlow } from '@/components/host-flow';
import { PlayerFlow } from '@/components/player-flow';
import { RecoveredHostFlow } from '@/components/recovered-host-flow';
import { GAMES, TIME_PRESETS, type TimePreset } from '@/lib/product';

type Mode = 'home' | 'host' | 'player' | 'recovered-host';

export default function HomePage() {
  const [mode, setMode] = useState<Mode>('home');
  const [recoveredRoomCode, setRecoveredRoomCode] = useState('');
  const [minutes, setMinutes] = useState<TimePreset>(5);
  const compatible = useMemo(() => GAMES.filter((game) => game.times.includes(minutes)), [minutes]);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const recovered = (query.get('recoveredHost') ?? '').trim().toUpperCase();
    if (recovered) {
      setRecoveredRoomCode(recovered);
      setMode('recovered-host');
      return;
    }
    if (query.get('nativeHost') === '1') {
      setMode('host');
      return;
    }
    if (query.get('join') || query.get('room')) setMode('player');
  }, []);

  function exitSpecialFlow() {
    window.history.replaceState({}, '', '/');
    setRecoveredRoomCode('');
    setMode('home');
  }

  if (mode === 'host') return <HostFlow onExit={exitSpecialFlow} />;
  if (mode === 'player') return <PlayerFlow onExit={exitSpecialFlow} />;
  if (mode === 'recovered-host' && recoveredRoomCode) return <RecoveredHostFlow roomCode={recoveredRoomCode} onExit={exitSpecialFlow} />;

  return (
    <main className="shell">
      <nav className="nav" aria-label="Primary">
        <div className="brand"><span className="brand-symbol" aria-hidden="true">◴</span><span>TimeFillerGames</span></div>
        <div className="actions"><button className="btn player" onClick={() => setMode('player')}>Join Room</button><button className="btn host" onClick={() => setMode('host')}>Host a Game</button></div>
      </nav>

      <section className="hero">
        <div><div className="kicker">Short games · real connections</div><h1>Make every spare moment playable.</h1><p>Choose how much time your group has, open a room, and launch a ready-made multiplayer game. Participants join from their phones without creating a visible account.</p><div className="actions"><button className="btn hero-primary" onClick={() => setMode('host')}>Host a Game</button><button className="btn ghost" onClick={() => setMode('player')}>Join With Code</button></div></div>
        <div className="card hero-card"><b>Time-first setup</b><p className="muted">The host chooses 3, 5, 8, or 10 minutes first. Game settings and readiness then adapt to the available time and group size.</p><div className="time-grid" aria-label="Available time">{TIME_PRESETS.map((time) => <button key={time} className={`time ${minutes === time ? 'active' : ''}`} onClick={() => setMinutes(time)}>{time}<small>min</small></button>)}</div></div>
      </section>

      <section className="section">
        <div className="section-head"><div><div className="kicker host-kicker">Game library</div><h2>Games that fit {minutes} minutes</h2></div><span className="muted">Release 1 first · Release 1.1 follows</span></div>
        <div className="game-grid">{compatible.map((game) => <article className={`card ${game.accent}`} key={game.id}><span className="pill release">{game.release}</span><h3>{game.name}</h3><p className="muted">{game.mechanic}</p><div className="meta"><span className="pill">Min {game.hardMin}</span><span className="pill">{game.hardMax ?? 'No game-rule maximum'}</span><span className="pill">Best {game.recommended}</span><span className="pill">Screen: {game.sharedScreen}</span></div></article>)}</div>
      </section>

      <section className="role-preview-grid">
        <button className="role-preview host-preview" onClick={() => setMode('host')}><span className="eyebrow">TimeFillerGames Host</span><h2>Confident control</h2><p>Choose time, filter the game shelf, configure rules, open the room, verify readiness, run the game, and review results.</p><strong>Open Host flow →</strong></button>
        <button className="role-preview player-preview" onClick={() => setMode('player')}><span className="eyebrow">TimeFillerGames Player</span><h2>Immediate participation</h2><p>Join by PIN/QR/link, choose language, avatar and nickname, wait in the lobby, play, and receive public + private results.</p><strong>Open Player flow →</strong></button>
      </section>

      <footer className="footer">TimeFillerGames · Make every spare moment playable.</footer>
    </main>
  );
}
