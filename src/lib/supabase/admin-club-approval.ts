/**
 * Admin Club Approval Data Access Layer
 * Handles all database operations for club approval management
 * Updated for Cloudflare D1 database
 */

import { 
  Club, 
  ClubApplicationHistory, 
  ClubApplicationReview, 
  ApprovalActionData,
  ClubApplicationFilters,
  ApiResponse,
  PaginatedResponse 
} from '@/types';
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
 * Get pending club applications with filtering and pagination
 */
export async function getPendingClubApplications(
  filters?: ClubApplicationFilters
): Promise<ApiResponse<PaginatedResponse<Club>>> {
  const params = new URLSearchParams();
  
  if (filters?.status) params.append('status', filters.status);
  if (filters?.search) params.append('search', filters.search);
  if (filters?.search_fields && filters.search_fields.length > 0) {
    params.append('search_fields', filters.search_fields.join(','));
  }
  if (filters?.date_from) params.append('date_from', filters.date_from);
  if (filters?.date_to) params.append('date_to', filters.date_to);
  if (filters?.location) params.append('location', filters.location);
  if (filters?.sort_by) params.append('sort_by', filters.sort_by);
  if (filters?.sort_order) params.append('sort_order', filters.sort_order);
  if (filters?.limit) params.append('limit', filters.limit.toString());
  if (filters?.offset) params.append('offset', filters.offset.toString());

  return apiRequest<PaginatedResponse<Club>>(`/api/admin/club-applications?${params}`);
}

/**
 * Get club application by ID for detailed review
 */
export async function getClubApplicationById(id: string): Promise<ApiResponse<ClubApplicationReview>> {
  return apiRequest<ClubApplicationReview>(`/api/admin/club-applications/${id}`);
}

/**
 * Approve a club application with status updates and history logging
 */
export async function approveClubApplication(
  clubId: string,
  adminNotes?: string
): Promise<ApiResponse<Club>> {
  const sanitizedNotes = adminNotes ? sanitizeObject({ notes: adminNotes }).notes : undefined;
  
  return apiRequest<Club>(`/api/admin/club-applications/${clubId}/approve`, {
    method: 'POST',
    body: JSON.stringify({ adminNotes: sanitizedNotes }),
  });
}

/**
 * Reject a club application with required notes and notifications
 */
export async function rejectClubApplication(
  clubId: string,
  rejectionReason: string
): Promise<ApiResponse<Club>> {
  if (!rejectionReason || rejectionReason.trim().length === 0) {
    return { success: false, error: 'Rejection reason is required' };
  }

  const sanitizedReason = sanitizeObject({ reason: rejectionReason.trim() }).reason;
  
  return apiRequest<Club>(`/api/admin/club-applications/${clubId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ rejectionReason: sanitizedReason }),
  });
}

/**
 * Get application history for audit trail retrieval
 */
export async function getApplicationHistory(clubId: string): Promise<ApiResponse<ClubApplicationHistory[]>> {
  return apiRequest<ClubApplicationHistory[]>(`/api/admin/club-applications/${clubId}/history`);
}

/**
 * Bulk approve multiple club applications
 */
export async function bulkApproveApplications(
  clubIds: string[],
  adminNotes?: string
): Promise<ApiResponse<{ successful: string[]; failed: { id: string; error: string }[] }>> {
  if (!clubIds || clubIds.length === 0) {
    return { success: false, error: 'No club IDs provided' };
  }

  const sanitizedNotes = adminNotes ? sanitizeObject({ notes: adminNotes }).notes : undefined;
  
  return apiRequest<{ successful: string[]; failed: { id: string; error: string }[] }>(
    '/api/admin/club-applications/bulk-approve', 
    {
      method: 'POST',
      body: JSON.stringify({ 
        clubIds, 
        adminNotes: sanitizedNotes 
      }),
    }
  );
}

/**
 * Get club application statistics for dashboard
 */
export async function getClubApplicationStats(): Promise<ApiResponse<{
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}>> {
  return apiRequest<{
    pending: number;
    approved: number;
    rejected: number;
    total: number;
  }>('/api/admin/club-applications/stats');
}