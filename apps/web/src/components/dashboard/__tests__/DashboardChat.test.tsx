/**
 * DashboardChat Component Tests - Story DM-03.5
 *
 * Tests for the chat interface component with quick action suggestions.
 *
 * @see docs/modules/bm-dm/stories/dm-03-5-end-to-end-testing.md
 * @see docs/modules/bm-dm/epics/epic-dm-03-tech-spec.md - Section 3.4
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardChat } from '../DashboardChat';
import { Star } from 'lucide-react';

// Mock useCopilotChatState hook
const mockOpen = vi.fn();
vi.mock('@/components/copilot', () => ({
  useCopilotChatState: () => ({
    open: mockOpen,
  }),
}));

describe('DashboardChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Header', () => {
    it('renders Dashboard Assistant title', () => {
      render(<DashboardChat />);

      expect(screen.getByRole('heading', { name: /Dashboard Assistant/i })).toBeInTheDocument();
    });

    it('renders description text', () => {
      render(<DashboardChat />);

      expect(
        screen.getByText(/Ask me anything about your workspace, projects, or team/i)
      ).toBeInTheDocument();
    });

    it('renders message icon in title', () => {
      render(<DashboardChat />);

      // Icon should be in the header
      const header = screen.getByRole('heading', { name: /Dashboard Assistant/i });
      expect(header.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Quick Actions', () => {
    it('renders Quick actions section', () => {
      render(<DashboardChat />);

      expect(screen.getByText(/Quick actions/i)).toBeInTheDocument();
    });

    it('renders all default quick action buttons', () => {
      render(<DashboardChat />);

      expect(screen.getByTestId('quick-action-project-status')).toBeInTheDocument();
      expect(screen.getByTestId('quick-action-at-risk')).toBeInTheDocument();
      expect(screen.getByTestId('quick-action-team-activity')).toBeInTheDocument();
      expect(screen.getByTestId('quick-action-workspace-overview')).toBeInTheDocument();
    });

    it('renders project status button with label and description', () => {
      render(<DashboardChat />);

      const button = screen.getByTestId('quick-action-project-status');
      expect(button).toHaveTextContent('Show project status');
      expect(button).toHaveTextContent('View project progress and health');
    });

    it('renders at risk button with label and description', () => {
      render(<DashboardChat />);

      const button = screen.getByTestId('quick-action-at-risk');
      expect(button).toHaveTextContent("What's at risk?");
      expect(button).toHaveTextContent('Identify potential issues');
    });

    it('renders team activity button with label and description', () => {
      render(<DashboardChat />);

      const button = screen.getByTestId('quick-action-team-activity');
      expect(button).toHaveTextContent('Recent team activity');
      expect(button).toHaveTextContent('See what your team has been working on');
    });

    it('renders workspace overview button with label and description', () => {
      render(<DashboardChat />);

      const button = screen.getByTestId('quick-action-workspace-overview');
      expect(button).toHaveTextContent('Workspace overview');
      expect(button).toHaveTextContent('Get high-level workspace insights');
    });

    it('clicking quick action opens chat panel', () => {
      render(<DashboardChat />);

      fireEvent.click(screen.getByTestId('quick-action-project-status'));
      expect(mockOpen).toHaveBeenCalledTimes(1);
    });

    it('all quick action buttons trigger chat open', () => {
      render(<DashboardChat />);

      // Click each button
      fireEvent.click(screen.getByTestId('quick-action-project-status'));
      fireEvent.click(screen.getByTestId('quick-action-at-risk'));
      fireEvent.click(screen.getByTestId('quick-action-team-activity'));
      fireEvent.click(screen.getByTestId('quick-action-workspace-overview'));

      expect(mockOpen).toHaveBeenCalledTimes(4);
    });

    it('supports custom quick actions', () => {
      const customActions = [
        {
          id: 'custom-1',
          label: 'Custom Action',
          message: 'Custom message',
          icon: Star,
          description: 'Custom description',
        },
      ];

      render(<DashboardChat quickActions={customActions} />);

      expect(screen.getByTestId('quick-action-custom-1')).toBeInTheDocument();
      expect(screen.getByText('Custom Action')).toBeInTheDocument();
      expect(screen.getByText('Custom description')).toBeInTheDocument();
    });
  });

  describe('Open Chat Button', () => {
    it('renders Open AI Assistant button', () => {
      render(<DashboardChat />);

      expect(screen.getByTestId('dashboard-open-chat')).toBeInTheDocument();
      expect(screen.getByText('Open AI Assistant')).toBeInTheDocument();
    });

    it('clicking Open AI Assistant button opens chat', () => {
      render(<DashboardChat />);

      fireEvent.click(screen.getByTestId('dashboard-open-chat'));
      expect(mockOpen).toHaveBeenCalledTimes(1);
    });
  });

  describe('Keyboard Shortcut Hint', () => {
    it('displays keyboard shortcut hint', () => {
      render(<DashboardChat />);

      expect(screen.getByText('Cmd+/')).toBeInTheDocument();
      expect(screen.getByText(/to toggle assistant/i)).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('accepts and applies additional className', () => {
      const { container } = render(<DashboardChat className="custom-class" />);

      // The Card component should have the custom class
      const card = container.querySelector('.custom-class');
      expect(card).toBeInTheDocument();
    });

    it('applies h-full class for full height', () => {
      const { container } = render(<DashboardChat />);

      // Should have height full class on the card
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('h-full');
    });
  });

  describe('Accessibility', () => {
    it('quick action buttons are focusable', () => {
      render(<DashboardChat />);

      const button = screen.getByTestId('quick-action-project-status');
      button.focus();
      expect(document.activeElement).toBe(button);
    });

    it('buttons have text content for screen readers', () => {
      render(<DashboardChat />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button.textContent?.length).toBeGreaterThan(0);
      });
    });
  });
});
