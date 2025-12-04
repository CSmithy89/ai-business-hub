/**
 * Null-Safe Pathname Hook
 *
 * Wrapper around Next.js usePathname that returns empty string instead of null.
 * This simplifies component logic by eliminating null checks.
 *
 * Usage:
 * ```tsx
 * const pathname = useNullSafePathname();
 * const isActive = pathname.startsWith('/dashboard');
 * ```
 *
 * Epic: 07 - UI Shell
 * Technical Debt: Standardize pathname handling across components
 */

'use client';

import { usePathname } from 'next/navigation';

/**
 * Returns the current pathname, defaulting to empty string if null.
 * This is useful for components that need to check paths but don't want
 * to handle null cases.
 *
 * @returns Current pathname or empty string
 */
export function useNullSafePathname(): string {
  const pathname = usePathname();
  return pathname ?? '';
}
