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

  return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center" style="padding:48px 20px;">
          <table width="480" cellpadding="0" cellspacing="0" role="presentation"
            style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1),0 1px 2px rgba(0,0,0,0.06);">
            <tr>
              <td style="background:#18181b;padding:32px 40px;text-align:center;">
                <p style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.5px;">Vitriona</p>
                <p style="margin:8px 0 0;color:#a1a1aa;font-size:13px;">Plataforma de catálogos digitales</p>
              </td>
            </tr>
            <tr>
              <td style="padding:40px;">
                <p style="margin:0 0 6px;color:#52525b;font-size:15px;">${greeting},</p>
                <h1 style="margin:0 0 16px;color:#18181b;font-size:22px;font-weight:600;">${title}</h1>
                <p style="margin:0 0 32px;color:#71717a;font-size:15px;line-height:1.6;">${description}</p>
                <div style="text-align:center;margin:0 0 32px;">
                  <div style="display:inline-block;padding:20px 40px;background:#f4f4f5;border-radius:12px;border:1px solid #e4e4e7;">
                    <span style="font-size:36px;font-weight:700;letter-spacing:10px;color:#18181b;font-family:'Courier New',Courier,monospace;">${otp}</span>
                  </div>
                </div>
                <div style="background:#fef9c3;border:1px solid #fde047;border-radius:8px;padding:14px 16px;margin-bottom:24px;">
                  <p style="margin:0;color:#854d0e;font-size:13px;line-height:1.5;">
                    ⏱️ Este código expira en <strong>10 minutos</strong>.<br/>
                    Si no solicitaste esto, puedes ignorar este correo de forma segura.
                  </p>
                </div>
                <p style="margin:0;color:#a1a1aa;font-size:12px;text-align:center;">
                  Por seguridad, nunca compartas este código con nadie.
                </p>
              </td>
            </tr>
            <tr>
              <td style="background:#f9f9f9;border-top:1px solid #e4e4e7;padding:20px 40px;text-align:center;">
                <p style="margin:0;color:#a1a1aa;font-size:12px;">
                  © ${new Date().getFullYear()} Vitriona · Todos los derechos reservados
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
