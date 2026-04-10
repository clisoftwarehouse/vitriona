import { eq } from 'drizzle-orm';
import type { Metadata } from 'next';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { users, userPreferences } from '@/db/schema';
import { getExchangeRates } from '@/lib/get-exchange-rate';
import { QueryProvider } from '@/components/query-provider';
import { AdminLayout } from '@/components/layouts/admin-layout';
import { getBusinessesAction } from '@/modules/businesses/server/actions/get-businesses.action';
import { getActiveBusinessId } from '@/modules/businesses/server/actions/set-active-business.action';

export const metadata: Metadata = {
  title: 'Dashboard',
  robots: { index: false, follow: false },
};

const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
  const [session, businesses, activeBusinessId, exchangeRatesData] = await Promise.all([
    auth(),
    getBusinessesAction(),
    getActiveBusinessId(),
    getExchangeRates(),
  ]);

  const sidebarBusinesses = businesses.map((b) => ({ id: b.id, name: b.name, slug: b.slug }));

  // Fetch from DB so profile image updates are reflected immediately (JWT session caches the image at sign-in)
  const [dbUser, prefs] = session?.user?.id
    ? await Promise.all([
        db
          .select({ name: users.name, image: users.image })
          .from(users)
          .where(eq(users.id, session.user.id))
          .limit(1)
          .then((r) => r[0] ?? null),
        db
          .select({ sidebarCollapsed: userPreferences.sidebarCollapsed })
          .from(userPreferences)
          .where(eq(userPreferences.userId, session.user.id))
          .limit(1)
          .then((r) => r[0] ?? null),
      ])
    : [null, null];

  const user = {
    name: dbUser?.name ?? session?.user?.name ?? null,
    email: session?.user?.email ?? null,
    image: dbUser?.image ?? session?.user?.image ?? null,
  };

  return (
    <QueryProvider>
      <AdminLayout
        user={user}
        businesses={sidebarBusinesses}
        activeBusinessId={activeBusinessId}
        initialSidebarCollapsed={prefs?.sidebarCollapsed ?? false}
        exchangeRates={exchangeRatesData}
      >
        {children}
      </AdminLayout>
    </QueryProvider>
  );
};

export default DashboardLayout;
