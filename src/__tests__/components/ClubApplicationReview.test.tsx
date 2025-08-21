/**
 * ClubApplicationReview Component Tests
 * Enhanced tests for the club application review component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import { ClubApplicationReview } from '@/components/admin/ClubApplicationReview';
import * as clubApprovalHooks from '@/hooks/use-club-approval';
import type { ClubApplicationReview as ClubApplicationReviewType, ClubApplicationHistory } from '@/types';

// Mock the hooks
vi.mock('@/hooks/use-club-approval');

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

// Mock date formatting
vi.mock('date-fns', () => ({
  format: vi.fn((date, formatStr) => '2024-01-15 10:00'),
  formatDistanceToNow: vi.fn(() => '2 hours ago')
}));

const mockClubApplication: ClubApplicationReviewType = {
  club: {
    id: 'club-123',
    name: 'Test Football Club',
    contact_email: 'test@football.com',
    contact_phone: '123-456-7890',
    location: 'London',
    description: 'A comprehensive football club for all ages',
    sport_types: ['football'],
    application_status: 'pending',
    admin_notes: null,
    reviewed_by: null,
    reviewed_at: null,
    verified: false,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  history: [],
  admin_user: {
    email: 'admin@example.com',
    name: 'Admin User'
  }
};

const mockHistoryData: ClubApplicationHistory[] = [
  {
    id: 'history-1',
    club_id: 'club-123',
    admin_id: 'admin-123',
    action: 'approved',
    notes: 'Approved after review',
    created_at: '2024-01-15T10:00:00Z',
    admin_email: 'admin@example.com'
  }
];

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

describe('ClubApplicationReview', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    vi.mocked(clubApprovalHooks.useClubApplication).mockReturnValue({
      data: mockClubApplication,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isError: false,
      isSuccess: true
    } as any);

    vi.mocked(clubApprovalHooks.useApplicationHistory).mockReturnValue({
      data: mockHistoryData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isError: false,
      isSuccess: true
    } as any);

    vi.mocked(clubApprovalHooks.useApproveApplication).mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({}),
      isPending: false,
      isError: false,
      error: null
    } as any);

    vi.mocked(clubApprovalHooks.useRejectApplication).mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({}),
      isPending: false,
      isError: false,
      error: null
    } as any);
  });

  it('renders loading state initially', () => {
    vi.mocked(clubApprovalHooks.useClubApplication).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
      isError: false,
      isSuccess: false
    } as any);

    vi.mocked(clubApprovalHooks.useApplicationHistory).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
      isError: false,
      isSuccess: false
    } as any);

    renderWithQueryClient(<ClubApplicationReview applicationId="club-123" onBack={mockOnBack} />);
    
    expect(screen.getByText('Loading application details...')).toBeInTheDocument();
  });

  it('renders application details when data is loaded', () => {
    renderWithQueryClient(<ClubApplicationReview applicationId="club-123" onBack={mockOnBack} />);
    
    expect(screen.getByText('Test Football Club')).toBeInTheDocument();
    expect(screen.getByText('test@football.com')).toBeInTheDocument();
    expect(screen.getByText('123-456-7890')).toBeInTheDocument();
    expect(screen.getByText('London')).toBeInTheDocument();
    expect(screen.getByText('A comprehensive football club for all ages')).toBeInTheDocument();
    expect(screen.getByText('Football')).toBeInTheDocument();
  });

  it('shows approve and reject buttons for pending applications', () => {
    renderWithQueryClient(<ClubApplicationReview applicationId="club-123" onBack={mockOnBack} />);
    
    expect(screen.getByRole('button', { name: /approve application/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reject application/i })).toBeInTheDocument();
  });

  it('hides action buttons for approved applications', () => {
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
      error: null,
      refetch: vi.fn(),
      isError: false,
      isSuccess: true
    } as any);

    renderWithQueryClient(<ClubApplicationReview applicationId="club-123" onBack={mockOnBack} />);
    
    expect(screen.queryByRole('button', { name: /approve application/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /reject application/i })).not.toBeInTheDocument();
    expect(screen.getByText('This application has been approved')).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', () => {
    renderWithQueryClient(<ClubApplicationReview applicationId="club-123" onBack={mockOnBack} />);
    
    const backButton = screen.getByRole('button', { name: /back to list/i });
    fireEvent.click(backButton);
    
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('opens approval dialog when approve button is clicked', async () => {
    renderWithQueryClient(<ClubApplicationReview applicationId="club-123" onBack={mockOnBack} />);
    
    const approveButton = screen.getByRole('button', { name: /approve application/i });
    fireEvent.click(approveButton);
    
    await waitFor(() => {
      expect(screen.getByText('Approve Application')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Are you sure you want to approve this club application?')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Optional notes for approval...')).toBeInTheDocument();
  });

  it('opens rejection dialog when reject button is clicked', async () => {
    renderWithQueryClient(<ClubApplicationReview applicationId="club-123" onBack={mockOnBack} />);
    
    const rejectButton = screen.getByRole('button', { name: /reject application/i });
    fireEvent.click(rejectButton);
    
    await waitFor(() => {
      expect(screen.getByText('Reject Application')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Please provide a reason for rejecting this application:')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Reason for rejection...')).toBeInTheDocument();
  });

  it('handles approval submission with notes', async () => {
    const mockApprove = vi.fn().mockResolvedValue({});
    vi.mocked(clubApprovalHooks.useApproveApplication).mockReturnValue({
      mutateAsync: mockApprove,
      isPending: false,
      isError: false,
      error: null
    } as any);

    renderWithQueryClient(<ClubApplicationReview applicationId="club-123" onBack={mockOnBack} />);
    
    // Open approval dialog
    fireEvent.click(screen.getByRole('button', { name: /approve application/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Approve Application')).toBeInTheDocument();
    });
    
    // Add notes
    const notesInput = screen.getByPlaceholderText('Optional notes for approval...');
    fireEvent.change(notesInput, { target: { value: 'Excellent application' } });
    
    // Submit approval
    const confirmButton = screen.getByRole('button', { name: /confirm approval/i });
    fireEvent.click(confirmButton);
    
    await waitFor(() => {
      expect(mockApprove).toHaveBeenCalledWith({
        clubId: 'club-123',
        adminNotes: 'Excellent application'
      });
    });
  });

  it('handles rejection submission with reason', async () => {
    const mockReject = vi.fn().mockResolvedValue({});
    vi.mocked(clubApprovalHooks.useRejectApplication).mockReturnValue({
      mutateAsync: mockReject,
      isPending: false,
      isError: false,
      error: null
    } as any);

    renderWithQueryClient(<ClubApplicationReview applicationId="club-123" onBack={mockOnBack} />);
    
    // Open rejection dialog
    fireEvent.click(screen.getByRole('button', { name: /reject application/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Reject Application')).toBeInTheDocument();
    });
    
    // Add rejection reason
    const reasonInput = screen.getByPlaceholderText('Reason for rejection...');
    fireEvent.change(reasonInput, { target: { value: 'Missing required documents' } });
    
    // Submit rejection
    const confirmButton = screen.getByRole('button', { name: /confirm rejection/i });
    fireEvent.click(confirmButton);
    
    await waitFor(() => {
      expect(mockReject).toHaveBeenCalledWith({
        clubId: 'club-123',
        rejectionReason: 'Missing required documents'
      });
    });
  });

  it('prevents rejection without reason', async () => {
    renderWithQueryClient(<ClubApplicationReview applicationId="club-123" onBack={mockOnBack} />);
    
    // Open rejection dialog
    fireEvent.click(screen.getByRole('button', { name: /reject application/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Reject Application')).toBeInTheDocument();
    });
    
    // Try to submit without reason
    const confirmButton = screen.getByRole('button', { name: /confirm rejection/i });
    expect(confirmButton).toBeDisabled();
  });

  it('displays application history', () => {
    renderWithQueryClient(<ClubApplicationReview applicationId="club-123" onBack={mockOnBack} />);
    
    expect(screen.getByText('Application History')).toBeInTheDocument();
    expect(screen.getByText('Approved')).toBeInTheDocument();
    expect(screen.getByText('Approved after review')).toBeInTheDocument();
    expect(screen.getByText('admin@example.com')).toBeInTheDocument();
  });

  it('handles empty application history', () => {
    vi.mocked(clubApprovalHooks.useApplicationHistory).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isError: false,
      isSuccess: true
    } as any);

    renderWithQueryClient(<ClubApplicationReview applicationId="club-123" onBack={mockOnBack} />);
    
    expect(screen.getByText('No history available')).toBeInTheDocument();
  });

  it('shows loading state for pending actions', () => {
    vi.mocked(clubApprovalHooks.useApproveApplication).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: true,
      isError: false,
      error: null
    } as any);

    renderWithQueryClient(<ClubApplicationReview applicationId="club-123" onBack={mockOnBack} />);
    
    const approveButton = screen.getByRole('button', { name: /approve application/i });
    expect(approveButton).toBeDisabled();
  });

  it('handles application fetch errors', () => {
    vi.mocked(clubApprovalHooks.useClubApplication).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch application'),
      refetch: vi.fn(),
      isError: true,
      isSuccess: false
    } as any);

    renderWithQueryClient(<ClubApplicationReview applicationId="club-123" onBack={mockOnBack} />);
    
    expect(screen.getByText('Error loading application details')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('displays contact information with action links', () => {
    renderWithQueryClient(<ClubApplicationReview applicationId="club-123" onBack={mockOnBack} />);
    
    const emailLink = screen.getByRole('link', { name: /test@football.com/i });
    expect(emailLink).toHaveAttribute('href', 'mailto:test@football.com');
    
    const phoneLink = screen.getByRole('link', { name: /123-456-7890/i });
    expect(phoneLink).toHaveAttribute('href', 'tel:123-456-7890');
  });

  it('shows application submission date', () => {
    renderWithQueryClient(<ClubApplicationReview applicationId="club-123" onBack={mockOnBack} />);
    
    expect(screen.getByText('Submitted:')).toBeInTheDocument();
    expect(screen.getByText('2024-01-15 10:00')).toBeInTheDocument();
  });

  it('handles sport types display correctly', () => {
    const multiSportApplication = {
      ...mockClubApplication,
      club: {
        ...mockClubApplication.club,
        sport_types: ['football', 'rugby', 'cricket']
      }
    };

    vi.mocked(clubApprovalHooks.useClubApplication).mockReturnValue({
      data: multiSportApplication,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isError: false,
      isSuccess: true
    } as any);

    renderWithQueryClient(<ClubApplicationReview applicationId="club-123" onBack={mockOnBack} />);
    
    expect(screen.getByText('Football')).toBeInTheDocument();
    expect(screen.getByText('Rugby')).toBeInTheDocument();
    expect(screen.getByText('Cricket')).toBeInTheDocument();
  });
});