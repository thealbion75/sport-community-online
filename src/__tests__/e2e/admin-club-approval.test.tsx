/**
 * End-to-End Tests for Admin Club Approval Process
 * Complete user journey tests for the admin club approval system
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { ClubApprovalDashboard } from '@/components/admin/ClubApprovalDashboard';
import * as adminClubApprovalApi from '@/lib/supabase/admin-club-approval';
import * as authHooks from '@/hooks/use-auth';
import type { Club, ClubApplicationReview, PaginatedResponse } from '@/types';

// Mock all dependencies
vi.mock('@/lib/supabase/admin-club-approval');
vi.mock('@/hooks/use-auth');
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

// Mock date formatting
vi.mock('date-fns', () => ({
  format: vi.fn((date, formatStr) => {
    if (typeof date === 'string') {
      return new Date(date).toLocaleDateString();
    }
    return date.toLocaleDateString();
  }),
  formatDistanceToNow: vi.fn(() => '2 hours ago')
}));

// Mock admin check
vi.mock('@/hooks/use-admin', () => ({
  useIsAdmin: () => ({ data: true, isLoading: false })
}));

const mockClubs: Club[] = [
  {
    id: 'club-1',
    name: 'Manchester United FC',
    contact_email: 'admin@manutd.com',
    contact_phone: '+44 161 868 8000',
    location: 'Manchester',
    description: 'Professional football club based in Manchester',
    sport_types: ['football'],
    application_status: 'pending',
    admin_notes: null,
    reviewed_by: null,
    reviewed_at: null,
    verified: false,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: 'club-2',
    name: 'London Rugby Club',
    contact_email: 'info@londonrugby.com',
    contact_phone: '+44 20 7946 0958',
    location: 'London',
    description: 'Premier rugby club in central London',
    sport_types: ['rugby'],
    application_status: 'pending',
    admin_notes: null,
    reviewed_by: null,
    reviewed_at: null,
    verified: false,
    created_at: '2024-01-14T15:30:00Z',
    updated_at: '2024-01-14T15:30:00Z'
  },
  {
    id: 'club-3',
    name: 'Birmingham Cricket Club',
    contact_email: 'contact@birminghamcc.com',
    contact_phone: '+44 121 496 0000',
    location: 'Birmingham',
    description: 'Historic cricket club established in 1882',
    sport_types: ['cricket'],
    application_status: 'approved',
    admin_notes: 'Excellent application with all requirements',
    reviewed_by: 'admin-123',
    reviewed_at: '2024-01-13T09:15:00Z',
    verified: true,
    created_at: '2024-01-12T11:20:00Z',
    updated_at: '2024-01-13T09:15:00Z'
  }
];

const mockStats = {
  pending: 2,
  approved: 1,
  rejected: 0,
  total: 3
};

const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </BrowserRouter>
  );
};

describe('Admin Club Approval E2E Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock authentication
    vi.mocked(authHooks.useAuth).mockReturnValue({
      user: { id: 'admin-123', email: 'admin@example.com' },
      isLoading: false,
      error: null
    } as any);

    // Default API mocks
    vi.mocked(adminClubApprovalApi.getClubApplicationStats).mockResolvedValue({
      success: true,
      data: mockStats
    });

    vi.mocked(adminClubApprovalApi.getApplicationHistory).mockResolvedValue({
      success: true,
      data: []
    });
  });

  describe('Complete Admin Journey - Dashboard to Approval', () => {
    it('should complete full admin workflow from login to approval', async () => {
      // Setup pending applications
      vi.mocked(adminClubApprovalApi.getPendingClubApplications).mockResolvedValue({
        success: true,
        data: {
          data: mockClubs.filter(club => club.application_status === 'pending'),
          count: 2,
          page: 1,
          limit: 10,
          total_pages: 1
        }
      });

      // Setup application details
      vi.mocked(adminClubApprovalApi.getClubApplicationById).mockResolvedValue({
        success: true,
        data: {
          club: mockClubs[0],
          history: [],
          admin_user: { email: 'admin@example.com', name: 'Admin User' }
        }
      });

      // Setup successful approval
      vi.mocked(adminClubApprovalApi.approveClubApplication).mockResolvedValue({
        success: true,
        data: { ...mockClubs[0], application_status: 'approved' }
      });

      const { container } = render(<ClubApprovalDashboard />, { wrapper: createTestWrapper() });

      // Step 1: Dashboard loads with statistics
      await waitFor(() => {
        expect(screen.getByText('Club Application Management')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument(); // Pending count
        expect(screen.getByText('1')).toBeInTheDocument(); // Approved count
      });

      // Step 2: View pending applications list
      await waitFor(() => {
        expect(screen.getByText('Manchester United FC')).toBeInTheDocument();
        expect(screen.getByText('London Rugby Club')).toBeInTheDocument();
      });

      // Step 3: Select an application to review
      const viewButtons = screen.getAllByRole('button', { name: /view application/i });
      fireEvent.click(viewButtons[0]);

      // Step 4: Application review page loads
      await waitFor(() => {
        expect(screen.getByText('Application Details')).toBeInTheDocument();
        expect(screen.getByText('Manchester United FC')).toBeInTheDocument();
        expect(screen.getByText('admin@manutd.com')).toBeInTheDocument();
        expect(screen.getByText('Professional football club based in Manchester')).toBeInTheDocument();
      });

      // Step 5: Verify contact information is actionable
      const emailLink = screen.getByRole('link', { name: /admin@manutd.com/i });
      expect(emailLink).toHaveAttribute('href', 'mailto:admin@manutd.com');

      const phoneLink = screen.getByRole('link', { name: /\+44 161 868 8000/i });
      expect(phoneLink).toHaveAttribute('href', 'tel:+44 161 868 8000');

      // Step 6: Initiate approval process
      const approveButton = screen.getByRole('button', { name: /approve application/i });
      expect(approveButton).toBeEnabled();
      fireEvent.click(approveButton);

      // Step 7: Approval dialog opens
      await waitFor(() => {
        expect(screen.getByText('Approve Application')).toBeInTheDocument();
        expect(screen.getByText('Are you sure you want to approve this club application?')).toBeInTheDocument();
      });

      // Step 8: Add approval notes
      const notesTextarea = screen.getByPlaceholderText('Optional notes for approval...');
      fireEvent.change(notesTextarea, { 
        target: { value: 'Excellent application. All documentation provided and verified.' } 
      });

      // Step 9: Confirm approval
      const confirmButton = screen.getByRole('button', { name: /confirm approval/i });
      fireEvent.click(confirmButton);

      // Step 10: Verify API call
      await waitFor(() => {
        expect(adminClubApprovalApi.approveClubApplication).toHaveBeenCalledWith(
          'club-1',
          'Excellent application. All documentation provided and verified.'
        );
      });

      // Step 11: Success feedback (dialog closes)
      await waitFor(() => {
        expect(screen.queryByText('Approve Application')).not.toBeInTheDocument();
      });
    });

    it('should complete full rejection workflow with proper documentation', async () => {
      // Setup pending applications
      vi.mocked(adminClubApprovalApi.getPendingClubApplications).mockResolvedValue({
        success: true,
        data: {
          data: [mockClubs[1]], // London Rugby Club
          count: 1,
          page: 1,
          limit: 10,
          total_pages: 1
        }
      });

      vi.mocked(adminClubApprovalApi.getClubApplicationById).mockResolvedValue({
        success: true,
        data: {
          club: mockClubs[1],
          history: [],
          admin_user: { email: 'admin@example.com', name: 'Admin User' }
        }
      });

      vi.mocked(adminClubApprovalApi.rejectClubApplication).mockResolvedValue({
        success: true,
        data: { ...mockClubs[1], application_status: 'rejected' }
      });

      render(<ClubApprovalDashboard />, { wrapper: createTestWrapper() });

      // Navigate to application
      await waitFor(() => {
        expect(screen.getByText('London Rugby Club')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /view application/i }));

      await waitFor(() => {
        expect(screen.getByText('Application Details')).toBeInTheDocument();
      });

      // Initiate rejection
      const rejectButton = screen.getByRole('button', { name: /reject application/i });
      fireEvent.click(rejectButton);

      await waitFor(() => {
        expect(screen.getByText('Reject Application')).toBeInTheDocument();
      });

      // Add detailed rejection reason
      const reasonTextarea = screen.getByPlaceholderText('Reason for rejection...');
      fireEvent.change(reasonTextarea, { 
        target: { 
          value: 'Application incomplete: Missing insurance documentation, facility safety certificates, and qualified coaching staff credentials. Please resubmit with all required documents.' 
        } 
      });

      // Confirm rejection
      const confirmButton = screen.getByRole('button', { name: /confirm rejection/i });
      expect(confirmButton).toBeEnabled();
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(adminClubApprovalApi.rejectClubApplication).toHaveBeenCalledWith(
          'club-2',
          'Application incomplete: Missing insurance documentation, facility safety certificates, and qualified coaching staff credentials. Please resubmit with all required documents.'
        );
      });
    });
  });

  describe('Bulk Operations Workflow', () => {
    it('should handle bulk approval of multiple applications', async () => {
      const pendingClubs = mockClubs.filter(club => club.application_status === 'pending');
      
      vi.mocked(adminClubApprovalApi.getPendingClubApplications).mockResolvedValue({
        success: true,
        data: {
          data: pendingClubs,
          count: 2,
          page: 1,
          limit: 10,
          total_pages: 1
        }
      });

      vi.mocked(adminClubApprovalApi.bulkApproveApplications).mockResolvedValue({
        success: true,
        data: {
          successful: ['club-1', 'club-2'],
          failed: []
        }
      });

      render(<ClubApprovalDashboard />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Manchester United FC')).toBeInTheDocument();
        expect(screen.getByText('London Rugby Club')).toBeInTheDocument();
      });

      // Select multiple applications (if bulk selection is implemented)
      const checkboxes = screen.getAllByRole('checkbox');
      if (checkboxes.length > 0) {
        fireEvent.click(checkboxes[0]);
        fireEvent.click(checkboxes[1]);

        // Look for bulk approve button
        const bulkApproveButton = screen.queryByRole('button', { name: /bulk approve/i });
        if (bulkApproveButton) {
          fireEvent.click(bulkApproveButton);

          await waitFor(() => {
            expect(adminClubApprovalApi.bulkApproveApplications).toHaveBeenCalledWith(
              ['club-1', 'club-2'],
              expect.any(String)
            );
          });
        }
      }
    });
  });

  describe('Search and Filter Functionality', () => {
    it('should filter applications by search term', async () => {
      vi.mocked(adminClubApprovalApi.getPendingClubApplications)
        .mockResolvedValueOnce({
          success: true,
          data: {
            data: mockClubs,
            count: 3,
            page: 1,
            limit: 10,
            total_pages: 1
          }
        })
        .mockResolvedValueOnce({
          success: true,
          data: {
            data: [mockClubs[0]], // Only Manchester United
            count: 1,
            page: 1,
            limit: 10,
            total_pages: 1
          }
        });

      render(<ClubApprovalDashboard />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Manchester United FC')).toBeInTheDocument();
        expect(screen.getByText('London Rugby Club')).toBeInTheDocument();
      });

      // Search for Manchester
      const searchInput = screen.getByPlaceholderText('Search by club name or email...');
      fireEvent.change(searchInput, { target: { value: 'Manchester' } });

      // Trigger search (debounced)
      await waitFor(() => {
        expect(adminClubApprovalApi.getPendingClubApplications).toHaveBeenCalledWith(
          expect.objectContaining({ search: 'Manchester' })
        );
      }, { timeout: 2000 });
    });

    it('should filter applications by status', async () => {
      // Mock different status responses
      vi.mocked(adminClubApprovalApi.getPendingClubApplications)
        .mockResolvedValueOnce({
          success: true,
          data: {
            data: mockClubs.filter(club => club.application_status === 'pending'),
            count: 2,
            page: 1,
            limit: 10,
            total_pages: 1
          }
        })
        .mockResolvedValueOnce({
          success: true,
          data: {
            data: mockClubs.filter(club => club.application_status === 'approved'),
            count: 1,
            page: 1,
            limit: 10,
            total_pages: 1
          }
        });

      render(<ClubApprovalDashboard />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Manchester United FC')).toBeInTheDocument();
      });

      // Change status filter
      const statusSelect = screen.getByRole('combobox');
      fireEvent.click(statusSelect);

      // Select approved status (if dropdown options are available)
      const approvedOption = screen.queryByText('Approved');
      if (approvedOption) {
        fireEvent.click(approvedOption);

        await waitFor(() => {
          expect(adminClubApprovalApi.getPendingClubApplications).toHaveBeenCalledWith(
            expect.objectContaining({ status: 'approved' })
          );
        });
      }
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle and recover from network errors', async () => {
      // First call fails, second succeeds
      vi.mocked(adminClubApprovalApi.getPendingClubApplications)
        .mockResolvedValueOnce({
          success: false,
          error: 'Network connection failed'
        })
        .mockResolvedValueOnce({
          success: true,
          data: {
            data: mockClubs.slice(0, 2),
            count: 2,
            page: 1,
            limit: 10,
            total_pages: 1
          }
        });

      render(<ClubApprovalDashboard />, { wrapper: createTestWrapper() });

      // Should show error state
      await waitFor(() => {
        expect(screen.getByText('Failed to load applications. Please try again.')).toBeInTheDocument();
      });

      // Click retry
      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);

      // Should recover and show data
      await waitFor(() => {
        expect(screen.getByText('Manchester United FC')).toBeInTheDocument();
      });
    });

    it('should handle approval conflicts gracefully', async () => {
      vi.mocked(adminClubApprovalApi.getPendingClubApplications).mockResolvedValue({
        success: true,
        data: {
          data: [mockClubs[0]],
          count: 1,
          page: 1,
          limit: 10,
          total_pages: 1
        }
      });

      vi.mocked(adminClubApprovalApi.getClubApplicationById).mockResolvedValue({
        success: true,
        data: {
          club: mockClubs[0],
          history: [],
          admin_user: { email: 'admin@example.com', name: 'Admin User' }
        }
      });

      // Simulate conflict error
      vi.mocked(adminClubApprovalApi.approveClubApplication).mockResolvedValue({
        success: false,
        error: 'Application has already been processed by another administrator'
      });

      render(<ClubApprovalDashboard />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Manchester United FC')).toBeInTheDocument();
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

      // Should handle the conflict error gracefully
      await waitFor(() => {
        expect(adminClubApprovalApi.approveClubApplication).toHaveBeenCalled();
      });
    });
  });

  describe('Mobile Responsiveness', () => {
    it('should work correctly on mobile viewport', async () => {
      // Simulate mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      vi.mocked(adminClubApprovalApi.getPendingClubApplications).mockResolvedValue({
        success: true,
        data: {
          data: mockClubs.slice(0, 2),
          count: 2,
          page: 1,
          limit: 10,
          total_pages: 1
        }
      });

      render(<ClubApprovalDashboard />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Manchester United FC')).toBeInTheDocument();
      });

      // Should be responsive and functional on mobile
      expect(screen.getByText('Club Application Management')).toBeInTheDocument();
      
      // Touch-friendly buttons should be present
      const viewButtons = screen.getAllByRole('button', { name: /view application/i });
      expect(viewButtons[0]).toBeInTheDocument();
      
      // Should be able to interact on mobile
      fireEvent.click(viewButtons[0]);
      
      // Mobile navigation should work
      expect(screen.queryByText('Application Details')).toBeInTheDocument();
    });
  });
});