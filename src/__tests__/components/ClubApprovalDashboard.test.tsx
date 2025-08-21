/**
 * ClubApprovalDashboard Component Tests
 * Comprehensive tests for the club approval dashboard component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import { ClubApprovalDashboard } from '@/components/admin/ClubApprovalDashboard';
import * as clubApprovalHooks from '@/hooks/use-club-approval';

// Mock the hooks
vi.mock('@/hooks/use-club-approval');

// Mock the child components
vi.mock('@/components/admin/ClubApplicationList', () => ({
  ClubApplicationList: ({ onApplicationSelect }: { onApplicationSelect?: (id: string) => void }) => (
    <div data-testid="club-application-list">
      <button onClick={() => onApplicationSelect?.('test-club-id')}>
        Select Application
      </button>
    </div>
  )
}));

vi.mock('@/components/admin/ClubApplicationReview', () => ({
  ClubApplicationReview: ({ applicationId, onBack }: { applicationId: string; onBack: () => void }) => (
    <div data-testid="club-application-review">
      <span>Reviewing: {applicationId}</span>
      <button onClick={onBack}>Back to List</button>
    </div>
  )
}));

const mockStats = {
  pending: 5,
  approved: 10,
  rejected: 2,
  total: 17
};

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false }
  }
});

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('ClubApprovalDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock the stats hook
    vi.mocked(clubApprovalHooks.useClubApplicationStats).mockReturnValue({
      data: mockStats,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isError: false,
      isSuccess: true
    } as any);
  });

  it('renders dashboard with statistics cards', () => {
    renderWithQueryClient(<ClubApprovalDashboard />);
    
    expect(screen.getByText('Club Application Management')).toBeInTheDocument();
    expect(screen.getByText('Pending Applications')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Approved Clubs')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('Rejected Applications')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Total Applications')).toBeInTheDocument();
    expect(screen.getByText('17')).toBeInTheDocument();
  });

  it('displays loading state for statistics', () => {
    vi.mocked(clubApprovalHooks.useClubApplicationStats).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
      isError: false,
      isSuccess: false
    } as any);

    renderWithQueryClient(<ClubApprovalDashboard />);
    
    // Should show skeleton loaders for stats
    expect(document.querySelectorAll('.animate-pulse')).toHaveLength(4);
  });

  it('displays error state for statistics', () => {
    vi.mocked(clubApprovalHooks.useClubApplicationStats).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch stats'),
      refetch: vi.fn(),
      isError: true,
      isSuccess: false
    } as any);

    renderWithQueryClient(<ClubApprovalDashboard />);
    
    expect(screen.getByText('Error loading statistics')).toBeInTheDocument();
  });

  it('shows application list by default', () => {
    renderWithQueryClient(<ClubApprovalDashboard />);
    
    expect(screen.getByTestId('club-application-list')).toBeInTheDocument();
    expect(screen.queryByTestId('club-application-review')).not.toBeInTheDocument();
  });

  it('navigates to application review when application is selected', () => {
    renderWithQueryClient(<ClubApprovalDashboard />);
    
    const selectButton = screen.getByText('Select Application');
    fireEvent.click(selectButton);
    
    expect(screen.getByTestId('club-application-review')).toBeInTheDocument();
    expect(screen.getByText('Reviewing: test-club-id')).toBeInTheDocument();
    expect(screen.queryByTestId('club-application-list')).not.toBeInTheDocument();
  });

  it('navigates back to list from application review', () => {
    renderWithQueryClient(<ClubApprovalDashboard />);
    
    // Navigate to review
    const selectButton = screen.getByText('Select Application');
    fireEvent.click(selectButton);
    
    expect(screen.getByTestId('club-application-review')).toBeInTheDocument();
    
    // Navigate back
    const backButton = screen.getByText('Back to List');
    fireEvent.click(backButton);
    
    expect(screen.getByTestId('club-application-list')).toBeInTheDocument();
    expect(screen.queryByTestId('club-application-review')).not.toBeInTheDocument();
  });

  it('displays quick action buttons', () => {
    renderWithQueryClient(<ClubApprovalDashboard />);
    
    expect(screen.getByText('View All Pending')).toBeInTheDocument();
    expect(screen.getByText('View Recent Activity')).toBeInTheDocument();
  });

  it('handles quick action button clicks', () => {
    renderWithQueryClient(<ClubApprovalDashboard />);
    
    const viewPendingButton = screen.getByText('View All Pending');
    const viewActivityButton = screen.getByText('View Recent Activity');
    
    // These should be clickable without errors
    fireEvent.click(viewPendingButton);
    fireEvent.click(viewActivityButton);
    
    // Should still show the application list
    expect(screen.getByTestId('club-application-list')).toBeInTheDocument();
  });

  it('displays responsive layout correctly', () => {
    renderWithQueryClient(<ClubApprovalDashboard />);
    
    const dashboard = screen.getByText('Club Application Management').closest('div');
    expect(dashboard).toBeInTheDocument();
    
    // Should have responsive grid classes
    const statsGrid = document.querySelector('.grid');
    expect(statsGrid).toBeInTheDocument();
  });

  it('shows correct statistics when data is available', () => {
    const customStats = {
      pending: 15,
      approved: 25,
      rejected: 5,
      total: 45
    };

    vi.mocked(clubApprovalHooks.useClubApplicationStats).mockReturnValue({
      data: customStats,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isError: false,
      isSuccess: true
    } as any);

    renderWithQueryClient(<ClubApprovalDashboard />);
    
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();
  });

  it('handles zero statistics gracefully', () => {
    const zeroStats = {
      pending: 0,
      approved: 0,
      rejected: 0,
      total: 0
    };

    vi.mocked(clubApprovalHooks.useClubApplicationStats).mockReturnValue({
      data: zeroStats,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isError: false,
      isSuccess: true
    } as any);

    renderWithQueryClient(<ClubApprovalDashboard />);
    
    // Should display zeros without issues
    const zeroElements = screen.getAllByText('0');
    expect(zeroElements).toHaveLength(4);
  });

  it('maintains state when switching between views', () => {
    renderWithQueryClient(<ClubApprovalDashboard />);
    
    // Navigate to review
    fireEvent.click(screen.getByText('Select Application'));
    expect(screen.getByText('Reviewing: test-club-id')).toBeInTheDocument();
    
    // Navigate back
    fireEvent.click(screen.getByText('Back to List'));
    expect(screen.getByTestId('club-application-list')).toBeInTheDocument();
    
    // Statistics should still be visible
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });
});