'use client';

import React from 'react';
import Link from 'next/link';

type Role = 'driver' | 'shipper' | 'admin';

interface HeaderProps {
  role: Role;
  userName?: string;
  onSignOut?: () => void;
  onMobileMenuToggle?: () => void;
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
  onMobileMenuToggle,
}) => {
  const navLinks = roleNavLinks[role];
  const initial = userName ? userName.charAt(0).toUpperCase() : role.charAt(0).toUpperCase();

  return (
    <header className="bg-white border-b border-border">
      <div className="flex items-center justify-between px-4 md:px-6 h-14 md:h-16">
        {/* Left: Hamburger + Logo + Role */}
        <div className="flex items-center gap-3 md:gap-6">
          {/* Mobile hamburger */}
          {onMobileMenuToggle && (
            <button
              onClick={onMobileMenuToggle}
              className="p-1.5 -ml-1.5 rounded-md text-text-secondary hover:bg-background-3 transition md:hidden"
              aria-label="Open menu"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          )}

          <div className="flex items-center gap-2 md:gap-3">
            <Link href="/" className="text-sm font-bold tracking-tight-h2 text-text-primary">
              TRAILBLAZER
            </Link>
            <span className="hidden sm:block w-1 h-1 rounded-full bg-border-strong" />
            <span className="hidden sm:block text-xs font-medium text-text-secondary">
              {roleLabels[role]}
            </span>
          </div>

          {/* Nav Links - hidden on mobile */}
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
        <div className="flex items-center gap-2 md:gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-background-3 text-xs font-semibold text-text-primary">
            {initial}
          </div>
          {onSignOut && (
            <button
              onClick={onSignOut}
              className="hidden sm:block text-sm text-text-secondary hover:text-text-primary transition"
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
