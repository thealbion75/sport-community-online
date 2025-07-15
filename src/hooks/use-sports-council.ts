/**
 * Sports Council React Query Hooks
 * Custom hooks for sports council meeting management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
      let query = supabase
        .from('sports_council_meetings')
        .select('*')
        .eq('is_public', true)
        .order('meeting_date', { ascending: false });

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters?.year) {
        const startDate = `${filters.year}-01-01`;
        const endDate = `${filters.year}-12-31`;
        query = query.gte('meeting_date', startDate).lte('meeting_date', endDate);
      }

      if (filters?.month && filters?.year) {
        const startDate = `${filters.year}-${filters.month.toString().padStart(2, '0')}-01`;
        const endDate = new Date(filters.year, filters.month, 0).toISOString().split('T')[0];
        query = query.gte('meeting_date', startDate).lte('meeting_date', endDate);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch meetings: ${error.message}`);
      }

      return data as SportsCouncilMeeting[];
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
      let query = supabase
        .from('sports_council_meetings')
        .select('*')
        .order('meeting_date', { ascending: false });

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters?.year) {
        const startDate = `${filters.year}-01-01`;
        const endDate = `${filters.year}-12-31`;
        query = query.gte('meeting_date', startDate).lte('meeting_date', endDate);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch meetings: ${error.message}`);
      }

      return data as SportsCouncilMeeting[];
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
      const { data, error } = await supabase
        .from('sports_council_meetings')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(`Failed to fetch meeting: ${error.message}`);
      }

      return data as SportsCouncilMeeting;
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

      const { data, error } = await supabase
        .from('sports_council_admins')
        .select('id')
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to check admin status: ${error.message}`);
      }

      return !!data;
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
      const { data, error } = await supabase
        .from('sports_council_meetings')
        .select('status, meeting_date');

      if (error) {
        throw new Error(`Failed to fetch stats: ${error.message}`);
      }

      const currentYear = new Date().getFullYear();
      const stats: SportsCouncilStats = {
        total_meetings: data.length,
        upcoming_meetings: data.filter(m => m.status === 'upcoming').length,
        completed_meetings: data.filter(m => m.status === 'completed').length,
        meetings_this_year: data.filter(m => 
          new Date(m.meeting_date).getFullYear() === currentYear
        ).length,
      };

      return stats;
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
      const { data, error } = await supabase
        .from('sports_council_meetings')
        .insert([meetingData])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create meeting: ${error.message}`);
      }

      return data as SportsCouncilMeeting;
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
      const { data, error } = await supabase
        .from('sports_council_meetings')
        .update(meetingData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update meeting: ${error.message}`);
      }

      return data as SportsCouncilMeeting;
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
      const { error } = await supabase
        .from('sports_council_meetings')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to delete meeting: ${error.message}`);
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