/**
 * State Sync Client Tests
 *
 * Tests for the WebSocket state synchronization client.
 *
 * Story: DM-11.2 - WebSocket State Synchronization
 */

import { describe, it, expect, beforeAll, beforeEach, afterEach, vi, type Mock } from 'vitest';
import {
  StateSyncClient,
  getTabId,
  getStateSyncClient,
  resetStateSyncClient,
} from './state-sync-client';
import type { DashboardStateSyncPayload, DashboardStateFullPayload } from './types';

// Mock sessionStorage
const mockSessionStorage: Record<string, string> = {};

beforeAll(() => {
  Object.defineProperty(window, 'sessionStorage', {
    value: {
      getItem: vi.fn((key: string) => mockSessionStorage[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        mockSessionStorage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete mockSessionStorage[key];
      }),
      clear: vi.fn(() => {
        Object.keys(mockSessionStorage).forEach((key) => delete mockSessionStorage[key]);
      }),
    },
    writable: true,
  });
});

beforeEach(() => {
  Object.keys(mockSessionStorage).forEach((key) => delete mockSessionStorage[key]);
  resetStateSyncClient();
  vi.clearAllMocks();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('getTabId', () => {
  it('should generate a new tab ID if none exists', () => {
    const tabId = getTabId();
    expect(tabId).toBeDefined();
    expect(typeof tabId).toBe('string');
    expect(tabId.length).toBeGreaterThan(0);
  });

  it('should return the same tab ID on subsequent calls', () => {
    const tabId1 = getTabId();
    const tabId2 = getTabId();
    expect(tabId1).toBe(tabId2);
  });

  it('should store tab ID in sessionStorage', () => {
    const tabId = getTabId();
    expect(sessionStorage.setItem).toHaveBeenCalled();
    expect(mockSessionStorage['hyvve:dashboard:tabId']).toBe(tabId);
  });
});

describe('StateSyncClient', () => {
  let client: StateSyncClient;
  let mockSocket: {
    on: Mock;
    off: Mock;
    connected: boolean;
    emit: Mock;
  };

  beforeEach(() => {
    client = new StateSyncClient();
    mockSocket = {
      on: vi.fn(),
      off: vi.fn(),
      connected: true,
      emit: vi.fn(),
    };
  });

  describe('connect', () => {
    it('should subscribe to events on connect', () => {
      client.connect(mockSocket as never);

      expect(mockSocket.on).toHaveBeenCalledWith('dashboard.state.sync', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('dashboard.state.full', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    });

    it('should not reconnect to the same socket', () => {
      client.connect(mockSocket as never);
      const callCount = mockSocket.on.mock.calls.length;
      client.connect(mockSocket as never);
      expect(mockSocket.on.mock.calls.length).toBe(callCount);
    });
  });

  describe('disconnect', () => {
    it('should unsubscribe from events on disconnect', () => {
      client.connect(mockSocket as never);
      client.disconnect();

      expect(mockSocket.off).toHaveBeenCalledWith('dashboard.state.sync', expect.any(Function));
      expect(mockSocket.off).toHaveBeenCalledWith('dashboard.state.full', expect.any(Function));
      expect(mockSocket.off).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockSocket.off).toHaveBeenCalledWith('disconnect', expect.any(Function));
    });
  });

  describe('event handling', () => {
    it('should notify sync callbacks on sync event', () => {
      const callback = vi.fn();
      client.onSync(callback);
      client.connect(mockSocket as never);

      // Simulate receiving a sync event
      const syncHandler = mockSocket.on.mock.calls.find(
        ([event]: [string]) => event === 'dashboard.state.sync'
      )?.[1];

      const syncPayload: DashboardStateSyncPayload = {
        path: 'widgets.test',
        value: { status: 'active' },
        version: 1,
        sourceTabId: 'other-tab',
      };

      syncHandler?.(syncPayload);

      expect(callback).toHaveBeenCalledWith(syncPayload);
    });

    it('should filter out self-echoed sync events', () => {
      const callback = vi.fn();
      client.onSync(callback);
      client.connect(mockSocket as never);

      const syncHandler = mockSocket.on.mock.calls.find(
        ([event]: [string]) => event === 'dashboard.state.sync'
      )?.[1];

      const syncPayload: DashboardStateSyncPayload = {
        path: 'widgets.test',
        value: { status: 'active' },
        version: 1,
        sourceTabId: client.getTabId(), // Same tab ID
      };

      syncHandler?.(syncPayload);

      expect(callback).not.toHaveBeenCalled();
    });

    it('should notify full callbacks on full state event', () => {
      const callback = vi.fn();
      client.onFull(callback);
      client.connect(mockSocket as never);

      const fullHandler = mockSocket.on.mock.calls.find(
        ([event]: [string]) => event === 'dashboard.state.full'
      )?.[1];

      const fullPayload: DashboardStateFullPayload = {
        state: { widgets: { test: 'value' } },
        version: 5,
      };

      fullHandler?.(fullPayload);

      expect(callback).toHaveBeenCalledWith(fullPayload);
    });
  });

  describe('emitChange', () => {
    it('should debounce multiple changes', () => {
      client.connect(mockSocket as never);

      client.emitChange({ path: 'widgets.a', value: 1 }, 1);
      client.emitChange({ path: 'widgets.b', value: 2 }, 2);
      client.emitChange({ path: 'widgets.c', value: 3 }, 3);

      // Not emitted yet due to debounce
      expect(mockSocket.emit).not.toHaveBeenCalled();

      // Advance timers past debounce
      vi.advanceTimersByTime(150);

      // Now should be emitted
      expect(mockSocket.emit).toHaveBeenCalled();
    });

    it('should emit with correct payload structure', () => {
      client.connect(mockSocket as never);
      client.emitChange({ path: 'widgets.test', value: 'value' }, 5);

      vi.advanceTimersByTime(150);

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'dashboard.state.update',
        expect.objectContaining({
          path: 'widgets.test',
          value: 'value',
          version: 5,
          sourceTabId: expect.any(String),
          timestamp: expect.any(String),
        })
      );
    });
  });

  describe('requestFullState', () => {
    it('should emit state request with last known version', () => {
      client.connect(mockSocket as never);
      client.setLastKnownVersion(10);
      client.requestFullState();

      expect(mockSocket.emit).toHaveBeenCalledWith('dashboard.state.request', {
        lastKnownVersion: 10,
      });
    });

    it('should not emit if not connected', () => {
      mockSocket.connected = false;
      client.connect(mockSocket as never);
      client.requestFullState();

      expect(mockSocket.emit).not.toHaveBeenCalled();
    });
  });

  describe('connection status', () => {
    it('should report connected status correctly', () => {
      mockSocket.connected = true;
      client.connect(mockSocket as never);

      // Simulate connect event
      const connectHandler = mockSocket.on.mock.calls.find(
        ([event]: [string]) => event === 'connect'
      )?.[1];
      connectHandler?.();

      expect(client.isSocketConnected()).toBe(true);
      expect(client.getConnectionStatus()).toBe('connected');
    });

    it('should report disconnected status when not connected', () => {
      expect(client.isSocketConnected()).toBe(false);
      expect(client.getConnectionStatus()).toBe('disconnected');
    });
  });

  describe('subscription management', () => {
    it('should allow unsubscribing from sync events', () => {
      const callback = vi.fn();
      const unsubscribe = client.onSync(callback);
      client.connect(mockSocket as never);

      unsubscribe();

      const syncHandler = mockSocket.on.mock.calls.find(
        ([event]: [string]) => event === 'dashboard.state.sync'
      )?.[1];

      syncHandler?.({
        path: 'test',
        value: 'value',
        version: 1,
        sourceTabId: 'other',
      });

      expect(callback).not.toHaveBeenCalled();
    });

    it('should allow unsubscribing from full events', () => {
      const callback = vi.fn();
      const unsubscribe = client.onFull(callback);
      client.connect(mockSocket as never);

      unsubscribe();

      const fullHandler = mockSocket.on.mock.calls.find(
        ([event]: [string]) => event === 'dashboard.state.full'
      )?.[1];

      fullHandler?.({ state: {}, version: 1 });

      expect(callback).not.toHaveBeenCalled();
    });
  });
});

describe('getStateSyncClient', () => {
  it('should return the same singleton instance', () => {
    const client1 = getStateSyncClient();
    const client2 = getStateSyncClient();
    expect(client1).toBe(client2);
  });

  it('should create a new instance after reset', () => {
    const client1 = getStateSyncClient();
    resetStateSyncClient();
    const client2 = getStateSyncClient();
    expect(client1).not.toBe(client2);
  });
});
