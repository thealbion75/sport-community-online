/**
 * Admin Club Approval Data Access Layer
 * Handles all database operations for club approval management
 */

import { supabase } from '@/integrations/supabase/client';
import { 
  Club, 
  ClubApplicationHistory, 
  ClubApplicationReview, 
  ApprovalActionData,
  ClubApplicationFilters,
  ApiResponse,
  PaginatedResponse 
} from '@/types';
import { handleSupabaseError } from '@/lib/react-query-error-handler';
import { sanitizeObject } from '@/lib/sanitization';

/**
 * Get pending club applications with filtering and pagination
 */
export async function getPendingClubApplications(
  filters?: ClubApplicationFilters
): Promise<ApiResponse<PaginatedResponse<Club>>> {
  try {
    let query = supabase
      .from('clubs')
      .select('*', { count: 'exact' });

    // Apply status filter
    if (filters?.status && filters.status !== 'all') {
      query = query.eq('application_status', filters.status);
    } else if (!filters?.status) {
      // Default to pending if no status specified
      query = query.eq('application_status', 'pending');
    }

    // Apply search filter
    if (filters?.search) {
      const searchTerm = filters.search.trim();
      query = query.or(`name.ilike.%${searchTerm}%,contact_email.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
    }

    // Apply date filters
    if (filters?.date_from) {
      query = query.gte('created_at', filters.date_from);
    }
    if (filters?.date_to) {
      query = query.lte('created_at', filters.date_to);
    }

    // Apply pagination
    const limit = filters?.limit || 10;
    const offset = filters?.offset || 0;
    
    query = query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    const { data: clubs, error, count } = await query;

    if (error) throw error;

    const totalPages = Math.ceil((count || 0) / limit);
    const currentPage = Math.floor(offset / limit) + 1;

    return {
      success: true,
      data: {
        data: clubs || [],
        count: count || 0,
        page: currentPage,
        limit,
        total_pages: totalPages
      }
    };
  } catch (error) {
    const appError = handleSupabaseError(error);
    return { success: false, error: appError.message };
  }
}

/**
 * Get club application by ID for detailed review
 */
export async function getClubApplicationById(id: string): Promise<ApiResponse<ClubApplicationReview>> {
  try {
    // Get club details
    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .select('*')
      .eq('id', id)
      .single();

    if (clubError) throw clubError;

    // Get application history
    const historyResult = await getApplicationHistory(id);
    if (!historyResult.success) {
      throw new Error(historyResult.error);
    }

    // Get admin user details if reviewed
    let adminUser = undefined;
    if (club.reviewed_by) {
      const { data: adminData, error: adminError } = await supabase
        .from('admin_roles')
        .select('email')
        .eq('id', club.reviewed_by)
        .single();

      if (!adminError && adminData) {
        adminUser = {
          email: adminData.email,
          name: adminData.email // Using email as name for now
        };
      }
    }

    return {
      success: true,
      data: {
        club,
        history: historyResult.data || [],
        admin_user: adminUser
      }
    };
  } catch (error) {
    const appError = handleSupabaseError(error);
    return { success: false, error: appError.message };
  }
}

/**
 * Approve a club application with status updates and history logging
 */
export async function approveClubApplication(
  clubId: string,
  adminNotes?: string
): Promise<ApiResponse<Club>> {
  try {
    // Get current user to verify admin status
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Authentication required');
    }

    // Verify user is admin
    const { data: isAdmin, error: adminCheckError } = await supabase.rpc('is_admin', { 
      user_id: user.id 
    });
    
    if (adminCheckError || !isAdmin) {
      throw new Error('Admin privileges required');
    }

    const sanitizedNotes = adminNotes ? sanitizeObject({ notes: adminNotes }).notes : null;

    // Update club status to approved
    const { data: club, error } = await supabase
      .from('clubs')
      .update({
        application_status: 'approved',
        admin_notes: sanitizedNotes,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', clubId)
      .select()
      .single();

    if (error) throw error;

    // Log the approval in history (this will be handled by the database trigger)
    // The trigger automatically creates history entries when application_status changes

    return { success: true, data: club };
  } catch (error) {
    const appError = handleSupabaseError(error);
    return { success: false, error: appError.message };
  }
}

/**
 * Reject a club application with required notes and notifications
 */
export async function rejectClubApplication(
  clubId: string,
  rejectionReason: string
): Promise<ApiResponse<Club>> {
  try {
    if (!rejectionReason || rejectionReason.trim().length === 0) {
      throw new Error('Rejection reason is required');
    }

    // Get current user to verify admin status
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Authentication required');
    }

    // Verify user is admin
    const { data: isAdmin, error: adminCheckError } = await supabase.rpc('is_admin', { 
      user_id: user.id 
    });
    
    if (adminCheckError || !isAdmin) {
      throw new Error('Admin privileges required');
    }

    const sanitizedReason = sanitizeObject({ reason: rejectionReason.trim() }).reason;

    // Update club status to rejected
    const { data: club, error } = await supabase
      .from('clubs')
      .update({
        application_status: 'rejected',
        admin_notes: sanitizedReason,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', clubId)
      .select()
      .single();

    if (error) throw error;

    // Log the rejection in history (this will be handled by the database trigger)
    // The trigger automatically creates history entries when application_status changes

    return { success: true, data: club };
  } catch (error) {
    const appError = handleSupabaseError(error);
    return { success: false, error: appError.message };
  }
}

/**
 * Get application history for audit trail retrieval
 */
export async function getApplicationHistory(clubId: string): Promise<ApiResponse<ClubApplicationHistory[]>> {
  try {
    const { data: history, error } = await supabase
      .from('club_application_history')
      .select(`
        id,
        club_id,
        admin_id,
        action,
        notes,
        created_at,
        admin_roles!inner(email)
      `)
      .eq('club_id', clubId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform the data to match our interface
    const transformedHistory: ClubApplicationHistory[] = (history || []).map(item => ({
      id: item.id,
      club_id: item.club_id,
      admin_id: item.admin_id,
      action: item.action,
      notes: item.notes,
      created_at: item.created_at,
      admin_email: item.admin_roles?.email,
      admin_name: item.admin_roles?.email // Using email as name for now
    }));

    return { success: true, data: transformedHistory };
  } catch (error) {
    const appError = handleSupabaseError(error);
    return { success: false, error: appError.message };
  }
}

/**
 * Bulk approve multiple club applications
 */
export async function bulkApproveApplications(
  clubIds: string[],
  adminNotes?: string
): Promise<ApiResponse<{ successful: string[]; failed: { id: string; error: string }[] }>> {
  try {
    if (!clubIds || clubIds.length === 0) {
      throw new Error('No club IDs provided');
    }

    // Get current user to verify admin status
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Authentication required');
    }

    // Verify user is admin
    const { data: isAdmin, error: adminCheckError } = await supabase.rpc('is_admin', { 
      user_id: user.id 
    });
    
    if (adminCheckError || !isAdmin) {
      throw new Error('Admin privileges required');
    }

    const successful: string[] = [];
    const failed: { id: string; error: string }[] = [];

    // Process each club individually to handle partial failures
    for (const clubId of clubIds) {
      try {
        const result = await approveClubApplication(clubId, adminNotes);
        if (result.success) {
          successful.push(clubId);
        } else {
          failed.push({ id: clubId, error: result.error || 'Unknown error' });
        }
      } catch (error) {
        failed.push({ 
          id: clubId, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    return {
      success: true,
      data: { successful, failed }
    };
  } catch (error) {
    const appError = handleSupabaseError(error);
    return { success: false, error: appError.message };
  }
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
  try {
    // Get counts for each status
    const { data: pendingCount, error: pendingError } = await supabase
      .from('clubs')
      .select('id', { count: 'exact', head: true })
      .eq('application_status', 'pending');

    const { data: approvedCount, error: approvedError } = await supabase
      .from('clubs')
      .select('id', { count: 'exact', head: true })
      .eq('application_status', 'approved');

    const { data: rejectedCount, error: rejectedError } = await supabase
      .from('clubs')
      .select('id', { count: 'exact', head: true })
      .eq('application_status', 'rejected');

    if (pendingError || approvedError || rejectedError) {
      throw pendingError || approvedError || rejectedError;
    }

    const pending = pendingCount?.length || 0;
    const approved = approvedCount?.length || 0;
    const rejected = rejectedCount?.length || 0;
    const total = pending + approved + rejected;

    return {
      success: true,
      data: { pending, approved, rejected, total }
    };
  } catch (error) {
    const appError = handleSupabaseError(error);
    return { success: false, error: appError.message };
  }
}