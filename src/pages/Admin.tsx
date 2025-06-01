import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { ClubProfile } from '@/types/club';

const Admin = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingClubs, setPendingClubs] = useState<ClubProfile[]>([]);
  const [approvedClubs, setApprovedClubs] = useState<ClubProfile[]>([]);

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase.rpc('is_admin', { user_id: user.id });
        
        if (error) {
          console.error('Error checking admin status:', error);
          return;
        }
        
        setIsAdmin(data);
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };

    checkAdminStatus();
  }, [user]);

  // Fetch club profiles
  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const { data, error } = await supabase
          .from('club_profiles')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const pending = data?.filter(club => !club.approved) || [];
        const approved = data?.filter(club => club.approved) || [];
        
        setPendingClubs(pending);
        setApprovedClubs(approved);
      } catch (error) {
        console.error('Error fetching clubs:', error);
        toast({
          variant: 'destructive',
          title: 'Failed to load clubs',
          description: 'There was a problem loading the club data.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (isAdmin) {
      fetchClubs();
    } else {
      setIsLoading(false);
    }
  }, [isAdmin]);

  // Approve a club
  const handleApprove = async (clubId: string) => {
    try {
      const { error } = await supabase
        .from('club_profiles')
        .update({ approved: true })
        .eq('id', clubId);
      
      if (error) throw error;
      
      // Move club from pending to approved
      const clubToMove = pendingClubs.find(club => club.id === clubId);
      if (clubToMove) {
        setPendingClubs(pendingClubs.filter(club => club.id !== clubId));
        setApprovedClubs([{ ...clubToMove, approved: true }, ...approvedClubs]);
      }
      
      toast({
        title: 'Club approved',
        description: 'The club has been successfully approved.',
      });
    } catch (error) {
      console.error('Error approving club:', error);
      toast({
        variant: 'destructive',
        title: 'Approval failed',
        description: 'There was a problem approving the club.',
      });
    }
  };

  // Reject/unapprove a club
  const handleReject = async (clubId: string) => {
    try {
      const { error } = await supabase
        .from('club_profiles')
        .update({ approved: false })
        .eq('id', clubId);
      
      if (error) throw error;
      
      // Move club from approved to pending if it was approved
      const clubToMove = approvedClubs.find(club => club.id === clubId);
      if (clubToMove) {
        setApprovedClubs(approvedClubs.filter(club => club.id !== clubId));
        setPendingClubs([{ ...clubToMove, approved: false }, ...pendingClubs]);
      }
      
      toast({
        title: 'Club status updated',
        description: 'The club approval status has been updated.',
      });
    } catch (error) {
      console.error('Error updating club status:', error);
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: 'There was a problem updating the club status.',
      });
    }
  };

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
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
            <p className="text-gray-600">
              You do not have permission to view this page.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="egsport-container py-12">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

            {/* Pending Clubs */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Pending Clubs</h2>
              {pendingClubs.length === 0 ? (
                <p className="text-gray-600">No clubs are currently pending approval.</p>
              ) : (
                <div className="grid gap-4">
                  {pendingClubs.map((club) => (
                    <Card key={club.id}>
                      <CardHeader>
                        <CardTitle>{club.club_name}</CardTitle>
                        <CardDescription>{club.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p>Category: {club.category}</p>
                        <p>Contact Email: {club.contact_email}</p>
                      </CardContent>
                      <div className="flex justify-end space-x-2 p-4">
                        <Button onClick={() => handleApprove(club.id)} className="bg-green-500 hover:bg-green-700 text-white">
                          Approve
                        </Button>
                        <Button onClick={() => handleReject(club.id)} className="bg-red-500 hover:bg-red-700 text-white">
                          Reject
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            {/* Approved Clubs */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">Approved Clubs</h2>
              {approvedClubs.length === 0 ? (
                <p className="text-gray-600">No clubs have been approved yet.</p>
              ) : (
                <div className="grid gap-4">
                  {approvedClubs.map((club) => (
                    <Card key={club.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle>{club.club_name}</CardTitle>
                          <Badge variant="secondary">Approved</Badge>
                        </div>
                        <CardDescription>{club.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p>Category: {club.category}</p>
                        <p>Contact Email: {club.contact_email}</p>
                      </CardContent>
                      <div className="flex justify-end p-4">
                        <Button onClick={() => handleReject(club.id)} className="bg-red-500 hover:bg-red-700 text-white">
                          Unapprove
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default Admin;
