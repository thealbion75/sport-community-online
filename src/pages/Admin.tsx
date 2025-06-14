
import React, { useState } from 'react';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Users, Building2, UserCheck, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import SportsCouncilAdmin from '@/components/admin/SportsCouncilAdmin';

/**
 * Admin Dashboard Page
 * Protected route for administrators to manage the platform
 */
const Admin = () => {
  const { data: clubStats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-club-stats'],
    queryFn: async () => {
      const [totalClubs, approvedClubs, volunteerPositions] = await Promise.all([
        supabase.from('club_profiles').select('id', { count: 'exact', head: true }),
        supabase.from('club_profiles').select('id', { count: 'exact', head: true }).eq('approved', true),
        supabase.from('club_volunteer_positions').select('id', { count: 'exact', head: true }).eq('is_live', true)
      ]);
      
      return {
        total: totalClubs.count || 0,
        approved: approvedClubs.count || 0,
        pending: (totalClubs.count || 0) - (approvedClubs.count || 0),
        volunteerPositions: volunteerPositions.count || 0
      };
    },
  });

  if (statsLoading) {
    return (
      <Layout>
        <ProtectedRoute>
          <div className="egsport-container py-12">
            <div className="max-w-6xl mx-auto">
              <div className="text-center">
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                </div>
              </div>
            </div>
          </div>
        </ProtectedRoute>
      </Layout>
    );
  }

  return (
    <Layout>
      <ProtectedRoute>
        <div className="egsport-container py-12">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-4">Admin Dashboard</h1>
              <p className="text-xl text-gray-600">
                Manage clubs, volunteer opportunities, and platform content
              </p>
            </div>

            {/* Stats Overview */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Clubs</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{clubStats?.total || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Registered sports clubs
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Approved Clubs</CardTitle>
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{clubStats?.approved || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Live on the platform
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{clubStats?.pending || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Awaiting review
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Live Opportunities</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{clubStats?.volunteerPositions || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Volunteer positions
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Admin Tabs */}
            <Tabs defaultValue="clubs" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="clubs">Club Management</TabsTrigger>
                <TabsTrigger value="volunteers">Volunteer Opportunities</TabsTrigger>
                <TabsTrigger value="sports-council">Sports Council</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="clubs" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Club Management</CardTitle>
                    <CardDescription>
                      Review and manage sports club registrations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      Club management functionality will be implemented here. 
                      This will include approving new club registrations, editing club information, 
                      and managing club status.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="volunteers" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Volunteer Opportunity Management</CardTitle>
                    <CardDescription>
                      Oversee volunteer positions across all clubs
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      Volunteer opportunity management will be implemented here.
                      This will include reviewing, approving, and managing volunteer positions
                      posted by clubs.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="sports-council" className="space-y-4">
                <SportsCouncilAdmin />
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Platform Settings</CardTitle>
                    <CardDescription>
                      Configure platform-wide settings and preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      Platform settings will be implemented here.
                      This could include site configuration, email templates,
                      and other administrative preferences.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </ProtectedRoute>
    </Layout>
  );
};

export default Admin;
