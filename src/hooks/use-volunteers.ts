/**
 * Volunteer React Query Hooks
 * Custom hooks for volunteer profile data fetching and mutations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// All volunteer operations now use D1 API endpoints

import { VolunteerProfile, VolunteerRegistrationData, VolunteerFilters } from '@/types';
import { useToast } from './use-toast';

// Query keys
export const volunteerKeys = {
  all: ['volunteers'] as const,
  lists: () => [...volunteerKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...volunteerKeys.lists(), { filters }] as const,
  details: () => [...volunteerKeys.all, 'detail'] as const,
  detail: (id: string) => [...volunteerKeys.details(), id] as const,
  byUserId: (userId: string) => [...volunteerKeys.all, 'user', userId] as const,
  search: (filters: Record<string, unknown>) => [...volunteerKeys.all, 'search', filters] as const,
  searchText: (term: string) => [...volunteerKeys.all, 'searchText', term] as const,
  visible: (limit: number, offset: number) => [...volunteerKeys.all, 'visible', { limit, offset }] as const,
  count: (filters: Record<string, unknown> | undefined) => [...volunteerKeys.all, 'count', filters] as const,
};

/**
 * Hook to fetch volunteer profile by user ID
 */
export function useVolunteerProfile(userId: string) {
  return useQuery({
    queryKey: volunteerKeys.byUserId(userId),
    queryFn: () => getVolunteerProfileByUserId(userId),
    select: (data) => data.success ? data.data : null,
    enabled: !!userId,
  });
}

/**
 * Hook to fetch volunteer profile by ID
 */
export function useVolunteerById(id: string) {
  return useQuery({
    queryKey: volunteerKeys.detail(id),
    queryFn: () => getVolunteerProfileById(id),
    select: (data) => data.success ? data.data : null,
    enabled: !!id,
  });
}

/**
 * Hook to search volunteers with filters
 */
export function useSearchVolunteers(filters: VolunteerFilters & {
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: volunteerKeys.search(filters),
    queryFn: () => searchVolunteers(filters),
    select: (data) => data.success ? data.data : [],
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to get visible volunteers
 */
export function useVisibleVolunteers(limit: number = 50, offset: number = 0) {
  return useQuery({
    queryKey: volunteerKeys.visible(limit, offset),
    queryFn: () => getVisibleVolunteers(limit, offset),
    select: (data) => data.success ? data.data : [],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to search volunteers by text
 */
export function useSearchVolunteersByText(searchTerm: string, limit?: number) {
  return useQuery({
    queryKey: volunteerKeys.searchText(searchTerm),
    queryFn: () => searchVolunteersByText(searchTerm, limit),
    select: (data) => data.success ? data.data : [],
    enabled: searchTerm.length > 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to get volunteer count
 */
export function useVolunteerCount(filters?: VolunteerFilters) {
  return useQuery({
    queryKey: volunteerKeys.count(filters),
    queryFn: () => getVolunteerCount(filters),
    select: (data) => data.success ? data.data : 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to create a volunteer profile
 */
export function useCreateVolunteerProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: VolunteerRegistrationData) => createVolunteerProfile(data),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: volunteerKeys.all });
        toast({
          title: 'Success',
          description: 'Volunteer profile created successfully!',
          variant: 'success',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to create volunteer profile',
          variant: 'destructive',
        });
      }
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create volunteer profile. Please try again.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to update a volunteer profile
 */
export function useUpdateVolunteerProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<VolunteerRegistrationData> }) => 
      updateVolunteerProfile(id, data),
    onSuccess: (result, variables) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: volunteerKeys.detail(variables.id) });
        queryClient.invalidateQueries({ queryKey: volunteerKeys.lists() });
        toast({
          title: 'Success',
          description: 'Profile updated successfully!',
          variant: 'success',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update profile',
          variant: 'destructive',
        });
      }
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to delete a volunteer profile
 */
export function useDeleteVolunteerProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteVolunteerProfile(id),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: volunteerKeys.all });
        toast({
          title: 'Success',
          description: 'Profile deleted successfully!',
          variant: 'success',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to delete profile',
          variant: 'destructive',
        });
      }
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete profile. Please try again.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to update volunteer visibility
 */
export function useUpdateVolunteerVisibility() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, isVisible }: { id: string; isVisible: boolean }) => 
      updateVolunteerVisibility(id, isVisible),
    onSuccess: (result, variables) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: volunteerKeys.detail(variables.id) });
        queryClient.invalidateQueries({ queryKey: volunteerKeys.lists() });
        toast({
          title: 'Success',
          description: `Profile ${variables.isVisible ? 'made visible' : 'hidden'} successfully!`,
          variant: 'success',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update profile visibility',
          variant: 'destructive',
        });
      }
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update profile visibility. Please try again.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to update profile visibility (alias for useUpdateVolunteerVisibility)
 */
export function useUpdateProfileVisibility() {
  return useUpdateVolunteerVisibility();
}