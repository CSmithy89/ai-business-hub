import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useApprovalOrder } from '../use-approval-order';
import type { ApprovalItem } from '@hyvve/shared';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    // Helper for tests
    _getStore: () => store,
  };
})();

// Create mock approval items
const createMockApproval = (
  id: string,
  status: 'pending' | 'approved' | 'rejected' | 'auto_approved' = 'pending'
): ApprovalItem => ({
  id,
  workspaceId: 'workspace-1',
  type: 'email',
  title: `Approval ${id}`,
  confidenceScore: 75,
  confidenceLevel: 'medium',
  status,
  data: {},
  createdBy: 'agent-1',
  createdAt: new Date(),
  priority: 1,
});

describe('useApprovalOrder', () => {
  const originalLocalStorage = window.localStorage;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
    });
    vi.restoreAllMocks();
  });

  describe('initial state', () => {
    it('provides all expected return values', () => {
      const approvals = [createMockApproval('1'), createMockApproval('2')];
      const { result } = renderHook(() => useApprovalOrder(approvals, 'workspace-1'));

      expect(result.current).toHaveProperty('orderedApprovals');
      expect(result.current).toHaveProperty('updateOrder');
      expect(result.current).toHaveProperty('resetOrder');
      expect(result.current).toHaveProperty('hasCustomOrder');
      expect(result.current).toHaveProperty('previousOrder');
      expect(result.current).toHaveProperty('undoReorder');
    });

    it('returns approvals in original order when no custom order exists', async () => {
      const approvals = [
        createMockApproval('1'),
        createMockApproval('2'),
        createMockApproval('3'),
      ];
      const { result } = renderHook(() => useApprovalOrder(approvals, 'workspace-1'));

      // Wait for initialization
      await waitFor(() => {
        expect(result.current.orderedApprovals.map((a) => a.id)).toEqual(['1', '2', '3']);
      });
    });

    it('starts with hasCustomOrder=false', async () => {
      const approvals = [createMockApproval('1')];
      const { result } = renderHook(() => useApprovalOrder(approvals, 'workspace-1'));

      await waitFor(() => {
        expect(result.current.hasCustomOrder).toBe(false);
      });
    });

    it('starts with previousOrder=null', () => {
      const approvals = [createMockApproval('1')];
      const { result } = renderHook(() => useApprovalOrder(approvals, 'workspace-1'));

      expect(result.current.previousOrder).toBe(null);
    });
  });

  describe('localStorage persistence', () => {
    it('uses workspace-specific storage key', async () => {
      const approvals = [createMockApproval('1'), createMockApproval('2')];
      renderHook(() => useApprovalOrder(approvals, 'my-workspace'));

      await waitFor(() => {
        expect(localStorageMock.getItem).toHaveBeenCalledWith('hyvve-approval-order-my-workspace');
      });
    });

    it('uses "default" key when no workspaceId provided', async () => {
      const approvals = [createMockApproval('1')];
      renderHook(() => useApprovalOrder(approvals));

      await waitFor(() => {
        expect(localStorageMock.getItem).toHaveBeenCalledWith('hyvve-approval-order-default');
      });
    });

    it('loads saved order from localStorage', async () => {
      const savedState = { order: ['2', '1', '3'], lastUpdated: Date.now() };
      localStorageMock.setItem('hyvve-approval-order-workspace-1', JSON.stringify(savedState));

      const approvals = [
        createMockApproval('1'),
        createMockApproval('2'),
        createMockApproval('3'),
      ];
      const { result } = renderHook(() => useApprovalOrder(approvals, 'workspace-1'));

      await waitFor(() => {
        expect(result.current.orderedApprovals.map((a) => a.id)).toEqual(['2', '1', '3']);
      });
    });

    it('handles corrupted localStorage data gracefully', async () => {
      localStorageMock.setItem('hyvve-approval-order-workspace-1', 'not-valid-json');

      const approvals = [createMockApproval('1'), createMockApproval('2')];
      const { result } = renderHook(() => useApprovalOrder(approvals, 'workspace-1'));

      await waitFor(() => {
        // Should fall back to original order
        expect(result.current.orderedApprovals.map((a) => a.id)).toEqual(['1', '2']);
        expect(result.current.hasCustomOrder).toBe(false);
      });
    });
  });

  describe('updateOrder', () => {
    it('updates the order of approvals', async () => {
      const approvals = [
        createMockApproval('1'),
        createMockApproval('2'),
        createMockApproval('3'),
      ];
      const { result } = renderHook(() => useApprovalOrder(approvals, 'workspace-1'));

      await waitFor(() => {
        expect(result.current.orderedApprovals.length).toBe(3);
      });

      act(() => {
        result.current.updateOrder(['3', '1', '2']);
      });

      expect(result.current.orderedApprovals.map((a) => a.id)).toEqual(['3', '1', '2']);
      expect(result.current.hasCustomOrder).toBe(true);
    });

    it('saves order to localStorage', async () => {
      const approvals = [createMockApproval('1'), createMockApproval('2')];
      const { result } = renderHook(() => useApprovalOrder(approvals, 'workspace-1'));

      await waitFor(() => {
        expect(result.current.orderedApprovals.length).toBe(2);
      });

      act(() => {
        result.current.updateOrder(['2', '1']);
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'hyvve-approval-order-workspace-1',
        expect.stringContaining('"order":["2","1"]')
      );
    });

    it('saves previousOrder for undo', async () => {
      const approvals = [createMockApproval('1'), createMockApproval('2')];
      const { result } = renderHook(() => useApprovalOrder(approvals, 'workspace-1'));

      await waitFor(() => {
        expect(result.current.orderedApprovals.length).toBe(2);
      });

      // First reorder
      act(() => {
        result.current.updateOrder(['2', '1']);
      });

      // previousOrder should be the empty array (initial state)
      expect(result.current.previousOrder).toEqual([]);

      // Second reorder
      act(() => {
        result.current.updateOrder(['1', '2']);
      });

      // previousOrder should be the first custom order
      expect(result.current.previousOrder).toEqual(['2', '1']);
    });
  });

  describe('resetOrder', () => {
    it('resets to original order', async () => {
      const savedState = { order: ['2', '1'], lastUpdated: Date.now() };
      localStorageMock.setItem('hyvve-approval-order-workspace-1', JSON.stringify(savedState));

      const approvals = [createMockApproval('1'), createMockApproval('2')];
      const { result } = renderHook(() => useApprovalOrder(approvals, 'workspace-1'));

      await waitFor(() => {
        expect(result.current.hasCustomOrder).toBe(true);
      });

      act(() => {
        result.current.resetOrder();
      });

      expect(result.current.hasCustomOrder).toBe(false);
      expect(result.current.orderedApprovals.map((a) => a.id)).toEqual(['1', '2']);
    });

    it('removes from localStorage', async () => {
      const savedState = { order: ['2', '1'], lastUpdated: Date.now() };
      localStorageMock.setItem('hyvve-approval-order-workspace-1', JSON.stringify(savedState));

      const approvals = [createMockApproval('1'), createMockApproval('2')];
      const { result } = renderHook(() => useApprovalOrder(approvals, 'workspace-1'));

      await waitFor(() => {
        expect(result.current.hasCustomOrder).toBe(true);
      });

      act(() => {
        result.current.resetOrder();
      });

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('hyvve-approval-order-workspace-1');
    });

    it('saves previous order for undo', async () => {
      const savedState = { order: ['2', '1'], lastUpdated: Date.now() };
      localStorageMock.setItem('hyvve-approval-order-workspace-1', JSON.stringify(savedState));

      const approvals = [createMockApproval('1'), createMockApproval('2')];
      const { result } = renderHook(() => useApprovalOrder(approvals, 'workspace-1'));

      await waitFor(() => {
        expect(result.current.hasCustomOrder).toBe(true);
      });

      act(() => {
        result.current.resetOrder();
      });

      expect(result.current.previousOrder).toEqual(['2', '1']);
    });
  });

  describe('undoReorder', () => {
    it('restores previous order', async () => {
      const approvals = [
        createMockApproval('1'),
        createMockApproval('2'),
        createMockApproval('3'),
      ];
      const { result } = renderHook(() => useApprovalOrder(approvals, 'workspace-1'));

      await waitFor(() => {
        expect(result.current.orderedApprovals.length).toBe(3);
      });

      // Make a change
      act(() => {
        result.current.updateOrder(['3', '2', '1']);
      });

      expect(result.current.orderedApprovals.map((a) => a.id)).toEqual(['3', '2', '1']);

      // Undo
      act(() => {
        result.current.undoReorder();
      });

      // Should restore to original (empty custom order = original order)
      expect(result.current.orderedApprovals.map((a) => a.id)).toEqual(['1', '2', '3']);
    });

    it('does nothing when previousOrder is null', async () => {
      const approvals = [createMockApproval('1'), createMockApproval('2')];
      const { result } = renderHook(() => useApprovalOrder(approvals, 'workspace-1'));

      await waitFor(() => {
        expect(result.current.orderedApprovals.length).toBe(2);
      });

      const orderBefore = result.current.orderedApprovals.map((a) => a.id);

      act(() => {
        result.current.undoReorder();
      });

      expect(result.current.orderedApprovals.map((a) => a.id)).toEqual(orderBefore);
    });

    it('allows redo by calling undo again', async () => {
      const approvals = [createMockApproval('1'), createMockApproval('2')];
      const { result } = renderHook(() => useApprovalOrder(approvals, 'workspace-1'));

      await waitFor(() => {
        expect(result.current.orderedApprovals.length).toBe(2);
      });

      // Make a change
      act(() => {
        result.current.updateOrder(['2', '1']);
      });

      expect(result.current.orderedApprovals.map((a) => a.id)).toEqual(['2', '1']);

      // Undo
      act(() => {
        result.current.undoReorder();
      });

      expect(result.current.orderedApprovals.map((a) => a.id)).toEqual(['1', '2']);

      // Undo again (acts as redo)
      act(() => {
        result.current.undoReorder();
      });

      expect(result.current.orderedApprovals.map((a) => a.id)).toEqual(['2', '1']);
    });
  });

  describe('ordering logic', () => {
    it('only reorders pending items', async () => {
      const approvals = [
        createMockApproval('1', 'pending'),
        createMockApproval('2', 'approved'),
        createMockApproval('3', 'pending'),
        createMockApproval('4', 'rejected'),
      ];

      const savedState = { order: ['3', '1'], lastUpdated: Date.now() };
      localStorageMock.setItem('hyvve-approval-order-workspace-1', JSON.stringify(savedState));

      const { result } = renderHook(() => useApprovalOrder(approvals, 'workspace-1'));

      await waitFor(() => {
        expect(result.current.hasCustomOrder).toBe(true);
      });

      // Pending items should be reordered, non-pending should remain after
      const ids = result.current.orderedApprovals.map((a) => a.id);
      expect(ids).toEqual(['3', '1', '2', '4']);
    });

    it('appends new pending items not in custom order to the end of pending section', async () => {
      const savedState = { order: ['2', '1'], lastUpdated: Date.now() };
      localStorageMock.setItem('hyvve-approval-order-workspace-1', JSON.stringify(savedState));

      const approvals = [
        createMockApproval('1'),
        createMockApproval('2'),
        createMockApproval('3'), // New item not in saved order
      ];

      const { result } = renderHook(() => useApprovalOrder(approvals, 'workspace-1'));

      await waitFor(() => {
        const ids = result.current.orderedApprovals.map((a) => a.id);
        expect(ids).toEqual(['2', '1', '3']); // 3 is appended after custom-ordered items
      });
    });

    it('handles removed items gracefully', async () => {
      // Saved order includes item '3' which no longer exists
      const savedState = { order: ['3', '2', '1'], lastUpdated: Date.now() };
      localStorageMock.setItem('hyvve-approval-order-workspace-1', JSON.stringify(savedState));

      const approvals = [
        createMockApproval('1'),
        createMockApproval('2'),
        // Note: '3' is not in the approvals list
      ];

      const { result } = renderHook(() => useApprovalOrder(approvals, 'workspace-1'));

      await waitFor(() => {
        // Should skip missing item and order remaining ones
        const ids = result.current.orderedApprovals.map((a) => a.id);
        expect(ids).toEqual(['2', '1']);
      });
    });
  });

  describe('workspace isolation', () => {
    it('maintains separate orders for different workspaces', async () => {
      const approvals = [createMockApproval('1'), createMockApproval('2')];

      // Set order for workspace A
      const stateA = { order: ['2', '1'], lastUpdated: Date.now() };
      localStorageMock.setItem('hyvve-approval-order-workspace-a', JSON.stringify(stateA));

      // Set order for workspace B
      const stateB = { order: ['1', '2'], lastUpdated: Date.now() };
      localStorageMock.setItem('hyvve-approval-order-workspace-b', JSON.stringify(stateB));

      // Render for workspace A
      const { result: resultA } = renderHook(() => useApprovalOrder(approvals, 'workspace-a'));

      await waitFor(() => {
        expect(resultA.current.orderedApprovals.map((a) => a.id)).toEqual(['2', '1']);
      });

      // Render for workspace B
      const { result: resultB } = renderHook(() => useApprovalOrder(approvals, 'workspace-b'));

      await waitFor(() => {
        expect(resultB.current.orderedApprovals.map((a) => a.id)).toEqual(['1', '2']);
      });
    });
  });
});
