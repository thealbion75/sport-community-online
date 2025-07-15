/**
 * React hooks for volunteer opportunities data management
 * Uses React Query for caching and state management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  getOpportunities,
  getOpportunityById,
  getClubOpportunities,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
  updateOpportunityStatus
} from '@/lib/supabase/opportunities';
import type { OpportunityFormData, OpportunityFilters } from '@/types';

// Query keys
export const opportunityKeys = {
  all: ['opportunities'] as const,
  lists: () => [...opportunityKeys.all, 'list'] as const,
  list: (filters?: OpportunityFilters, page?: number) => 
    [...opportunityKeys.lists(), { filters, page }] as const,
  byId: (id: string) => [...opportunityKeys.all, 'byId', id] as const,
  byClub: (clubId: string) => [...opportunityKeys.all, 'byClub', clubId] as const,
};

/**
 * Hook to get opportunities with filtering and pagination
 */
export const useOpportunities = (
  filters?: OpportunityFilters,
  page = 1,
  limit = 10
) => {
  return useQuery({
    queryKey: opportunityKeys.list(filters, page),
    queryFn: async () => {
      const result = await getOpportunities(filters, page, limit);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
  });
};

/**
 * Hook to get opportunity by ID
 */
export const useOpportunity = (id: string) => {
  return useQuery({
    queryKey: opportunityKeys.byId(id),
    queryFn: async () => {
      const result = await getOpportunityById(id);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: !!id,
  });
};

/**
 * Hook to get opportunities for a specific club
 */
export const useClubOpportunities = (clubId: string) => {
  return useQuery({
    queryKey: opportunityKeys.byClub(clubId),
    queryFn: async () => {
      const result = await getClubOpportunities(clubId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data || [];
    },
    enabled: !!clubId,
  });
};

/**
 * Hook to create a new opportunity
 */
export const useCreateOpportunity = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ clubId, opportunityData }: { 
      clubId: string; 
      opportunityData: OpportunityFormData 
    }) => createOpportunity(clubId, opportunityData),
    onSuccess: (result, variables) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: opportunityKeys.lists() });
        queryClient.invalidateQueries({ 
          queryKey: opportunityKeys.byClub(variables.clubId) 
        });
        toast({
          title: "Opportunity created successfully",
          description: "Your volunteer opportunity is now live and visible to volunteers.",
        });
      } else {
        toast({
          title: "Creation failed",
          description: result.error,
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Creation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

/**
 * Hook to update an opportunity
 */
export const useUpdateOpportunity = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { 
      id: string; 
      updates: Partial<OpportunityFormData> 
    }) => updateOpportunity(id, updates),
    onSuccess: (result, variables) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: opportunityKeys.byId(variables.id) });
        queryClient.invalidateQueries({ queryKey: opportunityKeys.lists() });
        if (result.data?.club_id) {
          queryClient.invalidateQueries({ 
            queryKey: opportunityKeys.byClub(result.data.club_id) 
          });
        }
        toast({
          title: "Opportunity updated successfully",
          description: "Your volunteer opportunity has been updated.",
        });
      } else {
        toast({
          title: "Update failed",
          description: result.error,
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

/**
 * Hook to delete an opportunity
 */
export const useDeleteOpportunity = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteOpportunity(id),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: opportunityKeys.all });
        toast({
          title: "Opportunity deleted successfully",
          description: "The volunteer opportunity has been removed.",
        });
      } else {
        toast({
          title: "Deletion failed",
          description: result.error,
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Deletion failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

/**
 * Hook to update opportunity status
 */
export const useUpdateOpportunityStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, status }: { 
      id: string; 
      status: 'active' | 'filled' | 'cancelled' 
    }) => updateOpportunityStatus(id, status),
    onSuccess: (result, variables) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: opportunityKeys.byId(variables.id) });
        queryClient.invalidateQueries({ queryKey: opportunityKeys.lists() });
        if (result.data?.club_id) {
          queryClient.invalidateQueries({ 
            queryKey: opportunityKeys.byClub(result.data.club_id) 
          });
        }
        
        const statusMessages = {
          active: "Opportunity is now active",
          filled: "Opportunity marked as filled",
          cancelled: "Opportunity has been cancelled"
        };
        
        toast({
          title: "Status updated successfully",
          description: statusMessages[variables.status],
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