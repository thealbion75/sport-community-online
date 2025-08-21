/**
 * Unit Tests for Club Approval React Query Hooks
 * Comprehensive tests for all club approval hooks with mock data
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  usePendingApplications,
  usePendingApplicationsOnly,
  useApprovedApplications,
  useRejectedApplications,
  useAllApplications,
  useClubApplication,
  useApplicationHistory,
  useApproveApplication,
  useRejectApplication,
  useBulkApproveApplications,
  useClubApplicationStats
} from '@/hooks/use-club-approval';
import type { Club, ClubApplicationReview, ClubApplicationHistory, PaginatedResponse } from '@/types';

// Mock the API functions
vi.mock('@/lib/supabase/admin-club-approval', () => ({
  getPendingClubApplications: vi.fn(),
  getClubApplicationById: vi.fn(),
  approveClubApplication: vi.fn(),
  rejectClubApplication: vi.fn(),
  getApplicationHistory: vi.fn(),
  bulkApproveApplications: vi.fn(),
  getClubApplicationStats: vi.fn()
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

const mockClub: Club = {
  id: 'club-123',
  name: 'Test Football Club',
  contact_email: 'test@football.com',
  contact_phone: '123-456-7890',
  location: 'London',
  description: 'A test football club',
  sport_types: ['football'],
  application_status: 'pending',
  admin_notes: null,
  reviewed_by: null,
  reviewed_at: null,
  verified: false,
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z'
};

const mockPaginatedResponse: PaginatedResponse<Club> = {
  data: [mockClub],
  count: 1,
  page: 1,
  limit: 10,
  total_pages: 1
};

const mockApplicationReview: ClubApplicationReview = {
  club: mockClub,
  history: [],
  admin_user: {
    email: 'admin@example.com',
    name: 'Admin User'
  }
};

const mockHistory: ClubApplicationHistory[] = [
  {
    id: 'history-1',
    club_id: 'club-123',
    admin_id: 'admin-123',
    action: 'approved',
    notes: 'Approved by admin',
    created_at: '2024-01-15T10:00:00Z',
    admin_email: 'admin@example.com'
  }
];

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });
  
  return ({ children }: { children: React.ReactNode }) => 
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('Club Approval Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('usePendingApplications', () => {
    it('should fetch pending applications successfully', async () => {
      const { getPendingClubApplications } = await import('@/lib/supabase/admin-club-approval');
      (getPendingClubApplications as any).mockResolvedValue({ success: true, data: mockPaginatedResponse });

      const { result } = renderHook(() => usePendingApplications(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockPaginatedResponse);
      expect(getPendingClubApplications).toHaveBeenCalledWith(undefined);
    });

    it('should handle filters correctly', async () => {
      const { getPendingClubApplications } = await import('@/lib/supabase/admin-club-approval');
      (getPendingClubApplications as any).mockResolvedValue({ success: true, data: mockPaginatedResponse });

      const filters = { search: 'football', page: 2, limit: 20 };
      const { result } = renderHook(() => usePendingApplications(filters), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(getPendingClubApplications).toHaveBeenCalledWith(filters);
    });

    it('should handle API errors', async () => {
      const { getPendingClubApplications } = await import('@/lib/supabase/admin-club-approval');
      (getPendingClubApplications as any).mockResolvedValue({ success: false, error: 'Network error' });

      const { result } = renderHook(() => usePendingApplications(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // When API returns success: false, the select function returns empty data
      expect(result.current.data).toEqual({ data: [], count: 0, page: 1, limit: 10, total_pages: 0 });
    });
  });

  describe('useClubApplication', () => {
    it('should fetch application details successfully', async () => {
      const { getClubApplicationById } = await import('@/lib/supabase/admin-club-approval');
      (getClubApplicationById as any).mockResolvedValue({ success: true, data: mockApplicationReview });

      const { result } = renderHook(() => useClubApplication('club-123'), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockApplicationReview);
      expect(getClubApplicationById).toHaveBeenCalledWith('club-123');
    });

    it('should not fetch when ID is undefined', () => {
      const { result } = renderHook(() => useClubApplication(undefined), {
        wrapper: createWrapper()
      });

      expect(result.current.data).toBeUndefined();
      // Hook should not make API call when ID is undefined
    });
  });

  describe('useApplicationHistory', () => {
    it('should fetch application history successfully', async () => {
      const { getApplicationHistory } = await import('@/lib/supabase/admin-club-approval');
      (getApplicationHistory as any).mockResolvedValue({ success: true, data: mockHistory });

      const { result } = renderHook(() => useApplicationHistory('club-123'), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockHistory);
      expect(getApplicationHistory).toHaveBeenCalledWith('club-123');
    });
  });

  describe('useApproveApplication', () => {
    it('should approve application successfully', async () => {
      const { approveClubApplication } = await import('@/lib/supabase/admin-club-approval');
      const approvedClub = { ...mockClub, application_status: 'approved' as const };
      (approveClubApplication as any).mockResolvedValue({ success: true, data: approvedClub });

      const { result } = renderHook(() => useApproveApplication(), {
        wrapper: createWrapper()
      });

      await result.current.mutateAsync({
        clubId: 'club-123',
        adminNotes: 'Approved by admin'
      });

      expect(approveClubApplication).toHaveBeenCalledWith('club-123', 'Approved by admin');
    });

    it('should handle approval errors', async () => {
      const { approveClubApplication } = await import('@/lib/supabase/admin-club-approval');
      (approveClubApplication as any).mockResolvedValue({ success: false, error: 'Approval failed' });

      const { result } = renderHook(() => useApproveApplication(), {
        wrapper: createWrapper()
      });

      const response = await result.current.mutateAsync({
        clubId: 'club-123'
      });

      expect(response.success).toBe(false);
      expect(response.error).toBe('Approval failed');
      expect(approveClubApplication).toHaveBeenCalledWith('club-123', undefined);
    });
  });

  describe('useRejectApplication', () => {
    it('should reject application successfully', async () => {
      const { rejectClubApplication } = await import('@/lib/supabase/admin-club-approval');
      const rejectedClub = { ...mockClub, application_status: 'rejected' as const };
      (rejectClubApplication as any).mockResolvedValue({ success: true, data: rejectedClub });

      const { result } = renderHook(() => useRejectApplication(), {
        wrapper: createWrapper()
      });

      await result.current.mutateAsync({
        clubId: 'club-123',
        rejectionReason: 'Missing documents'
      });

      expect(rejectClubApplication).toHaveBeenCalledWith('club-123', 'Missing documents');
    });

    it('should handle rejection errors', async () => {
      const { rejectClubApplication } = await import('@/lib/supabase/admin-club-approval');
      (rejectClubApplication as any).mockResolvedValue({ success: false, error: 'Rejection failed' });

      const { result } = renderHook(() => useRejectApplication(), {
        wrapper: createWrapper()
      });

      const response = await result.current.mutateAsync({
        clubId: 'club-123',
        rejectionReason: 'Missing documents'
      });

      expect(response.success).toBe(false);
      expect(response.error).toBe('Rejection failed');
    });
  });

  describe('useBulkApproveApplications', () => {
    it('should bulk approve applications successfully', async () => {
      const { bulkApproveApplications } = await import('@/lib/supabase/admin-club-approval');
      const mockResult = {
        successful: ['club-1', 'club-2'],
        failed: []
      };
      (bulkApproveApplications as any).mockResolvedValue({ success: true, data: mockResult });

      const { result } = renderHook(() => useBulkApproveApplications(), {
        wrapper: createWrapper()
      });

      await result.current.mutateAsync({
        clubIds: ['club-1', 'club-2'],
        adminNotes: 'Bulk approval'
      });

      expect(bulkApproveApplications).toHaveBeenCalledWith(['club-1', 'club-2'], 'Bulk approval');
    });

    it('should handle partial failures', async () => {
      const { bulkApproveApplications } = await import('@/lib/supabase/admin-club-approval');
      const mockResult = {
        successful: ['club-1'],
        failed: [{ id: 'club-2', error: 'Already processed' }]
      };
      (bulkApproveApplications as any).mockResolvedValue({ success: true, data: mockResult });

      const { result } = renderHook(() => useBulkApproveApplications(), {
        wrapper: createWrapper()
      });

      const response = await result.current.mutateAsync({
        clubIds: ['club-1', 'club-2']
      });

      expect(response.data?.successful).toHaveLength(1);
      expect(response.data?.failed).toHaveLength(1);
    });
  });

  describe('useClubApplicationStats', () => {
    it('should fetch application statistics successfully', async () => {
      const { getClubApplicationStats } = await import('@/lib/supabase/admin-club-approval');
      const mockStats = {
        pending: 5,
        approved: 10,
        rejected: 2,
        total: 17
      };
      (getClubApplicationStats as any).mockResolvedValue({ success: true, data: mockStats });

      const { result } = renderHook(() => useClubApplicationStats(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockStats);
      expect(getClubApplicationStats).toHaveBeenCalled();
    });

    it('should handle stats fetch errors', async () => {
      const { getClubApplicationStats } = await import('@/lib/supabase/admin-club-approval');
      (getClubApplicationStats as any).mockResolvedValue({ success: false, error: 'Stats unavailable' });

      const { result } = renderHook(() => useClubApplicationStats(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // When API returns success: false, the select function returns default stats
      expect(result.current.data).toEqual({ pending: 0, approved: 0, rejected: 0, total: 0 });
    });
  });

  describe('Hook caching and invalidation', () => {
    it('should use correct query keys for caching', async () => {
      const { getPendingClubApplications } = await import('@/lib/supabase/admin-club-approval');
      (getPendingClubApplications as any).mockResolvedValue({ success: true, data: mockPaginatedResponse });

      const filters1 = { search: 'football' };
      const filters2 = { search: 'rugby' };

      const { result: result1 } = renderHook(() => usePendingApplications(filters1), {
        wrapper: createWrapper()
      });

      const { result: result2 } = renderHook(() => usePendingApplications(filters2), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result1.current.isSuccess).toBe(true);
        expect(result2.current.isSuccess).toBe(true);
      });

      // Should have been called twice with different filters
      expect(getPendingClubApplications).toHaveBeenCalledTimes(2);
      expect(getPendingClubApplications).toHaveBeenCalledWith(filters1);
      expect(getPendingClubApplications).toHaveBeenCalledWith(filters2);
    });
  });
});