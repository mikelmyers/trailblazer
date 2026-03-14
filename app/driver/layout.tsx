import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { DriverShell } from './driver-shell';

export default async function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/signin');
  }

  if (session.user.role !== 'DRIVER') {
    redirect('/');
  }

  return (
    <DriverShell userName={session.user.name ?? undefined}>
      {children}
    </DriverShell>
  );
}
