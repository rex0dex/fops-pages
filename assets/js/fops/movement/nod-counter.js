// Turning face landmarks into counted head nods.
// Pure functions only (no camera, no page), so the counting can be tested.

// MediaPipe Face Landmarker points used to measure a nod.
export const FACE = { noseTip: 1, forehead: 10, chin: 152, eyeOuterA: 33, eyeOuterB: 263 };

// How far the head is tilted up or down: where the nose sits below the eyes,
// divided by face height, so it is the same near or far from the camera.
export function nodSignal(face) {
  const eyesY = (face[FACE.eyeOuterA].y + face[FACE.eyeOuterB].y) / 2;
  const height = Math.abs(face[FACE.chin].y - face[FACE.forehead].y) || 1e-6;
  return (face[FACE.noseTip].y - eyesY) / height;
}

function median(values) {
  const sorted = values.slice().sort((a, b) => a - b);
  const m = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[m] : (sorted[m - 1] + sorted[m]) / 2;
}

// Counts nods: moving away from the resting position and back.
// 1. The first frames (sitting still) set the resting baseline.
// 2. Each new value is smoothed so camera jitter is ignored.
// 3. A nod starts when the head moves past `enter`, and counts when it comes
//    back inside `exit`. Using two thresholds stops one shaky nod counting twice.
export class NodCounter {
  constructor({ enter = 0.06, exit = 0.025, minFrames = 3, smoothing = 0.35, calibrationFrames = 30 } = {}) {
    Object.assign(this, { enter, exit, minFrames, smoothing, calibrationFrames });
    this.samples = [];
    this.baseline = null;
    this.smooth = null;
    this.moving = false;
    this.streak = 0;
    this.count = 0;
  }

  get calibrated() { return this.baseline !== null; }

  // Feed one value per video frame. Returns true when a nod has just finished.
  update(value) {
    if (!Number.isFinite(value)) return false;
    if (!this.calibrated) {
      this.samples.push(value);
      if (this.samples.length >= this.calibrationFrames) {
        this.baseline = median(this.samples);
        this.smooth = this.baseline;
      }
      return false;
    }

    this.smooth += this.smoothing * (value - this.smooth);
    const size = Math.abs(this.smooth - this.baseline);

    if (!this.moving) {
      this.streak = size > this.enter ? this.streak + 1 : 0;
      if (this.streak >= this.minFrames) this.moving = true;
      return false;
    }
    if (size < this.exit) {
      this.moving = false;
      this.streak = 0;
      this.count += 1;
      return true;
    }
    return false;
  }

  // How far the current nod is toward counting, 0 to 1, for the on-screen bar.
  progress() {
    if (!this.calibrated) return this.samples.length / this.calibrationFrames;
    return Math.min(1, Math.abs(this.smooth - this.baseline) / this.enter);
  }
}
