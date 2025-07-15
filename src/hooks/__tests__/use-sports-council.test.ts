/**
 * @jest-environment jsdom
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import { usePublicMeetings, useIsSportsCouncilAdmin } from '../use-sports-council';
import type { SportsCouncilMeeting } from '@/types';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            data: [],
            error: null,
          })),
          single: vi.fn(() => ({
            data: null,
            error: { code: 'PGRST116' },
          })),
        })),
      })),
    })),
  },
}));

// Mock toast hook
vi.mock('../use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('use-sports-council hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('usePublicMeetings', () => {
    it('should fetch public meetings successfully', async () => {
      const mockMeetings: SportsCouncilMeeting[] = [
        {
          id: '1',
          title: 'Test Meeting',
          meeting_date: '2025-01-15',
          meeting_time: '19:00:00',
          location: 'Test Location',
          agenda: 'Test agenda',
          minutes: 'Test minutes',
          status: 'completed',
          is_public: true,
          created_at: '2024-12-01T10:00:00Z',
          updated_at: '2025-01-15T20:00:00Z',
        },
      ];

      const { supabase } = await import('@/integrations/supabase/client');
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              data: mockMeetings,
              error: null,
            })),
          })),
        })),
      } as any);

      const { result } = renderHook(() => usePublicMeetings(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockMeetings);
      expect(result.current.error).toBeNull();
    });

    it('should handle errors when fetching meetings', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              data: null,
              error: { message: 'Database error' },
            })),
          })),
        })),
      } as any);

      const { result } = renderHook(() => usePublicMeetings(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('useIsSportsCouncilAdmin', () => {
    it('should return false for non-admin users', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({
              data: null,
              error: { code: 'PGRST116' },
            })),
          })),
        })),
      } as any);

      const { result } = renderHook(() => useIsSportsCouncilAdmin('test@example.com'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBe(false);
    });

    it('should return true for admin users', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({
              data: { id: 'admin-id' },
              error: null,
            })),
          })),
        })),
      } as any);

      const { result } = renderHook(() => useIsSportsCouncilAdmin('admin@sportscouncil.local'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBe(true);
    });

    it('should not fetch when email is not provided', () => {
      const { result } = renderHook(() => useIsSportsCouncilAdmin(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.data).toBeUndefined();
    });
  });
});