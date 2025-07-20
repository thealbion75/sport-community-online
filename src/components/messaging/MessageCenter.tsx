/**
 * Message Center Component
 * Main interface for viewing and managing all conversations
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageSquare, 
  Search, 
  Plus, 
  Mail, 
  MailOpen,
  Clock,
  Users,
  Filter
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { useUserMessages, useUnreadMessageCount } from '@/hooks/use-messages';
import { useAuthContext } from '@/contexts/AuthContext';
import { MessageThread } from './MessageThread';
import { ComposeMessageDialog } from './ComposeMessageDialog';
import type { Message } from '@/types';

interface Conversation {
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  lastMessage: Message;
  unreadCount: number;
  messages: Message[];
}

interface MessageCenterProps {
  onSelectConversation?: (participantId: string) => void;
}

export const MessageCenter: React.FC<MessageCenterProps> = ({
  onSelectConversation
}) => {
  const { user } = useAuthContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [showComposeDialog, setShowComposeDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const { data: messages = [], isLoading } = useUserMessages(user?.id || '');
  const { data: unreadCount = 0 } = useUnreadMessageCount(user?.id || '');

  // Group messages into conversations
  const conversations = React.useMemo(() => {
    const conversationMap = new Map<string, Conversation>();

    messages.forEach(message => {
      const isFromUser = message.sender_id === user?.id;
      const participantId = isFromUser ? message.recipient_id : message.sender_id;
      
      if (!conversationMap.has(participantId)) {
        conversationMap.set(participantId, {
          participantId,
          participantName: isFromUser ? 'Recipient' : 'Sender', // This would be populated from user profiles
          participantAvatar: undefined,
          lastMessage: message,
          unreadCount: 0,
          messages: []
        });
      }

      const conversation = conversationMap.get(participantId)!;
      conversation.messages.push(message);
      
      // Update last message if this one is newer
      if (new Date(message.created_at) > new Date(conversation.lastMessage.created_at)) {
        conversation.lastMessage = message;
      }

      // Count unread messages (messages sent to user that are unread)
      if (!isFromUser && !message.read) {
        conversation.unreadCount++;
      }
    });

    return Array.from(conversationMap.values())
      .sort((a, b) => new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime());
  }, [messages, user?.id]);

  // Filter conversations based on search and tab
  const filteredConversations = conversations.filter(conversation => {
    const matchesSearch = searchQuery === '' || 
      conversation.participantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conversation.lastMessage.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conversation.lastMessage.content.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab = activeTab === 'all' || 
      (activeTab === 'unread' && conversation.unreadCount > 0) ||
      (activeTab === 'sent' && conversation.lastMessage.sender_id === user?.id);

    return matchesSearch && matchesTab;
  });

  const handleSelectConversation = (participantId: string) => {
    setSelectedConversation(participantId);
    onSelectConversation?.(participantId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <MessageSquare className="h-6 w-6" />
              Messages
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </h1>
            <p className="text-gray-600 text-sm">
              Communicate with clubs and volunteers
            </p>
          </div>
          <Button onClick={() => setShowComposeDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Message
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Conversations List */}
        <div className="w-1/3 border-r flex flex-col">
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 m-2">
              <TabsTrigger value="all" className="text-xs">
                All ({conversations.length})
              </TabsTrigger>
              <TabsTrigger value="unread" className="text-xs">
                Unread ({conversations.filter(c => c.unreadCount > 0).length})
              </TabsTrigger>
              <TabsTrigger value="sent" className="text-xs">
                Sent
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="flex-1 overflow-hidden">
              <div className="h-full overflow-y-auto">
                {filteredConversations.length === 0 ? (
                  <div className="text-center py-8 px-4">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-sm font-medium text-gray-900 mb-2">
                      {searchQuery ? 'No matching conversations' : 'No conversations yet'}
                    </h3>
                    <p className="text-xs text-gray-600 mb-4">
                      {searchQuery 
                        ? 'Try adjusting your search terms'
                        : 'Start a conversation by sending a message'
                      }
                    </p>
                    {!searchQuery && (
                      <Button size="sm" onClick={() => setShowComposeDialog(true)}>
                        Send Message
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1 p-2">
                    {filteredConversations.map((conversation) => (
                      <div
                        key={conversation.participantId}
                        className={`
                          p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-50
                          ${selectedConversation === conversation.participantId ? 'bg-blue-50 border border-blue-200' : ''}
                        `}
                        onClick={() => handleSelectConversation(conversation.participantId)}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10 flex-shrink-0">
                            <AvatarImage src={conversation.participantAvatar} />
                            <AvatarFallback>
                              {conversation.participantName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="text-sm font-medium text-gray-900 truncate">
                                {conversation.participantName}
                              </h4>
                              <div className="flex items-center gap-1">
                                {conversation.unreadCount > 0 && (
                                  <Badge variant="destructive" className="text-xs">
                                    {conversation.unreadCount}
                                  </Badge>
                                )}
                                <span className="text-xs text-gray-500">
                                  {formatDistanceToNow(new Date(conversation.lastMessage.created_at), { addSuffix: true })}
                                </span>
                              </div>
                            </div>
                            
                            <p className="text-sm font-medium text-gray-700 truncate mb-1">
                              {conversation.lastMessage.subject}
                            </p>
                            
                            <p className="text-xs text-gray-600 line-clamp-2">
                              {conversation.lastMessage.content}
                            </p>
                            
                            <div className="flex items-center gap-2 mt-2">
                              {conversation.lastMessage.sender_id === user?.id ? (
                                <MailOpen className="h-3 w-3 text-gray-400" />
                              ) : (
                                <Mail className={`h-3 w-3 ${conversation.unreadCount > 0 ? 'text-blue-600' : 'text-gray-400'}`} />
                              )}
                              <span className="text-xs text-gray-500">
                                {conversation.lastMessage.sender_id === user?.id ? 'You: ' : ''}
                                {format(new Date(conversation.lastMessage.created_at), 'MMM d, h:mm a')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Message Thread */}
        <div className="flex-1">
          {selectedConversation ? (
            <MessageThread
              participantId={selectedConversation}
              onBack={() => setSelectedConversation(null)}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select a conversation
                </h3>
                <p className="text-gray-600 mb-6">
                  Choose a conversation from the list to view messages
                </p>
                <Button onClick={() => setShowComposeDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Start New Conversation
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Compose Dialog */}
      <ComposeMessageDialog
        isOpen={showComposeDialog}
        onClose={() => setShowComposeDialog(false)}
      />
    </div>
  );
};