import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CCRStatus } from '../ccr-status';
import type { CCRStatus as CCRStatusType } from '@/hooks/useCCRStatus';

// Mock the hooks
vi.mock('@/hooks/useCCRStatus', async () => {
  const actual = await vi.importActual('@/hooks/useCCRStatus');
  return {
    ...actual,
    useCCRStatus: vi.fn(),
    useReconnectCCR: vi.fn(),
  };
});

import { useCCRStatus, useReconnectCCR } from '@/hooks/useCCRStatus';

const mockStatus: CCRStatusType = {
  connected: true,
  mode: 'auto',
  providers: [
    {
      id: 'claude-primary',
      name: 'Claude (Primary)',
      provider: 'anthropic',
      status: 'healthy',
      latency: 150,
      lastSuccess: new Date().toISOString(),
      errorCount: 0,
    },
    {
      id: 'openai-fallback',
      name: 'OpenAI (Fallback)',
      provider: 'openai',
      status: 'degraded',
      latency: 250,
      lastSuccess: new Date().toISOString(),
      errorCount: 1,
    },
    {
      id: 'deepseek-budget',
      name: 'DeepSeek (Budget)',
      provider: 'deepseek',
      status: 'unknown',
      latency: undefined,
      lastSuccess: undefined,
      errorCount: 0,
    },
  ],
  lastChecked: new Date().toISOString(),
  uptime: 99.9,
  totalRequests: 1234,
  failedRequests: 2,
};

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
}

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe('CCRStatus', () => {
  const mockRefetch = vi.fn();
  const mockMutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useCCRStatus).mockReturnValue({
      data: mockStatus,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
      isFetching: false,
    } as unknown as ReturnType<typeof useCCRStatus>);

    vi.mocked(useReconnectCCR).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useReconnectCCR>);
  });

  it('renders the component with title', () => {
    renderWithProviders(<CCRStatus />);

    expect(screen.getByText('Connection Status')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    vi.mocked(useCCRStatus).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: mockRefetch,
      isFetching: false,
    } as unknown as ReturnType<typeof useCCRStatus>);

    renderWithProviders(<CCRStatus />);

    expect(screen.getByText('Connection Status')).toBeInTheDocument();
    const spinners = document.querySelectorAll('.animate-spin');
    expect(spinners.length).toBeGreaterThan(0);
  });

  it('renders error state with retry button', () => {
    vi.mocked(useCCRStatus).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load'),
      refetch: mockRefetch,
      isFetching: false,
    } as unknown as ReturnType<typeof useCCRStatus>);

    renderWithProviders(<CCRStatus />);

    expect(screen.getByText('Failed to load connection status')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('shows connected badge when connected', () => {
    renderWithProviders(<CCRStatus />);

    const badge = screen.getByTestId('connection-badge');
    expect(badge).toHaveTextContent('Connected');
  });

  it('shows disconnected badge when not connected', () => {
    vi.mocked(useCCRStatus).mockReturnValue({
      data: { ...mockStatus, connected: false },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
      isFetching: false,
    } as unknown as ReturnType<typeof useCCRStatus>);

    renderWithProviders(<CCRStatus />);

    const badge = screen.getByTestId('connection-badge');
    expect(badge).toHaveTextContent('Disconnected');
  });

  it('renders all providers in the list', () => {
    renderWithProviders(<CCRStatus />);

    expect(screen.getByTestId('provider-list')).toBeInTheDocument();
    expect(screen.getByTestId('provider-status-claude-primary')).toBeInTheDocument();
    expect(screen.getByTestId('provider-status-openai-fallback')).toBeInTheDocument();
    expect(screen.getByTestId('provider-status-deepseek-budget')).toBeInTheDocument();
  });

  it('shows correct status indicators for providers', () => {
    renderWithProviders(<CCRStatus />);

    expect(screen.getByTestId('provider-indicator-healthy')).toBeInTheDocument();
    expect(screen.getByTestId('provider-indicator-degraded')).toBeInTheDocument();
    expect(screen.getByTestId('provider-indicator-unknown')).toBeInTheDocument();
  });

  it('shows provider latency when available', () => {
    renderWithProviders(<CCRStatus />);

    expect(screen.getByText('150ms')).toBeInTheDocument();
    expect(screen.getByText('250ms')).toBeInTheDocument();
  });

  it('shows status labels for each provider', () => {
    renderWithProviders(<CCRStatus />);

    expect(screen.getByText('Healthy')).toBeInTheDocument();
    expect(screen.getByText('Degraded')).toBeInTheDocument();
    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });

  it('shows stats section with uptime and requests', () => {
    renderWithProviders(<CCRStatus />);

    expect(screen.getByTestId('status-stats')).toBeInTheDocument();
    expect(screen.getByText('99.9%')).toBeInTheDocument();
    expect(screen.getByText('1,234')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('shows refresh button', () => {
    renderWithProviders(<CCRStatus />);

    expect(screen.getByTestId('refresh-status')).toBeInTheDocument();
  });

  it('calls refetch when refresh is clicked', async () => {
    renderWithProviders(<CCRStatus />);

    const refreshButton = screen.getByTestId('refresh-status');
    fireEvent.click(refreshButton);

    expect(mockRefetch).toHaveBeenCalled();
  });

  it('shows reconnect button when disconnected', () => {
    vi.mocked(useCCRStatus).mockReturnValue({
      data: { ...mockStatus, connected: false },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
      isFetching: false,
    } as unknown as ReturnType<typeof useCCRStatus>);

    renderWithProviders(<CCRStatus />);

    expect(screen.getByTestId('reconnect-button')).toBeInTheDocument();
  });

  it('does not show reconnect button when connected', () => {
    renderWithProviders(<CCRStatus />);

    expect(screen.queryByTestId('reconnect-button')).not.toBeInTheDocument();
  });

  it('calls reconnect when reconnect button is clicked', async () => {
    vi.mocked(useCCRStatus).mockReturnValue({
      data: { ...mockStatus, connected: false },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
      isFetching: false,
    } as unknown as ReturnType<typeof useCCRStatus>);

    renderWithProviders(<CCRStatus />);

    const reconnectButton = screen.getByTestId('reconnect-button');
    fireEvent.click(reconnectButton);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalled();
    });
  });

  it('shows routing mode', () => {
    renderWithProviders(<CCRStatus />);

    expect(screen.getByText(/Mode:/)).toBeInTheDocument();
    expect(screen.getByText('auto')).toBeInTheDocument();
  });

  it('shows last checked timestamp', () => {
    renderWithProviders(<CCRStatus />);

    expect(screen.getByText(/Last checked:/)).toBeInTheDocument();
  });

  it('has correct test id on main component', () => {
    renderWithProviders(<CCRStatus />);

    expect(screen.getByTestId('ccr-status')).toBeInTheDocument();
  });

  it('renders empty state when no status data', () => {
    vi.mocked(useCCRStatus).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
      isFetching: false,
    } as unknown as ReturnType<typeof useCCRStatus>);

    renderWithProviders(<CCRStatus />);

    expect(
      screen.getByText('CCR is not configured. Configure routing first.')
    ).toBeInTheDocument();
  });

  it('disables refresh button while fetching', () => {
    vi.mocked(useCCRStatus).mockReturnValue({
      data: mockStatus,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
      isFetching: true,
    } as unknown as ReturnType<typeof useCCRStatus>);

    renderWithProviders(<CCRStatus />);

    const refreshButton = screen.getByTestId('refresh-status');
    expect(refreshButton).toBeDisabled();
  });

  it('disables reconnect button while reconnecting', () => {
    vi.mocked(useCCRStatus).mockReturnValue({
      data: { ...mockStatus, connected: false },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
      isFetching: false,
    } as unknown as ReturnType<typeof useCCRStatus>);

    vi.mocked(useReconnectCCR).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: true,
    } as unknown as ReturnType<typeof useReconnectCCR>);

    renderWithProviders(<CCRStatus />);

    const reconnectButton = screen.getByTestId('reconnect-button');
    expect(reconnectButton).toBeDisabled();
  });
});
