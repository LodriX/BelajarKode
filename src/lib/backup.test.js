import { describe, expect, it } from 'vitest';
import { buildBackup, parseBackup } from './backup.js';
import { defaultState } from './storage.js';

describe('backup', () => {
  it('membangun dan memulihkan state', () => {
    const state = {
      ...defaultState(),
      completed: ['m00-l01'],
      notes: { 'm00-l01': 'catatan' },
      reading: { 'm00-l01': { sections: ['model-mental'], updatedAt: null } },
      setup: { platform: 'linux', completed: ['node'], startedAt: null, readyAt: null },
      activity: { '2026-10-28': { lessons: ['m00-l01'], quizzes: [], lab: 2 } },
    };
    const payload = buildBackup({ name: 'Ayu' }, state);
    const restored = parseBackup(JSON.stringify(payload));
    expect(restored.schema).toBe(2);
    expect(restored.state.completed).toEqual(['m00-l01']);
    expect(restored.state.notes['m00-l01']).toBe('catatan');
    expect(restored.state.reading['m00-l01'].sections).toEqual(['model-mental']);
    expect(restored.state.setup.completed).toEqual(['node']);
    expect(restored.state.activity['2026-10-28'].lab).toBe(2);
  });

  it('menerima backup schema 1 lama', () => {
    const legacy = {
      format: 'BelajarKode-user-backup',
      schema: 1,
      data: {
        completed: ['m00-l01'],
        bookmarks: [],
        notes: {},
        quizzes: { 'm00-l01': { choice: 0, correct: true } },
      },
    };
    const restored = parseBackup(JSON.stringify(legacy));
    expect(restored.state.completed).toEqual(['m00-l01']);
    expect(restored.state.quizzes['m00-l01'].attempts).toBe(1);
  });

  it('menolak format yang tidak dikenal', () => {
    expect(() => parseBackup('{"format":"lain"}')).toThrow();
    expect(() => parseBackup('bukan json')).toThrow();
  });
});
