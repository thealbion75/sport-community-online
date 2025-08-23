/**
 * Applications React Query Hooks
 * Custom hooks for volunteer application data fetching and mutations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationsApi } from '@/lib/d1-api-client';
// All application operations now use D1 API endpoints

import { VolunteerApplication, ApplicationFormData } from '@/types';
import { useToast } from './use-toast';

// Query keys
export const applicationKeys = {
  all: ['applications'] as const,
  lists: () => [...applicationKeys.all, 'list'] as const,
  details: () => [...applicationKeys.all, 'detail'] as const,
  detail: (id: string) => [...applicationKeys.details(), id] as const,
  byVolunteer: (volunteerId: string) => [...applicationKeys.all, 'volunteer', volunteerId] as const,
  byOpportunity: (opportunityId: string) => [...applicationKeys.all, 'opportunity', opportunityId] as const,
  byClub: (clubId: string) => [...applicationKeys.all, 'club', clubId] as const,
  hasApplied: (opportunityId: string, volunteerId: string) => [...applicationKeys.all, 'hasApplied', { opportunityId, volunteerId }] as const,
  clubStats: (clubId: string) => [...applicationKeys.all, 'clubStats', clubId] as const,
  volunteerStats: (volunteerId: string) => [...applicationKeys.all, 'volunteerStats', volunteerId] as const,
};

/**
 * Hook to fetch application by ID
 */
export function useApplication(id: string) {
  return useQuery({
    queryKey: applicationKeys.detail(id),
    queryFn: () => getApplicationById(id),
    select: (data) => data.success ? data.data : null,
    enabled: !!id,
  });
}

/**
 * Hook to fetch applications by volunteer ID
 */
export function useApplicationsByVolunteer(volunteerId: string) {
  return useQuery({
    queryKey: applicationKeys.byVolunteer(volunteerId),
    queryFn: () => getApplicationsByVolunteer(volunteerId),
    select: (data) => data.success ? data.data : [],
    enabled: !!volunteerId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to fetch applications by opportunity ID
 */
export function useApplicationsByOpportunity(opportunityId: string) {
  return useQuery({
    queryKey: applicationKeys.byOpportunity(opportunityId),
    queryFn: () => getApplicationsByOpportunity(opportunityId),
    select: (data) => data.success ? data.data : [],
    enabled: !!opportunityId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to fetch applications by club ID
 */
export function useApplicationsByClub(clubId: string) {
  return useQuery({
    queryKey: applicationKeys.byClub(clubId),
    queryFn: () => getApplicationsByClub(clubId),
    select: (data) => data.success ? data.data : [],
    enabled: !!clubId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to check if volunteer has applied to opportunity
 */
export function useHasVolunteerApplied(opportunityId: string, volunteerId: string) {
  return useQuery({
    queryKey: applicationKeys.hasApplied(opportunityId, volunteerId),
    queryFn: () => hasVolunteerApplied(opportunityId, volunteerId),
    select: (data) => data.success ? data.data : false,
    enabled: !!(opportunityId && volunteerId),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Hook to get club application statistics
 */
export function useClubApplicationStats(clubId: string) {
  return useQuery({
    queryKey: applicationKeys.clubStats(clubId),
    queryFn: () => getClubApplicationStats(clubId),
    select: (data) => data.success ? data.data : { total: 0, pending: 0, accepted: 0, rejected: 0 },
    enabled: !!clubId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to get volunteer application statistics
 */
export function useVolunteerApplicationStats(volunteerId: string) {
  return useQuery({
    queryKey: applicationKeys.volunteerStats(volunteerId),
    queryFn: () => getVolunteerApplicationStats(volunteerId),
    select: (data) => data.success ? data.data : { total: 0, pending: 0, accepted: 0, rejected: 0, withdrawn: 0 },
    enabled: !!volunteerId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to create a new application
 */
export function useCreateApplication() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ opportunityId, volunteerId, data }: { 
      opportunityId: string; 
      volunteerId: string; 
      data: ApplicationFormData 
    }) => createApplication(opportunityId, volunteerId, data),
    onSuccess: (result, variables) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: applicationKeys.all });
        queryClient.invalidateQueries({ queryKey: applicationKeys.hasApplied(variables.opportunityId, variables.volunteerId) });
        toast({
          title: 'Success',
          description: 'Application submitted successfully!',
          variant: 'success',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to submit application',
          variant: 'destructive',
        });
      }
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to submit application. Please try again.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to update application status
 */
export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'pending' | 'accepted' | 'rejected' | 'withdrawn' }) => 
      updateApplicationStatus(id, status),
    onSuccess: (result, variables) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: applicationKeys.detail(variables.id) });
        queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
        toast({
          title: 'Success',
          description: `Application ${variables.status} successfully!`,
          variant: 'success',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update application status',
          variant: 'destructive',
        });
      }
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update application status. Please try again.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to withdraw application
 */
export function useWithdrawApplication() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => withdrawApplication(id),
    onSuccess: (result, id) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: applicationKeys.detail(id) });
        queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
        toast({
          title: 'Success',
          description: 'Application withdrawn successfully!',
          variant: 'success',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to withdraw application',
          variant: 'destructive',
        });
      }
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to withdraw application. Please try again.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to accept application
 */
export function useAcceptApplication() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => acceptApplication(id),
    onSuccess: (result, id) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: applicationKeys.detail(id) });
        queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
        toast({
          title: 'Success',
          description: 'Application accepted successfully!',
          variant: 'success',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to accept application',
          variant: 'destructive',
        });
      }
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to accept application. Please try again.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to reject application
 */
export function useRejectApplication() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => rejectApplication(id),
    onSuccess: (result, id) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: applicationKeys.detail(id) });
        queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
        toast({
          title: 'Success',
          description: 'Application rejected successfully!',
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
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to reject application. Please try again.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to delete application
 */
export function useDeleteApplication() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteApplication(id),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: applicationKeys.all });
        toast({
          title: 'Success',
          description: 'Application deleted successfully!',
          variant: 'success',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to delete application',
          variant: 'destructive',
        });
      }
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete application. Please try again.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to get volunteer applications (alias for useApplicationsByVolunteer)
 */
export function useVolunteerApplications(volunteerId: string) {
  return useApplicationsByVolunteer(volunteerId);
}

/**
 * Hook to check if an existing application exists for a volunteer and opportunity
 */
export function useExistingApplication(opportunityId: string, volunteerId: string) {
  return useQuery({
    queryKey: [...applicationKeys.all, 'existing', { opportunityId, volunteerId }],
    queryFn: async () => {
      const result = await hasVolunteerApplied(opportunityId, volunteerId);
      if (result.success && result.data) {
        // If they have applied, get the application details
        const applicationsResult = await getApplicationsByVolunteer(volunteerId);
        if (applicationsResult.success && applicationsResult.data) {
          const existingApp = applicationsResult.data.find(
            app => app.opportunity_id === opportunityId
          );
          return existingApp || null;
        }
      }
      return null;
    },
    enabled: !!(opportunityId && volunteerId),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}