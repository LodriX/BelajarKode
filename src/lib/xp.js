import { lessonById, modules } from '../data/curriculum.js';
import { XP } from './constants.js';
import { dailyQuests } from './streak.js';

export function computeXp(state) {
  const xp = {};
  const completed = new Set(state.completed ?? []);

  for (const id of completed) {
    if (lessonById.has(id)) xp[`lesson:${id}`] = XP.lesson;
  }

  for (const [id, quiz] of Object.entries(state.quizzes ?? {})) {
    if (!lessonById.has(id) || !quiz?.correct) continue;
    const attempts = Number(quiz.attempts) || 1;
    xp[`quiz:${id}`] = attempts > 1 ? XP.quizRetry : XP.quizFirst;
  }

  for (const module of modules) {
    const total = module.lessons.length;
    if (total > 0 && module.lessons.every((lesson) => completed.has(lesson.id))) {
      xp[`module:${module.id}`] = XP.module;
    }
  }

  for (const [date, entry] of Object.entries(state.activity ?? {})) {
    if (dailyQuests(entry).every((quest) => quest.done)) xp[`daily:${date}`] = XP.daily;
  }

  for (const milestone of state.milestones ?? []) {
    if (milestone === 'streak-7') xp['streak:7'] = XP.streak7;
    if (milestone === 'streak-30') xp['streak:30'] = XP.streak30;
  }

  return xp;
}

export function totalXp(state) {
  return Object.values(computeXp(state)).reduce((sum, value) => sum + value, 0);
}

export function xpDiff(before, after) {
  const previous = before ?? {};
  return Object.entries(after ?? {})
    .filter(([key, value]) => value > 0 && previous[key] !== value)
    .map(([key, value]) => ({ key, value, delta: value - (previous[key] ?? 0) }));
}
