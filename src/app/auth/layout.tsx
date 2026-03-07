import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Autenticación',
  robots: { index: false, follow: false },
};

const AuthLayout = ({ children }: Readonly<{ children: React.ReactNode }>) => {
  return (
    <main className='bg-background flex min-h-screen items-center justify-center px-4 py-12'>
      <div className='w-full max-w-sm'>{children}</div>
    </main>
  );
};

export default AuthLayout;
