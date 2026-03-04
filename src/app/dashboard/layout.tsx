import { auth } from '@/auth';
import { AdminLayout } from '@/components/layouts/admin-layout';

const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth();
  const user = {
    name: session?.user?.name ?? null,
    email: session?.user?.email ?? null,
    image: session?.user?.image ?? null,
  };

  return <AdminLayout user={user}>{children}</AdminLayout>;
};

export default DashboardLayout;
