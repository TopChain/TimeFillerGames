const path = require('path');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.get('/health', (_req, res) => res.json({ ok: true, service: 'TimeFillerGames', version: '0.2.0' }));

const rooms = new Map();
const socketRoom = new Map();

const WORDS = {
  easy: [
    ['apple', 'A common red or green fruit'],
    ['chair', 'You sit on it'],
    ['window', 'You can look through it'],
    ['happy', 'Feeling good'],
    ['water', 'You drink it'],
    ['school', 'A place for learning'],
    ['music', 'You listen to it'],
    ['family', 'Parents, children, and relatives']
  ],
  medium: [
    ['journey', 'Travel from one place to another'],
    ['improve', 'To make something better'],
    ['curious', 'Wanting to know more'],
    ['balance', 'A stable or equal state'],
    ['memory', 'The ability to remember'],
    ['weather', 'Conditions outside, such as rain or sun'],
    ['decide', 'To make a choice'],
    ['patient', 'Able to wait calmly']
  ],
  hard: [
    ['ambiguous', 'Having more than one possible meaning'],
    ['meticulous', 'Very careful about details'],
    ['resilient', 'Able to recover quickly'],
    ['inevitable', 'Certain to happen'],
    ['contemplate', 'To think deeply about something'],
    ['subtle', 'Not obvious or easy to notice'],
    ['versatile', 'Able to do many different things'],
    ['coherent', 'Logical and consistent']
  ]
};

function sanitizeName(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, 20);
}

function createRoomCode() {
  for (let i = 0; i < 100; i += 1) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    if (!rooms.has(code)) return code;
  }
  throw new Error('Could not allocate room code');
}

function publicRoom(room) {
  return {
    code: room.code,
    hostId: room.hostId,
    settings: room.settings,
    game: room.game,
    players: [...room.players.values()].map(({ id, name, isHost }) => ({ id, name, isHost }))
  };
}

function emitRoom(room) {
  io.to(room.code).emit('room-state', publicRoom(room));
}

function shuffledWords(difficulty) {
  const source = WORDS[difficulty] || WORDS.medium;
  return [...source].sort(() => Math.random() - 0.5);
}

function currentWord(room) {
  return room.wordDeck[room.wordIndex % room.wordDeck.length];
}

function sendWord(room) {
  const word = currentWord(room);
  if (!word) return;
  io.to(room.hostId).emit('host-word', { word: word[0], hint: word[1] });
  io.to(room.code).except(room.hostId).emit('player-prompt', {
    message: 'The host has the word. Listen for clues and guess aloud.'
  });
}

function clearRound(room) {
  if (room.timer) clearInterval(room.timer);
  room.timer = null;
}

function finishRound(room) {
  clearRound(room);
  room.game = { ...room.game, status: 'results', remaining: 0 };
  io.to(room.code).emit('round-ended', { score: room.game.score });
  emitRoom(room);
}

function leaveCurrentRoom(socket) {
  const code = socketRoom.get(socket.id);
  if (!code) return;
  socketRoom.delete(socket.id);
  const room = rooms.get(code);
  if (!room) return;

  room.players.delete(socket.id);
  socket.leave(code);

  if (socket.id === room.hostId) {
    clearRound(room);
    io.to(code).emit('room-closed', { message: 'The host left the room.' });
    for (const playerId of room.players.keys()) socketRoom.delete(playerId);
    rooms.delete(code);
    return;
  }

  if (room.players.size === 0) {
    clearRound(room);
    rooms.delete(code);
  } else {
    emitRoom(room);
  }
}

io.on('connection', (socket) => {
  socket.on('create-room', (payload = {}, callback = () => {}) => {
    try {
      leaveCurrentRoom(socket);
      const name = sanitizeName(payload.name) || 'Host';
      const code = createRoomCode();
      const room = {
        code,
        hostId: socket.id,
        players: new Map([[socket.id, { id: socket.id, name, isHost: true }]]),
        settings: {
          maxPlayers: Math.min(20, Math.max(2, Number(payload.maxPlayers) || 8)),
          sessionLength: Math.min(60, Math.max(5, Number(payload.sessionLength) || 10)),
          difficulty: 'medium',
          roundSeconds: 45
        },
        game: { type: null, status: 'lobby', score: 0, remaining: 0 },
        wordDeck: [],
        wordIndex: 0,
        timer: null
      };
      rooms.set(code, room);
      socketRoom.set(socket.id, code);
      socket.join(code);
      callback({ ok: true, room: publicRoom(room) });
      emitRoom(room);
    } catch (error) {
      callback({ ok: false, error: 'Could not create a room.' });
    }
  });

  socket.on('join-room', (payload = {}, callback = () => {}) => {
    const code = String(payload.code || '').replace(/\D/g, '').slice(0, 6);
    const name = sanitizeName(payload.name);
    const room = rooms.get(code);
    if (!name) return callback({ ok: false, error: 'Enter your name.' });
    if (!room) return callback({ ok: false, error: 'Room not found.' });
    if (room.players.size >= room.settings.maxPlayers) return callback({ ok: false, error: 'This room is full.' });
    if (room.game.status === 'playing') return callback({ ok: false, error: 'A round is already in progress.' });

    leaveCurrentRoom(socket);
    room.players.set(socket.id, { id: socket.id, name, isHost: false });
    socketRoom.set(socket.id, code);
    socket.join(code);
    callback({ ok: true, room: publicRoom(room) });
    emitRoom(room);
  });

  socket.on('update-settings', (payload = {}, callback = () => {}) => {
    const room = rooms.get(socketRoom.get(socket.id));
    if (!room || room.hostId !== socket.id) return callback({ ok: false, error: 'Host only.' });
    if (room.game.status === 'playing') return callback({ ok: false, error: 'Finish the current round first.' });

    const difficulty = ['easy', 'medium', 'hard'].includes(payload.difficulty) ? payload.difficulty : room.settings.difficulty;
    room.settings.difficulty = difficulty;
    room.settings.roundSeconds = [30, 45, 60].includes(Number(payload.roundSeconds)) ? Number(payload.roundSeconds) : room.settings.roundSeconds;
    emitRoom(room);
    callback({ ok: true });
  });

  socket.on('start-word-game', (_payload = {}, callback = () => {}) => {
    const room = rooms.get(socketRoom.get(socket.id));
    if (!room || room.hostId !== socket.id) return callback({ ok: false, error: 'Host only.' });
    if (room.players.size < 2) return callback({ ok: false, error: 'At least 2 players are required.' });

    clearRound(room);
    room.wordDeck = shuffledWords(room.settings.difficulty);
    room.wordIndex = 0;
    room.game = { type: 'word-guess', status: 'playing', score: 0, remaining: room.settings.roundSeconds };
    emitRoom(room);
    sendWord(room);
    callback({ ok: true });

    room.timer = setInterval(() => {
      room.game.remaining -= 1;
      io.to(room.code).emit('timer', { remaining: room.game.remaining });
      if (room.game.remaining <= 0) finishRound(room);
    }, 1000);
  });

  socket.on('word-correct', (_payload = {}, callback = () => {}) => {
    const room = rooms.get(socketRoom.get(socket.id));
    if (!room || room.hostId !== socket.id || room.game.status !== 'playing') return callback({ ok: false });
    room.game.score += 1;
    room.wordIndex += 1;
    io.to(room.code).emit('score', { score: room.game.score });
    sendWord(room);
    callback({ ok: true });
  });

  socket.on('word-skip', (_payload = {}, callback = () => {}) => {
    const room = rooms.get(socketRoom.get(socket.id));
    if (!room || room.hostId !== socket.id || room.game.status !== 'playing') return callback({ ok: false });
    room.wordIndex += 1;
    sendWord(room);
    callback({ ok: true });
  });

  socket.on('end-round', (_payload = {}, callback = () => {}) => {
    const room = rooms.get(socketRoom.get(socket.id));
    if (!room || room.hostId !== socket.id) return callback({ ok: false });
    finishRound(room);
    callback({ ok: true });
  });

  socket.on('back-to-lobby', (_payload = {}, callback = () => {}) => {
    const room = rooms.get(socketRoom.get(socket.id));
    if (!room || room.hostId !== socket.id) return callback({ ok: false });
    clearRound(room);
    room.game = { type: null, status: 'lobby', score: 0, remaining: 0 };
    emitRoom(room);
    callback({ ok: true });
  });

  socket.on('disconnect', () => leaveCurrentRoom(socket));
});

server.listen(PORT, () => {
  console.log(`TimeFillerGames listening on http://localhost:${PORT}`);
});
