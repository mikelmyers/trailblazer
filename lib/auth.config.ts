import type { NextAuthConfig } from 'next-auth';

/**
 * Lightweight NextAuth config for use in Edge middleware.
 * Contains NO adapter, NO Prisma, NO bcrypt — only the session/JWT
 * config and callbacks needed to decode the session token.
 *
 * The full config (with adapter + providers) lives in auth.ts.
 */
export const authConfig: NextAuthConfig = {
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  trustHost: true,
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin',
    verifyRequest: '/auth/verify',
  },
  // Providers are added in auth.ts — middleware doesn't need them.
  // An empty array is required for the type but won't be used.
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;

      // Allow public paths
      const publicPaths = ['/', '/pricing', '/about'];
      if (publicPaths.includes(pathname)) return true;
      if (pathname.startsWith('/auth')) return true;
      if (pathname.startsWith('/api/auth')) return true;
      if (pathname.startsWith('/api/webhooks')) return true;

      // Everything else requires auth
      return !!auth;
    },
    async jwt({ token, user }) {
      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.role = (user as any).role;
        token.id = user.id as string;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};
