import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WidgetEmpty } from '../WidgetEmpty';

describe('WidgetEmpty', () => {
  it('renders default message', () => {
    render(<WidgetEmpty />);

    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('renders custom message', () => {
    render(<WidgetEmpty message="Custom empty message" />);

    expect(screen.getByText('Custom empty message')).toBeInTheDocument();
    expect(screen.queryByText('No data available')).not.toBeInTheDocument();
  });

  it('renders default icon when none provided', () => {
    render(<WidgetEmpty />);

    // Default icon is InboxIcon, rendered in a container with aria-hidden
    const iconContainer = screen.getByTestId('widget-empty').querySelector('[aria-hidden="true"]');
    expect(iconContainer).toBeInTheDocument();
  });

  it('renders custom icon when provided', () => {
    const customIcon = <span data-testid="custom-icon">Custom Icon</span>;
    render(<WidgetEmpty icon={customIcon} />);

    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('renders in a Card by default (asCard=true)', () => {
    render(<WidgetEmpty />);

    // The Card component should be present
    const card = screen.getByTestId('widget-empty').closest('[data-card="true"]');
    expect(card).toBeInTheDocument();
  });

  it('renders without Card when asCard is false', () => {
    render(<WidgetEmpty asCard={false} />);

    const card = screen.getByTestId('widget-empty').closest('[data-card="true"]');
    expect(card).not.toBeInTheDocument();
  });

  it('renders action button when action is provided with onClick', () => {
    const onClick = vi.fn();
    render(
      <WidgetEmpty
        message="Empty state"
        action={{ label: 'Take Action', onClick }}
      />
    );

    const button = screen.getByRole('button', { name: 'Take Action' });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders action as link when href is provided', () => {
    render(
      <WidgetEmpty
        message="Empty state"
        action={{ label: 'Go to Page', href: '/some-page' }}
      />
    );

    const link = screen.getByRole('link', { name: 'Go to Page' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/some-page');
  });

  it('does not render action button when action is not provided', () => {
    render(<WidgetEmpty />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('has correct test id', () => {
    render(<WidgetEmpty />);

    expect(screen.getByTestId('widget-empty')).toBeInTheDocument();
  });

  it('renders with centered text alignment', () => {
    render(<WidgetEmpty />);

    const content = screen.getByTestId('widget-empty');
    expect(content.className).toContain('text-center');
  });
});
