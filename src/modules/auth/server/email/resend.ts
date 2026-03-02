import { Resend } from 'resend';

import { otpEmailTemplate } from './templates/otp.template';

export const resend = new Resend(process.env.RESEND_API_KEY!);
export const EMAIL_FROM = process.env.RESEND_FROM_EMAIL ?? 'noreply@clisoftwarehouse.com';

interface SendOtpEmailParams {
  email: string;
  otp: string;
  purpose: 'email_verification' | 'password_reset';
  name?: string;
}

export async function sendOtpEmail({ email, name, otp, purpose }: SendOtpEmailParams) {
  const subject =
    purpose === 'email_verification'
      ? 'Verifica tu cuenta — Vitriona'
      : 'Código para restablecer tu contraseña — Vitriona';

  await resend.emails.send({
    from: EMAIL_FROM,
    to: email,
    subject,
    html: otpEmailTemplate({ otp, purpose, name }),
  });
}
