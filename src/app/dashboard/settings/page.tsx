import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { SettingsTabs } from '@/modules/users/ui/components/settings-tabs';
import { getUserProfileAction } from '@/modules/users/server/actions/get-user-profile.action';

export const metadata = { title: 'Configuración — Vitriona' };

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/auth/login');

  const result = await getUserProfileAction();
  if (result.error || !result.user) redirect('/auth/login');

  return (
    <div className='mx-auto max-w-2xl space-y-6 p-4 sm:p-6'>
      <div>
        <h1 className='text-2xl font-bold tracking-tight'>Configuración</h1>
        <p className='text-muted-foreground text-sm'>Administra tu cuenta y preferencias.</p>
      </div>

      <SettingsTabs
        user={result.user}
        providers={result.providers}
        hasPassword={result.hasPassword}
        preferences={result.preferences}
        businesses={result.businesses}
      />
    </div>
  );
}
