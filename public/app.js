const socket = io();
const state = { room: null, isHost: false };
const $ = (id) => document.getElementById(id);

function show(id) {
  document.querySelectorAll('.screen').forEach((el) => el.classList.remove('active'));
  $(id).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toast(message) {
  const el = $('toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove('show'), 1800);
}

function setRole(isHost) {
  state.isHost = Boolean(isHost);
  document.body.classList.toggle('is-host', state.isHost);
  document.body.classList.toggle('is-player', !state.isHost);
}

function renderRoom(room) {
  state.room = room;
  const me = room.players.find((p) => p.id === socket.id);
  setRole(me ? me.isHost : room.hostId === socket.id);
  $('roomCode').textContent = room.code;
  $('roleText').textContent = state.isHost ? `You are the host • ${room.players.length}/${room.settings.maxPlayers} players` : `You joined as a player • ${room.players.length}/${room.settings.maxPlayers} players`;
  $('players').innerHTML = room.players.map((p) => `<div class="player"><strong>${escapeHtml(p.name)}</strong><span class="status">${p.isHost ? 'Host' : 'Ready'}</span></div>`).join('');
  $('difficulty').value = room.settings.difficulty;
  $('roundSeconds').value = String(room.settings.roundSeconds);
  $('difficulty').disabled = !state.isHost;
  $('roundSeconds').disabled = !state.isHost;

  if (room.game.status === 'lobby') show('lobby');
  if (room.game.status === 'playing') {
    $('score').textContent = room.game.score;
    $('timeLeft').textContent = room.game.remaining;
    show('game');
  }
  if (room.game.status === 'results') {
    $('finalScore').textContent = room.game.score;
    show('results');
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
}

document.querySelectorAll('[data-go]').forEach((button) => button.addEventListener('click', () => show(button.dataset.go)));

$('createRoom').addEventListener('click', () => {
  socket.emit('create-room', {
    name: $('hostName').value,
    sessionLength: Number($('sessionLength').value),
    maxPlayers: Number($('maxPlayers').value)
  }, (result) => {
    if (!result.ok) return toast(result.error || 'Could not create room.');
    setRole(true);
    renderRoom(result.room);
  });
});

$('joinRoom').addEventListener('click', () => {
  socket.emit('join-room', { name: $('joinName').value, code: $('joinCode').value }, (result) => {
    if (!result.ok) return toast(result.error || 'Could not join room.');
    setRole(false);
    renderRoom(result.room);
  });
});

$('saveSettings').addEventListener('click', () => {
  socket.emit('update-settings', { difficulty: $('difficulty').value, roundSeconds: Number($('roundSeconds').value) }, (result) => {
    if (!result.ok) return toast(result.error || 'Could not save settings.');
    toast('Settings saved.');
  });
});

$('startGame').addEventListener('click', () => {
  socket.emit('update-settings', { difficulty: $('difficulty').value, roundSeconds: Number($('roundSeconds').value) }, () => {
    socket.emit('start-word-game', {}, (result) => {
      if (!result.ok) toast(result.error || 'Could not start the game.');
    });
  });
});

$('correct').addEventListener('click', () => socket.emit('word-correct', {}, () => {}));
$('skip').addEventListener('click', () => socket.emit('word-skip', {}, () => {}));
$('endRound').addEventListener('click', () => socket.emit('end-round', {}, () => {}));
$('backLobby').addEventListener('click', () => socket.emit('back-to-lobby', {}, () => {}));

socket.on('room-state', renderRoom);
socket.on('timer', ({ remaining }) => { $('timeLeft').textContent = remaining; });
socket.on('score', ({ score }) => { $('score').textContent = score; });
socket.on('host-word', ({ word, hint }) => { $('word').textContent = word.toUpperCase(); $('hint').textContent = hint; });
socket.on('player-prompt', ({ message }) => { $('playerPrompt').textContent = message; });
socket.on('round-ended', ({ score }) => { $('finalScore').textContent = score; show('results'); });
socket.on('room-closed', ({ message }) => { state.room = null; toast(message || 'Room closed.'); show('home'); });
socket.on('connect_error', () => toast('Connection problem. Retrying…'));
