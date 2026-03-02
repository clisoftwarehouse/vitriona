import { redirect } from 'next/navigation';

import type { OtpPurpose } from '@/modules/auth/constants';
import { VerifyOtpForm } from '@/modules/auth/ui/components/verify-otp-form';

interface VerifyOtpPageProps {
  searchParams: Promise<{ email?: string; purpose?: string }>;
}

export default async function VerifyOtpPage({ searchParams }: VerifyOtpPageProps) {
  const { email, purpose } = await searchParams;

  const validPurposes: OtpPurpose[] = ['email_verification', 'password_reset'];

  if (!email || !purpose || !validPurposes.includes(purpose as OtpPurpose)) {
    redirect('/auth/login');
  }

  return <VerifyOtpForm email={decodeURIComponent(email)} purpose={purpose as OtpPurpose} />;
}
