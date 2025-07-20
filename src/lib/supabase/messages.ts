// src/lib/supabase/messages.ts

import { supabase } from '@/integrations/supabase/client';
import { Message, MessageFormData, Conversation } from '@/types/volunteer';
import { PostgrestError } from '@supabase/supabase-js';

interface ApiResponse<T> {
  data: T | null;
  error: PostgrestError | null;
  success: boolean;
}

async function handleRequest<T>(promise: Promise<{ data: T; error: PostgrestError | null }>): Promise<ApiResponse<T>> {
  const { data, error } = await promise;
  if (error) {
    console.error(error);
    return { data: null, error, success: false };
  }
  return { data, error: null, success: true };
}

export async function getMessageById(id: string): Promise<ApiResponse<Message>> {
  return handleRequest(supabase.from('messages').select('*').eq('id', id).single());
}

export async function getInboxMessages(userId: string, limit: number, offset: number): Promise<ApiResponse<Message[]>> {
  return handleRequest(
    supabase
      .from('messages')
      .select('*')
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
  );
}

export async function getSentMessages(userId: string, limit: number, offset: number): Promise<ApiResponse<Message[]>> {
  return handleRequest(
    supabase
      .from('messages')
      .select('*')
      .eq('sender_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
  );
}

export async function getConversation(userId1: string, userId2: string): Promise<ApiResponse<Message[]>> {
    const { data: conversation, error } = await supabase
        .from('conversations')
        .select('id')
        .contains('participant_ids', [userId1, userId2])
        .limit(1)
        .single();

    if (error || !conversation) {
        return handleRequest(Promise.resolve({data: [], error: error}));
    }

    return handleRequest(
        supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversation.id)
            .order('created_at', { ascending: true })
    );
}

export async function getUnreadMessageCount(userId: string): Promise<ApiResponse<number>> {
    const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', userId)
        .eq('is_read', false);

    if (error) {
        console.error(error);
        return { data: null, error, success: false };
    }
    return { data: count, error: null, success: true };
}

export async function getRecentConversations(userId: string, limit: number): Promise<ApiResponse<Conversation[]>> {
  return handleRequest(
    supabase
      .from('conversations')
      .select('*')
      .contains('participant_ids', [userId])
      .order('last_message_at', { ascending: false })
      .limit(limit)
  );
}

export async function searchMessages(userId: string, term: string, limit?: number): Promise<ApiResponse<Message[]>> {
  let query = supabase
    .from('messages')
    .select('*')
    .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
    .ilike('content', `%${term}%`)
    .order('created_at', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  return handleRequest(query);
}

export async function sendMessage(messageData: MessageFormData): Promise<ApiResponse<Message>> {
    let conversationId = messageData.conversation_id;

    // If no conversation_id, check if one exists or create a new one
    if (!conversationId) {
        const { data: existingConversation, error: existingConversationError } = await supabase
            .from('conversations')
            .select('id')
            .contains('participant_ids', [messageData.sender_id, messageData.recipient_id])
            .limit(1)
            .single();

        if (existingConversation) {
            conversationId = existingConversation.id;
        } else {
            const { data: newConversation, error: newConversationError } = await supabase
                .from('conversations')
                .insert({
                    participant_ids: [messageData.sender_id, messageData.recipient_id],
                })
                .select('id')
                .single();

            if (newConversationError) {
                return handleRequest(Promise.resolve({ data: null, error: newConversationError }));
            }
            conversationId = newConversation.id;
        }
    }

    const { data, error } = await supabase
        .from('messages')
        .insert({
            ...messageData,
            conversation_id: conversationId,
            is_read: false,
        })
        .select()
        .single();
    
    if (error) {
        return handleRequest(Promise.resolve({ data: null, error }));
    }

    // Update conversation's last_message_at
    await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString(), last_message_content: messageData.content })
        .eq('id', conversationId);

    return handleRequest(Promise.resolve({ data, error: null }));
}

export async function markMessageAsRead(id: string): Promise<ApiResponse<null>> {
  return handleRequest(supabase.from('messages').update({ is_read: true }).eq('id', id).eq('is_read', false));
}

export async function markMessagesAsRead(messageIds: string[]): Promise<ApiResponse<null>> {
    return handleRequest(
        supabase.from('messages').update({ is_read: true }).in('id', messageIds).eq('is_read', false)
    );
}

export async function deleteMessage(id: string): Promise<ApiResponse<null>> {
  return handleRequest(supabase.from('messages').delete().eq('id', id));
}
