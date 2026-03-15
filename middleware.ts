import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const publicPaths = ['/', '/pricing', '/about'];
const authPaths = ['/auth'];
const webhookPaths = ['/api/webhooks'];

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
        return NextResponse.redirect(new URL(dest, request.url));
      }
    }
    return NextResponse.next();
  }

  // Allow other public paths
  if (publicPaths.includes(pathname)) return NextResponse.next();
  if (authPaths.some(p => pathname.startsWith(p))) return NextResponse.next();
  if (webhookPaths.some(p => pathname.startsWith(p))) return NextResponse.next();
  if (pathname.startsWith('/api/auth')) return NextResponse.next();
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.includes('.')) return NextResponse.next();

  // Protected routes — require authentication
  if (!session?.user) {
    const signInUrl = new URL('/auth/signin', request.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Role-based access
  const role = (session.user as any).role as string;

  if (pathname.startsWith('/driver') && role !== 'DRIVER' && role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/', request.url));
  }
  if (pathname.startsWith('/shipper') && role !== 'SHIPPER' && role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/', request.url));
  }
  if (pathname.startsWith('/admin') && role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
