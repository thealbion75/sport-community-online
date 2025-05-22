
import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Facebook, Instagram, Twitter, Globe } from 'lucide-react';

interface ClubProfile {
  id: string;
  club_name: string;
  category: string;
  contact_email: string;
  contact_phone: string | null;
  description: string;
  website: string | null;
  facebook_url: string | null;
  twitter_url: string | null;
  instagram_url: string | null;
  meeting_times: string;
  approved: boolean;
  created_at: string;
}

const Admin = () => {
  const [pendingClubs, setPendingClubs] = useState<ClubProfile[]>([]);
  const [approvedClubs, setApprovedClubs] = useState<ClubProfile[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // Check if the current user is an admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('admin_roles')
          .select('is_admin')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
          return;
        }
        
        setIsAdmin(data?.is_admin || false);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  // Fetch club profiles
  useEffect(() => {
    const fetchClubProfiles = async () => {
      if (!user || !isAdmin) return;

      try {
        const { data, error } = await supabase
          .from('club_profiles')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          throw error;
        }
        
        if (data) {
          setPendingClubs(data.filter(club => !club.approved));
          setApprovedClubs(data.filter(club => club.approved));
        }
      } catch (error) {
        console.error('Error fetching club profiles:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load club profiles.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (isAdmin) {
      fetchClubProfiles();
    } else {
      setIsLoading(false);
    }
  }, [user, isAdmin]);

  const approveClub = async (id: string) => {
    try {
      const { error } = await supabase
        .from('club_profiles')
        .update({ approved: true })
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      // Update local state
      const updatedClub = pendingClubs.find(club => club.id === id);
      if (updatedClub) {
        setPendingClubs(pendingClubs.filter(club => club.id !== id));
        setApprovedClubs([{ ...updatedClub, approved: true }, ...approvedClubs]);
      }
      
      toast({
        title: 'Club approved',
        description: 'The club profile has been approved and is now publicly visible.',
      });
    } catch (error) {
      console.error('Error approving club:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to approve club profile.',
      });
    }
  };

  const revokeApproval = async (id: string) => {
    try {
      const { error } = await supabase
        .from('club_profiles')
        .update({ approved: false })
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      // Update local state
      const updatedClub = approvedClubs.find(club => club.id === id);
      if (updatedClub) {
        setApprovedClubs(approvedClubs.filter(club => club.id !== id));
        setPendingClubs([{ ...updatedClub, approved: false }, ...pendingClubs]);
      }
      
      toast({
        title: 'Approval revoked',
        description: 'The club profile is no longer publicly visible.',
      });
    } catch (error) {
      console.error('Error revoking approval:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to revoke approval for club profile.',
      });
    }
  };

  const SocialLinks = ({ club }: { club: ClubProfile }) => (
    <div className="flex space-x-2 mt-2">
      {club.website && (
        <a href={club.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">
          <Globe className="h-4 w-4" />
        </a>
      )}
      {club.facebook_url && (
        <a href={club.facebook_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
          <Facebook className="h-4 w-4" />
        </a>
      )}
      {club.instagram_url && (
        <a href={club.instagram_url} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:text-pink-800">
          <Instagram className="h-4 w-4" />
        </a>
      )}
      {club.twitter_url && (
        <a href={club.twitter_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-600">
          <Twitter className="h-4 w-4" />
        </a>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <Layout>
        <div className="egsport-container py-12">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-egsport-blue"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="egsport-container py-12">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="text-gray-600">You do not have permission to access the admin page.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="egsport-container py-12">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
          
          <div className="space-y-12">
            {/* Pending Approvals Section */}
            <div>
              <h2 className="text-2xl font-semibold mb-4">Pending Approvals</h2>
              {pendingClubs.length === 0 ? (
                <p className="text-gray-500 italic">No pending club approvals</p>
              ) : (
                <div className="space-y-4">
                  {pendingClubs.map((club) => (
                    <div key={club.id} className="border rounded-lg p-6 bg-white shadow-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-medium">{club.club_name}</h3>
                          <p className="text-sm text-gray-500">Sport: {club.category}</p>
                          <p className="text-sm text-gray-500">
                            Contact: {club.contact_email} 
                            {club.contact_phone && ` | ${club.contact_phone}`}
                          </p>
                          <p className="mt-2">{club.description}</p>
                          <p className="text-sm text-gray-500 mt-2">Meeting times: {club.meeting_times}</p>
                          <SocialLinks club={club} />
                        </div>
                        <Button 
                          onClick={() => approveClub(club.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Approve
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Approved Clubs Section */}
            <div>
              <h2 className="text-2xl font-semibold mb-4">Approved Clubs</h2>
              {approvedClubs.length === 0 ? (
                <p className="text-gray-500 italic">No approved clubs</p>
              ) : (
                <div className="space-y-4">
                  {approvedClubs.map((club) => (
                    <div key={club.id} className="border rounded-lg p-6 bg-white shadow-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-medium">{club.club_name}</h3>
                          <p className="text-sm text-gray-500">Sport: {club.category}</p>
                          <p className="text-sm text-gray-500">
                            Contact: {club.contact_email} 
                            {club.contact_phone && ` | ${club.contact_phone}`}
                          </p>
                          <p className="mt-2">{club.description}</p>
                          <p className="text-sm text-gray-500 mt-2">Meeting times: {club.meeting_times}</p>
                          <SocialLinks club={club} />
                        </div>
                        <Button 
                          onClick={() => revokeApproval(club.id)}
                          variant="outline"
                          className="border-red-500 text-red-500 hover:bg-red-50"
                        >
                          Revoke Approval
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Admin;
