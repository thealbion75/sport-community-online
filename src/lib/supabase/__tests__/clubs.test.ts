/**
 * Unit tests for club data access functions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/integrations/supabase/client';
import { getVerifiedClubs, getClubById, registerClub } from '../clubs';
import type { Club, ClubRegistrationData } from '@/types';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            data: [],
            error: null
          })),
          single: vi.fn(() => ({
            data: null,
            error: null
          }))
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: null,
            error: null
          }))
        }))
      }))
    }))
  }
}));

describe('Club Data Access Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getVerifiedClubs', () => {
    it('should return verified clubs successfully', async () => {
      const mockClubs: Club[] = [
        {
          id: '1',
          name: 'Test Club',
          location: 'Test Location',
          contact_email: 'test@example.com',
          sport_types: ['Tennis'],
          verified: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01'
        }
      ];

      const mockQuery = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              data: mockClubs,
              error: null
            }))
          }))
        }))
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await getVerifiedClubs();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockClubs);
      expect(supabase.from).toHaveBeenCalledWith('clubs');
    });

    it('should handle database errors', async () => {
      const mockError = { message: 'Database error' };
      const mockQuery = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              data: null,
              error: mockError
            }))
          }))
        }))
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await getVerifiedClubs();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });

  describe('getClubById', () => {
    it('should return club by ID successfully', async () => {
      const mockClub: Club = {
        id: '1',
        name: 'Test Club',
        location: 'Test Location',
        contact_email: 'test@example.com',
        sport_types: ['Tennis'],
        verified: true,
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      };

      const mockQuery = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({
              data: mockClub,
              error: null
            }))
          }))
        }))
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await getClubById('1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockClub);
    });
  });

  describe('registerClub', () => {
    it('should register club successfully', async () => {
      const clubData: ClubRegistrationData = {
        name: 'New Club',
        location: 'New Location',
        contact_email: 'new@example.com',
        sport_types: ['Football']
      };

      const mockClub: Club = {
        id: '2',
        ...clubData,
        verified: false,
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      };

      const mockQuery = {
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: mockClub,
              error: null
            }))
          }))
        }))
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await registerClub(clubData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockClub);
    });
  });
});