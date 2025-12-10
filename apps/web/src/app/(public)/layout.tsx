import Link from 'next/link';

interface PublicLayoutProps {
  children: React.ReactNode;
}

/**
 * Public Layout
 *
 * Simple layout for public pages (Terms, Privacy, etc.)
 * Features:
 * - Clean, minimal design
 * - Header with logo and navigation
 * - Footer with copyright
 */
export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#FF6B6B] rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900">HYVVE</span>
          </Link>

          <nav className="flex items-center gap-6">
            <Link
              href="/sign-in"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="text-sm px-4 py-2 bg-[#FF6B6B] text-white rounded-lg hover:bg-[#FF6B6B]/90"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-12">{children}</div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-500">
              © {new Date().getFullYear()} HYVVE. All rights reserved.
            </div>
            <nav className="flex items-center gap-6">
              <Link
                href="/terms"
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Terms of Service
              </Link>
              <Link
                href="/privacy"
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Privacy Policy
              </Link>
              <Link
                href="/help"
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Help
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
