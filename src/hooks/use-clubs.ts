/**
 * Club React Query Hooks
 * Custom hooks for club data fetching and mutations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getClubs, 
  getClubById, 
  createClub, 
  updateClub, 
  deleteClub, 
  verifyClub,
  getClubByEmail,
  searchClubs
} from '@/lib/supabase/clubs';
import { Club, ClubRegistrationData } from '@/types';
import { useToast } from './use-toast';

// Query keys
export const clubKeys = {
  all: ['clubs'] as const,
  lists: () => [...clubKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...clubKeys.lists(), { filters }] as const,
  details: () => [...clubKeys.all, 'detail'] as const,
  detail: (id: string) => [...clubKeys.details(), id] as const,
  search: (term: string) => [...clubKeys.all, 'search', term] as const,
  byEmail: (email: string) => [...clubKeys.all, 'email', email] as const,
};

/**
 * Hook to fetch all clubs with optional filtering
 */
export function useClubs(filters?: {
  verified?: boolean;
  sport_types?: string[];
  location?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: clubKeys.list(filters),
    queryFn: () => getClubs(filters),
    select: (data) => data.success ? data.data : [],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch a single club by ID
 */
export function useClub(id: string) {
  return useQuery({
    queryKey: clubKeys.detail(id),
    queryFn: () => getClubById(id),
    select: (data) => data.success ? data.data : null,
    enabled: !!id,
  });
}

/**
 * Hook to fetch club by email
 */
export function useClubByEmail(email: string) {
  return useQuery({
    queryKey: clubKeys.byEmail(email),
    queryFn: () => getClubByEmail(email),
    select: (data) => data.success ? data.data : null,
    enabled: !!email,
  });
}

/**
 * Hook to search clubs
 */
export function useSearchClubs(searchTerm: string, limit?: number) {
  return useQuery({
    queryKey: clubKeys.search(searchTerm),
    queryFn: () => searchClubs(searchTerm, limit),
    select: (data) => data.success ? data.data : [],
    enabled: searchTerm.length > 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to create a new club
 */
export function useCreateClub() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: ClubRegistrationData) => createClub(data),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: clubKeys.all });
        toast({
          title: 'Success',
          description: 'Club registered successfully! It will be reviewed for verification.',
          variant: 'success',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to register club',
          variant: 'destructive',
        });
      }
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to register club. Please try again.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to update a club
 */
export function useUpdateClub() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ClubRegistrationData> }) => 
      updateClub(id, data),
    onSuccess: (result, variables) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: clubKeys.detail(variables.id) });
        queryClient.invalidateQueries({ queryKey: clubKeys.lists() });
        toast({
          title: 'Success',
          description: 'Club updated successfully!',
          variant: 'success',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update club',
          variant: 'destructive',
        });
      }
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update club. Please try again.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to delete a club
 */
export function useDeleteClub() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteClub(id),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: clubKeys.all });
        toast({
          title: 'Success',
          description: 'Club deleted successfully!',
          variant: 'success',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to delete club',
          variant: 'destructive',
        });
      }
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete club. Please try again.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to verify a club (admin only)
 */
export function useVerifyClub() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, verified }: { id: string; verified: boolean }) => 
      verifyClub(id, verified),
    onSuccess: (result, variables) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: clubKeys.detail(variables.id) });
        queryClient.invalidateQueries({ queryKey: clubKeys.lists() });
        toast({
          title: 'Success',
          description: `Club ${variables.verified ? 'verified' : 'unverified'} successfully!`,
          variant: 'success',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update club verification',
          variant: 'destructive',
        });
      }
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update club verification. Please try again.',
        variant: 'destructive',
      });
    },
  });
}
/**
 * Hook to fetch verified clubs only
 */
export function useVerifiedClubs() {
  return useClubs({ verified: true });
}

/**
 * Hook to fetch unverified clubs only
 */
export function useUnverifiedClubs() {
  return useClubs({ verified: false });
}
