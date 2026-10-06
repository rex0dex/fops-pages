// Friends of Poway Seniors: shared page behavior.
import { pythonURI, fetchOptions } from '../api/config.js';

// ---- Text size (saved between visits) ----
const SIZE_KEY = 'fops-text-size';
const sizeButtons = document.querySelectorAll('.text-size-buttons button');

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
    const size = button.dataset.size;
    applySize(size);
    try { localStorage.setItem(SIZE_KEY, size); } catch (e) { /* storage blocked */ }
  });
});

// ---- Menu on small screens ----
const menuButton = document.querySelector('.menu-button');
const nav = document.getElementById('site-nav');
if (menuButton && nav) {
  menuButton.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(open));
  });
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
      }
    })
    .catch(() => { /* backend not reachable: keep "Sign In" */ });
}
