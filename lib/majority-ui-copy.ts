import type { Locale } from './product';

export type MajorityUiCopy = {
  title: string;
  waitingQuestion: string;
  roundComplete: string;
  waitingHost: string;
  paused: string;
  spectator: string;
  question: string;
  pauseVoting: string;
  spectatorWaiting: string;
  frozen: string;
  watchQuestion: string;
  choosePrediction: string;
  locked: string;
  ruleHelp: string;
  roomResult: string;
  pausedBeforeNext: string;
  spectatorResult: string;
  yourPrediction: string;
  matched: string;
  missed: string;
};

export const MAJORITY_UI_COPY: Record<Locale, MajorityUiCopy> = {
  en: { title:'Majority Match', waitingQuestion:'Waiting for the live question.', roundComplete:'Round complete.', waitingHost:'Waiting for the Host to continue.', paused:'Paused', spectator:'Spectating', question:'Question', pauseVoting:'The Host paused the room. Voting is frozen and will resume with the same remaining time.', spectatorWaiting:'This seat is currently spectating. If you joined late and an active seat is available, the server will activate you at the next question boundary; Host-designated spectators stay spectators.', frozen:'answer time frozen', watchQuestion:'watch this question', choosePrediction:'Choose what you think the room will choose', locked:'Locked', ruleHelp:'There is no objectively correct answer and no speed bonus. Predict the group majority.', roomResult:'Room result', pausedBeforeNext:'The Host paused the room before the next question.', spectatorResult:'You are spectating this result. A queued late-join seat is activated before the next question when capacity permits.', yourPrediction:'Your prediction', matched:'Your prediction matched the majority: +1000 points.', missed:'Your prediction did not match the majority this question.' },
  'zh-Hant': { title:'多數派配對', waitingQuestion:'等待即時題目。', roundComplete:'本回合結束。', waitingHost:'等待主持人繼續。', paused:'已暫停', spectator:'觀戰中', question:'題目', pauseVoting:'主持人已暫停房間。投票已凍結，恢復後會保留相同的剩餘時間。', spectatorWaiting:'這個座位目前為觀眾。如果你是中途加入且仍有玩家名額，伺服器會在下一題開始前啟用你的玩家席位；主持人指定的觀眾會繼續觀戰。', frozen:'作答時間已凍結', watchQuestion:'觀看本題', choosePrediction:'選出你認為全場多數人會選的答案', locked:'已鎖定', ruleHelp:'沒有客觀正確答案，也沒有速度加分。請預測全場多數人的選擇。', roomResult:'全場結果', pausedBeforeNext:'主持人在下一題前暫停了房間。', spectatorResult:'你正在觀看本題結果。若中途加入的待啟用席位仍有名額，會在下一題前啟用。', yourPrediction:'你的預測', matched:'你的預測符合多數：+1000 分。', missed:'你的預測本題沒有符合多數。' },
  'zh-Hans': { title:'多数派配对', waitingQuestion:'等待实时题目。', roundComplete:'本回合结束。', waitingHost:'等待主持人继续。', paused:'已暂停', spectator:'观战中', question:'题目', pauseVoting:'主持人已暂停房间。投票已冻结，恢复后会保留相同的剩余时间。', spectatorWaiting:'这个座位目前为观众。如果你是中途加入且仍有玩家名额，服务器会在下一题开始前启用你的玩家席位；主持人指定的观众会继续观战。', frozen:'作答时间已冻结', watchQuestion:'观看本题', choosePrediction:'选出你认为全场多数人会选的答案', locked:'已锁定', ruleHelp:'没有客观正确答案，也没有速度加分。请预测全场多数人的选择。', roomResult:'全场结果', pausedBeforeNext:'主持人在下一题前暂停了房间。', spectatorResult:'你正在观看本题结果。若中途加入的待启用席位仍有名额，会在下一题前启用。', yourPrediction:'你的预测', matched:'你的预测符合多数：+1000 分。', missed:'你的预测本题没有符合多数。' },
  es: { title:'Coincide con la mayoría', waitingQuestion:'Esperando la pregunta en vivo.', roundComplete:'Ronda terminada.', waitingHost:'Esperando a que el anfitrión continúe.', paused:'En pausa', spectator:'Observando', question:'Pregunta', pauseVoting:'El anfitrión pausó la sala. La votación está congelada y continuará con el mismo tiempo restante.', spectatorWaiting:'Este asiento está observando. Si te uniste tarde y hay un lugar activo disponible, el servidor te activará al inicio de la siguiente pregunta; los espectadores designados por el anfitrión seguirán como espectadores.', frozen:'tiempo de respuesta congelado', watchQuestion:'observa esta pregunta', choosePrediction:'Elige lo que crees que elegirá la mayoría de la sala', locked:'Bloqueado', ruleHelp:'No hay una respuesta objetivamente correcta ni bonificación por velocidad. Predice la mayoría del grupo.', roomResult:'Resultado de la sala', pausedBeforeNext:'El anfitrión pausó la sala antes de la siguiente pregunta.', spectatorResult:'Estás observando este resultado. Un asiento pendiente por ingreso tardío se activa antes de la siguiente pregunta si hay capacidad.', yourPrediction:'Tu predicción', matched:'Tu predicción coincidió con la mayoría: +1000 puntos.', missed:'Tu predicción no coincidió con la mayoría en esta pregunta.' },
  ja: { title:'マジョリティ・マッチ', waitingQuestion:'ライブ問題を待っています。', roundComplete:'ラウンド終了。', waitingHost:'ホストが続行するのを待っています。', paused:'一時停止', spectator:'観戦中', question:'問題', pauseVoting:'ホストがルームを一時停止しました。投票は停止し、再開後も同じ残り時間から続きます。', spectatorWaiting:'この席は現在観戦中です。途中参加でプレイヤー枠に空きがある場合、次の問題の境目でサーバーが有効化します。ホストが指定した観戦者はそのままです。', frozen:'回答時間停止中', watchQuestion:'この問題を観戦', choosePrediction:'ルームの多数派が選ぶと思う答えを選んでください', locked:'確定済み', ruleHelp:'客観的な正解はなく、スピードボーナスもありません。グループの多数派を予想してください。', roomResult:'ルーム結果', pausedBeforeNext:'ホストが次の問題の前にルームを一時停止しました。', spectatorResult:'この結果を観戦中です。途中参加の待機席は、空きがあれば次の問題の前に有効化されます。', yourPrediction:'あなたの予想', matched:'予想が多数派と一致しました：+1000ポイント。', missed:'この問題では予想が多数派と一致しませんでした。' },
  ko: { title:'다수 선택 맞히기', waitingQuestion:'실시간 질문을 기다리는 중입니다.', roundComplete:'라운드 종료.', waitingHost:'호스트가 계속하기를 기다리는 중입니다.', paused:'일시정지', spectator:'관전 중', question:'질문', pauseVoting:'호스트가 방을 일시정지했습니다. 투표가 멈췄으며 재개하면 같은 남은 시간부터 계속됩니다.', spectatorWaiting:'현재 관전 좌석입니다. 늦게 참가했고 활성 플레이어 자리가 남아 있으면 서버가 다음 질문 시작 전에 활성화합니다. 호스트가 지정한 관전자는 그대로 유지됩니다.', frozen:'답변 시간 멈춤', watchQuestion:'이 질문 관전', choosePrediction:'방의 다수가 고를 것 같은 답을 선택하세요', locked:'확정됨', ruleHelp:'객관적인 정답은 없으며 속도 보너스도 없습니다. 그룹의 다수 선택을 예측하세요.', roomResult:'방 결과', pausedBeforeNext:'호스트가 다음 질문 전에 방을 일시정지했습니다.', spectatorResult:'이 결과를 관전 중입니다. 늦게 참가한 대기 좌석은 자리가 있으면 다음 질문 전에 활성화됩니다.', yourPrediction:'내 예측', matched:'예측이 다수와 일치했습니다: +1000점.', missed:'이번 질문에서는 예측이 다수와 일치하지 않았습니다.' }
};
