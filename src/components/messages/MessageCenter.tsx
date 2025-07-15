/**
 * Message Center Component
 * Main interface for viewing all conversations and messages
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingContainer } from '@/components/ui/loading-state';
import { useInboxMessages, useSentMessages, useRecentConversations, useUnreadMessageCount, useSearchMessages } from '@/hooks/use-messages';
import { useCurrentUser } from '@/hooks/use-auth';
import { MessageThread } from './MessageThread';
import { ComposeMessage } from './ComposeMessage';
import { Message } from '@/types';
import { 
  MessageSquare, 
  Search, 
  Plus, 
  Inbox, 
  Send, 
  Users,
  Clock,
  Mail,
  MailOpen
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface MessageCenterProps {
  onSelectConversation?: (userId: string) => void;
  onComposeNew?: () => void;
}

export function MessageCenter({ onSelectConversation, onComposeNew }: MessageCenterProps) {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: user } = useCurrentUser();
  const { data: inboxMessages, isLoading: inboxLoading } = useInboxMessages(user?.id || '');
  const { data: sentMessages, isLoading: sentLoading } = useSentMessages(user?.id || '');
  const { data: recentConversations, isLoading: conversationsLoading } = useRecentConversations(user?.id || '');
  const { data: unreadCount } = useUnreadMessageCount(user?.id || '');
  const { data: searchResults, isLoading: searchLoading } = useSearchMessages(
    user?.id || '', 
    searchTerm, 
    searchTerm.length > 2 ? 20 : undefined
  );

  const handleSelectConversation = (otherUserId: string) => {
    setSelectedConversation(otherUserId);
    onSelectConversation?.(otherUserId);
  };

  const handleComposeNew = () => {
    setShowCompose(true);
    onComposeNew?.();
  };

  const handleCloseCompose = () => {
    setShowCompose(false);
  };

  const handleMessageSent = () => {
    setShowCompose(false);
    // Refresh conversations
  };

  // Show conversation view if one is selected
  if (selectedConversation) {
    return (
      <MessageThread
        otherUserId={selectedConversation}
        onBack={() => setSelectedConversation(null)}
      />
    );
  }

  // Show compose view
  if (showCompose) {
    return (
      <ComposeMessage
        onCancel={handleCloseCompose}
        onMessageSent={handleMessageSent}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="h-8 w-8" />
            Messages
          </h1>
          <p className="text-gray-600 mt-1">
            Communicate with clubs and volunteers securely
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {unreadCount && unreadCount > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {unreadCount} unread
            </Badge>
          )}
          <Button onClick={handleComposeNew}>
            <Plus className="h-4 w-4 mr-2" />
            New Message
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search messages by subject or content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchTerm.length > 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Search Results</CardTitle>
            <CardDescription>
              Found {searchResults?.length || 0} messages matching "{searchTerm}"
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoadingContainer isLoading={searchLoading}>
              {searchResults && searchResults.length > 0 ? (
                <div className="space-y-3">
                  {searchResults.map((message) => (
                    <MessageItem
                      key={message.id}
                      message={message}
                      currentUserId={user?.id || ''}
                      onClick={() => {
                        const otherUserId = message.sender_id === user?.id 
                          ? message.recipient_id 
                          : message.sender_id;
                        handleSelectConversation(otherUserId);
                      }}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No messages found matching your search.
                </p>
              )}
            </LoadingContainer>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      {searchTerm.length <= 2 && (
        <Tabs defaultValue="conversations" className="space-y-6">
          <TabsList>
            <TabsTrigger value="conversations" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Conversations
            </TabsTrigger>
            <TabsTrigger value="inbox" className="flex items-center gap-2">
              <Inbox className="h-4 w-4" />
              Inbox
              {unreadCount && unreadCount > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Sent
            </TabsTrigger>
          </TabsList>

          {/* Conversations Tab */}
          <TabsContent value="conversations">
            <Card>
              <CardHeader>
                <CardTitle>Recent Conversations</CardTitle>
                <CardDescription>
                  Your recent message conversations with clubs and volunteers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LoadingContainer isLoading={conversationsLoading}>
                  {recentConversations && recentConversations.length > 0 ? (
                    <div className="space-y-3">
                      {recentConversations.map((conversation) => (
                        <ConversationItem
                          key={conversation.otherUserId}
                          conversation={conversation}
                          onClick={() => handleSelectConversation(conversation.otherUserId)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No conversations yet
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Start a conversation by sending a message to a club or volunteer.
                      </p>
                      <Button onClick={handleComposeNew}>
                        <Plus className="h-4 w-4 mr-2" />
                        Send your first message
                      </Button>
                    </div>
                  )}
                </LoadingContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Inbox Tab */}
          <TabsContent value="inbox">
            <Card>
              <CardHeader>
                <CardTitle>Inbox</CardTitle>
                <CardDescription>
                  Messages you've received from other users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LoadingContainer isLoading={inboxLoading}>
                  {inboxMessages && inboxMessages.length > 0 ? (
                    <div className="space-y-3">
                      {inboxMessages.map((message) => (
                        <MessageItem
                          key={message.id}
                          message={message}
                          currentUserId={user?.id || ''}
                          onClick={() => handleSelectConversation(message.sender_id)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Inbox className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No messages in inbox
                      </h3>
                      <p className="text-gray-600">
                        Messages from clubs and volunteers will appear here.
                      </p>
                    </div>
                  )}
                </LoadingContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sent Tab */}
          <TabsContent value="sent">
            <Card>
              <CardHeader>
                <CardTitle>Sent Messages</CardTitle>
                <CardDescription>
                  Messages you've sent to other users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LoadingContainer isLoading={sentLoading}>
                  {sentMessages && sentMessages.length > 0 ? (
                    <div className="space-y-3">
                      {sentMessages.map((message) => (
                        <MessageItem
                          key={message.id}
                          message={message}
                          currentUserId={user?.id || ''}
                          onClick={() => handleSelectConversation(message.recipient_id)}
                          isSent={true}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Send className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No sent messages
                      </h3>
                      <p className="text-gray-600">
                        Messages you send will appear here.
                      </p>
                    </div>
                  )}
                </LoadingContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

// Conversation Item Component
interface ConversationItemProps {
  conversation: {
    otherUserId: string;
    lastMessage: Message;
    unreadCount: number;
  };
  onClick: () => void;
}

function ConversationItem({ conversation, onClick }: ConversationItemProps) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-md cursor-pointer transition-colors"
    >
      <Avatar>
        <AvatarFallback>
          {conversation.otherUserId.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="font-medium text-gray-900 truncate">
            User {conversation.otherUserId.slice(0, 8)}
          </p>
          <div className="flex items-center gap-2">
            {conversation.unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {conversation.unreadCount}
              </Badge>
            )}
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(conversation.lastMessage.created_at))} ago
            </span>
          </div>
        </div>
        
        <p className="text-sm text-gray-600 truncate">
          {conversation.lastMessage.subject}
        </p>
        
        <p className="text-xs text-gray-500 truncate mt-1">
          {conversation.lastMessage.content}
        </p>
      </div>
    </div>
  );
}

// Message Item Component
interface MessageItemProps {
  message: Message;
  currentUserId: string;
  onClick: () => void;
  isSent?: boolean;
}

function MessageItem({ message, currentUserId, onClick, isSent = false }: MessageItemProps) {
  const isUnread = !message.read && message.recipient_id === currentUserId;
  
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 p-3 hover:bg-gray-50 rounded-md cursor-pointer transition-colors ${
        isUnread ? 'bg-blue-50 border-l-4 border-blue-500' : ''
      }`}
    >
      <div className="flex items-center gap-2">
        {isUnread ? (
          <Mail className="h-5 w-5 text-blue-600" />
        ) : (
          <MailOpen className="h-5 w-5 text-gray-400" />
        )}
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs">
            {isSent 
              ? message.recipient_id.slice(0, 2).toUpperCase()
              : message.sender_id.slice(0, 2).toUpperCase()
            }
          </AvatarFallback>
        </Avatar>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className={`text-sm truncate ${isUnread ? 'font-semibold' : 'font-medium'}`}>
            {message.subject}
          </p>
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3 text-gray-400" />
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(message.created_at))} ago
            </span>
          </div>
        </div>
        
        <p className="text-xs text-gray-600 truncate">
          {isSent ? 'To: ' : 'From: '}
          {isSent 
            ? `User ${message.recipient_id.slice(0, 8)}`
            : `User ${message.sender_id.slice(0, 8)}`
          }
        </p>
        
        <p className="text-xs text-gray-500 truncate mt-1">
          {message.content}
        </p>
      </div>
    </div>
  );
}