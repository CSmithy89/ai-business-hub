import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Pagination, PaginationInfo } from '../ui/pagination';

describe('Pagination', () => {
  describe('rendering', () => {
    it('renders nothing when totalPages is 1', () => {
      const onPageChange = vi.fn();
      const { container } = render(
        <Pagination currentPage={1} totalPages={1} onPageChange={onPageChange} />
      );

      expect(container.firstChild).toBeNull();
    });

    it('renders nothing when totalPages is 0', () => {
      const onPageChange = vi.fn();
      const { container } = render(
        <Pagination currentPage={1} totalPages={0} onPageChange={onPageChange} />
      );

      expect(container.firstChild).toBeNull();
    });

    it('renders navigation when totalPages > 1', () => {
      const onPageChange = vi.fn();
      render(
        <Pagination currentPage={1} totalPages={5} onPageChange={onPageChange} />
      );

      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('displays page info (Page X of Y)', () => {
      const onPageChange = vi.fn();
      render(
        <Pagination currentPage={3} totalPages={10} onPageChange={onPageChange} />
      );

      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
    });

    it('displays item count info when provided', () => {
      const onPageChange = vi.fn();
      render(
        <Pagination
          currentPage={2}
          totalPages={5}
          totalItems={50}
          itemsPerPage={10}
          onPageChange={onPageChange}
        />
      );

      expect(screen.getByText('11')).toBeInTheDocument(); // showingStart
      expect(screen.getByText('20')).toBeInTheDocument(); // showingEnd
      expect(screen.getByText('50')).toBeInTheDocument(); // totalItems
    });

    it('calculates correct range for last page', () => {
      const onPageChange = vi.fn();
      render(
        <Pagination
          currentPage={5}
          totalPages={5}
          totalItems={47}
          itemsPerPage={10}
          onPageChange={onPageChange}
        />
      );

      // showingStart: 41, showingEnd: 47, totalItems: 47
      // "47" appears twice (showingEnd and totalItems)
      expect(screen.getByText('41')).toBeInTheDocument(); // showingStart
      expect(screen.getAllByText('47')).toHaveLength(2); // showingEnd + totalItems
    });
  });

  describe('navigation buttons', () => {
    it('disables Previous button on first page', () => {
      const onPageChange = vi.fn();
      render(
        <Pagination currentPage={1} totalPages={5} onPageChange={onPageChange} />
      );

      const prevButton = screen.getByRole('button', { name: /previous/i });
      expect(prevButton).toBeDisabled();
    });

    it('enables Previous button when not on first page', () => {
      const onPageChange = vi.fn();
      render(
        <Pagination currentPage={3} totalPages={5} onPageChange={onPageChange} />
      );

      const prevButton = screen.getByRole('button', { name: /previous/i });
      expect(prevButton).not.toBeDisabled();
    });

    it('disables Next button on last page', () => {
      const onPageChange = vi.fn();
      render(
        <Pagination currentPage={5} totalPages={5} onPageChange={onPageChange} />
      );

      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(nextButton).toBeDisabled();
    });

    it('enables Next button when not on last page', () => {
      const onPageChange = vi.fn();
      render(
        <Pagination currentPage={3} totalPages={5} onPageChange={onPageChange} />
      );

      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(nextButton).not.toBeDisabled();
    });

    it('calls onPageChange with previous page when Previous clicked', () => {
      const onPageChange = vi.fn();
      render(
        <Pagination currentPage={3} totalPages={5} onPageChange={onPageChange} />
      );

      fireEvent.click(screen.getByRole('button', { name: /previous/i }));
      expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it('calls onPageChange with next page when Next clicked', () => {
      const onPageChange = vi.fn();
      render(
        <Pagination currentPage={3} totalPages={5} onPageChange={onPageChange} />
      );

      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      expect(onPageChange).toHaveBeenCalledWith(4);
    });
  });

  describe('page numbers mode', () => {
    it('shows page number buttons when showPageNumbers is true', () => {
      const onPageChange = vi.fn();
      render(
        <Pagination
          currentPage={1}
          totalPages={5}
          onPageChange={onPageChange}
          showPageNumbers
        />
      );

      expect(screen.getByRole('button', { name: 'Go to page 1' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go to page 5' })).toBeInTheDocument();
    });

    it('does not show page number buttons by default', () => {
      const onPageChange = vi.fn();
      render(
        <Pagination currentPage={1} totalPages={5} onPageChange={onPageChange} />
      );

      expect(screen.queryByRole('button', { name: 'Go to page 1' })).not.toBeInTheDocument();
    });

    it('marks current page with aria-current', () => {
      const onPageChange = vi.fn();
      render(
        <Pagination
          currentPage={3}
          totalPages={5}
          onPageChange={onPageChange}
          showPageNumbers
        />
      );

      const currentPageButton = screen.getByRole('button', { name: 'Go to page 3' });
      expect(currentPageButton).toHaveAttribute('aria-current', 'page');
    });

    it('calls onPageChange when page number clicked', () => {
      const onPageChange = vi.fn();
      render(
        <Pagination
          currentPage={1}
          totalPages={5}
          onPageChange={onPageChange}
          showPageNumbers
        />
      );

      // With currentPage=1, totalPages=5, visible pages are: 1, 2, ..., 5
      // Click on page 2 (which is visible in the range)
      fireEvent.click(screen.getByRole('button', { name: 'Go to page 2' }));
      expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it('shows ellipsis for large page ranges', () => {
      const onPageChange = vi.fn();
      render(
        <Pagination
          currentPage={5}
          totalPages={10}
          onPageChange={onPageChange}
          showPageNumbers
        />
      );

      // Should show: 1 ... 4 5 6 ... 10
      // Use exact name match to avoid false positives
      expect(screen.getByRole('button', { name: 'Go to page 1' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go to page 4' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go to page 5' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go to page 6' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go to page 10' })).toBeInTheDocument();

      // Should not show pages 2, 3, 7, 8, 9
      expect(screen.queryByRole('button', { name: 'Go to page 2' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Go to page 7' })).not.toBeInTheDocument();
    });

    it('does not show ellipsis when not needed', () => {
      const onPageChange = vi.fn();
      render(
        <Pagination
          currentPage={2}
          totalPages={3}
          onPageChange={onPageChange}
          showPageNumbers
        />
      );

      // Should show all pages: 1 2 3
      expect(screen.getByRole('button', { name: 'Go to page 1' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go to page 2' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go to page 3' })).toBeInTheDocument();

      // No ellipsis
      expect(screen.queryByTestId('ellipsis')).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has navigation role with aria-label', () => {
      const onPageChange = vi.fn();
      render(
        <Pagination currentPage={1} totalPages={5} onPageChange={onPageChange} />
      );

      expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', 'Pagination');
    });

    it('allows custom aria-label', () => {
      const onPageChange = vi.fn();
      render(
        <Pagination
          currentPage={1}
          totalPages={5}
          onPageChange={onPageChange}
          ariaLabel="Results navigation"
        />
      );

      expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', 'Results navigation');
    });

    it('has accessible button labels', () => {
      const onPageChange = vi.fn();
      render(
        <Pagination currentPage={3} totalPages={5} onPageChange={onPageChange} />
      );

      expect(screen.getByRole('button', { name: /go to previous page/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /go to next page/i })).toBeInTheDocument();
    });
  });

  describe('className prop', () => {
    it('applies custom className to container', () => {
      const onPageChange = vi.fn();
      render(
        <Pagination
          currentPage={1}
          totalPages={5}
          onPageChange={onPageChange}
          className="custom-class"
        />
      );

      expect(screen.getByRole('navigation')).toHaveClass('custom-class');
    });
  });
});

describe('PaginationInfo', () => {
  it('displays current and total count', () => {
    render(<PaginationInfo currentCount={25} totalCount={100} />);

    expect(screen.getByText(/Showing 25 of 100/i)).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <PaginationInfo currentCount={25} totalCount={100} className="custom-info" />
    );

    expect(screen.getByText(/Showing 25 of 100/i)).toHaveClass('custom-info');
  });
});
