/**
 * Main Dashboard Component
 * Routes users to appropriate dashboard based on their role
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Building, 
  Calendar, 
  MessageSquare, 
  TrendingUp,
  UserPlus,
  Search,
  Settings
} from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useVolunteerProfile } from '@/hooks/use-volunteers';
import { useClubByEmail } from '@/hooks/use-clubs';
import { useUnreadMessageCount } from '@/hooks/use-messages';
import { VolunteerDashboard } from '@/components/volunteers';
import { ClubDashboard } from '@/components/clubs';
import { getUserRole, UserRole } from '@/lib/auth';
import { Link } from 'react-router-dom';

export const MainDashboard: React.FC = () => {
  const { user } = useAuthContext();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { data: volunteerProfile, isLoading: volunteerLoading } = useVolunteerProfile(user?.id || '');
  const { data: club, isLoading: clubLoading } = useClubByEmail(user?.email || '');
  const { data: unreadCount = 0 } = useUnreadMessageCount(user?.id || '');

  // Determine user role
  useEffect(() => {
    if (user) {
      getUserRole(user).then((role) => {
        setUserRole(role);
        setIsLoading(false);
      });
    }
  }, [user]);

  if (isLoading || volunteerLoading || clubLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // New user without profile - show onboarding
  if (!volunteerProfile && !club) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome to EGSport Volunteer Platform!
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Connect with local sports clubs and volunteers in East Grinstead
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Volunteer Option */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle>I want to volunteer</CardTitle>
                <CardDescription>
                  Help local sports clubs by volunteering your time and skills
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <ul className="text-sm text-gray-600 mb-6 space-y-2">
                  <li>• Browse volunteer opportunities</li>
                  <li>• Apply to positions that match your skills</li>
                  <li>• Connect with local sports clubs</li>
                  <li>• Make a difference in your community</li>
                </ul>
                <Link to="/volunteer/register">
                  <Button className="w-full">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create Volunteer Profile
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Club Option */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Building className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle>I represent a sports club</CardTitle>
                <CardDescription>
                  Find volunteers to help grow and support your club
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <ul className="text-sm text-gray-600 mb-6 space-y-2">
                  <li>• Post volunteer opportunities</li>
                  <li>• Search for skilled volunteers</li>
                  <li>• Manage applications and communications</li>
                  <li>• Grow your club's volunteer base</li>
                </ul>
                <Link to="/club/register">
                  <Button className="w-full">
                    <Building className="h-4 w-4 mr-2" />
                    Register Your Club
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Explore the Platform</CardTitle>
              <CardDescription>
                Get started by exploring what's available
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link to="/opportunities">
                  <Button variant="outline" className="w-full">
                    <Search className="h-4 w-4 mr-2" />
                    Browse Opportunities
                  </Button>
                </Link>
                <Link to="/clubs">
                  <Button variant="outline" className="w-full">
                    <Building className="h-4 w-4 mr-2" />
                    View Clubs
                  </Button>
                </Link>
                <Link to="/messages">
                  <Button variant="outline" className="w-full">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Messages
                    {unreadCount > 0 && (
                      <Badge variant="destructive" className="ml-2">
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Volunteer Dashboard
  if (userRole === UserRole.VOLUNTEER && volunteerProfile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <VolunteerDashboard 
          onBrowseOpportunities={() => window.location.href = '/opportunities'}
          onCreateProfile={() => window.location.href = '/volunteer/register'}
        />
      </div>
    );
  }

  // Club Dashboard
  if (userRole === UserRole.CLUB_ADMIN && club) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ClubDashboard 
          onCreateOpportunity={() => window.location.href = '/club/opportunities/new'}
        />
      </div>
    );
  }

  // Platform Admin Dashboard - redirect to AdminPanel
  if (userRole === UserRole.PLATFORM_ADMIN) {
    // For platform admins, redirect to the full admin panel
    window.location.href = '/admin';
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Redirecting to admin panel...</p>
          </div>
        </div>
      </div>
    );
  }

  // Fallback - shouldn't reach here
  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardContent className="text-center py-8">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Unable to determine dashboard type
          </h3>
          <p className="text-gray-600 mb-4">
            Please try refreshing the page or contact support if the issue persists.
          </p>
          <Button onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};