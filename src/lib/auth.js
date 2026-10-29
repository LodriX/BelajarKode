import { pbkdf2Async } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, hexToBytes, randomBytes, utf8ToBytes } from '@noble/hashes/utils.js';

export const PIN_LENGTH = 6;
export const KDF_ITERATIONS = 150_000;
export const MAX_ATTEMPTS = 5;

export function validatePin(pin) {
  if (!/^\d{6}$/.test(String(pin ?? ''))) return 'PIN harus 6 digit angka.';
  return null;
}

export function createSalt() {
  return bytesToHex(randomBytes(16));
}

export async function hashPin(pin, salt, iterations = KDF_ITERATIONS) {
  const derived = await pbkdf2Async(sha256, utf8ToBytes(String(pin)), hexToBytes(salt), {
    c: Number(iterations) || KDF_ITERATIONS,
    dkLen: 32,
  });
  return bytesToHex(derived);
}

export async function verifyPin(pin, profile) {
  if (!profile?.salt || !profile?.hash) return false;
  const candidate = await hashPin(pin, profile.salt, profile.iterations);
  return safeEqual(candidate, profile.hash);
}

function safeEqual(left, right) {
  const a = String(left ?? '');
  const b = String(right ?? '');
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
