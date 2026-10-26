// Spot the Scam: the game screen.
import { SCENARIOS, SCAM_TYPES } from './scenarios.js';
import { createState, pickNext, recordResult, weakSpots } from './scheduler.js';
import { loadProgress, saveProgress } from '../progress.js';

const GAME = 'scam-trainer';
const root = document.getElementById('scam-game');

let state = createState();
let current = null;
let lastId = null;
let realOnLeft = true;
let choseCorrectly = false;
let wrongTaps = 0;

const el = (tag, cls, text) => {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text != null) node.textContent = text;
  return node;
};

function messageCard(message, label, channel) {
  const card = el('article', 'msg-card');
  card.appendChild(el('p', 'msg-label', label));
  card.appendChild(el('p', 'msg-channel', channel));
  const from = el('p', 'msg-from');
  from.appendChild(el('strong', null, 'From: '));
  from.appendChild(document.createTextNode(message.from));
  card.appendChild(from);
  const body = el('p', 'msg-body');
  message.parts.forEach((part) => body.appendChild(el('span', 'msg-part', part.t)));
  card.appendChild(body);
  return card;
}

function updateScoreboard() {
  const typeStats = Object.values(state.types);
  const caught = typeStats.reduce((n, t) => n + t.caught, 0);
  root.querySelector('[data-rounds]').textContent = state.round;
  root.querySelector('[data-caught]').textContent = caught;

  const weak = weakSpots(state);
  const weakBox = root.querySelector('[data-weak]');
  weakBox.textContent = weak.length
    ? `Practicing more: ${weak.map((t) => SCAM_TYPES[t]).join(', ')}`
    : 'Keep going. Scams you miss will come back for more practice.';
}

function setPrompt(text) {
  const prompt = root.querySelector('[data-prompt]');
  prompt.textContent = text;
}

function newRound(moveFocus = true) {
  current = pickNext(state, SCENARIOS, Math.random, lastId);
  lastId = current.id;
  realOnLeft = Math.random() < 0.5;
  choseCorrectly = false;
  wrongTaps = 0;

  const stage = root.querySelector('[data-stage]');
  stage.replaceChildren();
  root.querySelector('[data-feedback]').replaceChildren();
  setPrompt('Read both messages. Which one would you trust?');

  const pair = el('div', 'msg-pair');
  const order = realOnLeft ? ['real', 'scam'] : ['scam', 'real'];
  order.forEach((which, i) => {
    const wrap = el('div', 'msg-col');
    const card = messageCard(current[which], `Message ${i === 0 ? 'A' : 'B'}`, current.channel);
    card.dataset.which = which;
    wrap.appendChild(card);
    const choose = el('button', 'btn btn-primary btn-lg msg-choose', `I trust Message ${i === 0 ? 'A' : 'B'}`);
    choose.type = 'button';
    choose.addEventListener('click', () => chooseTrusted(which));
    wrap.appendChild(choose);
    pair.appendChild(wrap);
  });
  stage.appendChild(pair);
  if (moveFocus) {
    root.scrollIntoView({ block: 'start', behavior: 'smooth' });
    stage.querySelector('.msg-choose').focus({ preventScroll: true });
  }
}

function chooseTrusted(which) {
  choseCorrectly = which === 'real';
  root.querySelectorAll('.msg-choose').forEach((b) => b.remove());

  const scamCard = root.querySelector('.msg-card[data-which="scam"]');
  const realCard = root.querySelector('.msg-card[data-which="real"]');
  realCard.classList.add('is-real');
  scamCard.classList.add('is-scam');
  realCard.appendChild(el('p', 'msg-verdict ok', 'This one is real.'));
  scamCard.appendChild(el('p', 'msg-verdict bad', 'This one is a scam.'));

  const feedback = root.querySelector('[data-feedback]');
  feedback.replaceChildren(
    el('p', `result ${choseCorrectly ? 'ok' : 'bad'}`,
      choseCorrectly ? 'Good eye! You trusted the real message.' : 'Careful: that one was the scam.'),
  );

  setPrompt('Now tap the part of the scam message that gives it away.');
  scamCard.querySelectorAll('.msg-part').forEach((span, index) => {
    const part = current.scam.parts[index];
    const button = el('button', 'msg-part msg-part-btn', part.t);
    button.type = 'button';
    button.addEventListener('click', () => tapPart(button, part));
    span.replaceWith(button);
  });
  scamCard.querySelector('.msg-part-btn').focus();
}

function revealFlags() {
  root.querySelectorAll('.msg-card.is-scam .msg-part-btn').forEach((button, index) => {
    button.disabled = true;
    if (current.scam.parts[index].flag) button.classList.add('is-flag');
  });
}

function tapPart(button, part) {
  const feedback = root.querySelector('[data-feedback]');
  if (!part.flag) {
    wrongTaps += 1;
    button.classList.add('is-wrong');
    button.disabled = true;
    if (wrongTaps < 2) {
      feedback.appendChild(el('p', 'result hint', 'That part looks normal. Look again.'));
      return;
    }
  }
  revealFlags();
  finishRound(part.flag && wrongTaps === 0);
}

function finishRound(foundFlag) {
  const caught = choseCorrectly && foundFlag;
  recordResult(state, current.type, caught);
  saveProgress(GAME, state);
  updateScoreboard();

  const feedback = root.querySelector('[data-feedback]');
  feedback.replaceChildren();
  const box = el('div', 'callout lesson');
  box.appendChild(el('p', 'lesson-kicker', caught ? 'You caught it!' : 'This one will come back for practice.'));
  box.appendChild(el('h3', null, `Red flag: ${SCAM_TYPES[current.type]}`));
  box.appendChild(el('p', null, current.explain));
  feedback.appendChild(box);

  setPrompt('The highlighted parts are the red flags.');
  const next = el('button', 'btn btn-primary btn-lg', 'Next Message');
  next.type = 'button';
  next.addEventListener('click', newRound);
  feedback.appendChild(next);
  next.focus();
}

root.querySelector('[data-reset]').addEventListener('click', () => {
  state = createState();
  saveProgress(GAME, state);
  updateScoreboard();
  newRound();
});

(async () => {
  const saved = await loadProgress(GAME);
  if (saved && typeof saved.round === 'number' && saved.types) state = saved;
  updateScoreboard();
  newRound(false);
})();
