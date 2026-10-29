import { describe, expect, it } from 'vitest';
import { createSalt, hashPin, validatePin, verifyPin } from './auth.js';

const FAST = 2_000;

describe('PIN', () => {
  it('hanya menerima enam digit angka', () => {
    expect(validatePin('123456')).toBeNull();
    expect(validatePin('12345')).not.toBeNull();
    expect(validatePin('abcdef')).not.toBeNull();
  });

  it('hash cocok dengan PIN yang sama dan tidak dengan PIN lain', async () => {
    const salt = createSalt();
    const hash = await hashPin('123456', salt, FAST);
    const profile = { salt, hash, iterations: FAST };
    expect(await verifyPin('123456', profile)).toBe(true);
    expect(await verifyPin('654321', profile)).toBe(false);
  });

  it('menghasilkan hash berbeda untuk salt berbeda', async () => {
    const first = await hashPin('123456', createSalt(), FAST);
    const second = await hashPin('123456', createSalt(), FAST);
    expect(first).not.toBe(second);
  });
});
