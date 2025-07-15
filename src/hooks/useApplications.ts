/**
 * React hooks for volunteer applications data management
 * Uses React Query for caching and state management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  getVolunteerApplications,
  getOpportunityApplications,
  getClubApplications,
  createApplication,
  updateApplicationStatus,
  withdrawApplication,
  acceptApplication,
  rejectApplication,
  checkExistingApplication,
  deleteApplication
} from '@/lib/supabase/applications';
import type { ApplicationFormData } from '@/types';

// Query keys
export const applicationKeys = {
  all: ['applications'] as const,
  byVolunteer: (volunteerId: string) => [...applicationKeys.all, 'volunteer', volunteerId] as const,
  byOpportunity: (opportunityId: string) => [...applicationKeys.all, 'opportunity', opportunityId] as const,
  byClub: (clubId: string) => [...applicationKeys.all, 'club', clubId] as const,
  existing: (opportunityId: string, volunteerId: string) => 
    [...applicationKeys.all, 'existing', opportunityId, volunteerId] as const,
};

/**
 * Hook to get applications for a volunteer
 */
export const useVolunteerApplications = (volunteerId: string) => {
  return useQuery({
    queryKey: applicationKeys.byVolunteer(volunteerId),
    queryFn: async () => {
      const result = await getVolunteerApplications(volunteerId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data || [];
    },
    enabled: !!volunteerId,
  });
};

/**
 * Hook to get applications for an opportunity
 */
export const useOpportunityApplications = (opportunityId: string) => {
  return useQuery({
    queryKey: applicationKeys.byOpportunity(opportunityId),
    queryFn: async () => {
      const result = await getOpportunityApplications(opportunityId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data || [];
    },
    enabled: !!opportunityId,
  });
};

/**
 * Hook to get applications for a club
 */
export const useClubApplications = (clubId: string) => {
  return useQuery({
    queryKey: applicationKeys.byClub(clubId),
    queryFn: async () => {
      const result = await getClubApplications(clubId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data || [];
    },
    enabled: !!clubId,
  });
};

/**
 * Hook to check if volunteer has already applied to opportunity
 */
export const useExistingApplication = (opportunityId: string, volunteerId: string) => {
  return useQuery({
    queryKey: applicationKeys.existing(opportunityId, volunteerId),
    queryFn: async () => {
      const result = await checkExistingApplication(opportunityId, volunteerId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: !!opportunityId && !!volunteerId,
  });
};

/**
 * Hook to create a new application
 */
export const useCreateApplication = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ opportunityId, volunteerId, applicationData }: { 
      opportunityId: string; 
      volunteerId: string;
      applicationData: ApplicationFormData;
    }) => createApplication(opportunityId, volunteerId, applicationData),
    onSuccess: (result, variables) => {
      if (result.success) {
        queryClient.invalidateQueries({ 
          queryKey: applicationKeys.byVolunteer(variables.volunteerId) 
        });
        queryClient.invalidateQueries({ 
          queryKey: applicationKeys.byOpportunity(variables.opportunityId) 
        });
        queryClient.invalidateQueries({ 
          queryKey: applicationKeys.existing(variables.opportunityId, variables.volunteerId) 
        });
        toast({
          title: "Application submitted successfully",
          description: "Your application has been sent to the club. They will be in touch soon.",
        });
      } else {
        toast({
          title: "Application failed",
          description: result.error,
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Application failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

/**
 * Hook to update application status
 */
export const useUpdateApplicationStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, status }: { 
      id: string; 
      status: 'pending' | 'accepted' | 'rejected' | 'withdrawn' 
    }) => updateApplicationStatus(id, status),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: applicationKeys.all });
        
        const statusMessages = {
          pending: "Application status updated to pending",
          accepted: "Application accepted successfully",
          rejected: "Application rejected",
          withdrawn: "Application withdrawn successfully"
        };
        
        toast({
          title: "Status updated",
          description: statusMessages[result.data?.status || 'pending'],
        });
      } else {
        toast({
          title: "Status update failed",
          description: result.error,
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Status update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

/**
 * Hook to withdraw application (volunteer only)
 */
export const useWithdrawApplication = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => withdrawApplication(id),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: applicationKeys.all });
        toast({
          title: "Application withdrawn",
          description: "Your application has been withdrawn successfully.",
        });
      } else {
        toast({
          title: "Withdrawal failed",
          description: result.error,
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Withdrawal failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

/**
 * Hook to accept application (club only)
 */
export const useAcceptApplication = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => acceptApplication(id),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: applicationKeys.all });
        toast({
          title: "Application accepted",
          description: "The volunteer application has been accepted.",
        });
      } else {
        toast({
          title: "Accept failed",
          description: result.error,
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Accept failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

/**
 * Hook to reject application (club only)
 */
export const useRejectApplication = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => rejectApplication(id),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: applicationKeys.all });
        toast({
          title: "Application rejected",
          description: "The volunteer application has been rejected.",
        });
      } else {
        toast({
          title: "Reject failed",
          description: result.error,
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Reject failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};