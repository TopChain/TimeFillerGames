'use client';

import { useMemo, useState } from 'react';
import { GAMES, TIME_PRESETS, type TimePreset } from '@/lib/product';

export default function HomePage() {
  const [minutes, setMinutes] = useState<TimePreset>(5);
  const compatible = useMemo(() => GAMES.filter((g) => g.times.includes(minutes)), [minutes]);

  return (
    <main className="shell">
      <nav className="nav" aria-label="Primary">
        <div className="brand">⏱ TimeFillerGames</div>
        <div className="actions">
          <button className="btn player">Join Room</button>
          <button className="btn host">Host a Game</button>
        </div>
      </nav>

      <section className="hero">
        <div>
          <div className="kicker">Short games · real connections</div>
          <h1>Make every spare moment playable.</h1>
          <p>Choose how much time your group has, open a room, and launch a ready-made multiplayer game. Participants join from their phones without creating an account.</p>
          <div className="actions"><button className="btn host">Host a Game</button><button className="btn ghost">Join With Code</button></div>
        </div>
        <div className="card" style={{color:'#111827'}}>
          <b>Time-first setup</b>
          <p className="muted">The host chooses 3, 5, 8, or 10 minutes first. Game settings and readiness then adapt to the available time and group size.</p>
          <div className="time-grid" aria-label="Available time">
            {TIME_PRESETS.map((t) => <button key={t} className={`time ${minutes===t?'active':''}`} onClick={() => setMinutes(t)}>{t}<small style={{display:'block',fontSize:11}}>min</small></button>)}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-head"><div><div className="kicker" style={{color:'#5B5DEE'}}>Game library</div><h2>Games that fit {minutes} minutes</h2></div><span className="muted">Release 1 first · Release 1.1 follows</span></div>
        <div className="game-grid">
          {compatible.map((g) => (
            <article className={`card ${g.accent}`} key={g.id}>
              <span className="pill release">{g.release}</span>
              <h3>{g.name}</h3><p className="muted">{g.mechanic}</p>
              <div className="meta"><span className="pill">Min {g.hardMin}</span><span className="pill">No game-rule maximum</span><span className="pill">Best {g.recommended}</span><span className="pill">Screen: {g.sharedScreen}</span></div>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head"><div><div className="kicker" style={{color:'#0F7A86'}}>Host journey</div><h2>From spare time to live game</h2></div></div>
        <div className="flow">
          {['Choose time','Choose game','Configure','Open room','Lobby check','Run game','Results'].map((label,i)=><div className="step" key={label}><b>{i+1}</b>{label}</div>)}
        </div>
      </section>

      <section className="section">
        <div className="section-head"><div><div className="kicker" style={{color:'#0F7A86'}}>Participant journey</div><h2>Zero-friction joining</h2></div></div>
        <div className="flow">
          {['PIN / QR / link','Language','Avatar + name','Lobby','Play','Podium','Private result'].map((label,i)=><div className="step" key={label}><b>{i+1}</b>{label}</div>)}
        </div>
      </section>

      <footer className="footer">TimeFillerGames · Any time. Any group. Instant play.</footer>
    </main>
  );
}
