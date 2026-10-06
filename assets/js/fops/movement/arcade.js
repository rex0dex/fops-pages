// Arcade movement games: pure game logic (no camera, no drawing), so it can be tested.
// All positions are in 0–1 screen units: x left→right, y top→bottom.

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function median(values) {
  const s = values.slice().sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export function circlesTouch(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y) <= a.r + b.r;
}

// ---------- Head steering ----------
//
// Turns a head-tilt signal into a height on the screen, fitted to each player.
// Calibration has two steps: look straight ahead (sets the middle), then nod
// gently down (sets the direction and how far this person comfortably moves).
// That way a small, comfortable nod reaches the bottom of the screen, whatever
// the player's range of motion or camera angle.
export class HeadSteer {
  constructor({ samplesPerStep = 30, minRange = 0.02, smoothing = 0.25 } = {}) {
    Object.assign(this, { samplesPerStep, minRange, smoothing });
    this.reset();
  }

  reset() {
    this.step = 'center';
    this.centerSamples = [];
    this.downSamples = [];
    this.center = null;
    this.range = null; // signed: from center to a comfortable nod down
    this.y = 0.5;
  }

  get ready() { return this.step === 'ready'; }

  // Feed one signal value per frame. Returns the calibration step it is on.
  calibrate(value) {
    if (!Number.isFinite(value)) return this.step;
    if (this.step === 'center') {
      this.centerSamples.push(value);
      if (this.centerSamples.length >= this.samplesPerStep) {
        this.center = median(this.centerSamples);
        this.step = 'down';
      }
    } else if (this.step === 'down') {
      this.downSamples.push(value);
      if (this.downSamples.length >= this.samplesPerStep) {
        // The furthest-moved third of the samples is the comfortable nod.
        const sorted = this.downSamples
          .map((v) => v - this.center)
          .sort((a, b) => Math.abs(b) - Math.abs(a));
        const range = median(sorted.slice(0, Math.ceil(sorted.length / 3)));
        if (Math.abs(range) < this.minRange) {
          this.downSamples = [];
          return 'too-small';
        }
        this.range = range;
        this.step = 'ready';
      }
    }
    return this.step;
  }

  // Height on screen for a signal value: middle at rest, lower when nodding down.
  update(value) {
    if (!this.ready || !Number.isFinite(value)) return this.y;
    const t = clamp((value - this.center) / this.range, -1, 1.2);
    const target = clamp(0.5 + 0.4 * t, 0.08, 0.92);
    this.y += this.smoothing * (target - this.y);
    return this.y;
  }
}

// ---------- Balloon Ride ----------

export const BALLOON = { x: 0.25, r: 0.055 };

export function createBalloonWorld(durationSec = 90) {
  return { time: 0, duration: durationSec, items: [], nextSpawn: 1.2, stars: 0, bumps: 0, bumpCooldown: 0 };
}

// Advance the balloon world by dt seconds with the balloon at height balloonY.
// Items drift right to left, slowly and a little faster as the ride goes on.
// Returns what happened this step: [{ type: 'star' | 'bump' }].
export function stepBalloonWorld(world, dt, balloonY, rng = Math.random) {
  const events = [];
  world.time += dt;
  world.bumpCooldown = Math.max(0, world.bumpCooldown - dt);
  const speed = 0.12 + 0.06 * Math.min(1, world.time / world.duration);

  world.nextSpawn -= dt;
  if (world.nextSpawn <= 0 && world.time < world.duration - 3) {
    const isCloud = rng() < 0.3;
    world.items.push({
      type: isCloud ? 'cloud' : 'star',
      x: 1.08,
      y: 0.12 + rng() * 0.76,
      r: isCloud ? 0.07 : 0.04,
      phase: rng() * Math.PI * 2,
    });
    world.nextSpawn = 1.1 + rng() * 0.9;
  }

  const balloon = { x: BALLOON.x, y: balloonY, r: BALLOON.r };
  world.items = world.items.filter((item) => {
    item.x -= speed * dt;
    if (item.type === 'star' && circlesTouch(balloon, item)) {
      world.stars += 1;
      events.push({ type: 'star', x: item.x, y: item.y });
      return false;
    }
    if (item.type === 'cloud' && world.bumpCooldown === 0 && circlesTouch(balloon, { ...item, r: item.r * 0.8 })) {
      world.bumps += 1;
      world.bumpCooldown = 1.5; // a gentle bump, never a game over
      events.push({ type: 'bump', x: item.x, y: item.y });
    }
    return item.x > -0.15;
  });

  if (world.time >= world.duration) events.push({ type: 'end' });
  return events;
}

// ---------- Bubble Pop ----------

export function createBubbleWorld(durationSec = 60) {
  return { time: 0, duration: durationSec, bubbles: [], nextSpawn: 0.5, popped: 0, golden: 0, score: 0 };
}

// Bubbles float up from the bottom with a gentle sway. A fingertip touching a
// bubble pops it. Golden bubbles are rarer and worth 3 points.
export function stepBubbleWorld(world, dt, fingertips, rng = Math.random) {
  const events = [];
  world.time += dt;

  world.nextSpawn -= dt;
  if (world.nextSpawn <= 0 && world.time < world.duration - 2) {
    const golden = rng() < 0.12;
    world.bubbles.push({
      x: 0.12 + rng() * 0.76,
      baseX: 0,
      y: 1.1,
      r: golden ? 0.05 : 0.055 + rng() * 0.035,
      speed: 0.09 + rng() * 0.06,
      sway: 0.02 + rng() * 0.03,
      phase: rng() * Math.PI * 2,
      golden,
    });
    world.bubbles[world.bubbles.length - 1].baseX = world.bubbles[world.bubbles.length - 1].x;
    world.nextSpawn = 0.7 + rng() * 0.6;
  }

  const tips = fingertips.filter(Boolean).map((p) => ({ x: p.x, y: p.y, r: 0.025 }));
  world.bubbles = world.bubbles.filter((b) => {
    b.y -= b.speed * dt;
    b.x = b.baseX + Math.sin(world.time * 1.5 + b.phase) * b.sway;
    if (tips.some((tip) => circlesTouch(tip, b))) {
      world.popped += 1;
      if (b.golden) world.golden += 1;
      world.score += b.golden ? 3 : 1;
      events.push({ type: 'pop', x: b.x, y: b.y, r: b.r, golden: b.golden });
      return false;
    }
    return b.y > -0.15;
  });

  if (world.time >= world.duration) events.push({ type: 'end' });
  return events;
}
