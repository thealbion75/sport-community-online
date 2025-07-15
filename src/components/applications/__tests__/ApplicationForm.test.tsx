/**
 * Unit tests for ApplicationForm component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApplicationForm } from '../ApplicationForm';
import type { VolunteerOpportunity } from '@/types';

// Mock the hooks and context
vi.mock('@/hooks/useApplications', () => ({
  useCreateApplication: () => ({
    mutateAsync: vi.fn().mockResolvedValue({ success: true }),
    isPending: false
  }),
  useExistingApplication: () => ({
    data: null
  })
}));

vi.mock('@/hooks/useVolunteers', () => ({
  useVolunteerProfile: () => ({
    data: {
      id: 'volunteer-1',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      location: 'East Grinstead',
      skills: ['Communication', 'Leadership'],
      profile_image_url: null
    }
  })
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuthContext: () => ({
    user: { id: 'user-1', email: 'john@example.com' }
  })
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

const mockOpportunity: VolunteerOpportunity = {
  id: 'opp-1',
  club_id: 'club-1',
  title: 'Tennis Coach Assistant',
  description: 'Help with junior tennis coaching',
  required_skills: ['Tennis', 'Coaching'],
  time_commitment: '3 hours per week',
  location: 'Tennis Club',
  start_date: undefined,
  end_date: undefined,
  is_recurring: true,
  status: 'active',
  club: {
    id: 'club-1',
    name: 'East Grinstead Tennis Club',
    location: 'East Grinstead',
    contact_email: 'info@egtc.co.uk',
    sport_types: ['Tennis'],
    verified: true,
    logo_url: null,
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  },
  created_at: '2024-01-01',
  updated_at: '2024-01-01'
};

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

describe('ApplicationForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders application form correctly', () => {
    renderWithQueryClient(<ApplicationForm opportunity={mockOpportunity} />);
    
    expect(screen.getByText('Apply for Volunteer Opportunity')).toBeInTheDocument();
    expect(screen.getByText('Tennis Coach Assistant')).toBeInTheDocument();
    expect(screen.getByText('East Grinstead Tennis Club')).toBeInTheDocument();
    expect(screen.getByLabelText(/Application Message/)).toBeInTheDocument();
  });

  it('displays opportunity details', () => {
    renderWithQueryClient(<ApplicationForm opportunity={mockOpportunity} />);
    
    expect(screen.getByText('Tennis Coach Assistant')).toBeInTheDocument();
    expect(screen.getByText('East Grinstead Tennis Club')).toBeInTheDocument();
    expect(screen.getByText('3 hours per week')).toBeInTheDocument();
    expect(screen.getByText('Tennis Club')).toBeInTheDocument();
  });

  it('displays required skills', () => {
    renderWithQueryClient(<ApplicationForm opportunity={mockOpportunity} />);
    
    expect(screen.getByText('Tennis')).toBeInTheDocument();
    expect(screen.getByText('Coaching')).toBeInTheDocument();
  });

  it('displays volunteer profile summary', () => {
    renderWithQueryClient(<ApplicationForm opportunity={mockOpportunity} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('East Grinstead')).toBeInTheDocument();
    expect(screen.getByText('Communication')).toBeInTheDocument();
    expect(screen.getByText('Leadership')).toBeInTheDocument();
  });

  it('allows entering application message', () => {
    renderWithQueryClient(<ApplicationForm opportunity={mockOpportunity} />);
    
    const messageTextarea = screen.getByLabelText(/Application Message/);
    fireEvent.change(messageTextarea, {
      target: { value: 'I am very interested in this opportunity' }
    });
    
    expect(messageTextarea).toHaveValue('I am very interested in this opportunity');
  });

  it('submits application with message', async () => {
    const mockOnSuccess = vi.fn();
    renderWithQueryClient(
      <ApplicationForm opportunity={mockOpportunity} onSuccess={mockOnSuccess} />
    );
    
    // Enter message
    const messageTextarea = screen.getByLabelText(/Application Message/);
    fireEvent.change(messageTextarea, {
      target: { value: 'Test application message' }
    });
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /Submit Application/ });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('handles cancel action', () => {
    const mockOnCancel = vi.fn();
    renderWithQueryClient(
      <ApplicationForm opportunity={mockOpportunity} onCancel={mockOnCancel} />
    );
    
    const cancelButton = screen.getByRole('button', { name: /Cancel/ });
    fireEvent.click(cancelButton);
    
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('shows disclaimer text', () => {
    renderWithQueryClient(<ApplicationForm opportunity={mockOpportunity} />);
    
    expect(screen.getByText(/By submitting this application/)).toBeInTheDocument();
    expect(screen.getByText(/East Grinstead Tennis Club/)).toBeInTheDocument();
  });
});