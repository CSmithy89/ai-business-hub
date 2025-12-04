/**
 * Header Component (Placeholder)
 *
 * This is a placeholder for the full Header implementation in Story 07.3.
 * Currently shows a basic header bar with branding.
 */

export function Header() {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-30 flex h-[60px] items-center
                 justify-between border-b border-[rgb(var(--color-border-default))]
                 bg-[rgb(var(--color-bg-secondary))] px-6 shadow-xs"
    >
      <div className="flex items-center gap-3">
        {/* Logo placeholder */}
        <svg
          fill="none"
          height="24"
          viewBox="0 0 24 24"
          width="24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2.768a2 2 0 0 1 1.732 1l5.236 9.068a2 2 0 0 1 0 2l-5.236 9.068a2 2 0 0 1-1.732 1H12a2 2 0 0 1-1.732-1L5.032 14.836a2 2 0 0 1 0-2l5.236-9.068A2 2 0 0 1 12 2.768z"
            fill="#FF6B6B"
          />
        </svg>
        <h2 className="text-xl font-bold tracking-tighter text-[rgb(var(--color-text-primary))]">
          HYVVE
        </h2>
      </div>
      <div className="text-sm text-[rgb(var(--color-text-secondary))]">
        Header placeholder - Story 07.3
      </div>
    </header>
  );
}
