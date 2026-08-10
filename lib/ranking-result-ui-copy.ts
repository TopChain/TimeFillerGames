import type { Locale } from './product';

export type RankingResultUiCopy = {
  loading: string;
  privatePlacement: string;
  privateResult: string;
  noScoredPlacement: string;
  points: string;
  noPublicRankings: string;
  noPublicRanking: string;
  role: string;
};

export const RANKING_RESULT_UI_COPY: Record<Locale, RankingResultUiCopy> = {
  en: { loading:'Loading server results…', privatePlacement:'Your private placement', privateResult:'Your private result', noScoredPlacement:'No scored placement', points:'points', noPublicRankings:'Public rankings are hidden by this room’s ranking-visibility setting.', noPublicRanking:'No public ranking rows are visible for this room.', role:'Role' },
  'zh-Hant': { loading:'正在載入伺服器結果…', privatePlacement:'你的私人名次', privateResult:'你的私人結果', noScoredPlacement:'沒有計分名次', points:'分', noPublicRankings:'此房間的排名可見性設定已隱藏公開排名。', noPublicRanking:'此房間沒有可見的公開排名資料。', role:'角色' },
  'zh-Hans': { loading:'正在加载服务器结果…', privatePlacement:'你的私人名次', privateResult:'你的私人结果', noScoredPlacement:'没有计分名次', points:'分', noPublicRankings:'此房间的排名可见性设置已隐藏公开排名。', noPublicRanking:'此房间没有可见的公开排名数据。', role:'角色' },
  es: { loading:'Cargando resultados del servidor…', privatePlacement:'Tu posición privada', privateResult:'Tu resultado privado', noScoredPlacement:'Sin posición con puntuación', points:'puntos', noPublicRankings:'La configuración de visibilidad de la sala oculta la clasificación pública.', noPublicRanking:'No hay filas de clasificación pública visibles para esta sala.', role:'Rol' },
  ja: { loading:'サーバー結果を読み込み中…', privatePlacement:'あなたの非公開順位', privateResult:'あなたの非公開結果', noScoredPlacement:'得点順位なし', points:'ポイント', noPublicRankings:'このルームの順位表示設定により公開ランキングは非表示です。', noPublicRanking:'このルームで表示できる公開ランキングはありません。', role:'役割' },
  ko: { loading:'서버 결과를 불러오는 중…', privatePlacement:'내 비공개 순위', privateResult:'내 비공개 결과', noScoredPlacement:'점수 순위 없음', points:'점', noPublicRankings:'이 방의 순위 공개 설정에 따라 공개 순위가 숨겨져 있습니다.', noPublicRanking:'이 방에서 표시할 공개 순위가 없습니다.', role:'역할' }
};
