/**
 * Volunteer Opportunities Data Access Layer
 * Handles all database operations for volunteer opportunities
 */

import { supabase } from '@/integrations/supabase/client';
import { VolunteerOpportunity, OpportunityFormData, OpportunityFilters, ApiResponse } from '@/types';
import { handleSupabaseError } from '@/lib/react-query-error-handler';
import { sanitizeObject } from '@/lib/sanitization';

/**
 * Create a new volunteer opportunity
 */
export async function createOpportunity(clubId: string, data: OpportunityFormData): Promise<ApiResponse<VolunteerOpportunity>> {
  try {
    const sanitizedData = sanitizeObject(data);
    
    const opportunityData = {
      ...sanitizedData,
      club_id: clubId,
      status: 'active' as const,
    };

    const { data: opportunity, error } = await supabase
      .from('volunteer_opportunities')
      .insert([opportunityData])
      .select(`
        *,
        club:clubs(*)
      `)
      .single();

    if (error) throw error;

    return { success: true, data: opportunity };
  } catch (error) {
    const appError = handleSupabaseError(error);
    return { success: false, error: appError.message };
  }
}

/**
 * Get opportunity by ID with club information
 */
export async function getOpportunityById(id: string): Promise<ApiResponse<VolunteerOpportunity>> {
  try {
    const { data: opportunity, error } = await supabase
      .from('volunteer_opportunities')
      .select(`
        *,
        club:clubs(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    return { success: true, data: opportunity };
  } catch (error) {
    const appError = handleSupabaseError(error);
    return { success: false, error: appError.message };
  }
}

/**
 * Get opportunities with optional filtering
 */
export async function getOpportunities(filters?: OpportunityFilters & {
  limit?: number;
  offset?: number;
  clubId?: string;
}): Promise<ApiResponse<VolunteerOpportunity[]>> {
  try {
    let query = supabase
      .from('volunteer_opportunities')
      .select(`
        *,
        club:clubs(*)
      `);

    // Only show active opportunities by default
    query = query.eq('status', 'active');

    if (filters?.clubId) {
      query = query.eq('club_id', filters.clubId);
    }

    if (filters?.location) {
      query = query.ilike('location', `%${filters.location}%`);
    }

    if (filters?.required_skills && filters.required_skills.length > 0) {
      query = query.overlaps('required_skills', filters.required_skills);
    }

    if (filters?.time_commitment) {
      query = query.ilike('time_commitment', `%${filters.time_commitment}%`);
    }

    if (filters?.is_recurring !== undefined) {
      query = query.eq('is_recurring', filters.is_recurring);
    }

    if (filters?.start_date) {
      query = query.gte('start_date', filters.start_date);
    }

    if (filters?.end_date) {
      query = query.lte('end_date', filters.end_date);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data: opportunities, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, data: opportunities || [] };
  } catch (error) {
    const appError = handleSupabaseError(error);
    return { success: false, error: appError.message };
  }
}

/**
 * Update opportunity
 */
export async function updateOpportunity(id: string, data: Partial<OpportunityFormData>): Promise<ApiResponse<VolunteerOpportunity>> {
  try {
    const sanitizedData = sanitizeObject(data);
    
    const { data: opportunity, error } = await supabase
      .from('volunteer_opportunities')
      .update({ ...sanitizedData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(`
        *,
        club:clubs(*)
      `)
      .single();

    if (error) throw error;

    return { success: true, data: opportunity };
  } catch (error) {
    const appError = handleSupabaseError(error);
    return { success: false, error: appError.message };
  }
}

/**
 * Update opportunity status
 */
export async function updateOpportunityStatus(
  id: string, 
  status: 'active' | 'filled' | 'cancelled'
): Promise<ApiResponse<VolunteerOpportunity>> {
  try {
    const { data: opportunity, error } = await supabase
      .from('volunteer_opportunities')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(`
        *,
        club:clubs(*)
      `)
      .single();

    if (error) throw error;

    return { success: true, data: opportunity };
  } catch (error) {
    const appError = handleSupabaseError(error);
    return { success: false, error: appError.message };
  }
}

/**
 * Delete opportunity
 */
export async function deleteOpportunity(id: string): Promise<ApiResponse<void>> {
  try {
    const { error } = await supabase
      .from('volunteer_opportunities')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    const appError = handleSupabaseError(error);
    return { success: false, error: appError.message };
  }
}

/**
 * Get opportunities by club ID
 */
export async function getOpportunitiesByClub(clubId: string): Promise<ApiResponse<VolunteerOpportunity[]>> {
  try {
    const { data: opportunities, error } = await supabase
      .from('volunteer_opportunities')
      .select(`
        *,
        club:clubs(*)
      `)
      .eq('club_id', clubId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, data: opportunities || [] };
  } catch (error) {
    const appError = handleSupabaseError(error);
    return { success: false, error: appError.message };
  }
}

/**
 * Search opportunities by text
 */
export async function searchOpportunities(searchTerm: string, limit: number = 10): Promise<ApiResponse<VolunteerOpportunity[]>> {
  try {
    const { data: opportunities, error } = await supabase
      .from('volunteer_opportunities')
      .select(`
        *,
        club:clubs(*)
      `)
      .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .eq('status', 'active')
      .limit(limit)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, data: opportunities || [] };
  } catch (error) {
    const appError = handleSupabaseError(error);
    return { success: false, error: appError.message };
  }
}

/**
 * Get opportunity count by filters
 */
export async function getOpportunityCount(filters?: OpportunityFilters & { clubId?: string }): Promise<ApiResponse<number>> {
  try {
    let query = supabase
      .from('volunteer_opportunities')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    if (filters?.clubId) {
      query = query.eq('club_id', filters.clubId);
    }

    if (filters?.location) {
      query = query.ilike('location', `%${filters.location}%`);
    }

    if (filters?.required_skills && filters.required_skills.length > 0) {
      query = query.overlaps('required_skills', filters.required_skills);
    }

    if (filters?.time_commitment) {
      query = query.ilike('time_commitment', `%${filters.time_commitment}%`);
    }

    if (filters?.is_recurring !== undefined) {
      query = query.eq('is_recurring', filters.is_recurring);
    }

    if (filters?.start_date) {
      query = query.gte('start_date', filters.start_date);
    }

    if (filters?.end_date) {
      query = query.lte('end_date', filters.end_date);
    }

    const { count, error } = await query;

    if (error) throw error;

    return { success: true, data: count || 0 };
  } catch (error) {
    const appError = handleSupabaseError(error);
    return { success: false, error: appError.message };
  }
}

/**
 * Get recent opportunities
 */
export async function getRecentOpportunities(limit: number = 10): Promise<ApiResponse<VolunteerOpportunity[]>> {
  try {
    const { data: opportunities, error } = await supabase
      .from('volunteer_opportunities')
      .select(`
        *,
        club:clubs(*)
      `)
      .eq('status', 'active')
      .limit(limit)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, data: opportunities || [] };
  } catch (error) {
    const appError = handleSupabaseError(error);
    return { success: false, error: appError.message };
  }
}