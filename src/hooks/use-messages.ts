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
import { Message, MessageFormData, Conversation } from '@/types/volunteer';
import { useToast } from '@/hooks/use-toast';

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
        });
      } else {
        toast({
          title: 'Error',
          description: result.error?.message || 'Failed to send message',
          variant: 'destructive',
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send message. Please try again.',
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
        });
      } else {
        toast({
          title: 'Error',
          description: result.error?.message || 'Failed to delete message',
          variant: 'destructive',
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete message. Please try again.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to get user messages (combines inbox and sent)
 */
export function useUserMessages(userId: string, limit: number = 50, offset: number = 0) {
  const inboxQuery = useInboxMessages(userId, limit, offset);
  const sentQuery = useSentMessages(userId, limit, offset);

  return {
    data: {
      inbox: inboxQuery.data || [],
      sent: sentQuery.data || [],
      all: [...(inboxQuery.data || []), ...(sentQuery.data || [])].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    },
    isLoading: inboxQuery.isLoading || sentQuery.isLoading,
    error: inboxQuery.error || sentQuery.error,
    refetch: () => {
      inboxQuery.refetch();
      sentQuery.refetch();
    }
  };
}

/**
 * Hook to get unread messages
 */
export function useUnreadMessages(userId: string, limit: number = 50) {
  return useQuery({
    queryKey: [...messageKeys.all, 'unread', userId, limit],
    queryFn: () => getInboxMessages(userId, limit, 0),
    select: (data) => {
      if (data.success && data.data) {
        return data.data.filter(message => !message.read);
      }
      return [];
    },
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to mark conversation as read
 */
export function useMarkConversationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId1, userId2 }: { userId1: string; userId2: string }) => {
      // Get conversation messages first
      const conversationResult = await getConversation(userId1, userId2);
      if (conversationResult.success && conversationResult.data) {
        // Get unread message IDs
        const unreadMessageIds = conversationResult.data
          .filter(message => !message.read && message.recipient_id === userId1)
          .map(message => message.id);
        
        if (unreadMessageIds.length > 0) {
          return markMessagesAsRead(unreadMessageIds);
        }
      }
      return { success: true, data: null };
    },
    onSuccess: (result, variables) => {
      if (result.success) {
        queryClient.invalidateQueries({ 
          queryKey: messageKeys.conversation(variables.userId1, variables.userId2) 
        });
        queryClient.invalidateQueries({ 
          queryKey: messageKeys.unreadCount(variables.userId1) 
        });
        queryClient.invalidateQueries({ queryKey: messageKeys.lists() });
      }
    },
    onError: () => {
      console.error('Failed to mark conversation as read');
    },
  });
}
