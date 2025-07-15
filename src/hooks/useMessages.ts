/**
 * React hooks for messages data management
 * Uses React Query for caching and state management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  getUserMessages,
  getConversation,
  getUnreadMessages,
  sendMessage,
  markMessageAsRead,
  markConversationAsRead,
  deleteMessage,
  getUnreadMessageCount
} from '@/lib/supabase/messages';
import type { MessageFormData } from '@/types';

// Query keys
export const messageKeys = {
  all: ['messages'] as const,
  byUser: (userId: string) => [...messageKeys.all, 'byUser', userId] as const,
  conversation: (userId1: string, userId2: string) => 
    [...messageKeys.all, 'conversation', userId1, userId2] as const,
  unread: (userId: string) => [...messageKeys.all, 'unread', userId] as const,
  unreadCount: (userId: string) => [...messageKeys.all, 'unreadCount', userId] as const,
};

/**
 * Hook to get messages for a user
 */
export const useUserMessages = (userId: string) => {
  return useQuery({
    queryKey: messageKeys.byUser(userId),
    queryFn: async () => {
      const result = await getUserMessages(userId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data || [];
    },
    enabled: !!userId,
  });
};

/**
 * Hook to get conversation between two users
 */
export const useConversation = (userId1: string, userId2: string) => {
  return useQuery({
    queryKey: messageKeys.conversation(userId1, userId2),
    queryFn: async () => {
      const result = await getConversation(userId1, userId2);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data || [];
    },
    enabled: !!userId1 && !!userId2,
  });
};

/**
 * Hook to get unread messages for a user
 */
export const useUnreadMessages = (userId: string) => {
  return useQuery({
    queryKey: messageKeys.unread(userId),
    queryFn: async () => {
      const result = await getUnreadMessages(userId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data || [];
    },
    enabled: !!userId,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });
};

/**
 * Hook to get unread message count
 */
export const useUnreadMessageCount = (userId: string) => {
  return useQuery({
    queryKey: messageKeys.unreadCount(userId),
    queryFn: async () => {
      const result = await getUnreadMessageCount(userId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data || 0;
    },
    enabled: !!userId,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

/**
 * Hook to send a message
 */
export const useSendMessage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ senderId, messageData }: { 
      senderId: string; 
      messageData: MessageFormData 
    }) => sendMessage(senderId, messageData),
    onSuccess: (result, variables) => {
      if (result.success) {
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: messageKeys.byUser(variables.senderId) });
        queryClient.invalidateQueries({ queryKey: messageKeys.byUser(variables.messageData.recipient_id) });
        queryClient.invalidateQueries({ 
          queryKey: messageKeys.conversation(variables.senderId, variables.messageData.recipient_id) 
        });
        queryClient.invalidateQueries({ 
          queryKey: messageKeys.unread(variables.messageData.recipient_id) 
        });
        queryClient.invalidateQueries({ 
          queryKey: messageKeys.unreadCount(variables.messageData.recipient_id) 
        });
        
        toast({
          title: "Message sent successfully",
          description: "Your message has been delivered.",
        });
      } else {
        toast({
          title: "Failed to send message",
          description: result.error,
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

/**
 * Hook to mark message as read
 */
export const useMarkMessageAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: string) => markMessageAsRead(messageId),
    onSuccess: (result) => {
      if (result.success && result.data) {
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: messageKeys.byUser(result.data.recipient_id) });
        queryClient.invalidateQueries({ queryKey: messageKeys.unread(result.data.recipient_id) });
        queryClient.invalidateQueries({ queryKey: messageKeys.unreadCount(result.data.recipient_id) });
        queryClient.invalidateQueries({ 
          queryKey: messageKeys.conversation(result.data.sender_id, result.data.recipient_id) 
        });
      }
    },
  });
};

/**
 * Hook to mark conversation as read
 */
export const useMarkConversationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ recipientId, senderId }: { 
      recipientId: string; 
      senderId: string 
    }) => markConversationAsRead(recipientId, senderId),
    onSuccess: (result, variables) => {
      if (result.success) {
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: messageKeys.byUser(variables.recipientId) });
        queryClient.invalidateQueries({ queryKey: messageKeys.unread(variables.recipientId) });
        queryClient.invalidateQueries({ queryKey: messageKeys.unreadCount(variables.recipientId) });
        queryClient.invalidateQueries({ 
          queryKey: messageKeys.conversation(variables.senderId, variables.recipientId) 
        });
      }
    },
  });
};

/**
 * Hook to delete a message
 */
export const useDeleteMessage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (messageId: string) => deleteMessage(messageId),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: messageKeys.all });
        toast({
          title: "Message deleted",
          description: "The message has been removed.",
        });
      } else {
        toast({
          title: "Failed to delete message",
          description: result.error,
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete message",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};