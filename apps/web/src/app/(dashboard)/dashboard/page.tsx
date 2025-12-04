import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | HYVVE',
  description: 'Your HYVVE dashboard',
};

/**
 * Dashboard Page
 *
 * Main dashboard page with three-panel layout (Story 07-1).
 * Full dashboard implementation will be in Story 07-9.
 */
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold leading-snug text-[rgb(var(--color-text-primary))]">
          Dashboard
        </h1>
        <p className="text-sm text-[rgb(var(--color-text-secondary))]">
          Welcome to your HYVVE dashboard
        </p>
      </div>

      {/* Dashboard Content Grid - Placeholder */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Placeholder cards with skeleton loading effect */}
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-lg bg-[rgb(var(--color-bg-secondary))]
                       p-6 shadow-sm border border-[rgb(var(--color-border-subtle))]"
          >
            <div className="h-4 w-2/3 rounded bg-[rgb(var(--color-bg-tertiary))]"></div>
            <div className="mt-4 h-2 w-1/2 rounded bg-[rgb(var(--color-bg-tertiary))]"></div>
            <div className="mt-2 h-2 w-full rounded bg-[rgb(var(--color-bg-tertiary))]"></div>
            <div className="mt-2 h-2 w-3/4 rounded bg-[rgb(var(--color-bg-tertiary))]"></div>
            <div className="mt-8 h-8 w-1/3 rounded-md bg-[rgb(var(--color-bg-tertiary))]"></div>
          </div>
        ))}
      </div>

      {/* Info message */}
      <div
        className="p-6 bg-[rgb(var(--color-bg-secondary))] rounded-lg
                   border border-[rgb(var(--color-border-subtle))] shadow-sm"
      >
        <p className="text-[rgb(var(--color-text-primary))]">
          Dashboard layout is now active! Full dashboard implementation coming in{' '}
          <strong>Story 07-9</strong>.
        </p>
        <p className="text-sm text-[rgb(var(--color-text-secondary))] mt-2">
          Try collapsing the sidebar and chat panel to see the responsive layout in action.
        </p>
      </div>
    </div>
  );
}
