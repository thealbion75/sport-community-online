/**
 * Unit tests for VolunteerRegistration component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { VolunteerRegistration } from '../VolunteerRegistration';

// Mock the hooks and context
vi.mock('@/hooks/useVolunteers', () => ({
  useCreateVolunteerProfile: () => ({
    mutateAsync: vi.fn().mockResolvedValue({ success: true }),
    isPending: false
  })
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuthContext: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' }
  })
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
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

describe('VolunteerRegistration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders registration form correctly', () => {
    renderWithQueryClient(<VolunteerRegistration />);
    
    expect(screen.getByText('Create Your Volunteer Profile')).toBeInTheDocument();
    expect(screen.getByLabelText(/First Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Last Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Location/)).toBeInTheDocument();
    expect(screen.getByText('Your Skills *')).toBeInTheDocument();
    expect(screen.getByText('Your Availability *')).toBeInTheDocument();
  });

  it('shows validation errors for required fields', async () => {
    renderWithQueryClient(<VolunteerRegistration />);
    
    const submitButton = screen.getByRole('button', { name: /Create Profile/ });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('First name must be at least 2 characters')).toBeInTheDocument();
      expect(screen.getByText('Last name must be at least 2 characters')).toBeInTheDocument();
      expect(screen.getByText('Location is required')).toBeInTheDocument();
    });
  });

  it('allows selecting skills and availability', () => {
    renderWithQueryClient(<VolunteerRegistration />);
    
    const communicationSkill = screen.getByLabelText('Communication');
    const weekendAvailability = screen.getByLabelText('Weekend Mornings');
    
    fireEvent.click(communicationSkill);
    fireEvent.click(weekendAvailability);
    
    expect(communicationSkill).toBeChecked();
    expect(weekendAvailability).toBeChecked();
  });

  it('pre-fills email from user context', () => {
    renderWithQueryClient(<VolunteerRegistration />);
    
    const emailInput = screen.getByLabelText(/Email Address/);
    expect(emailInput).toHaveValue('test@example.com');
    expect(emailInput).toBeDisabled();
  });

  it('toggles profile visibility switch', () => {
    renderWithQueryClient(<VolunteerRegistration />);
    
    const visibilitySwitch = screen.getByRole('switch');
    expect(visibilitySwitch).toBeChecked(); // Default is true
    
    fireEvent.click(visibilitySwitch);
    expect(visibilitySwitch).not.toBeChecked();
  });

  it('submits form with valid data', async () => {
    const mockOnSuccess = vi.fn();
    renderWithQueryClient(<VolunteerRegistration onSuccess={mockOnSuccess} />);
    
    // Fill in required fields
    fireEvent.change(screen.getByLabelText(/First Name/), {
      target: { value: 'John' }
    });
    fireEvent.change(screen.getByLabelText(/Last Name/), {
      target: { value: 'Doe' }
    });
    fireEvent.change(screen.getByLabelText(/Location/), {
      target: { value: 'East Grinstead' }
    });
    
    // Select skills and availability
    fireEvent.click(screen.getByLabelText('Communication'));
    fireEvent.click(screen.getByLabelText('Weekend Mornings'));
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /Create Profile/ });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('clears form when Clear Form button is clicked', () => {
    renderWithQueryClient(<VolunteerRegistration />);
    
    // Fill in a field
    const firstNameInput = screen.getByLabelText(/First Name/);
    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    expect(firstNameInput).toHaveValue('John');
    
    // Click clear button
    const clearButton = screen.getByRole('button', { name: /Clear Form/ });
    fireEvent.click(clearButton);
    
    // Check field is cleared
    expect(firstNameInput).toHaveValue('');
  });
});