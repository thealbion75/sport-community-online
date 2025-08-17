/**
 * D1 Admin Club Approval Service Tests
 * Tests for club approval management functions using D1
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
} from '../admin-club-approval';

// Mock the D1 client
vi.mock('../client', () => ({
  executeQuery: vi.fn(),
  executeQueryFirst: vi.fn(),
  executeUpdate: vi.fn(),
  generateId: vi.fn(() => 'test-id-123'),
  parseJsonField: vi.fn((field) => field ? JSON.parse(field) : []),
  stringifyJsonField: vi.fn((array) => JSON.stringify(array || []))
}));

// Mock sanitization
vi.mock('@/lib/sanitization', () => ({
  sanitizeObject: vi.fn((obj) => obj)
}));

describe('D1 Admin Club Approval Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPendingClubApplications', () => {
    it('should return pending applications with default filters', async () => {
      const { executeQuery, executeQueryFirst } = await import('../client');
      
      // Mock count query
      (executeQueryFirst as any).mockResolvedValueOnce({ count: 2 });
      
      // Mock data query
      (executeQuery as any).mockResolvedValueOnce({
        results: [
          { 
            id: '1', 
            name: 'Test Club 1', 
            application_status: 'pending',
            sport_types: '["football"]',
            verified: 0,
            created_at: '2024-01-01T00:00:00Z'
          },
          { 
            id: '2', 
            name: 'Test Club 2', 
            application_status: 'pending',
            sport_types: '["basketball"]',
            verified: 0,
            created_at: '2024-01-02T00:00:00Z'
          }
        ]
      });

      const result = await getPendingClubApplications();

      expect(result.success).toBe(true);
      expect(result.data?.data).toHaveLength(2);
      expect(result.data?.data[0].name).toBe('Test Club 1');
      expect(result.data?.data[0].sport_types).toEqual(['football']);
      expect(result.data?.total_pages).toBe(1);
    });

    it('should apply search filter correctly', async () => {
      const { executeQuery, executeQueryFirst } = await import('../client');
      
      (executeQueryFirst as any).mockResolvedValueOnce({ count: 0 });
      (executeQuery as any).mockResolvedValueOnce({ results: [] });

      await getPendingClubApplications({ search: 'test club' });

      // Verify the search filter was applied in the query
      expect(executeQueryFirst).toHaveBeenCalledWith(
        expect.stringContaining('name LIKE'),
        expect.arrayContaining(['%test club%'])
      );
    });
  });

  describe('approveClubApplication', () => {
    it('should approve club application successfully', async () => {
      const { executeQueryFirst, executeUpdate } = await import('../client');
      
      // Mock admin check
      (executeQueryFirst as any)
        .mockResolvedValueOnce({ is_admin: true }) // Admin check
        .mockResolvedValueOnce({ // Club data after update
          id: 'club-123',
          name: 'Test Club',
          application_status: 'approved',
          sport_types: '["football"]',
          verified: 0
        });

      // Mock update
      (executeUpdate as any).mockResolvedValueOnce({ success: true });

      const result = await approveClubApplication('club-123', 'admin-123', 'Approved by admin');

      expect(result.success).toBe(true);
      expect(result.data?.application_status).toBe('approved');
      expect(executeUpdate).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE clubs'),
        expect.arrayContaining(['Approved by admin', 'admin-123', 'club-123'])
      );
    });

    it('should fail if user is not admin', async () => {
      const { executeQueryFirst } = await import('../client');
      
      // Mock admin check - user is not admin
      (executeQueryFirst as any).mockResolvedValueOnce({ is_admin: false });

      const result = await approveClubApplication('club-123', 'user-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Admin privileges required');
    });
  });

  describe('rejectClubApplication', () => {
    it('should reject club application with reason', async () => {
      const { executeQueryFirst, executeUpdate } = await import('../client');
      
      // Mock admin check
      (executeQueryFirst as any)
        .mockResolvedValueOnce({ is_admin: true }) // Admin check
        .mockResolvedValueOnce({ // Club data after update
          id: 'club-123',
          name: 'Test Club',
          application_status: 'rejected',
          sport_types: '["football"]',
          verified: 0
        });

      // Mock update
      (executeUpdate as any).mockResolvedValueOnce({ success: true });

      const result = await rejectClubApplication('club-123', 'admin-123', 'Missing required documents');

      expect(result.success).toBe(true);
      expect(result.data?.application_status).toBe('rejected');
    });

    it('should fail if rejection reason is empty', async () => {
      const result = await rejectClubApplication('club-123', 'admin-123', '');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Rejection reason is required');
    });
  });

  describe('getApplicationHistory', () => {
    it('should return application history', async () => {
      const { executeQuery } = await import('../client');
      
      (executeQuery as any).mockResolvedValueOnce({
        results: [
          {
            id: 'history-1',
            club_id: 'club-123',
            admin_id: 'admin-123',
            action: 'approved',
            notes: 'Approved by admin',
            created_at: '2024-01-01T00:00:00Z',
            admin_email: 'admin@example.com'
          }
        ]
      });

      const result = await getApplicationHistory('club-123');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].admin_email).toBe('admin@example.com');
      expect(result.data?.[0].action).toBe('approved');
    });
  });

  describe('getClubApplicationStats', () => {
    it('should return application statistics', async () => {
      const { executeQueryFirst } = await import('../client');
      
      (executeQueryFirst as any).mockResolvedValueOnce({
        pending: 5,
        approved: 10,
        rejected: 2,
        total: 17
      });

      const result = await getClubApplicationStats();

      expect(result.success).toBe(true);
      expect(result.data?.pending).toBe(5);
      expect(result.data?.approved).toBe(10);
      expect(result.data?.rejected).toBe(2);
      expect(result.data?.total).toBe(17);
    });
  });
});