import crypto from 'crypto';

import { OTP_CONFIG } from '@/modules/auth/constants';

export const generateOtp = (): string => Math.floor(100000 + Math.random() * 900000).toString();

export const hashOtp = (otp: string): string => crypto.createHash('sha256').update(otp).digest('hex');

export const otpExpiresAt = (): Date => new Date(Date.now() + OTP_CONFIG.EXPIRY_MINUTES * 60 * 1000);
