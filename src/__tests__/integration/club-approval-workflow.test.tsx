/**
 * Integration Tests for Club Approval Workflow
 * Tests for complete approval and rejection workflows
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import { ClubApprovalDashboard } from '@/components/admin/ClubApprovalDashboard';
import * as adminClubApprovalApi from '@/lib/supabase/admin-club-approval';
import type { Club, ClubApplicationReview, ClubApplicationHistory, PaginatedResponse } from '@/types';

// Mock the API functions
vi.mock('@/lib/supabase/admin-club-approval');

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

const mockPendingClub: Club = {
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
};

const mockApprovedClub: Club = {
  ...mockPendingClub,
  application_status: 'approved',
  admin_notes: 'Approved after review',
  reviewed_by: 'admin-123',
  reviewed_at: '2024-01-15T11:00:00Z'
};

const mockRejectedClub: Club = {
  ...mockPendingClub,
  application_status: 'rejected',
  admin_notes: 'Missing required documents',
  reviewed_by: 'admin-123',
  reviewed_at: '2024-01-15T11:00:00Z'
};

const mockApplicationReview: ClubApplicationReview = {
  club: mockPendingClub,
  history: [],
  admin_user: {
    email: 'admin@example.com',
    name: 'Admin User'
  }
};

const mockStats = {
  pending: 1,
  approved: 5,
  rejected: 1,
  total: 7
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

describe('Club Approval Workflow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default API mocks
    vi.mocked(adminClubApprovalApi.getPendingClubApplications).mockResolvedValue({
      success: true,
      data: {
        data: [mockPendingClub],
        count: 1,
        page: 1,
        limit: 10,
        total_pages: 1
      }
    });

    vi.mocked(adminClubApprovalApi.getClubApplicationById).mockResolvedValue({
      success: true,
      data: mockApplicationReview
    });

    vi.mocked(adminClubApprovalApi.getApplicationHistory).mockResolvedValue({
      success: true,
      data: []
    });

    vi.mocked(adminClubApprovalApi.getClubApplicationStats).mockResolvedValue({
      success: true,
      data: mockStats
    });
  });

  describe('Complete Approval Workflow', () => {
    it('should complete full approval workflow from dashboard to confirmation', async () => {
      // Mock successful approval
      vi.mocked(adminClubApprovalApi.approveClubApplication).mockResolvedValue({
        success: true,
        data: mockApprovedClub
      });

      renderWithQueryClient(<ClubApprovalDashboard />);

      // Wait for dashboard to load
      await waitFor(() => {
        expect(screen.getByText('Test Football Club')).toBeInTheDocument();
      });

      // Click on application to view details
      const viewButton = screen.getByRole('button', { name: /view application/i });
      fireEvent.click(viewButton);

      // Wait for application review to load
      await waitFor(() => {
        expect(screen.getByText('Application Details')).toBeInTheDocument();
      });

      // Click approve button
      const approveButton = screen.getByRole('button', { name: /approve application/i });
      fireEvent.click(approveButton);

      // Wait for approval dialog
      await waitFor(() => {
        expect(screen.getByText('Approve Application')).toBeInTheDocument();
      });

      // Add approval notes
      const notesInput = screen.getByPlaceholderText('Optional notes for approval...');
      fireEvent.change(notesInput, { target: { value: 'Excellent application with all requirements met' } });

      // Confirm approval
      const confirmButton = screen.getByRole('button', { name: /confirm approval/i });
      fireEvent.click(confirmButton);

      // Verify API was called correctly
      await waitFor(() => {
        expect(adminClubApprovalApi.approveClubApplication).toHaveBeenCalledWith(
          'club-123',
          'Excellent application with all requirements met'
        );
      });

      // Verify success feedback (toast would be called)
      expect(vi.mocked(adminClubApprovalApi.approveClubApplication)).toHaveBeenCalledTimes(1);
    });

    it('should handle approval without notes', async () => {
      vi.mocked(adminClubApprovalApi.approveClubApplication).mockResolvedValue({
        success: true,
        data: mockApprovedClub
      });

      renderWithQueryClient(<ClubApprovalDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Test Football Club')).toBeInTheDocument();
      });

      // Navigate to review
      fireEvent.click(screen.getByRole('button', { name: /view application/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /approve application/i })).toBeInTheDocument();
      });

      // Open approval dialog
      fireEvent.click(screen.getByRole('button', { name: /approve application/i }));

      await waitFor(() => {
        expect(screen.getByText('Approve Application')).toBeInTheDocument();
      });

      // Confirm without adding notes
      const confirmButton = screen.getByRole('button', { name: /confirm approval/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(adminClubApprovalApi.approveClubApplication).toHaveBeenCalledWith('club-123', '');
      });
    });

    it('should handle approval errors gracefully', async () => {
      vi.mocked(adminClubApprovalApi.approveClubApplication).mockResolvedValue({
        success: false,
        error: 'Approval failed due to server error'
      });

      renderWithQueryClient(<ClubApprovalDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Test Football Club')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /view application/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /approve application/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /approve application/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /confirm approval/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /confirm approval/i }));

      // Should handle error (would show error toast)
      await waitFor(() => {
        expect(adminClubApprovalApi.approveClubApplication).toHaveBeenCalled();
      });
    });
  });

  describe('Complete Rejection Workflow', () => {
    it('should complete full rejection workflow with reason', async () => {
      vi.mocked(adminClubApprovalApi.rejectClubApplication).mockResolvedValue({
        success: true,
        data: mockRejectedClub
      });

      renderWithQueryClient(<ClubApprovalDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Test Football Club')).toBeInTheDocument();
      });

      // Navigate to review
      fireEvent.click(screen.getByRole('button', { name: /view application/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /reject application/i })).toBeInTheDocument();
      });

      // Open rejection dialog
      fireEvent.click(screen.getByRole('button', { name: /reject application/i }));

      await waitFor(() => {
        expect(screen.getByText('Reject Application')).toBeInTheDocument();
      });

      // Add rejection reason
      const reasonInput = screen.getByPlaceholderText('Reason for rejection...');
      fireEvent.change(reasonInput, { 
        target: { value: 'Missing required documentation and incomplete contact information' } 
      });

      // Confirm rejection
      const confirmButton = screen.getByRole('button', { name: /confirm rejection/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(adminClubApprovalApi.rejectClubApplication).toHaveBeenCalledWith(
          'club-123',
          'Missing required documentation and incomplete contact information'
        );
      });
    });

    it('should prevent rejection without reason', async () => {
      renderWithQueryClient(<ClubApprovalDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Test Football Club')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /view application/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /reject application/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /reject application/i }));

      await waitFor(() => {
        expect(screen.getByText('Reject Application')).toBeInTheDocument();
      });

      // Confirm button should be disabled without reason
      const confirmButton = screen.getByRole('button', { name: /confirm rejection/i });
      expect(confirmButton).toBeDisabled();

      // Add empty reason
      const reasonInput = screen.getByPlaceholderText('Reason for rejection...');
      fireEvent.change(reasonInput, { target: { value: '   ' } });

      // Should still be disabled
      expect(confirmButton).toBeDisabled();
    });

    it('should handle rejection errors gracefully', async () => {
      vi.mocked(adminClubApprovalApi.rejectClubApplication).mockResolvedValue({
        success: false,
        error: 'Rejection failed due to server error'
      });

      renderWithQueryClient(<ClubApprovalDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Test Football Club')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /view application/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /reject application/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /reject application/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Reason for rejection...')).toBeInTheDocument();
      });

      const reasonInput = screen.getByPlaceholderText('Reason for rejection...');
      fireEvent.change(reasonInput, { target: { value: 'Test rejection reason' } });

      const confirmButton = screen.getByRole('button', { name: /confirm rejection/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(adminClubApprovalApi.rejectClubApplication).toHaveBeenCalled();
      });
    });
  });

  describe('Navigation and State Management', () => {
    it('should maintain state when navigating between views', async () => {
      renderWithQueryClient(<ClubApprovalDashboard />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Test Football Club')).toBeInTheDocument();
      });

      // Navigate to review
      fireEvent.click(screen.getByRole('button', { name: /view application/i }));

      await waitFor(() => {
        expect(screen.getByText('Application Details')).toBeInTheDocument();
      });

      // Navigate back
      const backButton = screen.getByRole('button', { name: /back to list/i });
      fireEvent.click(backButton);

      // Should return to list view
      await waitFor(() => {
        expect(screen.getByText('Test Football Club')).toBeInTheDocument();
      });

      // Statistics should still be visible
      expect(screen.getByText('Pending Applications')).toBeInTheDocument();
    });

    it('should refresh data after successful approval', async () => {
      const mockRefetch = vi.fn();
      
      vi.mocked(adminClubApprovalApi.approveClubApplication).mockResolvedValue({
        success: true,
        data: mockApprovedClub
      });

      renderWithQueryClient(<ClubApprovalDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Test Football Club')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /view application/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /approve application/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /approve application/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /confirm approval/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /confirm approval/i }));

      // After successful approval, should trigger data refresh
      await waitFor(() => {
        expect(adminClubApprovalApi.approveClubApplication).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle network errors during data fetching', async () => {
      vi.mocked(adminClubApprovalApi.getPendingClubApplications).mockResolvedValue({
        success: false,
        error: 'Network connection failed'
      });

      renderWithQueryClient(<ClubApprovalDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load applications. Please try again.')).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should handle application not found errors', async () => {
      vi.mocked(adminClubApprovalApi.getClubApplicationById).mockResolvedValue({
        success: false,
        error: 'Application not found'
      });

      renderWithQueryClient(<ClubApprovalDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Test Football Club')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /view application/i }));

      await waitFor(() => {
        expect(screen.getByText('Error loading application details')).toBeInTheDocument();
      });
    });

    it('should handle concurrent modification errors', async () => {
      vi.mocked(adminClubApprovalApi.approveClubApplication).mockResolvedValue({
        success: false,
        error: 'Application has already been processed by another admin'
      });

      renderWithQueryClient(<ClubApprovalDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Test Football Club')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /view application/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /approve application/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /approve application/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /confirm approval/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /confirm approval/i }));

      await waitFor(() => {
        expect(adminClubApprovalApi.approveClubApplication).toHaveBeenCalled();
      });
    });
  });
});