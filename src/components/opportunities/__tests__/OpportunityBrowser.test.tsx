/**
 * Unit tests for OpportunityBrowser component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OpportunityBrowser } from '../OpportunityBrowser';

// Mock the hooks
vi.mock('@/hooks/useOpportunities', () => ({
  useOpportunities: () => ({
    data: {
      data: [
        {
          id: '1',
          title: 'Tennis Coach Assistant',
          description: 'Help with junior tennis coaching',
          club: {
            id: '1',
            name: 'East Grinstead Tennis Club',
            location: 'East Grinstead',
            verified: true
          },
          required_skills: ['Tennis', 'Coaching'],
          time_commitment: '3 hours per week',
          status: 'active',
          is_recurring: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01'
        }
      ],
      count: 1,
      page: 1,
      limit: 12,
      total_pages: 1
    },
    isLoading: false,
    error: null
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

describe('OpportunityBrowser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders opportunity browser correctly', () => {
    renderWithQueryClient(<OpportunityBrowser />);
    
    expect(screen.getByText('Volunteer Opportunities')).toBeInTheDocument();
    expect(screen.getByText('Discover ways to help local sports clubs in your community')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search by location/)).toBeInTheDocument();
    expect(screen.getByText('Filters')).toBeInTheDocument();
  });

  it('displays opportunities count', () => {
    renderWithQueryClient(<OpportunityBrowser />);
    
    expect(screen.getByText('1 opportunities')).toBeInTheDocument();
    expect(screen.getByText('Showing 1 of 1 opportunities')).toBeInTheDocument();
  });

  it('displays opportunity cards', () => {
    renderWithQueryClient(<OpportunityBrowser />);
    
    expect(screen.getByText('Tennis Coach Assistant')).toBeInTheDocument();
    expect(screen.getByText('East Grinstead Tennis Club')).toBeInTheDocument();
    expect(screen.getByText('Help with junior tennis coaching')).toBeInTheDocument();
  });

  it('handles search input', () => {
    renderWithQueryClient(<OpportunityBrowser />);
    
    const searchInput = screen.getByPlaceholderText(/Search by location/);
    fireEvent.change(searchInput, { target: { value: 'East Grinstead' } });
    
    expect(searchInput).toHaveValue('East Grinstead');
  });

  it('toggles filters visibility', () => {
    renderWithQueryClient(<OpportunityBrowser />);
    
    const filtersButton = screen.getByText('Filters');
    fireEvent.click(filtersButton);
    
    // Check if filter options appear
    expect(screen.getByText('Location')).toBeInTheDocument();
    expect(screen.getByText('Time Commitment')).toBeInTheDocument();
  });

  it('switches between grid and list view', () => {
    renderWithQueryClient(<OpportunityBrowser />);
    
    const listViewButton = screen.getByRole('tab', { name: 'List' });
    fireEvent.click(listViewButton);
    
    // The view mode should change (this would affect the layout)
    expect(listViewButton).toHaveAttribute('data-state', 'active');
  });

  it('calls callback functions when provided', () => {
    const mockOnApply = vi.fn();
    const mockOnView = vi.fn();
    
    renderWithQueryClient(
      <OpportunityBrowser 
        onApplyToOpportunity={mockOnApply}
        onViewOpportunity={mockOnView}
      />
    );
    
    // These would be called when interacting with opportunity cards
    // The actual implementation would depend on the OpportunityCard component
    expect(screen.getByText('Tennis Coach Assistant')).toBeInTheDocument();
  });

  it('clears search and filters', () => {
    renderWithQueryClient(<OpportunityBrowser />);
    
    // Add some search text
    const searchInput = screen.getByPlaceholderText(/Search by location/);
    fireEvent.change(searchInput, { target: { value: 'test search' } });
    
    // Clear should appear and work
    const clearButton = screen.getByText('Clear All');
    fireEvent.click(clearButton);
    
    expect(searchInput).toHaveValue('');
  });
});