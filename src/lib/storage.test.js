import { describe, expect, it } from 'vitest';
import { normalizeState } from './storage.js';

describe('normalizeState', () => {
  it('membuang id pelajaran yang tidak dikenal', () => {
    const state = normalizeState({ completed: ['m00-l01', 'palsu'], bookmarks: ['palsu'] });
    expect(state.completed).toEqual(['m00-l01']);
    expect(state.bookmarks).toEqual([]);
    expect(state.schema).toBe(2);
  });

  it('membatasi catatan dan menyaring kuis rusak', () => {
    const state = normalizeState({
      notes: { 'm00-l01': 'x'.repeat(20_000) },
      quizzes: {
        'm02-l01': { choice: 0, correct: true, attempts: 0 },
        'm00-l02': { choice: 'satu', correct: true },
      },
    });
    expect(state.notes['m00-l01']).toHaveLength(10_000);
    expect(state.quizzes['m02-l01']).toMatchObject({
      correct: true,
      attempts: 1,
      answers: { q1: { choice: 0, correct: true, attempts: 1 } },
    });
    expect(state.quizzes['m00-l02']).toBeUndefined();
  });

  it('menormalkan progres baca dan checklist persiapan', () => {
    const state = normalizeState({
      reading: {
        'm00-l01': { sections: ['model-mental', 'tidak-ada'], updatedAt: '2026-10-28T00:00:00.000Z' },
      },
      setup: { platform: 'linux', completed: ['node', 'palsu'] },
    });
    expect(state.reading['m00-l01'].sections).toEqual(['model-mental']);
    expect(state.setup.platform).toBe('linux');
    expect(state.setup.completed).toEqual(['node']);
  });

  it('menormalkan pilihan tampilan', () => {
    expect(normalizeState({ settings: { appearance: 'terang' } }).settings.appearance).toBe('terang');
    expect(normalizeState({ settings: { appearance: 'malam' } }).settings.appearance).toBe('malam');
    expect(normalizeState({ settings: { appearance: 'palsu' } }).settings.appearance).toBe('nyaman');
    expect(normalizeState({}).settings.appearance).toBe('nyaman');
  });

  it('mengembalikan state default untuk data rusak', () => {
    expect(normalizeState(null).completed).toEqual([]);
    expect(normalizeState([]).schema).toBe(2);
    expect(normalizeState('x').labMode).toBe('js');
  });
});
