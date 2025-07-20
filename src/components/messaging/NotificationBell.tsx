/**
 * Notification Bell Component
 * Real-time notifications for new messages and updates
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bell, 
  BellRing, 
  MessageSquare, 
  Users, 
  CheckCircle, 
  XCircle,
  Clock,
  Settings
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { useUnreadMessages, useUnreadMessageCount, useMarkMessageAsRead } from '@/hooks/use-messages';
import { useAuthContext } from '@/contexts/AuthContext';
import type { Message } from '@/types';

interface Notification {
  id: string;
  type: 'message' | 'application' | 'system';
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  avatar?: string;
  data?: Message;
}

interface NotificationBellProps {
  onNotificationClick?: (notification: Notification) => void;
  onViewAllMessages?: () => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  onNotificationClick,
  onViewAllMessages
}) => {
  const { user } = useAuthContext();
  const [isOpen, setIsOpen] = useState(false);
  
  const { data: unreadMessages = [] } = useUnreadMessages(user?.id || '');
  const { data: unreadCount = 0 } = useUnreadMessageCount(user?.id || '');
  const markAsReadMutation = useMarkMessageAsRead();

  // Convert messages to notifications
  const messageNotifications: Notification[] = unreadMessages.map(message => ({
    id: message.id,
    type: 'message' as const,
    title: 'New Message',
    description: `${message.subject} - ${message.content.slice(0, 50)}${message.content.length > 50 ? '...' : ''}`,
    timestamp: message.created_at,
    read: message.read,
    actionUrl: `/messages/${message.sender_id}`,
    data: message
  }));

  // Sample system notifications (in a real app, these would come from an API)
  const systemNotifications: Notification[] = [
    // These would be populated from actual system events
  ];

  const allNotifications = [...messageNotifications, ...systemNotifications]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10); // Show latest 10 notifications

  const totalUnreadCount = allNotifications.filter(n => !n.read).length;

  const handleNotificationClick = (notification: Notification) => {
    // Mark message as read if it's a message notification
    if (notification.type === 'message' && notification.data) {
      markAsReadMutation.mutate(notification.id);
    }

    onNotificationClick?.(notification);
    setIsOpen(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="h-4 w-4 text-blue-600" />;
      case 'application':
        return <Users className="h-4 w-4 text-green-600" />;
      case 'system':
        return <Settings className="h-4 w-4 text-gray-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'message':
        return 'border-l-blue-500 bg-blue-50';
      case 'application':
        return 'border-l-green-500 bg-green-50';
      case 'system':
        return 'border-l-gray-500 bg-gray-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          {totalUnreadCount > 0 ? (
            <BellRing className="h-5 w-5" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {totalUnreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notifications</CardTitle>
              {totalUnreadCount > 0 && (
                <Badge variant="secondary">
                  {totalUnreadCount} new
                </Badge>
              )}
            </div>
            <CardDescription>
              Stay updated with your latest activity
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-0">
            {allNotifications.length === 0 ? (
              <div className="text-center py-8 px-4">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  No notifications
                </h3>
                <p className="text-xs text-gray-600">
                  You're all caught up! New notifications will appear here.
                </p>
              </div>
            ) : (
              <ScrollArea className="h-96">
                <div className="space-y-1 p-2">
                  {allNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`
                        relative p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-50
                        border-l-4 ${getNotificationColor(notification.type)}
                        ${!notification.read ? 'shadow-sm' : 'opacity-75'}
                      `}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        {/* Notification Icon */}
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900 mb-1">
                                {notification.title}
                              </h4>
                              <p className="text-sm text-gray-700 line-clamp-2">
                                {notification.description}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                              </p>
                            </div>

                            {/* Unread Indicator */}
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            {/* Footer Actions */}
            {allNotifications.length > 0 && (
              <div className="border-t p-3">
                <div className="flex justify-between">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      // Mark all as read functionality would go here
                      setIsOpen(false);
                    }}
                  >
                    Mark all as read
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      onViewAllMessages?.();
                      setIsOpen(false);
                    }}
                  >
                    View all messages
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
};