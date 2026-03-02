import { redirect } from 'next/navigation';

import { ResetPasswordForm } from '@/modules/auth/ui/components/reset-password-form';

interface ResetPasswordPageProps {
  searchParams: Promise<{ email?: string; token?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { email, token } = await searchParams;

  if (!email || !token) {
    redirect('/auth/login');
  }

  return <ResetPasswordForm email={decodeURIComponent(email)} resetToken={token} />;
}
