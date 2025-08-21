/**
 * Admin Panel Component
 * Main dashboard for platform administrators
 */

import React, { useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Building, 
  Users, 
  Calendar, 
  MessageSquare,
  TrendingUp,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  FileText
} from 'lucide-react';
import { useVerifiedClubs, useUnverifiedClubs } from '@/hooks/use-clubs';
import { useSearchVolunteers } from '@/hooks/use-volunteers';
import { useOpportunities } from '@/hooks/use-opportunities';
import { usePlatformStats } from '@/hooks/use-admin';
import { useClubApplicationStats } from '@/hooks/use-club-approval';
import { ClubVerificationManager } from './ClubVerificationManager';
import { UserManagement } from './UserManagement';
import { ContentModeration } from './ContentModeration';
import { PlatformAnalytics } from './PlatformAnalytics';
import { ClubApprovalDashboard } from './ClubApprovalDashboard';
import { ClubApplicationList } from './ClubApplicationList';
import { ClubApplicationReview } from './ClubApplicationReview';
import { AdminActivityDashboard } from './AdminActivityDashboard';
import { ReportingInterface } from './ReportingInterface';
import { AuditLogViewer } from './AuditLogViewer';
import type { PlatformStats } from '@/types';

export const AdminPanel: React.FC = () => {
  const location = useLocation();
  const params = useParams();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [clubApprovalView, setClubApprovalView] = useState<'dashboard' | 'list' | 'detail'>('dashboard');
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);

  // Handle URL routing for direct access to club approvals
  React.useEffect(() => {
    const path = location.pathname;
    const hash = window.location.hash.replace('#', '');
    
    if (path.includes('/admin/club-approvals')) {
      setActiveTab('club-approvals');
      
      if (params.clubId) {
        setSelectedClubId(params.clubId);
        setClubApprovalView('detail');
      } else if (path === '/admin/club-approvals') {
        setClubApprovalView('list');
      }
    } else if (hash === 'club-approvals') {
      setActiveTab('club-approvals');
    }
  }, [location.pathname, params.clubId]);

  // Fetch data for overview
  const { data: verifiedClubs = [] } = useVerifiedClubs();
  const { data: unverifiedClubs = [] } = useUnverifiedClubs();
  const { data: stats } = usePlatformStats();
  const { data: clubApprovalStats } = useClubApplicationStats();

  const pendingVerifications = unverifiedClubs.length;
  const pendingApprovals = clubApprovalStats?.pending || 0;

  // Provide default stats if not loaded yet
  const platformStats = stats || {
    total_clubs: 0,
    verified_clubs: 0,
    total_volunteers: 0,
    total_opportunities: 0,
    total_applications: 0,
    active_users: 0
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-blue-600" />
            Platform Administration
          </h1>
          <p className="text-gray-600 mt-1">
            Manage and moderate the EGSport volunteer platform
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          <Settings className="h-3 w-3" />
          Administrator Access
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Clubs</p>
                <p className="text-2xl font-bold">{platformStats.total_clubs}</p>
                <p className="text-xs text-gray-500">
                  {platformStats.verified_clubs} verified
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Volunteers</p>
                <p className="text-2xl font-bold">{platformStats.total_volunteers}</p>
                <p className="text-xs text-gray-500">
                  Active profiles
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Opportunities</p>
                <p className="text-2xl font-bold">{platformStats.total_opportunities}</p>
                <p className="text-xs text-gray-500">
                  Active opportunities
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending Actions</p>
                <p className="text-2xl font-bold">{pendingVerifications}</p>
                <p className="text-xs text-gray-500">
                  Club verifications
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert for pending actions */}
      {(pendingVerifications > 0 || pendingApprovals > 0) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div className="flex-1">
                <h4 className="font-medium text-orange-800">
                  Action Required
                </h4>
                <div className="text-sm text-orange-700 space-y-1">
                  {pendingApprovals > 0 && (
                    <p>{pendingApprovals} club application{pendingApprovals !== 1 ? 's' : ''} awaiting approval</p>
                  )}
                  {pendingVerifications > 0 && (
                    <p>{pendingVerifications} club{pendingVerifications !== 1 ? 's' : ''} pending verification</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {pendingApprovals > 0 && (
                  <Button 
                    size="sm" 
                    onClick={() => setActiveTab('club-approvals')}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    Review Approvals
                  </Button>
                )}
                {pendingVerifications > 0 && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setActiveTab('clubs')}
                    className="border-orange-600 text-orange-600 hover:bg-orange-600 hover:text-white"
                  >
                    Review Verifications
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Admin Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="club-approvals">
            Club Approvals
            {pendingApprovals > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingApprovals}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="clubs">
            Clubs
            {pendingVerifications > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingVerifications}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="moderation">Moderation</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
        </TabsList>

        <TabsContent value="club-approvals" className="space-y-6">
          {clubApprovalView === 'dashboard' && (
            <ClubApprovalDashboard 
              onNavigateToApplications={() => setClubApprovalView('list')}
              onNavigateToApplication={(clubId) => {
                setSelectedClubId(clubId);
                setClubApprovalView('detail');
              }}
            />
          )}
          {clubApprovalView === 'list' && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => setClubApprovalView('dashboard')}
                >
                  ← Back to Dashboard
                </Button>
                <h2 className="text-xl font-semibold">Club Applications</h2>
              </div>
              <ClubApplicationList 
                onApplicationSelect={(clubId) => {
                  setSelectedClubId(clubId);
                  setClubApprovalView('detail');
                }}
              />
            </div>
          )}
          {clubApprovalView === 'detail' && selectedClubId && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => setClubApprovalView('list')}
                >
                  ← Back to Applications
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => setClubApprovalView('dashboard')}
                >
                  Dashboard
                </Button>
                <h2 className="text-xl font-semibold">Application Review</h2>
              </div>
              <ClubApplicationReview 
                clubId={selectedClubId}
                onBack={() => setClubApprovalView('list')}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Latest platform activity and registrations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">New club registered</p>
                      <p className="text-xs text-gray-600">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Users className="h-4 w-4 text-blue-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">5 new volunteer profiles</p>
                      <p className="text-xs text-gray-600">Today</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Calendar className="h-4 w-4 text-purple-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">3 new opportunities posted</p>
                      <p className="text-xs text-gray-600">Yesterday</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
                <CardDescription>
                  Common administrative tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button 
                    className="w-full justify-start" 
                    onClick={() => setActiveTab('club-approvals')}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Review Club Approvals
                    {pendingApprovals > 0 && (
                      <Badge variant="destructive" className="ml-auto">
                        {pendingApprovals}
                      </Badge>
                    )}
                  </Button>
                  <Button 
                    variant="outline"
                    className="w-full justify-start" 
                    onClick={() => setActiveTab('clubs')}
                  >
                    <Building className="h-4 w-4 mr-2" />
                    Review Club Verifications
                    {pendingVerifications > 0 && (
                      <Badge variant="destructive" className="ml-auto">
                        {pendingVerifications}
                      </Badge>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setActiveTab('users')}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Manage Users
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setActiveTab('moderation')}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Content Moderation
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setActiveTab('analytics')}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="clubs" className="space-y-6">
          <ClubVerificationManager />
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <UserManagement />
        </TabsContent>

        <TabsContent value="moderation" className="space-y-6">
          <ContentModeration />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <PlatformAnalytics stats={stats} />
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Tabs defaultValue="statistics" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="statistics">Statistics & Reports</TabsTrigger>
              <TabsTrigger value="admin-activity">Admin Activity</TabsTrigger>
            </TabsList>
            
            <TabsContent value="statistics" className="space-y-6">
              <ReportingInterface />
            </TabsContent>
            
            <TabsContent value="admin-activity" className="space-y-6">
              <AdminActivityDashboard />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <AuditLogViewer />
        </TabsContent>
      </Tabs>
    </div>
  );
};