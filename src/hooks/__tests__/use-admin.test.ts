/**
 * @jest-environment jsdom
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import { useIsAdmin, usePlatformStats } from '../use-admin';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: null,
            error: { code: 'PGRST116' },
          })),
          head: vi.fn(() => ({
            count: 0,
            error: null,
          })),
        })),
      })),
    })),
  },
}));

// Mock auth context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
  }),
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

describe('use-admin hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useIsAdmin', () => {
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

      const { result } = renderHook(() => useIsAdmin(), {
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
              data: { is_admin: true },
              error: null,
            })),
          })),
        })),
      } as any);

      const { result } = renderHook(() => useIsAdmin(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({
              data: null,
              error: { message: 'Database error', code: 'ERROR' },
            })),
          })),
        })),
      } as any);

      const { result } = renderHook(() => useIsAdmin(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBe(false);
    });
  });

  describe('usePlatformStats', () => {
    it('should fetch platform statistics successfully', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            head: vi.fn(() => ({
              count: 10,
              error: null,
            })),
          })),
          head: vi.fn(() => ({
            count: 5,
            error: null,
          })),
        })),
      } as any);

      const { result } = renderHook(() => usePlatformStats(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeDefined();
      expect(typeof result.current.data?.total_clubs).toBe('number');
    });

    it('should handle errors when fetching stats', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      vi.mocked(supabase.from).mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const { result } = renderHook(() => usePlatformStats(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
    });
  });
});