// Friends of Poway Seniors: shared page behavior (loaded by _includes/fops/header.html).
import { baseurl } from '../api/config.js';
import { currentMember } from './account.js';

// ---- Text size (saved between visits) ----
// Sets --fops-size, which .fops-site uses as its base font size.
const SIZE_KEY = 'fops-text-size';
const SIZES = { normal: '20px', large: '23px', xlarge: '26px' };
const sizeButtons = document.querySelectorAll('[data-size]');

function applySize(size) {
  document.documentElement.style.setProperty('--fops-size', SIZES[size] || SIZES.normal);
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

// ---- Show who is signed in on the Login button ----
const authLink = document.querySelector('[data-auth-link]');
if (authLink) {
  currentMember().then((member) => {
    if (!member || !member.name) return; // not signed in: keep "Login"
    authLink.textContent = `Hi, ${String(member.name).split(' ')[0]}`;
    authLink.setAttribute('href', `${baseurl}/signin/#account`);
  });
}
