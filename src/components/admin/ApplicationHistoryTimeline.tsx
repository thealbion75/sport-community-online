/**
 * Application History Timeline Component
 * Displays complete decision timeline for a club application
 */

import React from 'react';
import { Clock, CheckCircle, XCircle, User, FileText, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useApplicationTimeline } from '@/hooks/use-admin-audit-reporting';
import { AdminActivityLog } from '@/lib/supabase/admin-audit-reporting';
import { formatDistanceToNow, format } from 'date-fns';

interface ApplicationHistoryTimelineProps {
  clubId: string;
  className?: string;
}

const getActionIcon = (actionType: AdminActivityLog['action_type']) => {
  switch (actionType) {
    case 'approve':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'reject':
      return <XCircle className="h-4 w-4 text-red-600" />;
    case 'view':
      return <Eye className="h-4 w-4 text-blue-600" />;
    case 'bulk_approve':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'bulk_reject':
      return <XCircle className="h-4 w-4 text-red-600" />;
    default:
      return <FileText className="h-4 w-4 text-gray-600" />;
  }
};

const getActionColor = (actionType: AdminActivityLog['action_type']) => {
  switch (actionType) {
    case 'approve':
    case 'bulk_approve':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'reject':
    case 'bulk_reject':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'view':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getActionLabel = (actionType: AdminActivityLog['action_type']) => {
  switch (actionType) {
    case 'approve':
      return 'Approved';
    case 'reject':
      return 'Rejected';
    case 'view':
      return 'Viewed';
    case 'bulk_approve':
      return 'Bulk Approved';
    case 'bulk_reject':
      return 'Bulk Rejected';
    case 'export':
      return 'Exported';
    default:
      return 'Action';
  }
};

export function ApplicationHistoryTimeline({ clubId, className }: ApplicationHistoryTimelineProps) {
  const { data: timeline, isLoading, error } = useApplicationTimeline(clubId);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Application Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3" />
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
                </div>
              </div>
            ))}
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
            <Clock className="h-5 w-5" />
            Application Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Unable to load application timeline</p>
            <p className="text-sm">Please try refreshing the page</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!timeline || timeline.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Application Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No timeline data available</p>
            <p className="text-sm">Actions will appear here as they occur</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Application Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {timeline.map((entry, index) => (
            <div key={entry.id} className="relative">
              {/* Timeline connector line */}
              {index < timeline.length - 1 && (
                <div className="absolute left-4 top-8 w-0.5 h-6 bg-gray-200" />
              )}
              
              <div className="flex items-start gap-4">
                {/* Action icon */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center">
                  {getActionIcon(entry.action_type)}
                </div>
                
                {/* Action details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge 
                      variant="outline" 
                      className={getActionColor(entry.action_type)}
                    >
                      {getActionLabel(entry.action_type)}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">
                      {entry.admin_name || entry.admin_email}
                    </span>
                  </div>
                  
                  {entry.details && (
                    <p className="text-sm text-gray-600 mb-2">
                      {entry.details}
                    </p>
                  )}
                  
                  <div className="text-xs text-gray-400">
                    {format(new Date(entry.created_at), 'PPpp')}
                    {entry.ip_address && (
                      <span className="ml-2">• IP: {entry.ip_address}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {timeline.length > 0 && (
          <>
            <Separator className="my-4" />
            <div className="text-xs text-gray-500 text-center">
              Showing {timeline.length} timeline {timeline.length === 1 ? 'entry' : 'entries'}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}