/**
 * React hooks for volunteer profiles data management
 * Uses React Query for caching and state management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  getVolunteerProfile,
  getVolunteerById,
  searchVolunteers,
  createVolunteerProfile,
  updateVolunteerProfile,
  deleteVolunteerProfile,
  updateProfileVisibility
} from '@/lib/supabase/volunteers';
import type { VolunteerRegistrationData, VolunteerFilters } from '@/types';

// Query keys
export const volunteerKeys = {
  all: ['volunteers'] as const,
  lists: () => [...volunteerKeys.all, 'list'] as const,
  list: (filters?: VolunteerFilters, page?: number) => 
    [...volunteerKeys.lists(), { filters, page }] as const,
  byId: (id: string) => [...volunteerKeys.all, 'byId', id] as const,
  byUserId: (userId: string) => [...volunteerKeys.all, 'byUserId', userId] as const,
};

/**
 * Hook to get volunteer profile by user ID
 */
export const useVolunteerProfile = (userId: string) => {
  return useQuery({
    queryKey: volunteerKeys.byUserId(userId),
    queryFn: async () => {
      const result = await getVolunteerProfile(userId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: !!userId,
  });
};

/**
 * Hook to get volunteer by ID
 */
export const useVolunteer = (id: string) => {
  return useQuery({
    queryKey: volunteerKeys.byId(id),
    queryFn: async () => {
      const result = await getVolunteerById(id);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: !!id,
  });
};

/**
 * Hook to search volunteers with filtering and pagination
 */
export const useSearchVolunteers = (
  filters?: VolunteerFilters,
  page = 1,
  limit = 10
) => {
  return useQuery({
    queryKey: volunteerKeys.list(filters, page),
    queryFn: async () => {
      const result = await searchVolunteers(filters, page, limit);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
  });
};

/**
 * Hook to create volunteer profile
 */
export const useCreateVolunteerProfile = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ userId, profileData }: { 
      userId: string; 
      profileData: VolunteerRegistrationData 
    }) => createVolunteerProfile(userId, profileData),
    onSuccess: (result, variables) => {
      if (result.success) {
        queryClient.invalidateQueries({ 
          queryKey: volunteerKeys.byUserId(variables.userId) 
        });
        queryClient.invalidateQueries({ queryKey: volunteerKeys.lists() });
        toast({
          title: "Profile created successfully",
          description: "Your volunteer profile is now active and visible to clubs.",
        });
      } else {
        toast({
          title: "Profile creation failed",
          description: result.error,
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Profile creation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

/**
 * Hook to update volunteer profile
 */
export const useUpdateVolunteerProfile = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ userId, updates }: { 
      userId: string; 
      updates: Partial<VolunteerRegistrationData> 
    }) => updateVolunteerProfile(userId, updates),
    onSuccess: (result, variables) => {
      if (result.success) {
        queryClient.invalidateQueries({ 
          queryKey: volunteerKeys.byUserId(variables.userId) 
        });
        queryClient.invalidateQueries({ queryKey: volunteerKeys.lists() });
        toast({
          title: "Profile updated successfully",
          description: "Your volunteer profile has been updated.",
        });
      } else {
        toast({
          title: "Profile update failed",
          description: result.error,
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Profile update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

/**
 * Hook to delete volunteer profile
 */
export const useDeleteVolunteerProfile = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (userId: string) => deleteVolunteerProfile(userId),
    onSuccess: (result, userId) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: volunteerKeys.byUserId(userId) });
        queryClient.invalidateQueries({ queryKey: volunteerKeys.lists() });
        toast({
          title: "Profile deleted successfully",
          description: "Your volunteer profile has been removed.",
        });
      } else {
        toast({
          title: "Profile deletion failed",
          description: result.error,
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Profile deletion failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

/**
 * Hook to update profile visibility
 */
export const useUpdateProfileVisibility = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ userId, isVisible }: { 
      userId: string; 
      isVisible: boolean 
    }) => updateProfileVisibility(userId, isVisible),
    onSuccess: (result, variables) => {
      if (result.success) {
        queryClient.invalidateQueries({ 
          queryKey: volunteerKeys.byUserId(variables.userId) 
        });
        queryClient.invalidateQueries({ queryKey: volunteerKeys.lists() });
        toast({
          title: "Visibility updated successfully",
          description: variables.isVisible 
            ? "Your profile is now visible to clubs" 
            : "Your profile is now hidden from clubs",
        });
      } else {
        toast({
          title: "Visibility update failed",
          description: result.error,
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Visibility update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};