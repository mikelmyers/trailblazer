import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicPaths = ['/', '/pricing', '/about'];
const authPaths = ['/auth'];
const webhookPaths = ['/api/webhooks'];

/**
 * Decode the NextAuth v5 JWT session token from cookies.
 * NextAuth v5 (Auth.js) uses cookie name "authjs.session-token" (or
 * "__Secure-authjs.session-token" in production with HTTPS).
 * We decode the JWT manually to avoid importing next-auth (which bundles
 * Prisma/bcrypt and exceeds the 1MB Edge Function limit).
 */
async function getSessionToken(req: NextRequest): Promise<Record<string, unknown> | null> {
  const cookieName =
    process.env.NODE_ENV === 'production'
      ? '__Secure-authjs.session-token'
      : 'authjs.session-token';

  const token = req.cookies.get(cookieName)?.value;
  if (!token) return null;

  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) return null;

  try {
    // NextAuth v5 uses a JWE (encrypted JWT). We need the jose library
    // which is already a dependency of next-auth and available in Edge.
    const { jwtDecrypt } = await import('jose');
    const encoder = new TextEncoder();
    // NextAuth v5 derives the encryption key by hashing the secret
    const { subtle } = globalThis.crypto;
    const keyMaterial = await subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HKDF' },
      false,
      ['deriveKey']
    );
    const derivedKey = await subtle.deriveKey(
      { name: 'HKDF', hash: 'SHA-256', salt: encoder.encode(''), info: encoder.encode('Auth.js Generated Encryption Key') },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    // Wrap as a CryptoKey for jose
    const { payload } = await jwtDecrypt(token, derivedKey);
    return payload as Record<string, unknown>;
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
    const session = await getSessionToken(request);
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
  const session = await getSessionToken(request);
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
