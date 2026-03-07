import type { Metadata } from 'next';

import { auth } from '@/auth';
import { AdminLayout } from '@/components/layouts/admin-layout';
import {
  getActiveCatalogId,
  getAllCatalogsForSidebar,
} from '@/modules/catalogs/server/actions/set-active-catalog.action';

export const metadata: Metadata = {
  title: 'Dashboard',
  robots: { index: false, follow: false },
};

const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
  const [session, catalogs, activeCatalogId] = await Promise.all([
    auth(),
    getAllCatalogsForSidebar(),
    getActiveCatalogId(),
  ]);

  const user = {
    name: session?.user?.name ?? null,
    email: session?.user?.email ?? null,
    image: session?.user?.image ?? null,
  };

  return (
    <AdminLayout user={user} catalogs={catalogs} activeCatalogId={activeCatalogId}>
      {children}
    </AdminLayout>
  );
};

export default DashboardLayout;
