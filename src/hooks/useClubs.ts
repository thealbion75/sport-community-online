/**
 * React hooks for club data management
 * Uses React Query for caching and state management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  getVerifiedClubs,
  getClubById,
  getClubByEmail,
  registerClub,
  updateClub,
  verifyClub,
  getUnverifiedClubs
} from '@/lib/supabase/clubs';
import type { Club, ClubRegistrationData } from '@/types';

// Query keys
export const clubKeys = {
  all: ['clubs'] as const,
  verified: () => [...clubKeys.all, 'verified'] as const,
  unverified: () => [...clubKeys.all, 'unverified'] as const,
  byId: (id: string) => [...clubKeys.all, 'byId', id] as const,
  byEmail: (email: string) => [...clubKeys.all, 'byEmail', email] as const,
};

/**
 * Hook to get all verified clubs
 */
export const useVerifiedClubs = () => {
  return useQuery({
    queryKey: clubKeys.verified(),
    queryFn: async () => {
      const result = await getVerifiedClubs();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data || [];
    },
  });
};

/**
 * Hook to get club by ID
 */
export const useClub = (id: string) => {
  return useQuery({
    queryKey: clubKeys.byId(id),
    queryFn: async () => {
      const result = await getClubById(id);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: !!id,
  });
};

/**
 * Hook to get club by email (for club admin access)
 */
export const useClubByEmail = (email: string) => {
  return useQuery({
    queryKey: clubKeys.byEmail(email),
    queryFn: async () => {
      const result = await getClubByEmail(email);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: !!email,
  });
};

/**
 * Hook to get unverified clubs (admin only)
 */
export const useUnverifiedClubs = () => {
  return useQuery({
    queryKey: clubKeys.unverified(),
    queryFn: async () => {
      const result = await getUnverifiedClubs();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data || [];
    },
  });
};

/**
 * Hook to register a new club
 */
export const useRegisterClub = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (clubData: ClubRegistrationData) => registerClub(clubData),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: clubKeys.all });
        toast({
          title: "Club registered successfully",
          description: "Your club registration is pending verification.",
        });
      } else {
        toast({
          title: "Registration failed",
          description: result.error,
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

/**
 * Hook to update club information
 */
export const useUpdateClub = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ClubRegistrationData> }) =>
      updateClub(id, updates),
    onSuccess: (result, variables) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: clubKeys.byId(variables.id) });
        queryClient.invalidateQueries({ queryKey: clubKeys.verified() });
        toast({
          title: "Club updated successfully",
          description: "Your club information has been updated.",
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
 * Hook to verify a club (admin only)
 */
export const useVerifyClub = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => verifyClub(id),
    onSuccess: (result, id) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: clubKeys.all });
        toast({
          title: "Club verified successfully",
          description: "The club has been verified and is now visible to volunteers.",
        });
      } else {
        toast({
          title: "Verification failed",
          description: result.error,
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Verification failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};