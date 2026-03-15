'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-text-primary">
      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <nav className="max-w-content mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center justify-between">
          <Link
            href="/"
            className="text-sm font-bold tracking-wide-label uppercase text-text-primary"
          >
            Trailblazer
          </Link>

          <div className="flex items-center gap-4 md:gap-8">
            <div className="hidden sm:flex items-center gap-6">
              <Link
                href="/pricing"
                className="text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="/about"
                className="text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                About
              </Link>
            </div>

            <div className="hidden sm:flex items-center gap-3">
              <Link
                href="/auth/signin"
                className="text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center h-9 px-4 text-sm font-medium text-white bg-accent rounded hover:bg-accent/90 transition-colors"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded-md text-text-secondary hover:bg-background-3 transition sm:hidden"
              aria-label="Toggle menu"
            >
              {menuOpen ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              )}
            </button>
          </div>
        </nav>

        {/* Mobile menu dropdown */}
        {menuOpen && (
          <div className="border-t border-border bg-background px-4 py-4 space-y-3 sm:hidden">
            <Link
              href="/pricing"
              onClick={() => setMenuOpen(false)}
              className="block text-sm text-text-secondary hover:text-text-primary transition-colors py-1.5"
            >
              Pricing
            </Link>
            <Link
              href="/about"
              onClick={() => setMenuOpen(false)}
              className="block text-sm text-text-secondary hover:text-text-primary transition-colors py-1.5"
            >
              About
            </Link>
            <hr className="border-border" />
            <Link
              href="/auth/signin"
              onClick={() => setMenuOpen(false)}
              className="block text-sm text-text-secondary hover:text-text-primary transition-colors py-1.5"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              onClick={() => setMenuOpen(false)}
              className="block w-full text-center h-10 leading-10 text-sm font-medium text-white bg-accent rounded hover:bg-accent/90 transition-colors"
            >
              Get Started
            </Link>
          </div>
        )}
      </header>

      {/* Page content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-surface-dark text-white">
        <div className="max-w-content mx-auto px-4 md:px-6 py-12 md:py-16">
          <div className="flex flex-col md:flex-row justify-between gap-8 md:gap-12">
            <div className="max-w-sm">
              <p className="text-sm font-bold tracking-wide-label uppercase mb-4">
                Trailblazer
              </p>
              <p className="text-sm text-white/50 leading-relaxed">
                Dispatch intelligence by Primordia Systems. Building
                infrastructure for the cognitive era of logistics.
              </p>
            </div>

            <div className="flex flex-wrap gap-8 sm:gap-16">
              <div>
                <p className="text-label uppercase text-white/30 mb-4">
                  Product
                </p>
                <ul className="space-y-3">
                  <li>
                    <Link
                      href="/pricing"
                      className="text-sm text-white/60 hover:text-white transition-colors"
                    >
                      Pricing
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/about"
                      className="text-sm text-white/60 hover:text-white transition-colors"
                    >
                      About
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <p className="text-label uppercase text-white/30 mb-4">
                  Account
                </p>
                <ul className="space-y-3">
                  <li>
                    <Link
                      href="/auth/signin"
                      className="text-sm text-white/60 hover:text-white transition-colors"
                    >
                      Sign In
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/auth/signup"
                      className="text-sm text-white/60 hover:text-white transition-colors"
                    >
                      Get Started
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <p className="text-label uppercase text-white/30 mb-4">
                  Company
                </p>
                <ul className="space-y-3">
                  <li>
                    <Link
                      href="mailto:contact@primordia.systems"
                      className="text-sm text-white/60 hover:text-white transition-colors"
                    >
                      Contact
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-12 md:mt-16 pt-8 border-t border-white/10">
            <p className="text-xs text-white/30">
              &copy; 2026 Primordia Systems. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
