/**
 * Unit tests for MessageCenter component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MessageCenter } from '../MessageCenter';

// Mock the hooks and context
vi.mock('@/hooks/useMessages', () => ({
  useUserMessages: () => ({
    data: [
      {
        id: 'msg-1',
        sender_id: 'user-1',
        recipient_id: 'user-2',
        subject: 'Test Message',
        content: 'This is a test message',
        read: false,
        created_at: '2024-01-01T10:00:00Z'
      },
      {
        id: 'msg-2',
        sender_id: 'user-2',
        recipient_id: 'user-1',
        subject: 'Re: Test Message',
        content: 'This is a reply',
        read: true,
        created_at: '2024-01-01T11:00:00Z'
      }
    ],
    isLoading: false
  }),
  useUnreadMessageCount: () => ({
    data: 1
  })
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuthContext: () => ({
    user: { id: 'user-1', email: 'test@example.com' }
  })
}));

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });
  
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('MessageCenter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders message center correctly', () => {
    renderWithQueryClient(<MessageCenter />);
    
    expect(screen.getByText('Messages')).toBeInTheDocument();
    expect(screen.getByText('Communicate with clubs and volunteers')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search conversations...')).toBeInTheDocument();
    expect(screen.getByText('New Message')).toBeInTheDocument();
  });

  it('displays unread message count', () => {
    renderWithQueryClient(<MessageCenter />);
    
    expect(screen.getByText('1')).toBeInTheDocument(); // Unread count badge
  });

  it('shows conversation tabs', () => {
    renderWithQueryClient(<MessageCenter />);
    
    expect(screen.getByText(/All \(1\)/)).toBeInTheDocument();
    expect(screen.getByText(/Unread \(1\)/)).toBeInTheDocument();
    expect(screen.getByText('Sent')).toBeInTheDocument();
  });

  it('displays conversations list', () => {
    renderWithQueryClient(<MessageCenter />);
    
    expect(screen.getByText('Test Message')).toBeInTheDocument();
    expect(screen.getByText('This is a test message')).toBeInTheDocument();
  });

  it('handles search input', () => {
    renderWithQueryClient(<MessageCenter />);
    
    const searchInput = screen.getByPlaceholderText('Search conversations...');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    
    expect(searchInput).toHaveValue('test');
  });

  it('shows new message button', () => {
    renderWithQueryClient(<MessageCenter />);
    
    const newMessageButton = screen.getByText('New Message');
    expect(newMessageButton).toBeInTheDocument();
    
    fireEvent.click(newMessageButton);
    // This would open the compose dialog in the actual implementation
  });

  it('displays empty state when no conversation selected', () => {
    renderWithQueryClient(<MessageCenter />);
    
    expect(screen.getByText('Select a conversation')).toBeInTheDocument();
    expect(screen.getByText('Choose a conversation from the list to view messages')).toBeInTheDocument();
  });

  it('handles tab switching', () => {
    renderWithQueryClient(<MessageCenter />);
    
    const unreadTab = screen.getByText(/Unread \(1\)/);
    fireEvent.click(unreadTab);
    
    // The tab should be active (this would be reflected in the UI state)
    expect(unreadTab).toBeInTheDocument();
  });
});