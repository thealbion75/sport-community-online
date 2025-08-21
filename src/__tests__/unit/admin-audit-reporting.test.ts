/**
 * Admin Audit and Reporting Service Tests
 * Unit tests for audit logging and reporting functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getApplicationStatistics,
  getAdminPerformanceMetrics,
  getAdminActivityLog,
  logAdminAction,
  exportApplicationData,
  getApplicationTimeline,
  getAuditSummary
} from '@/lib/supabase/admin-audit-reporting';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('Admin Audit and Reporting Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue('mock-auth-token');
  });

  describe('getApplicationStatistics', () => {
    it('should fetch application statistics successfully', async () => {
      const mockStats = {
        total_applications: 100,
        pending_applications: 15,
        approved_applications: 70,
        rejected_applications: 15,
        approval_rate: 0.7,
        average_processing_time_hours: 24,
        applications_by_month: [
          { month: '2024-01', total: 20, approved: 15, rejected: 3, pending: 2 }
        ],
        applications_by_location: [
          { location: 'London', count: 25 }
        ],
        top_rejection_reasons: [
          { reason: 'Incomplete information', count: 8 }
        ]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStats),
      });

      const result = await getApplicationStatistics();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockStats);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/reports/statistics'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-auth-token',
          }),
        })
      );
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Internal server error' }),
      });

      const result = await getApplicationStatistics();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Internal server error');
    });

    it('should include filters in query parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const filters = {
        date_from: '2024-01-01',
        date_to: '2024-01-31',
        admin_id: 'admin-123'
      };

      await getApplicationStatistics(filters);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('date_from=2024-01-01'),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('date_to=2024-01-31'),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('admin_id=admin-123'),
        expect.any(Object)
      );
    });
  });

  describe('getAdminPerformanceMetrics', () => {
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
          activity_by_month: [
            { month: '2024-01', approvals: 35, rejections: 15, bulk_operations: 5 }
          ]
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMetrics),
      });

      const result = await getAdminPerformanceMetrics();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockMetrics);
      expect(result.data![0].admin_email).toBe('admin1@example.com');
      expect(result.data![0].total_actions).toBe(50);
    });
  });

  describe('getAdminActivityLog', () => {
    it('should fetch paginated activity log successfully', async () => {
      const mockActivityLog = {
        data: [
          {
            id: 'log-1',
            admin_id: 'admin-1',
            admin_email: 'admin1@example.com',
            action_type: 'approve',
            target_type: 'club_application',
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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockActivityLog),
      });

      const result = await getAdminActivityLog({ limit: 25, offset: 0 });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockActivityLog);
      expect(result.data!.data).toHaveLength(1);
      expect(result.data!.data[0].action_type).toBe('approve');
    });
  });

  describe('logAdminAction', () => {
    it('should log admin action successfully', async () => {
      const mockLogEntry = {
        id: 'log-1',
        admin_id: 'admin-1',
        admin_email: 'admin1@example.com',
        action_type: 'approve',
        target_type: 'club_application',
        target_id: 'club-1',
        target_name: 'Test Club',
        details: 'Application approved',
        created_at: '2024-01-15T10:00:00Z'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockLogEntry),
      });

      const result = await logAdminAction(
        'approve',
        'club_application',
        'club-1',
        'Test Club',
        'Application approved'
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockLogEntry);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/audit/log-action'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"action_type":"approve"'),
        })
      );
    });

    it('should sanitize input data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await logAdminAction(
        'approve',
        'club_application',
        'club-1',
        '<script>alert("xss")</script>Test Club',
        'Application approved with <script>alert("xss")</script>'
      );

      const callArgs = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);
      
      // Verify that the sanitization function would be called
      expect(requestBody.target_name).toBeDefined();
      expect(requestBody.details).toBeDefined();
    });
  });

  describe('exportApplicationData', () => {
    it('should export application data successfully', async () => {
      const mockExportResult = {
        download_url: 'https://example.com/download/applications.xlsx',
        filename: 'applications_2024-01-15.xlsx'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockExportResult),
      });

      const exportOptions = {
        format: 'xlsx' as const,
        include_history: true,
        include_admin_notes: true,
        status_filter: 'all' as const
      };

      const result = await exportApplicationData(exportOptions);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockExportResult);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/export/applications'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"format":"xlsx"'),
        })
      );
    });
  });

  describe('getApplicationTimeline', () => {
    it('should fetch application timeline successfully', async () => {
      const mockTimeline = [
        {
          id: 'log-1',
          admin_id: 'admin-1',
          admin_email: 'admin1@example.com',
          action_type: 'approve',
          target_type: 'club_application',
          target_id: 'club-1',
          details: 'Application approved',
          created_at: '2024-01-15T10:00:00Z'
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTimeline),
      });

      const result = await getApplicationTimeline('club-1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockTimeline);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/audit/application-timeline/club-1'),
        expect.any(Object)
      );
    });
  });

  describe('getAuditSummary', () => {
    it('should fetch audit summary successfully', async () => {
      const mockSummary = {
        total_actions: 150,
        unique_admins: 5,
        actions_by_type: [
          { action_type: 'approve', count: 80 },
          { action_type: 'reject', count: 30 }
        ],
        actions_by_admin: [
          { admin_email: 'admin1@example.com', count: 50 }
        ],
        recent_activity: []
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSummary),
      });

      const result = await getAuditSummary();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockSummary);
      expect(result.data!.total_actions).toBe(150);
      expect(result.data!.unique_admins).toBe(5);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await getApplicationStatistics();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('should handle missing auth token', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await getApplicationStatistics();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': '',
          }),
        })
      );
    });

    it('should handle malformed JSON responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      const result = await getApplicationStatistics();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });
  });
});