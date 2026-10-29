import { lessonById, modules, totalLessons, totalModules } from '../data/curriculum.js';

export const BADGES = Object.freeze([
  { id: 'first-lesson', title: 'Langkah pertama', detail: 'Selesaikan satu pelajaran.', icon: 'flag', test: (c) => c.completedCount >= 1 },
  { id: 'first-quiz', title: 'Jawaban benar', detail: 'Jawab satu kuis dengan benar.', icon: 'check', test: (c) => c.quizCorrect >= 1 },
  { id: 'ten-lessons', title: 'Sepuluh pelajaran', detail: 'Selesaikan 10 pelajaran.', icon: 'stack', test: (c) => c.completedCount >= 10 },
  { id: 'twentyfive-lessons', title: 'Seperempat jalan', detail: 'Selesaikan 25 pelajaran.', icon: 'stack', test: (c) => c.completedCount >= 25 },
  { id: 'fifty-lessons', title: 'Setengah kurikulum', detail: 'Selesaikan 50 pelajaran.', icon: 'stack', test: (c) => c.completedCount >= 50 },
  { id: 'all-lessons', title: 'Kurikulum selesai', detail: 'Selesaikan seluruh pelajaran.', icon: 'trophy', test: (c) => c.completedCount >= c.totalLessons },
  { id: 'first-module', title: 'Modul pertama', detail: 'Selesaikan satu modul.', icon: 'module', test: (c) => c.moduleComplete >= 1 },
  { id: 'five-modules', title: 'Lima modul', detail: 'Selesaikan lima modul.', icon: 'module', test: (c) => c.moduleComplete >= 5 },
  { id: 'all-modules', title: 'Semua modul', detail: 'Selesaikan seluruh modul.', icon: 'module', test: (c) => c.moduleComplete >= c.totalModules },
  { id: 'streak-7', title: 'Tujuh hari', detail: 'Belajar tujuh hari berturut-turut.', icon: 'streak', test: (c) => c.streak >= 7 },
  { id: 'streak-30', title: 'Tiga puluh hari', detail: 'Belajar 30 hari berturut-turut.', icon: 'streak', test: (c) => c.streak >= 30 },
  { id: 'lab-builder', title: 'Rajin berlatih', detail: 'Jalankan kode di Lab kode 25 kali.', icon: 'lab', test: (c) => c.labRuns >= 25 },
]);

export function buildContext(state, streak) {
  const completed = new Set(state.completed ?? []);
  const validCompleted = [...completed].filter((id) => lessonById.has(id));
  const quizCorrect = Object.entries(state.quizzes ?? {}).filter(
    ([id, quiz]) => lessonById.has(id) && quiz?.correct,
  ).length;
  const moduleComplete = modules.filter(
    (module) => module.lessons.length > 0 && module.lessons.every((lesson) => completed.has(lesson.id)),
  ).length;
  const labRuns = Object.values(state.activity ?? {}).reduce(
    (sum, entry) => sum + (Number(entry?.lab) || 0),
    0,
  );

  return {
    completedCount: validCompleted.length,
    quizCorrect,
    moduleComplete,
    streak,
    labRuns,
    totalLessons,
    totalModules,
  };
}

export function evaluateBadges(context) {
  return BADGES.filter((badge) => badge.test(context)).map((badge) => badge.id);
}
