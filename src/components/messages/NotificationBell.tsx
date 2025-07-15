/**
 * Notification Bell Component
 * Real-time notifications for new messages and applications
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUnreadMessageCount } from '@/hooks/use-messages';
import { useCurrentUser } from '@/hooks/use-auth';
import { 
  Bell, 
  MessageSquare, 
  FileText, 
  Users, 
  Clock,
  Check,
  Settings
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface NotificationBellProps {
  onNavigateToMessages?: () => void;
  onNavigateToApplications?: () => void;
}

// Mock notification data - in a real app, this would come from your backend
const mockNotifications = [
  {
    id: '1',
    type: 'message' as const,
    title: 'New message from East Grinstead FC',
    message: 'Thank you for your application. We would like to...',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    read: false,
    avatar: null,
  },
  {
    id: '2',
    type: 'application' as const,
    title: 'Application status updated',
    message: 'Your application for Match Day Volunteer has been accepted!',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    read: false,
    avatar: null,
  },
  {
    id: '3',
    type: 'opportunity' as const,
    title: 'New opportunity matches your skills',
    message: 'Event Coordinator position at Crawley Tennis Club',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    read: true,
    avatar: null,
  },
];

export function NotificationBell({ onNavigateToMessages, onNavigateToApplications }: NotificationBellProps) {
  const [notifications] = useState(mockNotifications);
  const [isOpen, setIsOpen] = useState(false);

  const { data: user } = useCurrentUser();
  const { data: unreadMessageCount } = useUnreadMessageCount(user?.id || '');

  // Calculate total unread notifications
  const unreadNotifications = notifications.filter(n => !n.read);
  const totalUnread = unreadNotifications.length + (unreadMessageCount || 0);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="h-4 w-4 text-blue-600" />;
      case 'application':
        return <FileText className="h-4 w-4 text-green-600" />;
      case 'opportunity':
        return <Users className="h-4 w-4 text-purple-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleNotificationClick = (notification: typeof mockNotifications[0]) => {
    // Mark as read (in a real app, you'd call an API)
    
    // Navigate based on notification type
    switch (notification.type) {
      case 'message':
        onNavigateToMessages?.();
        break;
      case 'application':
        onNavigateToApplications?.();
        break;
      case 'opportunity':
        // Navigate to opportunities
        break;
    }
    
    setIsOpen(false);
  };

  const markAllAsRead = () => {
    // In a real app, you'd call an API to mark all notifications as read
    console.log('Mark all notifications as read');
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {totalUnread > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0"
            >
              {totalUnread > 9 ? '9+' : totalUnread}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Notifications</h3>
            {totalUnread > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                <Check className="h-4 w-4 mr-1" />
                Mark all read
              </Button>
            )}
          </div>

          {/* Unread Message Count */}
          {unreadMessageCount && unreadMessageCount > 0 && (
            <div
              onClick={onNavigateToMessages}
              className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-md cursor-pointer mb-2"
            >
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                <MessageSquare className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">New Messages</p>
                <p className="text-xs text-gray-600">
                  You have {unreadMessageCount} unread message{unreadMessageCount !== 1 ? 's' : ''}
                </p>
              </div>
              <Badge variant="destructive">{unreadMessageCount}</Badge>
            </div>
          )}

          {/* Notifications List */}
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`flex items-start gap-3 p-3 rounded-md cursor-pointer transition-colors ${
                    notification.read 
                      ? 'hover:bg-gray-50' 
                      : 'bg-blue-50 hover:bg-blue-100 border-l-4 border-blue-500'
                  }`}
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-white rounded-full border">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${notification.read ? 'font-normal' : 'font-medium'}`}>
                      {notification.title}
                    </p>
                    <p className="text-xs text-gray-600 truncate">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(notification.timestamp)} ago
                      </span>
                    </div>
                  </div>
                  
                  {!notification.read && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2" />
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">No notifications</p>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <DropdownMenuSeparator />
          <div className="pt-2">
            <DropdownMenuItem onClick={onNavigateToMessages}>
              <MessageSquare className="h-4 w-4 mr-2" />
              View all messages
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onNavigateToApplications}>
              <FileText className="h-4 w-4 mr-2" />
              View applications
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="h-4 w-4 mr-2" />
              Notification settings
            </DropdownMenuItem>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Simplified notification badge for use in navigation
export function NotificationBadge() {
  const { data: user } = useCurrentUser();
  const { data: unreadMessageCount } = useUnreadMessageCount(user?.id || '');

  if (!unreadMessageCount || unreadMessageCount === 0) {
    return null;
  }

  return (
    <Badge 
      variant="destructive" 
      className="h-5 w-5 flex items-center justify-center text-xs p-0"
    >
      {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
    </Badge>
  );
}