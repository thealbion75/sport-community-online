/**
 * Unit tests for ClubRegistration component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClubRegistration } from '../ClubRegistration';

// Mock the hooks
vi.mock('@/hooks/useClubs', () => ({
  useRegisterClub: () => ({
    mutateAsync: vi.fn().mockResolvedValue({ success: true }),
    isPending: false
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

describe('ClubRegistration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders registration form correctly', () => {
    renderWithQueryClient(<ClubRegistration />);
    
    expect(screen.getByText('Register Your Sports Club')).toBeInTheDocument();
    expect(screen.getByLabelText(/Club Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Location/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Contact Email/)).toBeInTheDocument();
    expect(screen.getByText('Sport Types *')).toBeInTheDocument();
  });

  it('shows validation errors for required fields', async () => {
    renderWithQueryClient(<ClubRegistration />);
    
    const submitButton = screen.getByRole('button', { name: /Register Club/ });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Club name must be at least 2 characters')).toBeInTheDocument();
      expect(screen.getByText('Location is required')).toBeInTheDocument();
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  it('allows selecting sport types', () => {
    renderWithQueryClient(<ClubRegistration />);
    
    const tennisCheckbox = screen.getByLabelText('Tennis');
    const footballCheckbox = screen.getByLabelText('Football');
    
    fireEvent.click(tennisCheckbox);
    fireEvent.click(footballCheckbox);
    
    expect(tennisCheckbox).toBeChecked();
    expect(footballCheckbox).toBeChecked();
  });

  it('submits form with valid data', async () => {
    const mockOnSuccess = vi.fn();
    renderWithQueryClient(<ClubRegistration onSuccess={mockOnSuccess} />);
    
    // Fill in required fields
    fireEvent.change(screen.getByLabelText(/Club Name/), {
      target: { value: 'Test Tennis Club' }
    });
    fireEvent.change(screen.getByLabelText(/Location/), {
      target: { value: 'Test Location' }
    });
    fireEvent.change(screen.getByLabelText(/Contact Email/), {
      target: { value: 'test@example.com' }
    });
    
    // Select a sport
    fireEvent.click(screen.getByLabelText('Tennis'));
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /Register Club/ });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('clears form when Clear Form button is clicked', () => {
    renderWithQueryClient(<ClubRegistration />);
    
    // Fill in a field
    const nameInput = screen.getByLabelText(/Club Name/);
    fireEvent.change(nameInput, { target: { value: 'Test Club' } });
    expect(nameInput).toHaveValue('Test Club');
    
    // Click clear button
    const clearButton = screen.getByRole('button', { name: /Clear Form/ });
    fireEvent.click(clearButton);
    
    // Check field is cleared
    expect(nameInput).toHaveValue('');
  });
});