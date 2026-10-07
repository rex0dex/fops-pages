// Animated Bingo cage: a wire drum spins, the balls tumble, and one ball rolls
// down the chute into the tray showing its number.
import { letterFor } from './engine.js';

const LETTER_COLORS = { B: '#2f6fb0', I: '#b4472f', N: '#6b5ca5', G: '#2e7d4f', O: '#d9822b' };
const SPIN_MS = 1300;   // drum spins fast
const ROLL_MS = 700;    // ball rolls down the chute
const TOTAL_MS = SPIN_MS + ROLL_MS;

const reduceMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export class BingoCage {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.W = canvas.width;
    this.H = canvas.height;
    // Drum geometry (top-left area), chute to the tray (bottom-right).
    this.cx = this.W * 0.4;
    this.cy = this.H * 0.4;
    this.R = this.H * 0.3;
    this.tray = { x: this.W * 0.78, y: this.H * 0.8, r: this.H * 0.15 };
    this.angle = 0;
    this.speed = 0.4;        // radians per second, a slow idle turn
    this.anim = null;        // current draw animation
    this.shown = null;       // ball resting in the tray
    this.last = performance.now();
    this.balls = Array.from({ length: 16 }, (_, i) => ({
      theta: Math.PI / 2 + (i - 8) * 0.12,
      dist: 0.45 + ((i * 37) % 10) / 22,
      color: Object.values(LETTER_COLORS)[i % 5],
      drift: 0.6 + ((i * 53) % 10) / 12,
    }));
    this.tick = this.tick.bind(this);
    requestAnimationFrame(this.tick);
  }

  // Spin, then roll ball n out. Resolves when it has landed.
  drawBall(n) {
    if (reduceMotion()) {
      this.showBall(n);
      return Promise.resolve();
    }
    this.anim = { n, start: performance.now() };
    this.shown = null;
    // Resolve on a timer, so the game keeps going even if animation frames pause.
    return new Promise((resolve) => setTimeout(() => {
      if (this.anim && this.anim.n === n) {
        this.anim = null;
        this.shown = n;
      }
      resolve();
    }, TOTAL_MS));
  }

  // Put ball n straight in the tray, no animation (used when catching up).
  showBall(n) {
    this.anim = null;
    this.shown = n;
  }

  reset() {
    this.anim = null;
    this.shown = null;
  }

  tick(now) {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;

    const spinning = this.anim && now - this.anim.start < SPIN_MS;
    const target = spinning ? 7 : 0.4;
    this.speed += (target - this.speed) * Math.min(1, dt * 4);
    this.angle += this.speed * dt;

    // Balls ride up with the drum when it spins fast, and fall back to the bottom.
    this.balls.forEach((b) => {
      b.theta += this.speed * dt * b.drift * (spinning ? 1 : 0.15);
      const fall = Math.sin(b.theta - Math.PI / 2);
      b.theta -= fall * dt * (spinning ? 1.2 : 3);
    });

    this.draw(now);
    requestAnimationFrame(this.tick);
  }

  drawLetterBall(x, y, r, n) {
    const ctx = this.ctx;
    const letter = letterFor(n);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = r * 0.22;
    ctx.strokeStyle = LETTER_COLORS[letter];
    ctx.stroke();
    ctx.fillStyle = '#1d2a30';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${Math.round(r * 0.55)}px "Atkinson Hyperlegible", sans-serif`;
    ctx.fillText(letter, x, y - r * 0.32);
    ctx.font = `bold ${Math.round(r * 0.75)}px "Atkinson Hyperlegible", sans-serif`;
    ctx.fillText(String(n), x, y + r * 0.25);
  }

  draw(now) {
    const { ctx, W, H, cx, cy, R, tray } = this;
    ctx.clearRect(0, 0, W, H);

    // Stand
    ctx.strokeStyle = '#8a6a45';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - R * 0.8, cy + R * 1.55); ctx.lineTo(cx, cy);
    ctx.moveTo(cx + R * 0.8, cy + R * 1.55); ctx.lineTo(cx, cy);
    ctx.stroke();

    // Chute from the bottom of the drum down to the tray
    const chuteStart = { x: cx + R * 0.55, y: cy + R * 0.85 };
    ctx.strokeStyle = '#c9b89c';
    ctx.lineWidth = 22;
    ctx.beginPath();
    ctx.moveTo(chuteStart.x, chuteStart.y);
    ctx.lineTo(tray.x - tray.r * 0.6, tray.y - tray.r * 0.35);
    ctx.stroke();

    // Tray
    ctx.fillStyle = '#f1e9dc';
    ctx.strokeStyle = '#8a6a45';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(tray.x, tray.y + tray.r * 0.75, tray.r * 1.25, tray.r * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Balls inside the drum
    this.balls.forEach((b) => {
      const d = R * 0.78 * b.dist;
      const x = cx + Math.cos(b.theta) * d;
      const y = cy + Math.sin(b.theta) * d;
      ctx.beginPath();
      ctx.arc(x, y, R * 0.11, 0, Math.PI * 2);
      ctx.fillStyle = b.color;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x - R * 0.03, y - R * 0.03, R * 0.04, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fill();
    });

    // Wire drum: rim and rotating spokes
    ctx.strokeStyle = '#164542';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 3;
    for (let i = 0; i < 8; i += 1) {
      const a = this.angle + (Math.PI / 4) * i;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
      ctx.stroke();
    }
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.55, 0, Math.PI * 2);
    ctx.stroke();

    // Crank handle turning with the drum
    const hx = cx + Math.cos(this.angle) * R * 0.35;
    const hy = cy + Math.sin(this.angle) * R * 0.35;
    ctx.strokeStyle = '#8a6a45';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(cx, cy); ctx.lineTo(hx, hy);
    ctx.stroke();
    ctx.fillStyle = '#b4472f';
    ctx.beginPath();
    ctx.arc(hx, hy, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#164542';
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.fill();

    // The drawn ball rolling down the chute
    if (this.anim) {
      const t = (now - this.anim.start - SPIN_MS) / ROLL_MS;
      if (t >= 0) {
        const k = Math.min(1, t);
        const ease = 1 - (1 - k) * (1 - k);
        const end = { x: tray.x, y: tray.y };
        const x = chuteStart.x + (end.x - chuteStart.x) * ease;
        const y = chuteStart.y + (end.y - chuteStart.y) * ease - Math.sin(k * Math.PI) * 12;
        const r = R * 0.13 + (tray.r - R * 0.13) * ease;
        this.drawLetterBall(x, y, r, this.anim.n);
      }
    } else if (this.shown) {
      this.drawLetterBall(tray.x, tray.y, tray.r, this.shown);
    }
  }
}
