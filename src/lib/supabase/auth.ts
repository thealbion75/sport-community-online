/**
 * Authentication Data Access Layer
 * Handles authentication and user management operations
 */

import { supabase } from '@/integrations/supabase/client';
import { UserRole, ApiResponse } from '@/types';
import { handleSupabaseError } from '@/lib/react-query-error-handler';

/**
 * Sign up a new user
 */
export async function signUp(email: string, password: string): Promise<ApiResponse<{ user: any; session: any }>> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    const appError = handleSupabaseError(error);
    return { success: false, error: appError.message };
  }
}

/**
 * Sign in a user
 */
export async function signIn(email: string, password: string): Promise<ApiResponse<{ user: any; session: any }>> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    const appError = handleSupabaseError(error);
    return { success: false, error: appError.message };
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<ApiResponse<void>> {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) throw error;

    return { success: true };
  } catch (error) {
    const appError = handleSupabaseError(error);
    return { success: false, error: appError.message };
  }
}

/**
 * Get current user
 */
export async function getCurrentUser(): Promise<ApiResponse<any>> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) throw error;

    return { success: true, data: user };
  } catch (error) {
    const appError = handleSupabaseError(error);
    return { success: false, error: appError.message };
  }
}

/**
 * Get current session
 */
export async function getCurrentSession(): Promise<ApiResponse<any>> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) throw error;

    return { success: true, data: session };
  } catch (error) {
    const appError = handleSupabaseError(error);
    return { success: false, error: appError.message };
  }
}

/**
 * Reset password
 */
export async function resetPassword(email: string): Promise<ApiResponse<void>> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    const appError = handleSupabaseError(error);
    return { success: false, error: appError.message };
  }
}

/**
 * Update password
 */
export async function updatePassword(newPassword: string): Promise<ApiResponse<void>> {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    const appError = handleSupabaseError(error);
    return { success: false, error: appError.message };
  }
}

/**
 * Update user email
 */
export async function updateEmail(newEmail: string): Promise<ApiResponse<void>> {
  try {
    const { error } = await supabase.auth.updateUser({
      email: newEmail,
    });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    const appError = handleSupabaseError(error);
    return { success: false, error: appError.message };
  }
}

/**
 * Check if user is admin
 */
export async function isUserAdmin(userId?: string): Promise<ApiResponse<boolean>> {
  try {
    const userIdToCheck = userId || (await getCurrentUser()).data?.id;
    
    if (!userIdToCheck) {
      return { success: true, data: false };
    }

    const { data, error } = await supabase.rpc('is_admin', { user_id: userIdToCheck });

    if (error) throw error;

    return { success: true, data: data || false };
  } catch (error) {
    const appError = handleSupabaseError(error);
    return { success: false, error: appError.message };
  }
}

/**
 * Determine user role based on their data
 */
export async function getUserRole(userId?: string): Promise<ApiResponse<UserRole>> {
  try {
    const userIdToCheck = userId || (await getCurrentUser()).data?.id;
    
    if (!userIdToCheck) {
      throw new Error('User not authenticated');
    }

    // Check if user is platform admin
    const adminResult = await isUserAdmin(userIdToCheck);
    if (adminResult.success && adminResult.data) {
      return { success: true, data: UserRole.PLATFORM_ADMIN };
    }

    // Check if user has a club profile (club admin)
    const { data: clubProfile, error: clubError } = await supabase
      .from('clubs')
      .select('id')
      .eq('contact_email', (await getCurrentUser()).data?.email)
      .maybeSingle();

    if (clubError && clubError.code !== 'PGRST116') {
      throw clubError;
    }

    if (clubProfile) {
      return { success: true, data: UserRole.CLUB_ADMIN };
    }

    // Check if user has a volunteer profile
    const { data: volunteerProfile, error: volunteerError } = await supabase
      .from('volunteer_profiles')
      .select('id')
      .eq('user_id', userIdToCheck)
      .maybeSingle();

    if (volunteerError && volunteerError.code !== 'PGRST116') {
      throw volunteerError;
    }

    if (volunteerProfile) {
      return { success: true, data: UserRole.VOLUNTEER };
    }

    // Default to volunteer if no specific role found
    return { success: true, data: UserRole.VOLUNTEER };
  } catch (error) {
    const appError = handleSupabaseError(error);
    return { success: false, error: appError.message };
  }
}

/**
 * Check if user has permission for a specific action
 */
export async function hasPermission(
  action: 'create_club' | 'verify_club' | 'moderate_content' | 'manage_users',
  userId?: string
): Promise<ApiResponse<boolean>> {
  try {
    const roleResult = await getUserRole(userId);
    
    if (!roleResult.success) {
      return { success: false, error: roleResult.error };
    }

    const userRole = roleResult.data;

    switch (action) {
      case 'create_club':
        return { success: true, data: true }; // Anyone can create a club
      
      case 'verify_club':
      case 'moderate_content':
      case 'manage_users':
        return { success: true, data: userRole === UserRole.PLATFORM_ADMIN };
      
      default:
        return { success: true, data: false };
    }
  } catch (error) {
    const appError = handleSupabaseError(error);
    return { success: false, error: appError.message };
  }
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(callback: (event: string, session: any) => void) {
  return supabase.auth.onAuthStateChange(callback);
}