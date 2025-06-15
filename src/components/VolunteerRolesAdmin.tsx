import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';

interface VolunteerRole {
  id: number;
  name: string;
}

const VolunteerRolesAdmin: React.FC = () => {
  const [roles, setRoles] = useState<VolunteerRole[]>([]);
  const [newRole, setNewRole] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    const { data, error } = await supabase
      .from('volunteer_roles')
      .select('*')
      .order('name');
    if (!error && data) setRoles(data);
  };

  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRole.trim()) return;
    setIsLoading(true);
    const { error } = await supabase
      .from('volunteer_roles')
      .insert([{ name: newRole.trim() }]);
    setIsLoading(false);
    if (!error) {
      toast({ title: 'Role added', description: 'Volunteer role added.' });
      setNewRole('');
      fetchRoles();
    }
  };

  const handleDeleteRole = async (id: number) => {
    if (!window.confirm('Delete this role?')) return;
    setIsLoading(true);
    const { error } = await supabase
      .from('volunteer_roles')
      .delete()
      .eq('id', id);
    setIsLoading(false);
    if (!error) {
      toast({ title: 'Role deleted', description: 'Volunteer role deleted.' });
      fetchRoles();
    }
  };

  return (
    <div className="mb-12">
      <h2 className="text-2xl font-semibold mb-4">Volunteer Roles Admin</h2>
      <form onSubmit={handleAddRole} className="flex space-x-2 mb-4">
        <Input
          value={newRole}
          onChange={e => setNewRole(e.target.value)}
          placeholder="Add new role"
          className="w-64"
        />
        <Button type="submit" className="bg-egsport-blue" disabled={isLoading}>Add Role</Button>
      </form>
      <ul className="space-y-2">
        {roles.map(role => (
          <li key={role.id} className="flex items-center justify-between bg-gray-50 rounded p-2">
            <span>{role.name}</span>
            <Button size="sm" variant="destructive" onClick={() => handleDeleteRole(role.id)} disabled={isLoading}>Delete</Button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default VolunteerRolesAdmin;

export const useVolunteerRoles = () => {
  const [roles, setRoles] = useState<VolunteerRole[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('volunteer_roles')
      .select('*')
      .order('name');
    setIsLoading(false);
    if (!error && data) setRoles(data);
  };

  return { roles, isLoading, refetch: fetchRoles };
};
