/**
 * ClubApplicationReview Component Tests
 * Tests for the detailed application review interface
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ClubApplicationReview } from '../ClubApplicationReview';
import * as clubApprovalHooks from '@/hooks/use-club-approval';
import { ClubApplicationReview as ClubApplicationReviewType } from '@/types';

// Mock the hooks
vi.mock('@/hooks/use-club-approval');
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

const mockClubApplication: ClubApplicationReviewType = {
  club: {
    id: 'test-club-id',
    name: 'Test Sports Club',
    description: 'A test sports club for unit testing',
    location: 'Test City, Test State',
    contact_email: 'test@example.com',
    contact_phone: '+1234567890',
    website_url: 'https://testclub.com',
    sport_types: ['Football', 'Basketball'],
    verified: false,
    application_status: 'pending',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  history: [
    {
      id: 'history-1',
      club_id: 'test-club-id',
      admin_id: 'admin-1',
      action: 'pending',
      created_at: '2024-01-01T00:00:00Z',
      admin_email: 'admin@example.com'
    }
  ]
};

const mockHistoryData = [
  {
    id: 'history-1',
    club_id: 'test-club-id',
    admin_id: 'admin-1',
    action: 'pending' as const,
    created_at: '2024-01-01T00:00:00Z',
    admin_email: 'admin@example.com'
  }
];

describe('ClubApplicationReview', () => {
  let queryClient: QueryClient;
  const mockOnBack = vi.fn();

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
    vi.clearAllMocks();
  });

  const renderComponent = (clubId = 'test-club-id') => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ClubApplicationReview clubId={clubId} onBack={mockOnBack} />
      </QueryClientProvider>
    );
  };

  it('renders loading state initially', () => {
    vi.mocked(clubApprovalHooks.useClubApplication).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null
    } as any);

    vi.mocked(clubApprovalHooks.useApplicationHistory).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null
    } as any);

    vi.mocked(clubApprovalHooks.useApproveApplication).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false
    } as any);

    vi.mocked(clubApprovalHooks.useRejectApplication).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false
    } as any);

    renderComponent();

    // Check for loading skeleton elements
    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
  });

  it('renders application details when data is loaded', () => {
    vi.mocked(clubApprovalHooks.useClubApplication).mockReturnValue({
      data: mockClubApplication,
      isLoading: false,
      error: null
    } as any);

    vi.mocked(clubApprovalHooks.useApplicationHistory).mockReturnValue({
      data: mockHistoryData,
      isLoading: false,
      error: null
    } as any);

    vi.mocked(clubApprovalHooks.useApproveApplication).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false
    } as any);

    vi.mocked(clubApprovalHooks.useRejectApplication).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false
    } as any);

    renderComponent();

    expect(screen.getByText('Test Sports Club')).toBeInTheDocument();
    expect(screen.getByText('A test sports club for unit testing')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('+1234567890')).toBeInTheDocument();
    expect(screen.getByText('Test City, Test State')).toBeInTheDocument();
    expect(screen.getByText('Football')).toBeInTheDocument();
    expect(screen.getByText('Basketball')).toBeInTheDocument();
  });

  it('shows approve and reject buttons for pending applications', () => {
    vi.mocked(clubApprovalHooks.useClubApplication).mockReturnValue({
      data: mockClubApplication,
      isLoading: false,
      error: null
    } as any);

    vi.mocked(clubApprovalHooks.useApplicationHistory).mockReturnValue({
      data: mockHistoryData,
      isLoading: false,
      error: null
    } as any);

    vi.mocked(clubApprovalHooks.useApproveApplication).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false
    } as any);

    vi.mocked(clubApprovalHooks.useRejectApplication).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false
    } as any);

    renderComponent();

    expect(screen.getByRole('button', { name: /approve/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reject/i })).toBeInTheDocument();
  });

  it('does not show action buttons for non-pending applications', () => {
    const approvedApplication = {
      ...mockClubApplication,
      club: {
        ...mockClubApplication.club,
        application_status: 'approved' as const
      }
    };

    vi.mocked(clubApprovalHooks.useClubApplication).mockReturnValue({
      data: approvedApplication,
      isLoading: false,
      error: null
    } as any);

    vi.mocked(clubApprovalHooks.useApplicationHistory).mockReturnValue({
      data: mockHistoryData,
      isLoading: false,
      error: null
    } as any);

    vi.mocked(clubApprovalHooks.useApproveApplication).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false
    } as any);

    vi.mocked(clubApprovalHooks.useRejectApplication).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false
    } as any);

    renderComponent();

    expect(screen.queryByRole('button', { name: /approve/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /reject/i })).not.toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', () => {
    vi.mocked(clubApprovalHooks.useClubApplication).mockReturnValue({
      data: mockClubApplication,
      isLoading: false,
      error: null
    } as any);

    vi.mocked(clubApprovalHooks.useApplicationHistory).mockReturnValue({
      data: mockHistoryData,
      isLoading: false,
      error: null
    } as any);

    vi.mocked(clubApprovalHooks.useApproveApplication).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false
    } as any);

    vi.mocked(clubApprovalHooks.useRejectApplication).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false
    } as any);

    renderComponent();

    const backButton = screen.getByRole('button', { name: /back to list/i });
    fireEvent.click(backButton);

    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('opens approval dialog when approve button is clicked', async () => {
    vi.mocked(clubApprovalHooks.useClubApplication).mockReturnValue({
      data: mockClubApplication,
      isLoading: false,
      error: null
    } as any);

    vi.mocked(clubApprovalHooks.useApplicationHistory).mockReturnValue({
      data: mockHistoryData,
      isLoading: false,
      error: null
    } as any);

    vi.mocked(clubApprovalHooks.useApproveApplication).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false
    } as any);

    vi.mocked(clubApprovalHooks.useRejectApplication).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false
    } as any);

    renderComponent();

    const approveButton = screen.getByRole('button', { name: /approve/i });
    fireEvent.click(approveButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('opens rejection dialog when reject button is clicked', async () => {
    vi.mocked(clubApprovalHooks.useClubApplication).mockReturnValue({
      data: mockClubApplication,
      isLoading: false,
      error: null
    } as any);

    vi.mocked(clubApprovalHooks.useApplicationHistory).mockReturnValue({
      data: mockHistoryData,
      isLoading: false,
      error: null
    } as any);

    vi.mocked(clubApprovalHooks.useApproveApplication).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false
    } as any);

    vi.mocked(clubApprovalHooks.useRejectApplication).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false
    } as any);

    renderComponent();

    const rejectButton = screen.getByRole('button', { name: /reject/i });
    fireEvent.click(rejectButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('renders error state when application fails to load', () => {
    vi.mocked(clubApprovalHooks.useClubApplication).mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Failed to load')
    } as any);

    vi.mocked(clubApprovalHooks.useApplicationHistory).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null
    } as any);

    vi.mocked(clubApprovalHooks.useApproveApplication).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false
    } as any);

    vi.mocked(clubApprovalHooks.useRejectApplication).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false
    } as any);

    renderComponent();

    expect(screen.getByText('Failed to Load Application')).toBeInTheDocument();
    expect(screen.getByText('Unable to load the application details. Please try again.')).toBeInTheDocument();
  });

  it('displays application history when available', () => {
    const historyWithMultipleEntries = [
      ...mockHistoryData,
      {
        id: 'history-2',
        club_id: 'test-club-id',
        admin_id: 'admin-2',
        action: 'approved' as const,
        notes: 'Application looks good',
        created_at: '2024-01-02T00:00:00Z',
        admin_email: 'admin2@example.com'
      }
    ];

    vi.mocked(clubApprovalHooks.useClubApplication).mockReturnValue({
      data: mockClubApplication,
      isLoading: false,
      error: null
    } as any);

    vi.mocked(clubApprovalHooks.useApplicationHistory).mockReturnValue({
      data: historyWithMultipleEntries,
      isLoading: false,
      error: null
    } as any);

    vi.mocked(clubApprovalHooks.useApproveApplication).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false
    } as any);

    vi.mocked(clubApprovalHooks.useRejectApplication).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false
    } as any);

    renderComponent();

    expect(screen.getByText('Application History')).toBeInTheDocument();
    expect(screen.getByText((content, element) => {
      return element?.textContent === 'by admin@example.com';
    })).toBeInTheDocument();
    expect(screen.getByText('Application looks good')).toBeInTheDocument();
  });
});