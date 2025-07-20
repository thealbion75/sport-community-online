/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import App from '@/App';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() => Promise.resolve({ 
        data: { user: { id: 'club-user-1', email: 'club@example.com' } },
        error: null 
      })),
      getSession: vi.fn(() => Promise.resolve({ 
        data: { session: { user: { id: 'club-user-1', email: 'club@example.com' } } },
        error: null 
      })),
      onAuthStateChange: vi.fn(() => ({ 
        data: { subscription: { unsubscribe: vi.fn() } } 
      })),
      signInWithPassword: vi.fn(() => Promise.resolve({ 
        data: { user: { id: 'club-user-1', email: 'club@example.com' } },
        error: null 
      })),
      signUp: vi.fn(() => Promise.resolve({ 
        data: { user: { id: 'club-user-1', email: 'club@example.com' } },
        error: null 
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: { code: 'PGRST116' } })),
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ 
              data: { id: 'new-club-1', name: 'Test FC' }, 
              error: null 
            })),
          })),
        })),
        upsert: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
  },
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const renderApp = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
};

describe('Club Registration to Opportunity Creation Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should complete full club workflow: registration -> profile setup -> opportunity creation', async () => {
    const user = userEvent.setup();
    renderApp();

    // Step 1: Navigate to registration
    await waitFor(() => {
      expect(screen.getByText('Register Club')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Register Club'));

    // Step 2: Fill out registration form
    await waitFor(() => {
      expect(screen.getByText('Register')).toBeInTheDocument();
    });

    // Fill registration form
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    
    await user.type(emailInput, 'club@example.com');
    await user.type(passwordInput, 'password123');

    // Submit registration
    const registerButton = screen.getByRole('button', { name: /register/i });
    fireEvent.click(registerButton);

    // Step 3: After registration, should redirect to profile setup
    await waitFor(() => {
      expect(screen.getByText('Club Dashboard')).toBeInTheDocument();
    }, { timeout: 5000 });

    // Step 4: Fill out club profile
    const clubNameInput = screen.getByLabelText(/club name/i);
    await user.type(clubNameInput, 'Test Football Club');

    // Select sport category
    const categorySelect = screen.getByRole('combobox');
    fireEvent.click(categorySelect);
    
    await waitFor(() => {
      const footballOption = screen.getByText('Football');
      fireEvent.click(footballOption);
    });

    // Fill description
    const descriptionTextarea = screen.getByLabelText(/description/i);
    await user.type(descriptionTextarea, 'A local football club for all ages and skill levels.');

    // Fill contact email
    const contactEmailInput = screen.getByLabelText(/contact email/i);
    await user.type(contactEmailInput, 'contact@testfc.com');

    // Save profile
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(saveButton);

    // Step 5: Navigate to volunteer positions tab
    await waitFor(() => {
      const volunteerTab = screen.getByText('Volunteer Positions');
      fireEvent.click(volunteerTab);
    });

    // Step 6: Create a volunteer opportunity
    await waitFor(() => {
      const createOpportunityButton = screen.getByText(/create.*opportunity/i);
      fireEvent.click(createOpportunityButton);
    });

    // Fill opportunity form
    const titleInput = screen.getByLabelText(/title/i);
    await user.type(titleInput, 'Youth Coach Assistant');

    const opportunityDescription = screen.getByLabelText(/description/i);
    await user.type(opportunityDescription, 'Help coach our youth teams on weekends.');

    // Select required skills
    const skillsInput = screen.getByLabelText(/skills/i);
    await user.type(skillsInput, 'Coaching, First Aid');

    // Set time commitment
    const timeCommitmentInput = screen.getByLabelText(/time commitment/i);
    await user.type(timeCommitmentInput, '4 hours per week');

    // Save opportunity
    const createButton = screen.getByRole('button', { name: /create.*opportunity/i });
    fireEvent.click(createButton);

    // Step 7: Verify opportunity was created
    await waitFor(() => {
      expect(screen.getByText('Youth Coach Assistant')).toBeInTheDocument();
    });

    // Verify the complete workflow
    expect(screen.getByText('Test Football Club')).toBeInTheDocument();
    expect(screen.getByText('Youth Coach Assistant')).toBeInTheDocument();
    expect(screen.getByText(/help coach our youth teams/i)).toBeInTheDocument();
  });

  it('should handle errors gracefully during workflow', async () => {
    const user = userEvent.setup();
    
    // Mock error response
    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.from).mockReturnValue({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ 
            data: null, 
            error: { message: 'Database error' } 
          })),
        })),
      })),
    } as jest.Mocked<typeof supabase>;

    renderApp();

    // Navigate to registration
    await waitFor(() => {
      expect(screen.getByText('Register Club')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Register Club'));

    // Fill and submit form
    await waitFor(() => {
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      
      user.type(emailInput, 'club@example.com');
      user.type(passwordInput, 'password123');
    });

    const registerButton = screen.getByRole('button', { name: /register/i });
    fireEvent.click(registerButton);

    // Should handle error gracefully
    await waitFor(() => {
      // Error should be handled without crashing the app
      expect(screen.getByText('Register')).toBeInTheDocument();
    });
  });

  it('should validate form inputs during workflow', async () => {
    const user = userEvent.setup();
    renderApp();

    // Navigate to registration
    await waitFor(() => {
      expect(screen.getByText('Register Club')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Register Club'));

    // Try to submit empty form
    await waitFor(() => {
      const registerButton = screen.getByRole('button', { name: /register/i });
      fireEvent.click(registerButton);
    });

    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText(/email.*required/i) || screen.getByText(/invalid.*email/i)).toBeInTheDocument();
    });
  });
});