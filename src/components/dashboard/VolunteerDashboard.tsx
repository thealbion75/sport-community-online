/**
 * Volunteer Dashboard Component
 * Main dashboard for volunteer users showing applications, opportunities, and profile
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LoadingContainer } from '@/components/ui/loading-state';
import { useApplicationsByVolunteer, useVolunteerApplicationStats } from '@/hooks/use-applications';
import { useVolunteerProfile } from '@/hooks/use-volunteers';
import { useRecentOpportunities } from '@/hooks/use-opportunities';
import { useUnreadMessageCount } from '@/hooks/use-messages';
import { useCurrentUser } from '@/hooks/use-auth';
import { ApplicationList } from '@/components/applications/ApplicationList';
import { OpportunityCard } from '@/components/clubs/OpportunityCard';
import { 
  User, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle,
  MessageSquare,
  Search,
  Settings,
  TrendingUp,
  Calendar,
  MapPin,
  Users,
  Plus,
  Eye
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function VolunteerDashboard() {
  const [selectedTab, setSelectedTab] = useState('overview');

  const { data: user } = useCurrentUser();
  const { data: volunteerProfile, isLoading: profileLoading } = useVolunteerProfile(user?.id || '');
  const { data: applications, isLoading: applicationsLoading } = useApplicationsByVolunteer(volunteerProfile?.id || '');
  const { data: applicationStats } = useVolunteerApplicationStats(volunteerProfile?.id || '');
  const { data: recentOpportunities } = useRecentOpportunities(6);
  const { data: unreadMessageCount } = useUnreadMessageCount(user?.id || '');

  if (profileLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingContainer isLoading={true} loadingText="Loading your dashboard..." />
      </div>
    );
  }

  if (!volunteerProfile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Complete Your Profile
              </h3>
              <p className="text-gray-600 mb-4">
                Create your volunteer profile to start applying for opportunities and track your applications.
              </p>
              <Button onClick={() => window.location.href = '/profile'}>
                <Plus className="h-4 w-4 mr-2" />
                Create Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const recentApplications = applications?.slice(0, 5) || [];
  const pendingApplications = applications?.filter(app => app.status === 'pending') || [];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {volunteerProfile.first_name}!
          </h1>
          <p className="text-gray-600 mt-1">
            Here's what's happening with your volunteer activities
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => window.location.href = '/volunteer-opportunities'}>
            <Search className="h-4 w-4 mr-2" />
            Find Opportunities
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/profile'}>
            <Settings className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="applications" className="flex items-center gap-2">
            Applications
            {pendingApplications.length > 0 && (
              <Badge variant="secondary">{pendingApplications.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Applications</p>
                    <p className="text-2xl font-bold">{applicationStats?.total || 0}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">{applicationStats?.pending || 0}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Accepted</p>
                    <p className="text-2xl font-bold text-green-600">{applicationStats?.accepted || 0}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Messages</p>
                    <p className="text-2xl font-bold text-purple-600">{unreadMessageCount || 0}</p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks to help you get started
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  onClick={() => window.location.href = '/volunteer-opportunities'}
                >
                  <Search className="h-6 w-6" />
                  <span>Browse Opportunities</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  onClick={() => window.location.href = '/messages'}
                >
                  <MessageSquare className="h-6 w-6" />
                  <span>Check Messages</span>
                  {unreadMessageCount && unreadMessageCount > 0 && (
                    <Badge variant="destructive">{unreadMessageCount}</Badge>
                  )}
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  onClick={() => window.location.href = '/profile'}
                >
                  <User className="h-6 w-6" />
                  <span>Update Profile</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Applications */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Recent Applications</CardTitle>
                  <CardDescription>
                    Your latest volunteer applications
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedTab('applications')}
                >
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <LoadingContainer isLoading={applicationsLoading}>
                {recentApplications.length > 0 ? (
                  <div className="space-y-3">
                    {recentApplications.map((application) => (
                      <div key={application.id} className="flex items-center justify-between p-3 border rounded-md">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                            <FileText className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">{application.opportunity?.title}</p>
                            <p className="text-sm text-gray-600">
                              {application.opportunity?.club?.name}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={
                            application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            application.status === 'accepted' ? 'bg-green-100 text-green-800' :
                            application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }>
                            {application.status}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(application.applied_at))} ago
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">No applications yet</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => window.location.href = '/volunteer-opportunities'}
                    >
                      Find Opportunities
                    </Button>
                  </div>
                )}
              </LoadingContainer>
            </CardContent>
          </Card>

          {/* New Opportunities */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>New Opportunities</CardTitle>
                  <CardDescription>
                    Recently posted volunteer opportunities
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedTab('opportunities')}
                >
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentOpportunities && recentOpportunities.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recentOpportunities.map((opportunity) => (
                    <OpportunityCard
                      key={opportunity.id}
                      opportunity={opportunity}
                      isOwner={false}
                      onApply={() => window.location.href = `/opportunities/${opportunity.id}/apply`}
                      onView={() => window.location.href = `/opportunities/${opportunity.id}`}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">No new opportunities available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Applications Tab */}
        <TabsContent value="applications">
          <ApplicationList
            applications={applications || []}
            isLoading={applicationsLoading}
            onViewDetails={(id) => window.location.href = `/applications/${id}`}
            onMessage={(id) => window.location.href = `/messages/compose?application=${id}`}
          />
        </TabsContent>

        {/* Opportunities Tab */}
        <TabsContent value="opportunities">
          <Card>
            <CardHeader>
              <CardTitle>Available Opportunities</CardTitle>
              <CardDescription>
                Browse and apply for volunteer opportunities
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentOpportunities && recentOpportunities.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {recentOpportunities.map((opportunity) => (
                    <OpportunityCard
                      key={opportunity.id}
                      opportunity={opportunity}
                      isOwner={false}
                      onApply={() => window.location.href = `/opportunities/${opportunity.id}/apply`}
                      onView={() => window.location.href = `/opportunities/${opportunity.id}`}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No opportunities available
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Check back later for new volunteer opportunities.
                  </p>
                  <Button onClick={() => window.location.href = '/volunteer-opportunities'}>
                    Browse All Opportunities
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Your Profile</CardTitle>
              <CardDescription>
                Manage your volunteer profile and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Summary */}
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={volunteerProfile.profile_image_url} />
                  <AvatarFallback className="text-lg">
                    {volunteerProfile.first_name[0]}{volunteerProfile.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">
                    {volunteerProfile.first_name} {volunteerProfile.last_name}
                  </h3>
                  <p className="text-gray-600">{volunteerProfile.email}</p>
                  {volunteerProfile.location && (
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {volunteerProfile.location}
                    </p>
                  )}
                </div>
              </div>

              {/* Skills */}
              {volunteerProfile.skills.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {volunteerProfile.skills.map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Availability */}
              {volunteerProfile.availability.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Availability</h4>
                  <div className="flex flex-wrap gap-2">
                    {volunteerProfile.availability.map((time) => (
                      <Badge key={time} variant="outline">
                        <Calendar className="h-3 w-3 mr-1" />
                        {time}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Bio */}
              {volunteerProfile.bio && (
                <div>
                  <h4 className="font-medium mb-3">About Me</h4>
                  <p className="text-gray-700">{volunteerProfile.bio}</p>
                </div>
              )}

              {/* Profile Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <Button onClick={() => window.location.href = '/profile'}>
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
                <Button variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview Public Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}