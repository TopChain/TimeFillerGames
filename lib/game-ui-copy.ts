import type { Locale } from './product';

export type GameUiCopy = {
  common: {
    loading: string;
    paused: string;
    remaining: string;
    frozen: string;
    spectator: string;
    waitingHost: string;
    roundComplete: string;
    correct: string;
  };
  quickDraw: {
    title: string;
    waitingTurn: string;
    turnResult: string;
    wordWas: string;
    yourArtistTurn: string;
    drawThisWord: string;
    doNotWriteOrSay: string;
    pauseArtist: string;
    pauseGuesser: string;
    correctGuessers: string;
    artistScoreHelp: string;
    isDrawing: string;
    watchDrawing: string;
    yourGuess: string;
    guessPlaceholder: string;
    submitGuess: string;
    sending: string;
    correctRecorded: string;
    yourGuesses: string;
    notYet: string;
    matchingNote: string;
    artistResultHelp: string;
    noCorrectForYou: string;
  };
};

export const GAME_UI_COPY: Record<Locale, GameUiCopy> = {
  en: {
    common: { loading: 'Loading…', paused: 'Paused', remaining: 'remaining', frozen: 'frozen', spectator: 'Spectator', waitingHost: 'Waiting for the Host to continue.', roundComplete: 'Round complete.', correct: 'Correct' },
    quickDraw: {
      title: 'Quick Draw & Guess', waitingTurn: 'Waiting for the live drawing turn.', turnResult: 'Turn result', wordWas: 'The word was', yourArtistTurn: 'Your artist turn', drawThisWord: 'Draw this word', doNotWriteOrSay: 'Do not write the word or say it aloud. Your strokes synchronize to the room.', pauseArtist: 'The Host paused this turn. Drawing is frozen and will resume with the same remaining time.', pauseGuesser: 'The Host paused this turn. Guessing is frozen and will resume with the same remaining time.', correctGuessers: 'Correct guessers', artistScoreHelp: 'Artist scoring by successful guesses', isDrawing: 'is drawing', watchDrawing: 'Watch the drawing and guess the secret word.', yourGuess: 'Your guess', guessPlaceholder: 'Type your guess…', submitGuess: 'Submit guess', sending: 'Sending…', correctRecorded: 'Correct guess accepted. Your score is locked for this turn.', yourGuesses: 'Your guesses', notYet: 'Not yet', matchingNote: 'Guess acceptance currently uses conservative normalized exact matching. Fuzzy spelling tolerance remains a test-driven release decision.', artistResultHelp: 'Your artist score is calculated by how many eligible players correctly identified the word.', noCorrectForYou: 'No correct guess was recorded for you this turn.'
    }
  },
  'zh-Hant': {
    common: { loading: '載入中…', paused: '已暫停', remaining: '剩餘', frozen: '已凍結', spectator: '觀眾', waitingHost: '等待主持人繼續。', roundComplete: '本回合結束。', correct: '答對' },
    quickDraw: {
      title: '快速畫圖猜一猜', waitingTurn: '等待即時畫圖回合開始。', turnResult: '回合結果', wordWas: '答案是', yourArtistTurn: '輪到你畫', drawThisWord: '請畫這個詞', doNotWriteOrSay: '不要寫出或說出這個詞。你的筆畫會同步到房間。', pauseArtist: '主持人已暫停本回合。畫圖已凍結，恢復後會保留相同的剩餘時間。', pauseGuesser: '主持人已暫停本回合。猜答案已凍結，恢復後會保留相同的剩餘時間。', correctGuessers: '答對人數', artistScoreHelp: '畫圖者依成功猜中的人數計分', isDrawing: '正在畫圖', watchDrawing: '看圖並猜出秘密詞。', yourGuess: '你的答案', guessPlaceholder: '輸入你的答案…', submitGuess: '送出答案', sending: '送出中…', correctRecorded: '答對了！伺服器已鎖定你本回合的分數。', yourGuesses: '你的答案紀錄', notYet: '尚未答對', matchingNote: '目前採用保守的正規化精確比對。模糊拼字容錯仍需依測試結果決定。', artistResultHelp: '你的畫圖者分數依符合資格的玩家中有多少人成功猜中而計算。', noCorrectForYou: '本回合伺服器沒有記錄到你的正確答案。'
    }
  },
  'zh-Hans': {
    common: { loading: '加载中…', paused: '已暂停', remaining: '剩余', frozen: '已冻结', spectator: '观众', waitingHost: '等待主持人继续。', roundComplete: '本回合结束。', correct: '答对' },
    quickDraw: {
      title: '快速画图猜一猜', waitingTurn: '等待实时画图回合开始。', turnResult: '回合结果', wordWas: '答案是', yourArtistTurn: '轮到你画', drawThisWord: '请画这个词', doNotWriteOrSay: '不要写出或说出这个词。你的笔画会同步到房间。', pauseArtist: '主持人已暂停本回合。画图已冻结，恢复后会保留相同的剩余时间。', pauseGuesser: '主持人已暂停本回合。猜答案已冻结，恢复后会保留相同的剩余时间。', correctGuessers: '答对人数', artistScoreHelp: '画图者按成功猜中的人数计分', isDrawing: '正在画图', watchDrawing: '看图并猜出秘密词。', yourGuess: '你的答案', guessPlaceholder: '输入你的答案…', submitGuess: '提交答案', sending: '提交中…', correctRecorded: '答对了！服务器已锁定你本回合的分数。', yourGuesses: '你的答案记录', notYet: '尚未答对', matchingNote: '目前采用保守的规范化精确匹配。模糊拼写容错仍需根据测试结果决定。', artistResultHelp: '你的画图者分数取决于符合资格的玩家中有多少人成功猜中。', noCorrectForYou: '本回合服务器没有记录到你的正确答案。'
    }
  },
  es: {
    common: { loading: 'Cargando…', paused: 'En pausa', remaining: 'restantes', frozen: 'congelado', spectator: 'Espectador', waitingHost: 'Esperando a que el anfitrión continúe.', roundComplete: 'Ronda terminada.', correct: 'Correcto' },
    quickDraw: {
      title: 'Dibujo rápido y adivina', waitingTurn: 'Esperando el turno de dibujo en vivo.', turnResult: 'Resultado del turno', wordWas: 'La palabra era', yourArtistTurn: 'Tu turno para dibujar', drawThisWord: 'Dibuja esta palabra', doNotWriteOrSay: 'No escribas ni digas la palabra en voz alta. Tus trazos se sincronizan con la sala.', pauseArtist: 'El anfitrión pausó este turno. El dibujo está congelado y continuará con el mismo tiempo restante.', pauseGuesser: 'El anfitrión pausó este turno. Las respuestas están congeladas y continuarán con el mismo tiempo restante.', correctGuessers: 'Aciertos', artistScoreHelp: 'Puntos del dibujante según los aciertos', isDrawing: 'está dibujando', watchDrawing: 'Mira el dibujo y adivina la palabra secreta.', yourGuess: 'Tu respuesta', guessPlaceholder: 'Escribe tu respuesta…', submitGuess: 'Enviar respuesta', sending: 'Enviando…', correctRecorded: 'Respuesta correcta aceptada. Tu puntuación de este turno quedó guardada.', yourGuesses: 'Tus respuestas', notYet: 'Aún no', matchingNote: 'Actualmente se usa una comparación exacta normalizada y conservadora. La tolerancia a errores ortográficos se decidirá mediante pruebas.', artistResultHelp: 'Tu puntuación como dibujante depende de cuántos jugadores elegibles identificaron correctamente la palabra.', noCorrectForYou: 'No se registró una respuesta correcta para ti en este turno.'
    }
  },
  ja: {
    common: { loading: '読み込み中…', paused: '一時停止', remaining: '残り', frozen: '停止中', spectator: '観戦者', waitingHost: 'ホストが続行するのを待っています。', roundComplete: 'ラウンド終了。', correct: '正解' },
    quickDraw: {
      title: 'クイックお絵かき＆当てゲーム', waitingTurn: 'ライブのお絵かきターンを待っています。', turnResult: 'ターン結果', wordWas: '答えは', yourArtistTurn: 'あなたがお絵かき担当', drawThisWord: 'この言葉を描いてください', doNotWriteOrSay: '言葉を書いたり声に出したりしないでください。線はルームに同期されます。', pauseArtist: 'ホストがこのターンを一時停止しました。描画は停止し、再開後も同じ残り時間から続きます。', pauseGuesser: 'ホストがこのターンを一時停止しました。回答は停止し、再開後も同じ残り時間から続きます。', correctGuessers: '正解者', artistScoreHelp: '正解者数に応じて描き手を採点', isDrawing: 'がお絵かき中', watchDrawing: '絵を見て秘密の言葉を当ててください。', yourGuess: 'あなたの答え', guessPlaceholder: '答えを入力…', submitGuess: '回答を送信', sending: '送信中…', correctRecorded: '正解が受理されました。このターンの得点は確定しました。', yourGuesses: 'あなたの回答', notYet: 'まだ不正解', matchingNote: '現在は保守的な正規化完全一致を使用しています。スペルミスの許容範囲はテスト結果に基づいて決定します。', artistResultHelp: '描き手の得点は、対象プレイヤーのうち何人が正しく言葉を当てたかで計算されます。', noCorrectForYou: 'このターンではあなたの正解は記録されませんでした。'
    }
  },
  ko: {
    common: { loading: '불러오는 중…', paused: '일시정지', remaining: '남음', frozen: '멈춤', spectator: '관전자', waitingHost: '호스트가 계속하기를 기다리는 중입니다.', roundComplete: '라운드 종료.', correct: '정답' },
    quickDraw: {
      title: '빠른 그림 맞히기', waitingTurn: '실시간 그림 차례를 기다리는 중입니다.', turnResult: '차례 결과', wordWas: '정답은', yourArtistTurn: '내가 그릴 차례', drawThisWord: '이 단어를 그리세요', doNotWriteOrSay: '단어를 직접 쓰거나 말하지 마세요. 그림 선은 방에 동기화됩니다.', pauseArtist: '호스트가 이 차례를 일시정지했습니다. 그림이 멈췄으며 재개하면 같은 남은 시간부터 계속됩니다.', pauseGuesser: '호스트가 이 차례를 일시정지했습니다. 답 입력이 멈췄으며 재개하면 같은 남은 시간부터 계속됩니다.', correctGuessers: '정답자', artistScoreHelp: '정답자 수에 따라 그린 사람 점수 계산', isDrawing: '그리는 중', watchDrawing: '그림을 보고 비밀 단어를 맞혀 보세요.', yourGuess: '내 답', guessPlaceholder: '답을 입력하세요…', submitGuess: '답 제출', sending: '전송 중…', correctRecorded: '정답이 인정되었습니다. 이 차례의 점수가 확정되었습니다.', yourGuesses: '내 답 기록', notYet: '아직 아님', matchingNote: '현재는 보수적인 정규화 완전 일치 방식을 사용합니다. 철자 오차 허용 범위는 테스트 결과에 따라 결정됩니다.', artistResultHelp: '그린 사람의 점수는 참여 가능한 플레이어 중 몇 명이 단어를 맞혔는지에 따라 계산됩니다.', noCorrectForYou: '이번 차례에는 정답 기록이 없습니다.'
    }
  }
};
