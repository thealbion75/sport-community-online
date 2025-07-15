/**
 * Opportunities React Query Hooks
 * Custom hooks for volunteer opportunity data fetching and mutations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  createOpportunity,
  getOpportunityById,
  getOpportunities,
  updateOpportunity,
  updateOpportunityStatus,
  deleteOpportunity,
  getOpportunitiesByClub,
  searchOpportunities,
  getOpportunityCount,
  getRecentOpportunities
} from '@/lib/supabase/opportunities';
import { VolunteerOpportunity, OpportunityFormData, OpportunityFilters } from '@/types';
import { useToast } from './use-toast';

// Query keys
export const opportunityKeys = {
  all: ['opportunities'] as const,
  lists: () => [...opportunityKeys.all, 'list'] as const,
  list: (filters: any) => [...opportunityKeys.lists(), { filters }] as const,
  details: () => [...opportunityKeys.all, 'detail'] as const,
  detail: (id: string) => [...opportunityKeys.details(), id] as const,
  byClub: (clubId: string) => [...opportunityKeys.all, 'club', clubId] as const,
  search: (term: string) => [...opportunityKeys.all, 'search', term] as const,
  count: (filters: any) => [...opportunityKeys.all, 'count', filters] as const,
  recent: (limit: number) => [...opportunityKeys.all, 'recent', limit] as const,
};

/**
 * Hook to fetch opportunities with optional filtering
 */
export function useOpportunities(filters?: OpportunityFilters & {
  limit?: number;
  offset?: number;
  clubId?: string;
}) {
  return useQuery({
    queryKey: opportunityKeys.list(filters),
    queryFn: () => getOpportunities(filters),
    select: (data) => data.success ? data.data : [],
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to fetch a single opportunity by ID
 */
export function useOpportunity(id: string) {
  return useQuery({
    queryKey: opportunityKeys.detail(id),
    queryFn: () => getOpportunityById(id),
    select: (data) => data.success ? data.data : null,
    enabled: !!id,
  });
}

/**
 * Hook to fetch opportunities by club ID
 */
export function useOpportunitiesByClub(clubId: string) {
  return useQuery({
    queryKey: opportunityKeys.byClub(clubId),
    queryFn: () => getOpportunitiesByClub(clubId),
    select: (data) => data.success ? data.data : [],
    enabled: !!clubId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to search opportunities
 */
export function useSearchOpportunities(searchTerm: string, limit?: number) {
  return useQuery({
    queryKey: opportunityKeys.search(searchTerm),
    queryFn: () => searchOpportunities(searchTerm, limit),
    select: (data) => data.success ? data.data : [],
    enabled: searchTerm.length > 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to get opportunity count
 */
export function useOpportunityCount(filters?: OpportunityFilters & { clubId?: string }) {
  return useQuery({
    queryKey: opportunityKeys.count(filters),
    queryFn: () => getOpportunityCount(filters),
    select: (data) => data.success ? data.data : 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to get recent opportunities
 */
export function useRecentOpportunities(limit: number = 10) {
  return useQuery({
    queryKey: opportunityKeys.recent(limit),
    queryFn: () => getRecentOpportunities(limit),
    select: (data) => data.success ? data.data : [],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to create a new opportunity
 */
export function useCreateOpportunity() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ clubId, data }: { clubId: string; data: OpportunityFormData }) => 
      createOpportunity(clubId, data),
    onSuccess: (result, variables) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: opportunityKeys.all });
        queryClient.invalidateQueries({ queryKey: opportunityKeys.byClub(variables.clubId) });
        toast({
          title: 'Success',
          description: 'Volunteer opportunity created successfully!',
          variant: 'success',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to create opportunity',
          variant: 'destructive',
        });
      }
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create opportunity. Please try again.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to update an opportunity
 */
export function useUpdateOpportunity() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<OpportunityFormData> }) => 
      updateOpportunity(id, data),
    onSuccess: (result, variables) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: opportunityKeys.detail(variables.id) });
        queryClient.invalidateQueries({ queryKey: opportunityKeys.lists() });
        toast({
          title: 'Success',
          description: 'Opportunity updated successfully!',
          variant: 'success',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update opportunity',
          variant: 'destructive',
        });
      }
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update opportunity. Please try again.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to update opportunity status
 */
export function useUpdateOpportunityStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'filled' | 'cancelled' }) => 
      updateOpportunityStatus(id, status),
    onSuccess: (result, variables) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: opportunityKeys.detail(variables.id) });
        queryClient.invalidateQueries({ queryKey: opportunityKeys.lists() });
        toast({
          title: 'Success',
          description: `Opportunity marked as ${variables.status}!`,
          variant: 'success',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update opportunity status',
          variant: 'destructive',
        });
      }
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update opportunity status. Please try again.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to delete an opportunity
 */
export function useDeleteOpportunity() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteOpportunity(id),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: opportunityKeys.all });
        toast({
          title: 'Success',
          description: 'Opportunity deleted successfully!',
          variant: 'success',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to delete opportunity',
          variant: 'destructive',
        });
      }
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete opportunity. Please try again.',
        variant: 'destructive',
      });
    },
  });
}