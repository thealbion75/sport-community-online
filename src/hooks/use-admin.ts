/**
 * Admin React Query Hooks
 * Custom hooks for platform administration functionality
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from './use-toast';
import { useAuth } from '@/contexts/AuthContext';

// Query keys
export const adminKeys = {
  all: ['admin'] as const,
  isAdmin: (userId?: string) => [...adminKeys.all, 'isAdmin', userId] as const,
  reports: () => [...adminKeys.all, 'reports'] as const,
  actions: () => [...adminKeys.all, 'actions'] as const,
  platformStats: () => [...adminKeys.all, 'platformStats'] as const,
};

/**
 * Hook to check if current user is platform admin
 */
export function useIsAdmin() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: adminKeys.isAdmin(user?.id),
    queryFn: async () => {
      if (!user) return false;

      try {
        const response = await fetch('/api/admin/check-role', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('d1_session') ? JSON.parse(localStorage.getItem('d1_session')!).access_token : ''}`,
          },
        });

        if (!response.ok) {
          return false;
        }

        const result = await response.json();
        return result.success && result.data?.is_admin || false;
      } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
      }
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to get platform statistics
 */
export function usePlatformStats() {
  return useQuery({
    queryKey: adminKeys.platformStats(),
    queryFn: async () => {
      try {
        const response = await fetch('/api/admin/platform-stats', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('d1_session') ? JSON.parse(localStorage.getItem('d1_session')!).access_token : ''}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch platform statistics');
        }

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch platform statistics');
        }

        return result.data || {
          total_clubs: 0,
          verified_clubs: 0,
          total_volunteers: 0,
          total_opportunities: 0,
          total_applications: 0,
          active_users: 0,
        };
      } catch (error) {
        console.error('Error fetching platform stats:', error);
        throw new Error('Failed to fetch platform statistics');
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to suspend a user account
 */
export function useSuspendUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      // In a real implementation, this would call an admin API to suspend the user
      // For now, we'll simulate the action
      console.log(`Suspending user ${userId} for reason: ${reason}`);
      
      const response = await fetch('/api/admin/suspend-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('d1_session') ? JSON.parse(localStorage.getItem('d1_session')!).access_token : ''}`,
        },
        body: JSON.stringify({ user_id: userId, suspension_reason: reason }),
      });

      if (!response.ok) {
        throw new Error('Failed to suspend user');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to suspend user');
      }

      return { userId, reason };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
      toast({
        title: 'Success',
        description: 'User has been suspended successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to handle content moderation actions
 */
export function useModerateContent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      contentId, 
      contentType, 
      action, 
      reason 
    }: { 
      contentId: string; 
      contentType: 'opportunity' | 'profile' | 'message' | 'club';
      action: 'approve' | 'remove' | 'flag';
      reason: string;
    }) => {
      // In a real implementation, this would call moderation APIs
      console.log(`Moderating ${contentType} ${contentId}: ${action} - ${reason}`);
      
      const response = await fetch('/api/admin/moderate-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('d1_session') ? JSON.parse(localStorage.getItem('d1_session')!).access_token : ''}`,
        },
        body: JSON.stringify({
          content_id: contentId,
          content_type: contentType,
          moderation_action: action,
          moderation_reason: reason
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to moderate content');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to moderate content');
      }

      return { contentId, contentType, action, reason };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.reports() });
      toast({
        title: 'Success',
        description: `Content ${data.action} action completed successfully.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to get content reports (mock data for now)
 */
export function useContentReports() {
  return useQuery({
    queryKey: adminKeys.reports(),
    queryFn: async () => {
      // In a real implementation, this would fetch from a reports table
      // For now, returning mock data
      return [
        {
          id: '1',
          type: 'opportunity' as const,
          content_id: 'opp-1',
          reporter_id: 'user-1',
          reason: 'Inappropriate content',
          description: 'This opportunity contains inappropriate language',
          status: 'pending' as const,
          created_at: new Date().toISOString(),
          content_preview: 'Looking for volunteers to help with...',
          content_author: 'East Grinstead FC'
        }
      ];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to create admin role for user
 */
export function useCreateAdminRole() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, email }: { userId: string; email: string }) => {
      const response = await fetch('/api/admin/create-admin-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('d1_session') ? JSON.parse(localStorage.getItem('d1_session')!).access_token : ''}`,
        },
        body: JSON.stringify({ user_id: userId, email }),
      });

      if (!response.ok) {
        throw new Error('Failed to create admin role');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to create admin role');
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
      toast({
        title: 'Success',
        description: 'Admin role created successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}