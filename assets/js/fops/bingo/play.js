// Bingo: solo and multiplayer play.
import { pythonURI, fetchOptions } from '../../api/config.js';
import { LETTERS, FREE, callOrder, makeCard, winningLines, ballsCalledAt, letterFor, spoken } from './engine.js';
import { loadProgress, saveProgress } from '../progress.js';

const app = document.getElementById('bingo-app');
const $ = (sel) => app.querySelector(sel);
const API = `${pythonURI}/api/fops/bingo`;
const ROOM_KEY = 'fops-bingo-room';

const game = {
  mode: null,          // 'solo' or 'room'
  order: [],           // calling order for this game
  card: null,
  count: 0,            // balls called so far
  marked: new Set(),   // numbers the player has marked
  autoMark: true,
  voice: 'speechSynthesis' in window,
  paused: false,
  over: false,
  timer: null,
  // solo
  intervalMs: 10000,
  // room
  room: null,
  clockOffset: 0,      // server time minus this computer's time
  poll: null,
};

let stats = { played: 0, wins: 0, fastest: null };

// ---------- Screens ----------

function show(screen) {
  app.querySelectorAll('[data-screen]').forEach((s) => { s.hidden = s.dataset.screen !== screen; });
}

function lobbyMessage(text, kind) {
  const box = $('[data-lobby-message]');
  box.textContent = text || '';
  box.className = `form-message ${kind || ''}`;
}

function gameMessage(text, kind) {
  const box = $('[data-game-message]');
  box.replaceChildren();
  if (text) {
    const p = document.createElement('p');
    p.className = `result ${kind || ''}`;
    p.textContent = text;
    box.appendChild(p);
  }
}

function showStats() {
  const parts = [`Games played: ${stats.played}`, `Wins: ${stats.wins}`];
  if (stats.fastest) parts.push(`Fastest Bingo: ${stats.fastest} numbers`);
  $('[data-stats]').textContent = stats.played ? parts.join(' · ') : '';
}

// ---------- Card ----------

function renderCard() {
  const grid = $('[data-card]');
  grid.replaceChildren();
  LETTERS.forEach((letter) => {
    const head = document.createElement('div');
    head.className = 'bingo-head';
    head.setAttribute('role', 'columnheader');
    head.textContent = letter;
    grid.appendChild(head);
  });
  for (let row = 0; row < 5; row += 1) {
    for (let col = 0; col < 5; col += 1) {
      const value = game.card[col][row];
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'bingo-cell';
      cell.dataset.col = col;
      cell.dataset.row = row;
      if (value === FREE) {
        cell.textContent = 'FREE';
        cell.classList.add('is-free', 'is-marked');
        cell.disabled = true;
        cell.setAttribute('aria-label', 'Free space');
      } else {
        cell.textContent = value;
        cell.dataset.value = value;
        cell.setAttribute('aria-label', `${letterFor(value)} ${value}`);
        cell.addEventListener('click', () => toggleMark(value, cell));
      }
      grid.appendChild(cell);
    }
  }
}

function calledSet() {
  return new Set(game.order.slice(0, game.count));
}

function toggleMark(value, cell) {
  if (game.over) return;
  if (!calledSet().has(value)) {
    gameMessage(`${letterFor(value)} ${value} has not been called yet.`, 'hint');
    return;
  }
  if (game.marked.has(value)) game.marked.delete(value); else game.marked.add(value);
  cell.classList.toggle('is-marked', game.marked.has(value));
  cell.setAttribute('aria-pressed', String(game.marked.has(value)));
}

function refreshMarks() {
  app.querySelectorAll('.bingo-cell[data-value]').forEach((cell) => {
    const on = game.marked.has(Number(cell.dataset.value));
    cell.classList.toggle('is-marked', on);
    cell.setAttribute('aria-pressed', String(on));
  });
}

function highlightLines(lines) {
  lines.flat().forEach(([col, row]) => {
    const cell = app.querySelector(`.bingo-cell[data-col="${col}"][data-row="${row}"]`);
    if (cell) cell.classList.add('is-win');
  });
}

// ---------- Calling ----------

function say(text) {
  if (!game.voice) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.85;
    window.speechSynthesis.speak(u);
  } catch (e) { /* speech not available */ }
}

function showCalls(announce) {
  const called = game.order.slice(0, game.count);
  const latest = called[called.length - 1];
  $('[data-ball]').textContent = latest ? `${letterFor(latest)} ${latest}` : '–';
  $('[data-count]').textContent = `${game.count} of 75 called`;

  const recent = $('[data-recent]');
  recent.replaceChildren();
  called.slice(-6, -1).reverse().forEach((n) => {
    const li = document.createElement('li');
    li.textContent = `${letterFor(n)} ${n}`;
    recent.appendChild(li);
  });

  if (game.autoMark) {
    const onCard = new Set(game.card.flat());
    called.forEach((n) => { if (onCard.has(n)) game.marked.add(n); });
    refreshMarks();
  }
  if (announce && latest) say(spoken(latest));
  if (game.count >= 75 && !game.over) gameMessage('All 75 numbers have been called.', 'hint');
}

function setCount(count, announce = true) {
  if (count === game.count) return;
  game.count = count;
  showCalls(announce);
}

// ---------- Solo ----------

function startSolo() {
  const seed = Math.floor(Math.random() * 4294967296);
  game.mode = 'solo';
  game.intervalMs = Number($('[data-speed]').value) * 1000;
  beginGame(callOrder(seed), makeCard(seed ^ 0x5bd1e995));
  $('[data-action="pause"]').hidden = false;
  $('[data-caller-label]').textContent = 'Current number';
  setCount(1);
  game.timer = setInterval(() => {
    if (!game.paused && !game.over && game.count < 75) setCount(game.count + 1);
  }, game.intervalMs);
}

// ---------- Shared start / end ----------

function beginGame(order, card) {
  stopTimers();
  game.order = order;
  game.card = card;
  game.count = 0;
  game.marked = new Set();
  game.paused = false;
  game.over = false;
  renderCard();
  gameMessage('');
  $('[data-action="pause"]').textContent = 'Pause';
  $('[data-action="bingo"]').disabled = false;
  show('game');
  showCalls(false);
  app.scrollIntoView({ block: 'start', behavior: 'smooth' });
}

function stopTimers() {
  clearInterval(game.timer);
  clearInterval(game.poll);
  game.timer = null;
  game.poll = null;
}

function finish(won) {
  game.over = true;
  stopTimers();
  $('[data-action="bingo"]').disabled = true;
  stats.played += 1;
  if (won) {
    stats.wins += 1;
    if (!stats.fastest || game.count < stats.fastest) stats.fastest = game.count;
  }
  saveProgress('bingo', stats);
  showStats();
}

function backToLobby() {
  stopTimers();
  try { window.speechSynthesis.cancel(); } catch (e) { /* no speech */ }
  try { sessionStorage.removeItem(ROOM_KEY); } catch (e) { /* storage blocked */ }
  game.room = null;
  show('lobby');
}

// ---------- Multiplayer ----------

async function api(path, method = 'GET', body) {
  const response = await fetch(`${API}${path}`, {
    ...fetchOptions,
    method,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = {};
  try { data = await response.json(); } catch (e) { /* empty body */ }
  return { ok: response.ok, status: response.status, data };
}

function applyRoom(room) {
  game.room = room;
  game.clockOffset = room.server_now_ms - Date.now();
  try { sessionStorage.setItem(ROOM_KEY, room.code); } catch (e) { /* storage blocked */ }
}

function serverNow() {
  return Date.now() + game.clockOffset;
}

function renderWaiting() {
  const room = game.room;
  $('[data-room-code]').textContent = room.code;
  const list = $('[data-players]');
  list.replaceChildren();
  room.players.forEach((name) => {
    const li = document.createElement('li');
    li.textContent = name;
    list.appendChild(li);
  });
  $('[data-action="start"]').hidden = !room.is_host;
  $('[data-waiting-note]').textContent = room.is_host
    ? 'Press Start when everyone is in. The first number is called 3 seconds later.'
    : 'Waiting for the host to start the game…';
  show('waiting');
}

function enterRoomGame() {
  const room = game.room;
  game.mode = 'room';
  beginGame(callOrder(room.seed), makeCard(room.me.card_seed));
  $('[data-action="pause"]').hidden = true; // one shared caller: nobody pauses it alone
  $('[data-caller-label]').textContent = `Game ${room.code} · current number`;
  setCount(ballsCalledAt(room.started_at_ms, serverNow(), room.interval_ms), false);
  game.timer = setInterval(() => {
    if (game.over) return;
    const count = ballsCalledAt(game.room.started_at_ms, serverNow(), game.room.interval_ms);
    if (count === 0) {
      $('[data-ball]').textContent = 'Get ready…';
    } else {
      setCount(count);
    }
  }, 250);
}

function checkWinner(room) {
  if (room.winner && !game.over) {
    gameMessage(`${room.winner.name} got BINGO after ${room.winner.ball} numbers. Thanks for playing!`, 'hint');
    finish(false);
  }
}

function startPolling() {
  clearInterval(game.poll);
  game.poll = setInterval(async () => {
    const { ok, data } = await api(`/rooms/${game.room.code}`).catch(() => ({ ok: false }));
    if (!ok) return;
    const wasStarted = game.room.started_at_ms != null;
    applyRoom(data);
    if (!wasStarted && data.started_at_ms != null) {
      enterRoomGame();
      startPolling();
      return;
    }
    if (data.started_at_ms == null) renderWaiting();
    else checkWinner(data);
  }, 2500);
}

async function openRoom(room) {
  applyRoom(room);
  if (room.started_at_ms == null) {
    renderWaiting();
  } else {
    enterRoomGame();
    checkWinner(room);
  }
  startPolling();
}

async function requireSignIn() {
  const response = await fetch(`${pythonURI}/api/id`, fetchOptions).catch(() => null);
  const signedIn = Boolean(response && response.ok);
  $('[data-signin-needed]').hidden = signedIn;
  return signedIn;
}

async function hostGame() {
  lobbyMessage('');
  if (!(await requireSignIn())) return;
  const interval = Number($('[data-speed]').value);
  const { ok, data } = await api('/rooms', 'POST', { interval_seconds: interval }).catch(() => ({ ok: false, data: {} }));
  if (!ok) { lobbyMessage(data.message || 'We could not start a game. Please try again.', 'error'); return; }
  openRoom(data);
}

async function joinGame(code) {
  lobbyMessage('');
  if (!/^\d{4}$/.test(code)) { lobbyMessage('The game number is 4 digits, like 4821.', 'error'); return; }
  if (!(await requireSignIn())) return;
  const { ok, data } = await api(`/rooms/${code}/join`, 'POST').catch(() => ({ ok: false, data: {} }));
  if (!ok) { lobbyMessage(data.message || 'We could not join that game.', 'error'); return; }
  openRoom(data);
}

async function claimBingo() {
  if (game.mode === 'solo') {
    const lines = winningLines(game.card, calledSet());
    if (lines.length) {
      highlightLines(lines);
      gameMessage(`BINGO! You won after ${game.count} numbers.`, 'ok');
      say('Bingo! You won!');
      finish(true);
    } else {
      gameMessage('Not a Bingo yet. You need a full row, column, or diagonal. Keep playing!', 'hint');
    }
    return;
  }
  const { ok, data } = await api(`/rooms/${game.room.code}/claim`, 'POST').catch(() => ({ ok: false, data: {} }));
  if (!ok) { gameMessage('We could not reach the game. Please try again.', 'bad'); return; }
  if (data.valid) {
    highlightLines(winningLines(game.card, calledSet()));
    gameMessage(`BINGO! You won after ${data.room.winner.ball} numbers.`, 'ok');
    say('Bingo! You won!');
    finish(true);
  } else {
    gameMessage(data.message, 'hint');
    if (data.room) checkWinner(data.room);
  }
}

// ---------- Buttons ----------

app.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const action = button.dataset.action;

  if (action === 'solo') startSolo();
  if (action === 'host') hostGame();
  if (action === 'show-join') {
    const form = $('[data-join-form]');
    form.hidden = false;
    form.querySelector('input').focus();
  }
  if (action === 'start') {
    api(`/rooms/${game.room.code}/start`, 'POST').then(({ ok, data }) => {
      if (ok) { applyRoom(data); enterRoomGame(); startPolling(); }
    });
  }
  if (action === 'leave' || action === 'quit') backToLobby();
  if (action === 'bingo') claimBingo();
  if (action === 'pause') {
    game.paused = !game.paused;
    button.textContent = game.paused ? 'Resume' : 'Pause';
    gameMessage(game.paused ? 'Paused. Press Resume when you are ready.' : '', 'hint');
  }
  if (action === 'voice') {
    game.voice = !game.voice;
    button.textContent = `Voice: ${game.voice ? 'On' : 'Off'}`;
    button.setAttribute('aria-pressed', String(game.voice));
    if (!game.voice) { try { window.speechSynthesis.cancel(); } catch (e) { /* no speech */ } }
  }
  if (action === 'automark') {
    game.autoMark = !game.autoMark;
    button.textContent = `Auto-mark: ${game.autoMark ? 'On' : 'Off'}`;
    button.setAttribute('aria-pressed', String(game.autoMark));
    if (game.autoMark) showCalls(false);
  }
});

$('[data-join-form]').addEventListener('submit', (event) => {
  event.preventDefault();
  joinGame($('#bingo-code').value.trim());
});

// ---------- Start up ----------

if (!game.voice) {
  const voiceButton = $('[data-action="voice"]');
  voiceButton.textContent = 'Voice: Not available';
  voiceButton.disabled = true;
}

(async () => {
  const saved = await loadProgress('bingo');
  if (saved && typeof saved.played === 'number') stats = { ...stats, ...saved };
  showStats();

  // Reconnect: if this tab was in a friends game, go straight back to it.
  let code = null;
  try { code = sessionStorage.getItem(ROOM_KEY); } catch (e) { /* storage blocked */ }
  if (code) {
    const { ok, data } = await api(`/rooms/${code}`).catch(() => ({ ok: false }));
    if (ok && data.me) openRoom(data);
    else backToLobby();
  }
})();
