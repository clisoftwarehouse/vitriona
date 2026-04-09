import { renderEmailShell, emailBrandStyles } from './brand-email';

interface OtpTemplateParams {
  otp: string;
  purpose: 'email_verification' | 'password_reset';
  name?: string;
}

export function otpEmailTemplate({ name, otp, purpose }: OtpTemplateParams): string {
  const greeting = name ? `Hola, ${name}` : 'Hola';

  const title = purpose === 'email_verification' ? 'Verifica tu cuenta' : 'Restablecer contraseña';

  const description =
    purpose === 'email_verification'
      ? 'Ingresa el siguiente código para verificar tu dirección de correo electrónico.'
      : 'Ingresa el siguiente código para restablecer tu contraseña.';

  return renderEmailShell({
    title,
    eyebrow: 'Seguridad de cuenta',
    preheader: `${title} en Vitriona`,
    contentHtml: `
      <p style="margin:0 0 8px;color:${emailBrandStyles.textMuted};font-size:15px;">${greeting},</p>
      <p style="margin:0 0 22px;color:${emailBrandStyles.textMuted};font-size:15px;line-height:1.65;">${description}</p>

      <div style="margin:0 0 22px;padding:20px;border:1px solid ${emailBrandStyles.border};border-radius:14px;background:#f9faff;text-align:center;">
        <p style="margin:0 0 8px;color:${emailBrandStyles.textSubtle};font-size:12px;letter-spacing:0.06em;text-transform:uppercase;font-weight:700;">Codigo de verificacion</p>
        <span style="display:inline-block;color:${emailBrandStyles.textPrimary};font-size:36px;font-weight:800;letter-spacing:10px;font-family:'Courier New',Courier,monospace;">${otp}</span>
      </div>

      <div style="background:${emailBrandStyles.primarySoft};border:1px solid #c4b5fd;border-radius:12px;padding:14px 16px;margin-bottom:18px;">
        <p style="margin:0;color:#4c1d95;font-size:13px;line-height:1.6;">
          Este codigo expira en <strong>10 minutos</strong>.<br/>
          Si no solicitaste esta accion, puedes ignorar este correo.
        </p>
      </div>

      <p style="margin:0;color:${emailBrandStyles.textSubtle};font-size:12px;line-height:1.6;">
        Por seguridad, nunca compartas este codigo con nadie.
      </p>
    `,
  });
}
