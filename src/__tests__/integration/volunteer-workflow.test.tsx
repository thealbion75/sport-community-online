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
        data: { user: { id: 'volunteer-user-1', email: 'volunteer@example.com' } },
        error: null 
      })),
      getSession: vi.fn(() => Promise.resolve({ 
        data: { session: { user: { id: 'volunteer-user-1', email: 'volunteer@example.com' } } },
        error: null 
      })),
      onAuthStateChange: vi.fn(() => ({ 
        data: { subscription: { unsubscribe: vi.fn() } } 
      })),
      signInWithPassword: vi.fn(() => Promise.resolve({ 
        data: { user: { id: 'volunteer-user-1', email: 'volunteer@example.com' } },
        error: null 
      })),
      signUp: vi.fn(() => Promise.resolve({ 
        data: { user: { id: 'volunteer-user-1', email: 'volunteer@example.com' } },
        error: null 
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ 
            data: { 
              id: 'volunteer-1', 
              first_name: 'John', 
              last_name: 'Doe',
              email: 'volunteer@example.com',
              skills: ['Coaching'],
              availability: ['Weekends']
            }, 
            error: null 
          })),
          order: vi.fn(() => Promise.resolve({ 
            data: [
              {
                id: 'opp-1',
                title: 'Youth Coach',
                description: 'Help coach youth teams',
                club: { name: 'Test FC' }
              }
            ], 
            error: null 
          })),
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ 
              data: { id: 'application-1' }, 
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

describe('Volunteer Registration to Application Submission Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should complete full volunteer workflow: registration -> profile setup -> opportunity application', async () => {
    const user = userEvent.setup();
    renderApp();

    // Step 1: Navigate to volunteer opportunities
    await waitFor(() => {
      expect(screen.getByText('Volunteer')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Volunteer'));

    // Step 2: View available opportunities
    await waitFor(() => {
      expect(screen.getByText(/volunteer opportunities/i)).toBeInTheDocument();
    });

    // Should see opportunities (mocked)
    await waitFor(() => {
      expect(screen.getByText('Youth Coach')).toBeInTheDocument();
    });

    // Step 3: Click on an opportunity to view details
    fireEvent.click(screen.getByText('Youth Coach'));

    // Step 4: Apply for the opportunity
    await waitFor(() => {
      const applyButton = screen.getByText(/apply/i);
      fireEvent.click(applyButton);
    });

    // Step 5: Should prompt to create volunteer profile if not exists
    await waitFor(() => {
      // If no profile exists, should redirect to profile creation
      expect(
        screen.getByText(/create.*profile/i) || 
        screen.getByText(/complete.*profile/i) ||
        screen.getByText(/application/i)
      ).toBeInTheDocument();
    });

    // Step 6: Fill out volunteer profile (if needed)
    if (screen.queryByLabelText(/first name/i)) {
      const firstNameInput = screen.getByLabelText(/first name/i);
      await user.type(firstNameInput, 'John');

      const lastNameInput = screen.getByLabelText(/last name/i);
      await user.type(lastNameInput, 'Doe');

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'volunteer@example.com');

      const bioTextarea = screen.getByLabelText(/bio/i);
      await user.type(bioTextarea, 'Experienced volunteer with coaching background.');

      // Add skills
      const skillsInput = screen.getByLabelText(/skills/i);
      await user.type(skillsInput, 'Coaching, First Aid');

      // Set availability
      const availabilityInput = screen.getByLabelText(/availability/i);
      await user.type(availabilityInput, 'Weekends, Evenings');

      // Save profile
      const saveProfileButton = screen.getByRole('button', { name: /save.*profile/i });
      fireEvent.click(saveProfileButton);
    }

    // Step 7: Submit application
    await waitFor(() => {
      // Should now be able to submit application
      const applicationMessage = screen.queryByLabelText(/message/i) || screen.queryByLabelText(/cover letter/i);
      if (applicationMessage) {
        await user.type(applicationMessage, 'I am very interested in this coaching opportunity and have relevant experience.');
      }

      const submitButton = screen.getByRole('button', { name: /submit.*application/i });
      fireEvent.click(submitButton);
    });

    // Step 8: Verify application was submitted
    await waitFor(() => {
      expect(
        screen.getByText(/application.*submitted/i) ||
        screen.getByText(/thank you/i) ||
        screen.getByText(/applied/i)
      ).toBeInTheDocument();
    });
  });

  it('should handle volunteer dashboard navigation', async () => {
    const user = userEvent.setup();
    renderApp();

    // Navigate to volunteer dashboard
    await waitFor(() => {
      // Assuming user is logged in and has volunteer profile
      if (screen.queryByText(/dashboard/i)) {
        fireEvent.click(screen.getByText(/dashboard/i));
      }
    });

    // Should show volunteer dashboard with applications
    await waitFor(() => {
      expect(
        screen.getByText(/dashboard/i) ||
        screen.getByText(/applications/i) ||
        screen.getByText(/opportunities/i)
      ).toBeInTheDocument();
    });
  });

  it('should allow browsing and filtering opportunities', async () => {
    const user = userEvent.setup();
    renderApp();

    // Navigate to opportunities
    await waitFor(() => {
      fireEvent.click(screen.getByText('Volunteer'));
    });

    // Should show opportunities list
    await waitFor(() => {
      expect(screen.getByText(/opportunities/i)).toBeInTheDocument();
    });

    // Test filtering (if filter components exist)
    const searchInput = screen.queryByPlaceholderText(/search/i);
    if (searchInput) {
      await user.type(searchInput, 'coach');
      
      // Should filter results
      await waitFor(() => {
        expect(screen.getByText('Youth Coach')).toBeInTheDocument();
      });
    }
  });

  it('should handle application status tracking', async () => {
    const user = userEvent.setup();
    renderApp();

    // Mock existing application
    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ 
            data: [
              {
                id: 'app-1',
                status: 'pending',
                opportunity: {
                  title: 'Youth Coach',
                  club: { name: 'Test FC' }
                },
                applied_at: new Date().toISOString()
              }
            ], 
            error: null 
          })),
        })),
      })),
    } as jest.Mocked<typeof supabase>;

    // Navigate to applications (assuming user is logged in)
    await waitFor(() => {
      if (screen.queryByText(/applications/i)) {
        fireEvent.click(screen.getByText(/applications/i));
      }
    });

    // Should show application status
    await waitFor(() => {
      expect(
        screen.getByText(/pending/i) ||
        screen.getByText(/Youth Coach/i)
      ).toBeInTheDocument();
    });
  });

  it('should validate application form inputs', async () => {
    const user = userEvent.setup();
    renderApp();

    // Navigate to opportunities and try to apply
    await waitFor(() => {
      fireEvent.click(screen.getByText('Volunteer'));
    });

    await waitFor(() => {
      if (screen.queryByText('Youth Coach')) {
        fireEvent.click(screen.getByText('Youth Coach'));
      }
    });

    // Try to submit application without required fields
    await waitFor(() => {
      const applyButton = screen.queryByText(/apply/i);
      if (applyButton) {
        fireEvent.click(applyButton);
      }
    });

    // Should show validation errors if required fields are missing
    await waitFor(() => {
      expect(
        screen.queryByText(/required/i) ||
        screen.queryByText(/invalid/i) ||
        screen.queryByText(/complete.*profile/i)
      ).toBeTruthy();
    });
  });
});