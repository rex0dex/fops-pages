// Friends of Poway Seniors: shared page behavior.
import { pythonURI, fetchOptions } from '../api/config.js';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---- Text size (saved between visits) ----
const SIZE_KEY = 'fops-text-size';
const sizeButtons = document.querySelectorAll('.text-size button');

function applySize(size) {
  if (size === 'normal') {
    document.documentElement.removeAttribute('data-text-size');
  } else {
    document.documentElement.setAttribute('data-text-size', size);
  }
  sizeButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.size === size)));
}

let savedSize = 'normal';
try { savedSize = localStorage.getItem(SIZE_KEY) || 'normal'; } catch (e) { /* storage blocked */ }
applySize(savedSize);

sizeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    applySize(button.dataset.size);
    try { localStorage.setItem(SIZE_KEY, button.dataset.size); } catch (e) { /* storage blocked */ }
  });
});

// ---- Nod to select (hands-free play), remembered between pages ----
// The camera code only loads once a member turns it on.
const NOD_KEY = 'fops-nod-select';
const nodButtons = document.querySelectorAll('[data-nod-toggle]');
let nodModule = null;

function showNod(on) {
  nodButtons.forEach((b) => b.setAttribute('aria-pressed', String(on)));
  try { localStorage.setItem(NOD_KEY, on ? 'on' : 'off'); } catch (e) { /* storage blocked */ }
}

async function setNod(on) {
  showNod(on);
  if (!on) { nodModule?.stop(); return; }
  nodModule = nodModule || await import('./access/nod-select.js');
  const started = await nodModule.start(() => setNod(false));
  if (!started) nodButtons.forEach((b) => b.setAttribute('aria-pressed', 'false'));
}

nodButtons.forEach((button) => {
  button.addEventListener('click', () => setNod(button.getAttribute('aria-pressed') !== 'true'));
});
try { if (localStorage.getItem(NOD_KEY) === 'on') setNod(true); } catch (e) { /* storage blocked */ }

// ---- Menu on small screens, and the Play & Learn dropdown ----
const menuButton = document.querySelector('.menu-toggle');
const nav = document.getElementById('site-nav');
menuButton?.addEventListener('click', () => {
  const open = nav.classList.toggle('is-open');
  menuButton.setAttribute('aria-expanded', String(open));
});

document.querySelectorAll('.nav-drop > button').forEach((button) => {
  button.addEventListener('click', (event) => {
    event.stopPropagation();
    button.setAttribute('aria-expanded', String(button.getAttribute('aria-expanded') !== 'true'));
  });
});
document.addEventListener('click', () => {
  document.querySelectorAll('.nav-drop > button[aria-expanded="true"]').forEach((b) => b.setAttribute('aria-expanded', 'false'));
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') document.querySelectorAll('.nav-drop > button').forEach((b) => b.setAttribute('aria-expanded', 'false'));
});

// ---- Header line once the page scrolls ----
const header = document.querySelector('.site-header');
const onScroll = () => header?.classList.toggle('is-scrolled', window.scrollY > 8);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ---- Sections fade in as they come into view; stats count up ----
function countUp(el) {
  const target = Number(el.dataset.count);
  const suffix = el.dataset.suffix || '';
  if (reduceMotion) { el.textContent = target + suffix; return; }
  const start = performance.now();
  const tick = (now) => {
    const t = Math.min(1, (now - start) / 1200);
    el.textContent = Math.round(target * (1 - (1 - t) ** 3)) + suffix;
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// Checked on scroll and resize, so nothing stays hidden if the page jumps or zooms.
let waiting = [...document.querySelectorAll('.reveal, [data-count]')];
function revealVisible() {
  const edge = window.innerHeight * 0.92;
  waiting = waiting.filter((el) => {
    if (el.getBoundingClientRect().top > edge) return true;
    el.classList.add('is-in');
    if (el.dataset.count) countUp(el);
    return false;
  });
  if (!waiting.length) {
    window.removeEventListener('scroll', revealVisible);
    window.removeEventListener('resize', revealVisible);
  }
}
window.addEventListener('scroll', revealVisible, { passive: true });
window.addEventListener('resize', revealVisible);
revealVisible();

// ---- Home hero: Bingo balls drifting slowly upward ----
const canvas = document.querySelector('[data-hero-canvas]');
if (canvas && !reduceMotion) {
  const ctx = canvas.getContext('2d');
  const colors = ['#5e7a6b', '#c9973f', '#b5573b'];
  let balls = [];
  let width = 0;
  let height = 0;

  const resize = () => {
    const ratio = window.devicePixelRatio || 1;
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const count = Math.round(Math.min(26, width / 45));
    balls = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 10 + Math.random() * 16,
      speed: 0.12 + Math.random() * 0.25,
      drift: Math.random() * Math.PI * 2,
      n: 1 + Math.floor(Math.random() * 75),
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
  };

  const draw = () => {
    ctx.clearRect(0, 0, width, height);
    balls.forEach((b) => {
      b.y -= b.speed;
      b.drift += 0.004;
      if (b.y < -b.r * 2) { b.y = height + b.r * 2; b.x = Math.random() * width; }
      const x = b.x + Math.sin(b.drift) * 12;
      ctx.globalAlpha = 0.13;
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = b.color;
      ctx.font = `600 ${Math.round(b.r * 0.85)}px Fraunces, Georgia, serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(b.n), x, b.y + 1);
    });
    requestAnimationFrame(draw);
  };

  resize();
  window.addEventListener('resize', resize);
  requestAnimationFrame(draw);
}

// ---- Show who is signed in ----
const authLink = document.querySelector('[data-auth-link]');
if (authLink) {
  fetch(`${pythonURI}/api/id`, fetchOptions)
    .then((response) => (response.ok ? response.json() : null))
    .then((user) => {
      if (user && user.name) {
        const first = String(user.name).split(' ')[0];
        authLink.textContent = `Hi, ${first}`;
        authLink.setAttribute('href', authLink.getAttribute('href') + '#account');
        // The OCS bar shows who is signed in too, like OCS sites do.
        const ocsLogin = document.querySelector('[data-ocs-login]');
        if (ocsLogin) {
          ocsLogin.textContent = first;
          ocsLogin.setAttribute('href', authLink.getAttribute('href'));
        }
      }
    })
    .catch(() => { /* backend not reachable: keep "Sign In" */ });
}
