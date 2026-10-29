import { shiftDay, todayKey } from './dates.js';

export function isActiveDay(entry) {
  return Boolean(entry && ((entry.lessons?.length ?? 0) > 0 || (entry.quizzes?.length ?? 0) > 0));
}

export function computeStreak(activity = {}, today = todayKey()) {
  let cursor = today;
  if (!isActiveDay(activity[cursor])) cursor = shiftDay(cursor, -1);
  let streak = 0;
  while (isActiveDay(activity[cursor])) {
    streak += 1;
    cursor = shiftDay(cursor, -1);
    if (streak > 3650) break;
  }
  return streak;
}

export function dailyQuests(entry) {
  const lessons = new Set(entry?.lessons ?? []);
  const quizzes = new Set(entry?.quizzes ?? []);
  const lab = Number(entry?.lab ?? 0);
  return [
    { id: 'lesson', label: 'Selesaikan satu pelajaran', done: lessons.size >= 1 },
    { id: 'quiz', label: 'Jawab satu kuis dengan benar', done: quizzes.size >= 1 },
    { id: 'lab', label: 'Jalankan satu contoh di Lab kode', done: lab >= 1 },
  ];
}

export function ensureDay(state, date = todayKey()) {
  state.activity ??= {};
  state.activity[date] ??= { lessons: [], quizzes: [], lab: 0 };
  const entry = state.activity[date];
  if (!Array.isArray(entry.lessons)) entry.lessons = [];
  if (!Array.isArray(entry.quizzes)) entry.quizzes = [];
  entry.lab = Number(entry.lab) || 0;
  return entry;
}

export function recordLessonDay(state, lessonId, date = todayKey()) {
  const entry = ensureDay(state, date);
  if (!entry.lessons.includes(lessonId)) entry.lessons.push(lessonId);
}

export function recordQuizDay(state, lessonId, date = todayKey()) {
  const entry = ensureDay(state, date);
  if (!entry.quizzes.includes(lessonId)) entry.quizzes.push(lessonId);
}

export function recordLabDay(state, date = todayKey()) {
  const entry = ensureDay(state, date);
  entry.lab += 1;
}
