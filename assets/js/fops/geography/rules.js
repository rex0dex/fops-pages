// Size It Up: game rules with no drawing, so they can be tested.

// How close a guess is, from 0 to 100%. Guessing half or double the real
// size both score 50%, so being too big and too small count the same.
export function accuracy(guessArea, actualArea) {
  if (!(guessArea > 0) || !(actualArea > 0)) return 0;
  return (Math.min(guessArea, actualArea) / Math.max(guessArea, actualArea)) * 100;
}

// Pick a reference place that is a fair comparison: between 1/10 and 10 times
// the target's area, and not the same place.
export function chooseReference(target, places, rng = Math.random) {
  const fair = places.filter((p) => p !== target && p.area / target.area >= 0.1 && p.area / target.area <= 10
    && Math.abs(Math.log(p.area / target.area)) > Math.log(1.25));
  const pool = fair.length ? fair : places.filter((p) => p !== target);
  return pool[Math.floor(rng() * pool.length)];
}

// The size the target starts at, as a multiple of its real area: always
// clearly wrong, between 3x and 15x too big or too small.
export function startingAreaFactor(rng = Math.random) {
  const factor = 3 + rng() * 12;
  return rng() < 0.5 ? factor : 1 / factor;
}

// The bot guesses the real area with an error that depends on difficulty.
// The error is spread evenly in "times too big / too small", like a person.
export const BOT_SPREAD = { easy: 0.9, medium: 0.5, hard: 0.22 };

function normal(rng) {
  // Box-Muller transform: two uniform numbers -> one standard normal number
  const u = Math.max(rng(), 1e-12);
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function botGuess(actualArea, difficulty = 'medium', rng = Math.random) {
  const spread = BOT_SPREAD[difficulty] ?? BOT_SPREAD.medium;
  return actualArea * Math.exp(normal(rng) * spread);
}

// Who wins a round: higher accuracy wins; equal accuracy is a tie.
export function roundWinner(accA, accB) {
  if (Math.abs(accA - accB) < 1e-9) return 'tie';
  return accA > accB ? 'a' : 'b';
}

// Format an area the way the game shows it, for example 83.9K or 7.71M.
export function formatArea(km2) {
  if (km2 >= 1e6) return `${(km2 / 1e6).toFixed(2)}M km²`;
  if (km2 >= 1e3) return `${(km2 / 1e3).toFixed(1)}K km²`;
  return `${Math.round(km2)} km²`;
}
