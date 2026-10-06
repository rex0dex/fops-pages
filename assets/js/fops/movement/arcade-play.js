// Movement Arcade: Balloon Ride (head nods) and Bubble Pop (fingertip).
import { getLandmarker, openCamera, closeCamera } from './tracker.js';
import { nodSignal } from './reps.js';
import { HeadSteer, BALLOON, createBalloonWorld, stepBalloonWorld, createBubbleWorld, stepBubbleWorld } from './arcade.js';
import { loadProgress, saveProgress } from '../progress.js';

const INDEX_TIP = 8; // hand landmark for the tip of the pointing finger

const app = document.getElementById('arcade-app');
const $ = (sel) => app.querySelector(sel);
const canvas = $('[data-canvas]');
const ctx = canvas.getContext('2d');
const video = $('[data-video]');
const W = canvas.width;
const H = canvas.height;

const GAMES = {
  balloon: { name: 'Balloon Ride', model: 'face', seconds: 90 },
  bubbles: { name: 'Bubble Pop', model: 'hand', seconds: 60 },
};

let progress = { sessions: [], arcade: {} };
let sound = true;
let audio = null;
let run = null;

// ---------- Small helpers ----------

function show(screen) {
  app.querySelectorAll('[data-screen]').forEach((s) => { s.hidden = s.dataset.screen !== screen; });
}
const coach = (text) => { $('[data-coach]').textContent = text; };
const meter = (f) => { $('[data-meter]').style.width = `${Math.round(Math.max(0, Math.min(1, f)) * 100)}%`; };

function chime(freq = 660, length = 0.18) {
  if (!sound) return;
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, audio.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + length);
    osc.connect(gain).connect(audio.destination);
    osc.start();
    osc.stop(audio.currentTime + length + 0.02);
  } catch (e) { /* audio not available */ }
}

function showBest() {
  const parts = Object.entries(progress.arcade || {})
    .map(([key, r]) => `${GAMES[key].name} best: ${r.best}`);
  $('[data-best]').textContent = parts.join(' · ');
}

// ---------- Drawing ----------

function drawSky(t) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#bfe3f2');
  g.addColorStop(1, '#fdf3df');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // distant hills, drifting slowly
  ctx.fillStyle = '#cfe3d4';
  ctx.beginPath();
  ctx.moveTo(0, H);
  for (let x = 0; x <= W; x += 20) {
    ctx.lineTo(x, H * 0.86 + Math.sin((x / W) * 6 + t * 0.15) * 18);
  }
  ctx.lineTo(W, H);
  ctx.fill();
}

function drawStar(x, y, r, spin) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(spin);
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const rad = i % 2 ? r * 0.45 : r;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
  }
  ctx.closePath();
  ctx.fillStyle = '#f2b632';
  ctx.strokeStyle = '#b07a00';
  ctx.lineWidth = 4;
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawCloud(x, y, r) {
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.strokeStyle = '#9fb4be';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x - r * 0.7, y + r * 0.2, r * 0.65, 0, Math.PI * 2);
  ctx.arc(x, y - r * 0.15, r * 0.85, 0, Math.PI * 2);
  ctx.arc(x + r * 0.75, y + r * 0.2, r * 0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function drawBalloon(x, y, r, wobble) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(wobble) * 0.06);
  // ropes and basket
  ctx.strokeStyle = '#5b4632';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-r * 0.45, r * 0.85); ctx.lineTo(-r * 0.25, r * 1.45);
  ctx.moveTo(r * 0.45, r * 0.85); ctx.lineTo(r * 0.25, r * 1.45);
  ctx.stroke();
  ctx.fillStyle = '#8a6a45';
  ctx.fillRect(-r * 0.32, r * 1.42, r * 0.64, r * 0.42);
  // envelope with stripes
  ctx.beginPath();
  ctx.ellipse(0, 0, r, r * 1.08, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#b4472f';
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = '#f1e9dc';
  for (let i = -2; i <= 2; i += 2) ctx.fillRect(i * r * 0.32 - r * 0.12, -r * 1.2, r * 0.24, r * 2.4);
  ctx.restore();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#7a2e1d';
  ctx.stroke();
  ctx.restore();
}

function drawBubble(b, t) {
  const x = b.x * W;
  const y = b.y * H;
  const r = b.r * W;
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
  if (b.golden) {
    g.addColorStop(0, 'rgba(255,248,214,0.95)');
    g.addColorStop(1, 'rgba(232,176,75,0.75)');
  } else {
    g.addColorStop(0, 'rgba(255,255,255,0.9)');
    g.addColorStop(0.7, 'rgba(173,216,230,0.35)');
    g.addColorStop(1, 'rgba(31,95,91,0.45)');
  }
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = b.golden ? '#b07a00' : 'rgba(31,95,91,0.6)';
  ctx.stroke();
  if (b.golden) drawStar(x, y, r * 0.45, t);
}

function drawBursts(dt) {
  run.bursts = run.bursts.filter((burst) => {
    burst.age += dt;
    const k = burst.age / 0.6;
    ctx.globalAlpha = Math.max(0, 1 - k);
    ctx.strokeStyle = burst.color;
    ctx.lineWidth = 4;
    for (let i = 0; i < 8; i += 1) {
      const a = (Math.PI / 4) * i;
      const d = burst.r * (1 + k * 1.4);
      ctx.beginPath();
      ctx.arc(burst.x + Math.cos(a) * d, burst.y + Math.sin(a) * d, 5, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (burst.label) {
      ctx.fillStyle = burst.color;
      ctx.font = 'bold 40px "Atkinson Hyperlegible", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(burst.label, burst.x, burst.y - burst.r - k * 40);
    }
    ctx.globalAlpha = 1;
    return k < 1;
  });
}

function drawHud(score, label, secondsLeft) {
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.fillRect(16, 16, 330, 78);
  ctx.strokeStyle = '#d9cfbf';
  ctx.lineWidth = 2;
  ctx.strokeRect(16, 16, 330, 78);
  ctx.fillStyle = '#164542';
  ctx.textAlign = 'left';
  ctx.font = 'bold 40px "Atkinson Hyperlegible", sans-serif';
  ctx.fillText(`${label}: ${score}`, 32, 70);
  ctx.textAlign = 'right';
  ctx.font = 'bold 30px "Atkinson Hyperlegible", sans-serif';
  ctx.fillText(`${Math.max(0, Math.ceil(secondsLeft))}s`, 334, 68);
}

function drawMessage(text) {
  ctx.fillStyle = 'rgba(22,69,66,0.85)';
  ctx.fillRect(W * 0.1, H * 0.16, W * 0.8, 100);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.font = 'bold 46px "Atkinson Hyperlegible", sans-serif';
  ctx.fillText(text, W / 2, H * 0.16 + 65);
}

// ---------- Game loop ----------

function frame(now) {
  if (!run || !run.running) return;
  const dt = Math.min(0.05, (now - run.last) / 1000);
  run.last = now;

  let result = null;
  if (video.readyState >= 2 && video.currentTime !== run.videoTime) {
    run.videoTime = video.currentTime;
    result = run.landmarker.detectForVideo(video, now);
  }

  if (run.key === 'balloon') balloonFrame(result, dt, now);
  else bubbleFrame(result, dt, now);

  if (run.running) run.raf = requestAnimationFrame(frame);
}

function balloonFrame(result, dt, now) {
  const face = result && result.faceLandmarks && result.faceLandmarks[0];
  if (face) { run.lastSeen = now; run.signal = nodSignal(face); }
  const steer = run.steer;

  drawSky(run.world ? run.world.time : 0);

  if (!steer.ready) {
    if (face && result) {
      const step = steer.calibrate(run.signal);
      if (step === 'too-small') {
        coach('Try a slightly bigger nod down, and hold it there.');
      } else if (step === 'center') {
        coach('Look straight at the screen and hold still…');
        meter(steer.centerSamples.length / steer.samplesPerStep);
      } else if (step === 'down') {
        coach('Now gently nod your chin down, and hold it there…');
        meter(steer.downSamples.length / steer.samplesPerStep);
      }
      if (steer.ready) {
        coach('Ready! Nod down to go down, look up to go up.');
        chime(880, 0.3);
        run.world = createBalloonWorld(GAMES.balloon.seconds);
      }
    } else if (now - run.lastSeen > 1200) {
      coach("We can't see your face. Sit back so the camera can see you.");
    }
    drawBalloon(BALLOON.x * W, H / 2, BALLOON.r * W, now / 500);
    drawMessage(steer.step === 'center' ? 'Look straight ahead' : 'Gently nod down');
    return;
  }

  const y = face ? steer.update(run.signal) : steer.y;
  meter(1 - Math.abs(y - 0.5) * 2);
  const events = stepBalloonWorld(run.world, dt, y);

  run.world.items.forEach((item) => {
    if (item.type === 'star') drawStar(item.x * W, item.y * H, item.r * W, run.world.time + item.phase);
    else drawCloud(item.x * W, item.y * H, item.r * W);
  });
  const bumping = run.world.bumpCooldown > 1.2;
  drawBalloon(BALLOON.x * W, y * H + (bumping ? Math.sin(now / 30) * 6 : 0), BALLOON.r * W, now / 500);
  drawBursts(dt);
  drawHud(run.world.stars, 'Stars', run.world.duration - run.world.time);

  events.forEach((e) => {
    if (e.type === 'star') {
      chime(990, 0.2);
      run.bursts.push({ x: e.x * W, y: e.y * H, r: 30, age: 0, color: '#b07a00', label: '+1' });
    }
    if (e.type === 'bump') {
      chime(220, 0.25);
      coach('Bumped a cloud! Float around them.');
    }
    if (e.type === 'end') finish(true);
  });
  if (!face && now - run.lastSeen > 1500) coach("We can't see your face. Sit back so the camera can see you.");
}

function bubbleFrame(result, dt, now) {
  const hand = result && result.landmarks && result.landmarks[0];
  if (result) {
    run.tip = hand && hand[INDEX_TIP] ? { x: 1 - hand[INDEX_TIP].x, y: hand[INDEX_TIP].y } : null;
    if (hand) run.lastSeen = now;
  }

  if (!run.world) {
    run.world = createBubbleWorld(GAMES.bubbles.seconds);
    coach('Hold up one hand and point. Touch the bubbles with your fingertip.');
  }

  drawSky(run.world.time);
  const events = stepBubbleWorld(run.world, dt, [run.tip]);
  run.world.bubbles.forEach((b) => drawBubble(b, run.world.time));
  drawBursts(dt);

  if (run.tip) {
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#164542';
    ctx.fillStyle = 'rgba(232,176,75,0.7)';
    ctx.beginPath();
    ctx.arc(run.tip.x * W, run.tip.y * H, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    meter(1);
  } else {
    meter(0);
    if (now - run.lastSeen > 1200) coach('Hold up one hand so the camera can see it, and point.');
  }
  drawHud(run.world.score, 'Points', run.world.duration - run.world.time);

  events.forEach((e) => {
    if (e.type === 'pop') {
      chime(e.golden ? 1180 : 760, 0.15);
      run.bursts.push({
        x: e.x * W, y: e.y * H, r: e.r * W, age: 0,
        color: e.golden ? '#b07a00' : '#1f5f5b', label: e.golden ? '+3' : '+1',
      });
      if (run.tip) coach(e.golden ? 'A golden bubble! 3 points!' : 'Pop! Nice and steady.');
    }
    if (e.type === 'end') finish(true);
  });
}

// ---------- Start and finish ----------

function choose(key) {
  run = { key, game: GAMES[key] };
  $('[data-camera-message]').textContent = '';
  show('privacy');
  $('[data-action="camera"]').focus();
}

async function start() {
  const message = $('[data-camera-message]');
  message.className = 'form-message';
  message.textContent = 'Starting the camera and loading the game. This can take a few seconds…';
  try {
    run.stream = await openCamera(video);
  } catch (e) {
    message.className = 'form-message error';
    message.textContent = e.message;
    return;
  }
  try {
    run.landmarker = await getLandmarker(run.game.model);
  } catch (e) {
    closeCamera(video, run.stream);
    message.className = 'form-message error';
    message.textContent = 'The game could not load. Please check your internet connection and try again.';
    return;
  }

  Object.assign(run, {
    running: true, world: null, bursts: [], last: performance.now(), videoTime: -1,
    lastSeen: performance.now(), steer: new HeadSteer(), signal: null, tip: null,
  });
  meter(0);
  coach('Getting ready…');
  show('play');
  $('[data-coach]').scrollIntoView({ block: 'start', behavior: 'smooth' });
  run.raf = requestAnimationFrame(frame);
}

function stop() {
  if (!run) return;
  run.running = false;
  cancelAnimationFrame(run.raf);
  closeCamera(video, run.stream);
  run.stream = null;
}

function finish(completed) {
  if (!run || !run.running) return;
  stop();
  const world = run.world;
  const score = world ? (run.key === 'balloon' ? world.stars : world.score) : 0;
  const rows = [['Game', run.game.name]];
  if (run.key === 'balloon') {
    rows.push(['Stars collected', String(world ? world.stars : 0)]);
    rows.push(['Cloud bumps', String(world ? world.bumps : 0)]);
  } else {
    rows.push(['Points', String(score)]);
    rows.push(['Bubbles popped', String(world ? world.popped : 0)]);
    rows.push(['Golden bubbles', String(world ? world.golden : 0)]);
  }

  if (world && world.time > 5) {
    progress.arcade = progress.arcade || {};
    const record = progress.arcade[run.key] || { best: 0, plays: 0 };
    const newBest = score > record.best;
    record.plays += 1;
    record.best = Math.max(record.best, score);
    progress.arcade[run.key] = record;
    rows.push(['Your best', newBest ? `${record.best} (new best!)` : String(record.best)]);
    saveProgress('movement', progress);
    showBest();
  }

  const summary = $('[data-summary]');
  summary.replaceChildren();
  rows.forEach(([label, value]) => {
    const li = document.createElement('li');
    const l = document.createElement('span'); l.className = 'label'; l.textContent = label;
    const v = document.createElement('span'); v.textContent = value;
    li.append(l, v);
    summary.appendChild(li);
  });
  $('[data-done-title]').textContent = completed ? 'Well done!' : 'Good effort. Every bit counts.';
  if (completed) chime(1046, 0.5);
  show('done');
  $('[data-action="again"]').focus();
}

app.addEventListener('click', (event) => {
  const pick = event.target.closest('[data-game]');
  if (pick) { choose(pick.dataset.game); return; }
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const action = button.dataset.action;
  if (action === 'camera') start();
  if (action === 'again') { show('privacy'); start(); }
  if (action === 'stop') finish(false);
  if (action === 'back') { stop(); show('pick'); }
  if (action === 'sound') {
    sound = !sound;
    button.textContent = `Sound: ${sound ? 'On' : 'Off'}`;
    button.setAttribute('aria-pressed', String(sound));
  }
});

window.addEventListener('pagehide', stop);
document.addEventListener('visibilitychange', () => {
  if (document.hidden && run && run.running) finish(false);
});

(async () => {
  const saved = await loadProgress('movement');
  if (saved && typeof saved === 'object') progress = { sessions: [], arcade: {}, ...saved };
  showBest();
})();
