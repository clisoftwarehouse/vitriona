import { renderEmailShell, emailBrandStyles } from './brand-email';

interface UpgradeDecisionTemplateParams {
  userName: string;
  businessName: string;
  requestType: 'new' | 'renewal' | 'upgrade' | 'downgrade';
  plan: string;
  billingCycle: string;
  amount: string;
  referenceId: string;
  decision: 'approved' | 'rejected';
  billingCycleEnd?: string;
  dashboardUrl: string;
}

const PLAN_LABELS: Record<string, string> = {
  pro: 'Emprendedor',
  business: 'Negocio',
};

const REQUEST_TYPE_VERB_APPROVED: Record<string, string> = {
  new: 'activado',
  renewal: 'renovado',
  upgrade: 'actualizado',
  downgrade: 'programado',
};

const REQUEST_TYPE_LABELS: Record<string, string> = {
  new: 'Nueva suscripcion',
  renewal: 'Renovacion',
  upgrade: 'Upgrade',
  downgrade: 'Downgrade',
};

export function upgradeDecisionEmailTemplate(params: UpgradeDecisionTemplateParams): string {
  const planLabel = PLAN_LABELS[params.plan] ?? params.plan;
  const cycleLabel = params.billingCycle === 'annual' ? 'Anual' : 'Mensual';
  const requestTypeLabel = REQUEST_TYPE_LABELS[params.requestType];

  if (params.decision === 'approved') {
    const verb = REQUEST_TYPE_VERB_APPROVED[params.requestType];
    const isDowngrade = params.requestType === 'downgrade';
    const title =
      params.requestType === 'new'
        ? 'Tu plan esta activo'
        : params.requestType === 'renewal'
          ? 'Tu plan fue renovado'
          : isDowngrade
            ? 'Tu cambio de plan fue programado'
            : 'Tu plan fue actualizado';
    const intro = isDowngrade
      ? `Confirmamos tu pago. Tu plan actual de <strong style="color:${emailBrandStyles.textPrimary};">${params.businessName}</strong> sigue activo hasta el final del ciclo, y luego cambiara automaticamente a <strong style="color:${emailBrandStyles.textPrimary};">${planLabel}</strong>.`
      : `Confirmamos tu pago. El plan de <strong style="color:${emailBrandStyles.textPrimary};">${params.businessName}</strong> ha sido <strong style="color:${emailBrandStyles.textPrimary};">${verb}</strong> a <strong style="color:${emailBrandStyles.textPrimary};">${planLabel}</strong>.`;
    const vigenciaLabel = isDowngrade ? 'Cambio programado para' : 'Vigencia';
    const vigenciaCopy = isDowngrade
      ? `Tu plan actual termina el <strong>${params.billingCycleEnd ?? 'la fecha indicada en tu dashboard'}</strong>. A partir de esa fecha estaras en <strong>${planLabel}</strong>.`
      : `Tu plan esta activo hasta <strong>${params.billingCycleEnd ?? 'la fecha indicada en tu dashboard'}</strong>.`;

    return renderEmailShell({
      title,
      eyebrow: 'Pago aprobado',
      preheader: `${params.businessName}: ${isDowngrade ? 'cambio de plan programado' : `tu plan ${planLabel} esta activo`}`,
      contentHtml: `
        <p style="margin:0 0 14px;color:${emailBrandStyles.textPrimary};font-size:15px;line-height:1.65;">Hola ${params.userName},</p>
        <p style="margin:0 0 18px;color:${emailBrandStyles.textMuted};font-size:14px;line-height:1.7;">${intro}</p>

        <div style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:12px;padding:14px 16px;margin-bottom:20px;">
          <p style="margin:0 0 4px;color:#065f46;font-size:12px;letter-spacing:0.07em;text-transform:uppercase;font-weight:700;">${vigenciaLabel}</p>
          <p style="margin:0;color:#065f46;font-size:14px;line-height:1.6;">${vigenciaCopy}</p>
        </div>

        <p style="margin:0 0 10px;color:${emailBrandStyles.textSubtle};font-size:12px;letter-spacing:0.07em;text-transform:uppercase;font-weight:700;">Resumen</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;border-collapse:collapse;">
          <tr><td style="padding:9px 0;border-bottom:1px solid ${emailBrandStyles.border};color:${emailBrandStyles.textSubtle};font-size:13px;">Tipo</td><td style="padding:9px 0;border-bottom:1px solid ${emailBrandStyles.border};text-align:right;color:${emailBrandStyles.textPrimary};font-size:14px;font-weight:600;">${requestTypeLabel}</td></tr>
          <tr><td style="padding:9px 0;border-bottom:1px solid ${emailBrandStyles.border};color:${emailBrandStyles.textSubtle};font-size:13px;">Plan</td><td style="padding:9px 0;border-bottom:1px solid ${emailBrandStyles.border};text-align:right;color:${emailBrandStyles.textPrimary};font-size:14px;font-weight:600;">${planLabel}</td></tr>
          <tr><td style="padding:9px 0;border-bottom:1px solid ${emailBrandStyles.border};color:${emailBrandStyles.textSubtle};font-size:13px;">Ciclo</td><td style="padding:9px 0;border-bottom:1px solid ${emailBrandStyles.border};text-align:right;color:${emailBrandStyles.textPrimary};font-size:14px;font-weight:600;">${cycleLabel}</td></tr>
          <tr><td style="padding:9px 0;border-bottom:1px solid ${emailBrandStyles.border};color:${emailBrandStyles.textSubtle};font-size:13px;">Monto</td><td style="padding:9px 0;border-bottom:1px solid ${emailBrandStyles.border};text-align:right;color:${emailBrandStyles.textPrimary};font-size:14px;font-weight:600;">&euro;${params.amount}</td></tr>
          <tr><td style="padding:9px 0;color:${emailBrandStyles.textSubtle};font-size:13px;">Referencia</td><td style="padding:9px 0;text-align:right;color:${emailBrandStyles.textPrimary};font-size:14px;font-weight:700;font-family:'Courier New',monospace;">${params.referenceId}</td></tr>
        </table>

        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr><td align="center"><a href="${params.dashboardUrl}" style="display:inline-block;background:${emailBrandStyles.primary};color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 34px;border-radius:10px;">Ir al Dashboard</a></td></tr>
        </table>
      `,
    });
  }

  return renderEmailShell({
    title: 'No pudimos verificar tu pago',
    eyebrow: 'Solicitud rechazada',
    preheader: `Tu solicitud para ${params.businessName} no pudo ser aprobada`,
    contentHtml: `
      <p style="margin:0 0 14px;color:${emailBrandStyles.textPrimary};font-size:15px;line-height:1.65;">Hola ${params.userName},</p>
      <p style="margin:0 0 18px;color:${emailBrandStyles.textMuted};font-size:14px;line-height:1.7;">Lamentamos informarte que no pudimos verificar el pago de tu solicitud para <strong style="color:${emailBrandStyles.textPrimary};">${params.businessName}</strong>. Tu plan no ha sido modificado.</p>

      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:14px 16px;margin-bottom:20px;">
        <p style="margin:0 0 4px;color:#991b1b;font-size:12px;letter-spacing:0.07em;text-transform:uppercase;font-weight:700;">Que puedes hacer</p>
        <p style="margin:0;color:#991b1b;font-size:14px;line-height:1.6;">Verifica los datos del pago (referencia, monto, metodo) y vuelve a enviar la solicitud desde tu dashboard. Si crees que es un error, responde este correo para que el equipo lo revise contigo.</p>
      </div>

      <p style="margin:0 0 10px;color:${emailBrandStyles.textSubtle};font-size:12px;letter-spacing:0.07em;text-transform:uppercase;font-weight:700;">Detalles de la solicitud</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;border-collapse:collapse;">
        <tr><td style="padding:9px 0;border-bottom:1px solid ${emailBrandStyles.border};color:${emailBrandStyles.textSubtle};font-size:13px;">Tipo</td><td style="padding:9px 0;border-bottom:1px solid ${emailBrandStyles.border};text-align:right;color:${emailBrandStyles.textPrimary};font-size:14px;font-weight:600;">${requestTypeLabel}</td></tr>
        <tr><td style="padding:9px 0;border-bottom:1px solid ${emailBrandStyles.border};color:${emailBrandStyles.textSubtle};font-size:13px;">Plan solicitado</td><td style="padding:9px 0;border-bottom:1px solid ${emailBrandStyles.border};text-align:right;color:${emailBrandStyles.textPrimary};font-size:14px;font-weight:600;">${planLabel}</td></tr>
        <tr><td style="padding:9px 0;border-bottom:1px solid ${emailBrandStyles.border};color:${emailBrandStyles.textSubtle};font-size:13px;">Monto</td><td style="padding:9px 0;border-bottom:1px solid ${emailBrandStyles.border};text-align:right;color:${emailBrandStyles.textPrimary};font-size:14px;font-weight:600;">&euro;${params.amount}</td></tr>
        <tr><td style="padding:9px 0;color:${emailBrandStyles.textSubtle};font-size:13px;">Referencia</td><td style="padding:9px 0;text-align:right;color:${emailBrandStyles.textPrimary};font-size:14px;font-weight:700;font-family:'Courier New',monospace;">${params.referenceId}</td></tr>
      </table>

      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr><td align="center"><a href="${params.dashboardUrl}" style="display:inline-block;background:${emailBrandStyles.primary};color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 34px;border-radius:10px;">Ir al Dashboard</a></td></tr>
      </table>
    `,
  });
}
