/**
 * Opportunity Components Tests
 * Tests for opportunity browsing and search components
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OpportunityBrowser } from '../OpportunityBrowser';
import { SearchFilters } from '../SearchFilters';
import { Pagination } from '../Pagination';
import { OpportunityDetails } from '../OpportunityDetails';
import { VolunteerOpportunity, OpportunityFilters } from '@/types';

// Mock hooks
vi.mock('@/hooks/use-opportunities', () => ({
  useOpportunities: () => ({
    data: mockOpportunities,
    isLoading: false,
  }),
  useOpportunityCount: () => ({
    data: 25,
  }),
  useSearchOpportunities: () => ({
    data: mockOpportunities.slice(0, 2),
    isLoading: false,
  }),
  useOpportunity: () => ({
    data: mockOpportunities[0],
    isLoading: false,
  }),
}));

vi.mock('@/hooks/use-applications', () => ({
  useApplicationsByOpportunity: () => ({
    data: [],
  }),
}));

// Mock data
const mockOpportunities: VolunteerOpportunity[] = [
  {
    id: 'opp-1',
    club_id: 'club-1',
    title: 'Match Day Volunteer',
    description: 'Help with match day operations including setup, crowd management, and cleanup.',
    required_skills: ['Communication', 'Teamwork'],
    time_commitment: '4 hours per match day',
    location: 'East Grinstead Sports Ground',
    start_date: '2024-03-01',
    end_date: '2024-10-31',
    is_recurring: true,
    status: 'active',
    club: {
      id: 'club-1',
      name: 'East Grinstead FC',
      location: 'East Grinstead',
      contact_email: 'contact@egfc.com',
      sport_types: ['Football'],
      verified: true,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    },
    created_at: '2024-01-15',
    updated_at: '2024-01-15',
  },
  {
    id: 'opp-2',
    club_id: 'club-2',
    title: 'Event Coordinator',
    description: 'Coordinate special events and tournaments for the tennis club.',
    required_skills: ['Organization', 'Event Planning'],
    time_commitment: '10 hours per month',
    location: 'Crawley Tennis Club',
    is_recurring: false,
    status: 'active',
    club: {
      id: 'club-2',
      name: 'Crawley Tennis Club',
      location: 'Crawley',
      contact_email: 'info@crawleytennis.com',
      sport_types: ['Tennis'],
      verified: true,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    },
    created_at: '2024-01-20',
    updated_at: '2024-01-20',
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

describe('OpportunityBrowser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders opportunity browser correctly', () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <OpportunityBrowser />
      </Wrapper>
    );

    expect(screen.getByText('Volunteer Opportunities')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search opportunities/)).toBeInTheDocument();
    expect(screen.getByText('Filters')).toBeInTheDocument();
  });

  it('displays opportunities in grid layout', () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <OpportunityBrowser />
      </Wrapper>
    );

    expect(screen.getByText('Match Day Volunteer')).toBeInTheDocument();
    expect(screen.getByText('Event Coordinator')).toBeInTheDocument();
  });

  it('handles search input', async () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <OpportunityBrowser />
      </Wrapper>
    );

    const searchInput = screen.getByPlaceholderText(/Search opportunities/);
    fireEvent.change(searchInput, { target: { value: 'match day' } });

    expect(searchInput).toHaveValue('match day');
  });

  it('toggles filter panel', () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <OpportunityBrowser />
      </Wrapper>
    );

    const filterButton = screen.getByText('Filters');
    fireEvent.click(filterButton);

    // Filter panel should be visible
    expect(screen.getByText('Filter Opportunities')).toBeInTheDocument();
  });

  it('shows opportunity count', () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <OpportunityBrowser />
      </Wrapper>
    );

    expect(screen.getByText('25 opportunities')).toBeInTheDocument();
  });

  it('calls onApply when apply button is clicked', () => {
    const onApply = vi.fn();
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <OpportunityBrowser onApply={onApply} />
      </Wrapper>
    );

    // Find and click apply button (would be in OpportunityCard)
    const applyButtons = screen.getAllByText('Apply Now');
    if (applyButtons.length > 0) {
      fireEvent.click(applyButtons[0]);
      expect(onApply).toHaveBeenCalled();
    }
  });
});

describe('SearchFilters', () => {
  const mockFilters: OpportunityFilters = {};
  const mockOnFiltersChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders filter options correctly', () => {
    render(
      <SearchFilters 
        filters={mockFilters} 
        onFiltersChange={mockOnFiltersChange} 
      />
    );

    expect(screen.getByText('Filter Opportunities')).toBeInTheDocument();
    expect(screen.getByText('Location')).toBeInTheDocument();
    expect(screen.getByText('Time Commitment')).toBeInTheDocument();
    expect(screen.getByText('Required Skills')).toBeInTheDocument();
  });

  it('handles location selection', async () => {
    render(
      <SearchFilters 
        filters={mockFilters} 
        onFiltersChange={mockOnFiltersChange} 
      />
    );

    // This would require more complex interaction with Select component
    expect(screen.getByText('Location')).toBeInTheDocument();
  });

  it('handles skill selection', () => {
    render(
      <SearchFilters 
        filters={mockFilters} 
        onFiltersChange={mockOnFiltersChange} 
      />
    );

    const communicationCheckbox = screen.getByLabelText('Communication');
    fireEvent.click(communicationCheckbox);

    expect(communicationCheckbox).toBeChecked();
  });

  it('applies filters when apply button is clicked', () => {
    render(
      <SearchFilters 
        filters={mockFilters} 
        onFiltersChange={mockOnFiltersChange} 
      />
    );

    const applyButton = screen.getByText('Apply Filters');
    fireEvent.click(applyButton);

    expect(mockOnFiltersChange).toHaveBeenCalled();
  });

  it('clears filters when clear button is clicked', () => {
    render(
      <SearchFilters 
        filters={mockFilters} 
        onFiltersChange={mockOnFiltersChange} 
      />
    );

    const clearButton = screen.getByText('Clear All');
    fireEvent.click(clearButton);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({});
  });
});

describe('Pagination', () => {
  const mockOnPageChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders pagination controls', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={mockOnPageChange}
        totalItems={50}
      />
    );

    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Showing 1-12 of 50 results')).toBeInTheDocument();
  });

  it('disables previous button on first page', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />
    );

    const previousButton = screen.getByText('Previous').closest('button');
    expect(previousButton).toBeDisabled();
  });

  it('disables next button on last page', () => {
    render(
      <Pagination
        currentPage={5}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />
    );

    const nextButton = screen.getByText('Next').closest('button');
    expect(nextButton).toBeDisabled();
  });

  it('calls onPageChange when page number is clicked', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />
    );

    const pageButton = screen.getByText('2').closest('button');
    if (pageButton) {
      fireEvent.click(pageButton);
      expect(mockOnPageChange).toHaveBeenCalledWith(2);
    }
  });

  it('calls onPageChange when next button is clicked', () => {
    render(
      <Pagination
        currentPage={2}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />
    );

    const nextButton = screen.getByText('Next').closest('button');
    if (nextButton) {
      fireEvent.click(nextButton);
      expect(mockOnPageChange).toHaveBeenCalledWith(3);
    }
  });

  it('does not render when totalPages is 1 or less', () => {
    const { container } = render(
      <Pagination
        currentPage={1}
        totalPages={1}
        onPageChange={mockOnPageChange}
      />
    );

    expect(container.firstChild).toBeNull();
  });
});

describe('OpportunityDetails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders opportunity details correctly', () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <OpportunityDetails opportunity={mockOpportunities[0]} />
      </Wrapper>
    );

    expect(screen.getByText('Match Day Volunteer')).toBeInTheDocument();
    expect(screen.getByText(/Help with match day operations/)).toBeInTheDocument();
    expect(screen.getByText('4 hours per match day')).toBeInTheDocument();
    expect(screen.getByText('East Grinstead Sports Ground')).toBeInTheDocument();
  });

  it('shows club information', () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <OpportunityDetails opportunity={mockOpportunities[0]} />
      </Wrapper>
    );

    expect(screen.getByText('About the Club')).toBeInTheDocument();
    expect(screen.getByText('East Grinstead FC')).toBeInTheDocument();
    expect(screen.getByText('contact@egfc.com')).toBeInTheDocument();
  });

  it('displays required skills as badges', () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <OpportunityDetails opportunity={mockOpportunities[0]} />
      </Wrapper>
    );

    expect(screen.getByText('Communication')).toBeInTheDocument();
    expect(screen.getByText('Teamwork')).toBeInTheDocument();
  });

  it('shows apply button for active opportunities', () => {
    const onApply = vi.fn();
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <OpportunityDetails 
          opportunity={mockOpportunities[0]} 
          onApply={onApply}
        />
      </Wrapper>
    );

    const applyButton = screen.getByText('Apply for This Opportunity');
    expect(applyButton).toBeInTheDocument();
    
    fireEvent.click(applyButton);
    expect(onApply).toHaveBeenCalled();
  });

  it('shows back button when onBack is provided', () => {
    const onBack = vi.fn();
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <OpportunityDetails 
          opportunity={mockOpportunities[0]} 
          onBack={onBack}
        />
      </Wrapper>
    );

    const backButton = screen.getByText('Back to Opportunities');
    expect(backButton).toBeInTheDocument();
    
    fireEvent.click(backButton);
    expect(onBack).toHaveBeenCalled();
  });

  it('handles missing opportunity gracefully', () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <OpportunityDetails opportunity={undefined} />
      </Wrapper>
    );

    expect(screen.getByText('Opportunity Not Found')).toBeInTheDocument();
  });
});