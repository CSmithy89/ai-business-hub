import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CCRQuotaDisplay } from '../ccr-quota-display';
import type { CCRQuotaSummary } from '@/hooks/useCCRQuota';

// Mock the hooks
vi.mock('@/hooks/useCCRQuota', async () => {
  const actual = await vi.importActual('@/hooks/useCCRQuota');
  return {
    ...actual,
    useCCRQuota: vi.fn(),
  };
});

import { useCCRQuota } from '@/hooks/useCCRQuota';

const mockQuotaSummary: CCRQuotaSummary = {
  quotas: [
    {
      providerId: 'anthropic-sub',
      providerName: 'Claude (Anthropic)',
      provider: 'anthropic',
      used: 850000,
      limit: 1000000,
      resetDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
      billingCycle: 'monthly',
    },
    {
      providerId: 'openai-sub',
      providerName: 'OpenAI',
      provider: 'openai',
      used: 150000,
      limit: 500000,
      resetDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      billingCycle: 'monthly',
    },
    {
      providerId: 'deepseek-sub',
      providerName: 'DeepSeek',
      provider: 'deepseek',
      used: 98000,
      limit: 100000,
      resetDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      billingCycle: 'monthly',
    },
  ],
  lastUpdated: new Date().toISOString(),
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

describe('CCRQuotaDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useCCRQuota).mockReturnValue({
      data: mockQuotaSummary,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useCCRQuota>);
  });

  it('renders the component with title', () => {
    renderWithProviders(<CCRQuotaDisplay />);

    expect(screen.getByText('Subscription Quotas')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    vi.mocked(useCCRQuota).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as unknown as ReturnType<typeof useCCRQuota>);

    renderWithProviders(<CCRQuotaDisplay />);

    expect(screen.getByText('Subscription Quotas')).toBeInTheDocument();
    const spinners = document.querySelectorAll('.animate-spin');
    expect(spinners.length).toBeGreaterThan(0);
  });

  it('renders error state', () => {
    vi.mocked(useCCRQuota).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load'),
    } as unknown as ReturnType<typeof useCCRQuota>);

    renderWithProviders(<CCRQuotaDisplay />);

    expect(screen.getByText('Failed to load quota information')).toBeInTheDocument();
  });

  it('renders all provider quotas', () => {
    renderWithProviders(<CCRQuotaDisplay />);

    expect(screen.getByTestId('quota-list')).toBeInTheDocument();
    expect(screen.getByTestId('quota-item-anthropic-sub')).toBeInTheDocument();
    expect(screen.getByTestId('quota-item-openai-sub')).toBeInTheDocument();
    expect(screen.getByTestId('quota-item-deepseek-sub')).toBeInTheDocument();
  });

  it('shows provider names', () => {
    renderWithProviders(<CCRQuotaDisplay />);

    expect(screen.getByText('Claude (Anthropic)')).toBeInTheDocument();
    expect(screen.getByText('OpenAI')).toBeInTheDocument();
    expect(screen.getByText('DeepSeek')).toBeInTheDocument();
  });

  it('shows warning badge for warning status', () => {
    renderWithProviders(<CCRQuotaDisplay />);

    // Anthropic is at 85% (warning threshold)
    expect(screen.getByTestId('status-badge-warning')).toBeInTheDocument();
  });

  it('shows critical badge for critical status', () => {
    renderWithProviders(<CCRQuotaDisplay />);

    // DeepSeek is at 98% (critical threshold)
    expect(screen.getByTestId('status-badge-critical')).toBeInTheDocument();
  });

  it('shows remaining quota', () => {
    renderWithProviders(<CCRQuotaDisplay />);

    expect(screen.getByText('150.0K remaining')).toBeInTheDocument(); // Anthropic: 1M - 850K
    expect(screen.getByText('350.0K remaining')).toBeInTheDocument(); // OpenAI: 500K - 150K
  });

  it('shows quota limits', () => {
    renderWithProviders(<CCRQuotaDisplay />);

    expect(screen.getByText('of 1.0M tokens')).toBeInTheDocument();
    expect(screen.getByText('of 500.0K tokens')).toBeInTheDocument();
  });

  it('shows progress bars', () => {
    renderWithProviders(<CCRQuotaDisplay />);

    expect(screen.getByTestId('quota-progress-anthropic-sub')).toBeInTheDocument();
    expect(screen.getByTestId('quota-progress-openai-sub')).toBeInTheDocument();
    expect(screen.getByTestId('quota-progress-deepseek-sub')).toBeInTheDocument();
  });

  it('shows quota summary', () => {
    renderWithProviders(<CCRQuotaDisplay />);

    expect(screen.getByTestId('quota-summary')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument(); // Providers count
    expect(screen.getByText('Providers')).toBeInTheDocument();
    expect(screen.getByText('Total Used')).toBeInTheDocument();
  });

  it('shows warning and critical counts in summary', () => {
    renderWithProviders(<CCRQuotaDisplay />);

    // Find within the summary section
    const summary = screen.getByTestId('quota-summary');
    expect(summary).toHaveTextContent('Warnings');
    expect(summary).toHaveTextContent('Critical');
  });

  it('has correct test id on main component', () => {
    renderWithProviders(<CCRQuotaDisplay />);

    expect(screen.getByTestId('ccr-quota-display')).toBeInTheDocument();
  });

  it('renders empty state when no quotas', () => {
    vi.mocked(useCCRQuota).mockReturnValue({
      data: { quotas: [], lastUpdated: new Date().toISOString() },
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useCCRQuota>);

    renderWithProviders(<CCRQuotaDisplay />);

    expect(
      screen.getByText('No subscription quotas configured. Add AI providers to see quota usage.')
    ).toBeInTheDocument();
  });

  it('shows reset date', () => {
    renderWithProviders(<CCRQuotaDisplay />);

    // Should show "In X days" or similar
    expect(screen.getAllByText(/Resets/i).length).toBeGreaterThan(0);
  });

  it('shows last updated timestamp', () => {
    renderWithProviders(<CCRQuotaDisplay />);

    expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
  });

  it('shows billing cycle', () => {
    renderWithProviders(<CCRQuotaDisplay />);

    expect(screen.getAllByText('Monthly quota').length).toBe(3);
  });
});
