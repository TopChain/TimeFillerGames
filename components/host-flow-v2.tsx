'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { BINGO_BOARDS, GAMES, LOCALES, TIME_PRESETS, type GameId, type Locale, type TimePreset } from '@/lib/product';
import { GROUP_CONTEXTS, evaluateReadiness, gamesForTime, getGame, type GroupContext, type RankingVisibility } from '@/lib/room-flow';
import { createLiveRoom, fetchRoomSnapshot, updateLiveRoom, type LiveRoom, type RoomSnapshot } from '@/lib/client-room';
import { startBingo } from '@/lib/client-bingo';
import { startPeopleBingoClient } from '@/lib/client-people-bingo';
import { startMajorityMatchClient } from '@/lib/client-majority-match';
import { startQuickDrawClient } from '@/lib/client-quick-draw';
import type { MajorityCategory } from '@/lib/majority-match-content';
import type { QuickDrawCategory, QuickDrawDifficulty } from '@/lib/quick-draw-content';
import { hasBrowserSupabaseConfig, permanentHostSession, requestHostMagicLink } from '@/lib/supabase/browser';
import { subscribeToRoom } from '@/lib/realtime-client';
import { HOST_UI_COPY } from '@/lib/host-ui-copy';
import { BingoHostPanel } from '@/components/bingo-host-panel';
import { BingoResultsPanel } from '@/components/bingo-results-panel';
import { PeopleBingoHostPanel } from '@/components/people-bingo-host-panel';
import { PeopleBingoResultsPanel } from '@/components/people-bingo-results-panel';
import { MajorityMatchHostPanel } from '@/components/majority-match-host-panel';
import { MajorityMatchResultsPanel } from '@/components/majority-match-results-panel';
import { QuickDrawHostPanel } from '@/components/quick-draw-host-panel';
import { QuickDrawResultsPanel } from '@/components/quick-draw-results-panel';
import { RoomQrCode } from '@/components/room-qr-code';
import { HostModerationPanel } from '@/components/host-moderation-panel';

const BINGO_CARD_TIMERS = [10, 15, 20, 30, 60] as const;
const PEOPLE_BINGO_MINIMUM = 25;
const MAJORITY_CATEGORIES: MajorityCategory[] = ['Classroom', 'Friends', 'Family', 'Workplace', 'General'];
const MAJORITY_COUNT_FOR_TIME: Record<TimePreset, number> = { 3: 3, 5: 4, 8: 5, 10: 6 };
const QUICK_DRAW_CATEGORIES: QuickDrawCategory[] = ['Everyday', 'Animals', 'Food', 'Places'];
const QUICK_DRAW_DIFFICULTIES: QuickDrawDifficulty[] = ['easy', 'medium', 'hard'];
const QUICK_DRAW_TURNS_FOR_TIME: Record<TimePreset, number> = { 3: 2, 5: 3, 8: 4, 10: 5 };
const RELEASE1_GAME_IDS: GameId[] = ['bingo', 'majority-match', 'quick-draw'];
const UI_LOCALE_KEY = 'timefillergames:host-ui-locale';

type BingoMode = 'standard-number' | 'people';

function translatedContext(locale: Locale, context: GroupContext) {
  const map: Record<Locale, Record<GroupContext, string>> = {
    en:{Classroom:'Classroom',Friends:'Friends',Family:'Family',Workplace:'Workplace','Mixed Group':'Mixed Group'},
    'zh-Hant':{Classroom:'教室',Friends:'朋友',Family:'家庭',Workplace:'工作場合','Mixed Group':'混合團體'},
    'zh-Hans':{Classroom:'教室',Friends:'朋友',Family:'家庭',Workplace:'工作场合','Mixed Group':'混合团队'},
    es:{Classroom:'Aula',Friends:'Amigos',Family:'Familia',Workplace:'Trabajo','Mixed Group':'Grupo mixto'},
    ja:{Classroom:'教室',Friends:'友人',Family:'家族',Workplace:'職場','Mixed Group':'混合グループ'},
    ko:{Classroom:'교실',Friends:'친구',Family:'가족',Workplace:'직장','Mixed Group':'혼합 그룹'},
  };
  return map[locale][context];
}

function gameDisplayName(locale: Locale, id: GameId) {
  const names: Record<Locale, Record<GameId, string>> = {
    en:{bingo:'Bingo','majority-match':'Majority Match','quick-draw':'Quick Draw & Guess','word-challenge':'Word Challenge','math-challenge':'Math Challenge'},
    'zh-Hant':{bingo:'Bingo','majority-match':'多數派配對','quick-draw':'快畫快猜','word-challenge':'英文單字挑戰','math-challenge':'數學挑戰'},
    'zh-Hans':{bingo:'Bingo','majority-match':'多数派配对','quick-draw':'快画快猜','word-challenge':'英语单词挑战','math-challenge':'数学挑战'},
    es:{bingo:'Bingo','majority-match':'Coincide con la mayoría','quick-draw':'Dibuja y adivina','word-challenge':'Reto de palabras','math-challenge':'Reto de matemáticas'},
    ja:{bingo:'Bingo','majority-match':'多数派マッチ','quick-draw':'クイックお絵かき','word-challenge':'英単語チャレンジ','math-challenge':'数学チャレンジ'},
    ko:{bingo:'Bingo','majority-match':'다수 선택 맞히기','quick-draw':'빠른 그림 맞히기','word-challenge':'영단어 챌린지','math-challenge':'수학 챌린지'},
  };
  return names[locale][id];
}

export function HostFlowV2({ onExit }: { onExit: () => void }) {
  const [uiLocale, setUiLocale] = useState<Locale>('en');
  const copy = HOST_UI_COPY[uiLocale];
  const [step, setStep] = useState(0);
  const [minutes, setMinutes] = useState<TimePreset>(5);
  const [context, setContext] = useState<GroupContext | null>('Classroom');
  const [gameId, setGameId] = useState<GameId>('bingo');
  const [hostCap, setHostCap] = useState<number | null>(null);
  const [roomLanguage, setRoomLanguage] = useState<Locale>('en');
  const [allowLateJoin, setAllowLateJoin] = useState(true);
  const [rankingVisibility, setRankingVisibility] = useState<RankingVisibility>('podium');

  const [bingoMode, setBingoMode] = useState<BingoMode>('standard-number');
  const [bingoSize, setBingoSize] = useState(6);
  const [bingoCardChoiceSeconds, setBingoCardChoiceSeconds] = useState(20);

  const [majorityCategory, setMajorityCategory] = useState<MajorityCategory>('Classroom');
  const [majorityQuestionCount, setMajorityQuestionCount] = useState(4);
  const [majorityAnonymousResults, setMajorityAnonymousResults] = useState(true);
  const [majorityShowPercentages, setMajorityShowPercentages] = useState(true);
  const [answerTimer, setAnswerTimer] = useState(20);

  const [drawTimer, setDrawTimer] = useState(45);
  const [quickDrawArtistTurns, setQuickDrawArtistTurns] = useState(3);
  const [quickDrawArtistSelection, setQuickDrawArtistSelection] = useState<'random' | 'join-order'>('random');
  const [quickDrawCategory, setQuickDrawCategory] = useState<QuickDrawCategory>('Everyday');
  const [quickDrawDifficulty, setQuickDrawDifficulty] = useState<QuickDrawDifficulty>('easy');
  const [quickDrawAudienceGuessing, setQuickDrawAudienceGuessing] = useState(true);
  const [quickDrawTimeBonus, setQuickDrawTimeBonus] = useState(true);

  const [hostEmail, setHostEmail] = useState('');
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [hostUserId, setHostUserId] = useState<string | null>(null);
  const [authLabel, setAuthLabel] = useState(copy.checkingSignIn);
  const [liveRoom, setLiveRoom] = useState<LiveRoom | null>(null);
  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState('offline');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(UI_LOCALE_KEY) as Locale | null;
    if (saved && LOCALES.some((locale) => locale.id === saved)) setUiLocale(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem(UI_LOCALE_KEY, uiLocale);
    document.documentElement.lang = uiLocale;
  }, [uiLocale]);

  const compatible = useMemo(() => gamesForTime(minutes).filter((candidate) => RELEASE1_GAME_IDS.includes(candidate.id as GameId)), [minutes]);
  const game = getGame(gameId);
  const activePlayers = snapshot?.counts.active ?? 0;
  const reconnectingPlayers = snapshot?.counts.reconnecting ?? 0;
  const standardReadiness = evaluateReadiness({ gameId, activePlayers, hostCap, setupComplete: true, reconnectingPlayers });
  const readiness = gameId === 'bingo' && bingoMode === 'people'
    ? activePlayers < PEOPLE_BINGO_MINIMUM
      ? { state:'below-minimum', canStart:false, message:copy.peopleNeed(activePlayers, PEOPLE_BINGO_MINIMUM-activePlayers) }
      : { state:'ready', canStart:true, message:copy.peopleReady(activePlayers) }
    : standardReadiness;

  useEffect(() => {
    let cancelled = false;
    if (!hasBrowserSupabaseConfig()) {
      setAuthLabel(copy.credentialsMissing);
      return;
    }
    permanentHostSession().then((session) => {
      if (cancelled) return;
      if (!session) { setAuthLabel(copy.signInRequired); return; }
      setAccessToken(session.access_token);
      setHostUserId(session.user.id);
      setAuthLabel(session.user.email ?? copy.host);
    }).catch(() => !cancelled && setAuthLabel(copy.signInRequired));
    return () => { cancelled = true; };
  }, [copy.credentialsMissing, copy.host, copy.signInRequired]);

  const refreshSnapshot = useCallback(async () => {
    if (!liveRoom || !accessToken) return;
    try {
      const next = await fetchRoomSnapshot(accessToken, liveRoom.join_code);
      setSnapshot(next);
      setLiveRoom(next.room);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : copy.roomStatus);
    }
  }, [accessToken, copy.roomStatus, liveRoom]);

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
    }).then((unsubscribe) => { if (cancelled) void unsubscribe(); else cleanup = unsubscribe; })
      .catch((cause) => setError(cause instanceof Error ? cause.message : copy.connection));
    return () => { cancelled = true; window.clearInterval(interval); if (cleanup) void cleanup(); };
  }, [accessToken, copy.connection, hostUserId, liveRoom?.id, liveRoom?.join_code, liveRoom?.status, refreshSnapshot]);

  function chooseTime(value: TimePreset) {
    setMinutes(value);
    setMajorityQuestionCount(MAJORITY_COUNT_FOR_TIME[value]);
    setQuickDrawArtistTurns(QUICK_DRAW_TURNS_FOR_TIME[value]);
    if (!compatible.some((candidate) => candidate.id === gameId)) setGameId('bingo');
  }

  async function sendMagicLink() {
    setBusy(true); setError(null);
    try {
      if (!hostEmail.trim()) throw new Error(copy.hostEmail);
      await requestHostMagicLink(hostEmail);
      setAuthLabel(copy.checkEmail);
    } catch (cause) { setError(cause instanceof Error ? cause.message : copy.signInRequired); }
    finally { setBusy(false); }
  }

  async function createOrUpdateRoom() {
    setBusy(true); setError(null);
    try {
      const session = await permanentHostSession();
      if (!session) throw new Error(copy.signInRequired);
      setAccessToken(session.access_token); setHostUserId(session.user.id);
      const payload = { minutes, context, gameId, hostCap, roomLanguage, allowCustomPhotos:false, allowLateJoin, rankingVisibility };
      const result = liveRoom ? await updateLiveRoom(session.access_token, liveRoom.join_code, payload) : await createLiveRoom(session.access_token, payload);
      setLiveRoom(result.room); setStep(3);
    } catch (cause) { setError(cause instanceof Error ? cause.message : copy.roomStatus); }
    finally { setBusy(false); }
  }

  async function patchRoom(input: Parameters<typeof updateLiveRoom>[2]) {
    if (!liveRoom || !accessToken) return;
    setBusy(true); setError(null);
    try {
      const result = await updateLiveRoom(accessToken, liveRoom.join_code, input);
      setLiveRoom(result.room);
      if (input.allowLateJoin !== undefined) setAllowLateJoin(input.allowLateJoin);
      if (input.rankingVisibility !== undefined) setRankingVisibility(input.rankingVisibility);
      await refreshSnapshot();
    } catch (cause) { setError(cause instanceof Error ? cause.message : copy.roomStatus); throw cause; }
    finally { setBusy(false); }
  }

  async function startGame() {
    if (!liveRoom || !accessToken) return;
    setBusy(true); setError(null);
    try {
      if (gameId === 'bingo') {
        if (bingoMode === 'people') await startPeopleBingoClient(accessToken, liveRoom.join_code, bingoCardChoiceSeconds);
        else await startBingo(accessToken, liveRoom.join_code, bingoSize, bingoCardChoiceSeconds);
      } else if (gameId === 'majority-match') {
        await startMajorityMatchClient(accessToken, liveRoom.join_code, { category:majorityCategory, questionCount:majorityQuestionCount, answerSeconds:answerTimer, anonymousResults:majorityAnonymousResults, showPercentages:majorityShowPercentages });
      } else if (gameId === 'quick-draw') {
        await startQuickDrawClient(accessToken, liveRoom.join_code, { drawingSeconds:drawTimer, artistTurns:Math.min(quickDrawArtistTurns, Math.max(1,activePlayers)), artistSelection:quickDrawArtistSelection, wordCategory:quickDrawCategory, wordDifficulty:quickDrawDifficulty, guessVisibility:'hidden-until-correct', audienceGuessing:quickDrawAudienceGuessing, timeBonus:quickDrawTimeBonus });
      }
      setStep(4); await refreshSnapshot();
    } catch (cause) { setError(cause instanceof Error ? cause.message : copy.startGame); }
    finally { setBusy(false); }
  }

  async function replay() { await patchRoom({status:'lobby'}); setStep(3); }
  async function changeGame() { if (liveRoom?.status !== 'lobby') await patchRoom({status:'lobby'}); setStep(1); }
  async function endRoom() { await patchRoom({status:'closed'}); onExit(); }

  return <main className="role-shell" data-app="host">
    <header className="role-topbar">
      <button className="text-button" onClick={onExit}>← TimeFillerGames</button>
      <div className="role-title"><span className="role-dot" /> {copy.host}</div>
      <label className="form-label" style={{minWidth:150}}>{copy.interfaceLanguage}<select value={uiLocale} onChange={(event)=>setUiLocale(event.target.value as Locale)}>{LOCALES.map((locale)=><option key={locale.id} value={locale.id}>{locale.label}</option>)}</select></label>
      <span className="status-chip">{liveRoom ? `${liveRoom.join_code} · ${realtimeStatus}` : copy.releaseSetup}</span>
    </header>
    <ol className="progress" aria-label={copy.host}>{copy.steps.map((label,index)=><li key={label} className={index===step?'current':index<step?'done':''}><span>{index+1}</span>{label}</li>)}</ol>
    {error && <div className="workspace narrow"><div className="notice warning" role="alert">{error}</div></div>}

    {step===0 && <section className="workspace narrow">
      <div className="eyebrow">{copy.timeFirst}</div><h1>{copy.timeQuestion}</h1><p className="support">{copy.timeHelp}</p>
      <div className="choice-grid four">{TIME_PRESETS.map((value)=><button key={value} className={`choice-card ${minutes===value?'selected':''}`} onClick={()=>chooseTime(value)}><strong>{value}</strong><span>{copy.minutes}</span></button>)}</div>
      <div className="field-block"><label>{copy.groupContext} <span className="optional">{copy.optional}</span></label><div className="chip-row">{GROUP_CONTEXTS.map((value)=><button key={value} className={`select-chip ${context===value?'selected':''}`} onClick={()=>setContext(value)}>{translatedContext(uiLocale,value)}</button>)}</div></div>
      <div className="primary-row"><button className="btn primary" onClick={()=>setStep(1)}>{copy.showGames}</button></div>
    </section>}

    {step===1 && <section className="workspace">
      <div className="section-heading"><div><div className="eyebrow">{copy.gameLibrary}</div><h1>{copy.gamesFit(minutes)}</h1></div><button className="btn secondary" onClick={()=>setStep(0)}>{copy.changeTime}</button></div>
      <div className="game-picker">{compatible.map((candidate)=><button key={candidate.id} className={`game-option ${gameId===candidate.id?'selected':''}`} onClick={()=>setGameId(candidate.id as GameId)}><div><span className={`game-accent ${candidate.accent}`} /><span className="release-label">{candidate.release}</span></div><h2>{gameDisplayName(uiLocale,candidate.id as GameId)}</h2><dl className="game-facts"><div><dt>{copy.hardMinimum}</dt><dd>{candidate.hardMin}</dd></div><div><dt>{copy.hardMaximum}</dt><dd>{candidate.hardMax??copy.noGameMaximum}</dd></div><div><dt>{copy.recommended}</dt><dd>{candidate.recommended}</dd></div><div><dt>{copy.sharedScreen}</dt><dd>{candidate.sharedScreen}</dd></div><div><dt>{copy.spectators}</dt><dd>{candidate.spectator?copy.supported:copy.notDefault}</dd></div></dl></button>)}</div>
      <div className="primary-row"><button className="btn secondary" onClick={()=>setStep(0)}>{copy.back}</button><button className="btn primary" onClick={()=>setStep(2)}>{copy.configure(gameDisplayName(uiLocale,gameId))}</button></div>
    </section>}

    {step===2 && <section className="workspace two-column">
      <div className="panel"><div className="eyebrow">{copy.gameSetup}</div><h1>{gameDisplayName(uiLocale,gameId)}</h1><p className="support">{copy.settingsValidated}</p>
        {gameId==='bingo' && <><div className="field-block"><label>{copy.bingoMode}</label><div className="chip-row"><button className={`select-chip ${bingoMode==='standard-number'?'selected':''}`} onClick={()=>setBingoMode('standard-number')}>{copy.standardNumber}</button><button className={`select-chip ${bingoMode==='people'?'selected':''}`} onClick={()=>setBingoMode('people')}>{copy.peopleBingo}</button></div></div>{bingoMode==='standard-number'?<div className="field-block"><label>{copy.boardSize}</label><div className="chip-row">{BINGO_BOARDS.filter((board)=>board.normal).map((board)=><button key={board.size} className={`select-chip ${bingoSize===board.size?'selected':''}`} onClick={()=>setBingoSize(board.size)}>{board.size}×{board.size} · {board.estimate}</button>)}</div></div>:<div className="field-block"><label>{copy.peopleBoard}</label><div className="chip-row"><button className="select-chip selected">5×5 · Release 1</button><button className="select-chip" disabled>6×6 · {copy.testFirst}</button><button className="select-chip" disabled>7×7+ · {copy.future}</button></div><div className={`notice ${activePlayers>=PEOPLE_BINGO_MINIMUM?'success':'warning'}`}>{activePlayers>=PEOPLE_BINGO_MINIMUM?copy.peopleReady(activePlayers):copy.peopleNeed(activePlayers,PEOPLE_BINGO_MINIMUM-activePlayers)}</div><small>{copy.peopleFairness}</small></div>}<div className="field-block"><label>{copy.cardTimer}</label><div className="chip-row">{BINGO_CARD_TIMERS.map((seconds)=><button key={seconds} className={`select-chip ${bingoCardChoiceSeconds===seconds?'selected':''}`} onClick={()=>setBingoCardChoiceSeconds(seconds)}>{seconds}s</button>)}</div><small>{copy.cardTimerHelp}</small></div></>}
        {gameId==='majority-match' && <><div className="field-block"><label>{copy.category}</label><div className="chip-row">{MAJORITY_CATEGORIES.map((value)=><button key={value} className={`select-chip ${majorityCategory===value?'selected':''}`} onClick={()=>setMajorityCategory(value)}>{value}</button>)}</div></div><div className="field-block"><label>{copy.questionCount}</label><div className="chip-row">{[3,4,5,6].map((count)=><button key={count} className={`select-chip ${majorityQuestionCount===count?'selected':''}`} onClick={()=>setMajorityQuestionCount(count)}>{count}</button>)}</div><small>{copy.pacingHelp}</small></div><div className="field-block"><label>{copy.answerTimer}</label><input type="range" min="10" max="45" step="5" value={answerTimer} onChange={(event)=>setAnswerTimer(Number(event.target.value))}/><strong>{answerTimer} {copy.seconds}</strong></div><label className="toggle-row"><input type="checkbox" checked={majorityAnonymousResults} onChange={(event)=>setMajorityAnonymousResults(event.target.checked)}/><span>{copy.anonymousResults}</span></label><label className="toggle-row"><input type="checkbox" checked={majorityShowPercentages} onChange={(event)=>setMajorityShowPercentages(event.target.checked)}/><span>{copy.displayPercentages}</span></label><div className="notice">{copy.majorityRule}</div></>}
        {gameId==='quick-draw' && <><div className="field-block"><label>{copy.drawingTime}</label><input type="range" min="20" max="120" step="5" value={drawTimer} onChange={(event)=>setDrawTimer(Number(event.target.value))}/><strong>{drawTimer} {copy.seconds}</strong></div><div className="field-block"><label>{copy.artistTurns}</label><div className="chip-row">{[1,2,3,4,5,6].map((turns)=><button key={turns} className={`select-chip ${quickDrawArtistTurns===turns?'selected':''}`} onClick={()=>setQuickDrawArtistTurns(turns)}>{turns}</button>)}</div><small>{copy.artistTurnsHelp}</small></div><div className="field-block"><label>{copy.artistSelection}</label><div className="chip-row"><button className={`select-chip ${quickDrawArtistSelection==='random'?'selected':''}`} onClick={()=>setQuickDrawArtistSelection('random')}>{copy.random}</button><button className={`select-chip ${quickDrawArtistSelection==='join-order'?'selected':''}`} onClick={()=>setQuickDrawArtistSelection('join-order')}>{copy.joinOrder}</button></div></div><div className="field-block"><label>{copy.wordCategory}</label><div className="chip-row">{QUICK_DRAW_CATEGORIES.map((value)=><button key={value} className={`select-chip ${quickDrawCategory===value?'selected':''}`} onClick={()=>setQuickDrawCategory(value)}>{value}</button>)}</div><small>{copy.curatedWordBank}</small></div><div className="field-block"><label>{copy.wordDifficulty}</label><div className="chip-row">{QUICK_DRAW_DIFFICULTIES.map((value)=><button key={value} className={`select-chip ${quickDrawDifficulty===value?'selected':''}`} onClick={()=>setQuickDrawDifficulty(value)}>{value}</button>)}</div></div><div className="notice">{copy.hiddenGuessing}</div><label className="toggle-row"><input type="checkbox" checked={quickDrawAudienceGuessing} onChange={(event)=>setQuickDrawAudienceGuessing(event.target.checked)}/><span>{copy.audienceGuessing}</span></label><label className="toggle-row"><input type="checkbox" checked={quickDrawTimeBonus} onChange={(event)=>setQuickDrawTimeBonus(event.target.checked)}/><span>{copy.timeComponent}</span></label><div className="notice">{copy.fuzzyRule}</div></>}
        <div className="field-block"><label>{copy.hostSignIn}</label><p className="support">{authLabel}</p>{!accessToken&&<><input type="email" autoComplete="email" aria-label={copy.hostEmail} placeholder={copy.hostEmail} value={hostEmail} onChange={(event)=>setHostEmail(event.target.value)}/><button className="btn secondary" disabled={busy||!hasBrowserSupabaseConfig()} onClick={()=>void sendMagicLink()}>{copy.sendSignIn}</button></>}</div>
      </div>
      <aside className="panel status-panel"><h2>{copy.roomDefaults}</h2><label className="form-label">{copy.roomLanguage}<select value={roomLanguage} onChange={(event)=>setRoomLanguage(event.target.value as Locale)}>{LOCALES.map((locale)=><option key={locale.id} value={locale.id}>{locale.label}</option>)}</select><small>{copy.roomLanguageHelp}</small></label><label className="form-label">{copy.hostCap}<input type="number" min="1" placeholder={copy.noHostLimit} value={hostCap??''} onChange={(event)=>setHostCap(event.target.value?Number(event.target.value):null)}/></label><label className="toggle-row"><input type="checkbox" checked={allowLateJoin} onChange={(event)=>setAllowLateJoin(event.target.checked)}/><span>{copy.lateJoining}</span></label><label className="form-label">{copy.rankingVisibility}<select value={rankingVisibility} onChange={(event)=>setRankingVisibility(event.target.value as RankingVisibility)}><option value="podium">{copy.podiumPrivate}</option><option value="top10">{copy.top10}</option><option value="public">{copy.fullyPublic}</option><option value="private">{copy.privateOnly}</option></select></label></aside>
      <div className="primary-row full"><button className="btn secondary" onClick={()=>setStep(1)}>{copy.back}</button><button className="btn primary" disabled={busy||!accessToken} onClick={()=>void createOrUpdateRoom()}>{liveRoom?copy.applySettings:copy.createRoom}</button></div>
    </section>}

    {step===3&&liveRoom&&<section className="workspace two-column"><div className="panel room-status"><div className="live-line"><span className="live-dot"/> {realtimeStatus==='SUBSCRIBED'?copy.liveRoom:copy.connecting}</div><div className="room-code">{liveRoom.join_code}</div><p className="support">{copy.joinPrivacyHelp}</p><div className="share-grid"><RoomQrCode roomCode={liveRoom.join_code}/><div><strong>{copy.roomLanguage}</strong><span>{LOCALES.find((locale)=>locale.id===liveRoom.room_language)?.label}</span></div></div><div className="lobby-count"><strong>{snapshot?.counts.active??0}</strong><span>{copy.activeParticipants}</span></div><div className="meta"><span className="pill">{copy.ready} {snapshot?.counts.ready??0}/{snapshot?.counts.active??0}</span><span className="pill">{copy.online} {snapshot?.counts.online??0}</span><span className="pill">{copy.reconnecting} {snapshot?.counts.reconnecting??0}</span></div><div className="participant-list">{snapshot?.participants.map((participant)=><div className="control-row" key={participant.id}><span>{participant.nickname} · {participant.role}</span><strong>{participant.ready?`✓ ${copy.ready}`:participant.online?`● ${copy.online}`:`○ ${copy.reconnecting}`}</strong></div>)}</div></div><aside className="panel status-panel"><h2>{copy.lobbyControls}</h2><div className={`readiness ${readiness.state}`}><strong>{readiness.canStart?'✓':'!'} {readiness.state==='ready'?copy.ready:copy.roomStatus}</strong><span>{readiness.message}</span></div><button className="control-row" disabled={busy} onClick={()=>void patchRoom({locked:!liveRoom.locked})}><span>{copy.roomAccess}</span><strong>{liveRoom.locked?copy.locked:copy.unlocked}</strong></button><button className="control-row" disabled={busy} onClick={()=>void patchRoom({allowLateJoin:!liveRoom.allow_late_join})}><span>{copy.lateJoining}</span><strong>{liveRoom.allow_late_join?copy.betweenRounds:copy.off}</strong></button><div className="control-row"><span>{copy.game}</span><strong>{gameDisplayName(uiLocale,gameId)}</strong></div><div className="control-row"><span>{copy.durationTarget}</span><strong>{minutes} {copy.minutes}</strong></div><button className="btn primary full-width" disabled={busy||!readiness.canStart} onClick={()=>void startGame()}>{busy?copy.starting:copy.startGame}</button></aside><div className="primary-row full"><button className="btn secondary" onClick={()=>setStep(2)}>{copy.editSetup}</button></div></section>}

    {step===4&&liveRoom&&accessToken&&gameId==='bingo'&&bingoMode==='standard-number'&&<section className="workspace two-column"><BingoHostPanel accessToken={accessToken} roomCode={liveRoom.join_code} boardSize={bingoSize} cardChoiceSeconds={bingoCardChoiceSeconds} onEnded={()=>{setStep(5);void refreshSnapshot();}}/><aside className="panel status-panel"><h2>{copy.roomControls}</h2><div className="control-row"><span>{copy.mode}</span><strong>{copy.standardNumber}</strong></div><div className="control-row"><span>{copy.activePlayers}</span><strong>{activePlayers}</strong></div><div className="control-row"><span>{copy.connection}</span><strong>{realtimeStatus}</strong></div><button className="btn secondary full-width" disabled={busy} onClick={()=>void patchRoom({status:liveRoom.status==='paused'?'playing':'paused'})}>{liveRoom.status==='paused'?copy.resumeRoom:copy.pauseRoom}</button><p className="support">{copy.bingoAuthority}</p></aside></section>}
    {step===4&&liveRoom&&accessToken&&gameId==='bingo'&&bingoMode==='people'&&<section className="workspace two-column"><PeopleBingoHostPanel accessToken={accessToken} roomCode={liveRoom.join_code} onEnded={()=>{setStep(5);void refreshSnapshot();}}/><aside className="panel status-panel"><h2>{copy.roomControls}</h2><div className="control-row"><span>{copy.mode}</span><strong>{copy.peopleBingo}</strong></div><div className="control-row"><span>{copy.activePlayers}</span><strong>{activePlayers}</strong></div><div className="control-row"><span>{copy.connection}</span><strong>{realtimeStatus}</strong></div><p className="support">{copy.peopleAuthority}</p></aside></section>}
    {step===4&&liveRoom&&accessToken&&gameId==='majority-match'&&<section className="workspace two-column"><MajorityMatchHostPanel accessToken={accessToken} roomCode={liveRoom.join_code} onEnded={()=>{setStep(5);void refreshSnapshot();}}/><aside className="panel status-panel"><h2>{copy.roomControls}</h2><div className="control-row"><span>{copy.activePlayers}</span><strong>{activePlayers}</strong></div><div className="control-row"><span>{copy.connection}</span><strong>{realtimeStatus}</strong></div><button className="btn secondary full-width" disabled={busy} onClick={()=>void patchRoom({status:liveRoom.status==='paused'?'playing':'paused'})}>{liveRoom.status==='paused'?copy.resumeRoom:copy.pauseRoom}</button><p className="support">{copy.majorityAuthority}</p></aside></section>}
    {step===4&&liveRoom&&accessToken&&gameId==='quick-draw'&&<section className="workspace two-column"><QuickDrawHostPanel accessToken={accessToken} roomCode={liveRoom.join_code} onEnded={()=>{setStep(5);void refreshSnapshot();}}/><aside className="panel status-panel"><h2>{copy.roomControls}</h2><div className="control-row"><span>{copy.activePlayers}</span><strong>{activePlayers}</strong></div><div className="control-row"><span>{copy.connection}</span><strong>{realtimeStatus}</strong></div><div className="control-row"><span>{copy.audienceGuessingLabel}</span><strong>{quickDrawAudienceGuessing?copy.on:copy.off}</strong></div><p className="support">{copy.quickDrawRotation}</p></aside></section>}

    {step===5&&liveRoom&&<section className="workspace narrow results-stage"><div className="eyebrow">{copy.results}</div><h1>{copy.roundComplete}</h1>{gameId==='bingo'&&accessToken?(bingoMode==='people'?<PeopleBingoResultsPanel accessToken={accessToken} roomCode={liveRoom.join_code}/>:<BingoResultsPanel accessToken={accessToken} roomCode={liveRoom.join_code}/>):gameId==='majority-match'&&accessToken?<MajorityMatchResultsPanel accessToken={accessToken} roomCode={liveRoom.join_code}/>:gameId==='quick-draw'&&accessToken?<QuickDrawResultsPanel accessToken={accessToken} roomCode={liveRoom.join_code}/>:<div className="notice">{copy.serverResultsLater}</div>}<p className="support">{copy.rankingForRoom}: <strong>{rankingVisibility}</strong>.</p><div className="primary-row"><button className="btn primary" disabled={busy} onClick={()=>void replay()}>{copy.replay}</button><button className="btn secondary" disabled={busy} onClick={()=>void changeGame()}>{copy.changeGameKeepRoom}</button><button className="btn danger" disabled={busy} onClick={()=>void endRoom()}>{copy.endRoom}</button></div></section>}

    {liveRoom&&accessToken&&step>=3&&<HostModerationPanel accessToken={accessToken} roomCode={liveRoom.join_code} roomStatus={liveRoom.status} participants={snapshot?.participants??[]} onChanged={refreshSnapshot}/>}
  </main>;
}
