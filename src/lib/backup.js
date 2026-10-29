import { normalizeState } from './storage.js';

export const BACKUP_FORMAT = 'BelajarKode-user-backup';
export const BACKUP_SCHEMA = 2;
export const MAX_BACKUP_BYTES = 2_000_000;

export function buildBackup(profile, state) {
  return {
    format: BACKUP_FORMAT,
    schema: BACKUP_SCHEMA,
    appVersion: '2.1.0',
    exportedAt: new Date().toISOString(),
    profileName: profile?.name ?? 'Profil',
    data: {
      completed: state.completed,
      bookmarks: state.bookmarks,
      notes: state.notes,
      quizzes: state.quizzes,
      reading: state.reading,
      setup: state.setup,
      labMode: state.labMode,
      labCode: state.labCode,
      history: state.history,
      dailyGoal: state.dailyGoal,
      activity: state.activity,
      milestones: state.milestones,
      badges: state.badges,
      settings: state.settings,
    },
  };
}

export function parseBackup(text) {
  const payload = JSON.parse(text);
  if (!payload || payload.format !== BACKUP_FORMAT) {
    throw new Error('Berkas ini bukan backup BelajarKode.');
  }
  if (![1, 2].includes(payload.schema)) {
    throw new Error(`Versi backup (${payload.schema}) tidak didukung.`);
  }
  if (!payload.data || typeof payload.data !== 'object') {
    throw new Error('Struktur backup tidak valid.');
  }
  const normalized = normalizeState(payload.data);
  return { state: normalized, schema: payload.schema, exportedAt: payload.exportedAt ?? null };
}

export function backupFilename(date = new Date()) {
  const key = date.toISOString().slice(0, 10);
  return `belajarkode-${key}.json`;
}
