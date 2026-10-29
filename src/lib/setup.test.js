import { describe, expect, it } from 'vitest';
import { SETUP_ITEMS, setupProgress } from './setup.js';

describe('setupProgress', () => {
  it('menghitung checklist dari daftar item', () => {
    expect(setupProgress([])).toMatchObject({ finished: 0, total: SETUP_ITEMS.length, complete: false });
    expect(setupProgress(SETUP_ITEMS.map((item) => item.id))).toMatchObject({
      finished: SETUP_ITEMS.length,
      percent: 100,
      complete: true,
    });
  });

  it('mengabaikan id yang tidak dikenal', () => {
    const progress = setupProgress(['node', 'tidak-ada']);
    expect(progress.finished).toBe(1);
    expect(progress.complete).toBe(false);
  });
});
