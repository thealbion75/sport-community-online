/**
 * Admin Club Approval Data Access Layer - D1 Version
 * Handles all database operations for club approval management using Cloudflare D1
 */

import { 
  executeQuery, 
  executeQueryFirst, 
  executeUpdate, 
  generateId,
  parseJsonField,
  stringifyJsonField 
} from './client';
import { 
  Club, 
  ClubApplicationHistory, 
  ClubApplicationReview, 
  ClubApplicationFilters,
  ApiResponse,
  PaginatedResponse 
} from '@/types';
import { sanitizeObject } from '@/lib/sanitization';
import { createNotificationService } from '@/lib/email/notifications';

/**
 * Get pending club applications with filtering and pagination
 */
export async function getPendingClubApplications(
  filters?: ClubApplicationFilters
): Promise<ApiResponse<PaginatedResponse<Club>>> {
  try {
    let whereConditions: string[] = [];
    let params: any[] = [];
    let paramIndex = 1;

    // Apply status filter
    if (filters?.status && filters.status !== 'all') {
      whereConditions.push(`application_status = ?${paramIndex}`);
      params.push(filters.status);
      paramIndex++;
    } else if (!filters?.status) {
      // Default to pending if no status specified
      whereConditions.push(`application_status = ?${paramIndex}`);
      params.push('pending');
      paramIndex++;
    }

    // Apply search filter with configurable search fields
    if (filters?.search) {
      const searchTerm = `%${filters.search.trim()}%`;
      const searchFields = filters.search_fields || ['name', 'email', 'description'];
      const searchConditions: string[] = [];
      
      searchFields.forEach(field => {
        switch (field) {
          case 'name':
            searchConditions.push(`name LIKE ?${paramIndex}`);
            params.push(searchTerm);
            paramIndex++;
            break;
          case 'email':
            searchConditions.push(`contact_email LIKE ?${paramIndex}`);
            params.push(searchTerm);
            paramIndex++;
            break;
          case 'description':
            searchConditions.push(`description LIKE ?${paramIndex}`);
            params.push(searchTerm);
            paramIndex++;
            break;
        }
      });
      
      if (searchConditions.length > 0) {
        whereConditions.push(`(${searchConditions.join(' OR ')})`);
      }
    }

    // Apply location filter
    if (filters?.location) {
      const locationTerm = `%${filters.location.trim()}%`;
      whereConditions.push(`location LIKE ?${paramIndex}`);
      params.push(locationTerm);
      paramIndex++;
    }

    // Apply date filters
    if (filters?.date_from) {
      whereConditions.push(`created_at >= ?${paramIndex}`);
      params.push(filters.date_from);
      paramIndex++;
    }
    if (filters?.date_to) {
      whereConditions.push(`created_at <= ?${paramIndex}`);
      params.push(filters.date_to);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `SELECT COUNT(*) as count FROM clubs ${whereClause}`;
    const countResult = await executeQueryFirst<{ count: number }>(countQuery, params);
    const totalCount = countResult?.count || 0;

    // Apply sorting
    let orderByClause = 'ORDER BY created_at DESC'; // Default sorting
    if (filters?.sort_by && filters?.sort_order) {
      const validSortFields = ['name', 'created_at', 'application_status', 'location'];
      const validSortOrders = ['asc', 'desc'];
      
      if (validSortFields.includes(filters.sort_by) && validSortOrders.includes(filters.sort_order)) {
        orderByClause = `ORDER BY ${filters.sort_by} ${filters.sort_order.toUpperCase()}`;
      }
    }

    // Apply pagination
    const limit = filters?.limit || 10;
    const offset = filters?.offset || 0;
    
    const dataQuery = `
      SELECT * FROM clubs 
      ${whereClause}
      ${orderByClause}
      LIMIT ?${paramIndex} OFFSET ?${paramIndex + 1}
    `;
    params.push(limit, offset);

    const result = await executeQuery<any>(dataQuery, params);

    // Transform the data to match our Club interface
    const clubs: Club[] = (result.results || []).map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      location: row.location,
      contact_email: row.contact_email,
      contact_phone: row.contact_phone,
      logo_url: row.logo_url,
      website_url: row.website_url,
      sport_types: parseJsonField<string>(row.sport_types),
      verified: Boolean(row.verified),
      application_status: row.application_status,
      admin_notes: row.admin_notes,
      reviewed_by: row.reviewed_by,
      reviewed_at: row.reviewed_at,
      created_at: row.created_at,
      updated_at: row.updated_at
    }));

    const totalPages = Math.ceil(totalCount / limit);
    const currentPage = Math.floor(offset / limit) + 1;

    return {
      success: true,
      data: {
        data: clubs,
        count: totalCount,
        page: currentPage,
        limit,
        total_pages: totalPages
      }
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Get club application by ID for detailed review
 */
export async function getClubApplicationById(id: string): Promise<ApiResponse<ClubApplicationReview>> {
  try {
    // Get club details
    const clubQuery = 'SELECT * FROM clubs WHERE id = ?1';
    const clubRow = await executeQueryFirst<any>(clubQuery, [id]);

    if (!clubRow) {
      return { success: false, error: 'Club not found' };
    }

    // Transform club data
    const club: Club = {
      id: clubRow.id,
      name: clubRow.name,
      description: clubRow.description,
      location: clubRow.location,
      contact_email: clubRow.contact_email,
      contact_phone: clubRow.contact_phone,
      logo_url: clubRow.logo_url,
      website_url: clubRow.website_url,
      sport_types: parseJsonField<string>(clubRow.sport_types),
      verified: Boolean(clubRow.verified),
      application_status: clubRow.application_status,
      admin_notes: clubRow.admin_notes,
      reviewed_by: clubRow.reviewed_by,
      reviewed_at: clubRow.reviewed_at,
      created_at: clubRow.created_at,
      updated_at: clubRow.updated_at
    };

    // Get application history
    const historyResult = await getApplicationHistory(id);
    if (!historyResult.success) {
      throw new Error(historyResult.error);
    }

    // Get admin user details if reviewed
    let adminUser = undefined;
    if (club.reviewed_by) {
      const adminQuery = `
        SELECT ar.email 
        FROM admin_roles ar 
        WHERE ar.user_id = ?1
      `;
      const adminRow = await executeQueryFirst<{ email: string }>(adminQuery, [club.reviewed_by]);

      if (adminRow) {
        adminUser = {
          email: adminRow.email,
          name: adminRow.email // Using email as name for now
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
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}/**
 * Approve a club application with status updates and history logging
 */
export async function approveClubApplication(
  clubId: string,
  adminUserId: string,
  adminNotes?: string,
  db?: D1Database
): Promise<ApiResponse<Club>> {
  try {
    // Verify user is admin
    const adminCheckQuery = 'SELECT is_admin FROM admin_roles WHERE user_id = ?1';
    const adminCheck = await executeQueryFirst<{ is_admin: boolean }>(adminCheckQuery, [adminUserId]);
    
    if (!adminCheck?.is_admin) {
      throw new Error('Admin privileges required');
    }

    const sanitizedNotes = adminNotes ? sanitizeObject({ notes: adminNotes }).notes : null;

    // Update club status to approved
    const updateQuery = `
      UPDATE clubs 
      SET application_status = 'approved',
          admin_notes = ?1,
          reviewed_by = ?2,
          reviewed_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?3
    `;

    const updateResult = await executeUpdate(updateQuery, [sanitizedNotes, adminUserId, clubId]);

    if (!updateResult.success) {
      throw new Error('Failed to update club status');
    }

    // Get updated club data
    const clubQuery = 'SELECT * FROM clubs WHERE id = ?1';
    const clubRow = await executeQueryFirst<any>(clubQuery, [clubId]);

    if (!clubRow) {
      throw new Error('Club not found after update');
    }

    // Transform club data
    const club: Club = {
      id: clubRow.id,
      name: clubRow.name,
      description: clubRow.description,
      location: clubRow.location,
      contact_email: clubRow.contact_email,
      contact_phone: clubRow.contact_phone,
      logo_url: clubRow.logo_url,
      website_url: clubRow.website_url,
      sport_types: parseJsonField<string>(clubRow.sport_types),
      verified: Boolean(clubRow.verified),
      application_status: clubRow.application_status,
      admin_notes: clubRow.admin_notes,
      reviewed_by: clubRow.reviewed_by,
      reviewed_at: clubRow.reviewed_at,
      created_at: clubRow.created_at,
      updated_at: clubRow.updated_at
    };

    // Send approval notification email
    try {
      const notificationService = createNotificationService(db);
      const notificationResult = await notificationService.sendApprovalNotification({
        id: club.id,
        name: club.name,
        email: club.contact_email,
        contact_name: club.name, // Using club name as contact name for now
        application_status: club.application_status
      });

      if (!notificationResult.success) {
        console.error('Failed to send approval notification:', notificationResult.error);
        // Don't fail the approval process if email fails
      }
    } catch (emailError) {
      console.error('Error sending approval notification:', emailError);
      // Don't fail the approval process if email fails
    }

    // History logging is handled by the database trigger

    return { success: true, data: club };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Reject a club application with required notes and notifications
 */
export async function rejectClubApplication(
  clubId: string,
  adminUserId: string,
  rejectionReason: string,
  db?: D1Database
): Promise<ApiResponse<Club>> {
  try {
    if (!rejectionReason || rejectionReason.trim().length === 0) {
      throw new Error('Rejection reason is required');
    }

    // Verify user is admin
    const adminCheckQuery = 'SELECT is_admin FROM admin_roles WHERE user_id = ?1';
    const adminCheck = await executeQueryFirst<{ is_admin: boolean }>(adminCheckQuery, [adminUserId]);
    
    if (!adminCheck?.is_admin) {
      throw new Error('Admin privileges required');
    }

    const sanitizedReason = sanitizeObject({ reason: rejectionReason.trim() }).reason;

    // Update club status to rejected
    const updateQuery = `
      UPDATE clubs 
      SET application_status = 'rejected',
          admin_notes = ?1,
          reviewed_by = ?2,
          reviewed_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?3
    `;

    const updateResult = await executeUpdate(updateQuery, [sanitizedReason, adminUserId, clubId]);

    if (!updateResult.success) {
      throw new Error('Failed to update club status');
    }

    // Get updated club data
    const clubQuery = 'SELECT * FROM clubs WHERE id = ?1';
    const clubRow = await executeQueryFirst<any>(clubQuery, [clubId]);

    if (!clubRow) {
      throw new Error('Club not found after update');
    }

    // Transform club data
    const club: Club = {
      id: clubRow.id,
      name: clubRow.name,
      description: clubRow.description,
      location: clubRow.location,
      contact_email: clubRow.contact_email,
      contact_phone: clubRow.contact_phone,
      logo_url: clubRow.logo_url,
      website_url: clubRow.website_url,
      sport_types: parseJsonField<string>(clubRow.sport_types),
      verified: Boolean(clubRow.verified),
      application_status: clubRow.application_status,
      admin_notes: clubRow.admin_notes,
      reviewed_by: clubRow.reviewed_by,
      reviewed_at: clubRow.reviewed_at,
      created_at: clubRow.created_at,
      updated_at: clubRow.updated_at
    };

    // Send rejection notification email
    try {
      const notificationService = createNotificationService(db);
      const notificationResult = await notificationService.sendRejectionNotification({
        id: club.id,
        name: club.name,
        email: club.contact_email,
        contact_name: club.name, // Using club name as contact name for now
        application_status: club.application_status
      }, sanitizedReason);

      if (!notificationResult.success) {
        console.error('Failed to send rejection notification:', notificationResult.error);
        // Don't fail the rejection process if email fails
      }
    } catch (emailError) {
      console.error('Error sending rejection notification:', emailError);
      // Don't fail the rejection process if email fails
    }

    // History logging is handled by the database trigger

    return { success: true, data: club };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Get application history for audit trail retrieval
 */
export async function getApplicationHistory(clubId: string): Promise<ApiResponse<ClubApplicationHistory[]>> {
  try {
    const historyQuery = `
      SELECT 
        h.id,
        h.club_id,
        h.admin_id,
        h.action,
        h.notes,
        h.created_at,
        ar.email as admin_email
      FROM club_application_history h
      LEFT JOIN admin_roles ar ON h.admin_id = ar.user_id
      WHERE h.club_id = ?1
      ORDER BY h.created_at DESC
    `;

    const result = await executeQuery<any>(historyQuery, [clubId]);

    // Transform the data to match our interface
    const history: ClubApplicationHistory[] = (result.results || []).map(row => ({
      id: row.id,
      club_id: row.club_id,
      admin_id: row.admin_id,
      action: row.action,
      notes: row.notes,
      created_at: row.created_at,
      admin_email: row.admin_email,
      admin_name: row.admin_email // Using email as name for now
    }));

    return { success: true, data: history };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Bulk approve multiple club applications
 */
export async function bulkApproveApplications(
  clubIds: string[],
  adminUserId: string,
  adminNotes?: string,
  db?: D1Database
): Promise<ApiResponse<{ successful: string[]; failed: { id: string; error: string }[] }>> {
  try {
    if (!clubIds || clubIds.length === 0) {
      throw new Error('No club IDs provided');
    }

    // Verify user is admin
    const adminCheckQuery = 'SELECT is_admin FROM admin_roles WHERE user_id = ?1';
    const adminCheck = await executeQueryFirst<{ is_admin: boolean }>(adminCheckQuery, [adminUserId]);
    
    if (!adminCheck?.is_admin) {
      throw new Error('Admin privileges required');
    }

    const successful: string[] = [];
    const failed: { id: string; error: string }[] = [];

    // Log bulk operation start
    await logBulkOperation(adminUserId, 'bulk_approve_start', {
      club_ids: clubIds,
      admin_notes: adminNotes,
      total_count: clubIds.length
    });

    // Process each club individually to handle partial failures
    for (const clubId of clubIds) {
      try {
        const result = await approveClubApplication(clubId, adminUserId, adminNotes, db);
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

    // Log bulk operation completion
    await logBulkOperation(adminUserId, 'bulk_approve_complete', {
      successful_count: successful.length,
      failed_count: failed.length,
      successful_ids: successful,
      failed_details: failed
    });

    return {
      success: true,
      data: { successful, failed }
    };
  } catch (error) {
    // Log bulk operation failure
    try {
      await logBulkOperation(adminUserId, 'bulk_approve_error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        club_ids: clubIds
      });
    } catch (logError) {
      // Ignore logging errors to not mask the original error
      console.error('Failed to log bulk operation error:', logError);
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Log bulk operations for audit trail
 */
async function logBulkOperation(
  adminId: string,
  action: string,
  details: Record<string, any>
): Promise<void> {
  try {
    const logQuery = `
      INSERT INTO club_application_history (id, club_id, admin_id, action, notes, created_at)
      VALUES (?1, NULL, ?2, ?3, ?4, CURRENT_TIMESTAMP)
    `;
    
    const logId = generateId();
    const detailsJson = JSON.stringify(details);
    
    await executeUpdate(logQuery, [logId, adminId, action, detailsJson]);
  } catch (error) {
    // Log errors silently - don't fail the main operation
    console.error('Failed to log bulk operation:', error);
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
    // Get counts for each status in a single query
    const statsQuery = `
      SELECT 
        SUM(CASE WHEN application_status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN application_status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN application_status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        COUNT(*) as total
      FROM clubs
    `;

    const result = await executeQueryFirst<{
      pending: number;
      approved: number;
      rejected: number;
      total: number;
    }>(statsQuery);

    if (!result) {
      throw new Error('Failed to get statistics');
    }

    return {
      success: true,
      data: {
        pending: result.pending || 0,
        approved: result.approved || 0,
        rejected: result.rejected || 0,
        total: result.total || 0
      }
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Get bulk operation history for audit purposes
 */
export async function getBulkOperationHistory(
  adminId?: string,
  limit: number = 50
): Promise<ApiResponse<Array<{
  id: string;
  admin_id: string;
  admin_email: string;
  action: string;
  details: Record<string, any>;
  created_at: string;
}>>> {
  try {
    let whereClause = 'WHERE h.club_id IS NULL AND h.action LIKE \'bulk_%\'';
    let params: any[] = [];
    let paramIndex = 1;

    if (adminId) {
      whereClause += ` AND h.admin_id = ?${paramIndex}`;
      params.push(adminId);
      paramIndex++;
    }

    const historyQuery = `
      SELECT 
        h.id,
        h.admin_id,
        h.action,
        h.notes as details,
        h.created_at,
        ar.email as admin_email
      FROM club_application_history h
      LEFT JOIN admin_roles ar ON h.admin_id = ar.user_id
      ${whereClause}
      ORDER BY h.created_at DESC
      LIMIT ?${paramIndex}
    `;
    params.push(limit);

    const result = await executeQuery<any>(historyQuery, params);

    // Transform the data
    const history = (result.results || []).map(row => ({
      id: row.id,
      admin_id: row.admin_id,
      admin_email: row.admin_email,
      action: row.action,
      details: row.details ? JSON.parse(row.details) : {},
      created_at: row.created_at
    }));

    return { success: true, data: history };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}