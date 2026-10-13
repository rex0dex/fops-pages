// Size It Up: resize a place until it matches its real size next to a reference.
import { geoAzimuthalEqualArea, geoPath } from 'https://cdn.jsdelivr.net/npm/d3-geo@3.1.1/+esm';
import { feature } from 'https://cdn.jsdelivr.net/npm/topojson-client@3.1.0/+esm';
import { buildPlaces } from './places.js';
import { accuracy, chooseReference, startingAreaFactor, botGuess, roundWinner, formatArea } from './rules.js';
import { loadProgress, saveProgress } from '../progress.js';

const WORLD_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-50m.json';
const STATES_URL = 'https://cdn.jsdelivr.net/npm/us-atlas@3.0.1/states-10m.json';
const ROUNDS = 5;
const SECONDS = 30;
const W = 1000;
const H = 520;
const FLOOR = 470;            // y of the ground line shapes sit on
const BOX = { w: 400, h: 380 }; // space each shape may fill at the starting scale
const SVG_NS = 'http://www.w3.org/2000/svg';

const app = document.getElementById('geo-app');
const $ = (sel) => app.querySelector(sel);

let places = [];
let stats = { played: 0, wins: 0, bestAccuracy: 0 };
let game = null;

// ---------- Drawing ----------

// Projection centered on the place, so its shape is not stretched and its
// on-screen area is exactly proportional to its real area (equal-area).
function projectionFor(place, scale) {
  return geoAzimuthalEqualArea()
    .rotate([-place.center[0], -place.center[1]])
    .scale(scale)
    .translate([0, 0]);
}

function shapeSize(place, scale) {
  const [[x0, y0], [x1, y1]] = geoPath(projectionFor(place, scale)).bounds(place.shape);
  return { w: x1 - x0, h: y1 - y0, x0, y0, x1, y1 };
}

// Draw a place so its bottom-center sits at (cx, FLOOR).
function drawShape(svg, place, scale, cx, cls) {
  const b = shapeSize(place, scale);
  const proj = projectionFor(place, scale).translate([cx - (b.x0 + b.x1) / 2, FLOOR - b.y1]);
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', geoPath(proj)(place.shape));
  path.setAttribute('class', cls);
  svg.appendChild(path);
  return { top: FLOOR - b.h, right: cx + b.w / 2, left: cx - b.w / 2 };
}

function el(tag, attrs = {}, text) {
  const node = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
  if (text != null) node.textContent = text;
  return node;
}

// A scale (pixels per unit of the projection) at which a place's real size
// fits in the box.
function fitScale(place) {
  const s = shapeSize(place, 100);
  return 100 * Math.min(BOX.w / s.w, BOX.h / s.h);
}

// ---------- Screens ----------

function show(screen) {
  app.querySelectorAll('[data-screen]').forEach((s) => { s.hidden = s.dataset.screen !== screen; });
}

function playerNames() {
  return game.mode === 'friend' ? ['Player 1', 'Player 2'] : ['You', `Bot (${game.mode})`];
}

function updateScore() {
  const [a, b] = playerNames();
  $('[data-score]').textContent = `${a} ${game.wins[0]} · ${b} ${game.wins[1]}`;
  $('[data-round]').textContent = `Round ${game.round + 1} of ${ROUNDS}`;
}

// ---------- A round ----------

function newRound() {
  const pool = places.filter((p) => game.region === 'both' || (game.region === 'world' ? p.kind === 'country' : p.kind === 'US state'));
  let target;
  do { target = pool[Math.floor(Math.random() * pool.length)]; } while (game.used.has(target.name) && game.used.size < pool.length);
  game.used.add(target.name);
  const reference = chooseReference(target, pool);

  // One scale for both shapes, so they are drawn in true proportion. It is
  // picked so both real sizes fit, with some random slack so the scale itself
  // gives nothing away.
  const scale = Math.min(fitScale(reference), fitScale(target)) * (0.7 + Math.random() * 0.25);
  game.current = { target, reference, scale, start: startingAreaFactor(), guesses: [] };
  game.turn = 0;
  startTurn();
}

function startTurn() {
  const c = game.current;
  game.areaFactor = c.start; // every player starts from the same wrong size
  const [a, b] = playerNames();
  $('[data-who]').textContent = game.mode === 'friend' ? `${game.turn === 0 ? a : b}'s turn` : 'Your turn';
  $('[data-target-name]').textContent = c.target.name;
  $('[data-instructions]').textContent = `Make ${c.target.name} the right size compared with ${c.reference.name}.`;
  updateScore();
  renderBoard();
  show('play');
  startTimer();
}

function renderBoard() {
  const c = game.current;
  const svg = $('[data-board]');
  svg.replaceChildren();
  svg.appendChild(el('line', { x1: 30, y1: FLOOR, x2: W - 30, y2: FLOOR, class: 'geo-floor' }));
  drawShape(svg, c.reference, c.scale, 260, 'geo-ref');
  const linear = Math.sqrt(game.areaFactor);
  const box = drawShape(svg, c.target, c.scale * linear, 720, 'geo-target');
  svg.appendChild(el('text', { x: 260, y: FLOOR + 32, class: 'geo-label' }, c.reference.name));
  svg.appendChild(el('text', { x: 260, y: FLOOR + 50, class: 'geo-sub' }, `Reference ${c.reference.kind}, to scale`));
  svg.appendChild(el('text', { x: 720, y: FLOOR + 32, class: 'geo-label geo-label--target' }, c.target.name));
  svg.appendChild(el('text', { x: 720, y: FLOOR + 50, class: 'geo-sub' }, 'Resize me'));

  // Resize handle at the target's top-right corner.
  const hx = Math.min(W - 24, Math.max(box.right, 740));
  const hy = Math.max(24, Math.min(box.top, FLOOR - 30));
  const handle = el('g', { class: 'geo-handle', tabindex: 0, role: 'slider', 'aria-label': `Resize ${c.target.name}` });
  handle.appendChild(el('rect', { x: hx - 22, y: hy - 22, width: 44, height: 44, rx: 10 }));
  handle.appendChild(el('text', { x: hx, y: hy + 7 }, '↗'));
  svg.appendChild(handle);
  game.anchor = { x: 720, y: FLOOR };
  handle.addEventListener('pointerdown', startDrag);
}

function svgPoint(evt) {
  const svg = $('[data-board]');
  const r = svg.getBoundingClientRect();
  return { x: ((evt.clientX - r.left) / r.width) * W, y: ((evt.clientY - r.top) / r.height) * H };
}

function startDrag(evt) {
  evt.preventDefault();
  const p0 = svgPoint(evt);
  const d0 = Math.hypot(p0.x - game.anchor.x, p0.y - game.anchor.y) || 1;
  const f0 = game.areaFactor;
  const move = (e) => {
    const p = svgPoint(e);
    const d = Math.max(4, Math.hypot(p.x - game.anchor.x, p.y - game.anchor.y));
    setAreaFactor(f0 * (d / d0) ** 2);
  };
  const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
}

function setAreaFactor(f) {
  game.areaFactor = Math.min(1e4, Math.max(1e-4, f));
  renderBoard();
}

function startTimer() {
  clearInterval(game.timer);
  game.timeLeft = SECONDS;
  $('[data-timer]').textContent = `${game.timeLeft}s`;
  game.timer = setInterval(() => {
    game.timeLeft -= 1;
    $('[data-timer]').textContent = `${Math.max(0, game.timeLeft)}s`;
    if (game.timeLeft <= 0) submitGuess();
  }, 1000);
}

function submitGuess() {
  clearInterval(game.timer);
  const c = game.current;
  c.guesses.push(c.target.area * game.areaFactor);
  if (game.mode === 'friend' && game.turn === 0) {
    game.turn = 1;
    show('pass');
    $('[data-pass-ready]').focus();
    return;
  }
  if (game.mode !== 'friend') c.guesses.push(botGuess(c.target.area, game.mode));
  reveal();
}

// ---------- Reveal ----------

function reveal() {
  const c = game.current;
  const actual = c.target.area;
  const accs = c.guesses.map((g) => accuracy(g, actual));
  const winner = roundWinner(accs[0], accs[1]);
  if (winner === 'a') game.wins[0] += 1;
  if (winner === 'b') game.wins[1] += 1;
  game.history.push(accs[0]);
  const [a, b] = playerNames();

  const svg = $('[data-reveal]');
  svg.replaceChildren();
  svg.appendChild(el('line', { x1: 30, y1: FLOOR, x2: W - 30, y2: FLOOR, class: 'geo-floor' }));
  const items = [
    { area: c.guesses[0], cls: 'geo-guess-a', label: `${a}: ${accs[0].toFixed(1)}%`, sub: `${formatArea(c.guesses[0])} guess` },
    { area: actual, cls: 'geo-actual', label: 'Actual', sub: `${formatArea(actual)} land area` },
    { area: c.guesses[1], cls: 'geo-guess-b', label: `${b}: ${accs[1].toFixed(1)}%`, sub: `${formatArea(c.guesses[1])} guess` },
  ];
  // One scale for all three, so the biggest of them still fits its third of
  // the board (about 300 px wide instead of the 400 px box).
  const biggest = Math.max(...items.map((i) => i.area)) / actual;
  const s = fitScale(c.target) * 0.64 / Math.sqrt(Math.max(1, biggest));
  [170, 500, 830].forEach((cx, i) => {
    drawShape(svg, c.target, s * Math.sqrt(items[i].area / actual), cx, items[i].cls);
    svg.appendChild(el('text', { x: cx, y: FLOOR + 30, class: 'geo-label' }, items[i].label));
    svg.appendChild(el('text', { x: cx, y: FLOOR + 48, class: 'geo-sub' }, items[i].sub));
  });

  $('[data-reveal-title]').textContent = winner === 'tie' ? 'A tie!' : `${winner === 'a' ? a : b} wins this round`;
  $('[data-reveal-note]').textContent = `${c.target.name} is about ${formatArea(actual)}. The reference, ${c.reference.name}, is about ${formatArea(c.reference.area)}.`;
  game.round += 1;
  $('[data-next]').textContent = game.round >= ROUNDS ? 'See Final Score' : 'Next Round';
  updateScore();
  show('reveal');
  $('[data-next]').focus();
}

function finish() {
  const [a, b] = playerNames();
  const [w0, w1] = game.wins;
  const title = w0 === w1 ? "It's a tie!" : `${w0 > w1 ? a : b} wins the game!`;
  const avg = game.history.reduce((x, y) => x + y, 0) / game.history.length;
  $('[data-final-title]').textContent = title;
  $('[data-final-score]').textContent = `${a} ${w0} · ${b} ${w1}`;
  $('[data-final-note]').textContent = `${game.mode === 'friend' ? "Player 1's" : 'Your'} average accuracy: ${avg.toFixed(1)}%`;

  stats.played += 1;
  if (game.mode !== 'friend' && w0 > w1) stats.wins += 1;
  stats.bestAccuracy = Math.max(stats.bestAccuracy, Math.round(Math.max(...game.history) * 10) / 10);
  saveProgress('geography', stats);
  showStats();
  show('final');
}

function showStats() {
  $('[data-stats]').textContent = stats.played
    ? `Games played: ${stats.played} · Wins against the bot: ${stats.wins} · Best round: ${stats.bestAccuracy}%`
    : '';
}

// ---------- Start ----------

function startGame() {
  game = {
    mode: $('[data-mode]').value,
    region: $('[data-region]').value,
    round: 0,
    wins: [0, 0],
    history: [],
    used: new Set(),
  };
  newRound();
  app.scrollIntoView({ block: 'start', behavior: 'smooth' });
}

app.addEventListener('click', (event) => {
  const b = event.target.closest('[data-action]');
  if (!b) return;
  const action = b.dataset.action;
  if (action === 'start') startGame();
  if (action === 'smaller') setAreaFactor(game.areaFactor * 0.8);
  if (action === 'bigger') setAreaFactor(game.areaFactor * 1.25);
  if (action === 'div10') setAreaFactor(game.areaFactor / 10);
  if (action === 'times10') setAreaFactor(game.areaFactor * 10);
  if (action === 'submit') submitGuess();
  if (action === 'pass-ready') startTurn();
  if (action === 'next') { if (game.round >= ROUNDS) finish(); else newRound(); }
  if (action === 'menu') { clearInterval(game && game.timer); show('start'); }
});

// Arrow keys resize too.
document.addEventListener('keydown', (e) => {
  if (!game || $('[data-screen="play"]').hidden) return;
  if (e.key === 'ArrowUp' || e.key === 'ArrowRight') { e.preventDefault(); setAreaFactor(game.areaFactor * 1.1); }
  if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') { e.preventDefault(); setAreaFactor(game.areaFactor / 1.1); }
});

(async () => {
  try {
    const [world, states] = await Promise.all([fetch(WORLD_URL).then((r) => r.json()), fetch(STATES_URL).then((r) => r.json())]);
    places = buildPlaces(feature(world, world.objects.countries).features, feature(states, states.objects.states).features);
    $('[data-loading]').hidden = true;
    $('[data-action="start"]').disabled = false;
    $('[data-place-count]').textContent = `${places.length} real places`;
  } catch (e) {
    $('[data-loading]').textContent = 'The maps could not load. Please check your internet connection and refresh.';
  }
  const saved = await loadProgress('geography');
  if (saved && typeof saved.played === 'number') stats = { ...stats, ...saved };
  showStats();
})();
