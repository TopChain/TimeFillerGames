'use client';

import { useMemo, useState } from 'react';
import { BINGO_BOARDS, GAMES, LOCALES, TIME_PRESETS, type GameId, type Locale, type TimePreset } from '@/lib/product';
import { GROUP_CONTEXTS, evaluateReadiness, gamesForTime, getGame, type GroupContext, type RankingVisibility } from '@/lib/room-flow';

const STEPS = ['Choose time', 'Choose game', 'Configure', 'Open room', 'Run game', 'Results'] as const;

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
  const [activePlayers, setActivePlayers] = useState(0);
  const [reconnectingPlayers, setReconnectingPlayers] = useState(0);
  const [locked, setLocked] = useState(false);
  const [paused, setPaused] = useState(false);
  const [bingoSize, setBingoSize] = useState(6);
  const [answerTimer, setAnswerTimer] = useState(20);
  const [drawTimer, setDrawTimer] = useState(45);

  const compatible = useMemo(() => gamesForTime(minutes), [minutes]);
  const game = getGame(gameId);
  const setupComplete = gameId === 'bingo' ? bingoSize > 0 : gameId === 'majority-match' ? answerTimer > 0 : drawTimer > 0;
  const readiness = evaluateReadiness({ gameId, activePlayers, hostCap, setupComplete, reconnectingPlayers });
  const roomCode = 'TFG4821';

  function chooseTime(value: TimePreset) {
    setMinutes(value);
    const stillFits = GAMES.find((candidate) => candidate.id === gameId)?.times.includes(value);
    if (!stillFits) setGameId(gamesForTime(value)[0].id as GameId);
  }

  return (
    <main className="role-shell" data-app="host">
      <header className="role-topbar">
        <button className="text-button" onClick={onExit}>← TimeFillerGames</button>
        <div className="role-title"><span className="role-dot" /> Host</div>
        <span className="status-chip">Release 1 setup</span>
      </header>

      <ol className="progress" aria-label="Host setup progress">
        {STEPS.map((label, index) => <li key={label} className={index === step ? 'current' : index < step ? 'done' : ''}><span>{index + 1}</span>{label}</li>)}
      </ol>

      {step === 0 && <section className="workspace narrow">
        <div className="eyebrow">Time first</div>
        <h1>How much time does the group have?</h1>
        <p className="support">Normal sessions are designed around the four approved time targets. Lobby wait is separate from estimated play time.</p>
        <div className="choice-grid four">
          {TIME_PRESETS.map((value) => <button key={value} className={`choice-card ${minutes === value ? 'selected' : ''}`} onClick={() => chooseTime(value)}><strong>{value}</strong><span>minutes</span></button>)}
        </div>
        <div className="field-block">
          <label>Group context <span className="optional">optional</span></label>
          <div className="chip-row">{GROUP_CONTEXTS.map((value) => <button key={value} className={`select-chip ${context === value ? 'selected' : ''}`} onClick={() => setContext(value)}>{value}</button>)}</div>
        </div>
        <div className="primary-row"><button className="btn primary" onClick={() => setStep(1)}>Show compatible games →</button></div>
      </section>}

      {step === 1 && <section className="workspace">
        <div className="section-heading"><div><div className="eyebrow">Game library</div><h1>Games that fit {minutes} minutes</h1></div><button className="btn secondary" onClick={() => setStep(0)}>Change time</button></div>
        <div className="game-picker">
          {compatible.map((candidate) => <button key={candidate.id} className={`game-option ${gameId === candidate.id ? 'selected' : ''}`} onClick={() => setGameId(candidate.id as GameId)}>
            <div><span className={`game-accent ${candidate.accent}`} /><span className="release-label">{candidate.release}</span></div>
            <h2>{candidate.name}</h2><p>{candidate.mechanic}</p>
            <dl className="game-facts"><div><dt>Hard minimum</dt><dd>{candidate.hardMin}</dd></div><div><dt>Hard maximum</dt><dd>{candidate.hardMax ?? 'No game-rule maximum'}</dd></div><div><dt>Recommended</dt><dd>{candidate.recommended}</dd></div><div><dt>Shared screen</dt><dd>{candidate.sharedScreen}</dd></div><div><dt>Spectators</dt><dd>{candidate.spectator ? 'Supported' : 'Not default'}</dd></div></dl>
          </button>)}
        </div>
        <div className="primary-row"><button className="btn secondary" onClick={() => setStep(0)}>← Back</button><button className="btn primary" onClick={() => setStep(2)}>Configure {game.name} →</button></div>
      </section>}

      {step === 2 && <section className="workspace two-column">
        <div className="panel">
          <div className="eyebrow">Game setup</div><h1>{game.name}</h1><p className="support">One dominant action per decision point; settings remain neutral until a state changes.</p>
          {gameId === 'bingo' && <div className="field-block"><label>Board size</label><div className="chip-row">{BINGO_BOARDS.filter((board) => board.normal).map((board) => <button key={board.size} className={`select-chip ${bingoSize === board.size ? 'selected' : ''}`} onClick={() => setBingoSize(board.size)}>{board.size}×{board.size} · {board.estimate}</button>)}</div></div>}
          {gameId === 'majority-match' && <div className="field-block"><label>Answer timer</label><input type="range" min="10" max="45" step="5" value={answerTimer} onChange={(event) => setAnswerTimer(Number(event.target.value))} /><strong>{answerTimer} seconds</strong></div>}
          {gameId === 'quick-draw' && <div className="field-block"><label>Drawing / guessing timer</label><input type="range" min="30" max="90" step="15" value={drawTimer} onChange={(event) => setDrawTimer(Number(event.target.value))} /><strong>{drawTimer} seconds</strong></div>}
          {game.release !== 'R1' && <div className="notice warning">This game is specified for Release 1.1. Release 1 publication remains focused on Bingo, Majority Match, and Quick Draw & Guess.</div>}
        </div>
        <aside className="panel status-panel">
          <h2>Room defaults</h2>
          <label className="form-label">Room language<select value={roomLanguage} onChange={(event) => setRoomLanguage(event.target.value as Locale)}>{LOCALES.map((locale) => <option key={locale.id} value={locale.id}>{locale.label}</option>)}</select></label>
          <label className="form-label">Host participant cap<input type="number" min="1" placeholder="No host-set limit" value={hostCap ?? ''} onChange={(event) => setHostCap(event.target.value ? Number(event.target.value) : null)} /></label>
          <label className="toggle-row"><input type="checkbox" checked={allowLateJoin} onChange={(event) => setAllowLateJoin(event.target.checked)} /><span>Allow late joining between safe rounds</span></label>
          <label className="toggle-row"><input type="checkbox" checked={allowCustomPhotos} onChange={(event) => setAllowCustomPhotos(event.target.checked)} /><span>Allow custom photos {context === 'Classroom' && <small>(off by default in Classroom)</small>}</span></label>
          <label className="form-label">Lower ranking visibility<select value={rankingVisibility} onChange={(event) => setRankingVisibility(event.target.value as RankingVisibility)}><option value="podium">Podium + private placement</option><option value="top10">Top 10</option><option value="public">Fully public</option><option value="private">Private only</option></select></label>
        </aside>
        <div className="primary-row full"><button className="btn secondary" onClick={() => setStep(1)}>← Back</button><button className="btn primary" onClick={() => setStep(3)}>Create room preview →</button></div>
      </section>}

      {step === 3 && <section className="workspace two-column">
        <div className="panel room-status">
          <div className="live-line"><span className="live-dot" /> Room preview</div>
          <div className="room-code">{roomCode}</div>
          <p className="support">PIN · QR code · direct link are generated by the production room service. This release-candidate screen verifies the full lobby interaction before backend wiring.</p>
          <div className="share-grid"><div className="qr-placeholder" aria-label="QR code placeholder">QR</div><div><strong>Direct link</strong><code>/join?room={roomCode}</code><strong>Language</strong><span>{LOCALES.find((locale) => locale.id === roomLanguage)?.label}</span></div></div>
          <div className="lobby-count"><strong>{activePlayers}</strong><span>active participants</span></div>
          <div className="count-controls"><button aria-label="Remove preview participant" onClick={() => setActivePlayers(Math.max(0, activePlayers - 1))}>−</button><button aria-label="Add preview participant" onClick={() => setActivePlayers(activePlayers + 1)}>+</button></div>
          <label className="form-label">Reconnect grace preview<select value={reconnectingPlayers} onChange={(event) => setReconnectingPlayers(Number(event.target.value))}><option value="0">No reconnecting players</option><option value="1">1 reconnecting</option><option value="2">2 reconnecting</option></select></label>
        </div>
        <aside className="panel status-panel">
          <h2>Lobby controls</h2>
          <div className={`readiness ${readiness.state}`}><strong>{readiness.canStart ? '✓' : '!'} {readiness.state === 'ready' ? 'Ready' : 'Room status'}</strong><span>{readiness.message}</span></div>
          <button className="control-row" onClick={() => setLocked(!locked)}><span>Room access</span><strong>{locked ? 'Locked' : 'Unlocked'}</strong></button>
          <button className="control-row" onClick={() => setAllowLateJoin(!allowLateJoin)}><span>Late joining</span><strong>{allowLateJoin ? 'Between rounds' : 'Off'}</strong></button>
          <button className="control-row" onClick={() => setAllowCustomPhotos(!allowCustomPhotos)}><span>Custom photos</span><strong>{allowCustomPhotos ? 'Allowed' : 'Disabled'}</strong></button>
          <div className="control-row"><span>Game</span><strong>{game.name}</strong></div>
          <div className="control-row"><span>Duration target</span><strong>{minutes} min</strong></div>
          <button className="btn primary full-width" disabled={!readiness.canStart} onClick={() => setStep(4)}>Start game</button>
        </aside>
        <div className="primary-row full"><button className="btn secondary" onClick={() => setStep(2)}>← Edit setup</button></div>
      </section>}

      {step === 4 && <section className="workspace two-column">
        <div className="panel play-stage"><div className="live-line"><span className="live-dot" /> LIVE · {game.name}</div><h1>{paused ? 'Game paused' : 'Round in progress'}</h1><p className="support">Game-specific screen content plugs into the same server-authoritative room, timer, score, moderation, and reconnect infrastructure.</p><div className="demo-board"><span>{minutes}:00</span><strong>{activePlayers} players</strong></div></div>
        <aside className="panel status-panel"><h2>Host controls</h2><button className="btn primary full-width" onClick={() => setPaused(!paused)}>{paused ? 'Resume' : 'Pause'}</button><button className="btn secondary full-width">Skip current prompt</button><button className="btn secondary full-width">Participant moderation</button><button className="btn secondary full-width">Show / hide leaderboard</button><button className="btn danger full-width" onClick={() => setStep(5)}>End game</button></aside>
      </section>}

      {step === 5 && <section className="workspace narrow results-stage">
        <div className="eyebrow">Results</div><h1>Round complete</h1>
        <div className="podium"><div className="podium-place second">2<span>Player B</span></div><div className="podium-place first">1<span>Player A</span></div><div className="podium-place third">3<span>Player C</span></div></div>
        <p className="support">Lower rankings: <strong>{rankingVisibility}</strong>. Classroom default keeps individual placement private below the public podium.</p>
        <div className="primary-row"><button className="btn primary" onClick={() => setStep(3)}>Replay</button><button className="btn secondary" onClick={() => setStep(1)}>Change game · keep room</button><button className="btn danger" onClick={onExit}>End room</button></div>
      </section>}
    </main>
  );
}
