// Turning face and body landmarks into counted, scored repetitions.
// Pure functions and classes only (no camera, no DOM), so they can be tested.

// Face Landmarker indices (MediaPipe 478-point face mesh).
export const FACE = { noseTip: 1, forehead: 10, chin: 152, eyeOuterA: 33, eyeOuterB: 263 };
// Pose Landmarker indices (33-point body model).
export const POSE = { leftWrist: 15, rightWrist: 16, leftShoulder: 11, rightShoulder: 12 };

const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

// Head tilt up/down, measured from where the nose sits between the eyes and
// the chin. Dividing by face height makes it the same near or far from the camera.
export function nodSignal(face) {
  const eyes = mid(face[FACE.eyeOuterA], face[FACE.eyeOuterB]);
  const height = Math.abs(face[FACE.chin].y - face[FACE.forehead].y) || 1e-6;
  return (face[FACE.noseTip].y - eyes.y) / height;
}

// Head turn left/right: how far the nose has moved sideways from the middle
// of the eyes, measured in eye-widths.
export function turnSignal(face) {
  const eyes = mid(face[FACE.eyeOuterA], face[FACE.eyeOuterB]);
  const width = dist(face[FACE.eyeOuterA], face[FACE.eyeOuterB]) || 1e-6;
  return (face[FACE.noseTip].x - eyes.x) / width;
}

function median(values) {
  const sorted = values.slice().sort((a, b) => a - b);
  const m = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[m] : (sorted[m - 1] + sorted[m]) / 2;
}

// Counts movements away from a resting position and back.
//
// 1. Calibrate: the first `calibrationFrames` samples (sitting still) set the
//    resting baseline.
// 2. Smooth each new sample (exponential moving average) to ignore jitter.
// 3. A rep starts when the movement passes `enter` for `minFrames` frames in a
//    row, and counts when it comes back inside `exit`. Two thresholds
//    (hysteresis) stop one shaky movement from counting twice.
export class RepCounter {
  constructor({ enter, exit, minFrames = 3, smoothing = 0.35, calibrationFrames = 30 }) {
    Object.assign(this, { enter, exit, minFrames, smoothing, calibrationFrames });
    this.reset();
  }

  reset() {
    this.samples = [];
    this.baseline = null;
    this.smooth = null;
    this.phase = 'rest';
    this.streak = 0;
    this.side = 0;
    this.peak = 0;
    this.reps = [];
  }

  get calibrated() { return this.baseline !== null; }

  // Feed one value per video frame. Returns a finished rep { side, peak } or null.
  update(value) {
    if (!Number.isFinite(value)) return null;
    if (!this.calibrated) {
      this.samples.push(value);
      if (this.samples.length >= this.calibrationFrames) {
        this.baseline = median(this.samples);
        this.smooth = this.baseline;
      }
      return null;
    }

    this.smooth += this.smoothing * (value - this.smooth);
    const offset = this.smooth - this.baseline;
    const size = Math.abs(offset);

    if (this.phase === 'rest') {
      this.streak = size > this.enter ? this.streak + 1 : 0;
      if (this.streak >= this.minFrames) {
        this.phase = 'moving';
        this.side = Math.sign(offset);
        this.peak = size;
      }
      return null;
    }

    this.peak = Math.max(this.peak, size);
    if (size < this.exit) {
      const rep = { side: this.side, peak: this.peak };
      this.reps.push(rep);
      this.phase = 'rest';
      this.streak = 0;
      return rep;
    }
    return null;
  }

  // How far the current movement is toward the goal, 0 to 1, for an on-screen meter.
  progress() {
    if (!this.calibrated) return 0;
    return Math.min(1, Math.abs(this.smooth - this.baseline) / this.enter);
  }

  // Average reach of finished reps compared with the goal, as a percent.
  rangePercent() {
    if (!this.reps.length) return 0;
    const avg = this.reps.reduce((sum, r) => sum + r.peak, 0) / this.reps.length;
    return Math.round((avg / this.enter) * 100);
  }
}

// Reach and Tap: a target counts as tapped when a wrist stays inside it for
// `dwellMs`, so a hand passing through by accident does not count.
export class DwellTarget {
  constructor({ x, y, radius, dwellMs = 400 }) {
    Object.assign(this, { x, y, radius, dwellMs });
    this.enteredAt = null;
  }

  // points: wrist positions in the same 0–1 screen coordinates as the target.
  update(points, nowMs) {
    const inside = points.some((p) => p && Math.hypot(p.x - this.x, p.y - this.y) <= this.radius);
    if (!inside) {
      this.enteredAt = null;
      return false;
    }
    if (this.enteredAt === null) this.enteredAt = nowMs;
    return nowMs - this.enteredAt >= this.dwellMs;
  }

  holdProgress(nowMs) {
    if (this.enteredAt === null) return 0;
    return Math.min(1, (nowMs - this.enteredAt) / this.dwellMs);
  }
}

// Where the next Reach and Tap target goes: alternate left and right sides,
// at a comfortable seated reach (upper half of the screen, away from the edges).
export function nextTargetPosition(index, rng = Math.random) {
  const leftSide = index % 2 === 0;
  const x = leftSide ? 0.15 + rng() * 0.15 : 0.7 + rng() * 0.15;
  const y = 0.2 + rng() * 0.3;
  return { x, y };
}
