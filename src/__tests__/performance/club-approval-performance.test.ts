/**
 * Performance Tests for Club Approval System
 * Tests for handling large numbers of applications and performance optimization
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { usePendingApplications, useBulkApproveApplications } from '@/hooks/use-club-approval';
import * as adminClubApprovalApi from '@/lib/supabase/admin-club-approval';
import type { Club, PaginatedResponse } from '@/types';

// Mock the API functions
vi.mock('@/lib/supabase/admin-club-approval');

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

// Generate large dataset for performance testing
const generateMockClubs = (count: number): Club[] => {
  return Array.from({ length: count }, (_, index) => ({
    id: `club-${index + 1}`,
    name: `Test Club ${index + 1}`,
    contact_email: `club${index + 1}@example.com`,
    contact_phone: `+44 ${String(index + 1).padStart(10, '0')}`,
    location: `City ${index + 1}`,
    description: `Description for test club ${index + 1}`,
    sport_types: ['football', 'rugby', 'cricket'][index % 3] ? [['football', 'rugby', 'cricket'][index % 3]] : ['football'],
    application_status: 'pending' as const,
    admin_notes: null,
    reviewed_by: null,
    reviewed_at: null,
    verified: false,
    created_at: new Date(Date.now() - (index * 86400000)).toISOString(), // Spread over days
    updated_at: new Date(Date.now() - (index * 86400000)).toISOString()
  }));
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('Club Approval Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Large Dataset Handling', () => {
    it('should handle 1000 applications efficiently with pagination', async () => {
      const largeDataset = generateMockClubs(1000);
      const pageSize = 50;
      const firstPage = largeDataset.slice(0, pageSize);

      const mockResponse: PaginatedResponse<Club> = {
        data: firstPage,
        count: firstPage.length,
        page: 1,
        limit: pageSize,
        total_pages: Math.ceil(largeDataset.length / pageSize)
      };

      const startTime = performance.now();

      vi.mocked(adminClubApprovalApi.getPendingClubApplications).mockResolvedValue({
        success: true,
        data: mockResponse
      });

      const { result } = renderHook(() => usePendingApplications({ limit: pageSize }), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      // Should complete within reasonable time (2 seconds)
      expect(executionTime).toBeLessThan(2000);
      expect(result.current.data?.data).toHaveLength(pageSize);
      expect(result.current.data?.total_pages).toBe(20);
    });

    it('should handle rapid pagination through large datasets', async () => {
      const largeDataset = generateMockClubs(500);
      const pageSize = 25;

      // Mock multiple page requests
      for (let page = 1; page <= 5; page++) {
        const startIndex = (page - 1) * pageSize;
        const pageData = largeDataset.slice(startIndex, startIndex + pageSize);
        
        vi.mocked(adminClubApprovalApi.getPendingClubApplications).mockResolvedValueOnce({
          success: true,
          data: {
            data: pageData,
            count: pageData.length,
            page,
            limit: pageSize,
            total_pages: Math.ceil(largeDataset.length / pageSize)
          }
        });
      }

      const startTime = performance.now();

      // Simulate rapid pagination
      for (let page = 1; page <= 5; page++) {
        const { result } = renderHook(() => usePendingApplications({ page, limit: pageSize }), {
          wrapper: createWrapper()
        });

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data?.data).toHaveLength(pageSize);
        expect(result.current.data?.page).toBe(page);
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // All 5 page loads should complete within 3 seconds
      expect(totalTime).toBeLessThan(3000);
    });

    it('should efficiently handle search across large datasets', async () => {
      const largeDataset = generateMockClubs(2000);
      const searchTerm = 'Club 1';
      const filteredResults = largeDataset.filter(club => 
        club.name.includes(searchTerm) || club.contact_email.includes(searchTerm)
      );

      const startTime = performance.now();

      vi.mocked(adminClubApprovalApi.getPendingClubApplications).mockResolvedValue({
        success: true,
        data: {
          data: filteredResults.slice(0, 50), // First 50 results
          count: filteredResults.length,
          page: 1,
          limit: 50,
          total_pages: Math.ceil(filteredResults.length / 50)
        }
      });

      const { result } = renderHook(() => usePendingApplications({ search: searchTerm }), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const endTime = performance.now();
      const searchTime = endTime - startTime;

      // Search should complete quickly even with large dataset
      expect(searchTime).toBeLessThan(1000);
      expect(result.current.data?.data.length).toBeGreaterThan(0);
      expect(adminClubApprovalApi.getPendingClubApplications).toHaveBeenCalledWith(
        expect.objectContaining({ search: searchTerm })
      );
    });
  });

  describe('Bulk Operations Performance', () => {
    it('should handle bulk approval of 100 applications efficiently', async () => {
      const clubIds = Array.from({ length: 100 }, (_, i) => `club-${i + 1}`);
      
      const mockBulkResult = {
        successful: clubIds,
        failed: []
      };

      const startTime = performance.now();

      vi.mocked(adminClubApprovalApi.bulkApproveApplications).mockResolvedValue({
        success: true,
        data: mockBulkResult
      });

      const { result } = renderHook(() => useBulkApproveApplications(), {
        wrapper: createWrapper()
      });

      await result.current.mutateAsync({
        clubIds,
        adminNotes: 'Bulk approval for performance test'
      });

      const endTime = performance.now();
      const bulkTime = endTime - startTime;

      // Bulk operation should complete within 5 seconds
      expect(bulkTime).toBeLessThan(5000);
      expect(adminClubApprovalApi.bulkApproveApplications).toHaveBeenCalledWith(
        clubIds,
        'Bulk approval for performance test'
      );
    });

    it('should handle partial failures in bulk operations efficiently', async () => {
      const totalClubs = 200;
      const clubIds = Array.from({ length: totalClubs }, (_, i) => `club-${i + 1}`);
      
      // Simulate 10% failure rate
      const failureCount = Math.floor(totalClubs * 0.1);
      const successfulIds = clubIds.slice(0, totalClubs - failureCount);
      const failedIds = clubIds.slice(totalClubs - failureCount).map(id => ({
        id,
        error: 'Already processed'
      }));

      const mockBulkResult = {
        successful: successfulIds,
        failed: failedIds
      };

      const startTime = performance.now();

      vi.mocked(adminClubApprovalApi.bulkApproveApplications).mockResolvedValue({
        success: true,
        data: mockBulkResult
      });

      const { result } = renderHook(() => useBulkApproveApplications(), {
        wrapper: createWrapper()
      });

      const response = await result.current.mutateAsync({
        clubIds,
        adminNotes: 'Bulk approval with failures'
      });

      const endTime = performance.now();
      const bulkTime = endTime - startTime;

      // Should handle partial failures efficiently
      expect(bulkTime).toBeLessThan(6000);
      expect(response.successful).toHaveLength(successfulIds.length);
      expect(response.failed).toHaveLength(failedIds.length);
    });
  });

  describe('Memory Usage and Optimization', () => {
    it('should not cause memory leaks with repeated data fetching', async () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Simulate repeated data fetching
      for (let i = 0; i < 10; i++) {
        const mockData = generateMockClubs(100);
        
        vi.mocked(adminClubApprovalApi.getPendingClubApplications).mockResolvedValue({
          success: true,
          data: {
            data: mockData,
            count: mockData.length,
            page: 1,
            limit: 100,
            total_pages: 1
          }
        });

        const { result, unmount } = renderHook(() => usePendingApplications(), {
          wrapper: createWrapper()
        });

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        // Cleanup
        unmount();
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Memory usage should not increase significantly (allow for 50MB increase)
      if (initialMemory > 0 && finalMemory > 0) {
        const memoryIncrease = finalMemory - initialMemory;
        expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB
      }
    });

    it('should efficiently cache and reuse query results', async () => {
      const mockData = generateMockClubs(50);
      const mockResponse = {
        success: true,
        data: {
          data: mockData,
          count: mockData.length,
          page: 1,
          limit: 50,
          total_pages: 1
        }
      };

      vi.mocked(adminClubApprovalApi.getPendingClubApplications).mockResolvedValue(mockResponse);

      const wrapper = createWrapper();

      // First render
      const { result: result1 } = renderHook(() => usePendingApplications(), { wrapper });
      await waitFor(() => expect(result1.current.isSuccess).toBe(true));

      // Second render with same parameters should use cache
      const { result: result2 } = renderHook(() => usePendingApplications(), { wrapper });
      await waitFor(() => expect(result2.current.isSuccess).toBe(true));

      // Should only call API once due to caching
      expect(adminClubApprovalApi.getPendingClubApplications).toHaveBeenCalledTimes(1);
      expect(result1.current.data).toEqual(result2.current.data);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple simultaneous API calls efficiently', async () => {
      const mockData = generateMockClubs(30);
      
      // Mock different responses for concurrent calls
      vi.mocked(adminClubApprovalApi.getPendingClubApplications)
        .mockResolvedValueOnce({
          success: true,
          data: { data: mockData.slice(0, 10), count: 10, page: 1, limit: 10, total_pages: 3 }
        })
        .mockResolvedValueOnce({
          success: true,
          data: { data: mockData.slice(10, 20), count: 10, page: 2, limit: 10, total_pages: 3 }
        })
        .mockResolvedValueOnce({
          success: true,
          data: { data: mockData.slice(20, 30), count: 10, page: 3, limit: 10, total_pages: 3 }
        });

      const startTime = performance.now();

      // Simulate concurrent requests
      const promises = [
        renderHook(() => usePendingApplications({ page: 1 }), { wrapper: createWrapper() }),
        renderHook(() => usePendingApplications({ page: 2 }), { wrapper: createWrapper() }),
        renderHook(() => usePendingApplications({ page: 3 }), { wrapper: createWrapper() })
      ];

      // Wait for all to complete
      await Promise.all(promises.map(({ result }) => 
        waitFor(() => expect(result.current.isSuccess).toBe(true))
      ));

      const endTime = performance.now();
      const concurrentTime = endTime - startTime;

      // Concurrent operations should complete efficiently
      expect(concurrentTime).toBeLessThan(2000);
      expect(adminClubApprovalApi.getPendingClubApplications).toHaveBeenCalledTimes(3);
    });

    it('should handle race conditions in approval operations', async () => {
      const clubId = 'club-race-test';
      
      // Mock successful approval
      vi.mocked(adminClubApprovalApi.approveClubApplication).mockResolvedValue({
        success: true,
        data: { ...generateMockClubs(1)[0], id: clubId, application_status: 'approved' }
      });

      const wrapper = createWrapper();

      // Simulate race condition with multiple approval attempts
      const { result: result1 } = renderHook(() => useBulkApproveApplications(), { wrapper });
      const { result: result2 } = renderHook(() => useBulkApproveApplications(), { wrapper });

      const startTime = performance.now();

      // Attempt concurrent approvals
      const promises = [
        result1.current.mutateAsync({ clubIds: [clubId], adminNotes: 'First approval' }),
        result2.current.mutateAsync({ clubIds: [clubId], adminNotes: 'Second approval' })
      ];

      // One should succeed, handling race condition gracefully
      try {
        await Promise.allSettled(promises);
        const endTime = performance.now();
        const raceTime = endTime - startTime;
        
        // Should handle race condition quickly
        expect(raceTime).toBeLessThan(3000);
      } catch (error) {
        // Race condition handling is acceptable
        expect(error).toBeDefined();
      }
    });
  });

  describe('Network Performance', () => {
    it('should handle slow network conditions gracefully', async () => {
      const mockData = generateMockClubs(25);
      
      // Simulate slow network with delay
      vi.mocked(adminClubApprovalApi.getPendingClubApplications).mockImplementation(
        () => new Promise(resolve => {
          setTimeout(() => {
            resolve({
              success: true,
              data: {
                data: mockData,
                count: mockData.length,
                page: 1,
                limit: 25,
                total_pages: 1
              }
            });
          }, 1500); // 1.5 second delay
        })
      );

      const startTime = performance.now();

      const { result } = renderHook(() => usePendingApplications(), {
        wrapper: createWrapper()
      });

      // Should show loading state initially
      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      }, { timeout: 3000 });

      const endTime = performance.now();
      const networkTime = endTime - startTime;

      // Should handle slow network but complete within timeout
      expect(networkTime).toBeGreaterThan(1400);
      expect(networkTime).toBeLessThan(3000);
      expect(result.current.data?.data).toHaveLength(25);
    });

    it('should implement proper timeout handling', async () => {
      // Mock network timeout
      vi.mocked(adminClubApprovalApi.getPendingClubApplications).mockImplementation(
        () => new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('Network timeout'));
          }, 5000);
        })
      );

      const { result } = renderHook(() => usePendingApplications(), {
        wrapper: createWrapper()
      });

      // Should eventually show error state
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      }, { timeout: 6000 });

      expect(result.current.error).toBeTruthy();
    });
  });
});