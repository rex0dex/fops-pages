// Movement games: webcam exercises scored in the browser.
// All video processing happens here, on the player's computer. No frames are
// ever uploaded; only the finished score is saved to their progress.
import { RepCounter, DwellTarget, nodSignal, turnSignal, nextTargetPosition, POSE } from './reps.js';
import { loadProgress, saveProgress } from '../progress.js';
import { getLandmarker, openCamera, closeCamera } from './tracker.js';

const GAMES = {
  nod: {
    name: 'Head Nod', model: 'face',
    coach: 'Slowly nod your chin down, then bring it back up.',
    // Thresholds in face-height units; scaled by the "How big" setting.
    counter: (size) => new RepCounter({ enter: 0.06 * size, exit: 0.025 * size }),
  },
  turn: {
    name: 'Head Turn', model: 'face',
    coach: 'Slowly turn your head to one side, then back to the middle.',
    counter: (size) => new RepCounter({ enter: 0.22 * size, exit: 0.09 * size }),
  },
  reach: { name: 'Reach and Tap', model: 'pose', coach: 'Reach a hand to the circle and hold it there.' },
};

const app = document.getElementById('move-app');
const $ = (sel) => app.querySelector(sel);
const video = $('[data-video]');
const canvas = $('[data-canvas]');
const ctx = canvas.getContext('2d');

let session = null;
let history = { sessions: [] };
let voice = 'speechSynthesis' in window;

// ---------- Helpers ----------

function show(screen) {
  app.querySelectorAll('[data-screen]').forEach((s) => { s.hidden = s.dataset.screen !== screen; });
}

function say(text) {
  if (!voice) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  } catch (e) { /* speech not available */ }
}

function coach(text) { $('[data-coach]').textContent = text; }

function showHistory() {
  const last = history.sessions[history.sessions.length - 1];
  $('[data-history]').textContent = last
    ? `Last time: ${GAMES[last.game].name}, ${last.reps} of ${last.goal}. Sessions so far: ${history.sessions.length}.`
    : '';
}

// ---------- Session ----------

function choose(gameKey) {
  session = {
    key: gameKey,
    game: GAMES[gameKey],
    goal: Number($('[data-goal]').value),
    size: Number($('[data-size]').value),
  };
  $('[data-camera-message]').textContent = '';
  show('privacy');
  $('[data-action="camera"]').focus();
}

async function startCamera() {
  const message = $('[data-camera-message]');
  message.className = 'form-message';
  message.textContent = 'Starting the camera and loading the exercise. This can take a few seconds…';

  try {
    session.stream = await openCamera(video);
  } catch (e) {
    message.className = 'form-message error';
    message.textContent = e.message;
    return;
  }

  try {
    session.landmarker = await getLandmarker(session.game.model);
  } catch (e) {
    stopCamera();
    message.className = 'form-message error';
    message.textContent = 'The exercise could not load. Please check your internet connection and try again.';
    return;
  }

  begin();
}

function begin() {
  Object.assign(session, {
    reps: 0,
    left: 0,
    right: 0,
    startedAt: performance.now(),
    lastSeen: performance.now(),
    counter: session.game.counter ? session.game.counter(session.size) : null,
    target: null,
    targetIndex: 0,
    peaks: [],
    running: true,
    lastVideoTime: -1,
  });
  $('[data-game-name]').textContent = session.game.name;
  updateCount();
  coach(session.counter ? 'Sit comfortably and look at the screen. Getting ready…' : session.game.coach);
  show('session');
  if (session.key === 'reach') placeTarget();
  session.frame = requestAnimationFrame(loop);
}

function updateCount() {
  let text = `${session.reps} of ${session.goal}`;
  if (session.key === 'turn') text += ` · left ${session.left}, right ${session.right}`;
  $('[data-count]').textContent = text;
}

function setMeter(fraction) {
  $('[data-meter]').style.width = `${Math.round(fraction * 100)}%`;
}

function placeTarget() {
  const radius = 0.09 / Math.max(0.7, session.size);
  session.target = new DwellTarget({ ...nextTargetPosition(session.targetIndex), radius });
  session.targetIndex += 1;
}

function countRep(peakFraction) {
  session.reps += 1;
  session.peaks.push(peakFraction);
  updateCount();
  say(String(session.reps));
  if (session.reps >= session.goal) finish(true);
}

function loop() {
  if (!session || !session.running) return;
  const now = performance.now();

  if (video.readyState >= 2 && video.currentTime !== session.lastVideoTime) {
    session.lastVideoTime = video.currentTime;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const result = session.landmarker.detectForVideo(video, now);
    if (session.game.model === 'face') handleFace(result, now);
    else handlePose(result, now);
  }
  session.frame = requestAnimationFrame(loop);
}

function lostSight(now, what) {
  if (now - session.lastSeen > 1200) coach(`We can't see your ${what}. Sit back so the camera can see you.`);
}

function handleFace(result, now) {
  const face = result.faceLandmarks && result.faceLandmarks[0];
  if (!face) { lostSight(now, 'face'); return; }
  session.lastSeen = now;

  const wasCalibrated = session.counter.calibrated;
  const value = session.key === 'nod' ? nodSignal(face) : turnSignal(face);
  const rep = session.counter.update(value);
  if (!wasCalibrated && session.counter.calibrated) {
    coach(session.game.coach);
    say('Ready. Begin when you are ready.');
  }
  if (!session.counter.calibrated) {
    setMeter(session.counter.samples.length / session.counter.calibrationFrames);
    return;
  }
  setMeter(session.counter.progress());

  if (rep) {
    if (session.key === 'turn') {
      // The video is shown mirrored, so a positive turn looks like the player's left.
      if (rep.side > 0) session.left += 1; else session.right += 1;
    }
    countRep(rep.peak / session.counter.enter);
    if (session.running) coach(session.reps % 2 ? 'Good. Nice and slow.' : session.game.coach);
  }
}

function handlePose(result, now) {
  const body = result.landmarks && result.landmarks[0];
  const target = session.target;
  const w = canvas.width;
  const h = canvas.height;

  // Wrist positions in screen coordinates (the video is mirrored).
  const wrists = body
    ? [POSE.leftWrist, POSE.rightWrist]
      .map((i) => body[i])
      .filter((p) => p && (p.visibility === undefined || p.visibility > 0.5))
      .map((p) => ({ x: 1 - p.x, y: p.y }))
    : [];
  if (body) session.lastSeen = now; else lostSight(now, 'arms and shoulders');

  const hit = target.update(wrists, now);
  const hold = target.holdProgress(now);
  setMeter(hold);

  // Target: a large ring that fills as the hand holds still inside it.
  ctx.lineWidth = Math.max(6, w * 0.012);
  ctx.strokeStyle = '#e8b04b';
  ctx.fillStyle = 'rgba(232, 176, 75, 0.25)';
  ctx.beginPath();
  ctx.arc(target.x * w, target.y * h, target.radius * w, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  if (hold > 0) {
    ctx.strokeStyle = '#1f5f5b';
    ctx.beginPath();
    ctx.arc(target.x * w, target.y * h, target.radius * w, -Math.PI / 2, -Math.PI / 2 + hold * Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = '#1f5f5b';
  wrists.forEach((p) => {
    ctx.beginPath();
    ctx.arc(p.x * w, p.y * h, Math.max(10, w * 0.02), 0, Math.PI * 2);
    ctx.fill();
  });

  if (hit) {
    countRep(1);
    if (session.running) {
      placeTarget();
      coach(session.targetIndex % 2 ? 'Now reach to the other side.' : 'Good! Reach to the next circle.');
    }
  }
}

function stopCamera() {
  if (session) {
    session.running = false;
    cancelAnimationFrame(session.frame);
    closeCamera(video, session.stream);
    session.stream = null;
  } else {
    closeCamera(video, null);
  }
}

function finish(completed) {
  if (!session || !session.running) return;
  stopCamera();
  try { window.speechSynthesis.cancel(); } catch (e) { /* no speech */ }

  const seconds = Math.round((performance.now() - session.startedAt) / 1000);
  const range = session.peaks.length
    ? Math.round((session.peaks.reduce((a, b) => a + b, 0) / session.peaks.length) * 100)
    : 0;

  const summary = $('[data-summary]');
  summary.replaceChildren();
  const rows = [
    ['Exercise', session.game.name],
    ['Completed', `${session.reps} of ${session.goal}`],
    ['Time', seconds >= 60 ? `${Math.floor(seconds / 60)} min ${seconds % 60} sec` : `${seconds} seconds`],
  ];
  if (session.key === 'turn') rows.push(['Left / right', `${session.left} / ${session.right}`]);
  if (session.key !== 'reach' && session.peaks.length) rows.push(['Movement size', `${range}% of the goal`]);
  rows.forEach(([label, value]) => {
    const li = document.createElement('li');
    const l = document.createElement('span'); l.className = 'label'; l.textContent = label;
    const v = document.createElement('span'); v.textContent = value;
    li.append(l, v);
    summary.appendChild(li);
  });

  $('[data-done-title]').textContent = completed ? 'Well done!' : 'Good effort. Every bit counts.';
  if (completed) say('Well done!');

  if (session.reps > 0) {
    history.sessions.push({
      game: session.key, reps: session.reps, goal: session.goal,
      range, seconds, date: new Date().toISOString().slice(0, 10),
    });
    history.sessions = history.sessions.slice(-30);
    saveProgress('movement', history);
    showHistory();
  }
  show('done');
  $('[data-action="again"]').focus();
}

// ---------- Buttons ----------

app.addEventListener('click', (event) => {
  const pick = event.target.closest('[data-game]');
  if (pick) { choose(pick.dataset.game); return; }
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const action = button.dataset.action;
  if (action === 'camera') startCamera();
  if (action === 'back') { stopCamera(); show('pick'); }
  if (action === 'stop') finish(false);
  if (action === 'again') { show('privacy'); startCamera(); }
  if (action === 'voice') {
    voice = !voice;
    button.textContent = `Voice: ${voice ? 'On' : 'Off'}`;
    button.setAttribute('aria-pressed', String(voice));
  }
});

// Turn the camera off if the player leaves or hides the page.
window.addEventListener('pagehide', stopCamera);
document.addEventListener('visibilitychange', () => {
  if (document.hidden && session && session.running) finish(false);
});

if (!voice) {
  const voiceButton = $('[data-action="voice"]');
  voiceButton.textContent = 'Voice: Not available';
  voiceButton.disabled = true;
}

(async () => {
  const saved = await loadProgress('movement');
  if (saved && Array.isArray(saved.sessions)) history = saved;
  showHistory();
})();
