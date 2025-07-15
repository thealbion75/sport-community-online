/**
 * Application Notifications Component
 * Displays notifications related to volunteer applications
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bell, CheckCircle, XCircle, Clock, AlertCircle, Building, Calendar } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import type { VolunteerApplication } from '@/types';

interface ApplicationNotification {
  id: string;
  type: 'status_change' | 'new_application' | 'reminder' | 'message';
  title: string;
  message: string;
  application: VolunteerApplication;
  timestamp: string;
  read: boolean;
}

interface ApplicationNotificationsProps {
  notifications: ApplicationNotification[];
  onMarkAsRead?: (notificationId: string) => void;
  onMarkAllAsRead?: () => void;
  onViewApplication?: (applicationId: string) => void;
}

export const ApplicationNotifications: React.FC<ApplicationNotificationsProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onViewApplication
}) => {
  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string, applicationStatus?: string) => {
    switch (type) {
      case 'status_change':
        switch (applicationStatus) {
          case 'accepted': return <CheckCircle className="h-4 w-4 text-green-600" />;
          case 'rejected': return <XCircle className="h-4 w-4 text-red-600" />;
          default: return <Clock className="h-4 w-4 text-yellow-600" />;
        }
      case 'new_application':
        return <Bell className="h-4 w-4 text-blue-600" />;
      case 'reminder':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case 'message':
        return <Bell className="h-4 w-4 text-purple-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  const getNotificationColor = (type: string, applicationStatus?: string) => {
    switch (type) {
      case 'status_change':
        switch (applicationStatus) {
          case 'accepted': return 'border-l-green-500 bg-green-50';
          case 'rejected': return 'border-l-red-500 bg-red-50';
          default: return 'border-l-yellow-500 bg-yellow-50';
        }
      case 'new_application':
        return 'border-l-blue-500 bg-blue-50';
      case 'reminder':
        return 'border-l-orange-500 bg-orange-50';
      case 'message':
        return 'border-l-purple-500 bg-purple-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  if (notifications.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
          <p className="text-gray-600">
            You'll see updates about your applications here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Updates about your volunteer applications
            </CardDescription>
          </div>
          {unreadCount > 0 && onMarkAllAsRead && (
            <Button variant="outline" size="sm" onClick={onMarkAllAsRead}>
              Mark all as read
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`
              relative p-4 rounded-lg border-l-4 transition-colors
              ${getNotificationColor(notification.type, notification.application.status)}
              ${!notification.read ? 'shadow-sm' : 'opacity-75'}
            `}
          >
            <div className="flex items-start gap-3">
              {/* Notification Icon */}
              <div className="flex-shrink-0 mt-1">
                {getNotificationIcon(notification.type, notification.application.status)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900 mb-1">
                      {notification.title}
                    </h4>
                    <p className="text-sm text-gray-700 mb-2">
                      {notification.message}
                    </p>

                    {/* Application Info */}
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      {notification.application.opportunity?.club && (
                        <>
                          <Avatar className="h-4 w-4">
                            <AvatarImage src={notification.application.opportunity.club.logo_url} />
                            <AvatarFallback className="text-xs">
                              {notification.application.opportunity.club.name.split(' ').map(word => word[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            {notification.application.opportunity.club.name}
                          </span>
                        </>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                  </div>

                  {/* Unread Indicator */}
                  {!notification.read && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2"></div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-3">
                  {onViewApplication && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewApplication(notification.application.id)}
                    >
                      View Application
                    </Button>
                  )}
                  {!notification.read && onMarkAsRead && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onMarkAsRead(notification.id)}
                      className="text-xs"
                    >
                      Mark as read
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

// Sample notification data generator (for testing/demo purposes)
export const generateSampleNotifications = (applications: VolunteerApplication[]): ApplicationNotification[] => {
  const notifications: ApplicationNotification[] = [];

  applications.forEach((application, index) => {
    // Status change notification
    if (application.status !== 'pending') {
      notifications.push({
        id: `status-${application.id}`,
        type: 'status_change',
        title: `Application ${application.status}`,
        message: `Your application for "${application.opportunity?.title}" has been ${application.status}.`,
        application,
        timestamp: application.updated_at,
        read: index % 3 === 0 // Some read, some unread for demo
      });
    }

    // New application confirmation
    notifications.push({
      id: `new-${application.id}`,
      type: 'new_application',
      title: 'Application submitted',
      message: `Your application for "${application.opportunity?.title}" has been sent to ${application.opportunity?.club?.name}.`,
      application,
      timestamp: application.applied_at,
      read: true
    });
  });

  return notifications.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
};