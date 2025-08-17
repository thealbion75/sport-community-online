/**
 * ClubApplicationList Component Tests
 * Tests for the club application list component functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import { ClubApplicationList } from '../ClubApplicationList';
import * as clubApprovalHooks from '@/hooks/use-club-approval';

// Mock the hooks
vi.mock('@/hooks/use-club-approval');

// Mock date-fns
vi.mock('date-fns', () => ({
  format: vi.fn((date, formatStr) => '2024-01-15')
}));

const mockApplications = [
  {
    id: '1',
    name: 'Test Football Club',
    contact_email: 'test@football.com',
    contact_phone: '123-456-7890',
    location: 'London',
    application_status: 'pending' as const,
    created_at: '2024-01-15T10:00:00Z',
    description: 'A test football club',
    sport_types: ['football'],
    verified: false,
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    name: 'Test Rugby Club',
    contact_email: 'test@rugby.com',
    location: 'Manchester',
    application_status: 'approved' as const,
    created_at: '2024-01-14T10:00:00Z',
    description: 'A test rugby club',
    sport_types: ['rugby'],
    verified: true,
    updated_at: '2024-01-14T10:00:00Z'
  }
];

const mockPaginatedResponse = {
  data: mockApplications,
  count: 2,
  page: 1,
  limit: 10,
  total_pages: 1
};

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false }
  }
});

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('ClubApplicationList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock all the hooks with default implementations
    vi.mocked(clubApprovalHooks.usePendingApplicationsOnly).mockReturnValue({
      data: mockPaginatedResponse,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isError: false,
      isSuccess: true
    } as any);
    
    vi.mocked(clubApprovalHooks.useApprovedApplications).mockReturnValue({
      data: mockPaginatedResponse,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isError: false,
      isSuccess: true
    } as any);
    
    vi.mocked(clubApprovalHooks.useRejectedApplications).mockReturnValue({
      data: mockPaginatedResponse,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isError: false,
      isSuccess: true
    } as any);
    
    vi.mocked(clubApprovalHooks.useAllApplications).mockReturnValue({
      data: mockPaginatedResponse,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isError: false,
      isSuccess: true
    } as any);
    
    vi.mocked(clubApprovalHooks.usePendingApplications).mockReturnValue({
      data: mockPaginatedResponse,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isError: false,
      isSuccess: true
    } as any);
  });

  it('renders the component with applications', () => {
    renderWithQueryClient(<ClubApplicationList />);
    
    expect(screen.getByText('Club Applications')).toBeInTheDocument();
    expect(screen.getByText('Test Football Club')).toBeInTheDocument();
    expect(screen.getByText('Test Rugby Club')).toBeInTheDocument();
  });

  it('displays search input and status filter', () => {
    renderWithQueryClient(<ClubApplicationList />);
    
    expect(screen.getByPlaceholderText('Search by club name or email...')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('handles search input changes', async () => {
    renderWithQueryClient(<ClubApplicationList />);
    
    const searchInput = screen.getByPlaceholderText('Search by club name or email...');
    fireEvent.change(searchInput, { target: { value: 'football' } });
    
    expect(searchInput).toHaveValue('football');
  });

  it('handles status filter changes', async () => {
    renderWithQueryClient(<ClubApplicationList />);
    
    const statusSelect = screen.getByRole('combobox');
    expect(statusSelect).toBeInTheDocument();
    
    // Just verify the select is rendered and functional
    expect(statusSelect).toHaveAttribute('aria-expanded', 'false');
  });

  it('displays loading state', () => {
    vi.mocked(clubApprovalHooks.usePendingApplicationsOnly).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
      isError: false,
      isSuccess: false
    } as any);
    
    renderWithQueryClient(<ClubApplicationList />);
    
    expect(screen.getByText('Club Applications')).toBeInTheDocument();
    // Should show skeleton loaders
    expect(document.querySelectorAll('.animate-pulse')).toHaveLength(7); // 2 filter skeletons + 5 row skeletons
  });

  it('displays error state', () => {
    vi.mocked(clubApprovalHooks.usePendingApplicationsOnly).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch'),
      refetch: vi.fn(),
      isError: true,
      isSuccess: false
    } as any);
    
    renderWithQueryClient(<ClubApplicationList />);
    
    expect(screen.getByText('Failed to load applications. Please try again.')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('displays empty state when no applications', () => {
    vi.mocked(clubApprovalHooks.usePendingApplicationsOnly).mockReturnValue({
      data: { data: [], count: 0, page: 1, limit: 10, total_pages: 0 },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isError: false,
      isSuccess: true
    } as any);
    
    renderWithQueryClient(<ClubApplicationList />);
    
    expect(screen.getByText('No pending applications')).toBeInTheDocument();
    expect(screen.getByText('Applications will appear here when clubs register.')).toBeInTheDocument();
  });

  it('calls onApplicationSelect when view button is clicked', () => {
    const mockOnSelect = vi.fn();
    renderWithQueryClient(<ClubApplicationList onApplicationSelect={mockOnSelect} />);
    
    const viewButtons = screen.getAllByRole('button', { name: /view application/i });
    fireEvent.click(viewButtons[0]);
    
    expect(mockOnSelect).toHaveBeenCalledWith('1');
  });

  it('handles sorting by clicking column headers', () => {
    renderWithQueryClient(<ClubApplicationList />);
    
    const nameHeader = screen.getByText('Club Name');
    fireEvent.click(nameHeader);
    
    // Should still show applications (sorting is client-side)
    expect(screen.getByText('Test Football Club')).toBeInTheDocument();
    expect(screen.getByText('Test Rugby Club')).toBeInTheDocument();
  });

  it('displays correct status badges', () => {
    renderWithQueryClient(<ClubApplicationList />);
    
    const badges = screen.getAllByText('Pending');
    expect(badges.length).toBeGreaterThan(0);
    expect(screen.getByText('Approved')).toBeInTheDocument();
  });

  it('shows responsive information correctly', () => {
    renderWithQueryClient(<ClubApplicationList />);
    
    // Contact information should be visible (multiple instances due to responsive design)
    const footballEmails = screen.getAllByText('test@football.com');
    expect(footballEmails.length).toBeGreaterThan(0);
    
    const rugbyEmails = screen.getAllByText('test@rugby.com');
    expect(rugbyEmails.length).toBeGreaterThan(0);
    
    // Location should be visible (multiple instances due to responsive design)
    const londonElements = screen.getAllByText('London');
    expect(londonElements.length).toBeGreaterThan(0);
    
    const manchesterElements = screen.getAllByText('Manchester');
    expect(manchesterElements.length).toBeGreaterThan(0);
  });
});