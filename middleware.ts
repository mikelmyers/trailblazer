import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';

const { auth } = NextAuth(authConfig);

export default auth((request) => {
  const { pathname } = request.nextUrl;
  const session = request.auth;

  // For the homepage, redirect authenticated users to their role-based dashboard
  if (pathname === '/') {
    if (session?.user) {
      const role = (session.user as any).role as string;
      const roleRedirects: Record<string, string> = {
        ADMIN: '/admin',
        DRIVER: '/driver',
        SHIPPER: '/shipper',
      };
      const dest = roleRedirects[role];
      if (dest) {
        return Response.redirect(new URL(dest, request.url));
      }
    }
    return;
  }

  // Allow public/auth paths (handled by authorized callback in auth.config)
  // If we get here on a protected path without auth, the authorized callback
  // already redirected to signin. Handle role-based access below.

  if (!session?.user) return;

  const role = (session.user as any).role as string;

  if (pathname.startsWith('/driver') && role !== 'DRIVER' && role !== 'ADMIN') {
    return Response.redirect(new URL('/', request.url));
  }
  if (pathname.startsWith('/shipper') && role !== 'SHIPPER' && role !== 'ADMIN') {
    return Response.redirect(new URL('/', request.url));
  }
  if (pathname.startsWith('/admin') && role !== 'ADMIN') {
    return Response.redirect(new URL('/', request.url));
  }
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/auth).*)'],
};
