import { createHash, randomBytes } from 'crypto';

export function base64url(input: Buffer) {
  return input
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

export function generateVerifier(length = 64) {
  return base64url(randomBytes(length));
}

export function generateChallenge(verifier: string) {
  const hash = createHash('sha256').update(verifier).digest();
  return base64url(hash);
}
