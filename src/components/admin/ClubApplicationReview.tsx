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
  ExternalLink
} from 'lucide-react';
import { 
  useClubApplication, 
  useApplicationHistory, 
  useApproveApplication, 
  useRejectApplication 
} from '@/hooks/use-club-approval';
import { ClubApplicationReview as ClubApplicationReviewType } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
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

interface ClubApplicationReviewProps {
  clubId: string;
  onBack?: () => void;
  className?: string;
}

export const ClubApplicationReview: React.FC<ClubApplicationReviewProps> = ({
  clubId,
  onBack,
  className
}) => {
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

  // Handle approval action
  const handleApprove = async () => {
    if (!applicationData) return;
    
    try {
      await approveApplication.mutateAsync({
        clubId: applicationData.club.id,
        adminNotes: adminNotes.trim() || undefined
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

  // Loading state
  if (isLoadingApplication) {
    return (
      <div className={className}>
        <div className="space-y-6">
          {/* Header skeleton */}
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" data-testid="skeleton" />
            <Skeleton className="h-8 w-64" data-testid="skeleton" />
          </div>
          
          {/* Content skeletons */}
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-48" data-testid="skeleton" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-4 w-full" data-testid="skeleton" />
                  <Skeleton className="h-4 w-3/4" data-testid="skeleton" />
                  <Skeleton className="h-20 w-full" data-testid="skeleton" />
                </CardContent>
              </Card>
            </div>
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32" data-testid="skeleton" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-32 w-full" data-testid="skeleton" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (applicationError || !applicationData) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="text-center py-12">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Failed to Load Application</h3>
            <p className="text-muted-foreground mb-4">
              Unable to load the application details. Please try again.
            </p>
            <div className="flex gap-2 justify-center">
              {onBack && (
                <Button variant="outline" onClick={onBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to List
                </Button>
              )}
              <Button onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { club } = applicationData;
  const isPending = club.application_status === 'pending';
  const isProcessing = approveApplication.isPending || rejectApplication.isPending;

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onBack && (
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to List
              </Button>
            )}
            <div>
              <h1 className="text-2xl font-bold">{club.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={getStatusBadgeVariant(club.application_status)}>
                  {club.application_status.charAt(0).toUpperCase() + club.application_status.slice(1)}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Applied {format(new Date(club.created_at), 'MMM d, yyyy')}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {isPending && (
            <div className="flex gap-2">
              <AlertDialog open={showRejectionDialog} onOpenChange={setShowRejectionDialog}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isProcessing}>
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
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
                      className="min-h-[100px]"
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleReject}
                      disabled={!rejectionReason.trim() || rejectApplication.isPending}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      {rejectApplication.isPending ? 'Rejecting...' : 'Reject Application'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
                <AlertDialogTrigger asChild>
                  <Button disabled={isProcessing}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
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
                      className="min-h-[80px]"
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleApprove}
                      disabled={approveApplication.isPending}
                    >
                      {approveApplication.isPending ? 'Approving...' : 'Approve Application'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Application Details */}
          <div className="lg:col-span-2 space-y-6">
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
                      Added {format(new Date(club.reviewed_at), 'MMM d, yyyy \'at\' h:mm a')}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Application Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Application History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingHistory ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <Skeleton className="h-4 w-4 rounded-full mt-0.5" />
                        <div className="flex-1 space-y-1">
                          <Skeleton className="h-3 w-20" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : historyData && historyData.length > 0 ? (
                  <div className="space-y-4">
                    {historyData.map((entry, index) => (
                      <div key={entry.id} className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getActionIcon(entry.action)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium capitalize">
                              {entry.action}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(entry.created_at), 'MMM d, yyyy')}
                            </span>
                          </div>
                          {entry.admin_email && (
                            <p className="text-xs text-muted-foreground">
                              by {entry.admin_email}
                            </p>
                          )}
                          {entry.notes && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {entry.notes}
                            </p>
                          )}
                        </div>
                        {index < historyData.length - 1 && (
                          <Separator className="mt-4" />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No history available
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

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
                    {format(new Date(club.created_at), 'MMM d, yyyy \'at\' h:mm a')}
                  </p>
                </div>
                
                {club.updated_at !== club.created_at && (
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Last Updated</Label>
                    <p className="text-sm">
                      {format(new Date(club.updated_at), 'MMM d, yyyy \'at\' h:mm a')}
                    </p>
                  </div>
                )}

                {club.reviewed_at && (
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Reviewed</Label>
                    <p className="text-sm">
                      {format(new Date(club.reviewed_at), 'MMM d, yyyy \'at\' h:mm a')}
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
    </div>
  );
};

export default ClubApplicationReview;