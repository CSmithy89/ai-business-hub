import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard | HYVVE',
  description: 'Your HYVVE dashboard',
}

/**
 * Dashboard Page (Placeholder)
 *
 * This is a placeholder page for the dashboard.
 * Full dashboard implementation will be in Epic 02.
 */
export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-6 text-center">
        <div className="w-24 h-24 bg-[#FF6B6B] rounded-full flex items-center justify-center mx-auto">
          <svg
            className="w-12 h-12 text-white"
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

        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">Welcome to HYVVE!</h1>
          <p className="text-xl text-gray-600">
            Your dashboard is under construction.
          </p>
        </div>

        <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
          <p className="text-gray-700">
            Full dashboard implementation will be available in <strong>Epic 02</strong>.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            For now, you&apos;ve successfully signed in and authenticated!
          </p>
        </div>

        <div className="flex gap-4 justify-center">
          <a
            href="/sign-out"
            className="inline-flex items-center justify-center px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-md font-medium transition-colors"
          >
            Sign Out
          </a>
        </div>
      </div>
    </div>
  )
}
