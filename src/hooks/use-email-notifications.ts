/**
 * React Query hooks for email notification management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface EmailStats {
  total: number;
  sent: number;
  failed: number;
  pending: number;
  retrying: number;
}

export interface RetryResult {
  retried: number;
  errors: string[];
}

/**
 * Hook to get email delivery statistics
 */
export function useEmailStats(since?: string) {
  return useQuery({
    queryKey: ['email-stats', since],
    queryFn: async (): Promise<EmailStats> => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const params = new URLSearchParams();
      if (since) {
        params.append('since', since);
      }

      const response = await fetch(`/api/admin/email/stats?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch email statistics');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch email statistics');
      }

      return result.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  });
}

/**
 * Hook to retry failed email notifications
 */
export function useRetryFailedEmails() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<RetryResult> => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch('/api/admin/email/retry-failed', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to retry failed emails');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to retry failed emails');
      }

      return result.data;
    },
    onSuccess: () => {
      // Invalidate email stats to refresh the data
      queryClient.invalidateQueries({ queryKey: ['email-stats'] });
    },
  });
}

/**
 * Hook to get email delivery logs (for future implementation)
 */
export function useEmailDeliveryLogs(limit = 50, offset = 0, status?: string) {
  return useQuery({
    queryKey: ['email-delivery-logs', limit, offset, status],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });
      
      if (status) {
        params.append('status', status);
      }

      const response = await fetch(`/api/admin/email/logs?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch email delivery logs');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch email delivery logs');
      }

      return result.data;
    },
    enabled: false, // Disable by default, enable when needed
  });
}