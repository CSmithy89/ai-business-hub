/**
 * Skip Link Component
 *
 * Accessibility feature for keyboard navigation.
 * Hidden by default, visible when focused (Tab key).
 * Allows users to skip directly to main content.
 *
 * Epic: 07 - UI Shell
 * Technical Debt: Add skip link for keyboard accessibility
 */

'use client';

interface SkipLinkProps {
  /** Target element ID to skip to (without #) */
  targetId?: string;
  /** Link text */
  children?: React.ReactNode;
}

/**
 * Skip to main content link for keyboard accessibility.
 * Place at the very beginning of your layout.
 *
 * @example
 * ```tsx
 * <SkipLink targetId="main-content" />
 * <Header />
 * <main id="main-content">...</main>
 * ```
 */
export function SkipLink({
  targetId = 'main-content',
  children = 'Skip to main content',
}: SkipLinkProps) {
  return (
    <a
      href={`#${targetId}`}
      className="
        sr-only
        focus:not-sr-only
        focus:absolute
        focus:left-4
        focus:top-4
        focus:z-[9999]
        focus:rounded-md
        focus:bg-[rgb(var(--color-primary-500))]
        focus:px-4
        focus:py-2
        focus:text-white
        focus:outline-none
        focus:ring-2
        focus:ring-[rgb(var(--color-primary-300))]
        focus:ring-offset-2
      "
    >
      {children}
    </a>
  );
}
