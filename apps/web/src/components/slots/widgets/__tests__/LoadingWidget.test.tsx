import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingWidget } from '../LoadingWidget';

describe('LoadingWidget', () => {
  it('renders without crashing', () => {
    render(<LoadingWidget />);
    expect(screen.getByTestId('loading-widget')).toBeInTheDocument();
  });

  it('displays default loading message when no type provided', () => {
    render(<LoadingWidget />);
    expect(screen.getByText('Loading widget...')).toBeInTheDocument();
  });

  it('displays loading message with widget type', () => {
    render(<LoadingWidget type="ProjectStatus" />);
    expect(screen.getByText('Loading project status...')).toBeInTheDocument();
  });

  it('converts PascalCase type to readable format', () => {
    render(<LoadingWidget type="TeamActivity" />);
    expect(screen.getByText('Loading team activity...')).toBeInTheDocument();
  });

  it('displays custom message when provided', () => {
    render(<LoadingWidget message="Fetching data from agents..." />);
    expect(screen.getByText('Fetching data from agents...')).toBeInTheDocument();
  });

  it('prefers custom message over type-based message', () => {
    render(<LoadingWidget type="Metrics" message="Custom loading message" />);
    expect(screen.getByText('Custom loading message')).toBeInTheDocument();
    expect(screen.queryByText('Loading metrics...')).not.toBeInTheDocument();
  });

  it('renders skeleton elements', () => {
    render(<LoadingWidget />);

    // Should have skeleton elements (divs with animate-pulse)
    const card = screen.getByTestId('loading-widget');
    expect(card.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('shows spinning loader icon', () => {
    render(<LoadingWidget />);

    // Should have animate-spin class on loader icon
    const card = screen.getByTestId('loading-widget');
    expect(card.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('handles Metrics type correctly', () => {
    render(<LoadingWidget type="Metrics" />);
    expect(screen.getByText('Loading metrics...')).toBeInTheDocument();
  });

  it('handles Alert type correctly', () => {
    render(<LoadingWidget type="Alert" />);
    expect(screen.getByText('Loading alert...')).toBeInTheDocument();
  });

  it('handles TaskList type correctly', () => {
    render(<LoadingWidget type="TaskList" />);
    expect(screen.getByText('Loading task list...')).toBeInTheDocument();
  });
});
