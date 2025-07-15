/**
 * Volunteer Data Access Layer
 * Handles all database operations for volunteer profiles
 */

import { supabase } from '@/integrations/supabase/client';
import { VolunteerProfile, VolunteerRegistrationData, VolunteerFilters, ApiResponse } from '@/types';
import { handleSupabaseError } from '@/lib/react-query-error-handler';
import { sanitizeObject } from '@/lib/sanitization';

/**
 * Create a new volunteer profile
 */
export async function createVolunteerProfile(data: VolunteerRegistrationData): Promise<ApiResponse<VolunteerProfile>> {
  try {
    const sanitizedData = sanitizeObject(data);
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const profileData = {
      ...sanitizedData,
      user_id: user.id,
    };

    const { data: profile, error } = await supabase
      .from('volunteer_profiles')
      .insert([profileData])
      .select()
      .single();

    if (error) throw error;

    return { success: true, data: profile };
  } catch (error) {
    const appError = handleSupabaseError(error);
    return { success: false, error: appError.message };
  }
}

/**
 * Get volunteer profile by user ID
 */
export async function getVolunteerProfileByUserId(userId: string): Promise<ApiResponse<VolunteerProfile>> {
  try {
    const { data: profile, error } = await supabase
      .from('volunteer_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    return { success: true, data: profile };
  } catch (error) {
    const appError = handleSupabaseError(error);
    return { success: false, error: appError.message };
  }
}

/**
 * Get volunteer profile by ID
 */
export async function getVolunteerProfileById(id: string): Promise<ApiResponse<VolunteerProfile>> {
  try {
    const { data: profile, error } = await supabase
      .from('volunteer_profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return { success: true, data: profile };
  } catch (error) {
    const appError = handleSupabaseError(error);
    return { success: false, error: appError.message };
  }
}

/**
 * Update volunteer profile
 */
export async function updateVolunteerProfile(id: string, data: Partial<VolunteerRegistrationData>): Promise<ApiResponse<VolunteerProfile>> {
  try {
    const sanitizedData = sanitizeObject(data);
    
    const { data: profile, error } = await supabase
      .from('volunteer_profiles')
      .update({ ...sanitizedData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data: profile };
  } catch (error) {
    const appError = handleSupabaseError(error);
    return { success: false, error: appError.message };
  }
}

/**
 * Delete volunteer profile
 */
export async function deleteVolunteerProfile(id: string): Promise<ApiResponse<void>> {
  try {
    const { error } = await supabase
      .from('volunteer_profiles')
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
 * Search volunteers with filters
 */
export async function searchVolunteers(filters: VolunteerFilters & {
  limit?: number;
  offset?: number;
}): Promise<ApiResponse<VolunteerProfile[]>> {
  try {
    let query = supabase
      .from('volunteer_profiles')
      .select('*')
      .eq('is_visible', true);

    if (filters.location) {
      query = query.ilike('location', `%${filters.location}%`);
    }

    if (filters.skills && filters.skills.length > 0) {
      query = query.overlaps('skills', filters.skills);
    }

    if (filters.availability && filters.availability.length > 0) {
      query = query.overlaps('availability', filters.availability);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data: volunteers, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, data: volunteers || [] };
  } catch (error) {
    const appError = handleSupabaseError(error);
    return { success: false, error: appError.message };
  }
}

/**
 * Get all visible volunteer profiles
 */
export async function getVisibleVolunteers(limit: number = 50, offset: number = 0): Promise<ApiResponse<VolunteerProfile[]>> {
  try {
    const { data: volunteers, error } = await supabase
      .from('volunteer_profiles')
      .select('*')
      .eq('is_visible', true)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, data: volunteers || [] };
  } catch (error) {
    const appError = handleSupabaseError(error);
    return { success: false, error: appError.message };
  }
}

/**
 * Update volunteer profile visibility
 */
export async function updateVolunteerVisibility(id: string, isVisible: boolean): Promise<ApiResponse<VolunteerProfile>> {
  try {
    const { data: profile, error } = await supabase
      .from('volunteer_profiles')
      .update({ is_visible: isVisible, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data: profile };
  } catch (error) {
    const appError = handleSupabaseError(error);
    return { success: false, error: appError.message };
  }
}

/**
 * Search volunteers by name or skills
 */
export async function searchVolunteersByText(searchTerm: string, limit: number = 10): Promise<ApiResponse<VolunteerProfile[]>> {
  try {
    const { data: volunteers, error } = await supabase
      .from('volunteer_profiles')
      .select('*')
      .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,bio.ilike.%${searchTerm}%`)
      .eq('is_visible', true)
      .limit(limit)
      .order('first_name');

    if (error) throw error;

    return { success: true, data: volunteers || [] };
  } catch (error) {
    const appError = handleSupabaseError(error);
    return { success: false, error: appError.message };
  }
}

/**
 * Get volunteer count by filters
 */
export async function getVolunteerCount(filters?: VolunteerFilters): Promise<ApiResponse<number>> {
  try {
    let query = supabase
      .from('volunteer_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_visible', true);

    if (filters?.location) {
      query = query.ilike('location', `%${filters.location}%`);
    }

    if (filters?.skills && filters.skills.length > 0) {
      query = query.overlaps('skills', filters.skills);
    }

    if (filters?.availability && filters.availability.length > 0) {
      query = query.overlaps('availability', filters.availability);
    }

    const { count, error } = await query;

    if (error) throw error;

    return { success: true, data: count || 0 };
  } catch (error) {
    const appError = handleSupabaseError(error);
    return { success: false, error: appError.message };
  }
}