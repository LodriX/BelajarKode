import { lessonById } from '../data/curriculum.js';
import { PROFILE_COLORS } from './constants.js';
import { SETUP_ITEMS } from './setup.js';

const NS = 'bk.v2';

export const KEYS = Object.freeze({
  profiles: `${NS}.profiles`,
  state: (id) => `${NS}.state.${id}`,
  session: `${NS}.session`,
  remember: `${NS}.remember`,
  legacy: 'belajarkode-user-v1',
});

export const DEFAULT_LAB = {
  js: 'const angka = [2, 4, 6, 8];\nconst total = angka.reduce((sum, n) => sum + n, 0);\nconsole.log("Total:", total);',
  html: '<!doctype html>\n<html lang="id">\n<head><meta charset="utf-8">\n<style>\n  body { font-family: sans-serif; padding: 24px; }\n  h1 { color: #0b7a5b; }\n</style></head>\n<body>\n  <h1>Halo, programmer!</h1>\n  <p>Ubah tampilan ini sesukamu.</p>\n</body></html>',
  json: '{\n  "nama": "BelajarKode",\n  "totalModul": 13,\n  "offline": true\n}',
};

function readJSON(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function removeKey(key) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* storage unavailable */
  }
}

export function defaultState() {
  return {
    schema: 2,
    completed: [],
    bookmarks: [],
    notes: {},
    quizzes: {},
    reading: {},
    setup: { platform: 'windows', completed: [], startedAt: null, readyAt: null },
    labMode: 'js',
    labCode: DEFAULT_LAB.js,
    history: [],
    dailyGoal: 1,
    xp: {},
    milestones: [],
    activity: {},
    badges: {},
    settings: { appearance: 'nyaman', contrast: 'normal', motion: 'system' },
    lastBackupAt: null,
    updatedAt: null,
  };
}

function stringArray(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === 'string') : [];
}

function objectValue(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

export function normalizeState(raw) {
  const base = defaultState();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return base;
  const next = { ...base, ...raw };

  next.schema = 2;
  next.completed = [...new Set(stringArray(raw.completed).filter((id) => lessonById.has(id)))];
  next.bookmarks = [...new Set(stringArray(raw.bookmarks).filter((id) => lessonById.has(id)))];
  next.history = stringArray(raw.history).filter((id) => lessonById.has(id)).slice(0, 30);
  next.milestones = [...new Set(stringArray(raw.milestones))].filter((id) =>
    ['streak-7', 'streak-30'].includes(id),
  );

  next.notes = {};
  for (const [id, value] of Object.entries(objectValue(raw.notes))) {
    if (lessonById.has(id) && typeof value === 'string') next.notes[id] = value.slice(0, 10_000);
  }

  next.quizzes = {};
  for (const [id, value] of Object.entries(objectValue(raw.quizzes))) {
    if (!lessonById.has(id) || !value || typeof value !== 'object') continue;
    const lesson = lessonById.get(id);
    const questions = lesson.quiz?.questions ?? [];
    if (!questions.length) continue;
    const answers = {};
    const rawAnswers = objectValue(value.answers);
    const modernShape = Object.keys(rawAnswers).length > 0;
    if (modernShape) {
      for (const question of questions) {
        const answer = rawAnswers[question.id];
        if (!answer || typeof answer !== 'object') continue;
        const choice = Number(answer.choice);
        if (!Number.isInteger(choice) || choice < 0 || choice >= question.options.length) continue;
        answers[question.id] = {
          choice,
          correct: Boolean(answer.correct),
          attempts: Math.max(1, Math.min(50, Number(answer.attempts) || 1)),
        };
      }
    } else {
      const choice = Number(value.choice);
      if (!Number.isInteger(choice) || choice < 0 || choice >= questions[0].options.length) continue;
      answers[questions[0].id] = {
        choice,
        correct: Boolean(value.correct),
        attempts: Math.max(1, Math.min(50, Number(value.attempts) || 1)),
      };
    }
    if (Object.keys(answers).length === 0) continue;
    next.quizzes[id] = {
      answers,
      // Rekaman lama hanya menyimpan hasil satu kuis. Pertahankan nilai `correct`
      // dari rekaman itu agar progres pengguna lama tidak berubah menjadi gagal
      // ketika pelajarannya kini memiliki beberapa pertanyaan.
      correct: modernShape
        ? questions.every((question) => answers[question.id]?.correct)
        : Boolean(value.correct),
      attempts: Math.max(...Object.values(answers).map((answer) => answer.attempts)),
    };
  }

  next.reading = {};
  for (const [id, value] of Object.entries(objectValue(raw.reading))) {
    if (!lessonById.has(id) || !value || typeof value !== 'object') continue;
    const lesson = lessonById.get(id);
    const validSections = new Set(lesson.sections?.map((section) => section.id) ?? []);
    const sections = [...new Set(stringArray(value.sections))].filter((section) => validSections.has(section));
    next.reading[id] = {
      sections,
      updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : null,
    };
  }

  const setup = objectValue(raw.setup);
  const setupIds = new Set(SETUP_ITEMS.map((item) => item.id));
  next.setup = {
    platform: ['windows', 'macos', 'linux'].includes(setup.platform) ? setup.platform : 'windows',
    completed: [...new Set(stringArray(setup.completed))].filter((id) => setupIds.has(id)),
    startedAt: typeof setup.startedAt === 'string' ? setup.startedAt : null,
    readyAt: typeof setup.readyAt === 'string' ? setup.readyAt : null,
  };

  next.activity = {};
  for (const [date, value] of Object.entries(objectValue(raw.activity))) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !value || typeof value !== 'object') continue;
    next.activity[date] = {
      lessons: stringArray(value.lessons).filter((id) => lessonById.has(id)),
      quizzes: stringArray(value.quizzes).filter((id) => lessonById.has(id)),
      lab: Math.max(0, Math.min(10_000, Number(value.lab) || 0)),
    };
  }

  next.badges = {};
  for (const [id, value] of Object.entries(objectValue(raw.badges))) {
    if (typeof value === 'string') next.badges[id] = value;
  }

  next.xp = objectValue(raw.xp);
  next.settings = { ...base.settings, ...objectValue(raw.settings) };
  if (!['nyaman', 'terang', 'malam'].includes(next.settings.appearance)) {
    next.settings.appearance = 'nyaman';
  }
  if (!['normal', 'high'].includes(next.settings.contrast)) next.settings.contrast = 'normal';
  if (!['system', 'reduce'].includes(next.settings.motion)) next.settings.motion = 'system';

  next.labMode = ['js', 'html', 'json'].includes(raw.labMode) ? raw.labMode : 'js';
  next.labCode = typeof raw.labCode === 'string' ? raw.labCode.slice(0, 150_000) : DEFAULT_LAB.js;
  next.dailyGoal = Math.max(1, Math.min(5, Number(raw.dailyGoal) || 1));
  next.lastBackupAt = typeof raw.lastBackupAt === 'string' ? raw.lastBackupAt : null;
  next.updatedAt = typeof raw.updatedAt === 'string' ? raw.updatedAt : null;
  return next;
}

export function loadProfiles() {
  const data = readJSON(KEYS.profiles, null);
  if (!data || !Array.isArray(data.profiles)) return [];
  return data.profiles.filter(
    (profile) => profile && typeof profile.id === 'string' && typeof profile.name === 'string',
  );
}

export function saveProfiles(profiles) {
  return writeJSON(KEYS.profiles, { version: 2, profiles });
}

export function createProfileRecord({ name, salt, hash, iterations, guest = false, color }) {
  const id = `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const palette = PROFILE_COLORS;
  return {
    id,
    name: String(name ?? '').trim().slice(0, 24) || 'Profil',
    color: color ?? palette[Math.floor(Math.random() * palette.length)],
    guest: Boolean(guest),
    salt: salt ?? null,
    hash: hash ?? null,
    iterations: iterations ?? null,
    createdAt: new Date().toISOString(),
    lastLoginAt: null,
    failedAttempts: 0,
    lockedUntil: null,
  };
}

export function loadState(profileId) {
  return normalizeState(readJSON(KEYS.state(profileId), null));
}

export function saveState(profileId, state) {
  return writeJSON(KEYS.state(profileId), state);
}

export function deleteState(profileId) {
  removeKey(KEYS.state(profileId));
}

export function storageAvailable() {
  try {
    const key = `${NS}.probe`;
    window.localStorage.setItem(key, '1');
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function readLegacyState() {
  const raw = readJSON(KEYS.legacy, null);
  if (!raw || typeof raw !== 'object') return null;
  return normalizeState(raw);
}

export function clearLegacyState() {
  removeKey(KEYS.legacy);
}

export function getSessionProfileId() {
  try {
    const session = JSON.parse(window.sessionStorage.getItem(KEYS.session) || 'null');
    if (session?.profileId) return session.profileId;
  } catch {
    /* ignore */
  }
  return readJSON(KEYS.remember, null)?.profileId ?? null;
}

export function setSessionProfileId(profileId, remember = false) {
  try {
    window.sessionStorage.setItem(KEYS.session, JSON.stringify({ profileId }));
  } catch {
    /* ignore */
  }
  if (remember) writeJSON(KEYS.remember, { profileId });
  else removeKey(KEYS.remember);
}

export function clearSession() {
  try {
    window.sessionStorage.removeItem(KEYS.session);
  } catch {
    /* ignore */
  }
  removeKey(KEYS.remember);
}
