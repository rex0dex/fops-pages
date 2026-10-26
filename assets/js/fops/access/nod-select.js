// Nod to select: play every game hands-free.
// A highlight moves from button to button in the game on the page, and a head nod
// presses the highlighted one. Made for members with arthritis or shaky hands, who
// find a mouse or small buttons hard to use. Nods are detected with the webcam by
// NodCounter (calibration, smoothing, two thresholds). All video stays in this browser.
import { NodCounter, nodSignal } from './nod-counter.js';

const VISION = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.0';
const FACE_MODEL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
const SPEED_KEY = 'fops-nod-speed';
const SPEEDS = { slow: 3500, medium: 2500, quick: 1700 };
const COOLDOWN = 900; // after a nod presses something, ignore nods briefly
const TARGETS = 'button, a[href], select, [role="button"]';

let landmarker = null;
let stream = null;
let counter = null;
let running = false;
let frame = null;
let lastVideoTime = -1;
let lastSeen = 0;
let panel = null;
let video = null;
let targets = [];
let index = -1;
let lastStep = 0;
let lastPress = 0;
let dwell = SPEEDS.medium;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function status(text) {
  if (panel) panel.querySelector('[data-nod-status]').textContent = text;
}

// The part of the page to scan: the game if there is one, otherwise the main content.
function scope() {
  return document.querySelector('[data-nod-scope]') || document.querySelector('main');
}

function visible(node) {
  if (node.disabled || node.closest('[hidden], [data-nod-skip]')) return false;
  const box = node.getBoundingClientRect();
  return box.width > 0 && box.height > 0;
}

// Everything a nod could press, in reading order. A game can narrow the list
// with data-nod-targets, for example Bingo scans its controls, not all 25 squares.
function collectTargets() {
  const root = scope();
  if (!root) return [];
  const selector = root.dataset.nodTargets || TARGETS;
  return [...root.querySelectorAll(selector)].filter(visible);
}

function clearHighlight() {
  document.querySelectorAll('.nod-target').forEach((node) => node.classList.remove('nod-target'));
}

function highlight(next) {
  clearHighlight();
  targets = collectTargets();
  if (!targets.length) { index = -1; status('Nothing to choose here yet.'); return; }
  index = ((next % targets.length) + targets.length) % targets.length;
  const target = targets[index];
  target.classList.add('nod-target');
  target.scrollIntoView({ block: 'center', behavior: 'smooth' });
  if (target.tagName === 'SELECT') {
    status(`Nod to change: ${target.options[target.selectedIndex].text}`);
  } else {
    const label = (target.getAttribute('aria-label') || target.textContent || '').trim().replace(/\s+/g, ' ');
    status(`Nod to choose: ${label.slice(0, 40) || 'this'}`);
  }
  lastStep = performance.now();
}

// A nod presses the highlighted control. A dropdown moves to its next choice.
function press() {
  const target = targets[index];
  if (!target || !target.isConnected) { highlight(0); return; }
  lastPress = performance.now();
  if (target.tagName === 'SELECT') {
    target.selectedIndex = (target.selectedIndex + 1) % target.options.length;
    target.dispatchEvent(new Event('change', { bubbles: true }));
    status(`Changed to: ${target.options[target.selectedIndex].text}`);
    return;
  }
  target.classList.add('nod-pressed');
  setTimeout(() => target.classList.remove('nod-pressed'), 400);
  target.click();
  // The game redraws after a press, so start again from its first control.
  setTimeout(() => highlight(0), 450);
}

async function loadLandmarker() {
  if (landmarker) return landmarker;
  const vision = await import(`${VISION}/vision_bundle.mjs`);
  const files = await vision.FilesetResolver.forVisionTasks(`${VISION}/wasm`);
  const build = (delegate) => vision.FaceLandmarker.createFromOptions(files, {
    baseOptions: { modelAssetPath: FACE_MODEL, delegate },
    runningMode: 'VIDEO',
    numFaces: 1,
  });
  try {
    landmarker = await build('GPU');
  } catch (e) {
    landmarker = await build('CPU');
  }
  return landmarker;
}

function loop() {
  if (!running) return;
  const now = performance.now();

  if (video.readyState >= 2 && video.currentTime !== lastVideoTime) {
    lastVideoTime = video.currentTime;
    const result = landmarker.detectForVideo(video, now);
    const face = result.faceLandmarks && result.faceLandmarks[0];

    if (face) {
      lastSeen = now;
      const wasReady = counter.calibrated;
      const nodded = counter.update(nodSignal(face));
      if (!wasReady && counter.calibrated) highlight(0);
      if (nodded && now - lastPress > COOLDOWN && index >= 0) press();
    } else if (now - lastSeen > 1500) {
      status("We can't see your face. Sit so the camera can see you.");
    }
    panel.querySelector('[data-nod-meter]').style.width = `${Math.round(counter.progress() * 100)}%`;
  }

  // Move the highlight on, but never in the middle of a nod.
  if (counter.calibrated && !counter.moving && now - lastStep > dwell && now - lastPress > COOLDOWN) {
    highlight(index + 1);
  }
  frame = requestAnimationFrame(loop);
}

function buildPanel(onOff) {
  panel = el('aside', 'nod-panel');
  panel.setAttribute('aria-label', 'Nod to select');
  panel.innerHTML = `
    <div class="nod-panel-head">
      <strong>Nod to select</strong>
      <button type="button" class="nod-off" data-nod-off>Turn off</button>
    </div>
    <video playsinline muted></video>
    <div class="nod-meter" aria-hidden="true"><div data-nod-meter></div></div>
    <p class="nod-status" data-nod-status role="status" aria-live="polite">Starting the camera…</p>
    <label class="nod-speed">Highlight speed
      <select data-nod-speed>
        <option value="slow">Slow</option>
        <option value="medium">Medium</option>
        <option value="quick">Quick</option>
      </select>
    </label>`;
  document.body.appendChild(panel);
  video = panel.querySelector('video');

  const speed = panel.querySelector('[data-nod-speed]');
  let saved = 'medium';
  try { saved = localStorage.getItem(SPEED_KEY) || 'medium'; } catch (e) { /* storage blocked */ }
  speed.value = SPEEDS[saved] ? saved : 'medium';
  dwell = SPEEDS[speed.value];
  speed.addEventListener('change', () => {
    dwell = SPEEDS[speed.value];
    try { localStorage.setItem(SPEED_KEY, speed.value); } catch (e) { /* storage blocked */ }
  });
  panel.querySelector('[data-nod-off]').addEventListener('click', onOff);
}

// Turn Nod to select on. Returns false if the camera or face model can't start.
export async function start(onOff) {
  if (running) return true;
  buildPanel(onOff);
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false,
    });
  } catch (e) {
    status('We could not use your camera. Check that it is plugged in, and choose "Allow" when the browser asks.');
    return false;
  }
  try {
    status('Getting ready. This can take a few seconds…');
    await loadLandmarker();
  } catch (e) {
    stop();
    return false;
  }
  video.srcObject = stream;
  await video.play();
  counter = new NodCounter();
  running = true;
  lastSeen = performance.now();
  status('Sit comfortably and hold still for a moment…');
  frame = requestAnimationFrame(loop);
  return true;
}

export function stop() {
  running = false;
  cancelAnimationFrame(frame);
  if (stream) stream.getTracks().forEach((t) => t.stop());
  stream = null;
  clearHighlight();
  index = -1;
  if (panel) panel.remove();
  panel = null;
}

// Turn the camera off if the member leaves the page.
window.addEventListener('pagehide', stop);
