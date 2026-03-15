import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decode } from 'next-auth/jwt';

const publicPaths = ['/', '/pricing', '/about'];
const authPaths = ['/auth'];
const webhookPaths = ['/api/webhooks'];

async function getSession(req: NextRequest) {
  // NextAuth v5 uses "authjs.session-token" in dev,
  // "__Secure-authjs.session-token" in production (HTTPS)
  const secureCookie = req.nextUrl.protocol === 'https:';
  const cookieName = secureCookie
    ? '__Secure-authjs.session-token'
    : 'authjs.session-token';

  const token = req.cookies.get(cookieName)?.value;
  if (!token) return null;

  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) return null;

  try {
    // decode() from next-auth/jwt is lightweight (uses jose internally)
    // and handles the JWE decryption with the correct key derivation.
    // The salt parameter must match the cookie name used by Auth.js.
    const decoded = await decode({ token, secret, salt: cookieName });
    return decoded;
  } catch {
    return null;
  }
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static assets, auth API, and webhooks through immediately
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.includes('.')) {
    return NextResponse.next();
  }
  if (pathname.startsWith('/api/auth')) return NextResponse.next();
  if (webhookPaths.some(p => pathname.startsWith(p))) return NextResponse.next();

  // For the homepage, redirect authenticated users to their role-based dashboard
  if (pathname === '/') {
    const session = await getSession(request);
    if (session?.role) {
      const roleRedirects: Record<string, string> = {
        ADMIN: '/admin',
        DRIVER: '/driver',
        SHIPPER: '/shipper',
      };
      const dest = roleRedirects[session.role as string];
      if (dest) {
        return NextResponse.redirect(new URL(dest, request.url));
      }
    }
    return NextResponse.next();
  }

  // Allow other public paths
  if (publicPaths.includes(pathname)) return NextResponse.next();
  if (authPaths.some(p => pathname.startsWith(p))) return NextResponse.next();

  // Protected routes — require authentication
  const session = await getSession(request);
  if (!session) {
    const signInUrl = new URL('/auth/signin', request.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Role-based access
  const role = session.role as string;

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
