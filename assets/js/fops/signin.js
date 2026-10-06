// Sign in, create an account, and sign out against the fops-flask backend.
import { pythonURI, fetchOptions } from '../api/config.js';

const account = document.getElementById('account');
const forms = document.getElementById('auth-forms');
const tabs = { signin: document.getElementById('tab-signin'), create: document.getElementById('tab-create') };
const panels = { signin: document.getElementById('panel-signin'), create: document.getElementById('panel-create') };

function showTab(name) {
  Object.keys(tabs).forEach((key) => {
    const active = key === name;
    tabs[key].setAttribute('aria-selected', String(active));
    panels[key].hidden = !active;
  });
  panels[name].querySelector('input').focus();
}
tabs.signin.addEventListener('click', () => showTab('signin'));
tabs.create.addEventListener('click', () => showTab('create'));

function say(form, text, kind) {
  const box = form.querySelector('.form-message');
  box.textContent = text;
  box.className = `form-message ${kind || ''}`;
}

async function readMessage(response, fallback) {
  try {
    const data = await response.json();
    return data.message || fallback;
  } catch (e) {
    return fallback;
  }
}

async function showAccount() {
  try {
    const response = await fetch(`${pythonURI}/api/id`, fetchOptions);
    if (!response.ok) return false;
    const user = await response.json();
    account.querySelector('[data-account-name]').textContent = user.name;
    account.hidden = false;
    forms.hidden = true;
    return true;
  } catch (e) {
    return false;
  }
}

async function signIn(uid, password) {
  return fetch(`${pythonURI}/api/authenticate`, {
    ...fetchOptions,
    method: 'POST',
    body: JSON.stringify({ uid, password }),
  });
}

panels.signin.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const uid = form.username.value.trim();
  const password = form.password.value;
  if (!uid || !password) {
    say(form, 'Please enter your username and password.', 'error');
    return;
  }
  say(form, 'Signing in…');
  try {
    const response = await signIn(uid, password);
    if (!response.ok) {
      say(form, 'That username and password did not match. Please try again.', 'error');
      return;
    }
    say(form, 'Signed in.', 'ok');
    await showAccount();
  } catch (e) {
    say(form, 'We could not reach the server. Please try again in a moment.', 'error');
  }
});

panels.create.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const name = form.name.value.trim();
  const uid = form.username.value.trim();
  const password = form.password.value;
  if (name.length < 2) return say(form, 'Please enter your name.', 'error');
  if (uid.length < 2) return say(form, 'Your username needs at least 2 characters.', 'error');
  if (password.length < 8) return say(form, 'Your password needs at least 8 characters.', 'error');

  say(form, 'Creating your account…');
  try {
    const created = await fetch(`${pythonURI}/api/user`, {
      ...fetchOptions,
      method: 'POST',
      body: JSON.stringify({ name, uid, password }),
    });
    if (!created.ok) {
      say(form, await readMessage(created, 'We could not create that account.'), 'error');
      return;
    }
    const signedIn = await signIn(uid, password);
    if (!signedIn.ok) {
      say(form, 'Your account was created. Please sign in.', 'ok');
      showTab('signin');
      return;
    }
    await showAccount();
  } catch (e) {
    say(form, 'We could not reach the server. Please try again in a moment.', 'error');
  }
});

document.getElementById('signout-button').addEventListener('click', async () => {
  try {
    await fetch(`${pythonURI}/api/authenticate`, { ...fetchOptions, method: 'DELETE' });
  } catch (e) { /* signed out locally either way */ }
  window.location.reload();
});

showAccount();
