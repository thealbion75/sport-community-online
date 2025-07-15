/**
 * Messages Data Access Layer
 * Handles all database operations for internal messaging
 */

import { supabase } from '@/integrations/supabase/client';
import { Message, MessageFormData, ApiResponse } from '@/types';
import { handleSupabaseError } from '@/lib/react-query-error-handler';
import { sanitizeObject } from '@/lib/sanitization';

/**
 * Send a new message
 */
export async function sendMessage(data: MessageFormData): Promise<ApiResponse<Message>> {
  try {
    const sanitizedData = sanitizeObject(data);
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const messageData = {
      ...sanitizedData,
      sender_id: user.id,
      read: false,
    };

    const { data: message, error } = await supabase
      .from('messages')
      .insert([messageData])
      .select()
      .single();

    if (error) throw error;

    return { success: true, data: message };
  } catch (error) {
    const appError = handleSupabaseError(error);
    return { success: false, error: appError.message };
  }
}

/**
 * Get message by ID
 */
export async function getMessageById(id: string): Promise<ApiResponse<Message>> {
  try {
    const { data: message, error } = await supabase
      .from('messages')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return { success: true, data: message };
  } catch (error) {
    const appError = handleSupabaseError(error);
    return { success: false, error: appError.message };
  }
}

/**
 * Get messages for a user (inbox)
 */
export async function getInboxMessages(userId: string, limit: number = 50, offset: number = 0): Promise<ApiResponse<Message[]>> {
  try {
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('recipient_id', userId)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, data: messages || [] };
  } catch (error) {
    const appError = handleSupabaseError(error);
    return { success: false, error: appError.message };
  }
}

/**
 * Get sent messages for a user
 */
export async function getSentMessages(userId: string, limit: number = 50, offset: number = 0): Promise<ApiResponse<Message[]>> {
  try {
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('sender_id', userId)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, data: messages || [] };
  } catch (error) {
    const appError = handleSupabaseError(error);
    return { success: false, error: appError.message };
  }
}

/**
 * Get conversation between two users
 */
export async function getConversation(userId1: string, userId2: string): Promise<ApiResponse<Message[]>> {
  try {
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${userId1},recipient_id.eq.${userId2}),and(sender_id.eq.${userId2},recipient_id.eq.${userId1})`)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return { success: true, data: messages || [] };
  } catch (error) {
    const appError = handleSupabaseError(error);
    return { success: false, error: appError.message };
  }
}

/**
 * Mark message as read
 */
export async function markMessageAsRead(id: string): Promise<ApiResponse<Message>> {
  try {
    const { data: message, error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data: message };
  } catch (error) {
    const appError = handleSupabaseError(error);
    return { success: false, error: appError.message };
  }
}

/**
 * Mark multiple messages as read
 */
export async function markMessagesAsRead(messageIds: string[]): Promise<ApiResponse<void>> {
  try {
    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .in('id', messageIds);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    const appError = handleSupabaseError(error);
    return { success: false, error: appError.message };
  }
}

/**
 * Delete message
 */
export async function deleteMessage(id: string): Promise<ApiResponse<void>> {
  try {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    const appError = handleSupabaseError(error);
    return { success: false, error: appError.message };
  }
}

/**
 * Get unread message count for a user
 */
export async function getUnreadMessageCount(userId: string): Promise<ApiResponse<number>> {
  try {
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .eq('read', false);

    if (error) throw error;

    return { success: true, data: count || 0 };
  } catch (error) {
    const appError = handleSupabaseError(error);
    return { success: false, error: appError.message };
  }
}

/**
 * Get recent conversations for a user
 */
export async function getRecentConversations(userId: string, limit: number = 10): Promise<ApiResponse<{
  otherUserId: string;
  lastMessage: Message;
  unreadCount: number;
}[]>> {
  try {
    // Get all messages involving the user
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!messages) return { success: true, data: [] };

    // Group messages by conversation partner
    const conversationMap = new Map<string, {
      otherUserId: string;
      lastMessage: Message;
      unreadCount: number;
    }>();

    messages.forEach(message => {
      const otherUserId = message.sender_id === userId ? message.recipient_id : message.sender_id;
      
      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, {
          otherUserId,
          lastMessage: message,
          unreadCount: 0,
        });
      }

      // Count unread messages from the other user
      if (message.recipient_id === userId && !message.read) {
        const conversation = conversationMap.get(otherUserId)!;
        conversation.unreadCount++;
      }
    });

    // Convert to array and sort by last message date
    const conversations = Array.from(conversationMap.values())
      .sort((a, b) => new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime())
      .slice(0, limit);

    return { success: true, data: conversations };
  } catch (error) {
    const appError = handleSupabaseError(error);
    return { success: false, error: appError.message };
  }
}

/**
 * Search messages by content
 */
export async function searchMessages(userId: string, searchTerm: string, limit: number = 20): Promise<ApiResponse<Message[]>> {
  try {
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .or(`subject.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`)
      .limit(limit)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, data: messages || [] };
  } catch (error) {
    const appError = handleSupabaseError(error);
    return { success: false, error: appError.message };
  }
}