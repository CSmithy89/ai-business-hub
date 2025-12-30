/**
 * DashboardAgentSection Component Tests - Story DM-03.5
 *
 * Tests for the agent-powered section containing widget grid and chat sidebar.
 *
 * @see docs/modules/bm-dm/stories/dm-03-5-end-to-end-testing.md
 * @see docs/modules/bm-dm/epics/epic-dm-03-tech-spec.md - Section 3.4
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardAgentSection } from '../DashboardAgentSection';

// Mock child components to isolate testing
vi.mock('@/components/dashboard', () => ({
  DashboardGrid: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-dashboard-grid">{children}</div>
  ),
  DashboardChat: () => <div data-testid="mock-dashboard-chat">Chat</div>,
}));

describe('DashboardAgentSection', () => {
  describe('Section Structure', () => {
    it('renders without crashing', () => {
      render(<DashboardAgentSection />);

      expect(screen.getByTestId('dashboard-agent-section')).toBeInTheDocument();
    });

    it('has section element with aria-label', () => {
      render(<DashboardAgentSection />);

      const section = screen.getByTestId('dashboard-agent-section');
      expect(section.tagName.toLowerCase()).toBe('section');
      expect(section).toHaveAttribute('aria-label', 'AI-powered insights');
    });
  });

  describe('Header', () => {
    it('renders AI Insights heading', () => {
      render(<DashboardAgentSection />);

      expect(screen.getByRole('heading', { name: /AI Insights/i })).toBeInTheDocument();
    });

    it('renders description text', () => {
      render(<DashboardAgentSection />);

      expect(
        screen.getByText(/Real-time updates from your AI team/i)
      ).toBeInTheDocument();
    });

    it('renders bot icon in header', () => {
      render(<DashboardAgentSection />);

      // Bot icon container should exist
      const iconContainer = screen
        .getByRole('heading', { name: /AI Insights/i })
        .closest('.space-y-4')
        ?.querySelector('.rounded-lg');
      expect(iconContainer).toBeInTheDocument();
    });
  });

  describe('Grid Layout', () => {
    it('renders DashboardGrid component', () => {
      render(<DashboardAgentSection />);

      expect(screen.getByTestId('mock-dashboard-grid')).toBeInTheDocument();
    });

    it('renders DashboardChat component', () => {
      render(<DashboardAgentSection />);

      expect(screen.getByTestId('mock-dashboard-chat')).toBeInTheDocument();
    });
  });

  describe('Widget Placeholder', () => {
    it('shows "No widgets yet" placeholder initially', () => {
      // We need to unmock to test the actual placeholder
      vi.unmock('@/components/dashboard');

      // Re-mock with actual behavior for grid
      vi.mock('@/components/dashboard', () => ({
        DashboardGrid: ({ children }: { children: React.ReactNode }) => (
          <div data-testid="mock-dashboard-grid">{children}</div>
        ),
        DashboardChat: () => <div data-testid="mock-dashboard-chat">Chat</div>,
      }));

      render(<DashboardAgentSection />);

      expect(screen.getByText(/No widgets yet/i)).toBeInTheDocument();
    });

    it('shows instructions for using AI Assistant', () => {
      render(<DashboardAgentSection />);

      expect(
        screen.getByText(/Use the AI Assistant to ask about your projects/i)
      ).toBeInTheDocument();
    });
  });

  describe('Responsive Layout', () => {
    it('has correct grid classes for responsive layout', () => {
      render(<DashboardAgentSection />);

      // Find the content grid container
      const contentGrid = screen
        .getByTestId('dashboard-agent-section')
        .querySelector('.grid');
      expect(contentGrid).toHaveClass('grid-cols-1');
      expect(contentGrid).toHaveClass('lg:grid-cols-3');
    });

    it('widget area spans 2 columns on desktop', () => {
      render(<DashboardAgentSection />);

      // The widget grid wrapper should span 2 columns
      const widgetWrapper = screen
        .getByTestId('mock-dashboard-grid')
        .closest('.lg\\:col-span-2');
      expect(widgetWrapper).toBeInTheDocument();
    });

    it('chat sidebar is sticky on desktop', () => {
      render(<DashboardAgentSection />);

      // The chat wrapper should have sticky positioning
      const chatWrapper = screen
        .getByTestId('mock-dashboard-chat')
        .closest('.lg\\:sticky');
      expect(chatWrapper).toBeInTheDocument();
    });
  });
});
