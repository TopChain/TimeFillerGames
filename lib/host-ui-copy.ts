import type { Locale } from './product';

export type HostUiCopy = {
  host: string;
  releaseSetup: string;
  steps: [string, string, string, string, string, string];
  interfaceLanguage: string;
  timeFirst: string;
  timeQuestion: string;
  timeHelp: string;
  minutes: string;
  groupContext: string;
  optional: string;
  showGames: string;
  gameLibrary: string;
  gamesFit: (minutes: number) => string;
  changeTime: string;
  hardMinimum: string;
  hardMaximum: string;
  noGameMaximum: string;
  recommended: string;
  sharedScreen: string;
  spectators: string;
  supported: string;
  notDefault: string;
  back: string;
  configure: (game: string) => string;
  gameSetup: string;
  settingsValidated: string;
  bingoMode: string;
  standardNumber: string;
  peopleBingo: string;
  boardSize: string;
  peopleBoard: string;
  testFirst: string;
  future: string;
  peopleNeed: (active: number, missing: number) => string;
  peopleReady: (active: number) => string;
  peopleFairness: string;
  cardTimer: string;
  cardTimerHelp: string;
  category: string;
  questionCount: string;
  pacingHelp: string;
  answerTimer: string;
  seconds: string;
  anonymousResults: string;
  displayPercentages: string;
  majorityRule: string;
  drawingTime: string;
  artistTurns: string;
  artistTurnsHelp: string;
  artistSelection: string;
  random: string;
  joinOrder: string;
  wordCategory: string;
  wordDifficulty: string;
  curatedWordBank: string;
  hiddenGuessing: string;
  audienceGuessing: string;
  timeComponent: string;
  fuzzyRule: string;
  hostSignIn: string;
  hostEmail: string;
  sendSignIn: string;
  checkingSignIn: string;
  signInRequired: string;
  credentialsMissing: string;
  checkEmail: string;
  roomDefaults: string;
  roomLanguage: string;
  roomLanguageHelp: string;
  hostCap: string;
  noHostLimit: string;
  lateJoining: string;
  rankingVisibility: string;
  podiumPrivate: string;
  top10: string;
  fullyPublic: string;
  privateOnly: string;
  createRoom: string;
  applySettings: string;
  liveRoom: string;
  connecting: string;
  joinPrivacyHelp: string;
  activeParticipants: string;
  ready: string;
  online: string;
  reconnecting: string;
  lobbyControls: string;
  roomStatus: string;
  roomAccess: string;
  locked: string;
  unlocked: string;
  betweenRounds: string;
  off: string;
  game: string;
  durationTarget: string;
  startGame: string;
  starting: string;
  editSetup: string;
  roomControls: string;
  mode: string;
  activePlayers: string;
  connection: string;
  pauseRoom: string;
  resumeRoom: string;
  bingoAuthority: string;
  peopleAuthority: string;
  majorityAuthority: string;
  audienceGuessingLabel: string;
  on: string;
  quickDrawRotation: string;
  results: string;
  roundComplete: string;
  rankingForRoom: string;
  replay: string;
  changeGameKeepRoom: string;
  endRoom: string;
  serverResultsLater: string;
};

const en: HostUiCopy = {
  host:'Host', releaseSetup:'Release 1 setup', steps:['Choose time','Choose game','Configure','Open room','Run game','Results'], interfaceLanguage:'Interface language', timeFirst:'Time first', timeQuestion:'How much time does the group have?', timeHelp:'Normal sessions use the four approved time targets. Lobby wait is separate from estimated play time.', minutes:'minutes', groupContext:'Group context', optional:'optional', showGames:'Show compatible games →', gameLibrary:'Game library', gamesFit:(m)=>`Games that fit ${m} minutes`, changeTime:'Change time', hardMinimum:'Hard minimum', hardMaximum:'Hard maximum', noGameMaximum:'No game-rule maximum', recommended:'Recommended', sharedScreen:'Shared screen', spectators:'Spectators', supported:'Supported', notDefault:'Not default', back:'← Back', configure:(g)=>`Configure ${g} →`, gameSetup:'Game setup', settingsValidated:'Settings are server-validated when the live room is created or updated.', bingoMode:'Bingo mode', standardNumber:'Standard Number', peopleBingo:'People Bingo 5×5', boardSize:'Board size', peopleBoard:'People Bingo board', testFirst:'test first', future:'future', peopleNeed:(a,m)=>`People Bingo 5×5 requires 25 unique active participants. Current: ${a}. Need ${m} more.`, peopleReady:(a)=>`People Bingo 5×5 is ready. Current: ${a}.`, peopleFairness:'No participant repeats on one card. Rooms above 25 use randomized 25-person subsets; fairness remains a real-session validation gate.', cardTimer:'Card-choice timer', cardTimerHelp:'Players receive 3 personal candidates. If time expires, the server assigns one automatically.', category:'Category', questionCount:'Question count', pacingHelp:'Time-fit recommendation; final pacing is validated in real sessions.', answerTimer:'Answer timer', seconds:'seconds', anonymousResults:'Anonymous result presentation', displayPercentages:'Display percentages', majorityRule:'Speed bonus is always off. Tied top answers all receive full points.', drawingTime:'Drawing time per artist', artistTurns:'Artist turns', artistTurnsHelp:'The server caps turns to available active players.', artistSelection:'Artist selection', random:'Random', joinOrder:'Join order', wordCategory:'Word category', wordDifficulty:'Word difficulty', curatedWordBank:'Release 1 uses the curated launch word bank.', hiddenGuessing:'Guesses stay private until accepted in Release 1.', audienceGuessing:'Allow spectators/audience to guess', timeComponent:'Use decreasing time component for correct guessers', fuzzyRule:'Spelling acceptance remains intentionally conservative for launch fairness.', hostSignIn:'Production Host sign-in', hostEmail:'Host email', sendSignIn:'Send secure sign-in link', checkingSignIn:'Checking Host sign-in…', signInRequired:'Sign in required to create a live room', credentialsMissing:'Supabase staging credentials not configured', checkEmail:'Check your email and open the secure sign-in link, then return here.', roomDefaults:'Room defaults', roomLanguage:'Room/game content language', roomLanguageHelp:'This controls shared room/game content. Your interface language stays personal.', hostCap:'Host participant cap', noHostLimit:'No host-set limit', lateJoining:'Allow late joining between safe rounds', rankingVisibility:'Lower ranking visibility', podiumPrivate:'Podium + private placement', top10:'Top 10', fullyPublic:'Fully public', privateOnly:'Private only', createRoom:'Create live room →', applySettings:'Apply settings to room →', liveRoom:'LIVE ROOM', connecting:'CONNECTING', joinPrivacyHelp:'Players join without a visible account. A temporary authenticated seat is used only for room authorization and recovery.', activeParticipants:'active participants', ready:'Ready', online:'Online', reconnecting:'Reconnecting', lobbyControls:'Lobby controls', roomStatus:'Room status', roomAccess:'Room access', locked:'Locked', unlocked:'Unlocked', betweenRounds:'Between rounds', off:'Off', game:'Game', durationTarget:'Duration target', startGame:'Start game', starting:'Starting…', editSetup:'← Edit setup', roomControls:'Room controls', mode:'Mode', activePlayers:'Active players', connection:'Connection', pauseRoom:'Pause room', resumeRoom:'Resume room', bingoAuthority:'The server is authoritative for cards, draws, winners, and ties.', peopleAuthority:'Every draw is a real room participant identity and is marked automatically wherever that person appears.', majorityAuthority:'Votes are private until reveal. There is no speed bonus; tied top choices all score full points.', audienceGuessingLabel:'Audience guessing', on:'On', quickDrawRotation:'Artist rotation is fixed at game start. Late joiners may guess when allowed but do not enter the current artist sequence.', results:'Results', roundComplete:'Round complete', rankingForRoom:'Ranking visibility for this room', replay:'Replay', changeGameKeepRoom:'Change game · keep room', endRoom:'End room', serverResultsLater:'Server-backed results for this game arrive with its engine.'
};

export const HOST_UI_COPY: Record<Locale, HostUiCopy> = {
  en,
  'zh-Hant':{...en,host:'主持端',releaseSetup:'Release 1 設定',steps:['選擇時間','選擇遊戲','設定','開啟房間','進行遊戲','結果'],interfaceLanguage:'介面語言',timeFirst:'時間優先',timeQuestion:'團體有多少時間？',timeHelp:'一般場次使用四個核准時間選項。大廳等待時間不計入預估遊戲時間。',minutes:'分鐘',groupContext:'團體情境',optional:'選填',showGames:'顯示相容遊戲 →',gameLibrary:'遊戲庫',gamesFit:(m)=>`適合 ${m} 分鐘的遊戲`,changeTime:'更改時間',hardMinimum:'最低人數',hardMaximum:'最高人數',noGameMaximum:'遊戲規則無上限',recommended:'建議人數',sharedScreen:'共享螢幕',spectators:'觀眾',supported:'支援',notDefault:'非預設',back:'← 返回',configure:(g)=>`設定 ${g} →`,gameSetup:'遊戲設定',settingsValidated:'建立或更新即時房間時，伺服器會驗證所有設定。',bingoMode:'Bingo 模式',standardNumber:'標準數字',peopleBingo:'人物 Bingo 5×5',boardSize:'版面大小',peopleBoard:'人物 Bingo 版面',testFirst:'先測試',future:'未來',peopleNeed:(a,m)=>`人物 Bingo 5×5 需要 25 位不同的活躍玩家。目前 ${a} 位，還需要 ${m} 位。`,peopleReady:(a)=>`人物 Bingo 5×5 已可開始。目前 ${a} 位。`,peopleFairness:'同一張卡不會重複玩家。超過 25 人時隨機取 25 人子集；公平性仍須以實際場次驗證。',cardTimer:'選卡計時',cardTimerHelp:'每位玩家會收到 3 張個人候選卡。時間到時由伺服器自動指定。',category:'類別',questionCount:'題數',pacingHelp:'依時間提供建議；最終節奏以實際場次驗證。',answerTimer:'作答時間',seconds:'秒',anonymousResults:'匿名呈現結果',displayPercentages:'顯示百分比',majorityRule:'不使用速度加分。並列最高選項都獲得完整分數。',drawingTime:'每位畫家的作畫時間',artistTurns:'畫家回合數',artistTurnsHelp:'伺服器會依活躍玩家人數限制回合。',artistSelection:'畫家選擇',random:'隨機',joinOrder:'加入順序',wordCategory:'單字類別',wordDifficulty:'單字難度',curatedWordBank:'Release 1 使用已整理的上線字庫。',hiddenGuessing:'Release 1 的猜測在答對前保持私密。',audienceGuessing:'允許觀眾猜答案',timeComponent:'答對者使用遞減時間分數',fuzzyRule:'為了上線公平性，拼字接受規則維持保守。',hostSignIn:'正式主持人登入',hostEmail:'主持人電子郵件',sendSignIn:'傳送安全登入連結',checkingSignIn:'正在檢查主持人登入…',signInRequired:'建立即時房間前需要登入',credentialsMissing:'尚未設定 Supabase 測試環境憑證',checkEmail:'請查看電子郵件並開啟安全登入連結，再回到這裡。',roomDefaults:'房間預設',roomLanguage:'房間／遊戲內容語言',roomLanguageHelp:'這會控制共享房間與遊戲內容；你的介面語言仍為個人設定。',hostCap:'主持人設定的玩家上限',noHostLimit:'未設定主持人上限',lateJoining:'允許在安全回合之間晚加入',rankingVisibility:'其他排名顯示',podiumPrivate:'頒獎台 + 私人名次',top10:'前 10 名',fullyPublic:'全部公開',privateOnly:'僅私人',createRoom:'建立即時房間 →',applySettings:'套用房間設定 →',liveRoom:'即時房間',connecting:'連線中',joinPrivacyHelp:'玩家不需建立可見帳號即可加入。暫時驗證席位僅用於房間授權與恢復。',activeParticipants:'位活躍玩家',ready:'已準備',online:'在線',reconnecting:'重新連線',lobbyControls:'大廳控制',roomStatus:'房間狀態',roomAccess:'房間存取',locked:'已鎖定',unlocked:'未鎖定',betweenRounds:'回合之間',off:'關閉',game:'遊戲',durationTarget:'時間目標',startGame:'開始遊戲',starting:'啟動中…',editSetup:'← 編輯設定',roomControls:'房間控制',mode:'模式',activePlayers:'活躍玩家',connection:'連線',pauseRoom:'暫停房間',resumeRoom:'繼續房間',bingoAuthority:'伺服器掌控卡片、抽取、勝者與並列結果。',peopleAuthority:'每次抽取都是真實房間玩家身分，並在出現該玩家的位置自動標記。',majorityAuthority:'投票在揭曉前保持私密；沒有速度加分，並列最高選項都得完整分數。',audienceGuessingLabel:'觀眾猜答',on:'開啟',quickDrawRotation:'畫家順序在遊戲開始時固定。晚加入者可在允許時猜答，但不會加入目前畫家順序。',results:'結果',roundComplete:'本回合完成',rankingForRoom:'此房間的排名顯示',replay:'再玩一次',changeGameKeepRoom:'換遊戲 · 保留房間',endRoom:'結束房間',serverResultsLater:'此遊戲引擎完成後會提供伺服器結果。'},
  'zh-Hans':{...en,host:'主持端',releaseSetup:'Release 1 设置',steps:['选择时间','选择游戏','设置','开启房间','进行游戏','结果'],interfaceLanguage:'界面语言',timeFirst:'时间优先',timeQuestion:'团队有多少时间？',timeHelp:'普通场次使用四个批准的时间选项。大厅等待时间不计入预计游戏时间。',minutes:'分钟',groupContext:'团队情境',optional:'可选',showGames:'显示兼容游戏 →',gameLibrary:'游戏库',gamesFit:(m)=>`适合 ${m} 分钟的游戏`,changeTime:'更改时间',hardMinimum:'最低人数',hardMaximum:'最高人数',noGameMaximum:'游戏规则无上限',recommended:'建议人数',sharedScreen:'共享屏幕',spectators:'观众',supported:'支持',notDefault:'非默认',back:'← 返回',configure:(g)=>`设置 ${g} →`,gameSetup:'游戏设置',settingsValidated:'创建或更新实时房间时，服务器会验证所有设置。',bingoMode:'Bingo 模式',standardNumber:'标准数字',peopleBingo:'人物 Bingo 5×5',boardSize:'棋盘大小',peopleBoard:'人物 Bingo 棋盘',testFirst:'先测试',future:'未来',peopleNeed:(a,m)=>`人物 Bingo 5×5 需要 25 位不同的活跃玩家。目前 ${a} 位，还需要 ${m} 位。`,peopleReady:(a)=>`人物 Bingo 5×5 已可开始。目前 ${a} 位。`,peopleFairness:'同一张卡不会重复玩家。超过 25 人时随机抽取 25 人子集；公平性仍需真实场次验证。',cardTimer:'选卡计时',cardTimerHelp:'每位玩家会收到 3 张个人候选卡。时间到后由服务器自动指定。',category:'类别',questionCount:'题数',pacingHelp:'按时间提供建议；最终节奏通过真实场次验证。',answerTimer:'答题时间',seconds:'秒',anonymousResults:'匿名展示结果',displayPercentages:'显示百分比',majorityRule:'不使用速度加分。并列最高选项都获得完整分数。',drawingTime:'每位画家的作画时间',artistTurns:'画家回合数',artistTurnsHelp:'服务器会按活跃玩家人数限制回合。',artistSelection:'画家选择',random:'随机',joinOrder:'加入顺序',wordCategory:'单词类别',wordDifficulty:'单词难度',curatedWordBank:'Release 1 使用已整理的上线词库。',hiddenGuessing:'Release 1 的猜测在答对前保持私密。',audienceGuessing:'允许观众猜答案',timeComponent:'答对者使用递减时间分数',fuzzyRule:'为了上线公平，拼写接受规则保持保守。',hostSignIn:'正式主持人登录',hostEmail:'主持人电子邮件',sendSignIn:'发送安全登录链接',checkingSignIn:'正在检查主持人登录…',signInRequired:'创建实时房间前需要登录',credentialsMissing:'尚未设置 Supabase 测试环境凭据',checkEmail:'请查看电子邮件并打开安全登录链接，然后返回这里。',roomDefaults:'房间默认',roomLanguage:'房间／游戏内容语言',roomLanguageHelp:'这控制共享房间和游戏内容；你的界面语言保持个人设置。',hostCap:'主持人设置的玩家上限',noHostLimit:'未设置主持人上限',lateJoining:'允许在安全回合之间晚加入',rankingVisibility:'其他排名显示',podiumPrivate:'领奖台 + 私人名次',top10:'前 10 名',fullyPublic:'全部公开',privateOnly:'仅私人',createRoom:'创建实时房间 →',applySettings:'应用房间设置 →',liveRoom:'实时房间',connecting:'连接中',joinPrivacyHelp:'玩家无需创建可见账号即可加入。临时验证席位仅用于房间授权和恢复。',activeParticipants:'位活跃玩家',ready:'已准备',online:'在线',reconnecting:'重新连接',lobbyControls:'大厅控制',roomStatus:'房间状态',roomAccess:'房间访问',locked:'已锁定',unlocked:'未锁定',betweenRounds:'回合之间',off:'关闭',game:'游戏',durationTarget:'时间目标',startGame:'开始游戏',starting:'启动中…',editSetup:'← 编辑设置',roomControls:'房间控制',mode:'模式',activePlayers:'活跃玩家',connection:'连接',pauseRoom:'暂停房间',resumeRoom:'继续房间',bingoAuthority:'服务器控制卡片、抽取、胜者和并列结果。',peopleAuthority:'每次抽取都是真实房间玩家身份，并在出现该玩家的位置自动标记。',majorityAuthority:'投票在揭晓前保持私密；没有速度加分，并列最高选项都得完整分数。',audienceGuessingLabel:'观众猜答',on:'开启',quickDrawRotation:'画家顺序在游戏开始时固定。晚加入者可在允许时猜答，但不会进入当前画家顺序。',results:'结果',roundComplete:'本回合完成',rankingForRoom:'此房间的排名显示',replay:'再玩一次',changeGameKeepRoom:'换游戏 · 保留房间',endRoom:'结束房间',serverResultsLater:'此游戏引擎完成后会提供服务器结果。'},
  es:{...en,host:'Anfitrión',releaseSetup:'Configuración Release 1',steps:['Elegir tiempo','Elegir juego','Configurar','Abrir sala','Jugar','Resultados'],interfaceLanguage:'Idioma de la interfaz',timeFirst:'Primero el tiempo',timeQuestion:'¿Cuánto tiempo tiene el grupo?',timeHelp:'Las sesiones normales usan los cuatro tiempos aprobados. La espera en la sala no cuenta en el tiempo estimado de juego.',minutes:'minutos',groupContext:'Contexto del grupo',optional:'opcional',showGames:'Mostrar juegos compatibles →',gameLibrary:'Biblioteca de juegos',gamesFit:(m)=>`Juegos para ${m} minutos`,changeTime:'Cambiar tiempo',hardMinimum:'Mínimo obligatorio',hardMaximum:'Máximo obligatorio',noGameMaximum:'Sin máximo por regla del juego',recommended:'Recomendado',sharedScreen:'Pantalla compartida',spectators:'Espectadores',supported:'Compatible',notDefault:'No predeterminado',back:'← Atrás',configure:(g)=>`Configurar ${g} →`,gameSetup:'Configuración del juego',settingsValidated:'El servidor valida la configuración al crear o actualizar la sala.',bingoMode:'Modo Bingo',standardNumber:'Números estándar',peopleBingo:'Bingo de personas 5×5',boardSize:'Tamaño del tablero',peopleBoard:'Tablero de Bingo de personas',testFirst:'probar primero',future:'futuro',peopleNeed:(a,m)=>`Bingo de personas 5×5 requiere 25 participantes activos únicos. Actual: ${a}. Faltan ${m}.`,peopleReady:(a)=>`Bingo de personas 5×5 está listo. Actual: ${a}.`,peopleFairness:'Ningún participante se repite en una tarjeta. Con más de 25 se usan subconjuntos aleatorios de 25; la equidad sigue siendo una validación con sesiones reales.',cardTimer:'Tiempo para elegir tarjeta',cardTimerHelp:'Cada jugador recibe 3 tarjetas candidatas. Si acaba el tiempo, el servidor asigna una automáticamente.',category:'Categoría',questionCount:'Número de preguntas',pacingHelp:'Recomendación según el tiempo; el ritmo final se valida en sesiones reales.',answerTimer:'Tiempo de respuesta',seconds:'segundos',anonymousResults:'Presentación anónima de resultados',displayPercentages:'Mostrar porcentajes',majorityRule:'No hay bono de velocidad. Las opciones empatadas en primer lugar reciben todos los puntos.',drawingTime:'Tiempo de dibujo por artista',artistTurns:'Turnos de artista',artistTurnsHelp:'El servidor limita los turnos a los jugadores activos disponibles.',artistSelection:'Selección de artista',random:'Aleatorio',joinOrder:'Orden de entrada',wordCategory:'Categoría de palabras',wordDifficulty:'Dificultad de palabras',curatedWordBank:'Release 1 usa el banco de palabras revisado para lanzamiento.',hiddenGuessing:'En Release 1 los intentos permanecen privados hasta ser aceptados.',audienceGuessing:'Permitir que espectadores adivinen',timeComponent:'Usar componente de tiempo decreciente para aciertos',fuzzyRule:'La aceptación ortográfica se mantiene conservadora para la equidad del lanzamiento.',hostSignIn:'Inicio de sesión del anfitrión',hostEmail:'Correo del anfitrión',sendSignIn:'Enviar enlace seguro',checkingSignIn:'Comprobando sesión del anfitrión…',signInRequired:'Debes iniciar sesión para crear una sala',credentialsMissing:'Credenciales de Supabase de pruebas no configuradas',checkEmail:'Revisa tu correo, abre el enlace seguro y vuelve aquí.',roomDefaults:'Valores de la sala',roomLanguage:'Idioma del contenido de sala/juego',roomLanguageHelp:'Controla el contenido compartido; tu idioma de interfaz sigue siendo personal.',hostCap:'Límite de participantes del anfitrión',noHostLimit:'Sin límite del anfitrión',lateJoining:'Permitir entradas tardías entre rondas seguras',rankingVisibility:'Visibilidad de posiciones inferiores',podiumPrivate:'Podio + posición privada',top10:'Top 10',fullyPublic:'Totalmente público',privateOnly:'Solo privado',createRoom:'Crear sala en vivo →',applySettings:'Aplicar ajustes a la sala →',liveRoom:'SALA EN VIVO',connecting:'CONECTANDO',joinPrivacyHelp:'Los jugadores entran sin una cuenta visible. El asiento autenticado temporal solo se usa para autorización y recuperación.',activeParticipants:'participantes activos',ready:'Listos',online:'En línea',reconnecting:'Reconectando',lobbyControls:'Controles de sala',roomStatus:'Estado de la sala',roomAccess:'Acceso a la sala',locked:'Bloqueada',unlocked:'Abierta',betweenRounds:'Entre rondas',off:'Desactivado',game:'Juego',durationTarget:'Duración objetivo',startGame:'Iniciar juego',starting:'Iniciando…',editSetup:'← Editar configuración',roomControls:'Controles de sala',mode:'Modo',activePlayers:'Jugadores activos',connection:'Conexión',pauseRoom:'Pausar sala',resumeRoom:'Reanudar sala',bingoAuthority:'El servidor controla tarjetas, sorteos, ganadores y empates.',peopleAuthority:'Cada sorteo es una identidad real de la sala y se marca automáticamente donde aparezca.',majorityAuthority:'Los votos son privados hasta revelarse. No hay bono de velocidad; los empates superiores reciben todos los puntos.',audienceGuessingLabel:'Adivinanzas del público',on:'Activado',quickDrawRotation:'La rotación de artistas se fija al iniciar. Quienes llegan tarde pueden adivinar si está permitido, pero no entran en la rotación actual.',results:'Resultados',roundComplete:'Ronda completada',rankingForRoom:'Visibilidad de clasificación de esta sala',replay:'Repetir',changeGameKeepRoom:'Cambiar juego · mantener sala',endRoom:'Cerrar sala',serverResultsLater:'Los resultados del servidor llegarán con el motor de este juego.'},
  ja:{...en,host:'ホスト',releaseSetup:'Release 1 設定',steps:['時間を選ぶ','ゲームを選ぶ','設定','ルームを開く','プレイ','結果'],interfaceLanguage:'インターフェース言語',timeFirst:'時間を先に選択',timeQuestion:'グループには何分ありますか？',timeHelp:'通常セッションは承認済みの4つの時間を使用します。ロビー待機時間は推定プレイ時間とは別です。',minutes:'分',groupContext:'グループの場面',optional:'任意',showGames:'対応ゲームを表示 →',gameLibrary:'ゲームライブラリ',gamesFit:(m)=>`${m}分に合うゲーム`,changeTime:'時間を変更',hardMinimum:'最低人数',hardMaximum:'最大人数',noGameMaximum:'ゲームルール上の上限なし',recommended:'推奨',sharedScreen:'共有画面',spectators:'観客',supported:'対応',notDefault:'既定ではない',back:'← 戻る',configure:(g)=>`${g} を設定 →`,gameSetup:'ゲーム設定',settingsValidated:'ライブ ルームの作成・更新時にサーバーが設定を検証します。',bingoMode:'Bingo モード',standardNumber:'標準数字',peopleBingo:'People Bingo 5×5',boardSize:'ボードサイズ',peopleBoard:'People Bingo ボード',testFirst:'先にテスト',future:'今後',peopleNeed:(a,m)=>`People Bingo 5×5 には異なるアクティブ参加者25人が必要です。現在 ${a} 人、あと ${m} 人。`,peopleReady:(a)=>`People Bingo 5×5 を開始できます。現在 ${a} 人。`,peopleFairness:'1枚のカードに同じ参加者は重複しません。25人を超える場合はランダムな25人のサブセットを使用し、公平性は実セッションで検証します。',cardTimer:'カード選択時間',cardTimerHelp:'各プレイヤーに3枚の候補カードを表示し、時間切れならサーバーが自動割り当てします。',category:'カテゴリ',questionCount:'問題数',pacingHelp:'時間に合わせた推奨値です。最終ペースは実セッションで検証します。',answerTimer:'回答時間',seconds:'秒',anonymousResults:'匿名で結果を表示',displayPercentages:'割合を表示',majorityRule:'スピードボーナスはありません。同率トップの選択肢はすべて満点です。',drawingTime:'1人あたりの描画時間',artistTurns:'描く人のターン数',artistTurnsHelp:'サーバーがアクティブ人数に合わせてターン数を制限します。',artistSelection:'描く人の選択',random:'ランダム',joinOrder:'参加順',wordCategory:'単語カテゴリ',wordDifficulty:'単語難易度',curatedWordBank:'Release 1 は公開用に整理した単語バンクを使います。',hiddenGuessing:'Release 1 では正解として受理されるまで回答は非公開です。',audienceGuessing:'観客の回答を許可',timeComponent:'正解者に時間減衰要素を使用',fuzzyRule:'公開時の公平性のため、綴り判定は保守的にします。',hostSignIn:'正式ホストのログイン',hostEmail:'ホストのメール',sendSignIn:'安全なログインリンクを送信',checkingSignIn:'ホストのログインを確認中…',signInRequired:'ライブ ルーム作成にはログインが必要です',credentialsMissing:'Supabase ステージング認証情報が未設定です',checkEmail:'メールの安全なログインリンクを開き、ここへ戻ってください。',roomDefaults:'ルーム既定値',roomLanguage:'ルーム／ゲーム内容の言語',roomLanguageHelp:'共有コンテンツの言語です。個人のUI言語とは別に保持されます。',hostCap:'ホスト設定の参加者上限',noHostLimit:'ホスト上限なし',lateJoining:'安全なラウンド間の途中参加を許可',rankingVisibility:'下位順位の表示',podiumPrivate:'表彰台 + 個人順位',top10:'トップ10',fullyPublic:'全公開',privateOnly:'非公開のみ',createRoom:'ライブ ルームを作成 →',applySettings:'ルーム設定を適用 →',liveRoom:'ライブ ルーム',connecting:'接続中',joinPrivacyHelp:'プレイヤーは見えるアカウントを作らず参加できます。一時認証席はルーム認可と復旧のみに使います。',activeParticipants:'人のアクティブ参加者',ready:'準備完了',online:'オンライン',reconnecting:'再接続中',lobbyControls:'ロビー操作',roomStatus:'ルーム状態',roomAccess:'ルームアクセス',locked:'ロック中',unlocked:'開放中',betweenRounds:'ラウンド間',off:'オフ',game:'ゲーム',durationTarget:'目標時間',startGame:'ゲーム開始',starting:'開始中…',editSetup:'← 設定を編集',roomControls:'ルーム操作',mode:'モード',activePlayers:'アクティブプレイヤー',connection:'接続',pauseRoom:'一時停止',resumeRoom:'再開',bingoAuthority:'カード、抽選、勝者、同点はサーバーが確定します。',peopleAuthority:'抽選対象は実際のルーム参加者で、その人がある場所に自動で印が付きます。',majorityAuthority:'投票は公開まで非公開です。速度ボーナスはなく、同率トップはすべて満点です。',audienceGuessingLabel:'観客の回答',on:'オン',quickDrawRotation:'描く人の順番はゲーム開始時に固定されます。途中参加者は許可時に回答できますが、現在の順番には入りません。',results:'結果',roundComplete:'ラウンド完了',rankingForRoom:'このルームの順位表示',replay:'もう一度',changeGameKeepRoom:'ゲーム変更 · ルーム維持',endRoom:'ルーム終了',serverResultsLater:'このゲームのエンジン実装時にサーバー結果が追加されます。'},
  ko:{...en,host:'호스트',releaseSetup:'Release 1 설정',steps:['시간 선택','게임 선택','설정','방 열기','게임 진행','결과'],interfaceLanguage:'인터페이스 언어',timeFirst:'시간 우선',timeQuestion:'그룹에 시간이 얼마나 있나요?',timeHelp:'일반 세션은 승인된 네 가지 시간 목표를 사용합니다. 로비 대기 시간은 예상 플레이 시간과 별도입니다.',minutes:'분',groupContext:'그룹 상황',optional:'선택',showGames:'맞는 게임 보기 →',gameLibrary:'게임 라이브러리',gamesFit:(m)=>`${m}분에 맞는 게임`,changeTime:'시간 변경',hardMinimum:'최소 인원',hardMaximum:'최대 인원',noGameMaximum:'게임 규칙상 최대 없음',recommended:'권장',sharedScreen:'공유 화면',spectators:'관전자',supported:'지원',notDefault:'기본 아님',back:'← 뒤로',configure:(g)=>`${g} 설정 →`,gameSetup:'게임 설정',settingsValidated:'라이브 방을 만들거나 업데이트할 때 서버가 설정을 검증합니다.',bingoMode:'Bingo 모드',standardNumber:'표준 숫자',peopleBingo:'People Bingo 5×5',boardSize:'보드 크기',peopleBoard:'People Bingo 보드',testFirst:'먼저 테스트',future:'향후',peopleNeed:(a,m)=>`People Bingo 5×5에는 서로 다른 활성 참가자 25명이 필요합니다. 현재 ${a}명, ${m}명 더 필요합니다.`,peopleReady:(a)=>`People Bingo 5×5를 시작할 수 있습니다. 현재 ${a}명.`,peopleFairness:'한 카드에 같은 참가자는 반복되지 않습니다. 25명을 넘으면 무작위 25명 하위 집합을 사용하며 공정성은 실제 세션에서 검증합니다.',cardTimer:'카드 선택 시간',cardTimerHelp:'각 플레이어에게 개인 후보 카드 3장이 주어지며 시간이 끝나면 서버가 자동 지정합니다.',category:'카테고리',questionCount:'문항 수',pacingHelp:'시간에 맞춘 권장값이며 최종 진행 속도는 실제 세션에서 검증합니다.',answerTimer:'응답 시간',seconds:'초',anonymousResults:'익명 결과 표시',displayPercentages:'백분율 표시',majorityRule:'속도 보너스는 없습니다. 공동 1위 선택지는 모두 전체 점수를 받습니다.',drawingTime:'아티스트별 그림 시간',artistTurns:'아티스트 턴 수',artistTurnsHelp:'서버가 활성 플레이어 수에 맞게 턴을 제한합니다.',artistSelection:'아티스트 선택',random:'무작위',joinOrder:'입장 순서',wordCategory:'단어 카테고리',wordDifficulty:'단어 난이도',curatedWordBank:'Release 1은 출시용으로 검수한 단어 은행을 사용합니다.',hiddenGuessing:'Release 1에서는 정답으로 승인되기 전까지 추측이 비공개입니다.',audienceGuessing:'관전자 추측 허용',timeComponent:'정답자에게 감소형 시간 요소 사용',fuzzyRule:'출시 공정성을 위해 철자 허용 기준은 보수적으로 유지합니다.',hostSignIn:'정식 호스트 로그인',hostEmail:'호스트 이메일',sendSignIn:'보안 로그인 링크 보내기',checkingSignIn:'호스트 로그인 확인 중…',signInRequired:'라이브 방 생성 전에 로그인이 필요합니다',credentialsMissing:'Supabase 스테이징 자격 증명이 설정되지 않았습니다',checkEmail:'이메일의 보안 로그인 링크를 열고 여기로 돌아오세요.',roomDefaults:'방 기본값',roomLanguage:'방/게임 콘텐츠 언어',roomLanguageHelp:'공유 콘텐츠 언어이며 개인 인터페이스 언어와 별도로 유지됩니다.',hostCap:'호스트 참가자 상한',noHostLimit:'호스트 설정 상한 없음',lateJoining:'안전한 라운드 사이 늦은 입장 허용',rankingVisibility:'하위 순위 공개 범위',podiumPrivate:'시상대 + 개인 순위',top10:'상위 10명',fullyPublic:'전체 공개',privateOnly:'비공개만',createRoom:'라이브 방 만들기 →',applySettings:'방 설정 적용 →',liveRoom:'라이브 방',connecting:'연결 중',joinPrivacyHelp:'플레이어는 보이는 계정 없이 참가합니다. 임시 인증 좌석은 방 권한과 복구에만 사용됩니다.',activeParticipants:'명의 활성 참가자',ready:'준비',online:'온라인',reconnecting:'재연결 중',lobbyControls:'로비 제어',roomStatus:'방 상태',roomAccess:'방 접근',locked:'잠김',unlocked:'열림',betweenRounds:'라운드 사이',off:'꺼짐',game:'게임',durationTarget:'목표 시간',startGame:'게임 시작',starting:'시작 중…',editSetup:'← 설정 편집',roomControls:'방 제어',mode:'모드',activePlayers:'활성 플레이어',connection:'연결',pauseRoom:'방 일시정지',resumeRoom:'방 재개',bingoAuthority:'카드, 추첨, 승자, 동점은 서버가 확정합니다.',peopleAuthority:'각 추첨은 실제 방 참가자이며 해당 참가자가 있는 위치가 자동 표시됩니다.',majorityAuthority:'투표는 공개 전까지 비공개입니다. 속도 보너스가 없고 공동 1위는 모두 전체 점수를 받습니다.',audienceGuessingLabel:'관전자 추측',on:'켜짐',quickDrawRotation:'아티스트 순서는 게임 시작 시 고정됩니다. 늦게 참가한 사람은 허용 시 추측할 수 있지만 현재 순서에는 들어가지 않습니다.',results:'결과',roundComplete:'라운드 완료',rankingForRoom:'이 방의 순위 공개',replay:'다시 하기',changeGameKeepRoom:'게임 변경 · 방 유지',endRoom:'방 종료',serverResultsLater:'이 게임 엔진이 제공되면 서버 결과가 추가됩니다.'}
};
