/**
 * RealtimeProvider Tests
 *
 * Tests for WebSocket connection logic, authentication, and event handling.
 * Note: Socket.io event simulation tests are simplified due to mock complexity.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RealtimeProvider, useRealtime, useRealtimeAvailable } from '../realtime-provider';

// Mock socket.io-client
const mockSocket = {
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
  connected: false,
  removeAllListeners: vi.fn(),
};

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}));

// Mock auth-client
const mockSession = {
  user: {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
  },
};

vi.mock('@/lib/auth-client', () => ({
  useSession: vi.fn(() => ({ data: mockSession })),
  getCurrentSessionToken: vi.fn(() => 'mock-session-token'),
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(() => 'workspace-123'),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Test component that uses the realtime context
function TestConsumer() {
  const context = useRealtime();
  return (
    <div>
      <span data-testid="status">{context.connectionState.status}</span>
      <span data-testid="connected">{context.isConnected ? 'yes' : 'no'}</span>
      <span data-testid="reconnecting">
        {context.isReconnecting ? 'yes' : 'no'}
      </span>
      <span data-testid="has-socket">{context.socket ? 'yes' : 'no'}</span>
      <span data-testid="has-reconnect">
        {typeof context.reconnect === 'function' ? 'yes' : 'no'}
      </span>
      <span data-testid="has-subscribe">
        {typeof context.subscribe === 'function' ? 'yes' : 'no'}
      </span>
      <span data-testid="has-emit">
        {typeof context.emit === 'function' ? 'yes' : 'no'}
      </span>
      {context.connectionError && (
        <span data-testid="error">{context.connectionError}</span>
      )}
    </div>
  );
}

// Test component that checks if realtime is available
function AvailabilityChecker() {
  const isAvailable = useRealtimeAvailable();
  return <span data-testid="available">{isAvailable ? 'yes' : 'no'}</span>;
}

describe('RealtimeProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSocket.connected = false;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('renders children', () => {
      render(
        <RealtimeProvider>
          <div data-testid="child">Child content</div>
        </RealtimeProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('starts connecting when session exists', () => {
      render(
        <RealtimeProvider>
          <TestConsumer />
        </RealtimeProvider>
      );

      // With a session, the provider starts connecting immediately
      expect(screen.getByTestId('status')).toHaveTextContent('connecting');
      expect(screen.getByTestId('connected')).toHaveTextContent('no');
    });

    it('provides all context methods', () => {
      render(
        <RealtimeProvider>
          <TestConsumer />
        </RealtimeProvider>
      );

      expect(screen.getByTestId('has-reconnect')).toHaveTextContent('yes');
      expect(screen.getByTestId('has-subscribe')).toHaveTextContent('yes');
      expect(screen.getByTestId('has-emit')).toHaveTextContent('yes');
    });

    it('accepts custom config', () => {
      render(
        <RealtimeProvider
          config={{
            maxReconnectAttempts: 5,
            reconnectBaseDelay: 500,
          }}
        >
          <TestConsumer />
        </RealtimeProvider>
      );

      // With a session, starts connecting
      expect(screen.getByTestId('status')).toHaveTextContent('connecting');
    });
  });

  describe('no session', () => {
    it('does not connect without session', async () => {
      const authClient = await import('@/lib/auth-client');
      vi.mocked(authClient.useSession).mockReturnValue({
        data: null,
      } as ReturnType<typeof authClient.useSession>);

      render(
        <RealtimeProvider>
          <TestConsumer />
        </RealtimeProvider>
      );

      expect(screen.getByTestId('status')).toHaveTextContent('disconnected');
    });

    it('does not connect without session token', async () => {
      const authClient = await import('@/lib/auth-client');
      vi.mocked(authClient.getCurrentSessionToken).mockReturnValue(undefined);

      render(
        <RealtimeProvider>
          <TestConsumer />
        </RealtimeProvider>
      );

      expect(screen.getByTestId('status')).toHaveTextContent('disconnected');
    });
  });
});

describe('useRealtime', () => {
  it('returns safe defaults when used outside provider (SSR-safe)', () => {
    // This should not throw - the hook returns safe defaults for SSR
    render(<TestConsumer />);

    // Should have disconnected status as the safe default
    expect(screen.getByTestId('status')).toHaveTextContent('disconnected');
    expect(screen.getByTestId('connected')).toHaveTextContent('no');
    expect(screen.getByTestId('has-socket')).toHaveTextContent('no');
  });

  it('provides noop functions when outside provider', () => {
    render(<TestConsumer />);

    // Functions should exist but be noops
    expect(screen.getByTestId('has-reconnect')).toHaveTextContent('yes');
    expect(screen.getByTestId('has-subscribe')).toHaveTextContent('yes');
    expect(screen.getByTestId('has-emit')).toHaveTextContent('yes');
  });
});

describe('useRealtimeAvailable', () => {
  it('returns false when used outside provider', () => {
    render(<AvailabilityChecker />);
    expect(screen.getByTestId('available')).toHaveTextContent('no');
  });

  it('returns true when used inside provider', () => {
    render(
      <RealtimeProvider>
        <AvailabilityChecker />
      </RealtimeProvider>
    );
    expect(screen.getByTestId('available')).toHaveTextContent('yes');
  });
});

describe('RealtimeConnectionState', () => {
  it('has correct initial values', () => {
    render(
      <RealtimeProvider>
        <TestConsumer />
      </RealtimeProvider>
    );

    expect(screen.getByTestId('status')).toHaveTextContent('disconnected');
    expect(screen.getByTestId('connected')).toHaveTextContent('no');
    expect(screen.getByTestId('reconnecting')).toHaveTextContent('no');
  });

  it('does not show error initially', () => {
    render(
      <RealtimeProvider>
        <TestConsumer />
      </RealtimeProvider>
    );

    expect(screen.queryByTestId('error')).not.toBeInTheDocument();
  });
});
