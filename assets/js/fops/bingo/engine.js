// Bingo rules engine: cards, calling order, and winning lines.
//
// Everything random comes from a seeded generator (mulberry32), so the same
// seed always produces the same card and the same calling order.

export const LETTERS = ['B', 'I', 'N', 'G', 'O'];
export const FREE = 0; // value stored in the center square

// Deterministic 32-bit generator. Returns numbers in [0, 1).
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Fisher–Yates shuffle using the given generator. Returns a new array.
export function shuffle(items, rng) {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function letterFor(n) {
  return LETTERS[Math.floor((n - 1) / 15)];
}

// The full calling order for a game: all 75 balls, shuffled by the seed.
export function callOrder(seed) {
  const balls = Array.from({ length: 75 }, (_, i) => i + 1);
  return shuffle(balls, mulberry32(seed));
}

// A 5x5 card as columns: card[col][row]. Column B holds 1–15, I 16–30, and so on.
export function makeCard(seed) {
  const rng = mulberry32(seed);
  const card = [];
  for (let col = 0; col < 5; col += 1) {
    const low = col * 15 + 1;
    const range = Array.from({ length: 15 }, (_, i) => low + i);
    card.push(shuffle(range, rng).slice(0, 5));
  }
  card[2][2] = FREE;
  return card;
}

// All 12 winning lines, as lists of [col, row] squares.
export const LINES = (() => {
  const lines = [];
  for (let i = 0; i < 5; i += 1) {
    lines.push([0, 1, 2, 3, 4].map((r) => [i, r])); // column
    lines.push([0, 1, 2, 3, 4].map((c) => [c, i])); // row
  }
  lines.push([0, 1, 2, 3, 4].map((i) => [i, i]));
  lines.push([0, 1, 2, 3, 4].map((i) => [i, 4 - i]));
  return lines;
})();

// Lines that are complete, given a set of called numbers.
export function winningLines(card, called) {
  const has = (col, row) => card[col][row] === FREE || called.has(card[col][row]);
  return LINES.filter((line) => line.every(([c, r]) => has(c, r)));
}

// Spoken form of a ball, for example "B 7".
export function spoken(n) {
  return `${letterFor(n)}, ${n}`;
}
