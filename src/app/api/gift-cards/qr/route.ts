import QRCode from 'qrcode';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const businessId = req.nextUrl.searchParams.get('businessId');

  if (!code || !businessId) {
    return new NextResponse('Missing code or businessId', { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://vitriona.app';
  const redeemUrl = `${appUrl}/dashboard/businesses/${encodeURIComponent(businessId)}/gift-cards/redeem?code=${encodeURIComponent(code)}`;

  const png = await QRCode.toBuffer(redeemUrl, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 360,
    color: { dark: '#111827', light: '#ffffff' },
  });

  return new NextResponse(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400, immutable',
    },
  });
}
