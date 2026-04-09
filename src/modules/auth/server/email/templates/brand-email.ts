interface EmailShellParams {
  title: string;
  eyebrow?: string;
  preheader?: string;
  contentHtml: string;
  footerNote?: string;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://vitriona.app';
const LOGO_URL = `${APP_URL}/images/vitriona-logo-dark.png`;

const BRAND = {
  pageBackground: '#f4f2ff',
  cardBackground: '#ffffff',
  textPrimary: '#111827',
  textMuted: '#4b5563',
  textSubtle: '#6b7280',
  border: '#e5e7eb',
  primary: '#6d28d9',
  primarySoft: '#ede9fe',
  primaryGradientStart: '#6d28d9',
  primaryGradientEnd: '#4f46e5',
};

export function renderEmailShell({
  title,
  eyebrow = 'Vitriona',
  preheader,
  contentHtml,
  footerNote,
}: EmailShellParams): string {
  return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background-color:${BRAND.pageBackground};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,sans-serif;">
    ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preheader}</div>` : ''}
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:${BRAND.pageBackground};">
      <tr>
        <td align="center" style="padding:36px 18px;">
          <table width="620" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;max-width:620px;background:${BRAND.cardBackground};border-radius:20px;border:1px solid ${BRAND.border};overflow:hidden;box-shadow:0 18px 40px rgba(79,70,229,0.12);">
            <tr>
              <td style="padding:0;background:linear-gradient(135deg, ${BRAND.primaryGradientStart} 0%, ${BRAND.primaryGradientEnd} 100%);">
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                  <tr>
                    <td style="padding:26px 28px 14px;">
                      <img src="${LOGO_URL}" width="150" alt="Vitriona" style="display:block;height:auto;border:0;outline:none;text-decoration:none;" />
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:0 28px 24px;">
                      <p style="margin:0;color:#ddd6fe;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;font-weight:700;">${eyebrow}</p>
                      <h1 style="margin:8px 0 0;color:#ffffff;font-size:24px;line-height:1.25;letter-spacing:-0.02em;">${title}</h1>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;background:${BRAND.cardBackground};">
                ${contentHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px 24px;border-top:1px solid ${BRAND.border};background:#fafaff;">
                <p style="margin:0;color:${BRAND.textSubtle};font-size:12px;line-height:1.55;">
                  ${footerNote ?? 'Este es un correo automatico de Vitriona. Si necesitas ayuda, responde este mensaje o escribe a soporte.'}
                </p>
                <p style="margin:8px 0 0;color:${BRAND.textSubtle};font-size:12px;">
                  © ${new Date().getFullYear()} Vitriona. Todos los derechos reservados.
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

export const emailBrandStyles = {
  textPrimary: BRAND.textPrimary,
  textMuted: BRAND.textMuted,
  textSubtle: BRAND.textSubtle,
  border: BRAND.border,
  primary: BRAND.primary,
  primarySoft: BRAND.primarySoft,
};
