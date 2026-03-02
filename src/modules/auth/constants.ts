export const AUTH_ROUTES = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  FORGOT_PASSWORD: '/auth/forgot-password',
  VERIFY_OTP: '/auth/verify-otp',
  RESET_PASSWORD: '/auth/reset-password',
} as const;

export const PROTECTED_ROUTES = ['/dashboard'];

export const OTP_CONFIG = {
  LENGTH: 6,
  EXPIRY_MINUTES: 10,
} as const;

export const RESET_TOKEN_EXPIRY_MINUTES = 30;

export type OtpPurpose = 'email_verification' | 'password_reset';
