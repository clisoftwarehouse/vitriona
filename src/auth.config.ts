import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';

import { AUTH_ROUTES, PROTECTED_ROUTES } from '@/modules/auth/constants';

export const authConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: AUTH_ROUTES.LOGIN,
    error: AUTH_ROUTES.LOGIN,
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isProtectedRoute = PROTECTED_ROUTES.some((r) => nextUrl.pathname.startsWith(r));
      const isAuthRoute = Object.values(AUTH_ROUTES).some((r) => nextUrl.pathname.startsWith(r));

      if (isProtectedRoute && !isLoggedIn) {
        return Response.redirect(new URL(AUTH_ROUTES.LOGIN, nextUrl));
      }

      if (isAuthRoute && isLoggedIn) {
        return Response.redirect(new URL('/dashboard', nextUrl));
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = (user as { role?: string }).role ?? 'user';
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  session: { strategy: 'jwt' },
} satisfies NextAuthConfig;
