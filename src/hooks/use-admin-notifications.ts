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

    // Real-time notifications would be implemented via WebSockets or polling
    // For now, we'll use periodic polling to check for new applications
    const pollInterval = setInterval(async () => {
      try {
        // Poll for new club applications
        const response = await fetch('/api/admin/club-applications/stats', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('d1_session') ? JSON.parse(localStorage.getItem('d1_session')!).access_token : ''}`,
          },
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            // Check if there are new pending applications
            const pendingCount = result.data.pending || 0;
            
            // This is a simple implementation - in a real app you'd track the previous count
            // and only show notifications for new applications
            if (pendingCount > 0) {
              // Invalidate related queries to refresh data
              queryClient.invalidateQueries({ queryKey: clubApprovalKeys.stats() });
              queryClient.invalidateQueries({ queryKey: clubApprovalKeys.applications() });
            }
          }
        }
      } catch (error) {
        console.error('Error polling for notifications:', error);
      }
    }, 30000); // Poll every 30 seconds

    // Cleanup subscription on unmount
    return () => {
      clearInterval(pollInterval);
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