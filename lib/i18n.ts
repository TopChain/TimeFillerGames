import type { Locale } from './product';

type Strings = {
  host:string; join:string; chooseTime:string; gameLibrary:string; waiting:string; ready:string; results:string;
  roomCode:string; language:string; identity:string; avatar:string; nickname:string; continue:string; back:string;
  playerCount:string; gamePreview:string; waitingDetail:string; joinedAs:string;
};

export const STRINGS: Record<Locale, Strings> = {
  en:{host:'Host a Game',join:'Join Room',chooseTime:'How much time do you have?',gameLibrary:'Game library',waiting:'Waiting for host',ready:'Ready',results:'Results',roomCode:'Room code',language:'Language',identity:'Your identity',avatar:'Avatar',nickname:'Nickname',continue:'Continue',back:'Back',playerCount:'Players',gamePreview:'Game preview',waitingDetail:'You are in the room. The game will start when the host is ready.',joinedAs:'Joined as'},
  'zh-Hant':{host:'主持遊戲',join:'加入房間',chooseTime:'你們有多少時間？',gameLibrary:'遊戲庫',waiting:'等待主持人',ready:'準備完成',results:'結果',roomCode:'房間代碼',language:'語言',identity:'你的身分',avatar:'頭像',nickname:'暱稱',continue:'繼續',back:'返回',playerCount:'玩家',gamePreview:'遊戲預覽',waitingDetail:'你已加入房間。主持人準備好後遊戲就會開始。',joinedAs:'已加入，名稱'},
  'zh-Hans':{host:'主持游戏',join:'加入房间',chooseTime:'你们有多少时间？',gameLibrary:'游戏库',waiting:'等待主持人',ready:'准备完成',results:'结果',roomCode:'房间代码',language:'语言',identity:'你的身份',avatar:'头像',nickname:'昵称',continue:'继续',back:'返回',playerCount:'玩家',gamePreview:'游戏预览',waitingDetail:'你已加入房间。主持人准备好后游戏就会开始。',joinedAs:'已加入，名称'},
  es:{host:'Organizar juego',join:'Unirse a sala',chooseTime:'¿Cuánto tiempo tienen?',gameLibrary:'Biblioteca de juegos',waiting:'Esperando al anfitrión',ready:'Listo',results:'Resultados',roomCode:'Código de sala',language:'Idioma',identity:'Tu identidad',avatar:'Avatar',nickname:'Apodo',continue:'Continuar',back:'Atrás',playerCount:'Jugadores',gamePreview:'Vista previa del juego',waitingDetail:'Ya estás en la sala. El juego comenzará cuando el anfitrión esté listo.',joinedAs:'Te uniste como'},
  ja:{host:'ゲームを主催',join:'ルームに参加',chooseTime:'何分ありますか？',gameLibrary:'ゲームライブラリ',waiting:'ホストを待っています',ready:'準備完了',results:'結果',roomCode:'ルームコード',language:'言語',identity:'あなたのアイデンティティ',avatar:'アバター',nickname:'ニックネーム',continue:'続ける',back:'戻る',playerCount:'プレイヤー',gamePreview:'ゲームプレビュー',waitingDetail:'ルームに参加しました。ホストの準備ができるとゲームが始まります。',joinedAs:'参加名'},
  ko:{host:'게임 호스트',join:'방 참가',chooseTime:'시간이 얼마나 있나요?',gameLibrary:'게임 라이브러리',waiting:'호스트를 기다리는 중',ready:'준비 완료',results:'결과',roomCode:'방 코드',language:'언어',identity:'내 아이덴티티',avatar:'아바타',nickname:'닉네임',continue:'계속',back:'뒤로',playerCount:'플레이어',gamePreview:'게임 미리보기',waitingDetail:'방에 참가했습니다. 호스트가 준비되면 게임이 시작됩니다.',joinedAs:'참가 이름'},
};
