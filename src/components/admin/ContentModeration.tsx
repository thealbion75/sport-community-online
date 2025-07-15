/**
 * Content Moderation Component
 * Tools for moderating user-generated content
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  AlertTriangle, 
  Flag, 
  Eye, 
  Trash2, 
  CheckCircle,
  XCircle,
  MessageSquare,
  Calendar,
  Building,
  Users
} from 'lucide-react';
import { format } from 'date-fns';

interface ContentReport {
  id: string;
  type: 'opportunity' | 'profile' | 'message' | 'club';
  content_id: string;
  reporter_id: string;
  reason: string;
  description: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  created_at: string;
  content_preview: string;
  content_author: string;
}

interface ModerationAction {
  id: string;
  action_type: 'warning' | 'content_removal' | 'account_suspension' | 'dismissal';
  target_type: 'user' | 'content';
  target_id: string;
  reason: string;
  moderator_id: string;
  created_at: string;
}

export const ContentModeration: React.FC = () => {
  const [activeTab, setActiveTab] = useState('reports');

  // Mock data (in a real app, this would come from APIs)
  const mockReports: ContentReport[] = [
    {
      id: '1',
      type: 'opportunity',
      content_id: 'opp-1',
      reporter_id: 'user-1',
      reason: 'Inappropriate content',
      description: 'This opportunity contains inappropriate language and requirements',
      status: 'pending',
      created_at: '2024-01-15T10:00:00Z',
      content_preview: 'Looking for volunteers to help with...',
      content_author: 'East Grinstead FC'
    },
    {
      id: '2',
      type: 'profile',
      content_id: 'profile-1',
      reporter_id: 'user-2',
      reason: 'Spam',
      description: 'Profile contains spam links and promotional content',
      status: 'pending',
      created_at: '2024-01-14T15:30:00Z',
      content_preview: 'Experienced volunteer with skills in...',
      content_author: 'John Smith'
    },
    {
      id: '3',
      type: 'message',
      content_id: 'msg-1',
      reporter_id: 'user-3',
      reason: 'Harassment',
      description: 'User sent inappropriate messages',
      status: 'reviewed',
      created_at: '2024-01-13T09:15:00Z',
      content_preview: 'Hi, I saw your profile and...',
      content_author: 'Anonymous User'
    }
  ];

  const mockActions: ModerationAction[] = [
    {
      id: '1',
      action_type: 'content_removal',
      target_type: 'content',
      target_id: 'opp-5',
      reason: 'Violated community guidelines',
      moderator_id: 'admin-1',
      created_at: '2024-01-15T14:00:00Z'
    },
    {
      id: '2',
      action_type: 'warning',
      target_type: 'user',
      target_id: 'user-10',
      reason: 'Inappropriate messaging',
      moderator_id: 'admin-1',
      created_at: '2024-01-14T11:30:00Z'
    }
  ];

  const pendingReports = mockReports.filter(report => report.status === 'pending');

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case 'opportunity':
        return <Calendar className="h-4 w-4 text-purple-600" />;
      case 'profile':
        return <Users className="h-4 w-4 text-blue-600" />;
      case 'message':
        return <MessageSquare className="h-4 w-4 text-green-600" />;
      case 'club':
        return <Building className="h-4 w-4 text-orange-600" />;
      default:
        return <Flag className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'reviewed':
        return <Badge className="bg-blue-100 text-blue-800">Reviewed</Badge>;
      case 'resolved':
        return <Badge className="bg-green-100 text-green-800">Resolved</Badge>;
      case 'dismissed':
        return <Badge className="bg-gray-100 text-gray-800">Dismissed</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getActionTypeIcon = (actionType: string) => {
    switch (actionType) {
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'content_removal':
        return <Trash2 className="h-4 w-4 text-red-600" />;
      case 'account_suspension':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'dismissal':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <Shield className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleReportAction = (reportId: string, action: 'approve' | 'dismiss' | 'remove') => {
    console.log(`Taking action ${action} on report ${reportId}`);
    // In a real app, this would call an API to handle the moderation action
  };

  const ReportCard: React.FC<{ report: ContentReport }> = ({ report }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            {getReportTypeIcon(report.type)}
          </div>
          
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-semibold capitalize">
                  {report.type} Report
                </h4>
                <p className="text-sm text-gray-600">
                  Reported by user • {format(new Date(report.created_at), 'MMM d, yyyy')}
                </p>
              </div>
              {getStatusBadge(report.status)}
            </div>

            <div className="mb-3">
              <p className="text-sm font-medium text-gray-700 mb-1">
                Reason: {report.reason}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                {report.description}
              </p>
              <div className="bg-gray-50 p-3 rounded text-sm">
                <p className="font-medium text-gray-700 mb-1">
                  Content by: {report.content_author}
                </p>
                <p className="text-gray-600 italic">
                  "{report.content_preview}..."
                </p>
              </div>
            </div>

            {report.status === 'pending' && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => handleReportAction(report.id, 'approve')}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Review
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReportAction(report.id, 'remove')}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Remove Content
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReportAction(report.id, 'dismiss')}
                >
                  <XCircle className="h-3 w-3 mr-1" />
                  Dismiss
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const ActionCard: React.FC<{ action: ModerationAction }> = ({ action }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            {getActionTypeIcon(action.action_type)}
          </div>
          
          <div className="flex-1">
            <h4 className="font-medium capitalize mb-1">
              {action.action_type.replace('_', ' ')}
            </h4>
            <p className="text-sm text-gray-600 mb-2">
              Target: {action.target_type} ({action.target_id})
            </p>
            <p className="text-sm text-gray-700 mb-2">
              {action.reason}
            </p>
            <p className="text-xs text-gray-500">
              {format(new Date(action.created_at), 'MMM d, yyyy \'at\' h:mm a')}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Content Moderation</h2>
          <p className="text-gray-600">
            Review reported content and manage platform safety
          </p>
        </div>
      </div>

      {/* Pending Reports Alert */}
      {pendingReports.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>{pendingReports.length}</strong> report{pendingReports.length !== 1 ? 's' : ''} 
            {' '}require immediate attention. Review and take appropriate action.
          </AlertDescription>
        </Alert>
      )}

      {/* Moderation Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Flag className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Total Reports</p>
                <p className="text-xl font-bold">{mockReports.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-xl font-bold">{pendingReports.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Resolved</p>
                <p className="text-xl font-bold">
                  {mockReports.filter(r => r.status === 'resolved').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Actions Taken</p>
                <p className="text-xl font-bold">{mockActions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Moderation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="reports">
            Content Reports ({mockReports.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({pendingReports.length})
          </TabsTrigger>
          <TabsTrigger value="actions">
            Recent Actions ({mockActions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-4">
          {mockReports.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No reports to review
                </h3>
                <p className="text-gray-600">
                  All content reports have been handled. Great job keeping the platform safe!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {mockReports.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {pendingReports.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  All caught up!
                </h3>
                <p className="text-gray-600">
                  No pending reports require your attention right now.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingReports.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          {mockActions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No recent actions
                </h3>
                <p className="text-gray-600">
                  Moderation actions will appear here once you start reviewing content.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {mockActions.map((action) => (
                <ActionCard key={action.id} action={action} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};