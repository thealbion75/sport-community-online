/**
 * Club Data Access Layer
 * Handles all database operations for clubs
 */

import { supabase } from '@/integrations/supabase/client';
import { Club, ClubRegistrationData, ApiResponse } from '@/types';
import { handleSupabaseError } from '@/lib/react-query-error-handler';
import { sanitizeObject } from '@/lib/sanitization';

/**
 * Create a new club
 */
export async function createClub(data: ClubRegistrationData): Promise<ApiResponse<Club>> {
  try {
    const sanitizedData = sanitizeObject(data);
    
    const { data: club, error } = await supabase
      .from('clubs')
      .insert([sanitizedData])
      .select()
      .single();

    if (error) throw error;

    return { success: true, data: club };
  } catch (error) {
    const appError = handleSupabaseError(error);
    return { success: false, error: appError.message };
  }
}

/**
 * Get club by ID
 */
export async function getClubById(id: string): Promise<ApiResponse<Club>> {
  try {
    const { data: club, error } = await supabase
      .from('clubs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return { success: true, data: club };
  } catch (error) {
    const appError = handleSupabaseError(error);
    return { success: false, error: appError.message };
  }
}

/**
 * Get all clubs with optional filtering
 */
export async function getClubs(filters?: {
  verified?: boolean;
  sport_types?: string[];
  location?: string;
  limit?: number;
  offset?: number;
}): Promise<ApiResponse<Club[]>> {
  try {
    let query = supabase.from('clubs').select('*');

    if (filters?.verified !== undefined) {
      query = query.eq('verified', filters.verified);
    }

    if (filters?.sport_types && filters.sport_types.length > 0) {
      query = query.overlaps('sport_types', filters.sport_types);
    }

    if (filters?.location) {
      query = query.ilike('location', `%${filters.location}%`);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data: clubs, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, data: clubs || [] };
  } catch (error) {
    const appError = handleSupabaseError(error);
    return { success: false, error: appError.message };
  }
}

/**
 * Update club information
 */
export async function updateClub(id: string, data: Partial<ClubRegistrationData>): Promise<ApiResponse<Club>> {
  try {
    const sanitizedData = sanitizeObject(data);
    
    const { data: club, error } = await supabase
      .from('clubs')
      .update({ ...sanitizedData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data: club };
  } catch (error) {
    const appError = handleSupabaseError(error);
    return { success: false, error: appError.message };
  }
}

/**
 * Delete a club
 */
export async function deleteClub(id: string): Promise<ApiResponse<void>> {
  try {
    const { error } = await supabase
      .from('clubs')
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
 * Verify a club (admin only)
 */
export async function verifyClub(id: string, verified: boolean): Promise<ApiResponse<Club>> {
  try {
    const { data: club, error } = await supabase
      .from('clubs')
      .update({ verified, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data: club };
  } catch (error) {
    const appError = handleSupabaseError(error);
    return { success: false, error: appError.message };
  }
}

/**
 * Get club by contact email (for authentication)
 */
export async function getClubByEmail(email: string): Promise<ApiResponse<Club>> {
  try {
    const { data: club, error } = await supabase
      .from('clubs')
      .select('*')
      .eq('contact_email', email)
      .single();

    if (error) throw error;

    return { success: true, data: club };
  } catch (error) {
    const appError = handleSupabaseError(error);
    return { success: false, error: appError.message };
  }
}

/**
 * Search clubs by name or description
 */
export async function searchClubs(searchTerm: string, limit: number = 10): Promise<ApiResponse<Club[]>> {
  try {
    const { data: clubs, error } = await supabase
      .from('clubs')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .eq('verified', true)
      .limit(limit)
      .order('name');

    if (error) throw error;

    return { success: true, data: clubs || [] };
  } catch (error) {
    const appError = handleSupabaseError(error);
    return { success: false, error: appError.message };
  }
}