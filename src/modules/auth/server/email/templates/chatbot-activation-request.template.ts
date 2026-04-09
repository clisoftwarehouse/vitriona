interface ChatbotActivationRequestTemplateParams {
  userName: string;
  userEmail: string;
  businessName: string;
  aiPlanType: string;
  billingCycle: string;
  paymentMethod: string;
  referenceId: string;
  amount: string;
  fullName: string;
  idNumber: string;
  contactEmail: string;
  phone: string | null;
  notes: string | null;
  approveUrl: string;
  rejectUrl: string;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  bank_transfer: 'Transferencia Bancaria',
  pago_movil: 'Pago Móvil',
  zelle: 'Zelle',
  binance: 'Binance',
};

const AI_PLAN_LABELS: Record<string, string> = {
  ia_starter: 'AI Starter',
  ia_business: 'AI Business',
  ia_enterprise: 'AI Enterprise',
};

const AI_PLAN_RESPONSES: Record<string, string> = {
  ia_starter: '500 respuestas/mes',
  ia_business: '2,500 respuestas/mes',
  ia_enterprise: '10,000 respuestas/mes',
};

export function chatbotActivationRequestEmailTemplate(params: ChatbotActivationRequestTemplateParams): string {
  const paymentLabel = PAYMENT_METHOD_LABELS[params.paymentMethod] ?? params.paymentMethod;
  const planLabel = AI_PLAN_LABELS[params.aiPlanType] ?? params.aiPlanType;
  const responsesLabel = AI_PLAN_RESPONSES[params.aiPlanType] ?? '';
  const cycleLabel = params.billingCycle === 'annual' ? 'Anual' : 'Mensual';

  return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Nueva solicitud de activación de Chatbot IA</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center" style="padding:48px 20px;">
          <table width="560" cellpadding="0" cellspacing="0" role="presentation"
            style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1),0 1px 2px rgba(0,0,0,0.06);">
            <tr>
              <td style="background:linear-gradient(135deg, #18181b 0%, #44403c 100%);padding:32px 40px;text-align:center;">
                <p style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.5px;">Vitriona</p>
                <p style="margin:8px 0 0;color:#fbbf24;font-size:13px;font-weight:600;">🤖 Solicitud de Activación — Chatbot IA</p>
              </td>
            </tr>
            <tr>
              <td style="padding:40px;">
                <h1 style="margin:0 0 24px;color:#18181b;font-size:22px;font-weight:600;">Activación de Chatbot IA</h1>

                <div style="background:#f4f4f5;border-radius:12px;padding:20px;margin-bottom:24px;">
                  <p style="margin:0 0 4px;color:#71717a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Usuario</p>
                  <p style="margin:0 0 12px;color:#18181b;font-size:15px;">${params.userName} (${params.userEmail})</p>
                  <p style="margin:0 0 4px;color:#71717a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Negocio</p>
                  <p style="margin:0;color:#18181b;font-size:15px;">${params.businessName}</p>
                </div>

                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                  <tr>
                    <td style="padding:10px 0;border-bottom:1px solid #e4e4e7;">
                      <span style="color:#71717a;font-size:13px;">Plan de IA solicitado</span>
                    </td>
                    <td style="padding:10px 0;border-bottom:1px solid #e4e4e7;text-align:right;">
                      <strong style="color:#d97706;font-size:14px;">🤖 ${planLabel}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0;border-bottom:1px solid #e4e4e7;">
                      <span style="color:#71717a;font-size:13px;">Capacidad</span>
                    </td>
                    <td style="padding:10px 0;border-bottom:1px solid #e4e4e7;text-align:right;">
                      <strong style="color:#18181b;font-size:14px;">${responsesLabel}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0;border-bottom:1px solid #e4e4e7;">
                      <span style="color:#71717a;font-size:13px;">Ciclo de facturación</span>
                    </td>
                    <td style="padding:10px 0;border-bottom:1px solid #e4e4e7;text-align:right;">
                      <strong style="color:#18181b;font-size:14px;">${cycleLabel}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0;border-bottom:1px solid #e4e4e7;">
                      <span style="color:#71717a;font-size:13px;">Monto</span>
                    </td>
                    <td style="padding:10px 0;border-bottom:1px solid #e4e4e7;text-align:right;">
                      <strong style="color:#18181b;font-size:14px;">$${params.amount}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0;border-bottom:1px solid #e4e4e7;">
                      <span style="color:#71717a;font-size:13px;">Método de pago</span>
                    </td>
                    <td style="padding:10px 0;border-bottom:1px solid #e4e4e7;text-align:right;">
                      <strong style="color:#18181b;font-size:14px;">${paymentLabel}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0;border-bottom:1px solid #e4e4e7;">
                      <span style="color:#71717a;font-size:13px;">Referencia de pago</span>
                    </td>
                    <td style="padding:10px 0;border-bottom:1px solid #e4e4e7;text-align:right;">
                      <strong style="color:#18181b;font-size:14px;font-family:'Courier New',monospace;">${params.referenceId}</strong>
                    </td>
                  </tr>
                </table>

                <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin-bottom:24px;">
                  <p style="margin:0 0 4px;color:#166534;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Datos de facturación</p>
                  <p style="margin:8px 0 4px;color:#18181b;font-size:14px;"><strong>${params.fullName}</strong></p>
                  <p style="margin:0 0 4px;color:#52525b;font-size:13px;">Cédula/RIF: ${params.idNumber}</p>
                  <p style="margin:0 0 4px;color:#52525b;font-size:13px;">Email: ${params.contactEmail}</p>
                  ${params.phone ? `<p style="margin:0 0 4px;color:#52525b;font-size:13px;">Teléfono: ${params.phone}</p>` : ''}
                </div>

                ${
                  params.notes
                    ? `<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:20px;margin-bottom:24px;">
                    <p style="margin:0 0 4px;color:#1e40af;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Notas</p>
                    <p style="margin:8px 0 0;color:#52525b;font-size:13px;line-height:1.5;">${params.notes}</p>
                  </div>`
                    : ''
                }

                <div style="background:#fef9c3;border:1px solid #fde047;border-radius:8px;padding:14px 16px;margin-bottom:24px;">
                  <p style="margin:0;color:#854d0e;font-size:13px;line-height:1.5;">
                    Recuerda verificar el pago antes de aprobar la activación del chatbot.
                  </p>
                </div>

                <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                  <tr>
                    <td align="center" style="padding:0 0 8px;">
                      <a href="${params.approveUrl}" style="display:inline-block;background:#16a34a;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 32px;border-radius:8px;">
                        ✓ Aprobar y activar chatbot
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td align="center">
                      <a href="${params.rejectUrl}" style="display:inline-block;background:#dc2626;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 32px;border-radius:8px;">
                        ✕ Rechazar solicitud
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="background:#f9f9f9;border-top:1px solid #e4e4e7;padding:20px 40px;text-align:center;">
                <p style="margin:0;color:#a1a1aa;font-size:12px;">
                  &copy; ${new Date().getFullYear()} Vitriona &middot; Todos los derechos reservados
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
