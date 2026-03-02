import { LoginForm } from '@/modules/auth/ui/components/login-form';

interface LoginPageProps {
  searchParams: Promise<{ verified?: string; reset?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { reset, verified } = await searchParams;

  const successMessage = verified
    ? '¡Email verificado correctamente! Ya puedes iniciar sesión.'
    : reset
      ? 'Contraseña actualizada correctamente. Inicia sesión con tu nueva contraseña.'
      : undefined;

  return <LoginForm successMessage={successMessage} />;
}
