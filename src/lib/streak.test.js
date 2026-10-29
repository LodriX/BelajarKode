import { describe, expect, it } from 'vitest';
import { computeStreak, dailyQuests, isActiveDay } from './streak.js';

describe('computeStreak', () => {
  it('menghitung hari aktif berturut-turut sampai hari ini', () => {
    const activity = {
      '2026-10-28': { lessons: ['a'], quizzes: [], lab: 0 },
      '2026-10-27': { lessons: [], quizzes: ['a'], lab: 0 },
      '2026-10-26': { lessons: ['b'], quizzes: [], lab: 0 },
    };
    expect(computeStreak(activity, '2026-10-28')).toBe(3);
  });

  it('tetap menghitung jika hari ini belum aktif tetapi kemarin aktif', () => {
    const activity = {
      '2026-10-27': { lessons: ['a'], quizzes: [], lab: 0 },
      '2026-10-26': { lessons: ['b'], quizzes: [], lab: 0 },
    };
    expect(computeStreak(activity, '2026-10-28')).toBe(2);
  });

  it('kembali nol jika hari ini dan kemarin tidak aktif', () => {
    expect(computeStreak({ '2026-10-25': { lessons: ['a'] } }, '2026-10-28')).toBe(0);
  });
});

describe('dailyQuests', () => {
  it('menandai tiga quest selesai', () => {
    const quests = dailyQuests({ lessons: ['a'], quizzes: ['a'], lab: 1 });
    expect(quests.map((quest) => quest.done)).toEqual([true, true, true]);
  });

  it('belum selesai bila lab belum dijalankan', () => {
    const quests = dailyQuests({ lessons: ['a'], quizzes: ['a'], lab: 0 });
    expect(quests.map((quest) => quest.done)).toEqual([true, true, false]);
  });
});

describe('isActiveDay', () => {
  it('menganggap hari aktif hanya jika ada pelajaran atau kuis', () => {
    expect(isActiveDay({ lessons: [], quizzes: [], lab: 3 })).toBe(false);
    expect(isActiveDay({ lessons: ['a'], quizzes: [], lab: 0 })).toBe(true);
  });
});
