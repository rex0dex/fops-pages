// Bingo: solo play with a speaking caller.
import { LETTERS, FREE, callOrder, makeCard, winningLines, letterFor, spoken } from './engine.js';
import { loadProgress, saveProgress } from '../progress.js';

const app = document.getElementById('bingo-app');
const $ = (sel) => app.querySelector(sel);

const game = {
  order: [],           // calling order for this game
  card: null,
  count: 0,            // balls called so far
  marked: new Set(),   // numbers the player has marked
  autoMark: true,
  voice: 'speechSynthesis' in window,
  paused: false,
  over: false,
  timer: null,
  intervalMs: 10000,
};

let stats = { played: 0, wins: 0, fastest: null };

// ---------- Screens and messages ----------

function show(screen) {
  app.querySelectorAll('[data-screen]').forEach((s) => { s.hidden = s.dataset.screen !== screen; });
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

function callNext() {
  if (game.paused || game.over || game.count >= 75) return;
  game.count += 1;
  showCalls(true);
}

// ---------- Start and finish ----------

function startGame() {
  const seed = Math.floor(Math.random() * 4294967296);
  clearInterval(game.timer);
  Object.assign(game, {
    order: callOrder(seed),
    card: makeCard(seed ^ 0x5bd1e995),
    count: 0,
    marked: new Set(),
    paused: false,
    over: false,
    intervalMs: Number($('[data-speed]').value) * 1000,
  });
  renderCard();
  gameMessage('');
  $('[data-action="pause"]').textContent = 'Pause';
  $('[data-action="bingo"]').disabled = false;
  show('game');
  app.scrollIntoView({ block: 'start', behavior: 'smooth' });
  callNext();
  game.timer = setInterval(callNext, game.intervalMs);
}

function finish(won) {
  game.over = true;
  clearInterval(game.timer);
  $('[data-action="bingo"]').disabled = true;
  stats.played += 1;
  if (won) {
    stats.wins += 1;
    if (!stats.fastest || game.count < stats.fastest) stats.fastest = game.count;
  }
  saveProgress('bingo', stats);
  showStats();
}

function claimBingo() {
  const lines = winningLines(game.card, calledSet());
  if (lines.length) {
    highlightLines(lines);
    gameMessage(`BINGO! You won after ${game.count} numbers.`, 'ok');
    say('Bingo! You won!');
    finish(true);
  } else {
    gameMessage('Not a Bingo yet. You need a full row, column, or diagonal. Keep playing!', 'hint');
  }
}

// ---------- Buttons ----------

app.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const action = button.dataset.action;

  if (action === 'solo') startGame();
  if (action === 'bingo') claimBingo();
  if (action === 'quit') {
    clearInterval(game.timer);
    try { window.speechSynthesis.cancel(); } catch (e) { /* no speech */ }
    show('lobby');
  }
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
})();
