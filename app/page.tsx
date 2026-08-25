'use client';

import { useEffect, useMemo, useState } from 'react';
import { HostFlowV2 } from '@/components/host-flow-v2';
import { PlayerFlow } from '@/components/player-flow';
import { RecoveredHostFlow } from '@/components/recovered-host-flow';
import { GAMES, LOCALES, TIME_PRESETS, type Locale, type TimePreset } from '@/lib/product';
import { isRelease1Game } from '@/lib/release1-policy';
import { SHELL_UI_COPY } from '@/lib/shell-ui-copy';

const UI_LOCALE_KEY = 'timefillergames:ui-locale';
type Mode = 'home' | 'host' | 'player' | 'recovered-host';

export default function HomePage() {
  const [mode, setMode] = useState<Mode>('home');
  const [recoveredRoomCode, setRecoveredRoomCode] = useState('');
  const [minutes, setMinutes] = useState<TimePreset>(5);
  const [locale, setLocale] = useState<Locale>('en');
  const copy = SHELL_UI_COPY[locale];
  const compatible = useMemo(() => GAMES.filter((game) => game.times.includes(minutes) && isRelease1Game(game.id)), [minutes]);

  useEffect(() => {
    const saved = localStorage.getItem(UI_LOCALE_KEY) as Locale | null;
    if (saved && LOCALES.some((item) => item.id === saved)) setLocale(saved);
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

  useEffect(() => {
    localStorage.setItem(UI_LOCALE_KEY, locale);
    document.documentElement.lang = locale;
  }, [locale]);

  function exitSpecialFlow() {
    window.history.replaceState({}, '', '/');
    setRecoveredRoomCode('');
    setMode('home');
  }

  if (mode === 'host') return <HostFlowV2 onExit={exitSpecialFlow} />;
  if (mode === 'player') return <PlayerFlow onExit={exitSpecialFlow} />;
  if (mode === 'recovered-host' && recoveredRoomCode) return <RecoveredHostFlow roomCode={recoveredRoomCode} onExit={exitSpecialFlow} />;

  return (
    <main className="shell">
      <nav className="nav" aria-label="TimeFillerGames">
        <div className="brand"><img src="/brand/timefillergames-mark.svg" alt="" width="32" height="32" /><span>TimeFillerGames</span></div>
        <div className="actions">
          <label className="form-label" style={{minWidth:150}}>{copy.interfaceLanguage}<select value={locale} onChange={(event)=>setLocale(event.target.value as Locale)}>{LOCALES.map((item)=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
          <button className="btn player" onClick={() => setMode('player')}>{copy.joinRoom}</button><button className="btn host" onClick={() => setMode('host')}>{copy.hostGame}</button>
        </div>
      </nav>

      <section className="hero">
        <div><div className="kicker">{copy.tagline}</div><h1>{copy.hero}</h1><p>{copy.intro}</p><div className="actions"><button className="btn hero-primary" onClick={() => setMode('host')}>{copy.hostGame}</button><button className="btn ghost" onClick={() => setMode('player')}>{copy.joinCode}</button></div></div>
        <div className="card hero-card"><b>{copy.timeFirst}</b><p className="muted">{copy.timeHelp}</p><div className="time-grid" aria-label={copy.availableTime}>{TIME_PRESETS.map((time) => <button key={time} className={`time ${minutes === time ? 'active' : ''}`} onClick={() => setMinutes(time)}>{time}<small>{copy.min}</small></button>)}</div></div>
      </section>

      <section className="section">
        <div className="section-head"><div><div className="kicker host-kicker">{copy.gameLibrary}</div><h2>{copy.gamesFit(minutes)}</h2></div><span className="muted">{copy.releaseNote}</span></div>
        <div className="game-grid">{compatible.map((game) => <article className={`card ${game.accent}`} key={game.id}><span className="pill release">Release 1</span><h3>{game.name}</h3><div className="meta"><span className="pill">{copy.minPlayers} {game.hardMin}</span><span className="pill">{game.hardMax ?? copy.noGameMaximum}</span>{game.recommended ? <span className="pill">{copy.best} {game.recommended}</span> : null}<span className="pill">{copy.screen}: {game.sharedScreen}</span></div></article>)}</div>
      </section>

      <section className="role-preview-grid">
        <button className="role-preview host-preview" onClick={() => setMode('host')}><span className="eyebrow">{copy.hostTitle}</span><h2>{copy.hostSubtitle}</h2><p>{copy.hostBody}</p><strong>{copy.openHost}</strong></button>
        <button className="role-preview player-preview" onClick={() => setMode('player')}><span className="eyebrow">{copy.playerTitle}</span><h2>{copy.playerSubtitle}</h2><p>{copy.playerBody}</p><strong>{copy.openPlayer}</strong></button>
      </section>

      <footer className="footer">TimeFillerGames · {copy.footer}</footer>
    </main>
  );
}
