export const XP = Object.freeze({
  lesson: 200,
  quizFirst: 80,
  quizRetry: 20,
  module: 300,
  daily: 100,
  streak7: 200,
  streak30: 1000,
});

export const LEVELS = Object.freeze([
  { min: 0, name: 'Pemula' },
  { min: 600, name: 'Perancang' },
  { min: 1400, name: 'Pembangun' },
  { min: 2600, name: 'Perakit' },
  { min: 4200, name: 'Insinyur' },
  { min: 6200, name: 'Arsitek' },
  { min: 8600, name: 'Operator' },
  { min: 11400, name: 'Penjaga Sistem' },
  { min: 14600, name: 'Pemimpin Teknis' },
  { min: 18200, name: 'Veteran' },
]);

export const LEVEL_STEP = 4000;

export function levelForXp(xp) {
  const safeXp = Math.max(0, Number(xp) || 0);
  let index = 0;
  for (let i = 0; i < LEVELS.length; i += 1) {
    if (safeXp >= LEVELS[i].min) index = i;
  }
  const current = LEVELS[index];
  const next = LEVELS[index + 1] ?? null;
  const nextAt = next ? next.min : null;
  const progress = nextAt ? Math.min(1, (safeXp - current.min) / (nextAt - current.min)) : 1;
  return {
    level: index + 1,
    name: current.name,
    min: current.min,
    nextAt,
    progress,
    remaining: nextAt ? Math.max(0, nextAt - safeXp) : 0,
  };
}

export const PROFILE_COLORS = ['#5f8a72', '#7c93a8', '#b08a5a', '#b07c8e', '#8a9e6b', '#8b84ae'];

export const ROUTES = [
  { path: 'mulai', label: 'Mulai', icon: 'flag', group: 'Belajar' },
  { path: '', label: 'Beranda', icon: 'base', group: 'Belajar' },
  { path: 'path', label: 'Jalur belajar', icon: 'path', group: 'Belajar' },
  { path: 'modules', label: 'Modul', icon: 'modules', group: 'Belajar' },
  { path: 'lab', label: 'Lab kode', icon: 'lab', group: 'Latihan' },
  { path: 'lexicon', label: 'Kamus', icon: 'lexicon', group: 'Latihan' },
  { path: 'saved', label: 'Tersimpan', icon: 'saved', group: 'Profil' },
  { path: 'achievements', label: 'Pencapaian', icon: 'trophy', group: 'Profil' },
  { path: 'settings', label: 'Pengaturan', icon: 'settings', group: 'Profil' },
];

export const ROUTE_LABELS = Object.freeze(
  Object.fromEntries(ROUTES.map((route) => [route.path, route.label])),
);

export const LANGUAGE_LABELS = Object.freeze({
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  html: 'HTML',
  css: 'CSS',
  json: 'JSON',
  bash: 'Bash',
  sql: 'SQL',
  php: 'PHP',
  dart: 'Dart',
  jsx: 'JSX',
  yaml: 'YAML',
  http: 'HTTP',
  text: 'Teks',
});

export const QUIZ_TYPE_LABELS = Object.freeze({
  recall: 'Mengingat konsep',
  'code-reading': 'Membaca kode',
  scenario: 'Studi kasus',
});

export const PRACTICE_LEVEL_LABELS = Object.freeze({
  guided: 'Terbimbing',
  independent: 'Mandiri',
  transfer: 'Penerapan',
});
