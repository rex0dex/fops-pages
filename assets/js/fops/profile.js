// The interest survey on the profile page.
// Answers are always kept in this browser. When the member is signed in they are
// also saved to their account on the fops-flask backend (/api/fops/profile/interests),
// which uses them, added up without names, to help volunteers plan events.
import { pythonURI, fetchOptions, baseurl } from '../api/config.js';

const SITE = baseurl;
const LOCAL_KEY = 'fops-interests';

// The same questions and answer keys the backend accepts (model/fops_interests.py).
export const QUESTIONS = [
  {
    key: 'goals', many: true,
    text: 'What would you like to do here?', note: 'Pick all that apply.',
    options: [
      ['games', 'Play games'], ['scams', 'Stay safe from scams'], ['exercise', 'Exercise'],
      ['events', 'Come to events'], ['tech-help', 'Get tech help'],
    ],
  },
  {
    key: 'comfort', many: false,
    text: 'How comfortable are you with phones and computers?',
    options: [['starting', 'Just starting'], ['okay', 'Okay'], ['comfortable', 'Very comfortable']],
  },
  {
    key: 'scam_contact', many: false,
    text: 'Have you gotten a scam message or call this year?',
    options: [['yes', 'Yes'], ['not-sure', 'Not sure'], ['no', 'No']],
  },
  {
    key: 'events', many: true,
    text: 'Which events interest you?', note: 'Pick all that apply.',
    options: [
      ['bingo', 'Bingo'], ['tech-help', 'Tech help'], ['lunches', 'Lunches'],
      ['exercise', 'Exercise classes'], ['trips', 'Trips'],
    ],
  },
  {
    key: 'reminders', many: false,
    text: 'How would you like to be reminded about events?',
    options: [['email', 'Email'], ['phone', 'Phone call'], ['none', 'No reminders']],
  },
  {
    key: 'volunteer', many: false,
    text: 'Would you like to volunteer with Friends of Poway Seniors?',
    options: [['yes', 'Yes'], ['maybe', 'Maybe later'], ['no', 'No']],
  },
];

const form = document.getElementById('interest-survey');
const questionsBox = form.querySelector('[data-questions]');
const message = form.querySelector('.form-message');
const statusText = document.querySelector('[data-status-text]');
const results = document.querySelector('[data-results]');
const recBox = document.querySelector('[data-recommendations]');
let signedIn = false;
let answers = {};

function say(text, kind = '') {
  message.textContent = text;
  message.className = `form-message ${kind}`;
}

function readLocal() {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY)) || {}; } catch (e) { return {}; }
}
function writeLocal(data) {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(data)); } catch (e) { /* storage blocked */ }
}

// Build each question as a group of big toggle buttons.
function renderQuestions() {
  questionsBox.replaceChildren();
  QUESTIONS.forEach((q, i) => {
    const group = document.createElement('fieldset');
    group.className = 'survey-question';
    const legend = document.createElement('legend');
    legend.textContent = `${i + 1}. ${q.text}`;
    group.appendChild(legend);
    if (q.note) {
      const note = document.createElement('p');
      note.className = 'hint';
      note.textContent = q.note;
      group.appendChild(note);
    }
    const row = document.createElement('div');
    row.className = 'survey-options';
    q.options.forEach(([value, label]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'survey-option';
      button.textContent = label;
      button.dataset.value = value;
      button.addEventListener('click', () => choose(q, value));
      row.appendChild(button);
    });
    group.appendChild(row);
    group.dataset.key = q.key;
    questionsBox.appendChild(group);
  });
  showAnswers();
}

function choose(q, value) {
  if (q.many) {
    const current = new Set(answers[q.key] || []);
    if (current.has(value)) current.delete(value); else current.add(value);
    answers[q.key] = q.options.map(([v]) => v).filter((v) => current.has(v));
  } else {
    answers[q.key] = answers[q.key] === value ? undefined : value;
  }
  if (answers[q.key] === undefined || (Array.isArray(answers[q.key]) && !answers[q.key].length)) delete answers[q.key];
  say('');
  showAnswers();
}

function showAnswers() {
  questionsBox.querySelectorAll('.survey-question').forEach((group) => {
    const picked = answers[group.dataset.key];
    group.querySelectorAll('.survey-option').forEach((button) => {
      const on = Array.isArray(picked) ? picked.includes(button.dataset.value) : picked === button.dataset.value;
      button.setAttribute('aria-pressed', String(on));
    });
  });
}

// Turn the answers into a short list of pages to try.
export function recommend(a) {
  const goals = a.goals || [];
  const recs = [];
  const add = (href, icon, title, text) => { if (!recs.some((r) => r.href === href)) recs.push({ href, icon, title, text }); };
  if (a.scam_contact === 'yes' || a.scam_contact === 'not-sure' || goals.includes('scams')) {
    add('/scam-trainer/', '🛡️', 'Spot the Scam', a.scam_contact === 'yes'
      ? 'Since you got a scam this year, practice spotting the red flags before the next one.'
      : 'Learn the red flags in scam messages, one round at a time.');
  }
  if (goals.includes('games')) {
    add('/bingo/play/', '🎱', 'Bingo', 'Large-print Bingo with a speaking caller.');
    add('/geography/', '🌍', 'Size It Up', 'Guess how big places really are, against a bot or a friend.');
  }
  if (goals.includes('exercise') || (a.events || []).includes('exercise')) {
    add('/movement/play/', '🙆', 'Movement Games', 'Seated exercises as games, using your webcam privately.');
  }
  if (goals.includes('events') || goals.includes('tech-help') || (a.events || []).length) {
    add('/events/', '📅', 'Upcoming Events', 'See what Friends of Poway Seniors has coming up.');
  }
  if (a.volunteer === 'yes' || a.volunteer === 'maybe') {
    add('/donate/', '🤝', 'Get Involved', 'Thank you! See how you can help Friends of Poway Seniors.');
  }
  if (!recs.length) add('/play/', '⭐', 'Play & Learn', 'Browse all our games and practice.');
  // Easier games first for people who are just starting with technology.
  if (a.comfort === 'starting') recs.sort((x, y) => (x.href === '/movement/play/') - (y.href === '/movement/play/'));
  return recs;
}

function showRecommendations() {
  const recs = recommend(answers);
  // Each recommendation is a program card, like the ones on the Play & Learn page.
  recBox.replaceChildren(...recs.map((r) => {
    const link = document.createElement('a');
    link.className = 'program';
    link.href = SITE + r.href;
    link.innerHTML = '<h3></h3><p></p><span class="program-go">Go</span>';
    link.querySelector('h3').textContent = r.title;
    link.querySelector('p').textContent = r.text;
    return link;
  }));
  results.hidden = false;
}

async function load() {
  answers = readLocal();
  try {
    const me = await fetch(`${pythonURI}/api/id`, fetchOptions);
    if (me.ok) {
      const user = await me.json();
      signedIn = true;
      statusText.textContent = `Signed in as ${user.name}. Your answers are saved to your account.`;
      const response = await fetch(`${pythonURI}/api/fops/profile/interests`, fetchOptions);
      if (response.ok) {
        const body = await response.json();
        if (body.answers) answers = body.answers;
      } else if (response.status === 403) {
        statusText.textContent = `Signed in as ${user.name}. Your account is waiting for a volunteer to approve it, so for now your answers are saved in this browser.`;
        signedIn = false;
      }
    }
  } catch (e) { /* server unreachable: keep the browser copy */ }
  if (!signedIn && !statusText.textContent.includes('waiting')) {
    statusText.innerHTML = `You're not signed in, so your answers are saved in this browser only. <a href="${SITE}/signin/">Sign in</a> to keep them on any computer.`;
  }
  renderQuestions();
  if (Object.keys(answers).length) showRecommendations();
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!Object.keys(answers).length) {
    say('Tap at least one answer first.', 'error');
    return;
  }
  writeLocal(answers);
  if (signedIn) {
    say('Saving…');
    try {
      const response = await fetch(`${pythonURI}/api/fops/profile/interests`, {
        ...fetchOptions,
        method: 'PUT',
        body: JSON.stringify({ answers }),
      });
      say(response.ok ? 'Saved to your account.' : 'Saved in this browser. We could not reach your account right now.', response.ok ? 'ok' : 'error');
    } catch (e) {
      say('Saved in this browser. We could not reach your account right now.', 'error');
    }
  } else {
    say('Saved in this browser.', 'ok');
  }
  showRecommendations();
  results.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

load();
