import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AlertWidget } from '../AlertWidget';
import type { AlertData } from '../../types';

const mockData: AlertData = {
  severity: 'warning',
  title: 'Warning Title',
  message: 'This is a warning message.',
  action: { label: 'Take Action', href: '/action' },
};

describe('AlertWidget', () => {
  it('renders alert title', () => {
    render(<AlertWidget data={mockData} />);

    expect(screen.getByText('Warning Title')).toBeInTheDocument();
  });

  it('renders alert message', () => {
    render(<AlertWidget data={mockData} />);

    expect(screen.getByText('This is a warning message.')).toBeInTheDocument();
  });

  it('renders action button as link', () => {
    render(<AlertWidget data={mockData} />);

    const link = screen.getByRole('link', { name: 'Take Action' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/action');
  });

  it('renders without action when not provided', () => {
    const { action: _action, ...dataWithoutAction } = mockData;
    render(<AlertWidget data={dataWithoutAction} />);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders info severity styling', () => {
    render(<AlertWidget data={{ ...mockData, severity: 'info' }} />);

    const alert = screen.getByTestId('alert-widget');
    expect(alert.className).toContain('blue');
  });

  it('renders warning severity styling', () => {
    render(<AlertWidget data={mockData} />);

    const alert = screen.getByTestId('alert-widget');
    expect(alert.className).toContain('yellow');
  });

  it('renders error severity styling', () => {
    render(<AlertWidget data={{ ...mockData, severity: 'error' }} />);

    const alert = screen.getByTestId('alert-widget');
    expect(alert.className).toContain('red');
  });

  it('renders success severity styling', () => {
    render(<AlertWidget data={{ ...mockData, severity: 'success' }} />);

    const alert = screen.getByTestId('alert-widget');
    expect(alert.className).toContain('green');
  });

  it('returns null when title is empty', () => {
    const { container } = render(
      <AlertWidget data={{ ...mockData, title: '' }} />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('returns null when message is empty', () => {
    const { container } = render(
      <AlertWidget data={{ ...mockData, message: '' }} />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('returns null when both title and message are missing', () => {
    const { container } = render(
      <AlertWidget data={{ severity: 'info' } as AlertData} />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders loading skeleton when isLoading is true', () => {
    render(<AlertWidget data={mockData} isLoading />);

    expect(screen.queryByText('Warning Title')).not.toBeInTheDocument();
    expect(screen.getByTestId('widget-skeleton-alert')).toBeInTheDocument();
  });

  it('has correct test id', () => {
    render(<AlertWidget data={mockData} />);

    expect(screen.getByTestId('alert-widget')).toBeInTheDocument();
  });

  it('has role alert for accessibility', () => {
    render(<AlertWidget data={mockData} />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('has aria-live polite for accessibility', () => {
    render(<AlertWidget data={mockData} />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'polite');
  });

  it('renders icon with aria-hidden', () => {
    render(<AlertWidget data={mockData} />);

    const icon = screen.getByTestId('alert-widget').querySelector('[aria-hidden="true"]');
    expect(icon).toBeInTheDocument();
  });

  it('defaults to info severity for unknown severity', () => {
    render(
      <AlertWidget
        data={{ ...mockData, severity: 'unknown' as AlertData['severity'] }}
      />
    );

    const alert = screen.getByTestId('alert-widget');
    expect(alert.className).toContain('blue');
  });
});
