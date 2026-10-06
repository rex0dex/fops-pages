// Adaptive scheduler for Spot the Scam.
//
// Each scam TYPE lives in a Leitner box from 1 (still learning) to 3 (mastered).
// - A miss sends the type back to box 1 and makes it due again soon.
// - A catch moves it up one box and pushes its next review further away.
// Each round: a missed type that is due comes first, then a type not seen yet,
// then the most overdue review. If nothing is due,
// lower boxes are picked more often than higher ones.

export const BOX_GAP = { 1: 2, 2: 5, 3: 10 }; // rounds until a type is due again
const BOX_WEIGHT = { 1: 4, 2: 2, 3: 1 };

export function createState() {
  return { round: 0, types: {} };
}

function typeState(state, type) {
  if (!state.types[type]) {
    state.types[type] = { box: 1, due: 0, seen: 0, caught: 0, missed: 0 };
  }
  return state.types[type];
}

// Pick the next scenario. `rng` returns a number in [0, 1).
export function pickNext(state, scenarios, rng = Math.random, lastId = null) {
  const pool = scenarios.filter((s) => s.id !== lastId);
  const byType = new Map();
  pool.forEach((s) => {
    if (!byType.has(s.type)) byType.set(s.type, []);
    byType.get(s.type).push(s);
  });

  const types = [...byType.keys()];
  const unseen = types.filter((t) => !state.types[t]);
  const due = types
    .filter((t) => state.types[t] && state.types[t].due <= state.round)
    .sort((a, b) => state.types[a].due - state.types[b].due);

  // Priority: missed types that are due, then new types, then other reviews.
  const dueMissed = due.filter((t) => state.types[t].box === 1);

  let chosenType;
  if (dueMissed.length > 0) {
    chosenType = dueMissed[0];
  } else if (unseen.length > 0) {
    chosenType = unseen[Math.floor(rng() * unseen.length)];
  } else if (due.length > 0) {
    chosenType = due[0];
  } else {
    const total = types.reduce((sum, t) => sum + BOX_WEIGHT[state.types[t].box], 0);
    let r = rng() * total;
    chosenType = types[types.length - 1];
    for (const t of types) {
      r -= BOX_WEIGHT[state.types[t].box];
      if (r < 0) { chosenType = t; break; }
    }
  }

  const options = byType.get(chosenType);
  return options[Math.floor(rng() * options.length)];
}

// Record the result of a round for one scam type.
export function recordResult(state, type, caught) {
  const t = typeState(state, type);
  state.round += 1;
  t.seen += 1;
  if (caught) {
    t.caught += 1;
    t.box = Math.min(3, t.box + 1);
  } else {
    t.missed += 1;
    t.box = 1;
  }
  t.due = state.round + BOX_GAP[t.box];
  return t;
}

// Types the player is still learning, worst first.
export function weakSpots(state) {
  return Object.entries(state.types)
    .filter(([, t]) => t.box === 1 && t.missed > 0)
    .sort((a, b) => b[1].missed - a[1].missed)
    .map(([type]) => type);
}
