import type { Locale } from './product';

type Strings = { host:string; join:string; chooseTime:string; gameLibrary:string; waiting:string; ready:string; results:string };

export const STRINGS: Record<Locale, Strings> = {
  en:{host:'Host a Game',join:'Join Room',chooseTime:'How much time do you have?',gameLibrary:'Game library',waiting:'Waiting for host',ready:'Ready',results:'Results'},
  'zh-Hant':{host:'主持遊戲',join:'加入房間',chooseTime:'你們有多少時間？',gameLibrary:'遊戲庫',waiting:'等待主持人',ready:'準備完成',results:'結果'},
  'zh-Hans':{host:'主持游戏',join:'加入房间',chooseTime:'你们有多少时间？',gameLibrary:'游戏库',waiting:'等待主持人',ready:'准备完成',results:'结果'},
  es:{host:'Organizar juego',join:'Unirse a sala',chooseTime:'¿Cuánto tiempo tienen?',gameLibrary:'Biblioteca de juegos',waiting:'Esperando al anfitrión',ready:'Listo',results:'Resultados'},
  ja:{host:'ゲームを主催',join:'ルームに参加',chooseTime:'何分ありますか？',gameLibrary:'ゲームライブラリ',waiting:'ホストを待っています',ready:'準備完了',results:'結果'},
  ko:{host:'게임 호스트',join:'방 참가',chooseTime:'시간이 얼마나 있나요?',gameLibrary:'게임 라이브러리',waiting:'호스트를 기다리는 중',ready:'준비 완료',results:'결과'},
};
