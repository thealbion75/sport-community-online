/**
 * Club Components Tests
 * Tests for club registration and management components
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClubRegistration } from '../ClubRegistration';
import { OpportunityForm } from '../OpportunityForm';
import { OpportunityCard } from '../OpportunityCard';
import { ApplicationManager } from '../ApplicationManager';
import { VolunteerOpportunity, VolunteerApplication } from '@/types';

// Mock hooks
vi.mock('@/hooks/use-clubs', () => ({
  useCreateClub: () => ({
    mutateAsync: vi.fn().mockResolvedValue({ success: true }),
    isPending: false,
  }),
}));

vi.mock('@/hooks/use-opportunities', () => ({
  useCreateOpportunity: () => ({
    mutateAsync: vi.fn().mockResolvedValue({ success: true }),
    isPending: false,
  }),
  useUpdateOpportunity: () => ({
    mutateAsync: vi.fn().mockResolvedValue({ success: true }),
    isPending: false,
  }),
  useOpportunity: () => ({
    data: null,
  }),
  useUpdateOpportunityStatus: () => ({
    mutateAsync: vi.fn().mockResolvedValue({ success: true }),
    isPending: false,
  }),
  useDeleteOpportunity: () => ({
    mutateAsync: vi.fn().mockResolvedValue({ success: true }),
    isPending: false,
  }),
}));

vi.mock('@/hooks/use-applications', () => ({
  useApplicationsByOpportunity: () => ({
    data: [],
  }),
  useAcceptApplication: () => ({
    mutateAsync: vi.fn().mockResolvedValue({ success: true }),
    isPending: false,
  }),
  useRejectApplication: () => ({
    mutateAsync: vi.fn().mockResolvedValue({ success: true }),
    isPending: false,
  }),
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

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

describe('ClubRegistration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders registration form correctly', () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <ClubRegistration />
      </Wrapper>
    );

    expect(screen.getByText('Register Your Sports Club')).toBeInTheDocument();
    expect(screen.getByLabelText(/Club Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Location/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Contact Email/)).toBeInTheDocument();
    expect(screen.getByText('Sport Types')).toBeInTheDocument();
  });

  it('shows validation errors for required fields', async () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <ClubRegistration />
      </Wrapper>
    );

    const submitButton = screen.getByRole('button', { name: /Register Club/ });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Name must be at least 2 characters/)).toBeInTheDocument();
    });
  });

  it('allows selecting sport types', () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <ClubRegistration />
      </Wrapper>
    );

    const footballCheckbox = screen.getByLabelText('Football');
    fireEvent.click(footballCheckbox);

    expect(footballCheckbox).toBeChecked();
  });

  it('calls onSuccess when registration succeeds', async () => {
    const onSuccess = vi.fn();
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <ClubRegistration onSuccess={onSuccess} />
      </Wrapper>
    );

    // Fill required fields
    fireEvent.change(screen.getByLabelText(/Club Name/), {
      target: { value: 'Test Club' },
    });
    fireEvent.change(screen.getByLabelText(/Location/), {
      target: { value: 'Test Location' },
    });
    fireEvent.change(screen.getByLabelText(/Contact Email/), {
      target: { value: 'test@example.com' },
    });

    // Select a sport type
    fireEvent.click(screen.getByLabelText('Football'));

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /Register Club/ }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});

describe('OpportunityForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders opportunity form correctly', () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <OpportunityForm clubId="club-1" />
      </Wrapper>
    );

    expect(screen.getByLabelText(/Opportunity Title/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Time Commitment/)).toBeInTheDocument();
    expect(screen.getByText('Required Skills')).toBeInTheDocument();
  });

  it('shows create button when not editing', () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <OpportunityForm clubId="club-1" />
      </Wrapper>
    );

    expect(screen.getByRole('button', { name: /Create Opportunity/ })).toBeInTheDocument();
  });

  it('shows update button when editing', () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <OpportunityForm clubId="club-1" opportunityId="opp-1" />
      </Wrapper>
    );

    expect(screen.getByRole('button', { name: /Update Opportunity/ })).toBeInTheDocument();
  });

  it('allows selecting required skills', () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <OpportunityForm clubId="club-1" />
      </Wrapper>
    );

    const communicationCheckbox = screen.getByLabelText('Communication');
    fireEvent.click(communicationCheckbox);

    expect(communicationCheckbox).toBeChecked();
  });
});

describe('OpportunityCard', () => {
  const mockOpportunity: VolunteerOpportunity = {
    id: 'opp-1',
    club_id: 'club-1',
    title: 'Test Opportunity',
    description: 'Test description for the opportunity',
    required_skills: ['Communication', 'Leadership'],
    time_commitment: '2 hours/week',
    location: 'Test Location',
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    is_recurring: false,
    status: 'active',
    club: {
      id: 'club-1',
      name: 'Test Club',
      location: 'Test Location',
      contact_email: 'test@club.com',
      sport_types: ['Football'],
      verified: true,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    },
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders opportunity information correctly', () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <OpportunityCard opportunity={mockOpportunity} />
      </Wrapper>
    );

    expect(screen.getByText('Test Opportunity')).toBeInTheDocument();
    expect(screen.getByText('Test description for the opportunity')).toBeInTheDocument();
    expect(screen.getByText('2 hours/week')).toBeInTheDocument();
    expect(screen.getByText('Test Location')).toBeInTheDocument();
    expect(screen.getByText('Test Club')).toBeInTheDocument();
  });

  it('shows required skills as badges', () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <OpportunityCard opportunity={mockOpportunity} />
      </Wrapper>
    );

    expect(screen.getByText('Communication')).toBeInTheDocument();
    expect(screen.getByText('Leadership')).toBeInTheDocument();
  });

  it('shows apply button for volunteers', () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <OpportunityCard opportunity={mockOpportunity} onApply={vi.fn()} />
      </Wrapper>
    );

    expect(screen.getByRole('button', { name: /Apply Now/ })).toBeInTheDocument();
  });

  it('shows management options for owners', () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <OpportunityCard opportunity={mockOpportunity} isOwner={true} />
      </Wrapper>
    );

    // Should show the more options button
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('calls onApply when apply button is clicked', () => {
    const onApply = vi.fn();
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <OpportunityCard opportunity={mockOpportunity} onApply={onApply} />
      </Wrapper>
    );

    fireEvent.click(screen.getByRole('button', { name: /Apply Now/ }));
    expect(onApply).toHaveBeenCalled();
  });
});

describe('ApplicationManager', () => {
  const mockApplications: VolunteerApplication[] = [
    {
      id: 'app-1',
      opportunity_id: 'opp-1',
      volunteer_id: 'vol-1',
      message: 'I would like to volunteer',
      status: 'pending',
      applied_at: '2024-01-01',
      updated_at: '2024-01-01',
      opportunity: {
        id: 'opp-1',
        club_id: 'club-1',
        title: 'Test Opportunity',
        description: 'Test description',
        required_skills: ['Communication'],
        time_commitment: '2 hours/week',
        is_recurring: false,
        status: 'active',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      },
      volunteer: {
        id: 'vol-1',
        user_id: 'user-1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        location: 'Test Location',
        skills: ['Communication', 'Leadership'],
        availability: ['Weekends'],
        is_visible: true,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders application statistics', () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <ApplicationManager applications={mockApplications} clubId="club-1" />
      </Wrapper>
    );

    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Accepted')).toBeInTheDocument();
    expect(screen.getByText('Rejected')).toBeInTheDocument();
  });

  it('shows empty state when no applications', () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <ApplicationManager applications={[]} clubId="club-1" />
      </Wrapper>
    );

    expect(screen.getByText('No Applications Yet')).toBeInTheDocument();
  });

  it('renders application cards correctly', () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <ApplicationManager applications={mockApplications} clubId="club-1" />
      </Wrapper>
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Applied for: Test Opportunity')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('I would like to volunteer')).toBeInTheDocument();
  });

  it('shows accept and reject buttons for pending applications', () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <ApplicationManager applications={mockApplications} clubId="club-1" />
      </Wrapper>
    );

    expect(screen.getByRole('button', { name: /Accept/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reject/ })).toBeInTheDocument();
  });
});