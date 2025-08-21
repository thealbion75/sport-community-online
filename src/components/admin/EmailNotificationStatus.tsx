/**
 * Email Notification Status Component
 * Displays email delivery statistics and provides retry functionality
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useEmailStats, useRetryFailedEmails } from '@/hooks/use-email-notifications';
import { Mail, AlertTriangle, CheckCircle, Clock, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface EmailNotificationStatusProps {
  className?: string;
}

export function EmailNotificationStatus({ className }: EmailNotificationStatusProps) {
  const { data: emailStats, isLoading, error, refetch } = useEmailStats();
  const retryFailedEmails = useRetryFailedEmails();

  const handleRetryFailed = async () => {
    try {
      const result = await retryFailedEmails.mutateAsync();
      
      if (result.retried > 0) {
        toast.success(`Successfully retried ${result.retried} failed emails`);
      } else {
        toast.info('No failed emails to retry');
      }

      if (result.errors.length > 0) {
        toast.error(`Some retries failed: ${result.errors.length} errors`);
      }
    } catch (error) {
      toast.error('Failed to retry emails');
    }
  };

  const handleRefresh = () => {
    refetch();
    toast.success('Email statistics refreshed');
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Notifications
          </CardTitle>
          <CardDescription>Loading email delivery statistics...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Notifications
          </CardTitle>
          <CardDescription>Email delivery monitoring</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Failed to load email statistics. Please try again.
            </AlertDescription>
          </Alert>
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            className="mt-4"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!emailStats) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Notifications
          </CardTitle>
          <CardDescription>No email statistics available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const hasFailedEmails = emailStats.failed > 0;
  const hasPendingEmails = emailStats.pending > 0 || emailStats.retrying > 0;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Notifications
        </CardTitle>
        <CardDescription>
          Email delivery status and statistics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{emailStats.sent}</div>
            <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Sent
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{emailStats.failed}</div>
            <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Failed
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{emailStats.pending}</div>
            <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
              <Clock className="h-3 w-3" />
              Pending
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{emailStats.retrying}</div>
            <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
              <RefreshCw className="h-3 w-3" />
              Retrying
            </div>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex flex-wrap gap-2">
          <Badge variant={emailStats.sent > 0 ? "default" : "secondary"}>
            {emailStats.sent} Delivered
          </Badge>
          
          {hasFailedEmails && (
            <Badge variant="destructive">
              {emailStats.failed} Failed
            </Badge>
          )}
          
          {hasPendingEmails && (
            <Badge variant="outline">
              {emailStats.pending + emailStats.retrying} In Progress
            </Badge>
          )}
        </div>

        {/* Alerts and Actions */}
        {hasFailedEmails && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {emailStats.failed} email notification{emailStats.failed > 1 ? 's' : ''} failed to send. 
              Club applicants may not have received their status updates.
            </AlertDescription>
          </Alert>
        )}

        {hasPendingEmails && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              {emailStats.pending + emailStats.retrying} email{emailStats.pending + emailStats.retrying > 1 ? 's' : ''} 
              {emailStats.retrying > 0 ? ' are being retried or ' : ' '}
              pending delivery.
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          {hasFailedEmails && (
            <Button 
              variant="default" 
              size="sm"
              onClick={handleRetryFailed}
              disabled={retryFailedEmails.isPending}
            >
              {retryFailedEmails.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Retry Failed
            </Button>
          )}
        </div>

        {/* Success Rate */}
        {emailStats.total > 0 && (
          <div className="pt-2 border-t">
            <div className="text-sm text-muted-foreground">
              Success Rate: {Math.round((emailStats.sent / emailStats.total) * 100)}% 
              ({emailStats.sent}/{emailStats.total})
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}