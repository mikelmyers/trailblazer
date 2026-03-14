'use client';

import React from 'react';
import Link from 'next/link';

type Role = 'driver' | 'shipper' | 'admin';

interface HeaderProps {
  role: Role;
  userName?: string;
  onSignOut?: () => void;
}

const roleLabels: Record<Role, string> = {
  driver: 'Driver Portal',
  shipper: 'Shipper Portal',
  admin: 'Admin Console',
};

const roleNavLinks: Record<Role, { label: string; href: string }[]> = {
  driver: [
    { label: 'Dashboard', href: '/driver' },
    { label: 'Jobs', href: '/driver/jobs' },
    { label: 'Earnings', href: '/driver/earnings' },
  ],
  shipper: [
    { label: 'Dashboard', href: '/shipper' },
    { label: 'Shipments', href: '/shipper/shipments' },
    { label: 'Analytics', href: '/shipper/analytics' },
  ],
  admin: [
    { label: 'Dashboard', href: '/admin' },
    { label: 'Users', href: '/admin/users' },
    { label: 'Jobs', href: '/admin/jobs' },
    { label: 'Settings', href: '/admin/settings' },
  ],
};

const Header: React.FC<HeaderProps> = ({
  role,
  userName = '',
  onSignOut,
}) => {
  const navLinks = roleNavLinks[role];
  const initial = userName ? userName.charAt(0).toUpperCase() : role.charAt(0).toUpperCase();

  return (
    <header className="bg-white border-b border-border">
      <div className="flex items-center justify-between px-6 h-16">
        {/* Left: Logo + Role */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm font-bold tracking-tight-h2 text-text-primary">
              TRAILBLAZER
            </Link>
            <span className="w-1 h-1 rounded-full bg-border-strong" />
            <span className="text-xs font-medium text-text-secondary">
              {roleLabels[role]}
            </span>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary hover:bg-background-3 rounded-md transition"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right: User + Sign Out */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-background-3 text-xs font-semibold text-text-primary">
            {initial}
          </div>
          {onSignOut && (
            <button
              onClick={onSignOut}
              className="text-sm text-text-secondary hover:text-text-primary transition"
            >
              Sign out
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

Header.displayName = 'Header';

export { Header };
export type { HeaderProps, Role };
