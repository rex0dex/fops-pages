// Head Nod exercise: the webcam counts 10 nods and says each number out loud.
// All video processing happens in this browser. No video is ever uploaded.
import { NodCounter, nodSignal } from './nod-counter.js';

const GOAL = 10;
const VISION = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.0';
const FACE_MODEL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

const app = document.getElementById('nod-app');
const $ = (sel) => app.querySelector(sel);
const video = $('[data-video]');

let landmarker = null;
let stream = null;
let counter = null;
let running = false;
let frame = null;
let lastVideoTime = -1;
let lastSeen = 0;
let startedAt = 0;

function show(screen) {
  app.querySelectorAll('[data-screen]').forEach((s) => { s.hidden = s.dataset.screen !== screen; });
}

function say(text) {
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  } catch (e) { /* speech not available */ }
}

function coach(text) { $('[data-coach]').textContent = text; }

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

async function start() {
  const message = $('[data-camera-message]');
  message.className = 'form-message';
  message.textContent = 'Starting the camera. This can take a few seconds…';

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false,
    });
  } catch (e) {
    message.className = 'form-message error';
    message.textContent = 'We could not use your camera. Check that it is plugged in, and choose "Allow" when the browser asks.';
    return;
  }

  try {
    await loadLandmarker();
  } catch (e) {
    stopCamera();
    message.className = 'form-message error';
    message.textContent = 'The exercise could not load. Please check your internet connection and try again.';
    return;
  }

  video.srcObject = stream;
  await video.play();

  counter = new NodCounter();
  running = true;
  lastSeen = performance.now();
  startedAt = performance.now();
  $('[data-count]').textContent = `0 of ${GOAL}`;
  coach('Sit comfortably and look at the screen. Getting ready…');
  show('session');
  frame = requestAnimationFrame(loop);
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
      const counted = counter.update(nodSignal(face));
      if (!wasReady && counter.calibrated) {
        coach('Slowly nod your chin down, then bring it back up.');
        say('Ready. Begin when you are ready.');
      }
      if (counted) {
        $('[data-count]').textContent = `${counter.count} of ${GOAL}`;
        say(String(counter.count));
        coach(counter.count % 2 ? 'Good. Nice and slow.' : 'Slowly nod your chin down, then bring it back up.');
        if (counter.count >= GOAL) { finish(true); return; }
      }
    } else if (now - lastSeen > 1200) {
      coach("We can't see your face. Sit back so the camera can see you.");
    }
    $('[data-meter]').style.width = `${Math.round(counter.progress() * 100)}%`;
  }
  frame = requestAnimationFrame(loop);
}

function stopCamera() {
  running = false;
  cancelAnimationFrame(frame);
  if (stream) stream.getTracks().forEach((t) => t.stop());
  stream = null;
  video.srcObject = null;
}

function finish(completed) {
  if (!running) return;
  stopCamera();
  const seconds = Math.round((performance.now() - startedAt) / 1000);
  $('[data-done-title]').textContent = completed ? 'Well done!' : 'Good effort. Every bit counts.';
  $('[data-summary]').textContent = `You did ${counter.count} of ${GOAL} nods in ${seconds} seconds.`;
  if (completed) say('Well done! You did all ten.');
  show('done');
}

app.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const action = button.dataset.action;
  if (action === 'camera' || action === 'again') { show('start'); start(); }
  if (action === 'stop') finish(false);
});

// Turn the camera off if the player leaves the page.
window.addEventListener('pagehide', stopCamera);
