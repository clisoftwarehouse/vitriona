import { createHmac, timingSafeEqual } from 'crypto';

const getSecret = () => {
  const secret = process.env.UPGRADE_SECRET;
  if (!secret) throw new Error('UPGRADE_SECRET env var is not set');
  return secret;
};

export function signUpgradeToken(requestId: string): string {
  return createHmac('sha256', getSecret()).update(requestId).digest('hex');
}

export function verifyUpgradeToken(requestId: string, token: string): boolean {
  const expected = signUpgradeToken(requestId);
  if (expected.length !== token.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(token));
}
