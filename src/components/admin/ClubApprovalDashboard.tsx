/**
 * Club Approval Dashboard Component
 * Admin overview for club application management with statistics and recent activity
 * Enhanced with comprehensive error handling and loading states
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
  UserX,
  Shield
} from 'lucide-react';
import { useClubApplicationStats, usePendingApplications } from '@/hooks/use-club-approval';
import { useIsAdmin } from '@/hooks/use-admin';
import { formatDistanceToNow } from 'date-fns';
import { ClubApprovalErrorBoundary } from './club-approval/ClubApprovalErrorBoundary';
import { ClubApprovalDashboardSkeleton, AsyncOperationWrapper } from './club-approval/LoadingStates';
import { ErrorDisplay } from './club-approval/ErrorHandling';
import { OfflineCapabilities, NetworkStatusBadge } from './club-approval/OfflineStateHandler';
import { useClubApprovalErrorHandler } from '@/hooks/use-club-approval-error-handling';

interface ClubApprovalDashboardProps {
  onNavigateToApplications?: () => void;
  onNavigateToApplication?: (clubId: string) => void;
}

export const ClubApprovalDashboard: React.FC<ClubApprovalDashboardProps> = ({
  onNavigateToApplications,
  onNavigateToApplication
}) => {
  
  // Check admin permissions
  const { data: isAdmin, isLoading: adminLoading, error: adminError } = useIsAdmin();
  
  // Fetch statistics and recent applications
  const { data: stats, isLoading: statsLoading, error: statsError } = useClubApplicationStats();
  const { data: recentApplications, isLoading: applicationsLoading, error: applicationsError } = usePendingApplications({
    limit: 5,
    sort: 'created_at',
    order: 'desc'
  });

  // Error handling
  const { handleError } = useClubApprovalErrorHandler();

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
    <ClubApprovalErrorBoundary context="Club Approval Dashboard" showReportButton={true}>
      <OfflineCapabilities 
        fallbackMessage="Some dashboard features may be limited while offline. Recent data will be shown when available."
        showQueuedOperations={true}
      >
        <AsyncOperationWrapper
          isLoading={adminLoading}
          error={adminError}
          loadingComponent={<ClubApprovalDashboardSkeleton />}
          errorComponent={
            <ErrorDisplay
              error={adminError}
              onRetry={() => window.location.reload()}
              context="load admin permissions"
              showDetails={true}
            />
          }
        >
          {!isAdmin ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Access Denied
                  </h3>
                  <p className="text-gray-600">
                    You don't have permission to access club approval functions.
                    Only authorized platform administrators can manage club applications.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Header - Mobile Optimized */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                    <Building className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                    <span className="hidden sm:inline">Club Application Management</span>
                    <span className="sm:hidden">Club Applications</span>
                    <NetworkStatusBadge className="ml-2" />
                  </h2>
                  <p className="text-gray-600 mt-1 text-sm sm:text-base">
                    Review and manage club registration applications
                  </p>
                </div>
                <Button 
                  onClick={handleViewAllApplications}
                  className="w-full sm:w-auto min-h-[44px] touch-manipulation"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">View All Applications</span>
                  <span className="sm:hidden">View All</span>
                </Button>
              </div>

              {/* Statistics Cards with Error Handling - Mobile Optimized */}
              <AsyncOperationWrapper
                isLoading={statsLoading}
                error={statsError}
                loadingComponent={
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                    {[...Array(4)].map((_, i) => (
                      <Card key={i}>
                        <CardContent className="p-3 sm:p-6">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                            <Skeleton className="h-8 w-8 sm:h-12 sm:w-12 rounded-lg mx-auto sm:mx-0" />
                            <div className="space-y-1 sm:space-y-2 flex-1 text-center sm:text-left">
                              <Skeleton className="h-3 sm:h-4 w-16 sm:w-20 mx-auto sm:mx-0" />
                              <Skeleton className="h-6 sm:h-8 w-12 sm:w-16 mx-auto sm:mx-0" />
                              <Skeleton className="h-2 sm:h-3 w-20 sm:w-24 mx-auto sm:mx-0" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                }
                errorComponent={
                  <ErrorDisplay
                    error={statsError}
                    onRetry={() => window.location.reload()}
                    context="load application statistics"
                  />
                }
              >
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                  {/* Pending Applications */}
                  <Card className="touch-manipulation">
                    <CardContent className="p-3 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg mx-auto sm:mx-0">
                          <Clock className="h-4 w-4 sm:h-6 sm:w-6 text-orange-600" />
                        </div>
                        <div className="text-center sm:text-left">
                          <p className="text-xs sm:text-sm text-gray-600">Pending Review</p>
                          <p className="text-xl sm:text-2xl font-bold">{stats?.pending || 0}</p>
                          <p className="text-xs text-gray-500 hidden sm:block">
                            Awaiting approval
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Approved Applications */}
                  <Card className="touch-manipulation">
                    <CardContent className="p-3 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                        <div className="p-2 bg-green-100 rounded-lg mx-auto sm:mx-0">
                          <CheckCircle className="h-4 w-4 sm:h-6 sm:w-6 text-green-600" />
                        </div>
                        <div className="text-center sm:text-left">
                          <p className="text-xs sm:text-sm text-gray-600">Approved</p>
                          <p className="text-xl sm:text-2xl font-bold">{stats?.approved || 0}</p>
                          <p className="text-xs text-gray-500 hidden sm:block">
                            Active clubs
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Rejected Applications */}
                  <Card className="touch-manipulation">
                    <CardContent className="p-3 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                        <div className="p-2 bg-red-100 rounded-lg mx-auto sm:mx-0">
                          <XCircle className="h-4 w-4 sm:h-6 sm:w-6 text-red-600" />
                        </div>
                        <div className="text-center sm:text-left">
                          <p className="text-xs sm:text-sm text-gray-600">Rejected</p>
                          <p className="text-xl sm:text-2xl font-bold">{stats?.rejected || 0}</p>
                          <p className="text-xs text-gray-500 hidden sm:block">
                            Declined applications
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Total Applications */}
                  <Card className="touch-manipulation">
                    <CardContent className="p-3 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg mx-auto sm:mx-0">
                          <Users className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
                        </div>
                        <div className="text-center sm:text-left">
                          <p className="text-xs sm:text-sm text-gray-600">Total Applications</p>
                          <p className="text-xl sm:text-2xl font-bold">{stats?.total || 0}</p>
                          <p className="text-xs text-gray-500 hidden sm:block">
                            All time
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </AsyncOperationWrapper>

              {/* Alert for pending actions - Mobile Optimized */}
              {stats && stats.pending > 0 && (
                <Card className="border-orange-200 bg-orange-50">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex items-center gap-3 flex-1">
                        <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0" />
                        <div className="flex-1">
                          <h4 className="font-medium text-orange-800 text-sm sm:text-base">
                            Action Required
                          </h4>
                          <p className="text-xs sm:text-sm text-orange-700">
                            {stats.pending} club application{stats.pending !== 1 ? 's' : ''} awaiting review
                          </p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={handleViewAllApplications}
                        className="bg-orange-600 hover:bg-orange-700 w-full sm:w-auto min-h-[44px] touch-manipulation"
                      >
                        Review Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Recent Activity with Error Handling */}
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
                    <AsyncOperationWrapper
                      isLoading={applicationsLoading}
                      error={applicationsError}
                      loadingComponent={
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
                      }
                      errorComponent={
                        <ErrorDisplay
                          error={applicationsError}
                          onRetry={() => window.location.reload()}
                          context="load recent applications"
                        />
                      }
                    >
                      {recentApplications && recentApplications.data.length > 0 ? (
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
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <Building className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p className="text-sm">No recent applications</p>
                        </div>
                      )}
                    </AsyncOperationWrapper>
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
                        {stats && stats.pending > 0 && (
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
                        {stats && stats.pending > 0 && (
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
                        {stats && (
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
                        {stats && (
                          <span className="ml-auto text-sm text-gray-600">
                            {stats.rejected}
                          </span>
                        )}
                      </Button>
                    </div>

                    {/* Quick Actions for Recent Applications */}
                    {recentApplications && recentApplications.data.length > 0 && (
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
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </AsyncOperationWrapper>
      </OfflineCapabilities>
    </ClubApprovalErrorBoundary>
  );
};