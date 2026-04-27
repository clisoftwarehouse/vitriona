import { renderEmailShell, emailBrandStyles } from './brand-email';

interface UpgradeConfirmationTemplateParams {
  userName: string;
  businessName: string;
  requestType: 'new' | 'renewal' | 'upgrade' | 'downgrade';
  plan: string;
  billingCycle: string;
  paymentMethod: string;
  referenceId: string;
  amount: string;
  amountVes: string | null;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  bank_transfer: 'Transferencia Bancaria',
  pago_movil: 'Pago Movil',
  zelle: 'Zelle',
  binance: 'Binance',
};

const PLAN_LABELS: Record<string, string> = {
  pro: 'Emprendedor',
  business: 'Negocio',
};

const REQUEST_TYPE_TITLES: Record<string, string> = {
  new: 'Recibimos tu solicitud de suscripcion',
  renewal: 'Recibimos tu solicitud de renovacion',
  upgrade: 'Recibimos tu solicitud de upgrade',
  downgrade: 'Recibimos tu solicitud de cambio de plan',
};

const REQUEST_TYPE_EYEBROWS: Record<string, string> = {
  new: 'Nueva suscripcion',
  renewal: 'Renovacion de plan',
  upgrade: 'Upgrade de plan',
  downgrade: 'Cambio de plan programado',
};

const REQUEST_TYPE_INTROS: Record<string, string> = {
  new: 'Estamos validando tu pago para activar tu nueva suscripcion.',
  renewal: 'Estamos validando tu pago para renovar tu plan actual.',
  upgrade: 'Estamos validando tu pago para actualizarte al nuevo plan.',
  downgrade:
    'Estamos validando tu pago. Tu plan actual sigue activo hasta el fin del ciclo y luego cambiara automaticamente al plan que elegiste.',
};

export function upgradeConfirmationEmailTemplate(params: UpgradeConfirmationTemplateParams): string {
  const paymentLabel = PAYMENT_METHOD_LABELS[params.paymentMethod] ?? params.paymentMethod;
  const planLabel = PLAN_LABELS[params.plan] ?? params.plan;
  const cycleLabel = params.billingCycle === 'annual' ? 'Anual' : 'Mensual';
  const title = REQUEST_TYPE_TITLES[params.requestType];
  const eyebrow = REQUEST_TYPE_EYEBROWS[params.requestType];
  const intro = REQUEST_TYPE_INTROS[params.requestType];

  return renderEmailShell({
    title,
    eyebrow,
    preheader: `Tu solicitud para ${params.businessName} esta siendo revisada`,
    contentHtml: `
      <p style="margin:0 0 14px;color:${emailBrandStyles.textPrimary};font-size:15px;line-height:1.65;">Hola ${params.userName},</p>
      <p style="margin:0 0 18px;color:${emailBrandStyles.textMuted};font-size:14px;line-height:1.7;">${intro} Recibimos los datos de pago de <strong style="color:${emailBrandStyles.textPrimary};">${params.businessName}</strong> y los revisaremos lo antes posible.</p>

      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:14px 16px;margin-bottom:20px;">
        <p style="margin:0 0 4px;color:#9a3412;font-size:12px;letter-spacing:0.07em;text-transform:uppercase;font-weight:700;">Tiempo de revision</p>
        <p style="margin:0;color:#9a3412;font-size:14px;line-height:1.6;">El proceso de confirmacion puede tardar entre <strong>24 y 48 horas habiles</strong>. Te enviaremos otro correo apenas tengamos una respuesta.</p>
      </div>

      <p style="margin:0 0 10px;color:${emailBrandStyles.textSubtle};font-size:12px;letter-spacing:0.07em;text-transform:uppercase;font-weight:700;">Resumen de tu solicitud</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;border-collapse:collapse;">
        <tr><td style="padding:9px 0;border-bottom:1px solid ${emailBrandStyles.border};color:${emailBrandStyles.textSubtle};font-size:13px;">Plan</td><td style="padding:9px 0;border-bottom:1px solid ${emailBrandStyles.border};text-align:right;color:${emailBrandStyles.textPrimary};font-size:14px;font-weight:600;">${planLabel}</td></tr>
        <tr><td style="padding:9px 0;border-bottom:1px solid ${emailBrandStyles.border};color:${emailBrandStyles.textSubtle};font-size:13px;">Ciclo</td><td style="padding:9px 0;border-bottom:1px solid ${emailBrandStyles.border};text-align:right;color:${emailBrandStyles.textPrimary};font-size:14px;font-weight:600;">${cycleLabel}</td></tr>
        <tr><td style="padding:9px 0;border-bottom:1px solid ${emailBrandStyles.border};color:${emailBrandStyles.textSubtle};font-size:13px;">Monto</td><td style="padding:9px 0;border-bottom:1px solid ${emailBrandStyles.border};text-align:right;color:${emailBrandStyles.textPrimary};font-size:14px;font-weight:600;">&euro;${params.amount}</td></tr>
        ${params.amountVes ? `<tr><td style="padding:9px 0;border-bottom:1px solid ${emailBrandStyles.border};color:${emailBrandStyles.textSubtle};font-size:13px;">Monto en Bs</td><td style="padding:9px 0;border-bottom:1px solid ${emailBrandStyles.border};text-align:right;color:${emailBrandStyles.textPrimary};font-size:14px;font-weight:600;">Bs. ${params.amountVes}</td></tr>` : ''}
        <tr><td style="padding:9px 0;border-bottom:1px solid ${emailBrandStyles.border};color:${emailBrandStyles.textSubtle};font-size:13px;">Metodo de pago</td><td style="padding:9px 0;border-bottom:1px solid ${emailBrandStyles.border};text-align:right;color:${emailBrandStyles.textPrimary};font-size:14px;font-weight:600;">${paymentLabel}</td></tr>
        <tr><td style="padding:9px 0;color:${emailBrandStyles.textSubtle};font-size:13px;">Referencia</td><td style="padding:9px 0;text-align:right;color:${emailBrandStyles.textPrimary};font-size:14px;font-weight:700;font-family:'Courier New',monospace;">${params.referenceId}</td></tr>
      </table>

      <p style="margin:0;color:${emailBrandStyles.textMuted};font-size:13px;line-height:1.7;">Si tienes alguna duda o necesitas adjuntar mas informacion, responde este correo y nuestro equipo te ayudara.</p>
    `,
  });
}
