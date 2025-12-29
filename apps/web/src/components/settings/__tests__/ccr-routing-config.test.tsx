import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CCRRoutingConfig } from '../ccr-routing-config';
import type { CCRRoutingConfig as CCRRoutingConfigType } from '@/hooks/useCCRRouting';

// Mock the hooks
vi.mock('@/hooks/useCCRRouting', async () => {
  const actual = await vi.importActual('@/hooks/useCCRRouting');
  return {
    ...actual,
    useCCRRoutingConfig: vi.fn(),
    useAvailableRoutingProviders: vi.fn(),
    useUpdateRoutingConfig: vi.fn(),
    useUpdateAgentOverride: vi.fn(),
  };
});

import {
  useCCRRoutingConfig,
  useAvailableRoutingProviders,
  useUpdateRoutingConfig,
  useUpdateAgentOverride,
} from '@/hooks/useCCRRouting';

const mockConfig: CCRRoutingConfigType = {
  mode: 'auto',
  autoFailover: true,
  fallbackChain: [
    {
      id: 'claude-primary',
      name: 'Claude (Primary)',
      provider: 'anthropic',
      model: 'claude-3-5-sonnet-20241022',
      priority: 1,
      enabled: true,
      status: 'healthy',
    },
    {
      id: 'openai-fallback',
      name: 'OpenAI (Fallback)',
      provider: 'openai',
      model: 'gpt-4o',
      priority: 2,
      enabled: true,
      status: 'healthy',
    },
    {
      id: 'deepseek-budget',
      name: 'DeepSeek (Budget)',
      provider: 'deepseek',
      model: 'deepseek-chat',
      priority: 3,
      enabled: false,
      status: 'unknown',
    },
  ],
  agentOverrides: [
    {
      agentId: 'navi',
      agentName: 'Navi (Navigator)',
      preferredProviderId: null,
      fallbackEnabled: true,
    },
    {
      agentId: 'sage',
      agentName: 'Sage (Strategist)',
      preferredProviderId: null,
      fallbackEnabled: true,
    },
  ],
  updatedAt: new Date().toISOString(),
};

const mockProviders = mockConfig.fallbackChain;

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

describe('CCRRoutingConfig', () => {
  const mockMutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useCCRRoutingConfig).mockReturnValue({
      data: mockConfig,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useCCRRoutingConfig>);

    vi.mocked(useAvailableRoutingProviders).mockReturnValue({
      data: mockProviders,
      isLoading: false,
    } as ReturnType<typeof useAvailableRoutingProviders>);

    vi.mocked(useUpdateRoutingConfig).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateRoutingConfig>);

    vi.mocked(useUpdateAgentOverride).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateAgentOverride>);
  });

  it('renders the component with title', () => {
    renderWithProviders(<CCRRoutingConfig />);

    expect(screen.getByText('Routing Configuration')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    vi.mocked(useCCRRoutingConfig).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as ReturnType<typeof useCCRRoutingConfig>);

    renderWithProviders(<CCRRoutingConfig />);

    // Loading spinner is present (Loader2 with animate-spin class)
    expect(screen.getByText('Routing Configuration')).toBeInTheDocument();
    const spinners = document.querySelectorAll('.animate-spin');
    expect(spinners.length).toBeGreaterThan(0);
  });

  it('renders error state', () => {
    vi.mocked(useCCRRoutingConfig).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load'),
    } as ReturnType<typeof useCCRRoutingConfig>);

    renderWithProviders(<CCRRoutingConfig />);

    expect(screen.getByText('Failed to load routing configuration')).toBeInTheDocument();
  });

  it('renders all routing mode options', () => {
    renderWithProviders(<CCRRoutingConfig />);

    expect(screen.getByTestId('routing-mode-auto')).toBeInTheDocument();
    expect(screen.getByTestId('routing-mode-cost-optimized')).toBeInTheDocument();
    expect(screen.getByTestId('routing-mode-performance')).toBeInTheDocument();
    expect(screen.getByTestId('routing-mode-manual')).toBeInTheDocument();
  });

  it('shows current routing mode as selected', () => {
    renderWithProviders(<CCRRoutingConfig />);

    const autoButton = screen.getByTestId('routing-mode-auto');
    expect(autoButton).toHaveClass('border-primary');
  });

  it('calls update when routing mode is changed', async () => {
    renderWithProviders(<CCRRoutingConfig />);

    const performanceButton = screen.getByTestId('routing-mode-performance');
    fireEvent.click(performanceButton);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({ mode: 'performance' });
    });
  });

  it('renders auto failover toggle', () => {
    renderWithProviders(<CCRRoutingConfig />);

    expect(screen.getByTestId('auto-failover-toggle')).toBeInTheDocument();
    expect(screen.getByText('Automatic Failover')).toBeInTheDocument();
  });

  it('calls update when auto failover is toggled', async () => {
    renderWithProviders(<CCRRoutingConfig />);

    const toggle = screen.getByTestId('auto-failover-toggle');
    fireEvent.click(toggle);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({ autoFailover: false });
    });
  });

  it('renders fallback chain', () => {
    renderWithProviders(<CCRRoutingConfig />);

    expect(screen.getByTestId('fallback-chain')).toBeInTheDocument();
    expect(screen.getByTestId('fallback-chain-item-claude-primary')).toBeInTheDocument();
    expect(screen.getByTestId('fallback-chain-item-openai-fallback')).toBeInTheDocument();
    expect(screen.getByTestId('fallback-chain-item-deepseek-budget')).toBeInTheDocument();
  });

  it('shows provider status indicators', () => {
    renderWithProviders(<CCRRoutingConfig />);

    expect(screen.getAllByTestId('provider-status-healthy').length).toBeGreaterThan(0);
    expect(screen.getByTestId('provider-status-unknown')).toBeInTheDocument();
  });

  it('shows enabled/disabled count in fallback chain', () => {
    renderWithProviders(<CCRRoutingConfig />);

    expect(screen.getByText('2 of 3 enabled')).toBeInTheDocument();
  });

  it('shows save button when fallback chain is modified', () => {
    renderWithProviders(<CCRRoutingConfig />);

    // Initially no save button
    expect(screen.queryByTestId('save-fallback-chain')).not.toBeInTheDocument();

    // Toggle a provider
    const switches = screen.getAllByRole('switch');
    // Find the switch for deepseek (the disabled one)
    const deepseekSwitch = switches.find((s) =>
      s.getAttribute('aria-label')?.includes('DeepSeek')
    );
    if (deepseekSwitch) {
      fireEvent.click(deepseekSwitch);
    }

    // Save button should appear
    expect(screen.getByTestId('save-fallback-chain')).toBeInTheDocument();
  });

  it('renders agent overrides section', () => {
    renderWithProviders(<CCRRoutingConfig />);

    expect(screen.getByTestId('agent-overrides')).toBeInTheDocument();
    expect(screen.getByTestId('agent-override-navi')).toBeInTheDocument();
    expect(screen.getByTestId('agent-override-sage')).toBeInTheDocument();
  });

  it('renders info box with routing explanation', () => {
    renderWithProviders(<CCRRoutingConfig />);

    expect(screen.getByText('How routing works')).toBeInTheDocument();
    expect(screen.getByText(/CCR \(Claude Code Router\)/)).toBeInTheDocument();
  });

  it('has correct test id on main component', () => {
    renderWithProviders(<CCRRoutingConfig />);

    expect(screen.getByTestId('ccr-routing-config')).toBeInTheDocument();
  });

  it('renders empty state when no config', () => {
    vi.mocked(useCCRRoutingConfig).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useCCRRoutingConfig>);

    renderWithProviders(<CCRRoutingConfig />);

    expect(
      screen.getByText('No routing configuration found. Add AI providers first.')
    ).toBeInTheDocument();
  });

  it('disables controls while saving', () => {
    vi.mocked(useUpdateRoutingConfig).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: true,
    } as unknown as ReturnType<typeof useUpdateRoutingConfig>);

    renderWithProviders(<CCRRoutingConfig />);

    const modeButtons = screen.getAllByTestId(/routing-mode-/);
    modeButtons.forEach((button) => {
      expect(button).toHaveClass('cursor-not-allowed');
    });
  });

  it('can move providers up and down in fallback chain', () => {
    renderWithProviders(<CCRRoutingConfig />);

    // The first item should not have an enabled "move up" button
    const claudeItem = screen.getByTestId('fallback-chain-item-claude-primary');
    const moveUpButtons = claudeItem.querySelectorAll('button[aria-label="Move up"]');
    expect(moveUpButtons[0]).toBeDisabled();

    // The last item should not have an enabled "move down" button
    const deepseekItem = screen.getByTestId('fallback-chain-item-deepseek-budget');
    const moveDownButtons = deepseekItem.querySelectorAll('button[aria-label="Move down"]');
    expect(moveDownButtons[0]).toBeDisabled();
  });

  it('shows provider name and model in fallback chain', () => {
    renderWithProviders(<CCRRoutingConfig />);

    // Provider names appear in fallback chain and possibly in agent override dropdowns
    // so we just check that at least one exists
    expect(screen.getAllByText('Claude (Primary)').length).toBeGreaterThan(0);
    expect(screen.getByText('anthropic / claude-3-5-sonnet-20241022')).toBeInTheDocument();
  });
});
