/**
 * Admin Audit Trail and Reporting Service
 * Handles audit logging, reporting, and data export functionality
 */

import { ApiResponse, PaginatedResponse } from '@/types';
import { sanitizeObject } from '@/lib/sanitization';

// D1 API base URL - will be set from environment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

/**
 * Helper function to make authenticated API requests to D1 worker
 */
async function apiRequest<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const token = localStorage.getItem('auth_token');
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      return { success: false, error: errorData.error || `HTTP ${response.status}` };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Admin Activity Log Entry Interface
 */
export interface AdminActivityLog {
  id: string;
  admin_id: string;
  admin_email: string;
  admin_name?: string;
  action_type: 'approve' | 'reject' | 'bulk_approve' | 'bulk_reject' | 'view' | 'export';
  target_type: 'club_application' | 'report' | 'audit_log';
  target_id?: string;
  target_name?: string;
  details?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

/**
 * Application Statistics Interface
 */
export interface ApplicationStatistics {
  total_applications: number;
  pending_applications: number;
  approved_applications: number;
  rejected_applications: number;
  approval_rate: number;
  average_processing_time_hours: number;
  applications_by_month: Array<{
    month: string;
    total: number;
    approved: number;
    rejected: number;
    pending: number;
  }>;
  applications_by_location: Array<{
    location: string;
    count: number;
  }>;
  top_rejection_reasons: Array<{
    reason: string;
    count: number;
  }>;
}

/**
 * Admin Performance Metrics Interface
 */
export interface AdminPerformanceMetrics {
  admin_id: string;
  admin_email: string;
  admin_name?: string;
  total_actions: number;
  approvals_count: number;
  rejections_count: number;
  bulk_operations_count: number;
  average_processing_time_hours: number;
  last_activity: string;
  activity_by_month: Array<{
    month: string;
    approvals: number;
    rejections: number;
    bulk_operations: number;
  }>;
}

/**
 * Report Filters Interface
 */
export interface ReportFilters {
  date_from?: string;
  date_to?: string;
  admin_id?: string;
  action_type?: string;
  target_type?: string;
  limit?: number;
  offset?: number;
}

/**
 * Export Options Interface
 */
export interface ExportOptions {
  format: 'csv' | 'json' | 'xlsx';
  include_history?: boolean;
  include_admin_notes?: boolean;
  date_from?: string;
  date_to?: string;
  status_filter?: 'pending' | 'approved' | 'rejected' | 'all';
}

/**
 * Get comprehensive application statistics and trends
 */
export async function getApplicationStatistics(
  filters?: ReportFilters
): Promise<ApiResponse<ApplicationStatistics>> {
  const params = new URLSearchParams();
  
  if (filters?.date_from) params.append('date_from', filters.date_from);
  if (filters?.date_to) params.append('date_to', filters.date_to);
  if (filters?.admin_id) params.append('admin_id', filters.admin_id);

  return apiRequest<ApplicationStatistics>(`/api/admin/reports/statistics?${params}`);
}

/**
 * Get admin performance metrics for individual admin analysis
 */
export async function getAdminPerformanceMetrics(
  filters?: ReportFilters
): Promise<ApiResponse<AdminPerformanceMetrics[]>> {
  const params = new URLSearchParams();
  
  if (filters?.date_from) params.append('date_from', filters.date_from);
  if (filters?.date_to) params.append('date_to', filters.date_to);
  if (filters?.admin_id) params.append('admin_id', filters.admin_id);
  if (filters?.limit) params.append('limit', filters.limit.toString());
  if (filters?.offset) params.append('offset', filters.offset.toString());

  return apiRequest<AdminPerformanceMetrics[]>(`/api/admin/reports/admin-performance?${params}`);
}

/**
 * Get detailed admin activity log with filtering
 */
export async function getAdminActivityLog(
  filters?: ReportFilters
): Promise<ApiResponse<PaginatedResponse<AdminActivityLog>>> {
  const params = new URLSearchParams();
  
  if (filters?.date_from) params.append('date_from', filters.date_from);
  if (filters?.date_to) params.append('date_to', filters.date_to);
  if (filters?.admin_id) params.append('admin_id', filters.admin_id);
  if (filters?.action_type) params.append('action_type', filters.action_type);
  if (filters?.target_type) params.append('target_type', filters.target_type);
  if (filters?.limit) params.append('limit', filters.limit.toString());
  if (filters?.offset) params.append('offset', filters.offset.toString());

  return apiRequest<PaginatedResponse<AdminActivityLog>>(`/api/admin/audit/activity-log?${params}`);
}

/**
 * Log admin action for audit trail
 */
export async function logAdminAction(
  actionType: AdminActivityLog['action_type'],
  targetType: AdminActivityLog['target_type'],
  targetId?: string,
  targetName?: string,
  details?: string
): Promise<ApiResponse<AdminActivityLog>> {
  const sanitizedData = sanitizeObject({
    action_type: actionType,
    target_type: targetType,
    target_id: targetId,
    target_name: targetName,
    details: details
  });

  return apiRequest<AdminActivityLog>('/api/admin/audit/log-action', {
    method: 'POST',
    body: JSON.stringify(sanitizedData),
  });
}

/**
 * Export application data in various formats
 */
export async function exportApplicationData(
  options: ExportOptions
): Promise<ApiResponse<{ download_url: string; filename: string }>> {
  const sanitizedOptions = sanitizeObject(options);
  
  return apiRequest<{ download_url: string; filename: string }>('/api/admin/export/applications', {
    method: 'POST',
    body: JSON.stringify(sanitizedOptions),
  });
}

/**
 * Export admin activity report
 */
export async function exportAdminActivityReport(
  options: ExportOptions & { admin_id?: string }
): Promise<ApiResponse<{ download_url: string; filename: string }>> {
  const sanitizedOptions = sanitizeObject(options);
  
  return apiRequest<{ download_url: string; filename: string }>('/api/admin/export/admin-activity', {
    method: 'POST',
    body: JSON.stringify(sanitizedOptions),
  });
}

/**
 * Export application statistics report
 */
export async function exportStatisticsReport(
  options: ExportOptions
): Promise<ApiResponse<{ download_url: string; filename: string }>> {
  const sanitizedOptions = sanitizeObject(options);
  
  return apiRequest<{ download_url: string; filename: string }>('/api/admin/export/statistics', {
    method: 'POST',
    body: JSON.stringify(sanitizedOptions),
  });
}

/**
 * Get application processing timeline for a specific application
 */
export async function getApplicationTimeline(
  clubId: string
): Promise<ApiResponse<AdminActivityLog[]>> {
  return apiRequest<AdminActivityLog[]>(`/api/admin/audit/application-timeline/${clubId}`);
}

/**
 * Get system-wide audit summary
 */
export async function getAuditSummary(
  filters?: ReportFilters
): Promise<ApiResponse<{
  total_actions: number;
  unique_admins: number;
  actions_by_type: Array<{
    action_type: string;
    count: number;
  }>;
  actions_by_admin: Array<{
    admin_email: string;
    count: number;
  }>;
  recent_activity: AdminActivityLog[];
}>> {
  const params = new URLSearchParams();
  
  if (filters?.date_from) params.append('date_from', filters.date_from);
  if (filters?.date_to) params.append('date_to', filters.date_to);

  return apiRequest(`/api/admin/audit/summary?${params}`);
}