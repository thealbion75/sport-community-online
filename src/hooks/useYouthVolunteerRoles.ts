import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase';
import type { VolunteerOpportunity } from '@/types';

const fetchYouthVolunteerRoles = async (ageFilter?: number): Promise<VolunteerOpportunity[]> => {
  let query = supabase
    .from('volunteer_opportunities')
    .select(`
      *,
      club:clubs(*)
    `)
    .eq('status', 'active')
    .gte('minimum_age', 14)
    .lte('minimum_age', 18);

  if (ageFilter) {
    query = query.gte('minimum_age', ageFilter);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data as VolunteerOpportunity[];
};

export const useYouthVolunteerRoles = (ageFilter?: number) => {
  return useQuery({
    queryKey: ['youth-volunteer-roles', ageFilter],
    queryFn: () => fetchYouthVolunteerRoles(ageFilter),
  });
};
