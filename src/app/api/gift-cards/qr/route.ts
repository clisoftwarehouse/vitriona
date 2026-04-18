import QRCode from 'qrcode';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');

  if (!code) {
    return new NextResponse('Missing code', { status: 400 });
  }

  const png = await QRCode.toBuffer(code, {
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
