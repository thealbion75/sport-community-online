/**
 * Message Components Tests
 * Tests for messaging system components
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MessageCenter } from '../MessageCenter';
import { MessageThread } from '../MessageThread';
import { ComposeMessage } from '../ComposeMessage';
import { NotificationBell } from '../NotificationBell';
import { Message, Club, VolunteerProfile, UserRole } from '@/types';

// Mock hooks
vi.mock('@/hooks/use-messages', () => ({
  useInboxMessages: () => ({
    data: mockMessages,
    isLoading: false,
  }),
  useSentMessages: () => ({
    data: mockMessages,
    isLoading: false,
  }),
  useRecentConversations: () => ({
    data: mockConversations,
    isLoading: false,
  }),
  useUnreadMessageCount: () => ({
    data: 2,
  }),
  useSearchMessages: () => ({
    data: mockMessages.slice(0, 1),
    isLoading: false,
  }),
  useConversation: () => ({
    data: mockMessages,
    isLoading: false,
  }),
  useSendMessage: () => ({
    mutateAsync: vi.fn().mockResolvedValue({ success: true }),
    isPending: false,
  }),
  useMarkMessageAsRead: () => ({
    mutate: vi.fn(),
  }),
}));

vi.mock('@/hooks/use-auth', () => ({
  useCurrentUser: () => ({
    data: { id: 'user-1', email: 'user@example.com' },
  }),
  useUserRole: () => ({
    data: UserRole.VOLUNTEER,
  }),
}));

vi.mock('@/hooks/use-clubs', () => ({
  useClubs: () => ({
    data: mockClubs,
  }),
}));

vi.mock('@/hooks/use-volunteers', () => ({
  useVisibleVolunteers: () => ({
    data: mockVolunteers,
  }),
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock data
const mockMessages: Message[] = [
  {
    id: 'msg-1',
    sender_id: 'user-2',
    recipient_id: 'user-1',
    subject: 'Volunteer Opportunity Question',
    content: 'Hi, I have a question about the match day volunteer position.',
    read: false,
    created_at: '2024-01-20T10:00:00Z',
  },
  {
    id: 'msg-2',
    sender_id: 'user-1',
    recipient_id: 'user-2',
    subject: 'Re: Volunteer Opportunity Question',
    content: 'Thanks for your interest! The position involves helping with setup and crowd management.',
    read: true,
    created_at: '2024-01-20T11:00:00Z',
  },
];

const mockConversations = [
  {
    otherUserId: 'user-2',
    lastMessage: mockMessages[1],
    unreadCount: 1,
  },
];

const mockClubs: Club[] = [
  {
    id: 'club-1',
    name: 'East Grinstead FC',
    location: 'East Grinstead',
    contact_email: 'contact@egfc.com',
    sport_types: ['Football'],
    verified: true,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
];

const mockVolunteers: VolunteerProfile[] = [
  {
    id: 'vol-1',
    user_id: 'user-3',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    location: 'East Grinstead',
    skills: ['Communication'],
    availability: ['Weekends'],
    is_visible: true,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
];

// Test wrapper
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('MessageCenter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders message center correctly', () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <MessageCenter />
      </Wrapper>
    );

    expect(screen.getByText('Messages')).toBeInTheDocument();
    expect(screen.getByText(/Communicate with clubs and volunteers/)).toBeInTheDocument();
    expect(screen.getByText('New Message')).toBeInTheDocument();
  });

  it('shows unread message count', () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <MessageCenter />
      </Wrapper>
    );

    expect(screen.getByText('2 unread')).toBeInTheDocument();
  });

  it('displays search functionality', () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <MessageCenter />
      </Wrapper>
    );

    const searchInput = screen.getByPlaceholderText(/Search messages/);
    expect(searchInput).toBeInTheDocument();
  });

  it('shows conversation tabs', () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <MessageCenter />
      </Wrapper>
    );

    expect(screen.getByText('Conversations')).toBeInTheDocument();
    expect(screen.getByText('Inbox')).toBeInTheDocument();
    expect(screen.getByText('Sent')).toBeInTheDocument();
  });

  it('handles search input', () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <MessageCenter />
      </Wrapper>
    );

    const searchInput = screen.getByPlaceholderText(/Search messages/);
    fireEvent.change(searchInput, { target: { value: 'volunteer' } });

    expect(searchInput).toHaveValue('volunteer');
  });

  it('calls onComposeNew when new message button is clicked', () => {
    const onComposeNew = vi.fn();
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <MessageCenter onComposeNew={onComposeNew} />
      </Wrapper>
    );

    const newMessageButton = screen.getByText('New Message');
    fireEvent.click(newMessageButton);

    expect(onComposeNew).toHaveBeenCalled();
  });
});

describe('MessageThread', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders message thread correctly', () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <MessageThread otherUserId="user-2" />
      </Wrapper>
    );

    expect(screen.getByText(/User user-2/)).toBeInTheDocument();
    expect(screen.getByText(/2 messages/)).toBeInTheDocument();
  });

  it('displays messages in conversation', () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <MessageThread otherUserId="user-2" />
      </Wrapper>
    );

    expect(screen.getByText('Volunteer Opportunity Question')).toBeInTheDocument();
    expect(screen.getByText(/Hi, I have a question about/)).toBeInTheDocument();
  });

  it('shows message input form', () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <MessageThread otherUserId="user-2" />
      </Wrapper>
    );

    expect(screen.getByLabelText('Message')).toBeInTheDocument();
    expect(screen.getByText('Send Message')).toBeInTheDocument();
  });

  it('handles message input', () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <MessageThread otherUserId="user-2" />
      </Wrapper>
    );

    const messageInput = screen.getByLabelText('Message');
    fireEvent.change(messageInput, { target: { value: 'Test message' } });

    expect(messageInput).toHaveValue('Test message');
  });

  it('shows back button when onBack is provided', () => {
    const onBack = vi.fn();
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <MessageThread otherUserId="user-2" onBack={onBack} />
      </Wrapper>
    );

    const backButton = screen.getByRole('button');
    fireEvent.click(backButton);

    expect(onBack).toHaveBeenCalled();
  });
});

describe('ComposeMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders compose message form', () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <ComposeMessage />
      </Wrapper>
    );

    expect(screen.getByText('Compose Message')).toBeInTheDocument();
    expect(screen.getByLabelText(/Subject/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Message/)).toBeInTheDocument();
  });

  it('shows recipient selection when no recipient provided', () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <ComposeMessage />
      </Wrapper>
    );

    expect(screen.getByText('Send To')).toBeInTheDocument();
    expect(screen.getByText('Sports Clubs')).toBeInTheDocument();
  });

  it('displays available clubs for selection', () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <ComposeMessage />
      </Wrapper>
    );

    expect(screen.getByText('East Grinstead FC')).toBeInTheDocument();
  });

  it('handles form input', () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <ComposeMessage recipientId="user-2" />
      </Wrapper>
    );

    const subjectInput = screen.getByLabelText(/Subject/);
    const messageInput = screen.getByLabelText(/Message/);

    fireEvent.change(subjectInput, { target: { value: 'Test Subject' } });
    fireEvent.change(messageInput, { target: { value: 'Test message content' } });

    expect(subjectInput).toHaveValue('Test Subject');
    expect(messageInput).toHaveValue('Test message content');
  });

  it('shows message guidelines', () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <ComposeMessage />
      </Wrapper>
    );

    expect(screen.getByText('Message Guidelines:')).toBeInTheDocument();
    expect(screen.getByText(/Be respectful and professional/)).toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', () => {
    const onCancel = vi.fn();
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <ComposeMessage onCancel={onCancel} />
      </Wrapper>
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(onCancel).toHaveBeenCalled();
  });
});

describe('NotificationBell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders notification bell with unread count', () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <NotificationBell />
      </Wrapper>
    );

    // The bell icon should be present
    expect(screen.getByRole('button')).toBeInTheDocument();
    
    // Should show unread count badge
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('opens notification dropdown when clicked', () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <NotificationBell />
      </Wrapper>
    );

    const bellButton = screen.getByRole('button');
    fireEvent.click(bellButton);

    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });

  it('calls navigation handlers when menu items are clicked', () => {
    const onNavigateToMessages = vi.fn();
    const onNavigateToApplications = vi.fn();
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <NotificationBell 
          onNavigateToMessages={onNavigateToMessages}
          onNavigateToApplications={onNavigateToApplications}
        />
      </Wrapper>
    );

    const bellButton = screen.getByRole('button');
    fireEvent.click(bellButton);

    // Click on "View all messages" option
    const messagesOption = screen.getByText('View all messages');
    fireEvent.click(messagesOption);

    expect(onNavigateToMessages).toHaveBeenCalled();
  });
});