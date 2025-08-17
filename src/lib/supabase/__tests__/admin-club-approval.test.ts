/**
 * Admin Club Approval Service Tests
 * Tests for club approval management functions
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

// Mock the supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
          order: vi.fn(() => ({
            range: vi.fn()
          }))
        })),
        or: vi.fn(() => ({
          gte: vi.fn(() => ({
            lte: vi.fn(() => ({
              range: vi.fn(() => ({
                order: vi.fn()
              }))
            }))
          }))
        })),
        range: vi.fn(() => ({
          order: vi.fn()
        })),
        order: vi.fn()
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn()
          }))
        }))
      }))
    })),
    auth: {
      getUser: vi.fn()
    },
    rpc: vi.fn()
  }
}));

// Mock error handler
vi.mock('@/lib/react-query-error-handler', () => ({
  handleSupabaseError: vi.fn((error) => ({ message: error.message || 'Test error' }))
}));

// Mock sanitization
vi.mock('@/lib/sanitization', () => ({
  sanitizeObject: vi.fn((obj) => obj)
}));

describe('Admin Club Approval Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPendingClubApplications', () => {
    it('should return pending applications with default filters', async () => {
      const mockClubs = [
        { id: '1', name: 'Test Club 1', application_status: 'pending' },
        { id: '2', name: 'Test Club 2', application_status: 'pending' }
      ];

      const { supabase } = await import('@/integrations/supabase/client');
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ 
          data: mockClubs, 
          error: null, 
          count: 2 
        })
      };
      
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery)
      });

      const result = await getPendingClubApplications();

      expect(result.success).toBe(true);
      expect(result.data?.data).toEqual(mockClubs);
      expect(supabase.from).toHaveBeenCalledWith('clubs');
    });

    it('should apply search filter correctly', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ 
          data: [], 
          error: null, 
          count: 0 
        })
      };
      
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery)
      });

      await getPendingClubApplications({ search: 'test club' });

      expect(mockQuery.or).toHaveBeenCalledWith(
        'name.ilike.%test club%,contact_email.ilike.%test club%,description.ilike.%test club%'
      );
    });
  });

  describe('approveClubApplication', () => {
    it('should approve club application successfully', async () => {
      const mockUser = { id: 'admin-123' };
      const mockClub = { 
        id: 'club-123', 
        name: 'Test Club', 
        application_status: 'approved' 
      };

      const { supabase } = await import('@/integrations/supabase/client');
      (supabase.auth.getUser as any).mockResolvedValue({ 
        data: { user: mockUser }, 
        error: null 
      });
      (supabase.rpc as any).mockResolvedValue({ 
        data: true, 
        error: null 
      });
      (supabase.from as any).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ 
                data: mockClub, 
                error: null 
              })
            })
          })
        })
      });

      const result = await approveClubApplication('club-123', 'Approved by admin');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockClub);
      expect(supabase.rpc).toHaveBeenCalledWith('is_admin', { user_id: 'admin-123' });
    });

    it('should fail if user is not admin', async () => {
      const mockUser = { id: 'user-123' };

      const { supabase } = await import('@/integrations/supabase/client');
      (supabase.auth.getUser as any).mockResolvedValue({ 
        data: { user: mockUser }, 
        error: null 
      });
      (supabase.rpc as any).mockResolvedValue({ 
        data: false, 
        error: null 
      });

      const result = await approveClubApplication('club-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Admin privileges required');
    });
  });

  describe('rejectClubApplication', () => {
    it('should reject club application with reason', async () => {
      const mockUser = { id: 'admin-123' };
      const mockClub = { 
        id: 'club-123', 
        name: 'Test Club', 
        application_status: 'rejected' 
      };

      const { supabase } = await import('@/integrations/supabase/client');
      (supabase.auth.getUser as any).mockResolvedValue({ 
        data: { user: mockUser }, 
        error: null 
      });
      (supabase.rpc as any).mockResolvedValue({ 
        data: true, 
        error: null 
      });
      (supabase.from as any).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ 
                data: mockClub, 
                error: null 
              })
            })
          })
        })
      });

      const result = await rejectClubApplication('club-123', 'Missing required documents');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockClub);
    });

    it('should fail if rejection reason is empty', async () => {
      const result = await rejectClubApplication('club-123', '');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Rejection reason is required');
    });
  });

  describe('getApplicationHistory', () => {
    it('should return application history', async () => {
      const mockHistory = [
        {
          id: 'history-1',
          club_id: 'club-123',
          admin_id: 'admin-123',
          action: 'approved',
          notes: 'Approved by admin',
          created_at: '2024-01-01T00:00:00Z',
          admin_roles: { email: 'admin@example.com' }
        }
      ];

      const { supabase } = await import('@/integrations/supabase/client');
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ 
              data: mockHistory, 
              error: null 
            })
          })
        })
      });

      const result = await getApplicationHistory('club-123');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].admin_email).toBe('admin@example.com');
    });
  });
});