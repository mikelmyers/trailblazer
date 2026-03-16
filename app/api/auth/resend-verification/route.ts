import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }
    // Verification emails are handled by NextAuth's Email provider flow.
    // This endpoint exists as a placeholder for the UI.
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
