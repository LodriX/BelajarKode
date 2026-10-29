import raw from '../../data/curriculum.json';

export const curriculum = raw;
export const modules = raw.modules;
export const lessons = raw.modules.flatMap((module) =>
  module.lessons.map((lesson) => ({ ...lesson, moduleId: module.id })),
);
export const lessonById = new Map(lessons.map((lesson) => [lesson.id, lesson]));
export const moduleById = new Map(modules.map((module) => [module.id, module]));

export const totalLessons = lessons.length;
export const totalModules = modules.length;
export const totalMinutes = lessons.reduce((sum, lesson) => sum + (Number(lesson.minutes) || 0), 0);

export function lessonsOfModule(moduleId) {
  return moduleById.get(moduleId)?.lessons ?? [];
}

export function nextLesson(completed = []) {
  const done = new Set(completed);
  return lessons.find((lesson) => !done.has(lesson.id)) ?? lessons[lessons.length - 1];
}

export function moduleProgress(module, completed = []) {
  const done = new Set(completed);
  const total = module.lessons.length;
  const finished = module.lessons.filter((lesson) => done.has(lesson.id)).length;
  return { total, finished, percent: total ? Math.round((finished / total) * 100) : 0 };
}

export function lessonSearchText(lesson) {
  return [
    lesson.title,
    ...(lesson.objectives ?? []),
    ...(lesson.sections ?? []).flatMap((section) => [
      section.title,
      ...(section.body ?? []),
      ...(section.callouts ?? []).flatMap((callout) => [callout.title, callout.body]),
      section.checkpoint?.prompt,
      section.checkpoint?.success,
    ]),
    ...(lesson.terms ?? []).flatMap((term) => [term.term, term.definition]),
    ...(lesson.practice ?? []).flatMap((item) => [item.title, item.task, ...(item.steps ?? [])]),
    ...(lesson.quiz?.questions ?? []).flatMap((question) => [
      question.question,
      ...(question.options ?? []),
    ]),
    ...(lesson.summary ?? []),
  ]
    .filter(Boolean)
    .join(' ');
}

export function searchLessons(query, limit = 20) {
  const term = query.trim().toLowerCase();
  if (!term) return [];
  return lessons
    .filter((lesson) => {
      const module = moduleById.get(lesson.moduleId);
      return `${lessonSearchText(lesson)} ${module?.title ?? ''}`.toLowerCase().includes(term);
    })
    .slice(0, limit);
}

export function weekModule(week) {
  return modules.find((module) => module.weeks.includes(week));
}
