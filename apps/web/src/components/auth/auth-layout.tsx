import Link from 'next/link'

interface AuthLayoutProps {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Branding Section - Left Panel */}
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-primary/10 to-transparent p-12">
        <div className="space-y-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
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
            <span className="text-2xl font-bold text-gray-900">HYVVE</span>
          </Link>

          {/* Tagline */}
          <div className="space-y-4 max-w-md">
            <h1 className="text-4xl font-bold text-gray-900 leading-tight">
              Empower Your Business with AI.
            </h1>
            <p className="text-lg text-gray-600">
              Automate, analyze, and accelerate your operations with intelligent workflows designed
              for modern businesses. Experience 90% automation with just 5 hours of weekly oversight.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-sm text-gray-500">
          © {new Date().getFullYear()} HYVVE. All rights reserved.
        </div>
      </div>

      {/* Form Section - Right Panel */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
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
          </div>

          {/* Form Content */}
          {children}
        </div>
      </div>
    </div>
  )
}
