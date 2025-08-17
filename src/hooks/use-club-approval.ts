/**
 * Club Approval React Query Hooks
 * Custom hooks for admin club approval data fetching and mutations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getPendingClubApplications,
  getClubApplicationById,
  approveClubApplication,
  rejectClubApplication,
  getApplicationHistory,
  bulkApproveApplications,
  getClubApplicationStats
} from '@/lib/supabase/admin-club-approval';
import { 
  Club, 
  ClubApplicationReview, 
  ClubApplicationHistory, 
  ClubApplicationFilters,
  PaginatedResponse 
} from '@/types';
import { useToast } from './use-toast';

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
  return useQuery({
    queryKey: clubApprovalKeys.applicationsList(filters || {}),
    queryFn: () => getPendingClubApplications(filters),
    select: (data) => data.success ? data.data : { data: [], count: 0, page: 1, limit: 10, total_pages: 0 },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch single club application details
 */
export function useClubApplication(id: string) {
  return useQuery({
    queryKey: clubApprovalKeys.applicationDetail(id),
    queryFn: () => getClubApplicationById(id),
    select: (data) => data.success ? data.data : null,
    enabled: !!id,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Hook to fetch application history for decision history
 */
export function useApplicationHistory(clubId: string) {
  return useQuery({
    queryKey: clubApprovalKeys.history(clubId),
    queryFn: () => getApplicationHistory(clubId),
    select: (data) => data.success ? data.data : [],
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
    queryFn: () => getClubApplicationStats(),
    select: (data) => data.success ? data.data : { pending: 0, approved: 0, rejected: 0, total: 0 },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to approve club application with optimistic updates
 */
export function useApproveApplication() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ clubId, adminNotes }: { clubId: string; adminNotes?: string }) => 
      approveClubApplication(clubId, adminNotes),
    
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

      toast({
        title: 'Error',
        description: 'Failed to approve application. Please try again.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to reject club application with error handling
 */
export function useRejectApplication() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ clubId, rejectionReason }: { clubId: string; rejectionReason: string }) => 
      rejectClubApplication(clubId, rejectionReason),
    
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

      toast({
        title: 'Error',
        description: 'Failed to reject application. Please try again.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook for bulk approval operations
 */
export function useBulkApproveApplications() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ clubIds, adminNotes }: { clubIds: string[]; adminNotes?: string }) => 
      bulkApproveApplications(clubIds, adminNotes),
    
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