import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { CopilotKitProvider } from '../CopilotKitProvider';

// Mock CopilotKit to avoid actual network calls and provider initialization
vi.mock('@copilotkit/react-core', () => ({
  CopilotKit: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="copilotkit-provider">{children}</div>
  ),
}));

describe('CopilotKitProvider', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('renders children correctly', () => {
    render(
      <CopilotKitProvider>
        <div data-testid="child">Test Child</div>
      </CopilotKitProvider>
    );

    expect(screen.getByTestId('copilotkit-provider')).toBeInTheDocument();
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Test Child')).toBeInTheDocument();
  });

  it('renders multiple children', () => {
    render(
      <CopilotKitProvider>
        <div data-testid="child-1">First Child</div>
        <div data-testid="child-2">Second Child</div>
      </CopilotKitProvider>
    );

    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
  });

  it('wraps children with CopilotKit provider', () => {
    render(
      <CopilotKitProvider>
        <div data-testid="nested-content">Nested Content</div>
      </CopilotKitProvider>
    );

    const provider = screen.getByTestId('copilotkit-provider');
    const content = screen.getByTestId('nested-content');

    // Verify nesting
    expect(provider).toContainElement(content);
  });

  it('handles empty children gracefully', () => {
    const { container } = render(<CopilotKitProvider>{null}</CopilotKitProvider>);

    expect(screen.getByTestId('copilotkit-provider')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="copilotkit-provider"]')).toBeInTheDocument();
  });

  it('renders fragment children', () => {
    render(
      <CopilotKitProvider>
        <>
          <div data-testid="fragment-child-1">Fragment 1</div>
          <div data-testid="fragment-child-2">Fragment 2</div>
        </>
      </CopilotKitProvider>
    );

    expect(screen.getByTestId('fragment-child-1')).toBeInTheDocument();
    expect(screen.getByTestId('fragment-child-2')).toBeInTheDocument();
  });
});
