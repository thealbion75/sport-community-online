/**
 * Authentication React Query Hooks
 * Custom hooks for authentication and user management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  signUp,
  signIn,
  signOut,
  getCurrentUser,
  getCurrentSession,
  resetPassword,
  updatePassword,
  updateEmail,
  isUserAdmin,
  getUserRole,
  hasPermission,
  onAuthStateChange
} from '@/lib/supabase/auth';
import { UserRole } from '@/types';
import { useToast } from './use-toast';
import { useEffect } from 'react';

// Query keys
export const authKeys = {
  all: ['auth'] as const,
  user: () => [...authKeys.all, 'user'] as const,
  session: () => [...authKeys.all, 'session'] as const,
  role: (userId?: string) => [...authKeys.all, 'role', userId] as const,
  isAdmin: (userId?: string) => [...authKeys.all, 'isAdmin', userId] as const,
  permission: (action: string, userId?: string) => [...authKeys.all, 'permission', action, userId] as const,
};

/**
 * Hook to get current user
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.user(),
    queryFn: () => getCurrentUser(),
    select: (data) => data.success ? data.data : null,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });
}

/**
 * Hook to get current session
 */
export function useCurrentSession() {
  return useQuery({
    queryKey: authKeys.session(),
    queryFn: () => getCurrentSession(),
    select: (data) => data.success ? data.data : null,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });
}

/**
 * Hook to get user role
 */
export function useUserRole(userId?: string) {
  return useQuery({
    queryKey: authKeys.role(userId),
    queryFn: () => getUserRole(userId),
    select: (data) => data.success ? data.data : UserRole.VOLUNTEER,
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: true, // Always enabled, will use current user if no userId provided
  });
}

/**
 * Hook to check if user is admin
 */
export function useIsUserAdmin(userId?: string) {
  return useQuery({
    queryKey: authKeys.isAdmin(userId),
    queryFn: () => isUserAdmin(userId),
    select: (data) => data.success ? data.data : false,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to check user permissions
 */
export function useHasPermission(
  action: 'create_club' | 'verify_club' | 'moderate_content' | 'manage_users',
  userId?: string
) {
  return useQuery({
    queryKey: authKeys.permission(action, userId),
    queryFn: () => hasPermission(action, userId),
    select: (data) => data.success ? data.data : false,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to sign up a new user
 */
export function useSignUp() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => 
      signUp(email, password),
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Account created successfully! Please check your email to verify your account.',
          variant: 'success',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to create account',
          variant: 'destructive',
        });
      }
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create account. Please try again.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to sign in a user
 */
export function useSignIn() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => 
      signIn(email, password),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: authKeys.all });
        toast({
          title: 'Success',
          description: 'Signed in successfully!',
          variant: 'success',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to sign in',
          variant: 'destructive',
        });
      }
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to sign in. Please try again.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to sign out a user
 */
export function useSignOut() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => signOut(),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.clear(); // Clear all cached data
        toast({
          title: 'Success',
          description: 'Signed out successfully!',
          variant: 'success',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to sign out',
          variant: 'destructive',
        });
      }
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to sign out. Please try again.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to reset password
 */
export function useResetPassword() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (email: string) => resetPassword(email),
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Password reset email sent! Please check your inbox.',
          variant: 'success',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to send reset email',
          variant: 'destructive',
        });
      }
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to send reset email. Please try again.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to update password
 */
export function useUpdatePassword() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (newPassword: string) => updatePassword(newPassword),
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Password updated successfully!',
          variant: 'success',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update password',
          variant: 'destructive',
        });
      }
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update password. Please try again.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to update email
 */
export function useUpdateEmail() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (newEmail: string) => updateEmail(newEmail),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: authKeys.user() });
        toast({
          title: 'Success',
          description: 'Email update initiated! Please check both your old and new email for confirmation.',
          variant: 'success',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update email',
          variant: 'destructive',
        });
      }
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update email. Please try again.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to listen to auth state changes
 */
export function useAuthStateChange() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const { data: { subscription } } = onAuthStateChange((event, session) => {
      // Invalidate auth queries when auth state changes
      queryClient.invalidateQueries({ queryKey: authKeys.all });
      
      // Handle specific events
      if (event === 'SIGNED_IN') {
        console.log('User signed in:', session?.user?.email);
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out');
        queryClient.clear(); // Clear all cached data on sign out
      }
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);
}