/**
 * Message Thread Component
 * Displays individual conversation with message history and reply functionality
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Send, 
  MoreVertical, 
  Trash2,
  Clock,
  CheckCircle
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { 
  useConversation, 
  useSendMessage, 
  useMarkConversationAsRead,
  useDeleteMessage 
} from '@/hooks/use-messages';
import { useAuthContext } from '@/contexts/AuthContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { Message } from '@/types';

interface MessageThreadProps {
  participantId: string;
  onBack?: () => void;
}

export const MessageThread: React.FC<MessageThreadProps> = ({
  participantId,
  onBack
}) => {
  const { user } = useAuthContext();
  const [replyMessage, setReplyMessage] = useState('');
  const [replySubject, setReplySubject] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading } = useConversation(user?.id || '', participantId);
  const sendMessageMutation = useSendMessage();
  const markAsReadMutation = useMarkConversationAsRead();
  const deleteMessageMutation = useDeleteMessage();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark conversation as read when opened
  useEffect(() => {
    if (user?.id && participantId && messages.length > 0) {
      const unreadMessages = messages.filter(m => 
        m.recipient_id === user.id && !m.read
      );
      
      if (unreadMessages.length > 0) {
        markAsReadMutation.mutate({
          recipientId: user.id,
          senderId: participantId
        });
      }
    }
  }, [user?.id, participantId, messages, markAsReadMutation]);

  // Set reply subject based on last message
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      const subject = lastMessage.subject.startsWith('Re: ') 
        ? lastMessage.subject 
        : `Re: ${lastMessage.subject}`;
      setReplySubject(subject);
    }
  }, [messages]);

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !user?.id) return;

    try {
      const result = await sendMessageMutation.mutateAsync({
        senderId: user.id,
        messageData: {
          recipient_id: participantId,
          subject: replySubject,
          content: replyMessage
        }
      });

      if (result.success) {
        setReplyMessage('');
      }
    } catch (error) {
      console.error('Send reply error:', error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      await deleteMessageMutation.mutateAsync(messageId);
    }
  };

  const getParticipantName = () => {
    // This would typically come from user profiles
    // For now, we'll use a placeholder
    return 'Conversation Partner';
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="border-b p-4">
          <div className="flex items-center gap-3">
            {onBack && (
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {getParticipantName().split(' ').map(n => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold">{getParticipantName()}</h2>
              <p className="text-sm text-gray-600">No messages yet</p>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-gray-400 mb-4">
              <Clock className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Start the conversation
            </h3>
            <p className="text-gray-600">
              Send the first message to begin this conversation.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <Avatar className="h-8 w-8">
            <AvatarFallback>
              {getParticipantName().split(' ').map(n => n[0]).join('').slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="font-semibold">{getParticipantName()}</h2>
            <p className="text-sm text-gray-600">
              {messages.length} {messages.length === 1 ? 'message' : 'messages'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isFromUser = message.sender_id === user?.id;
          
          return (
            <div
              key={message.id}
              className={`flex ${isFromUser ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`
                max-w-[70%] rounded-lg p-4 
                ${isFromUser 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-900'
                }
              `}>
                {/* Message Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {!isFromUser && (
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {getParticipantName().split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <span className={`text-sm font-medium ${isFromUser ? 'text-blue-100' : 'text-gray-600'}`}>
                      {isFromUser ? 'You' : getParticipantName()}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`text-xs ${isFromUser ? 'text-blue-200' : 'text-gray-500'}`}>
                      {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                    </span>
                    
                    {isFromUser && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-blue-200 hover:text-white">
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => handleDeleteMessage(message.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>

                {/* Subject */}
                <h4 className={`font-medium mb-2 ${isFromUser ? 'text-blue-100' : 'text-gray-700'}`}>
                  {message.subject}
                </h4>

                {/* Content */}
                <p className="text-sm whitespace-pre-wrap">
                  {message.content}
                </p>

                {/* Message Status */}
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-opacity-20">
                  <span className={`text-xs ${isFromUser ? 'text-blue-200' : 'text-gray-500'}`}>
                    {format(new Date(message.created_at), 'MMM d, yyyy \'at\' h:mm a')}
                  </span>
                  
                  {isFromUser && (
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-blue-200" />
                      <span className="text-xs text-blue-200">
                        {message.read ? 'Read' : 'Sent'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Form */}
      <div className="border-t p-4">
        <div className="space-y-3">
          <div className="text-sm text-gray-600">
            <strong>Subject:</strong> {replySubject}
          </div>
          
          <div className="flex gap-2">
            <Textarea
              placeholder="Type your reply..."
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              rows={3}
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  handleSendReply();
                }
              }}
            />
            <Button
              onClick={handleSendReply}
              disabled={!replyMessage.trim() || sendMessageMutation.isPending}
              className="self-end"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="text-xs text-gray-500">
            Press Ctrl+Enter to send
          </div>
        </div>
      </div>
    </div>
  );
};