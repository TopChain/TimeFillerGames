import type { Locale } from './product';

export type BingoUiCopy = {
  standardTitle: string;
  peopleTitle: string;
  waitingStart: string;
  loadingMode: string;
  spectatorView: string;
  noActiveCard: string;
  chooseCard: string;
  selectionClosed: string;
  pausedSaved: string;
  pauseSelection: string;
  standardChoiceHelp: string;
  peopleChoiceHelp: string;
  serverAssigning: string;
  card: string;
  select: string;
  waiting: string;
  paused: string;
  liveStandard: string;
  livePeople: string;
  roundEnded: string;
  pauseBoardStandard: string;
  pauseBoardPeople: string;
  latestDraw: string;
  latestParticipant: string;
  draws: string;
  autoMarking: string;
  oneLineWins: string;
  winner: string;
  sharedPlacement: string;
  onDraw: string;
};

export const BINGO_UI_COPY: Record<Locale, BingoUiCopy> = {
  en: { standardTitle:'Standard Bingo', peopleTitle:'People Bingo 5×5', waitingStart:'Waiting for the Host to start the round.', loadingMode:'Loading Bingo mode…', spectatorView:'Spectator view', noActiveCard:'This seat does not have an active Bingo card in the current round.', chooseCard:'Choose your card', selectionClosed:'Selection closed', pausedSaved:'saved', pauseSelection:'The Host paused the room. Card selection is frozen and will resume with the same remaining time.', standardChoiceHelp:'Choose one of your three personal candidate cards. If time expires, the server assigns one automatically.', peopleChoiceHelp:'Each candidate contains 25 unique active participants. Choose one card; otherwise the server assigns one after timeout.', serverAssigning:'The timer expired. Waiting for the server to lock an automatic card assignment.', card:'Card', select:'Select', waiting:'Waiting…', paused:'Paused', liveStandard:'LIVE STANDARD BINGO', livePeople:'LIVE PEOPLE BINGO', roundEnded:'ROUND ENDED', pauseBoardStandard:'The Host paused the game. Your board stays locked and no new number can be drawn until resume.', pauseBoardPeople:'The Host paused the game. Your board stays locked and no new participant can be drawn until resume.', latestDraw:'Latest draw', latestParticipant:'Latest participant', draws:'Draws', autoMarking:'Automatic marking', oneLineWins:'One line wins', winner:'Winner', sharedPlacement:'You earned shared placement', onDraw:'on draw' },
  'zh-Hant': { standardTitle:'標準賓果', peopleTitle:'人物賓果 5×5', waitingStart:'等待主持人開始本回合。', loadingMode:'正在載入賓果模式…', spectatorView:'觀眾畫面', noActiveCard:'這個座位在本回合沒有有效的賓果卡。', chooseCard:'選擇你的賓果卡', selectionClosed:'選擇時間已結束', pausedSaved:'已保留', pauseSelection:'主持人已暫停房間。選卡時間已凍結，恢復後會保留相同的剩餘時間。', standardChoiceHelp:'從三張個人候選卡中選一張。時間到時，伺服器會自動指派一張。', peopleChoiceHelp:'每張候選卡包含 25 位不重複的有效參與者。請選一張；逾時後伺服器會自動指派。', serverAssigning:'時間已到，正在等待伺服器鎖定自動指派的卡片。', card:'卡片', select:'選擇', waiting:'等待中…', paused:'已暫停', liveStandard:'即時標準賓果', livePeople:'即時人物賓果', roundEnded:'本回合結束', pauseBoardStandard:'主持人已暫停遊戲。你的卡片保持鎖定，恢復前不會抽出新號碼。', pauseBoardPeople:'主持人已暫停遊戲。你的卡片保持鎖定，恢復前不會抽出新人物。', latestDraw:'最新抽號', latestParticipant:'最新人物', draws:'已抽次數', autoMarking:'自動標記', oneLineWins:'連成一線獲勝', winner:'得獎者', sharedPlacement:'你的並列名次是', onDraw:'完成於第' },
  'zh-Hans': { standardTitle:'标准宾果', peopleTitle:'人物宾果 5×5', waitingStart:'等待主持人开始本回合。', loadingMode:'正在加载宾果模式…', spectatorView:'观众画面', noActiveCard:'这个座位在本回合没有有效的宾果卡。', chooseCard:'选择你的宾果卡', selectionClosed:'选择时间已结束', pausedSaved:'已保留', pauseSelection:'主持人已暂停房间。选卡时间已冻结，恢复后会保留相同的剩余时间。', standardChoiceHelp:'从三张个人候选卡中选一张。时间到时，服务器会自动分配一张。', peopleChoiceHelp:'每张候选卡包含 25 位不重复的有效参与者。请选择一张；超时后服务器会自动分配。', serverAssigning:'时间已到，正在等待服务器锁定自动分配的卡片。', card:'卡片', select:'选择', waiting:'等待中…', paused:'已暂停', liveStandard:'实时标准宾果', livePeople:'实时人物宾果', roundEnded:'本回合结束', pauseBoardStandard:'主持人已暂停游戏。你的卡片保持锁定，恢复前不会抽出新号码。', pauseBoardPeople:'主持人已暂停游戏。你的卡片保持锁定，恢复前不会抽出新人物。', latestDraw:'最新抽号', latestParticipant:'最新人物', draws:'已抽次数', autoMarking:'自动标记', oneLineWins:'连成一线获胜', winner:'获胜者', sharedPlacement:'你的并列名次是', onDraw:'完成于第' },
  es: { standardTitle:'Bingo estándar', peopleTitle:'Bingo de personas 5×5', waitingStart:'Esperando a que el anfitrión inicie la ronda.', loadingMode:'Cargando el modo de Bingo…', spectatorView:'Vista de espectador', noActiveCard:'Este asiento no tiene una tarjeta de Bingo activa en esta ronda.', chooseCard:'Elige tu tarjeta', selectionClosed:'Selección cerrada', pausedSaved:'guardados', pauseSelection:'El anfitrión pausó la sala. La selección está congelada y continuará con el mismo tiempo restante.', standardChoiceHelp:'Elige una de tus tres tarjetas personales. Si se acaba el tiempo, el servidor asignará una automáticamente.', peopleChoiceHelp:'Cada tarjeta contiene 25 participantes activos sin repetir. Elige una; si se acaba el tiempo, el servidor asignará una.', serverAssigning:'Se acabó el tiempo. Esperando que el servidor bloquee una tarjeta asignada automáticamente.', card:'Tarjeta', select:'Elegir', waiting:'Esperando…', paused:'En pausa', liveStandard:'BINGO ESTÁNDAR EN VIVO', livePeople:'BINGO DE PERSONAS EN VIVO', roundEnded:'RONDA TERMINADA', pauseBoardStandard:'El anfitrión pausó el juego. Tu tarjeta queda bloqueada y no se sortearán números nuevos hasta reanudar.', pauseBoardPeople:'El anfitrión pausó el juego. Tu tarjeta queda bloqueada y no se sortearán personas nuevas hasta reanudar.', latestDraw:'Último número', latestParticipant:'Última persona', draws:'Sorteos', autoMarking:'Marcado automático', oneLineWins:'Una línea gana', winner:'Ganador', sharedPlacement:'Obtuviste el puesto compartido', onDraw:'en el sorteo' },
  ja: { standardTitle:'スタンダードビンゴ', peopleTitle:'ピープルビンゴ 5×5', waitingStart:'ホストがラウンドを開始するのを待っています。', loadingMode:'ビンゴモードを読み込み中…', spectatorView:'観戦画面', noActiveCard:'この席には現在のラウンドで有効なビンゴカードがありません。', chooseCard:'カードを選んでください', selectionClosed:'選択終了', pausedSaved:'保存済み', pauseSelection:'ホストがルームを一時停止しました。カード選択時間は停止し、再開後も同じ残り時間から続きます。', standardChoiceHelp:'3枚の個人候補カードから1枚選んでください。時間切れの場合はサーバーが自動で割り当てます。', peopleChoiceHelp:'各候補カードには重複しない25人の参加者が入っています。1枚選んでください。時間切れの場合は自動で割り当てます。', serverAssigning:'時間切れです。サーバーが自動割り当てカードを確定するのを待っています。', card:'カード', select:'選ぶ', waiting:'待機中…', paused:'一時停止', liveStandard:'スタンダードビンゴ LIVE', livePeople:'ピープルビンゴ LIVE', roundEnded:'ラウンド終了', pauseBoardStandard:'ホストがゲームを一時停止しました。カードは固定され、再開するまで新しい数字は出ません。', pauseBoardPeople:'ホストがゲームを一時停止しました。カードは固定され、再開するまで新しい参加者は出ません。', latestDraw:'最新の数字', latestParticipant:'最新の参加者', draws:'抽選回数', autoMarking:'自動マーク', oneLineWins:'1ラインで勝利', winner:'勝者', sharedPlacement:'同順位は', onDraw:'抽選' },
  ko: { standardTitle:'기본 빙고', peopleTitle:'사람 빙고 5×5', waitingStart:'호스트가 라운드를 시작하기를 기다리는 중입니다.', loadingMode:'빙고 모드를 불러오는 중…', spectatorView:'관전 화면', noActiveCard:'이 좌석에는 현재 라운드의 활성 빙고 카드가 없습니다.', chooseCard:'카드를 선택하세요', selectionClosed:'선택 종료', pausedSaved:'보존됨', pauseSelection:'호스트가 방을 일시정지했습니다. 카드 선택 시간이 멈췄으며 재개하면 같은 남은 시간부터 계속됩니다.', standardChoiceHelp:'개인 후보 카드 3장 중 하나를 선택하세요. 시간이 끝나면 서버가 자동으로 한 장을 배정합니다.', peopleChoiceHelp:'각 후보 카드에는 중복되지 않는 활성 참가자 25명이 들어 있습니다. 한 장을 선택하세요. 시간이 끝나면 서버가 자동 배정합니다.', serverAssigning:'시간이 끝났습니다. 서버가 자동 배정 카드를 확정하기를 기다리는 중입니다.', card:'카드', select:'선택', waiting:'대기 중…', paused:'일시정지', liveStandard:'기본 빙고 LIVE', livePeople:'사람 빙고 LIVE', roundEnded:'라운드 종료', pauseBoardStandard:'호스트가 게임을 일시정지했습니다. 카드는 잠긴 상태로 유지되며 재개 전에는 새 숫자가 나오지 않습니다.', pauseBoardPeople:'호스트가 게임을 일시정지했습니다. 카드는 잠긴 상태로 유지되며 재개 전에는 새 참가자가 나오지 않습니다.', latestDraw:'최근 숫자', latestParticipant:'최근 참가자', draws:'추첨 횟수', autoMarking:'자동 표시', oneLineWins:'한 줄 완성 시 승리', winner:'승자', sharedPlacement:'공동 순위', onDraw:'추첨' }
};
