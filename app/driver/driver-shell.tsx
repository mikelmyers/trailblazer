'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/dashboard/header';
import { Sidebar } from '@/components/dashboard/sidebar';

/* ── SVG icon helpers ─────────────────────────────────────────────────────── */

const DashboardIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const JobsIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" />
    <path d="M9 14l2 2 4-4" />
  </svg>
);

const EarningsIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
  </svg>
);

const ProfileIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const SubscriptionIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);

const sidebarItems = [
  { label: 'Dashboard', href: '/driver', icon: DashboardIcon },
  { label: 'Jobs', href: '/driver/jobs', icon: JobsIcon },
  { label: 'Earnings', href: '/driver/earnings', icon: EarningsIcon },
  { label: 'Profile', href: '/driver/profile', icon: ProfileIcon },
  { label: 'Subscription', href: '/driver/subscription', icon: SubscriptionIcon },
];

interface DriverShellProps {
  userName?: string;
  children: React.ReactNode;
}

const DriverShell: React.FC<DriverShellProps> = ({ userName, children }) => {
  const router = useRouter();

  const handleSignOut = async () => {
    await fetch('/api/auth/signout', { method: 'POST' });
    router.push('/auth/signin');
  };

  return (
    <div className="min-h-screen bg-background-2 flex flex-col">
      <Header role="driver" userName={userName} onSignOut={handleSignOut} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar items={sidebarItems} />

        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-content mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};

DriverShell.displayName = 'DriverShell';

export { DriverShell };
