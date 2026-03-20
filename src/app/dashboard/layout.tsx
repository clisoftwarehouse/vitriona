import type { Metadata } from 'next';

import { auth } from '@/auth';
import { QueryProvider } from '@/components/query-provider';
import { AdminLayout } from '@/components/layouts/admin-layout';
import { getBusinessesAction } from '@/modules/businesses/server/actions/get-businesses.action';
import { getActiveBusinessId } from '@/modules/businesses/server/actions/set-active-business.action';

export const metadata: Metadata = {
  title: 'Dashboard',
  robots: { index: false, follow: false },
};

const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
  const [session, businesses, activeBusinessId] = await Promise.all([
    auth(),
    getBusinessesAction(),
    getActiveBusinessId(),
  ]);

  const sidebarBusinesses = businesses.map((b) => ({ id: b.id, name: b.name, slug: b.slug }));

  const user = {
    name: session?.user?.name ?? null,
    email: session?.user?.email ?? null,
    image: session?.user?.image ?? null,
  };

  return (
    <QueryProvider>
      <AdminLayout user={user} businesses={sidebarBusinesses} activeBusinessId={activeBusinessId}>
        {children}
      </AdminLayout>
    </QueryProvider>
  );
};

export default DashboardLayout;
