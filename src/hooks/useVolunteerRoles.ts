import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useVolunteerRoles() {
  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    const fetchRoles = async () => {
      const { data, error } = await supabase
        .from('volunteer_roles')
        .select('name')
        .order('name');
      if (!error && data) setRoles(data.map((r: { name: string }) => r.name));
    };
    fetchRoles();
  }, []);

  return roles;
}
