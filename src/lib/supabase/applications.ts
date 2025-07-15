/**
 * Volunteer Applications Data Access Layer
 * Handles all database operations for volunteer applications
 */

import { supabase } from '@/integrations/supabase/client';
import { VolunteerApplication, ApplicationFormData, ApiResponse } from '@/types';
import { handleSupabaseError } from '@/lib/react-query-error-handler';
import { sanitizeObject } from '@/lib/sanitization';

/**
 * Create a new application
 */
export async function createApplication(
  opportunityId: string, 
  volunteerId: string, 
  data: ApplicationFormData
): Promise<ApiResponse<VolunteerApplication>> {
  try {
    const sanitizedData = sanitizeObject(data);
    
    const applicationData = {
      opportunity_id: opportunityId,
      volunteer_id: volunteerId,
      message: sanitizedData.message || null,
      status: 'pending' as const,
    };

    const { data: application, error } = await supabase
      .from('volunteer_applications')
      .insert([applicationData])
      .select(`
        *,
        opportunity:volunteer_opportunities(*,
          club:clubs(*)
        ),
        volunteer:volunteer_profiles(*)
      `)
      .single();

    if (error) throw error;

    return { success: true, data: application };
  } catch (error) {
    const appError = handleSupabaseError(error);
    return { success: false, error: appError.message };
  }
}

/**
 * Get application by ID
 */
export async function getApplicationById(id: string): Promise<ApiResponse<VolunteerApplication>> {
  try {
    const { data: application, error } = await supabase
      .from('volunteer_applications')
      .select(`
        *,
        opportunity:volunteer_opportunities(*,
          club:clubs(*)
        ),
        volunteer:volunteer_profiles(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    return { success: true, data: application };
  } catch (error) {
    const appError = handleSupabaseError(error);
    return { success: false, error: appError.message };
  }
}

/**
 * Get applications by volunteer ID
 */
export async function getApplicationsByVolunteer(volunteerId: string): Promise<ApiResponse<VolunteerApplication[]>> {
  try {
    const { data: applications, error } = await supabase
      .from('volunteer_applications')
      .select(`
        *,
        opportunity:volunteer_opportunities(*,
          club:clubs(*)
        )
      `)
      .eq('volunteer_id', volunteerId)
      .order('applied_at', { ascending: false });

    if (error) throw error;

    return { success: true, data: applications || [] };
  } catch (error) {
    const appError = handleSupabaseError(error);
    return { success: false, error: appError.message };
  }
}

/**
 * Get applications by opportunity ID
 */
export async function getApplicationsByOpportunity(opportunityId: string): Promise<ApiResponse<VolunteerApplication[]>> {
  try {
    const { data: applications, error } = await supabase
      .from('volunteer_applications')
      .select(`
        *,
        volunteer:volunteer_profiles(*)
      `)
      .eq('opportunity_id', opportunityId)
      .order('applied_at', { ascending: false });

    if (error) throw error;

    return { success: true, data: applications || [] };
  } catch (error) {
    const appError = handleSupabaseError(error);
    return { success: false, error: appError.message };
  }
}

/**
 * Get applications by club ID
 */
export async function getApplicationsByClub(clubId: string): Promise<ApiResponse<VolunteerApplication[]>> {
  try {
    const { data: applications, error } = await supabase
      .from('volunteer_applications')
      .select(`
        *,
        opportunity:volunteer_opportunities!inner(*),
        volunteer:volunteer_profiles(*)
      `)
      .eq('opportunity.club_id', clubId)
      .order('applied_at', { ascending: false });

    if (error) throw error;

    return { success: true, data: applications || [] };
  } catch (error) {
    const appError = handleSupabaseError(error);
    return { success: false, error: appError.message };
  }
}

/**
 * Update application status
 */
export async function updateApplicationStatus(
  id: string, 
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn'
): Promise<ApiResponse<VolunteerApplication>> {
  try {
    const { data: application, error } = await supabase
      .from('volunteer_applications')
      .update({ 
        status, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select(`
        *,
        opportunity:volunteer_opportunities(*,
          club:clubs(*)
        ),
        volunteer:volunteer_profiles(*)
      `)
      .single();

    if (error) throw error;

    return { success: true, data: application };
  } catch (error) {
    const appError = handleSupabaseError(error);
    return { success: false, error: appError.message };
  }
}

/**
 * Withdraw application (volunteer action)
 */
export async function withdrawApplication(id: string): Promise<ApiResponse<VolunteerApplication>> {
  try {
    return await updateApplicationStatus(id, 'withdrawn');
  } catch (error) {
    const appError = handleSupabaseError(error);
    return { success: false, error: appError.message };
  }
}

/**
 * Accept application (club action)
 */
export async function acceptApplication(id: string): Promise<ApiResponse<VolunteerApplication>> {
  try {
    return await updateApplicationStatus(id, 'accepted');
  } catch (error) {
    const appError = handleSupabaseError(error);
    return { success: false, error: appError.message };
  }
}

/**
 * Reject application (club action)
 */
export async function rejectApplication(id: string): Promise<ApiResponse<VolunteerApplication>> {
  try {
    return await updateApplicationStatus(id, 'rejected');
  } catch (error) {
    const appError = handleSupabaseError(error);
    return { success: false, error: appError.message };
  }
}

/**
 * Delete application
 */
export async function deleteApplication(id: string): Promise<ApiResponse<void>> {
  try {
    const { error } = await supabase
      .from('volunteer_applications')
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
 * Check if volunteer has already applied to opportunity
 */
export async function hasVolunteerApplied(opportunityId: string, volunteerId: string): Promise<ApiResponse<boolean>> {
  try {
    const { data: application, error } = await supabase
      .from('volunteer_applications')
      .select('id')
      .eq('opportunity_id', opportunityId)
      .eq('volunteer_id', volunteerId)
      .maybeSingle();

    if (error) throw error;

    return { success: true, data: !!application };
  } catch (error) {
    const appError = handleSupabaseError(error);
    return { success: false, error: appError.message };
  }
}

/**
 * Get application statistics for a club
 */
export async function getClubApplicationStats(clubId: string): Promise<ApiResponse<{
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
}>> {
  try {
    const { data: applications, error } = await supabase
      .from('volunteer_applications')
      .select(`
        status,
        opportunity:volunteer_opportunities!inner(club_id)
      `)
      .eq('opportunity.club_id', clubId);

    if (error) throw error;

    const stats = {
      total: applications?.length || 0,
      pending: applications?.filter(app => app.status === 'pending').length || 0,
      accepted: applications?.filter(app => app.status === 'accepted').length || 0,
      rejected: applications?.filter(app => app.status === 'rejected').length || 0,
    };

    return { success: true, data: stats };
  } catch (error) {
    const appError = handleSupabaseError(error);
    return { success: false, error: appError.message };
  }
}

/**
 * Get application statistics for a volunteer
 */
export async function getVolunteerApplicationStats(volunteerId: string): Promise<ApiResponse<{
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
  withdrawn: number;
}>> {
  try {
    const { data: applications, error } = await supabase
      .from('volunteer_applications')
      .select('status')
      .eq('volunteer_id', volunteerId);

    if (error) throw error;

    const stats = {
      total: applications?.length || 0,
      pending: applications?.filter(app => app.status === 'pending').length || 0,
      accepted: applications?.filter(app => app.status === 'accepted').length || 0,
      rejected: applications?.filter(app => app.status === 'rejected').length || 0,
      withdrawn: applications?.filter(app => app.status === 'withdrawn').length || 0,
    };

    return { success: true, data: stats };
  } catch (error) {
    const appError = handleSupabaseError(error);
    return { success: false, error: appError.message };
  }
}