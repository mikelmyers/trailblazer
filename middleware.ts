import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const publicPaths = ['/', '/pricing', '/about'];
const authPaths = ['/auth'];
const webhookPaths = ['/api/webhooks'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (publicPaths.includes(pathname)) return NextResponse.next();
  if (authPaths.some(p => pathname.startsWith(p))) return NextResponse.next();
  if (webhookPaths.some(p => pathname.startsWith(p))) return NextResponse.next();
  if (pathname.startsWith('/api/auth')) return NextResponse.next();
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.includes('.')) return NextResponse.next();

  const token = await getToken({ req: request });

  if (!token) {
    const signInUrl = new URL('/auth/signin', request.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Role-based access
  const role = token.role as string;

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
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
