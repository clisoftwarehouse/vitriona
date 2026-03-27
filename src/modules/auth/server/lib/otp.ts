import crypto from 'crypto';

import { OTP_CONFIG } from '@/modules/auth/constants';

export const generateOtp = (): string => crypto.randomInt(100000, 999999).toString();

export const hashOtp = (otp: string): string => crypto.createHash('sha256').update(otp).digest('hex');

export const otpExpiresAt = (): Date => new Date(Date.now() + OTP_CONFIG.EXPIRY_MINUTES * 60 * 1000);
