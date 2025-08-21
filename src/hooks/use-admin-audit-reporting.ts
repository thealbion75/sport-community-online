/**
 * Admin Audit Trail and Reporting React Query Hooks
 * Custom hooks for audit logging, reporting, and data export
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getApplicationStatistics,
  getAdminPerformanceMetrics,
  getAdminActivityLog,
  logAdminAction,
  exportApplicationData,
  exportAdminActivityReport,
  exportStatisticsReport,
  getApplicationTimeline,
  getAuditSummary,
  AdminActivityLog,
  ApplicationStatistics,
  AdminPerformanceMetrics,
  ReportFilters,
  ExportOptions
} from '@/lib/supabase/admin-audit-reporting';
import { PaginatedResponse } from '@/types';
import { useToast } from './use-toast';

// Query keys for audit and reporting
export const auditReportingKeys = {
  all: ['audit-reporting'] as const,
  statistics: (filters?: ReportFilters) => [...auditReportingKeys.all, 'statistics', filters] as const,
  adminPerformance: (filters?: ReportFilters) => [...auditReportingKeys.all, 'admin-performance', filters] as const,
  activityLog: (filters?: ReportFilters) => [...auditReportingKeys.all, 'activity-log', filters] as const,
  timeline: (clubId: string) => [...auditReportingKeys.all, 'timeline', clubId] as const,
  auditSummary: (filters?: ReportFilters) => [...auditReportingKeys.all, 'audit-summary', filters] as const,
};

/**
 * Hook to fetch application statistics and trends
 */
export function useApplicationStatistics(filters?: ReportFilters) {
  return useQuery({
    queryKey: auditReportingKeys.statistics(filters),
    queryFn: () => getApplicationStatistics(filters),
    select: (data) => data.success ? data.data : null,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors (client errors)
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as any).status;
        if (status >= 400 && status < 500) {
          return false;
        }
      }
      return failureCount < 3;
    },
  });
}

/**
 * Hook to fetch admin performance metrics
 */
export function useAdminPerformanceMetrics(filters?: ReportFilters) {
  return useQuery({
    queryKey: auditReportingKeys.adminPerformance(filters),
    queryFn: () => getAdminPerformanceMetrics(filters),
    select: (data) => data.success ? data.data : [],
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as any).status;
        if (status >= 400 && status < 500) {
          return false;
        }
      }
      return failureCount < 3;
    },
  });
}

/**
 * Hook to fetch admin activity log with filtering
 */
export function useAdminActivityLog(filters?: ReportFilters) {
  return useQuery({
    queryKey: auditReportingKeys.activityLog(filters),
    queryFn: () => getAdminActivityLog(filters),
    select: (data) => data.success ? data.data : { data: [], count: 0, page: 1, limit: 10, total_pages: 0 },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as any).status;
        if (status >= 400 && status < 500) {
          return false;
        }
      }
      return failureCount < 3;
    },
  });
}

/**
 * Hook to fetch application processing timeline
 */
export function useApplicationTimeline(clubId: string) {
  return useQuery({
    queryKey: auditReportingKeys.timeline(clubId),
    queryFn: () => getApplicationTimeline(clubId),
    select: (data) => data.success ? data.data : [],
    enabled: !!clubId,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch audit summary
 */
export function useAuditSummary(filters?: ReportFilters) {
  return useQuery({
    queryKey: auditReportingKeys.auditSummary(filters),
    queryFn: () => getAuditSummary(filters),
    select: (data) => data.success ? data.data : null,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to log admin actions for audit trail
 */
export function useLogAdminAction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      actionType,
      targetType,
      targetId,
      targetName,
      details
    }: {
      actionType: AdminActivityLog['action_type'];
      targetType: AdminActivityLog['target_type'];
      targetId?: string;
      targetName?: string;
      details?: string;
    }) => logAdminAction(actionType, targetType, targetId, targetName, details),

    onSuccess: (result) => {
      if (result.success) {
        // Invalidate activity log queries to show new entry
        queryClient.invalidateQueries({ queryKey: auditReportingKeys.activityLog() });
        queryClient.invalidateQueries({ queryKey: auditReportingKeys.auditSummary() });
        queryClient.invalidateQueries({ queryKey: auditReportingKeys.adminPerformance() });
      }
    },

    onError: (error) => {
      console.error('Failed to log admin action:', error);
      // Don't show toast for audit logging failures to avoid disrupting user experience
    },
  });
}

/**
 * Hook to export application data
 */
export function useExportApplicationData() {
  const { toast } = useToast();
  const logAction = useLogAdminAction();

  return useMutation({
    mutationFn: (options: ExportOptions) => exportApplicationData(options),

    onSuccess: (result, options) => {
      if (result.success && result.data) {
        // Log the export action
        logAction.mutate({
          actionType: 'export',
          targetType: 'club_application',
          details: `Exported applications in ${options.format} format`
        });

        // Trigger download
        const link = document.createElement('a');
        link.href = result.data.download_url;
        link.download = result.data.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
          title: 'Export Successful',
          description: `Application data exported as ${result.data.filename}`,
          variant: 'success',
        });
      } else {
        toast({
          title: 'Export Failed',
          description: result.error || 'Failed to export application data',
          variant: 'destructive',
        });
      }
    },

    onError: (error) => {
      toast({
        title: 'Export Error',
        description: 'Failed to export application data. Please try again.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to export admin activity report
 */
export function useExportAdminActivityReport() {
  const { toast } = useToast();
  const logAction = useLogAdminAction();

  return useMutation({
    mutationFn: (options: ExportOptions & { admin_id?: string }) => exportAdminActivityReport(options),

    onSuccess: (result, options) => {
      if (result.success && result.data) {
        // Log the export action
        logAction.mutate({
          actionType: 'export',
          targetType: 'audit_log',
          details: `Exported admin activity report in ${options.format} format`
        });

        // Trigger download
        const link = document.createElement('a');
        link.href = result.data.download_url;
        link.download = result.data.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
          title: 'Export Successful',
          description: `Admin activity report exported as ${result.data.filename}`,
          variant: 'success',
        });
      } else {
        toast({
          title: 'Export Failed',
          description: result.error || 'Failed to export admin activity report',
          variant: 'destructive',
        });
      }
    },

    onError: (error) => {
      toast({
        title: 'Export Error',
        description: 'Failed to export admin activity report. Please try again.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to export statistics report
 */
export function useExportStatisticsReport() {
  const { toast } = useToast();
  const logAction = useLogAdminAction();

  return useMutation({
    mutationFn: (options: ExportOptions) => exportStatisticsReport(options),

    onSuccess: (result, options) => {
      if (result.success && result.data) {
        // Log the export action
        logAction.mutate({
          actionType: 'export',
          targetType: 'report',
          details: `Exported statistics report in ${options.format} format`
        });

        // Trigger download
        const link = document.createElement('a');
        link.href = result.data.download_url;
        link.download = result.data.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
          title: 'Export Successful',
          description: `Statistics report exported as ${result.data.filename}`,
          variant: 'success',
        });
      } else {
        toast({
          title: 'Export Failed',
          description: result.error || 'Failed to export statistics report',
          variant: 'destructive',
        });
      }
    },

    onError: (error) => {
      toast({
        title: 'Export Error',
        description: 'Failed to export statistics report. Please try again.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Convenience hooks for specific use cases
 */

/**
 * Hook to get recent admin activity (last 24 hours)
 */
export function useRecentAdminActivity() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  return useAdminActivityLog({
    date_from: yesterday.toISOString().split('T')[0],
    limit: 50
  });
}

/**
 * Hook to get current month statistics
 */
export function useCurrentMonthStatistics() {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  return useApplicationStatistics({
    date_from: firstDayOfMonth.toISOString().split('T')[0]
  });
}

/**
 * Hook to get admin performance for current month
 */
export function useCurrentMonthAdminPerformance() {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  return useAdminPerformanceMetrics({
    date_from: firstDayOfMonth.toISOString().split('T')[0]
  });
}