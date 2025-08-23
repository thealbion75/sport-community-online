/**
 * Sports Council React Query Hooks
 * Custom hooks for sports council meeting management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sportsCouncilApi } from '@/lib/d1-api-client';
import { useToast } from './use-toast';
import type { 
  SportsCouncilMeeting, 
  SportsCouncilAdmin, 
  MeetingFormData, 
  MeetingFilters,
  SportsCouncilStats 
} from '@/types';

// Query keys
export const sportsCouncilKeys = {
  all: ['sportsCouncil'] as const,
  meetings: () => [...sportsCouncilKeys.all, 'meetings'] as const,
  meeting: (id: string) => [...sportsCouncilKeys.meetings(), id] as const,
  publicMeetings: (filters?: MeetingFilters) => [...sportsCouncilKeys.meetings(), 'public', filters] as const,
  admins: () => [...sportsCouncilKeys.all, 'admins'] as const,
  stats: () => [...sportsCouncilKeys.all, 'stats'] as const,
  isAdmin: (email?: string) => [...sportsCouncilKeys.all, 'isAdmin', email] as const,
};

/**
 * Hook to get public sports council meetings
 */
export function usePublicMeetings(filters?: MeetingFilters) {
  return useQuery({
    queryKey: sportsCouncilKeys.publicMeetings(filters),
    queryFn: async () => {
      const result = await sportsCouncilApi.getMeetings();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch meetings');
      }
      
      let meetings = result.data || [];
      
      // Apply filters client-side for now
      if (filters?.status && filters.status !== 'all') {
        meetings = meetings.filter(m => m.status === filters.status);
      }
      
      if (filters?.year) {
        meetings = meetings.filter(m => 
          new Date(m.meeting_date).getFullYear() === filters.year
        );
      }
      
      return meetings as SportsCouncilMeeting[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to get all meetings (admin only)
 */
export function useAllMeetings(filters?: MeetingFilters) {
  return useQuery({
    queryKey: [...sportsCouncilKeys.meetings(), 'all', filters],
    queryFn: async () => {
      const result = await sportsCouncilApi.getMeetings();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch meetings');
      }
      
      let meetings = result.data || [];
      
      // Apply filters client-side for now
      if (filters?.status && filters.status !== 'all') {
        meetings = meetings.filter(m => m.status === filters.status);
      }
      
      if (filters?.year) {
        meetings = meetings.filter(m => 
          new Date(m.meeting_date).getFullYear() === filters.year
        );
      }
      
      return meetings as SportsCouncilMeeting[];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes for admin data
  });
}

/**
 * Hook to get a single meeting by ID
 */
export function useMeeting(id: string) {
  return useQuery({
    queryKey: sportsCouncilKeys.meeting(id),
    queryFn: async () => {
      const response = await fetch(`/api/sports-council/meetings/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('d1_session') ? JSON.parse(localStorage.getItem('d1_session')!).access_token : ''}`,
        },
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch meeting');
      }
      return result.data as SportsCouncilMeeting;
    },
    enabled: !!id,
  });
}

/**
 * Hook to check if current user is sports council admin
 */
export function useIsSportsCouncilAdmin(email?: string) {
  return useQuery({
    queryKey: sportsCouncilKeys.isAdmin(email),
    queryFn: async () => {
      if (!email) return false;

      try {
        const response = await fetch('/api/sports-council/check-admin', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('d1_session') ? JSON.parse(localStorage.getItem('d1_session')!).access_token : ''}`,
          },
        });
        const result = await response.json();
        return result.success && result.data?.is_admin || false;
      } catch (error) {
        console.error('Error checking sports council admin status:', error);
        return false;
      }
    },
    enabled: !!email,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to get sports council statistics
 */
export function useSportsCouncilStats() {
  return useQuery({
    queryKey: sportsCouncilKeys.stats(),
    queryFn: async () => {
      const response = await fetch('/api/sports-council/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('d1_session') ? JSON.parse(localStorage.getItem('d1_session')!).access_token : ''}`,
        },
      });
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch stats');
      }

      return result.data as SportsCouncilStats;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to create a new meeting
 */
export function useCreateMeeting() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (meetingData: MeetingFormData) => {
      const result = await sportsCouncilApi.createMeeting(meetingData);
      if (!result.success) {
        throw new Error(result.error || 'Failed to create meeting');
      }
      return result.data as SportsCouncilMeeting;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sportsCouncilKeys.meetings() });
      toast({
        title: 'Success',
        description: 'Meeting created successfully!',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to update a meeting
 */
export function useUpdateMeeting() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...meetingData }: MeetingFormData & { id: string }) => {
      const result = await sportsCouncilApi.updateMeeting(id, meetingData);
      if (!result.success) {
        throw new Error(result.error || 'Failed to update meeting');
      }
      return result.data as SportsCouncilMeeting;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: sportsCouncilKeys.meetings() });
      queryClient.setQueryData(sportsCouncilKeys.meeting(data.id), data);
      toast({
        title: 'Success',
        description: 'Meeting updated successfully!',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to delete a meeting
 */
export function useDeleteMeeting() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/sports-council/meetings/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('d1_session') ? JSON.parse(localStorage.getItem('d1_session')!).access_token : ''}`,
        },
      });
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete meeting');
      }

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sportsCouncilKeys.meetings() });
      toast({
        title: 'Success',
        description: 'Meeting deleted successfully!',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}