import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = await cookies();
  // Clear Auth.js session cookies
  cookieStore.delete('authjs.session-token');
  cookieStore.delete('__Secure-authjs.session-token');
  cookieStore.delete('authjs.callback-url');
  cookieStore.delete('authjs.csrf-token');

  return NextResponse.json({ ok: true });
}
