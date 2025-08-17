/**
 * Club Approval Dashboard Component
 * Admin overview for club application management with statistics and recent activity
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Building, 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp,
  Users,
  FileText,
  AlertTriangle,
  Eye,
  UserCheck,
  UserX
} from 'lucide-react';
import { useClubApplicationStats, usePendingApplications } from '@/hooks/use-club-approval';
import { formatDistanceToNow } from 'date-fns';
interface ClubApprovalDashboardProps {
  onNavigateToApplications?: () => void;
  onNavigateToApplication?: (clubId: string) => void;
}

export const ClubApprovalDashboard: React.FC<ClubApprovalDashboardProps> = ({
  onNavigateToApplications,
  onNavigateToApplication
}) => {
  
  // Fetch statistics and recent applications
  const { data: stats, isLoading: statsLoading } = useClubApplicationStats();
  const { data: recentApplications, isLoading: applicationsLoading } = usePendingApplications({
    limit: 5,
    sort: 'created_at',
    order: 'desc'
  });

  const handleViewAllApplications = () => {
    onNavigateToApplications?.();
  };

  const handleViewApplication = (clubId: string) => {
    onNavigateToApplication?.(clubId);
  };

  const handleQuickApprove = (clubId: string) => {
    onNavigateToApplication?.(clubId);
  };

  const handleQuickReject = (clubId: string) => {
    onNavigateToApplication?.(clubId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Building className="h-6 w-6 text-blue-600" />
            Club Application Management
          </h2>
          <p className="text-gray-600 mt-1">
            Review and manage club registration applications
          </p>
        </div>
        <Button onClick={handleViewAllApplications}>
          <FileText className="h-4 w-4 mr-2" />
          View All Applications
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Pending Applications */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending Review</p>
                {statsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold">{stats?.pending || 0}</p>
                )}
                <p className="text-xs text-gray-500">
                  Awaiting approval
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Approved Applications */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                {statsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold">{stats?.approved || 0}</p>
                )}
                <p className="text-xs text-gray-500">
                  Active clubs
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rejected Applications */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Rejected</p>
                {statsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold">{stats?.rejected || 0}</p>
                )}
                <p className="text-xs text-gray-500">
                  Declined applications
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Applications */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Applications</p>
                {statsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold">{stats?.total || 0}</p>
                )}
                <p className="text-xs text-gray-500">
                  All time
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert for pending actions */}
      {!statsLoading && stats && stats.pending > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div className="flex-1">
                <h4 className="font-medium text-orange-800">
                  Action Required
                </h4>
                <p className="text-sm text-orange-700">
                  {stats.pending} club application{stats.pending !== 1 ? 's' : ''} awaiting review
                </p>
              </div>
              <Button 
                size="sm" 
                onClick={handleViewAllApplications}
                className="bg-orange-600 hover:bg-orange-700"
              >
                Review Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Applications
            </CardTitle>
            <CardDescription>
              Latest club registration submissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {applicationsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentApplications && recentApplications.data.length > 0 ? (
              <div className="space-y-4">
                {recentApplications.data.slice(0, 5).map((application) => (
                  <div 
                    key={application.id} 
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => handleViewApplication(application.id)}
                  >
                    <div className="flex-shrink-0">
                      {application.application_status === 'pending' && (
                        <Clock className="h-4 w-4 text-orange-600" />
                      )}
                      {application.application_status === 'approved' && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                      {application.application_status === 'rejected' && (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {application.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {formatDistanceToNow(new Date(application.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <Badge 
                      variant={
                        application.application_status === 'pending' ? 'secondary' :
                        application.application_status === 'approved' ? 'default' : 'destructive'
                      }
                      className="text-xs"
                    >
                      {application.application_status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Building className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-sm">No recent applications</p>
              </div>
            )}
            
            {recentApplications && recentApplications.data.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleViewAllApplications}
                  className="w-full"
                >
                  View All Applications
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
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
                onClick={handleViewAllApplications}
                disabled={statsLoading}
              >
                <Eye className="h-4 w-4 mr-2" />
                Review All Applications
                {!statsLoading && stats && stats.pending > 0 && (
                  <Badge variant="destructive" className="ml-auto">
                    {stats.pending}
                  </Badge>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={handleViewAllApplications}
                disabled={statsLoading || !stats?.pending}
              >
                <Clock className="h-4 w-4 mr-2" />
                View Pending Applications
                {!statsLoading && stats && stats.pending > 0 && (
                  <span className="ml-auto text-sm text-gray-600">
                    {stats.pending}
                  </span>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={handleViewAllApplications}
                disabled={statsLoading}
              >
                <UserCheck className="h-4 w-4 mr-2" />
                View Approved Clubs
                {!statsLoading && stats && (
                  <span className="ml-auto text-sm text-gray-600">
                    {stats.approved}
                  </span>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={handleViewAllApplications}
                disabled={statsLoading}
              >
                <UserX className="h-4 w-4 mr-2" />
                View Rejected Applications
                {!statsLoading && stats && (
                  <span className="ml-auto text-sm text-gray-600">
                    {stats.rejected}
                  </span>
                )}
              </Button>
            </div>

            {/* Quick Actions for Recent Applications */}
            {recentApplications && recentApplications.data.length > 0 && (
              <>
                <div className="mt-6 pt-4 border-t">
                  <h4 className="text-sm font-medium mb-3 text-gray-700">
                    Quick Review Actions
                  </h4>
                  <div className="space-y-2">
                    {recentApplications.data
                      .filter(app => app.application_status === 'pending')
                      .slice(0, 2)
                      .map((application) => (
                        <div key={application.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <span className="text-xs text-gray-600 flex-1 truncate">
                            {application.name}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleQuickApprove(application.id)}
                            className="h-6 px-2 text-xs"
                          >
                            <CheckCircle className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleQuickReject(application.id)}
                            className="h-6 px-2 text-xs"
                          >
                            <XCircle className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};