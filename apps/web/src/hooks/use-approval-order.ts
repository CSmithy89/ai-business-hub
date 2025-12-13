/**
 * Approval Order Hook
 *
 * Manages custom ordering of approval items via drag-and-drop.
 * Persists order in localStorage keyed by workspace.
 *
 * Epic: 16 - Premium Polish
 * Story: 16-17 - Approval Queue Drag and Drop
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { ApprovalItem } from '@hyvve/shared';
import { STORAGE_APPROVAL_ORDER_PREFIX } from '@/lib/storage-keys';

interface ApprovalOrderState {
  order: string[]; // Array of approval IDs in custom order
  lastUpdated: number;
}

interface UseApprovalOrderReturn {
  /** Reorder approvals based on custom order */
  orderedApprovals: ApprovalItem[];
  /** Update the order after drag-and-drop */
  updateOrder: (newOrder: string[]) => void;
  /** Reset to default order */
  resetOrder: () => void;
  /** Check if custom order is applied */
  hasCustomOrder: boolean;
  /** Previous order for undo functionality */
  previousOrder: string[] | null;
  /** Undo the last reorder operation */
  undoReorder: () => void;
}

/**
 * Hook for managing approval queue custom ordering
 */
export function useApprovalOrder(
  approvals: ApprovalItem[],
  workspaceId?: string
): UseApprovalOrderReturn {
  const storageKey = `${STORAGE_APPROVAL_ORDER_PREFIX}${workspaceId || 'default'}`;

  // Load initial state from localStorage
  const [customOrder, setCustomOrder] = useState<string[]>([]);
  const [previousOrder, setPreviousOrder] = useState<string[] | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load order from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed: ApprovalOrderState = JSON.parse(stored);
        setCustomOrder(parsed.order);
      }
    } catch {
      // Invalid stored data, start fresh
      if (process.env.NODE_ENV === 'development') {
        console.warn('[useApprovalOrder] Failed to parse localStorage data, starting fresh');
      }
      setCustomOrder([]);
    }
    setIsInitialized(true);
  }, [storageKey]);

  // Save order to localStorage
  const saveOrder = useCallback(
    (order: string[]) => {
      if (typeof window === 'undefined') return;

      try {
        const state: ApprovalOrderState = {
          order,
          lastUpdated: Date.now(),
        };
        localStorage.setItem(storageKey, JSON.stringify(state));
      } catch {
        // Storage full or disabled - continue without persistence
        console.warn('Unable to save approval order to localStorage');
      }
    },
    [storageKey]
  );

  // Update order after drag-and-drop
  const updateOrder = useCallback(
    (newOrder: string[]) => {
      setPreviousOrder(customOrder);
      setCustomOrder(newOrder);
      saveOrder(newOrder);
    },
    [customOrder, saveOrder]
  );

  // Reset to default order
  const resetOrder = useCallback(() => {
    setPreviousOrder(customOrder);
    setCustomOrder([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(storageKey);
    }
  }, [customOrder, storageKey]);

  // Undo last reorder
  const undoReorder = useCallback(() => {
    if (previousOrder !== null) {
      const currentOrder = customOrder;
      setCustomOrder(previousOrder);
      saveOrder(previousOrder);
      setPreviousOrder(currentOrder);
    }
  }, [previousOrder, customOrder, saveOrder]);

  // Apply custom order to approvals
  const orderedApprovals = useMemo(() => {
    if (!isInitialized || customOrder.length === 0) {
      return approvals;
    }

    // Separate pending and non-pending items
    const pendingItems = approvals.filter((a) => a.status === 'pending');
    const nonPendingItems = approvals.filter((a) => a.status !== 'pending');

    // Create a map for quick lookup
    const pendingMap = new Map(pendingItems.map((item) => [item.id, item]));

    // Order pending items based on custom order
    const orderedPending: ApprovalItem[] = [];
    const orderedIds = new Set<string>();

    // First, add items in custom order
    for (const id of customOrder) {
      const item = pendingMap.get(id);
      if (item) {
        orderedPending.push(item);
        orderedIds.add(id);
      }
    }

    // Then add any remaining pending items not in custom order
    for (const item of pendingItems) {
      if (!orderedIds.has(item.id)) {
        orderedPending.push(item);
      }
    }

    // Combine: ordered pending items first, then non-pending items
    return [...orderedPending, ...nonPendingItems];
  }, [approvals, customOrder, isInitialized]);

  const hasCustomOrder = customOrder.length > 0;

  return {
    orderedApprovals,
    updateOrder,
    resetOrder,
    hasCustomOrder,
    previousOrder,
    undoReorder,
  };
}
