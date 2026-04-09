import { renderEmailShell, emailBrandStyles } from './brand-email';

interface GiftCardEmailTemplateParams {
  recipientName?: string | null;
  senderName?: string | null;
  businessName: string;
  code: string;
  type: 'fixed' | 'percentage' | 'product';
  value: number;
  message?: string | null;
  expiresAt?: Date | null;
}

function formatGiftCardValue(type: GiftCardEmailTemplateParams['type'], value: number) {
  if (type === 'percentage') return `${value}% de descuento`;
  return `$${value.toFixed(2)} de saldo`;
}

function formatExpiration(expiresAt?: Date | null) {
  if (!expiresAt) return 'Sin fecha de expiracion';
  return new Intl.DateTimeFormat('es-DO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(expiresAt);
}

export function giftCardEmailTemplate({
  recipientName,
  senderName,
  businessName,
  code,
  type,
  value,
  message,
  expiresAt,
}: GiftCardEmailTemplateParams): string {
  const greeting = recipientName?.trim() ? `Hola, ${recipientName.trim()}` : 'Hola';
  const senderLine = senderName?.trim() ? `Te la envia ${senderName.trim()}.` : 'Tienes una gift card para ti.';
  const valueLabel = formatGiftCardValue(type, value);
  const expirationLabel = formatExpiration(expiresAt);

  return renderEmailShell({
    title: 'Recibiste una Gift Card',
    eyebrow: `Regalo digital de ${businessName}`,
    preheader: `${businessName} te envio una gift card`,
    contentHtml: `
      <p style="margin:0 0 8px;color:${emailBrandStyles.textMuted};font-size:15px;">${greeting},</p>
      <p style="margin:0 0 20px;color:${emailBrandStyles.textMuted};font-size:15px;line-height:1.65;">${senderLine}</p>

      <div style="margin:0 0 20px;padding:18px;border:1px solid ${emailBrandStyles.border};border-radius:14px;background:#fafaff;">
        <p style="margin:0 0 6px;color:${emailBrandStyles.textSubtle};font-size:12px;letter-spacing:0.08em;text-transform:uppercase;font-weight:700;">Codigo de la gift card</p>
        <p style="margin:0 0 14px;color:${emailBrandStyles.textPrimary};font-size:30px;font-weight:800;letter-spacing:2px;font-family:'Courier New',Courier,monospace;">${code}</p>
        <p style="margin:0;color:${emailBrandStyles.textMuted};font-size:14px;line-height:1.7;">Valor: <strong style="color:${emailBrandStyles.textPrimary};">${valueLabel}</strong></p>
        <p style="margin:4px 0 0;color:${emailBrandStyles.textMuted};font-size:14px;line-height:1.7;">Expiracion: <strong style="color:${emailBrandStyles.textPrimary};">${expirationLabel}</strong></p>
      </div>

      ${message?.trim() ? `<div style="background:${emailBrandStyles.primarySoft};border:1px solid #c4b5fd;border-radius:12px;padding:14px 16px;margin-bottom:18px;"><p style="margin:0 0 6px;color:#4c1d95;font-size:12px;letter-spacing:0.07em;text-transform:uppercase;font-weight:700;">Mensaje</p><p style="margin:0;color:#4c1d95;font-size:14px;line-height:1.7;">${message.trim()}</p></div>` : ''}

      <p style="margin:0;color:${emailBrandStyles.textSubtle};font-size:13px;line-height:1.7;">
        Usa este codigo durante el checkout para aplicar el beneficio de inmediato.
      </p>
    `,
  });
}
