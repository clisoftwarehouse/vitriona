import { renderEmailShell, emailBrandStyles } from './brand-email';

interface UpgradeRequestTemplateParams {
  userName: string;
  userEmail: string;
  businessName: string;
  plan: string;
  billingCycle: string;
  paymentMethod: string;
  referenceId: string;
  amount: string;
  fullName: string;
  idNumber: string;
  contactEmail: string;
  phone: string | null;
  notes: string | null;
  amountVes: string | null;
  exchangeRate: string | null;
  approveUrl: string;
  rejectUrl: string;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  bank_transfer: 'Transferencia Bancaria',
  pago_movil: 'Pago Móvil',
  zelle: 'Zelle',
  binance: 'Binance',
};

const PLAN_LABELS: Record<string, string> = {
  pro: 'Emprendedor',
  business: 'Negocio',
};

export function upgradeRequestEmailTemplate(params: UpgradeRequestTemplateParams): string {
  const paymentLabel = PAYMENT_METHOD_LABELS[params.paymentMethod] ?? params.paymentMethod;
  const planLabel = PLAN_LABELS[params.plan] ?? params.plan;
  const cycleLabel = params.billingCycle === 'annual' ? 'Anual' : 'Mensual';

  return renderEmailShell({
    title: 'Solicitud de Upgrade',
    eyebrow: 'Revision administrativa',
    preheader: `${params.businessName} solicito un upgrade de plan`,
    contentHtml: `
      <div style="background:#f8faff;border:1px solid ${emailBrandStyles.border};border-radius:14px;padding:16px 18px;margin-bottom:18px;">
        <p style="margin:0 0 4px;color:${emailBrandStyles.textSubtle};font-size:12px;letter-spacing:0.07em;text-transform:uppercase;font-weight:700;">Solicitante</p>
        <p style="margin:0 0 10px;color:${emailBrandStyles.textPrimary};font-size:15px;line-height:1.6;">${params.userName} (${params.userEmail})</p>
        <p style="margin:0;color:${emailBrandStyles.textMuted};font-size:14px;">Negocio: <strong style="color:${emailBrandStyles.textPrimary};">${params.businessName}</strong></p>
      </div>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:18px;border-collapse:collapse;">
        <tr><td style="padding:9px 0;border-bottom:1px solid ${emailBrandStyles.border};color:${emailBrandStyles.textSubtle};font-size:13px;">Plan solicitado</td><td style="padding:9px 0;border-bottom:1px solid ${emailBrandStyles.border};text-align:right;color:${emailBrandStyles.textPrimary};font-size:14px;font-weight:600;">${planLabel}</td></tr>
        <tr><td style="padding:9px 0;border-bottom:1px solid ${emailBrandStyles.border};color:${emailBrandStyles.textSubtle};font-size:13px;">Ciclo</td><td style="padding:9px 0;border-bottom:1px solid ${emailBrandStyles.border};text-align:right;color:${emailBrandStyles.textPrimary};font-size:14px;font-weight:600;">${cycleLabel}</td></tr>
        <tr><td style="padding:9px 0;border-bottom:1px solid ${emailBrandStyles.border};color:${emailBrandStyles.textSubtle};font-size:13px;">Monto</td><td style="padding:9px 0;border-bottom:1px solid ${emailBrandStyles.border};text-align:right;color:${emailBrandStyles.textPrimary};font-size:14px;font-weight:600;">&euro;${params.amount}</td></tr>
        ${params.amountVes ? `<tr><td style="padding:9px 0;border-bottom:1px solid ${emailBrandStyles.border};color:${emailBrandStyles.textSubtle};font-size:13px;">Monto en Bs</td><td style="padding:9px 0;border-bottom:1px solid ${emailBrandStyles.border};text-align:right;color:${emailBrandStyles.textPrimary};font-size:14px;font-weight:600;">Bs. ${params.amountVes}</td></tr>` : ''}
        ${params.exchangeRate ? `<tr><td style="padding:9px 0;border-bottom:1px solid ${emailBrandStyles.border};color:${emailBrandStyles.textSubtle};font-size:13px;">Tasa BCV</td><td style="padding:9px 0;border-bottom:1px solid ${emailBrandStyles.border};text-align:right;color:${emailBrandStyles.textPrimary};font-size:14px;font-weight:600;">${params.exchangeRate} Bs/EUR</td></tr>` : ''}
        <tr><td style="padding:9px 0;border-bottom:1px solid ${emailBrandStyles.border};color:${emailBrandStyles.textSubtle};font-size:13px;">Metodo de pago</td><td style="padding:9px 0;border-bottom:1px solid ${emailBrandStyles.border};text-align:right;color:${emailBrandStyles.textPrimary};font-size:14px;font-weight:600;">${paymentLabel}</td></tr>
        <tr><td style="padding:9px 0;border-bottom:1px solid ${emailBrandStyles.border};color:${emailBrandStyles.textSubtle};font-size:13px;">Referencia</td><td style="padding:9px 0;border-bottom:1px solid ${emailBrandStyles.border};text-align:right;color:${emailBrandStyles.textPrimary};font-size:14px;font-weight:700;font-family:'Courier New',monospace;">${params.referenceId}</td></tr>
      </table>

      <div style="background:${emailBrandStyles.primarySoft};border:1px solid #c4b5fd;border-radius:12px;padding:14px 16px;margin-bottom:18px;">
        <p style="margin:0 0 6px;color:#4c1d95;font-size:12px;letter-spacing:0.07em;text-transform:uppercase;font-weight:700;">Datos de facturacion</p>
        <p style="margin:0;color:#4c1d95;font-size:13px;line-height:1.7;"><strong>${params.fullName}</strong><br/>Cedula/RIF: ${params.idNumber}<br/>Email: ${params.contactEmail}${params.phone ? `<br/>Telefono: ${params.phone}` : ''}</p>
      </div>

      ${params.notes ? `<div style="background:#f8fafc;border:1px solid ${emailBrandStyles.border};border-radius:12px;padding:14px 16px;margin-bottom:18px;"><p style="margin:0 0 6px;color:${emailBrandStyles.textSubtle};font-size:12px;letter-spacing:0.07em;text-transform:uppercase;font-weight:700;">Notas</p><p style="margin:0;color:${emailBrandStyles.textMuted};font-size:13px;line-height:1.7;">${params.notes}</p></div>` : ''}

      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr><td align="center" style="padding:0 0 10px;"><a href="${params.approveUrl}" style="display:inline-block;background:${emailBrandStyles.primary};color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 34px;border-radius:10px;">Aprobar y activar plan</a></td></tr>
        <tr><td align="center"><a href="${params.rejectUrl}" style="display:inline-block;background:#991b1b;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:11px 34px;border-radius:10px;">Rechazar solicitud</a></td></tr>
      </table>
    `,
  });
}
