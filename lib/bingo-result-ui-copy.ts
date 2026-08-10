import type { Locale } from './product';

export type BingoResultUiCopy = {
  loading: string;
  privateResult: string;
  noWinningLine: string;
  completedOnDraw: string;
  sameDrawShares: string;
  noLineBeforeEnd: string;
  noWinnerRecorded: string;
  draw: string;
};

export const BINGO_RESULT_UI_COPY: Record<Locale, BingoResultUiCopy> = {
  en: { loading:'Loading server results…', privateResult:'Your private result', noWinningLine:'No winning line', completedOnDraw:'Completed on server draw', sameDrawShares:'Players completing on the same draw share placement.', noLineBeforeEnd:'The server did not record a winning line for this card before the Host ended the round.', noWinnerRecorded:'No winning line was recorded before the Host ended the round.', draw:'Draw' },
  'zh-Hant': { loading:'正在載入伺服器結果…', privateResult:'你的私人結果', noWinningLine:'未完成獲勝連線', completedOnDraw:'完成於伺服器第', sameDrawShares:'同一次抽取完成的玩家並列同一名次。', noLineBeforeEnd:'主持人結束回合前，伺服器沒有記錄到這張卡的獲勝連線。', noWinnerRecorded:'主持人結束回合前沒有記錄到任何獲勝連線。', draw:'第' },
  'zh-Hans': { loading:'正在加载服务器结果…', privateResult:'你的私人结果', noWinningLine:'未完成获胜连线', completedOnDraw:'完成于服务器第', sameDrawShares:'同一次抽取完成的玩家并列同一名次。', noLineBeforeEnd:'主持人结束回合前，服务器没有记录到这张卡的获胜连线。', noWinnerRecorded:'主持人结束回合前没有记录到任何获胜连线。', draw:'第' },
  es: { loading:'Cargando resultados del servidor…', privateResult:'Tu resultado privado', noWinningLine:'Sin línea ganadora', completedOnDraw:'Completado en el sorteo del servidor', sameDrawShares:'Los jugadores que completan en el mismo sorteo comparten posición.', noLineBeforeEnd:'El servidor no registró una línea ganadora para esta tarjeta antes de que el anfitrión terminara la ronda.', noWinnerRecorded:'No se registró ninguna línea ganadora antes de que el anfitrión terminara la ronda.', draw:'Sorteo' },
  ja: { loading:'サーバー結果を読み込み中…', privateResult:'あなたの非公開結果', noWinningLine:'勝利ラインなし', completedOnDraw:'サーバー抽選で完成', sameDrawShares:'同じ抽選で完成したプレイヤーは同順位になります。', noLineBeforeEnd:'ホストがラウンドを終了する前に、このカードの勝利ラインはサーバーに記録されませんでした。', noWinnerRecorded:'ホストがラウンドを終了する前に勝利ラインは記録されませんでした。', draw:'抽選' },
  ko: { loading:'서버 결과를 불러오는 중…', privateResult:'내 비공개 결과', noWinningLine:'완성된 승리 줄 없음', completedOnDraw:'서버 추첨에서 완성', sameDrawShares:'같은 추첨에서 완성한 플레이어는 공동 순위를 받습니다.', noLineBeforeEnd:'호스트가 라운드를 끝내기 전에 이 카드의 승리 줄이 서버에 기록되지 않았습니다.', noWinnerRecorded:'호스트가 라운드를 끝내기 전에 승리 줄이 기록되지 않았습니다.', draw:'추첨' }
};
