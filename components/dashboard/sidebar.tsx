'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  items: SidebarItem[];
  className?: string;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ items, className = '', mobileOpen = false, onMobileClose }) => {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-60 bg-white border-r border-border py-6 flex-shrink-0 h-full
          transform transition-transform duration-200 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          md:relative md:translate-x-0 md:z-auto
          ${className}
        `}
      >
        {/* Mobile close button */}
        <div className="flex justify-end px-3 mb-2 md:hidden">
          <button
            onClick={onMobileClose}
            className="p-2 rounded-md text-text-secondary hover:bg-background-3 transition"
            aria-label="Close menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <nav className="flex flex-col gap-0.5 px-3">
          {items.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onMobileClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition ${
                  isActive
                    ? 'bg-background-3 font-medium text-text-primary'
                    : 'text-text-secondary hover:text-text-primary hover:bg-background-3'
                }`}
              >
                <span className="w-5 h-5 flex items-center justify-center flex-shrink-0 text-current">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

Sidebar.displayName = 'Sidebar';

export { Sidebar };
export type { SidebarProps, SidebarItem };
