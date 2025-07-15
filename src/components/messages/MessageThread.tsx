/**
 * Message Thread Component
 * Individual conversation view between two users
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LoadingContainer, LoadingSpinner } from '@/components/ui/loading-state';
import { useConversation, useSendMessage, useMarkMessageAsRead } from '@/hooks/use-messages';
import { useCurrentUser } from '@/hooks/use-auth';
import { Message } from '@/types';
import { 
  ArrowLeft, 
  Send, 
  User, 
  Clock,
  Check,
  CheckCheck
} from 'lucide-react';
import { format, formatDistanceToNow, isSameDay } from 'date-fns';

interface MessageThreadProps {
  otherUserId: string;
  onBack?: () => void;
}

export function MessageThread({ otherUserId, onBack }: MessageThreadProps) {
  const [newMessage, setNewMessage] = useState('');
  const [subject, setSubject] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: user } = useCurrentUser();
  const { data: messages, isLoading } = useConversation(user?.id || '', otherUserId);
  const sendMessageMutation = useSendMessage();
  const markAsReadMutation = useMarkMessageAsRead();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark unread messages as read
  useEffect(() => {
    if (messages && user) {
      const unreadMessages = messages.filter(
        msg => !msg.read && msg.recipient_id === user.id
      );
      
      unreadMessages.forEach(msg => {
        markAsReadMutation.mutate(msg.id);
      });
    }
  }, [messages, user, markAsReadMutation]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    try {
      await sendMessageMutation.mutateAsync({
        recipient_id: otherUserId,
        subject: subject.trim() || 'Message',
        content: newMessage.trim(),
      });
      
      setNewMessage('');
      setSubject('');
    } catch (error) {
      // Error handled by mutation hook
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Group messages by date
  const groupedMessages = React.useMemo(() => {
    if (!messages) return [];
    
    const groups: { date: Date; messages: Message[] }[] = [];
    let currentGroup: { date: Date; messages: Message[] } | null = null;

    messages.forEach(message => {
      const messageDate = new Date(message.created_at);
      
      if (!currentGroup || !isSameDay(currentGroup.date, messageDate)) {
        currentGroup = { date: messageDate, messages: [message] };
        groups.push(currentGroup);
      } else {
        currentGroup.messages.push(message);
      }
    });

    return groups;
  }, [messages]);

  if (isLoading) {
    return (
      <LoadingContainer isLoading={true} loadingText="Loading conversation..." />
    );
  }

  return (
    <div className="flex flex-col h-full max-h-screen">
      {/* Header */}
      <Card className="flex-shrink-0">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {onBack && (
                <Button variant="ghost" size="sm" onClick={onBack}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              
              <Avatar>
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              
              <div>
                <CardTitle className="text-lg">
                  User {otherUserId.slice(0, 8)}
                </CardTitle>
                <CardDescription>
                  {messages?.length || 0} message{messages?.length !== 1 ? 's' : ''}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {groupedMessages.length > 0 ? (
          groupedMessages.map((group, groupIndex) => (
            <div key={groupIndex} className="space-y-4">
              {/* Date Separator */}
              <div className="flex items-center justify-center">
                <div className="bg-gray-100 px-3 py-1 rounded-full text-xs text-gray-600">
                  {format(group.date, 'EEEE, MMMM d, yyyy')}
                </div>
              </div>

              {/* Messages for this date */}
              {group.messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwn={message.sender_id === user?.id}
                />
              ))}
            </div>
          ))
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Start the conversation
              </h3>
              <p className="text-gray-600">
                Send your first message to begin the conversation.
              </p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <Card className="flex-shrink-0 m-4 mt-0">
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Subject (only show if no messages yet) */}
            {(!messages || messages.length === 0) && (
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Message subject..."
                  maxLength={100}
                />
              </div>
            )}

            {/* Message Input */}
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your message here... (Ctrl+Enter to send)"
                rows={3}
                maxLength={1000}
              />
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>Ctrl+Enter to send</span>
                <span>{newMessage.length}/1000</span>
              </div>
            </div>

            {/* Send Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sendMessageMutation.isPending}
                className="flex items-center gap-2"
              >
                {sendMessageMutation.isPending ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Send Message
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Message Bubble Component
interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
        <div
          className={`px-4 py-3 rounded-lg ${
            isOwn
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-900'
          }`}
        >
          {/* Subject (only show if it's different from "Message") */}
          {message.subject && message.subject !== 'Message' && (
            <div className={`text-sm font-medium mb-2 ${
              isOwn ? 'text-blue-100' : 'text-gray-700'
            }`}>
              {message.subject}
            </div>
          )}
          
          {/* Message Content */}
          <div className="whitespace-pre-wrap break-words">
            {message.content}
          </div>
        </div>
        
        {/* Message Info */}
        <div className={`flex items-center gap-2 mt-1 text-xs ${
          isOwn ? 'justify-end text-gray-500' : 'justify-start text-gray-500'
        }`}>
          <Clock className="h-3 w-3" />
          <span>{formatDistanceToNow(new Date(message.created_at))} ago</span>
          
          {isOwn && (
            <div className="flex items-center">
              {message.read ? (
                <CheckCheck className="h-3 w-3 text-blue-600" />
              ) : (
                <Check className="h-3 w-3 text-gray-400" />
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Avatar */}
      <div className={`${isOwn ? 'order-1 mr-2' : 'order-2 ml-2'} flex-shrink-0`}>
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs">
            {isOwn ? 'You' : <User className="h-3 w-3" />}
          </AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
}