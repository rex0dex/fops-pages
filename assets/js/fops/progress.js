// Save and load game progress.
// Progress is always kept in this browser. When the player is signed in,
// it is also saved to their account on the fops-flask backend, so it follows
// them to another computer.
import { pythonURI, fetchOptions } from '../api/config.js';

const localKey = (game) => `fops-progress-${game}`;

function readLocal(game) {
  try {
    const raw = localStorage.getItem(localKey(game));
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function writeLocal(game, data) {
  try { localStorage.setItem(localKey(game), JSON.stringify(data)); } catch (e) { /* storage blocked */ }
}

export async function loadProgress(game) {
  try {
    const response = await fetch(`${pythonURI}/api/fops/progress/${encodeURIComponent(game)}`, fetchOptions);
    if (response.ok) {
      const body = await response.json();
      if (body && body.data) {
        writeLocal(game, body.data);
        return body.data;
      }
    }
  } catch (e) { /* offline or signed out: fall back to this browser */ }
  return readLocal(game);
}

export function saveProgress(game, data) {
  writeLocal(game, data);
  fetch(`${pythonURI}/api/fops/progress/${encodeURIComponent(game)}`, {
    ...fetchOptions,
    method: 'PUT',
    body: JSON.stringify({ data }),
  }).catch(() => { /* signed out or offline: the browser copy is enough */ });
}
