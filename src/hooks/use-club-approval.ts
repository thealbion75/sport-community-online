/**
 * Club Approval React Query Hooks
 * Custom hooks for admin club approval data fetching and mutations with enhanced security
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// All club approval operations now use the secure API client
import { 
  Club, 
  ClubApplicationReview, 
  ClubApplicationHistory, 
  ClubApplicationFilters,
  PaginatedResponse 
} from '@/types';
import { useToast } from './use-toast';
import { useSecureAdminApi } from '@/lib/secure-api-client';
import { AdminActionSecurity, SessionManager, CSRF } from '@/lib/security';
import { useAuth } from '@/contexts/AuthContext';

// Query keys for club approval
export const clubApprovalKeys = {
  all: ['club-approval'] as const,
  applications: () => [...clubApprovalKeys.all, 'applications'] as const,
  applicationsList: (filters: ClubApplicationFilters) => [...clubApprovalKeys.applications(), 'list', filters] as const,
  applicationDetail: (id: string) => [...clubApprovalKeys.applications(), 'detail', id] as const,
  history: (clubId: string) => [...clubApprovalKeys.all, 'history', clubId] as const,
  stats: () => [...clubApprovalKeys.all, 'stats'] as const,
};

/**
 * Hook to fetch pending club applications with filtering and caching
 */
export function usePendingApplications(filters?: ClubApplicationFilters) {
  const secureApi = useSecureAdminApi();
  
  return useQuery({
    queryKey: clubApprovalKeys.applicationsList(filters || {}),
    queryFn: async () => {
      const result = await secureApi.getApplications(filters);
      return result.success ? result.data : { data: [], count: 0, page: 1, limit: 10, total_pages: 0 };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors (client errors)
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as any).status;
        if (status >= 400 && status < 500) {
          return false;
        }
      }
      // Retry up to 3 times for network/server errors
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
}

/**
 * Hook to fetch single club application details
 */
export function useClubApplication(id: string) {
  const secureApi = useSecureAdminApi();
  
  return useQuery({
    queryKey: clubApprovalKeys.applicationDetail(id),
    queryFn: async () => {
      const result = await secureApi.getApplication(id);
      return result.success ? result.data : null;
    },
    enabled: !!id,
    staleTime: 1 * 60 * 1000, // 1 minute
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors (client errors)
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as any).status;
        if (status >= 400 && status < 500) {
          return false;
        }
      }
      // Retry up to 3 times for network/server errors
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
}

/**
 * Hook to fetch application history for decision history
 */
export function useApplicationHistory(clubId: string) {
  return useQuery({
    queryKey: clubApprovalKeys.history(clubId),
    queryFn: async () => {
      const response = await fetch(`/api/admin/club-applications/${clubId}/history`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('d1_session') ? JSON.parse(localStorage.getItem('d1_session')!).access_token : ''}`,
        },
      });
      
      if (!response.ok) return [];
      
      const result = await response.json();
      return result.success ? result.data : [];
    },
    enabled: !!clubId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch club application statistics
 */
export function useClubApplicationStats() {
  return useQuery({
    queryKey: clubApprovalKeys.stats(),
    queryFn: async () => {
      const response = await fetch('/api/admin/club-applications/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('d1_session') ? JSON.parse(localStorage.getItem('d1_session')!).access_token : ''}`,
        },
      });
      
      if (!response.ok) return { pending: 0, approved: 0, rejected: 0, total: 0 };
      
      const result = await response.json();
      return result.success ? result.data : { pending: 0, approved: 0, rejected: 0, total: 0 };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to approve club application with optimistic updates and security checks
 */
export function useApproveApplication() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const secureApi = useSecureAdminApi();

  return useMutation({
    mutationFn: async ({ clubId, adminNotes }: { clubId: string; adminNotes?: string }) => {
      // Security checks
      if (!user) {
        throw new Error('Authentication required');
      }

      // Check session validity
      if (SessionManager.isSessionExpired(SessionManager.getLastActivity())) {
        SessionManager.clearSession();
        throw new Error('Session expired. Please log in again.');
      }

      // Update session activity
      SessionManager.updateActivity();

      // Check admin rate limiting
      if (!AdminActionSecurity.isAdminActionAllowed(user.id, 'approve')) {
        throw new Error('Rate limit exceeded for approval actions');
      }

      // Validate CSRF token
      const csrfToken = CSRF.getToken();
      if (!csrfToken) {
        throw new Error('Security token missing. Please refresh the page.');
      }

      // Log admin action
      AdminActionSecurity.logAdminAction(user.id, 'approve', {
        clubId,
        adminNotes: adminNotes || '',
        timestamp: new Date().toISOString()
      });

      // Use secure API client
      const result = await secureApi.approveClub(clubId, adminNotes);
      if (!result.success) {
        throw new Error(result.error || 'Failed to approve application');
      }

      return result;
    },
    
    // Optimistic update
    onMutate: async ({ clubId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: clubApprovalKeys.applicationDetail(clubId) });
      await queryClient.cancelQueries({ queryKey: clubApprovalKeys.applications() });
      await queryClient.cancelQueries({ queryKey: clubApprovalKeys.stats() });

      // Snapshot the previous values
      const previousApplication = queryClient.getQueryData(clubApprovalKeys.applicationDetail(clubId));
      const previousStats = queryClient.getQueryData(clubApprovalKeys.stats());

      // Optimistically update the application status
      if (previousApplication) {
        queryClient.setQueryData(clubApprovalKeys.applicationDetail(clubId), (old: ClubApplicationReview) => ({
          ...old,
          club: {
            ...old.club,
            application_status: 'approved' as const,
            reviewed_at: new Date().toISOString()
          }
        }));
      }

      // Optimistically update stats
      if (previousStats) {
        queryClient.setQueryData(clubApprovalKeys.stats(), (old: any) => ({
          ...old,
          pending: Math.max(0, old.pending - 1),
          approved: old.approved + 1
        }));
      }

      return { previousApplication, previousStats };
    },

    onSuccess: (result, { clubId }) => {
      if (result.success) {
        // Invalidate and refetch related queries
        queryClient.invalidateQueries({ queryKey: clubApprovalKeys.applications() });
        queryClient.invalidateQueries({ queryKey: clubApprovalKeys.applicationDetail(clubId) });
        queryClient.invalidateQueries({ queryKey: clubApprovalKeys.history(clubId) });
        queryClient.invalidateQueries({ queryKey: clubApprovalKeys.stats() });
        
        toast({
          title: 'Success',
          description: 'Club application approved successfully!',
          variant: 'success',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to approve application',
          variant: 'destructive',
        });
      }
    },

    onError: (error, { clubId }, context) => {
      // Rollback optimistic updates
      if (context?.previousApplication) {
        queryClient.setQueryData(clubApprovalKeys.applicationDetail(clubId), context.previousApplication);
      }
      if (context?.previousStats) {
        queryClient.setQueryData(clubApprovalKeys.stats(), context.previousStats);
      }

      // Enhanced error handling
      const errorMessage = error instanceof Error ? error.message : 'Failed to approve application';
      const isNetworkError = errorMessage.includes('fetch') || errorMessage.includes('network');
      
      toast({
        title: isNetworkError ? 'Network Error' : 'Error',
        description: isNetworkError ? 
          'Unable to approve application due to network issues. Please check your connection and try again.' :
          'Failed to approve application. Please try again.',
        variant: 'destructive',
        action: {
          label: 'Retry',
          onClick: () => window.location.reload()
        }
      });
    },
  });
}

/**
 * Hook to reject club application with error handling and security checks
 */
export function useRejectApplication() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const secureApi = useSecureAdminApi();

  return useMutation({
    mutationFn: async ({ clubId, rejectionReason }: { clubId: string; rejectionReason: string }) => {
      // Security checks
      if (!user) {
        throw new Error('Authentication required');
      }

      // Validate rejection reason
      if (!rejectionReason || rejectionReason.trim().length === 0) {
        throw new Error('Rejection reason is required');
      }

      if (rejectionReason.trim().length > 1000) {
        throw new Error('Rejection reason must be less than 1000 characters');
      }

      // Check session validity
      if (SessionManager.isSessionExpired(SessionManager.getLastActivity())) {
        SessionManager.clearSession();
        throw new Error('Session expired. Please log in again.');
      }

      // Update session activity
      SessionManager.updateActivity();

      // Check admin rate limiting
      if (!AdminActionSecurity.isAdminActionAllowed(user.id, 'reject')) {
        throw new Error('Rate limit exceeded for rejection actions');
      }

      // Validate CSRF token
      const csrfToken = CSRF.getToken();
      if (!csrfToken) {
        throw new Error('Security token missing. Please refresh the page.');
      }

      // Log admin action
      AdminActionSecurity.logAdminAction(user.id, 'reject', {
        clubId,
        rejectionReason: rejectionReason.trim(),
        timestamp: new Date().toISOString()
      });

      // Use secure API client
      const result = await secureApi.rejectClub(clubId, rejectionReason.trim());
      if (!result.success) {
        throw new Error(result.error || 'Failed to reject application');
      }

      return result;
    },
    
    // Optimistic update
    onMutate: async ({ clubId, rejectionReason }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: clubApprovalKeys.applicationDetail(clubId) });
      await queryClient.cancelQueries({ queryKey: clubApprovalKeys.applications() });
      await queryClient.cancelQueries({ queryKey: clubApprovalKeys.stats() });

      // Snapshot the previous values
      const previousApplication = queryClient.getQueryData(clubApprovalKeys.applicationDetail(clubId));
      const previousStats = queryClient.getQueryData(clubApprovalKeys.stats());

      // Optimistically update the application status
      if (previousApplication) {
        queryClient.setQueryData(clubApprovalKeys.applicationDetail(clubId), (old: ClubApplicationReview) => ({
          ...old,
          club: {
            ...old.club,
            application_status: 'rejected' as const,
            admin_notes: rejectionReason,
            reviewed_at: new Date().toISOString()
          }
        }));
      }

      // Optimistically update stats
      if (previousStats) {
        queryClient.setQueryData(clubApprovalKeys.stats(), (old: any) => ({
          ...old,
          pending: Math.max(0, old.pending - 1),
          rejected: old.rejected + 1
        }));
      }

      return { previousApplication, previousStats };
    },

    onSuccess: (result, { clubId }) => {
      if (result.success) {
        // Invalidate and refetch related queries
        queryClient.invalidateQueries({ queryKey: clubApprovalKeys.applications() });
        queryClient.invalidateQueries({ queryKey: clubApprovalKeys.applicationDetail(clubId) });
        queryClient.invalidateQueries({ queryKey: clubApprovalKeys.history(clubId) });
        queryClient.invalidateQueries({ queryKey: clubApprovalKeys.stats() });
        
        toast({
          title: 'Success',
          description: 'Club application rejected successfully.',
          variant: 'success',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to reject application',
          variant: 'destructive',
        });
      }
    },

    onError: (error, { clubId }, context) => {
      // Rollback optimistic updates
      if (context?.previousApplication) {
        queryClient.setQueryData(clubApprovalKeys.applicationDetail(clubId), context.previousApplication);
      }
      if (context?.previousStats) {
        queryClient.setQueryData(clubApprovalKeys.stats(), context.previousStats);
      }

      // Enhanced error handling
      const errorMessage = error instanceof Error ? error.message : 'Failed to reject application';
      const isNetworkError = errorMessage.includes('fetch') || errorMessage.includes('network');
      
      toast({
        title: isNetworkError ? 'Network Error' : 'Error',
        description: isNetworkError ? 
          'Unable to reject application due to network issues. Please check your connection and try again.' :
          'Failed to reject application. Please try again.',
        variant: 'destructive',
        action: {
          label: 'Retry',
          onClick: () => window.location.reload()
        }
      });
    },
  });
}

/**
 * Hook for bulk approval operations with enhanced security
 */
export function useBulkApproveApplications() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const secureApi = useSecureAdminApi();

  return useMutation({
    mutationFn: async ({ clubIds, adminNotes }: { clubIds: string[]; adminNotes?: string }) => {
      // Security checks
      if (!user) {
        throw new Error('Authentication required');
      }

      // Validate input
      if (!clubIds || clubIds.length === 0) {
        throw new Error('No applications selected for bulk approval');
      }

      if (clubIds.length > 50) {
        throw new Error('Cannot approve more than 50 applications at once');
      }

      // Check session validity
      if (SessionManager.isSessionExpired(SessionManager.getLastActivity())) {
        SessionManager.clearSession();
        throw new Error('Session expired. Please log in again.');
      }

      // Update session activity
      SessionManager.updateActivity();

      // Check admin rate limiting for bulk operations
      if (!AdminActionSecurity.isAdminActionAllowed(user.id, 'bulk_approve')) {
        throw new Error('Rate limit exceeded for bulk approval actions');
      }

      // Validate CSRF token
      const csrfToken = CSRF.getToken();
      if (!csrfToken) {
        throw new Error('Security token missing. Please refresh the page.');
      }

      // Log admin action
      AdminActionSecurity.logAdminAction(user.id, 'bulk_approve', {
        clubIds,
        adminNotes: adminNotes || '',
        count: clubIds.length,
        timestamp: new Date().toISOString()
      });

      // Use secure API client
      const result = await secureApi.bulkApprove(clubIds, adminNotes);
      if (!result.success) {
        throw new Error(result.error || 'Failed to process bulk approvals');
      }

      return result;
    },
    
    onSuccess: (result) => {
      if (result.success) {
        const { successful, failed } = result.data!;
        
        // Invalidate all related queries
        queryClient.invalidateQueries({ queryKey: clubApprovalKeys.applications() });
        queryClient.invalidateQueries({ queryKey: clubApprovalKeys.stats() });
        
        // Invalidate individual application details for successful approvals
        successful.forEach(clubId => {
          queryClient.invalidateQueries({ queryKey: clubApprovalKeys.applicationDetail(clubId) });
          queryClient.invalidateQueries({ queryKey: clubApprovalKeys.history(clubId) });
        });

        if (failed.length === 0) {
          toast({
            title: 'Success',
            description: `Successfully approved ${successful.length} applications.`,
            variant: 'success',
          });
        } else {
          toast({
            title: 'Partial Success',
            description: `Approved ${successful.length} applications. ${failed.length} failed.`,
            variant: 'default',
          });
        }
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to process bulk approvals',
          variant: 'destructive',
        });
      }
    },

    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to process bulk approvals. Please try again.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Convenience hooks for specific application statuses
 */

/**
 * Hook to fetch only pending applications
 */
export function usePendingApplicationsOnly(filters?: Omit<ClubApplicationFilters, 'status'>) {
  return usePendingApplications({ ...filters, status: 'pending' });
}

/**
 * Hook to fetch only approved applications
 */
export function useApprovedApplications(filters?: Omit<ClubApplicationFilters, 'status'>) {
  return usePendingApplications({ ...filters, status: 'approved' });
}

/**
 * Hook to fetch only rejected applications
 */
export function useRejectedApplications(filters?: Omit<ClubApplicationFilters, 'status'>) {
  return usePendingApplications({ ...filters, status: 'rejected' });
}

/**
 * Hook to fetch all applications regardless of status
 */
export function useAllApplications(filters?: Omit<ClubApplicationFilters, 'status'>) {
  return usePendingApplications({ ...filters, status: 'all' });
}