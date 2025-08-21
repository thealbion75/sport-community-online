/**
 * ClubApplicationReview Component
 * Detailed application review interface for administrators
 */

import React, { useState } from 'react';
import { format } from 'date-fns';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock,
  User,
  FileText,
  ExternalLink,
  Shield,
  RefreshCw
} from 'lucide-react';
import { 
  useClubApplication, 
  useApplicationHistory, 
  useApproveApplication, 
  useRejectApplication 
} from '@/hooks/use-club-approval';
import { useIsAdmin } from '@/hooks/use-admin';
import { ClubApplicationReview as ClubApplicationReviewType } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ClubApprovalErrorBoundary } from './club-approval/ClubApprovalErrorBoundary';
import { ClubApplicationReviewSkeleton, AsyncOperationWrapper, InlineLoadingState } from './club-approval/LoadingStates';
import { ErrorDisplay, RetryableOperation } from './club-approval/ErrorHandling';
import { OfflineCapabilities, NetworkStatusBadge } from './club-approval/OfflineStateHandler';
import { useClubApprovalErrorHandler } from '@/hooks/use-club-approval-error-handling';
import { SwipeNavigation } from './club-approval/SwipeNavigation';
import { ApplicationHistoryTimeline } from './ApplicationHistoryTimeline';
import { useLogAdminAction } from '@/hooks/use-admin-audit-reporting';

interface ClubApplicationReviewProps {
  clubId: string;
  onBack?: () => void;
  onNavigateNext?: () => void;
  onNavigatePrevious?: () => void;
  className?: string;
}

export const ClubApplicationReview: React.FC<ClubApplicationReviewProps> = ({
  clubId,
  onBack,
  onNavigateNext,
  onNavigatePrevious,
  className
}) => {
  // Check admin permissions
  const { data: isAdmin, isLoading: adminLoading, error: adminError } = useIsAdmin();
  
  // Error handling
  const { handleError } = useClubApprovalErrorHandler();
  
  // State for admin notes and confirmation dialogs
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);

  // Fetch application data and history
  const { data: applicationData, isLoading: isLoadingApplication, error: applicationError } = useClubApplication(clubId);
  const { data: historyData, isLoading: isLoadingHistory } = useApplicationHistory(clubId);

  // Mutations for approval and rejection
  const approveApplication = useApproveApplication();
  const rejectApplication = useRejectApplication();
  
  // Audit logging
  const logAdminAction = useLogAdminAction();

  // Handle approval action
  const handleApprove = async () => {
    if (!applicationData) return;
    
    try {
      await approveApplication.mutateAsync({
        clubId: applicationData.club.id,
        adminNotes: adminNotes.trim() || undefined
      });
      
      // Log the admin action for audit trail
      logAdminAction.mutate({
        actionType: 'approve',
        targetType: 'club_application',
        targetId: applicationData.club.id,
        targetName: applicationData.club.name,
        details: adminNotes.trim() || 'Application approved'
      });
      
      setShowApprovalDialog(false);
      setAdminNotes('');
    } catch (error) {
      // Error handling is done in the hook
      console.error('Failed to approve application:', error);
    }
  };

  // Handle rejection action
  const handleReject = async () => {
    if (!applicationData || !rejectionReason.trim()) return;
    
    try {
      await rejectApplication.mutateAsync({
        clubId: applicationData.club.id,
        rejectionReason: rejectionReason.trim()
      });
      
      // Log the admin action for audit trail
      logAdminAction.mutate({
        actionType: 'reject',
        targetType: 'club_application',
        targetId: applicationData.club.id,
        targetName: applicationData.club.name,
        details: `Application rejected: ${rejectionReason.trim()}`
      });
      
      setShowRejectionDialog(false);
      setRejectionReason('');
    } catch (error) {
      // Error handling is done in the hook
      console.error('Failed to reject application:', error);
    }
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'rejected':
        return 'destructive';
      case 'pending':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  // Get action icon for history
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <ClubApprovalErrorBoundary context="Club Application Review" showReportButton={true}>
      <OfflineCapabilities 
        fallbackMessage="Application details may be limited while offline. Some actions may be queued until you're back online."
        showQueuedOperations={true}
      >
        <SwipeNavigation
          onSwipeLeft={onNavigateNext}
          onSwipeRight={onNavigatePrevious}
          className={className}
          disabled={!onNavigateNext && !onNavigatePrevious}
        >
          <AsyncOperationWrapper
            isLoading={adminLoading}
            error={adminError}
            loadingComponent={<ClubApplicationReviewSkeleton />}
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
                      You don't have permission to review club applications.
                      Only authorized platform administrators can review and process club applications.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <AsyncOperationWrapper
                isLoading={isLoadingApplication}
                error={applicationError}
                loadingComponent={<ClubApplicationReviewSkeleton />}
                errorComponent={
                  <Card>
                    <CardContent className="text-center py-12">
                      <ErrorDisplay
                        error={applicationError}
                        onRetry={() => window.location.reload()}
                        onGoBack={onBack}
                        context="load application details"
                        showDetails={true}
                      />
                    </CardContent>
                  </Card>
                }
              >
                {applicationData && (
                  <ApplicationReviewContent
                    applicationData={applicationData}
                    historyData={historyData}
                    isLoadingHistory={isLoadingHistory}
                    onBack={onBack}
                    adminNotes={adminNotes}
                    setAdminNotes={setAdminNotes}
                    rejectionReason={rejectionReason}
                    setRejectionReason={setRejectionReason}
                    showApprovalDialog={showApprovalDialog}
                    setShowApprovalDialog={setShowApprovalDialog}
                    showRejectionDialog={showRejectionDialog}
                    setShowRejectionDialog={setShowRejectionDialog}
                    handleApprove={handleApprove}
                    handleReject={handleReject}
                    approveApplication={approveApplication}
                    rejectApplication={rejectApplication}
                    getStatusBadgeVariant={getStatusBadgeVariant}
                    getActionIcon={getActionIcon}
                  />
                )}
              </AsyncOperationWrapper>
            )}
          </AsyncOperationWrapper>
        </SwipeNavigation>
      </OfflineCapabilities>
    </ClubApprovalErrorBoundary>
  );
}

interface ApplicationReviewContentProps {
  applicationData: any;
  historyData: any;
  isLoadingHistory: boolean;
  onBack?: () => void;
  adminNotes: string;
  setAdminNotes: React.Dispatch<React.SetStateAction<string>>;
  rejectionReason: string;
  setRejectionReason: React.Dispatch<React.SetStateAction<string>>;
  showApprovalDialog: boolean;
  setShowApprovalDialog: React.Dispatch<React.SetStateAction<boolean>>;
  showRejectionDialog: boolean;
  setShowRejectionDialog: React.Dispatch<React.SetStateAction<boolean>>;
  handleApprove: () => Promise<void>;
  handleReject: () => Promise<void>;
  approveApplication: any;
  rejectApplication: any;
  getStatusBadgeVariant: (status: string) => any;
  getActionIcon: (action: string) => React.ReactNode;
}

const ApplicationReviewContent: React.FC<ApplicationReviewContentProps> = ({
  applicationData,
  historyData,
  isLoadingHistory,
  onBack,
  adminNotes,
  setAdminNotes,
  rejectionReason,
  setRejectionReason,
  showApprovalDialog,
  setShowApprovalDialog,
  showRejectionDialog,
  setShowRejectionDialog,
  handleApprove,
  handleReject,
  approveApplication,
  rejectApplication,
  getStatusBadgeVariant,
  getActionIcon
}) => {

  const { club } = applicationData;
  const isPending = club.application_status === 'pending';
  const isProcessing = approveApplication.isPending || rejectApplication.isPending;

  return (
    <div className="space-y-4">
      {/* Header - Mobile Optimized */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            {onBack && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onBack}
                className="mb-3 touch-manipulation"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to List
              </Button>
            )}
            <div>
              <h1 className="text-xl sm:text-2xl font-bold flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="break-words">{club.name}</span>
                <NetworkStatusBadge />
              </h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2">
                <Badge variant={getStatusBadgeVariant(club.application_status)}>
                  {club.application_status.charAt(0).toUpperCase() + club.application_status.slice(1)}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Applied {format(new Date(club.created_at), 'MMM d, yyyy')}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons - Mobile Optimized */}
          {isPending && (
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <AlertDialog open={showRejectionDialog} onOpenChange={setShowRejectionDialog}>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    disabled={isProcessing}
                    className="w-full sm:w-auto min-h-[44px] touch-manipulation"
                  >
                    {rejectApplication.isPending ? (
                      <InlineLoadingState isLoading={true} text="Rejecting..." size="sm" />
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="mx-4 max-w-md">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reject Application</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to reject this club application? This action cannot be undone.
                      The applicant will be notified via email.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="space-y-2">
                    <Label htmlFor="rejection-reason">Rejection Reason *</Label>
                    <Textarea
                      id="rejection-reason"
                      placeholder="Please provide a reason for rejection..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="min-h-[100px] touch-manipulation"
                    />
                  </div>
                  <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                    <AlertDialogCancel className="w-full sm:w-auto touch-manipulation">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleReject}
                      disabled={!rejectionReason.trim() || rejectApplication.isPending}
                      className="bg-destructive hover:bg-destructive/90 w-full sm:w-auto touch-manipulation"
                    >
                      {rejectApplication.isPending ? 'Rejecting...' : 'Reject Application'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
                <AlertDialogTrigger asChild>
                  <Button 
                    disabled={isProcessing}
                    className="w-full sm:w-auto min-h-[44px] touch-manipulation"
                  >
                    {approveApplication.isPending ? (
                      <InlineLoadingState isLoading={true} text="Approving..." size="sm" />
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="mx-4 max-w-md">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Approve Application</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to approve this club application? The club will gain access to the platform
                      and receive login credentials via email.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="space-y-2">
                    <Label htmlFor="admin-notes">Admin Notes (Optional)</Label>
                    <Textarea
                      id="admin-notes"
                      placeholder="Add any internal notes about this approval..."
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      className="min-h-[80px] touch-manipulation"
                    />
                  </div>
                  <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                    <AlertDialogCancel className="w-full sm:w-auto touch-manipulation">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleApprove}
                      disabled={approveApplication.isPending}
                      className="w-full sm:w-auto touch-manipulation"
                    >
                      {approveApplication.isPending ? 'Approving...' : 'Approve Application'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </div>

      {/* Main Content - Mobile Optimized */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Application Details */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Club Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Club Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Club Name</Label>
                <p className="text-sm text-muted-foreground mt-1">{club.name}</p>
              </div>

              {club.description && (
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                    {club.description}
                  </p>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium">Location</Label>
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {club.location}
                </p>
              </div>

              {club.sport_types && club.sport_types.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Sports</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {club.sport_types.map((sport, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {sport}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {club.website_url && (
                <div>
                  <Label className="text-sm font-medium">Website</Label>
                  <a
                    href={club.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline mt-1 flex items-center gap-1"
                  >
                    <Globe className="h-3 w-3" />
                    {club.website_url}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Email</Label>
                <a
                  href={`mailto:${club.contact_email}`}
                  className="text-sm text-primary hover:underline mt-1 flex items-center gap-1"
                >
                  <Mail className="h-3 w-3" />
                  {club.contact_email}
                </a>
              </div>

              {club.contact_phone && (
                <div>
                  <Label className="text-sm font-medium">Phone</Label>
                  <a
                    href={`tel:${club.contact_phone}`}
                    className="text-sm text-primary hover:underline mt-1 flex items-center gap-1"
                  >
                    <Phone className="h-3 w-3" />
                    {club.contact_phone}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Admin Notes (if any) */}
          {club.admin_notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Admin Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {club.admin_notes}
                </p>
                {club.reviewed_at && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Added {format(new Date(club.reviewed_at), 'MMM d, yyyy at h:mm a')}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4 sm:space-y-6">
          {/* Enhanced Application Timeline */}
          <ApplicationHistoryTimeline clubId={club.id} />

          {/* Application Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Application Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs font-medium text-muted-foreground">Submitted</Label>
                <p className="text-sm">
                  {format(new Date(club.created_at), 'MMM d, yyyy at h:mm a')}
                </p>
              </div>
              
              {club.updated_at !== club.created_at && (
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Last Updated</Label>
                  <p className="text-sm">
                    {format(new Date(club.updated_at), 'MMM d, yyyy at h:mm a')}
                  </p>
                </div>
              )}

              {club.reviewed_at && (
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Reviewed</Label>
                  <p className="text-sm">
                    {format(new Date(club.reviewed_at), 'MMM d, yyyy at h:mm a')}
                  </p>
                </div>
              )}

              <div>
                <Label className="text-xs font-medium text-muted-foreground">Application ID</Label>
                <p className="text-sm font-mono">{club.id}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ClubApplicationReview;