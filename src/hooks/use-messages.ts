/**
 * Messages React Query Hooks
 * Custom hooks for messaging data fetching and mutations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  sendMessage,
  getMessageById,
  getInboxMessages,
  getSentMessages,
  getConversation,
  markMessageAsRead,
  markMessagesAsRead,
  deleteMessage,
  getUnreadMessageCount,
  getRecentConversations,
  searchMessages
} from '@/lib/supabase/messages';
import { Message, MessageFormData } from '@/types';
import { useToast } from './use-toast';

// Query keys
export const messageKeys = {
  all: ['messages'] as const,
  lists: () => [...messageKeys.all, 'list'] as const,
  details: () => [...messageKeys.all, 'detail'] as const,
  detail: (id: string) => [...messageKeys.details(), id] as const,
  inbox: (userId: string, limit: number, offset: number) => [...messageKeys.all, 'inbox', userId, { limit, offset }] as const,
  sent: (userId: string, limit: number, offset: number) => [...messageKeys.all, 'sent', userId, { limit, offset }] as const,
  conversation: (userId1: string, userId2: string) => [...messageKeys.all, 'conversation', { userId1, userId2 }] as const,
  unreadCount: (userId: string) => [...messageKeys.all, 'unreadCount', userId] as const,
  recentConversations: (userId: string, limit: number) => [...messageKeys.all, 'recentConversations', userId, limit] as const,
  search: (userId: string, term: string) => [...messageKeys.all, 'search', userId, term] as const,
};

/**
 * Hook to fetch message by ID
 */
export function useMessage(id: string) {
  return useQuery({
    queryKey: messageKeys.detail(id),
    queryFn: () => getMessageById(id),
    select: (data) => data.success ? data.data : null,
    enabled: !!id,
  });
}

/**
 * Hook to fetch inbox messages
 */
export function useInboxMessages(userId: string, limit: number = 50, offset: number = 0) {
  return useQuery({
    queryKey: messageKeys.inbox(userId, limit, offset),
    queryFn: () => getInboxMessages(userId, limit, offset),
    select: (data) => data.success ? data.data : [],
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Hook to fetch sent messages
 */
export function useSentMessages(userId: string, limit: number = 50, offset: number = 0) {
  return useQuery({
    queryKey: messageKeys.sent(userId, limit, offset),
    queryFn: () => getSentMessages(userId, limit, offset),
    select: (data) => data.success ? data.data : [],
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to fetch conversation between two users
 */
export function useConversation(userId1: string, userId2: string) {
  return useQuery({
    queryKey: messageKeys.conversation(userId1, userId2),
    queryFn: () => getConversation(userId1, userId2),
    select: (data) => data.success ? data.data : [],
    enabled: !!(userId1 && userId2),
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to get unread message count
 */
export function useUnreadMessageCount(userId: string) {
  return useQuery({
    queryKey: messageKeys.unreadCount(userId),
    queryFn: () => getUnreadMessageCount(userId),
    select: (data) => data.success ? data.data : 0,
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

/**
 * Hook to get recent conversations
 */
export function useRecentConversations(userId: string, limit: number = 10) {
  return useQuery({
    queryKey: messageKeys.recentConversations(userId, limit),
    queryFn: () => getRecentConversations(userId, limit),
    select: (data) => data.success ? data.data : [],
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to search messages
 */
export function useSearchMessages(userId: string, searchTerm: string, limit?: number) {
  return useQuery({
    queryKey: messageKeys.search(userId, searchTerm),
    queryFn: () => searchMessages(userId, searchTerm, limit),
    select: (data) => data.success ? data.data : [],
    enabled: !!(userId && searchTerm.length > 2),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to send a message
 */
export function useSendMessage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: MessageFormData) => sendMessage(data),
    onSuccess: (result, variables) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: messageKeys.all });
        queryClient.invalidateQueries({ queryKey: messageKeys.unreadCount(variables.recipient_id) });
        toast({
          title: 'Success',
          description: 'Message sent successfully!',
          variant: 'success',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to send message',
          variant: 'destructive',
        });
      }
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to mark message as read
 */
export function useMarkMessageAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => markMessageAsRead(id),
    onSuccess: (result, id) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: messageKeys.detail(id) });
        queryClient.invalidateQueries({ queryKey: messageKeys.lists() });
        // Don't show toast for this action as it's automatic
      }
    },
    onError: () => {
      // Silent error for read status updates
      console.error('Failed to mark message as read');
    },
  });
}

/**
 * Hook to mark multiple messages as read
 */
export function useMarkMessagesAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageIds: string[]) => markMessagesAsRead(messageIds),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: messageKeys.all });
        // Don't show toast for this action as it's automatic
      }
    },
    onError: () => {
      // Silent error for read status updates
      console.error('Failed to mark messages as read');
    },
  });
}

/**
 * Hook to delete a message
 */
export function useDeleteMessage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteMessage(id),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: messageKeys.all });
        toast({
          title: 'Success',
          description: 'Message deleted successfully!',
          variant: 'success',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to delete message',
          variant: 'destructive',
        });
      }
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete message. Please try again.',
        variant: 'destructive',
      });
    },
  });
}