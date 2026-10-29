import { describe, expect, it } from 'vitest';
import { defaultState } from './storage.js';
import { computeXp, totalXp } from './xp.js';
import { levelForXp } from './constants.js';

function stateWith(patch) {
  return { ...defaultState(), ...patch };
}

const quizRecord = (attempts = 1) => ({
  answers: { q1: { choice: 0, correct: true, attempts } },
  correct: true,
  attempts,
});

describe('computeXp', () => {
  it('memberi XP untuk pelajaran yang selesai', () => {
    const xp = computeXp(stateWith({ completed: ['m01-l01'] }));
    expect(xp['lesson:m01-l01']).toBe(200);
  });

  it('membedakan kuis percobaan pertama dan ulang', () => {
    const first = computeXp(stateWith({ quizzes: { 'm01-l01': quizRecord(1) } }));
    const retry = computeXp(stateWith({ quizzes: { 'm01-l01': quizRecord(2) } }));
    expect(first['quiz:m01-l01']).toBe(80);
    expect(retry['quiz:m01-l01']).toBe(20);
  });

  it('tetap memberi XP percobaan pertama untuk kuis banyak pertanyaan', () => {
    const xp = computeXp(
      stateWith({
        quizzes: {
          'm01-l01': {
            answers: {
              q1: { choice: 0, correct: true, attempts: 1 },
              q2: { choice: 1, correct: true, attempts: 1 },
              q3: { choice: 2, correct: true, attempts: 1 },
            },
            correct: true,
            attempts: 1,
          },
        },
      }),
    );
    expect(xp['quiz:m01-l01']).toBe(80);
  });

  it('mengabaikan kuis yang salah dan id tidak dikenal', () => {
    const xp = computeXp(
      stateWith({
        completed: ['tidak-ada'],
        quizzes: { 'tidak-ada': quizRecord(1) },
      }),
    );
    expect(totalXp(stateWith({ xp }))).toBe(0);
  });

  it('memberi bonus modul ketika semua pelajaran selesai', () => {
    const allM01 = ['m01-l01', 'm01-l02', 'm01-l03', 'm01-l04', 'm01-l05', 'm01-l06'];
    const xp = computeXp(stateWith({ completed: allM01 }));
    expect(xp['module:m01']).toBe(300);
    expect(Object.values(xp).reduce((a, b) => a + b, 0)).toBe(1200 + 300);
  });

  it('memberi bonus quest harian sekali per tanggal', () => {
    const xp = computeXp(
      stateWith({
        activity: {
          '2026-10-28': { lessons: ['m01-l01'], quizzes: ['m01-l01'], lab: 1 },
        },
      }),
    );
    expect(xp['daily:2026-10-28']).toBe(100);
  });

  it('menambahkan bonus milestone streak', () => {
    const xp = computeXp(stateWith({ milestones: ['streak-7', 'streak-30'] }));
    expect(xp['streak:7']).toBe(200);
    expect(xp['streak:30']).toBe(1000);
  });
});

describe('levelForXp', () => {
  it('menghitung level dan progres berikutnya', () => {
    expect(levelForXp(0)).toMatchObject({ level: 1, name: 'Pemula', remaining: 600 });
    expect(levelForXp(600)).toMatchObject({ level: 2, name: 'Perancang' });
    expect(levelForXp(18200)).toMatchObject({ level: 10, name: 'Veteran', nextAt: null });
  });
});
