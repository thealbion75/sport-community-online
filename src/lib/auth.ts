/**
 * Authentication utilities and helpers
 * Provides role-based access control and user management
 */

import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { UserRole } from '@/types';

/**
 * Get current authenticated user
 */
export const getCurrentUser = async (): Promise<User | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

/**
 * Get user role based on email and profile data
 */
export const getUserRole = async (user: User): Promise<UserRole> => {
  try {
    // Check if user is platform admin
    const { data: adminRole } = await supabase
      .from('admin_roles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (adminRole?.is_admin) {
      return UserRole.PLATFORM_ADMIN;
    }

    // Check if user is club admin (has a club with their email)
    const { data: club } = await supabase
      .from('clubs')
      .select('id')
      .eq('contact_email', user.email)
      .single();

    if (club) {
      return UserRole.CLUB_ADMIN;
    }

    // Default to volunteer role
    return UserRole.VOLUNTEER;
  } catch (error) {
    console.error('Error determining user role:', error);
    return UserRole.VOLUNTEER;
  }
};

/**
 * Check if user has specific role
 */
export const hasRole = async (user: User, role: UserRole): Promise<boolean> => {
  const userRole = await getUserRole(user);
  return userRole === role;
};

/**
 * Check if user is platform admin
 */
export const isPlatformAdmin = async (user: User): Promise<boolean> => {
  return hasRole(user, UserRole.PLATFORM_ADMIN);
};

/**
 * Check if user is club admin
 */
export const isClubAdmin = async (user: User): Promise<boolean> => {
  return hasRole(user, UserRole.CLUB_ADMIN);
};

/**
 * Check if user is volunteer
 */
export const isVolunteer = async (user: User): Promise<boolean> => {
  return hasRole(user, UserRole.VOLUNTEER);
};

/**
 * Get club ID for club admin user
 */
export const getClubIdForUser = async (user: User): Promise<string | null> => {
  try {
    const { data: club } = await supabase
      .from('clubs')
      .select('id')
      .eq('contact_email', user.email)
      .single();

    return club?.id || null;
  } catch (error) {
    console.error('Error getting club ID for user:', error);
    return null;
  }
};

/**
 * Check if user can access club data
 */
export const canAccessClub = async (user: User, clubId: string): Promise<boolean> => {
  try {
    // Platform admins can access all clubs
    if (await isPlatformAdmin(user)) {
      return true;
    }

    // Club admins can only access their own club
    const userClubId = await getClubIdForUser(user);
    return userClubId === clubId;
  } catch (error) {
    console.error('Error checking club access:', error);
    return false;
  }
};

/**
 * Check if user can manage opportunity
 */
export const canManageOpportunity = async (user: User, opportunityId: string): Promise<boolean> => {
  try {
    // Platform admins can manage all opportunities
    if (await isPlatformAdmin(user)) {
      return true;
    }

    // Get opportunity's club
    const { data: opportunity } = await supabase
      .from('volunteer_opportunities')
      .select('club_id')
      .eq('id', opportunityId)
      .single();

    if (!opportunity) {
      return false;
    }

    // Check if user can access this club
    return canAccessClub(user, opportunity.club_id);
  } catch (error) {
    console.error('Error checking opportunity access:', error);
    return false;
  }
};

/**
 * Sign out user
 */
export const signOut = async (): Promise<void> => {
  await supabase.auth.signOut();
};

/**
 * Sign in with email and password
 */
export const signIn = async (email: string, password: string) => {
  return await supabase.auth.signInWithPassword({
    email,
    password,
  });
};

/**
 * Sign up with email and password
 */
export const signUp = async (email: string, password: string) => {
  return await supabase.auth.signUp({
    email,
    password,
  });
};

/**
 * Reset password
 */
export const resetPassword = async (email: string) => {
  return await supabase.auth.resetPasswordForEmail(email);
};

/**
 * Update password
 */
export const updatePassword = async (password: string) => {
  return await supabase.auth.updateUser({
    password,
  });
};