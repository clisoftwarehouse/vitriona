import { auth } from '@/auth';
import { AdminLayout } from '@/components/layouts/admin-layout';
import { getBusinessesAction } from '@/modules/businesses/server/actions/get-businesses.action';
import { getActiveBusinessId } from '@/modules/businesses/server/actions/set-active-business.action';

const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
  const [session, businesses, activeBusinessId] = await Promise.all([
    auth(),
    getBusinessesAction(),
    getActiveBusinessId(),
  ]);

  const user = {
    name: session?.user?.name ?? null,
    email: session?.user?.email ?? null,
    image: session?.user?.image ?? null,
  };

  const sidebarBusinesses = businesses.map((b) => ({ id: b.id, name: b.name, slug: b.slug }));

  return (
    <AdminLayout user={user} businesses={sidebarBusinesses} activeBusinessId={activeBusinessId}>
      {children}
    </AdminLayout>
  );
};

export default DashboardLayout;
