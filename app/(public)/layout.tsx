import Link from "next/link";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-text-primary">
      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <nav className="max-w-content mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="text-sm font-bold tracking-wide-label uppercase text-text-primary"
          >
            Trailblazer
          </Link>

          <div className="flex items-center gap-8">
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

            <div className="flex items-center gap-3">
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
          </div>
        </nav>
      </header>

      {/* Page content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-surface-dark text-white">
        <div className="max-w-content mx-auto px-6 py-16">
          <div className="flex flex-col md:flex-row justify-between gap-12">
            <div className="max-w-sm">
              <p className="text-sm font-bold tracking-wide-label uppercase mb-4">
                Trailblazer
              </p>
              <p className="text-sm text-white/50 leading-relaxed">
                Dispatch intelligence by Primordia Systems. Building
                infrastructure for the cognitive era of logistics.
              </p>
            </div>

            <div className="flex gap-16">
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

          <div className="mt-16 pt-8 border-t border-white/10">
            <p className="text-xs text-white/30">
              &copy; 2024 Primordia Systems. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
