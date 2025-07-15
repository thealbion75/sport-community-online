/**
 * Volunteer Dashboard Component
 * Main dashboard for volunteers to manage their profile and applications
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Calendar, MessageSquare, Search, Eye, EyeOff } from 'lucide-react';
import { useVolunteerProfile } from '@/hooks/useVolunteers';
import { useVolunteerApplications } from '@/hooks/useApplications';
import { useAuthContext } from '@/contexts/AuthContext';
import { VolunteerProfile } from './VolunteerProfile';
import { ApplicationsList } from './ApplicationsList';
import type { VolunteerDashboardStats } from '@/types';

interface VolunteerDashboardProps {
  onBrowseOpportunities?: () => void;
  onCreateProfile?: () => void;
}

export const VolunteerDashboard: React.FC<VolunteerDashboardProps> = ({
  onBrowseOpportunities,
  onCreateProfile
}) => {
  const { user } = useAuthContext();
  const { data: profile, isLoading: profileLoading } = useVolunteerProfile(user?.id || '');
  const { data: applications = [], isLoading: applicationsLoading } = useVolunteerApplications(profile?.id || '');

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Welcome to the Volunteer Platform!</CardTitle>
          <CardDescription>
            Create your volunteer profile to start discovering opportunities with local sports clubs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-8">
            <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No profile found</h3>
            <p className="text-gray-600 mb-6">
              You need to create a volunteer profile before you can apply for opportunities.
            </p>
            <div className="flex justify-center gap-4">
              <Button onClick={onCreateProfile}>
                Create Profile
              </Button>
              <Button variant="outline" onClick={onBrowseOpportunities}>
                Browse Opportunities
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate statistics
  const stats: VolunteerDashboardStats = {
    total_applications: applications.length,
    pending_applications: applications.filter(app => app.status === 'pending').length,
    accepted_applications: applications.filter(app => app.status === 'accepted').length,
    opportunities_available: 0 // This would come from a separate query
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {profile.first_name}!</h1>
          <p className="text-gray-600 mt-1">Manage your volunteer profile and applications</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={profile.is_visible ? 'default' : 'secondary'}>
              {profile.is_visible ? (
                <>
                  <Eye className="h-3 w-3 mr-1" />
                  Profile Visible
                </>
              ) : (
                <>
                  <EyeOff className="h-3 w-3 mr-1" />
                  Profile Hidden
                </>
              )}
            </Badge>
            {profile.skills.slice(0, 3).map(skill => (
              <Badge key={skill} variant="outline">{skill}</Badge>
            ))}
            {profile.skills.length > 3 && (
              <Badge variant="outline">+{profile.skills.length - 3} more</Badge>
            )}
          </div>
        </div>
        <Button onClick={onBrowseOpportunities} className="flex items-center gap-2">
          <Search className="h-4 w-4" />
          Browse Opportunities
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Applications</p>
                <p className="text-2xl font-bold">{stats.total_applications}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Pending Applications</p>
                <p className="text-2xl font-bold">{stats.pending_applications}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Accepted Applications</p>
                <p className="text-2xl font-bold">{stats.accepted_applications}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Profile Views</p>
                <p className="text-2xl font-bold">-</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="applications" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="applications">My Applications</TabsTrigger>
          <TabsTrigger value="profile">My Profile</TabsTrigger>
          <TabsTrigger value="opportunities">Find Opportunities</TabsTrigger>
        </TabsList>
        
        <TabsContent value="applications" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">My Applications</h2>
            <Button onClick={onBrowseOpportunities} size="sm">
              <Search className="h-4 w-4 mr-2" />
              Find More Opportunities
            </Button>
          </div>
          <ApplicationsList 
            applications={applications}
            isLoading={applicationsLoading}
          />
        </TabsContent>
        
        <TabsContent value="profile" className="space-y-4">
          <h2 className="text-xl font-semibold">My Profile</h2>
          <VolunteerProfile 
            profile={profile}
            isOwnProfile={true}
          />
        </TabsContent>
        
        <TabsContent value="opportunities" className="space-y-4">
          <div className="text-center py-12">
            <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Discover Volunteer Opportunities</h3>
            <p className="text-gray-600 mb-6">
              Browse available volunteer positions from local sports clubs and find the perfect match for your skills and availability.
            </p>
            <Button onClick={onBrowseOpportunities} size="lg">
              Browse All Opportunities
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};