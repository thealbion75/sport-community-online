/**
 * Admin Notifications Hook
 * Real-time notifications for admin users about club applications and other admin events
 */

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
// Using D1 API instead of Supabase
import { useIsAdmin } from './use-admin';
import { clubApprovalKeys } from './use-club-approval';
import { useToast } from './use-toast';

interface AdminNotification {
  id: string;
  type: 'club_application' | 'club_approval' | 'club_rejection' | 'system';
  title: string;
  message: string;
  data?: any;
  timestamp: string;
}

/**
 * Hook to manage real-time admin notifications
 */
export function useAdminNotifications() {
  const { data: isAdmin } = useIsAdmin();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);

  useEffect(() => {
    if (!isAdmin) return;

    // Subscribe to club table changes for new applications
    const clubsChannel = supabase
      .channel('admin-club-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'clubs',
          filter: 'application_status=eq.pending'
        },
        (payload) => {
          const newClub = payload.new as any;
          
          // Create notification
          const notification: AdminNotification = {
            id: `club-app-${newClub.id}`,
            type: 'club_application',
            title: 'New Club Application',
            message: `${newClub.name} has submitted a new application for review`,
            data: { clubId: newClub.id, clubName: newClub.name },
            timestamp: new Date().toISOString()
          };

          // Add to notifications state
          setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Keep last 10

          // Show toast notification
          toast({
            title: notification.title,
            description: notification.message,
            action: {
              label: 'Review',
              onClick: () => {
                window.location.href = `/admin#club-approvals`;
              }
            }
          });

          // Invalidate related queries to refresh data
          queryClient.invalidateQueries({ queryKey: clubApprovalKeys.stats() });
          queryClient.invalidateQueries({ queryKey: clubApprovalKeys.applications() });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'clubs',
          filter: 'application_status=in.(approved,rejected)'
        },
        (payload) => {
          const updatedClub = payload.new as any;
          const oldClub = payload.old as any;
          
          // Only notify if status actually changed
          if (oldClub.application_status !== updatedClub.application_status) {
            const isApproval = updatedClub.application_status === 'approved';
            
            const notification: AdminNotification = {
              id: `club-${isApproval ? 'approved' : 'rejected'}-${updatedClub.id}`,
              type: isApproval ? 'club_approval' : 'club_rejection',
              title: `Club ${isApproval ? 'Approved' : 'Rejected'}`,
              message: `${updatedClub.name} has been ${updatedClub.application_status}`,
              data: { clubId: updatedClub.id, clubName: updatedClub.name },
              timestamp: new Date().toISOString()
            };

            setNotifications(prev => [notification, ...prev.slice(0, 9)]);

            // Invalidate related queries
            queryClient.invalidateQueries({ queryKey: clubApprovalKeys.stats() });
            queryClient.invalidateQueries({ queryKey: clubApprovalKeys.applications() });
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(clubsChannel);
    };
  }, [isAdmin, queryClient, toast]);

  return {
    notifications,
    clearNotifications: () => setNotifications([]),
    removeNotification: (id: string) => 
      setNotifications(prev => prev.filter(n => n.id !== id))
  };
}

/**
 * Hook to get unread admin notification count
 */
export function useAdminNotificationCount() {
  const { notifications } = useAdminNotifications();
  return notifications.length;
}