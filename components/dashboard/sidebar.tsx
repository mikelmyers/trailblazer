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
}

const Sidebar: React.FC<SidebarProps> = ({ items, className = '' }) => {
  const pathname = usePathname();

  return (
    <aside
      className={`w-60 bg-white border-r border-border py-6 flex-shrink-0 h-full ${className}`}
    >
      <nav className="flex flex-col gap-0.5 px-3">
        {items.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition ${
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
  );
};

Sidebar.displayName = 'Sidebar';

export { Sidebar };
export type { SidebarProps, SidebarItem };
