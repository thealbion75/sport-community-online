/**
 * Admin Audit and Reporting Hooks Tests
 * Unit tests for React Query hooks for audit and reporting
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useApplicationStatistics,
  useAdminPerformanceMetrics,
  useAdminActivityLog,
  useLogAdminAction,
  useExportApplicationData,
  useApplicationTimeline,
  useAuditSummary
} from '@/hooks/use-admin-audit-reporting';

// Mock the service functions
vi.mock('@/lib/supabase/admin-audit-reporting', () => ({
  getApplicationStatistics: vi.fn(),
  getAdminPerformanceMetrics: vi.fn(),
  getAdminActivityLog: vi.fn(),
  logAdminAction: vi.fn(),
  exportApplicationData: vi.fn(),
  getApplicationTimeline: vi.fn(),
  getAuditSummary: vi.fn(),
}));

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

import * as auditService from '@/lib/supabase/admin-audit-reporting';

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

describe('Admin Audit and Reporting Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Setup DOM container
    document.body.innerHTML = '<div id="root"></div>';
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
  });

  describe('useApplicationStatistics', () => {
    it('should fetch application statistics successfully', async () => {
      const mockStats = {
        total_applications: 100,
        pending_applications: 15,
        approved_applications: 70,
        rejected_applications: 15,
        approval_rate: 0.7,
        average_processing_time_hours: 24,
        applications_by_month: [],
        applications_by_location: [],
        top_rejection_reasons: []
      };

      vi.mocked(auditService.getApplicationStatistics).mockResolvedValue({
        success: true,
        data: mockStats
      });

      const { result } = renderHook(
        () => useApplicationStatistics(),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockStats);
      expect(auditService.getApplicationStatistics).toHaveBeenCalledWith(undefined);
    });

    it('should pass filters to the service', async () => {
      vi.mocked(auditService.getApplicationStatistics).mockResolvedValue({
        success: true,
        data: null
      });

      const filters = {
        date_from: '2024-01-01',
        date_to: '2024-01-31'
      };

      renderHook(
        () => useApplicationStatistics(filters),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(auditService.getApplicationStatistics).toHaveBeenCalledWith(filters);
      });
    });

    it('should handle API errors', async () => {
      vi.mocked(auditService.getApplicationStatistics).mockResolvedValue({
        success: false,
        error: 'Failed to fetch statistics'
      });

      const { result } = renderHook(
        () => useApplicationStatistics(),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.data).toBeNull();
      });
    });
  });

  describe('useAdminPerformanceMetrics', () => {
    it('should fetch admin performance metrics successfully', async () => {
      const mockMetrics = [
        {
          admin_id: 'admin-1',
          admin_email: 'admin1@example.com',
          admin_name: 'Admin One',
          total_actions: 50,
          approvals_count: 35,
          rejections_count: 15,
          bulk_operations_count: 5,
          average_processing_time_hours: 2.5,
          last_activity: '2024-01-15T10:00:00Z',
          activity_by_month: []
        }
      ];

      vi.mocked(auditService.getAdminPerformanceMetrics).mockResolvedValue({
        success: true,
        data: mockMetrics
      });

      const { result } = renderHook(
        () => useAdminPerformanceMetrics(),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockMetrics);
    });
  });

  describe('useAdminActivityLog', () => {
    it('should fetch paginated activity log successfully', async () => {
      const mockActivityLog = {
        data: [
          {
            id: 'log-1',
            admin_id: 'admin-1',
            admin_email: 'admin1@example.com',
            action_type: 'approve' as const,
            target_type: 'club_application' as const,
            target_id: 'club-1',
            target_name: 'Test Club',
            details: 'Application approved',
            created_at: '2024-01-15T10:00:00Z'
          }
        ],
        count: 1,
        page: 1,
        limit: 25,
        total_pages: 1
      };

      vi.mocked(auditService.getAdminActivityLog).mockResolvedValue({
        success: true,
        data: mockActivityLog
      });

      const { result } = renderHook(
        () => useAdminActivityLog(),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockActivityLog);
    });

    it('should return default empty data on error', async () => {
      vi.mocked(auditService.getAdminActivityLog).mockResolvedValue({
        success: false,
        error: 'Failed to fetch activity log'
      });

      const { result } = renderHook(
        () => useAdminActivityLog(),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.data).toEqual({
          data: [],
          count: 0,
          page: 1,
          limit: 10,
          total_pages: 0
        });
      });
    });
  });

  describe('useApplicationTimeline', () => {
    it('should fetch application timeline successfully', async () => {
      const mockTimeline = [
        {
          id: 'log-1',
          admin_id: 'admin-1',
          admin_email: 'admin1@example.com',
          action_type: 'approve' as const,
          target_type: 'club_application' as const,
          target_id: 'club-1',
          details: 'Application approved',
          created_at: '2024-01-15T10:00:00Z'
        }
      ];

      vi.mocked(auditService.getApplicationTimeline).mockResolvedValue({
        success: true,
        data: mockTimeline
      });

      const { result } = renderHook(
        () => useApplicationTimeline('club-1'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockTimeline);
      expect(auditService.getApplicationTimeline).toHaveBeenCalledWith('club-1');
    });

    it('should not fetch when clubId is empty', () => {
      const { result } = renderHook(
        () => useApplicationTimeline(''),
        { wrapper: createWrapper() }
      );

      expect(result.current.fetchStatus).toBe('idle');
      expect(auditService.getApplicationTimeline).not.toHaveBeenCalled();
    });
  });

  describe('useLogAdminAction', () => {
    it('should log admin action successfully', async () => {
      const mockLogEntry = {
        id: 'log-1',
        admin_id: 'admin-1',
        admin_email: 'admin1@example.com',
        action_type: 'approve' as const,
        target_type: 'club_application' as const,
        target_id: 'club-1',
        target_name: 'Test Club',
        details: 'Application approved',
        created_at: '2024-01-15T10:00:00Z'
      };

      vi.mocked(auditService.logAdminAction).mockResolvedValue({
        success: true,
        data: mockLogEntry
      });

      const { result } = renderHook(
        () => useLogAdminAction(),
        { wrapper: createWrapper() }
      );

      const actionData = {
        actionType: 'approve' as const,
        targetType: 'club_application' as const,
        targetId: 'club-1',
        targetName: 'Test Club',
        details: 'Application approved'
      };

      result.current.mutate(actionData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(auditService.logAdminAction).toHaveBeenCalledWith(
        'approve',
        'club_application',
        'club-1',
        'Test Club',
        'Application approved'
      );
    });

    it('should handle logging errors silently', async () => {
      vi.mocked(auditService.logAdminAction).mockResolvedValue({
        success: false,
        error: 'Failed to log action'
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(
        () => useLogAdminAction(),
        { wrapper: createWrapper() }
      );

      const actionData = {
        actionType: 'approve' as const,
        targetType: 'club_application' as const,
        targetId: 'club-1'
      };

      result.current.mutate(actionData);

      await waitFor(() => {
        expect(result.current.isError).toBe(false); // Should not show error to user
      });

      consoleSpy.mockRestore();
    });
  });

  describe('useExportApplicationData', () => {
    it('should export application data and trigger download', async () => {
      const mockExportResult = {
        download_url: 'https://example.com/download/applications.xlsx',
        filename: 'applications_2024-01-15.xlsx'
      };

      vi.mocked(auditService.exportApplicationData).mockResolvedValue({
        success: true,
        data: mockExportResult
      });

      // Mock DOM methods
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
      const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);

      const { result } = renderHook(
        () => useExportApplicationData(),
        { wrapper: createWrapper() }
      );

      const exportOptions = {
        format: 'xlsx' as const,
        include_history: true,
        include_admin_notes: true
      };

      result.current.mutate(exportOptions);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(auditService.exportApplicationData).toHaveBeenCalledWith(exportOptions);
      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(mockLink.href).toBe(mockExportResult.download_url);
      expect(mockLink.download).toBe(mockExportResult.filename);
      expect(mockLink.click).toHaveBeenCalled();
      expect(appendChildSpy).toHaveBeenCalledWith(mockLink);
      expect(removeChildSpy).toHaveBeenCalledWith(mockLink);

      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });

    it('should handle export errors', async () => {
      vi.mocked(auditService.exportApplicationData).mockResolvedValue({
        success: false,
        error: 'Export failed'
      });

      const { result } = renderHook(
        () => useExportApplicationData(),
        { wrapper: createWrapper() }
      );

      const exportOptions = {
        format: 'csv' as const
      };

      result.current.mutate(exportOptions);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useAuditSummary', () => {
    it('should fetch audit summary successfully', async () => {
      const mockSummary = {
        total_actions: 150,
        unique_admins: 5,
        actions_by_type: [
          { action_type: 'approve', count: 80 }
        ],
        actions_by_admin: [
          { admin_email: 'admin1@example.com', count: 50 }
        ],
        recent_activity: []
      };

      vi.mocked(auditService.getAuditSummary).mockResolvedValue({
        success: true,
        data: mockSummary
      });

      const { result } = renderHook(
        () => useAuditSummary(),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockSummary);
    });
  });

  describe('Convenience Hooks', () => {
    it('useRecentAdminActivity should fetch last 24 hours of activity', async () => {
      vi.mocked(auditService.getAdminActivityLog).mockResolvedValue({
        success: true,
        data: { data: [], count: 0, page: 1, limit: 50, total_pages: 0 }
      });

      const { useRecentAdminActivity } = await import('@/hooks/use-admin-audit-reporting');

      renderHook(
        () => useRecentAdminActivity(),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(auditService.getAdminActivityLog).toHaveBeenCalledWith(
          expect.objectContaining({
            limit: 50,
            date_from: expect.any(String)
          })
        );
      });
    });

    it('useCurrentMonthStatistics should fetch current month data', async () => {
      vi.mocked(auditService.getApplicationStatistics).mockResolvedValue({
        success: true,
        data: null
      });

      const { useCurrentMonthStatistics } = await import('@/hooks/use-admin-audit-reporting');

      renderHook(
        () => useCurrentMonthStatistics(),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(auditService.getApplicationStatistics).toHaveBeenCalledWith(
          expect.objectContaining({
            date_from: expect.any(String)
          })
        );
      });
    });
  });
});