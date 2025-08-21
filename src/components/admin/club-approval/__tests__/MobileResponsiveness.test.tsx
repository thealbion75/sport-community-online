/**
 * Mobile Responsiveness Tests
 * Tests for mobile-optimized club approval components
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';

import { ClubApprovalDashboard } from '../ClubApprovalDashboard';
import { ClubApplicationList } from '../ClubApplicationList';
import { SwipeNavigation } from '../SwipeNavigation';
import { MobilePagination } from '../MobilePagination';
import { MobileFilters } from '../MobileFilters';

// Mock hooks
jest.mock('@/hooks/use-admin', () => ({
  useIsAdmin: () => ({ data: true, isLoading: false, error: null })
}));

jest.mock('@/hooks/use-club-approval', () => ({
  useClubApplicationStats: () => ({
    data: { pending: 5, approved: 10, rejected: 2, total: 17 },
    isLoading: false,
    error: null
  }),
  usePendingApplications: () => ({
    data: { data: [], total_pages: 1 },
    isLoading: false,
    error: null
  }),
  useAllApplications: () => ({
    data: { data: [], total_pages: 1 },
    isLoading: false,
    error: null
  })
}));

// Test wrapper
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

// Mock window.innerWidth for mobile testing
const mockWindowWidth = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  window.dispatchEvent(new Event('resize'));
};

describe('Mobile Responsiveness', () => {
  beforeEach(() => {
    // Reset to desktop width
    mockWindowWidth(1024);
  });

  describe('ClubApprovalDashboard Mobile Layout', () => {
    it('should display mobile-optimized header on small screens', () => {
      mockWindowWidth(375); // iPhone width
      
      render(
        <TestWrapper>
          <ClubApprovalDashboard />
        </TestWrapper>
      );

      // Check for mobile-specific text
      expect(screen.getByText('Club Applications')).toBeInTheDocument();
      expect(screen.queryByText('Club Application Management')).not.toBeInTheDocument();
    });

    it('should show compact statistics cards on mobile', () => {
      mockWindowWidth(375);
      
      render(
        <TestWrapper>
          <ClubApprovalDashboard />
        </TestWrapper>
      );

      // Statistics should be in 2-column grid on mobile
      const statsContainer = screen.getByText('5').closest('.grid');
      expect(statsContainer).toHaveClass('grid-cols-2');
    });

    it('should have touch-friendly buttons', () => {
      render(
        <TestWrapper>
          <ClubApprovalDashboard />
        </TestWrapper>
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('touch-manipulation');
      });
    });
  });

  describe('SwipeNavigation Component', () => {
    it('should handle swipe gestures correctly', async () => {
      const onSwipeLeft = jest.fn();
      const onSwipeRight = jest.fn();

      render(
        <SwipeNavigation onSwipeLeft={onSwipeLeft} onSwipeRight={onSwipeRight}>
          <div>Test content</div>
        </SwipeNavigation>
      );

      const container = screen.getByText('Test content').parentElement;

      // Simulate swipe right (should call onSwipeRight)
      fireEvent.touchStart(container!, {
        targetTouches: [{ clientX: 100, clientY: 100 }]
      });
      fireEvent.touchMove(container!, {
        targetTouches: [{ clientX: 200, clientY: 100 }]
      });
      fireEvent.touchEnd(container!);

      await waitFor(() => {
        expect(onSwipeRight).toHaveBeenCalled();
      });
    });

    it('should not trigger swipe on vertical movement', async () => {
      const onSwipeLeft = jest.fn();
      const onSwipeRight = jest.fn();

      render(
        <SwipeNavigation onSwipeLeft={onSwipeLeft} onSwipeRight={onSwipeRight}>
          <div>Test content</div>
        </SwipeNavigation>
      );

      const container = screen.getByText('Test content').parentElement;

      // Simulate vertical swipe (should not trigger callbacks)
      fireEvent.touchStart(container!, {
        targetTouches: [{ clientX: 100, clientY: 100 }]
      });
      fireEvent.touchMove(container!, {
        targetTouches: [{ clientX: 100, clientY: 200 }]
      });
      fireEvent.touchEnd(container!);

      await waitFor(() => {
        expect(onSwipeLeft).not.toHaveBeenCalled();
        expect(onSwipeRight).not.toHaveBeenCalled();
      });
    });
  });

  describe('MobilePagination Component', () => {
    it('should show dropdown on mobile screens', () => {
      mockWindowWidth(375);
      
      render(
        <MobilePagination
          currentPage={1}
          totalPages={5}
          onPageChange={jest.fn()}
        />
      );

      // Should show select dropdown on mobile
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should show page numbers on desktop screens', () => {
      mockWindowWidth(1024);
      
      render(
        <MobilePagination
          currentPage={1}
          totalPages={5}
          onPageChange={jest.fn()}
        />
      );

      // Should show individual page buttons on desktop
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should have touch-friendly button sizes', () => {
      render(
        <MobilePagination
          currentPage={1}
          totalPages={5}
          onPageChange={jest.fn()}
        />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('min-h-[44px]');
        expect(button).toHaveClass('touch-manipulation');
      });
    });
  });

  describe('MobileFilters Component', () => {
    const mockFilters = {
      status: 'pending' as const,
      search: '',
      limit: 10,
      offset: 0
    };

    it('should show quick search bar', () => {
      render(
        <MobileFilters
          filters={mockFilters}
          onFiltersChange={jest.fn()}
          onClearFilters={jest.fn()}
        />
      );

      expect(screen.getByPlaceholderText('Search clubs...')).toBeInTheDocument();
    });

    it('should open filter sheet when filters button is clicked', async () => {
      render(
        <MobileFilters
          filters={mockFilters}
          onFiltersChange={jest.fn()}
          onClearFilters={jest.fn()}
        />
      );

      const filtersButton = screen.getByText('Filters');
      fireEvent.click(filtersButton);

      await waitFor(() => {
        expect(screen.getByText('Filter Applications')).toBeInTheDocument();
      });
    });

    it('should show active filter count badge', () => {
      const filtersWithSearch = {
        ...mockFilters,
        search: 'test search',
        location: 'test location'
      };

      render(
        <MobileFilters
          filters={filtersWithSearch}
          onFiltersChange={jest.fn()}
          onClearFilters={jest.fn()}
        />
      );

      // Should show badge with count of 2 (search + location)
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  describe('Touch-friendly Interactions', () => {
    it('should have minimum touch target sizes', () => {
      render(
        <TestWrapper>
          <ClubApplicationList />
        </TestWrapper>
      );

      // All interactive elements should meet minimum touch target size (44px)
      const buttons = screen.getAllByRole('button');
      const checkboxes = screen.getAllByRole('checkbox');
      const selects = screen.getAllByRole('combobox');

      [...buttons, ...checkboxes, ...selects].forEach(element => {
        const styles = window.getComputedStyle(element);
        const minHeight = parseInt(styles.minHeight);
        const minWidth = parseInt(styles.minWidth);
        
        // Should meet WCAG AA touch target guidelines (44px minimum)
        expect(minHeight).toBeGreaterThanOrEqual(44);
        expect(minWidth).toBeGreaterThanOrEqual(44);
      });
    });

    it('should prevent tap highlight on touch devices', () => {
      render(
        <TestWrapper>
          <ClubApprovalDashboard />
        </TestWrapper>
      );

      const touchElements = document.querySelectorAll('.touch-manipulation');
      touchElements.forEach(element => {
        const styles = window.getComputedStyle(element);
        expect(styles.webkitTapHighlightColor).toBe('transparent');
      });
    });
  });

  describe('Responsive Breakpoints', () => {
    const breakpoints = [
      { width: 320, name: 'mobile-small' },
      { width: 375, name: 'mobile-medium' },
      { width: 768, name: 'tablet' },
      { width: 1024, name: 'desktop' },
      { width: 1440, name: 'desktop-large' }
    ];

    breakpoints.forEach(({ width, name }) => {
      it(`should render correctly at ${name} (${width}px)`, () => {
        mockWindowWidth(width);
        
        render(
          <TestWrapper>
            <ClubApprovalDashboard />
          </TestWrapper>
        );

        // Component should render without errors at all breakpoints
        expect(screen.getByText(/Club Application/)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility on Mobile', () => {
    it('should maintain proper focus management on mobile', () => {
      render(
        <TestWrapper>
          <ClubApplicationList />
        </TestWrapper>
      );

      // All interactive elements should be focusable
      const interactiveElements = screen.getAllByRole('button');
      interactiveElements.forEach(element => {
        expect(element).toHaveAttribute('tabIndex');
      });
    });

    it('should have proper ARIA labels for touch interactions', () => {
      render(
        <SwipeNavigation onSwipeLeft={jest.fn()} onSwipeRight={jest.fn()}>
          <div>Content</div>
        </SwipeNavigation>
      );

      // Swipe indicators should have proper accessibility
      const indicators = document.querySelectorAll('[class*="swipe-indicator"]');
      indicators.forEach(indicator => {
        expect(indicator).toHaveAttribute('aria-hidden', 'true');
      });
    });
  });
});