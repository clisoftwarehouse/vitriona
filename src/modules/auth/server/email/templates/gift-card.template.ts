import { emailBrandStyles, renderEmailShell } from './brand-email';

interface GiftCardEmailTemplateParams {
  recipientName?: string | null;
  senderName?: string | null;
  businessName: string;
  code: string;
  type: 'fixed' | 'percentage' | 'product' | 'free_product';
  value: number;
  quantity?: number | null;
  message?: string | null;
  expiresAt?: Date | null;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://vitriona.app';
const LOGO_URL = `${APP_URL}/images/vitriona-logo-dark.png`;

function formatGiftCardValue(type: GiftCardEmailTemplateParams['type'], value: number, quantity?: number | null) {
  if (type === 'percentage') return `${value}% OFF`;
  if (type === 'free_product') {
    const n = quantity ?? 1;
    return `${n} ${n === 1 ? 'PRODUCTO' : 'PRODUCTOS'} GRATIS`;
  }
  return `$${value.toFixed(2)}`;
}

function formatExpiration(expiresAt?: Date | null) {
  if (!expiresAt) return 'Sin expiración';
  return new Intl.DateTimeFormat('es-DO', { year: 'numeric', month: 'short', day: 'numeric' }).format(expiresAt);
}

export function giftCardEmailTemplate({
  recipientName,
  senderName,
  businessName,
  code,
  type,
  value,
  quantity,
  message,
  expiresAt,
}: GiftCardEmailTemplateParams): string {
  const greeting = recipientName?.trim() ? `Hola, ${recipientName.trim()}` : 'Hola';
  const senderLine = senderName?.trim()
    ? `${senderName.trim()} te envió una gift card de ${businessName}.`
    : `${businessName} te envió una gift card.`;
  const valueLabel = formatGiftCardValue(type, value, quantity);
  const valueFontSize = type === 'free_product' ? 24 : 36;
  const expirationLabel = formatExpiration(expiresAt);
  const qrImageUrl = `${APP_URL}/api/gift-cards/qr?code=${encodeURIComponent(code)}`;

  const cardHtml = `
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 20px;">
      <tr>
        <td align="center">
          <table width="420" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;max-width:420px;background:#ffffff;border:1px solid #e5e7eb;border-radius:18px;box-shadow:0 12px 28px rgba(17,24,39,0.08);overflow:hidden;">
            <tr>
              <td style="padding:22px 24px 0;">
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                  <tr>
                    <td align="left" style="vertical-align:middle;">
                      <img src="${LOGO_URL}" width="110" alt="Vitriona" style="display:block;height:auto;border:0;outline:none;" />
                    </td>
                    <td align="right" style="vertical-align:middle;color:${emailBrandStyles.textSubtle};font-size:11px;letter-spacing:0.08em;text-transform:uppercase;font-weight:700;">
                      Gift Card
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 24px 6px;">
                <p style="margin:0;color:${emailBrandStyles.textSubtle};font-size:12px;letter-spacing:0.06em;text-transform:uppercase;font-weight:700;">${businessName}</p>
                <p style="margin:6px 0 0;color:${emailBrandStyles.textPrimary};font-size:${valueFontSize}px;line-height:1.1;font-weight:800;letter-spacing:-0.02em;">${valueLabel}</p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:14px 24px 10px;">
                <div style="display:inline-block;padding:10px;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;">
                  <img src="${qrImageUrl}" width="180" height="180" alt="QR para canjear" style="display:block;border:0;outline:none;" />
                </div>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:0 24px 18px;">
                <p style="margin:0 0 4px;color:${emailBrandStyles.textSubtle};font-size:11px;letter-spacing:0.08em;text-transform:uppercase;font-weight:700;">Código</p>
                <p style="margin:0;color:${emailBrandStyles.textPrimary};font-size:22px;font-weight:800;letter-spacing:3px;font-family:'Courier New',Courier,monospace;">${code}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 24px 22px;border-top:1px dashed #e5e7eb;">
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                  <tr>
                    <td style="color:${emailBrandStyles.textSubtle};font-size:11px;letter-spacing:0.06em;text-transform:uppercase;font-weight:700;">Expira</td>
                    <td align="right" style="color:${emailBrandStyles.textPrimary};font-size:13px;font-weight:600;">${expirationLabel}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;

  const messageBlock = message?.trim()
    ? `<div style="background:${emailBrandStyles.primarySoft};border:1px solid #c4b5fd;border-radius:12px;padding:14px 16px;margin:0 0 18px;"><p style="margin:0 0 6px;color:#4c1d95;font-size:12px;letter-spacing:0.07em;text-transform:uppercase;font-weight:700;">Mensaje</p><p style="margin:0;color:#4c1d95;font-size:14px;line-height:1.7;">${message.trim()}</p></div>`
    : '';

  return renderEmailShell({
    title: 'Recibiste una Gift Card',
    eyebrow: `Regalo digital de ${businessName}`,
    preheader: `${businessName} te envió una gift card`,
    contentHtml: `
      <p style="margin:0 0 6px;color:${emailBrandStyles.textMuted};font-size:15px;">${greeting},</p>
      <p style="margin:0 0 18px;color:${emailBrandStyles.textMuted};font-size:15px;line-height:1.65;">${senderLine}</p>

      ${cardHtml}

      ${messageBlock}

      <p style="margin:0 0 6px;color:${emailBrandStyles.textPrimary};font-size:14px;line-height:1.7;font-weight:600;">¿Cómo canjearla?</p>
      <ul style="margin:0 0 14px;padding-left:18px;color:${emailBrandStyles.textMuted};font-size:13px;line-height:1.7;">
        <li>Online: ingresá el código durante el checkout en la tienda de ${businessName}.</li>
        <li>Presencial: mostrá este correo (o una impresión) al personal de ${businessName} para que escanee el QR.</li>
      </ul>

      <p style="margin:0;color:${emailBrandStyles.textSubtle};font-size:12px;line-height:1.6;">
        Guardá este correo. El código es único y personal.
      </p>
    `,
  });
}
