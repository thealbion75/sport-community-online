/**
 * Admin Club Approval API Client
 * Client-side functions for club approval management using Cloudflare D1 API
 */

import { 
  Club, 
  ClubApplicationHistory, 
  ClubApplicationReview, 
  ClubApplicationFilters,
  ApiResponse,
  PaginatedResponse 
} from '@/types';
import { apiGet, apiPost, buildQueryString } from './client';

/**
 * Get pending club applications with filtering and pagination
 */
export async function getPendingClubApplications(
  filters?: ClubApplicationFilters
): Promise<ApiResponse<PaginatedResponse<Club>>> {
  const queryString = filters ? buildQueryString(filters) : '';
  return apiGet<PaginatedResponse<Club>>(`/api/admin/club-applications${queryString}`);
}

/**
 * Get club application by ID for detailed review
 */
export async function getClubApplicationById(id: string): Promise<ApiResponse<ClubApplicationReview>> {
  return apiGet<ClubApplicationReview>(`/api/admin/club-applications/${id}`);
}

/**
 * Approve a club application with status updates and history logging
 */
export async function approveClubApplication(
  clubId: string,
  adminNotes?: string
): Promise<ApiResponse<Club>> {
  return apiPost<Club>('/api/admin/club-applications/approve', {
    club_id: clubId,
    admin_notes: adminNotes
  });
}

/**
 * Reject a club application with required notes and notifications
 */
export async function rejectClubApplication(
  clubId: string,
  rejectionReason: string
): Promise<ApiResponse<Club>> {
  return apiPost<Club>('/api/admin/club-applications/reject', {
    club_id: clubId,
    rejection_reason: rejectionReason
  });
}

/**
 * Get application history for audit trail retrieval
 */
export async function getApplicationHistory(clubId: string): Promise<ApiResponse<ClubApplicationHistory[]>> {
  return apiGet<ClubApplicationHistory[]>(`/api/admin/club-applications/${clubId}/history`);
}

/**
 * Bulk approve multiple club applications
 */
export async function bulkApproveApplications(
  clubIds: string[],
  adminNotes?: string
): Promise<ApiResponse<{ successful: string[]; failed: { id: string; error: string }[] }>> {
  return apiPost<{ successful: string[]; failed: { id: string; error: string }[] }>(
    '/api/admin/club-applications/bulk-approve',
    {
      club_ids: clubIds,
      admin_notes: adminNotes
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
  return apiGet<{
    pending: number;
    approved: number;
    rejected: number;
    total: number;
  }>('/api/admin/club-applications/stats');
}