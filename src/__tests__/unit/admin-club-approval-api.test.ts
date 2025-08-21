/**
 * Unit Tests for Admin Club Approval API Service Functions
 * Comprehensive tests for all API service functions with mock data
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  getPendingClubApplications,
  getClubApplicationById,
  approveClubApplication,
  rejectClubApplication,
  getApplicationHistory,
  bulkApproveApplications,
  getClubApplicationStats
} from '@/lib/supabase/admin-club-approval';
import type { Club, ClubApplicationReview, ClubApplicationHistory, PaginatedResponse } from '@/types';

// Mock fetch for API requests
global.fetch = vi.fn();

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(() => 'mock-token'),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Mock sanitization
vi.mock('@/lib/sanitization', () => ({
  sanitizeObject: vi.fn((obj) => obj)
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

describe('Admin Club Approval API Service Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPendingClubApplications', () => {
    it('should fetch pending applications with default parameters', async () => {
      const mockResponse: PaginatedResponse<Club> = {
        data: [mockClub],
        count: 1,
        page: 1,
        limit: 10,
        total_pages: 1
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await getPendingClubApplications();

      expect(result.success).toBe(true);
      expect(result.data?.data).toHaveLength(1);
      expect(result.data?.data[0]).toEqual(mockClub);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/club-applications?'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token'
          })
        })
      );
    });

    it('should apply search filter correctly', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [], count: 0, page: 1, limit: 10, total_pages: 0 })
      });

      await getPendingClubApplications({ search: 'football' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('search=football'),
        expect.any(Object)
      );
    });

    it('should apply status filter correctly', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [], count: 0, page: 1, limit: 10, total_pages: 0 })
      });

      await getPendingClubApplications({ status: 'approved' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('status=approved'),
        expect.any(Object)
      );
    });

    it('should apply pagination parameters correctly', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [], count: 0, page: 2, limit: 20, total_pages: 1 })
      });

      await getPendingClubApplications({ limit: 20, offset: 20 });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=20'),
        expect.any(Object)
      );
    });

    it('should handle API errors gracefully', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Network error' })
      });

      const result = await getPendingClubApplications();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('getClubApplicationById', () => {
    it('should fetch application details by ID', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockApplicationReview)
      });

      const result = await getClubApplicationById('club-123');

      expect(result.success).toBe(true);
      expect(result.data?.club).toEqual(mockClub);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/club-applications/club-123'),
        expect.any(Object)
      );
    });

    it('should handle not found errors', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Application not found' })
      });

      const result = await getClubApplicationById('nonexistent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Application not found');
    });
  });

  describe('approveClubApplication', () => {
    it('should approve application successfully', async () => {
      const approvedClub = { ...mockClub, application_status: 'approved' as const };
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(approvedClub)
      });

      const result = await approveClubApplication('club-123', 'Approved by admin');

      expect(result.success).toBe(true);
      expect(result.data?.application_status).toBe('approved');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/club-applications/club-123/approve'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ adminNotes: 'Approved by admin' })
        })
      );
    });

    it('should handle approval without notes', async () => {
      const approvedClub = { ...mockClub, application_status: 'approved' as const };
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(approvedClub)
      });

      const result = await approveClubApplication('club-123');

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/club-applications/club-123/approve'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ adminNotes: undefined })
        })
      );
    });

    it('should sanitize admin notes', async () => {
      const { sanitizeObject } = await import('@/lib/sanitization');
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockClub)
      });

      await approveClubApplication('club-123', '<script>alert("xss")</script>');

      expect(sanitizeObject).toHaveBeenCalledWith({ notes: '<script>alert("xss")</script>' });
    });
  });

  describe('rejectClubApplication', () => {
    it('should reject application with reason', async () => {
      const rejectedClub = { ...mockClub, application_status: 'rejected' as const };
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(rejectedClub)
      });

      const result = await rejectClubApplication('club-123', 'Missing required documents');

      expect(result.success).toBe(true);
      expect(result.data?.application_status).toBe('rejected');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/club-applications/club-123/reject'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ rejectionReason: 'Missing required documents' })
        })
      );
    });

    it('should fail if rejection reason is empty', async () => {
      const result = await rejectClubApplication('club-123', '');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Rejection reason is required');
    });

    it('should fail if rejection reason is only whitespace', async () => {
      const result = await rejectClubApplication('club-123', '   ');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Rejection reason is required');
    });

    it('should sanitize rejection reason', async () => {
      const { sanitizeObject } = await import('@/lib/sanitization');
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockClub)
      });

      await rejectClubApplication('club-123', '<script>alert("xss")</script>');

      expect(sanitizeObject).toHaveBeenCalledWith({ reason: '<script>alert("xss")</script>' });
    });
  });

  describe('getApplicationHistory', () => {
    it('should fetch application history', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockHistory)
      });

      const result = await getApplicationHistory('club-123');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].action).toBe('approved');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/club-applications/club-123/history'),
        expect.any(Object)
      );
    });

    it('should handle empty history', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([])
      });

      const result = await getApplicationHistory('club-123');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });
  });

  describe('bulkApproveApplications', () => {
    it('should approve multiple applications', async () => {
      const mockBulkResult = {
        successful: ['club-1', 'club-2'],
        failed: []
      };
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockBulkResult)
      });

      const result = await bulkApproveApplications(['club-1', 'club-2'], 'Bulk approval');

      expect(result.success).toBe(true);
      expect(result.data?.successful).toHaveLength(2);
      expect(result.data?.failed).toHaveLength(0);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/club-applications/bulk-approve'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ clubIds: ['club-1', 'club-2'], adminNotes: 'Bulk approval' })
        })
      );
    });

    it('should handle partial failures', async () => {
      const mockBulkResult = {
        successful: ['club-1'],
        failed: [{ id: 'club-2', error: 'Already processed' }]
      };
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockBulkResult)
      });

      const result = await bulkApproveApplications(['club-1', 'club-2']);

      expect(result.success).toBe(true);
      expect(result.data?.successful).toHaveLength(1);
      expect(result.data?.failed).toHaveLength(1);
    });

    it('should fail if no club IDs provided', async () => {
      const result = await bulkApproveApplications([]);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No club IDs provided');
    });
  });

  describe('getClubApplicationStats', () => {
    it('should fetch application statistics', async () => {
      const mockStats = {
        pending: 5,
        approved: 10,
        rejected: 2,
        total: 17
      };
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockStats)
      });

      const result = await getClubApplicationStats();

      expect(result.success).toBe(true);
      expect(result.data?.pending).toBe(5);
      expect(result.data?.approved).toBe(10);
      expect(result.data?.rejected).toBe(2);
      expect(result.data?.total).toBe(17);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/club-applications/stats'),
        expect.any(Object)
      );
    });

    it('should handle stats fetch errors', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Stats unavailable' })
      });

      const result = await getClubApplicationStats();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Stats unavailable');
    });
  });
});