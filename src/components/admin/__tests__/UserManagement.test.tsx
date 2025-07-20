/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { UserManagement } from '../UserManagement';
import type { VolunteerProfile, Club } from '@/types';
import { useSearchVolunteers } from '@/hooks/use-volunteers';
import { useVerifiedClubs } from '@/hooks/use-clubs';

// Mock the hooks
vi.mock('@/hooks/use-volunteers', () => ({
  useSearchVolunteers: vi.fn(),
}));

vi.mock('@/hooks/use-clubs', () => ({
  useVerifiedClubs: vi.fn(),
}));

const mockVolunteers: VolunteerProfile[] = [
  {
    id: '1',
    user_id: 'user-1',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    location: 'London',
    bio: 'Experienced volunteer',
    skills: ['Coaching', 'First Aid'],
    availability: ['Weekends'],
    is_visible: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

const mockClubs: Club[] = [
  {
    id: '1',
    name: 'Test FC',
    location: 'London',
    contact_email: 'admin@testfc.com',
    sport_types: ['Football'],
    verified: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('UserManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the user management interface', async () => {
    vi.mocked(useSearchVolunteers).mockReturnValue({
      data: { data: mockVolunteers, count: 1, page: 1, limit: 10, total_pages: 1 },
      isLoading: false,
    } as ReturnType<typeof useSearchVolunteers>);

    vi.mocked(useVerifiedClubs).mockReturnValue({
      data: mockClubs,
      isLoading: false,
    } as ReturnType<typeof useVerifiedClubs>);

    renderWithProviders(<UserManagement />);

    expect(screen.getByText('User Management')).toBeInTheDocument();
    expect(screen.getByText('Manage user accounts and profiles')).toBeInTheDocument();
  });

  it('displays user statistics correctly', async () => {
    vi.mocked(useSearchVolunteers).mockReturnValue({
      data: { data: mockVolunteers, count: 1, page: 1, limit: 10, total_pages: 1 },
      isLoading: false,
    } as ReturnType<typeof useSearchVolunteers>);

    vi.mocked(useVerifiedClubs).mockReturnValue({
      data: mockClubs,
      isLoading: false,
    } as ReturnType<typeof useVerifiedClubs>);

    renderWithProviders(<UserManagement />);

    await waitFor(() => {
      expect(screen.getByText('Total Users')).toBeInTheDocument();
      expect(screen.getByText('Volunteers')).toBeInTheDocument();
      expect(screen.getByText('Club Admins')).toBeInTheDocument();
    });
  });

  it('allows searching for users', async () => {
    vi.mocked(useSearchVolunteers).mockReturnValue({
      data: { data: mockVolunteers, count: 1, page: 1, limit: 10, total_pages: 1 },
      isLoading: false,
    } as ReturnType<typeof useSearchVolunteers>);

    vi.mocked(useVerifiedClubs).mockReturnValue({
      data: mockClubs,
      isLoading: false,
    } as ReturnType<typeof useVerifiedClubs>);

    renderWithProviders(<UserManagement />);

    const searchInput = screen.getByPlaceholderText('Search users by name, email, or club...');
    fireEvent.change(searchInput, { target: { value: 'John' } });

    expect(searchInput).toHaveValue('John');
  });

  it('displays user information correctly', async () => {
    vi.mocked(useSearchVolunteers).mockReturnValue({
      data: { data: mockVolunteers, count: 1, page: 1, limit: 10, total_pages: 1 },
      isLoading: false,
    } as ReturnType<typeof useSearchVolunteers>);

    vi.mocked(useVerifiedClubs).mockReturnValue({
      data: mockClubs,
      isLoading: false,
    } as ReturnType<typeof useVerifiedClubs>);

    renderWithProviders(<UserManagement />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('London')).toBeInTheDocument();
    });
  });

  it('allows filtering users by type', async () => {
    vi.mocked(useSearchVolunteers).mockReturnValue({
      data: { data: mockVolunteers, count: 1, page: 1, limit: 10, total_pages: 1 },
      isLoading: false,
    } as ReturnType<typeof useSearchVolunteers>);

    vi.mocked(useVerifiedClubs).mockReturnValue({
      data: mockClubs,
      isLoading: false,
    } as ReturnType<typeof useVerifiedClubs>);

    renderWithProviders(<UserManagement />);

    // Check that filter tabs are present
    expect(screen.getByText(/All Users/)).toBeInTheDocument();
    expect(screen.getByText(/Volunteers/)).toBeInTheDocument();
    expect(screen.getByText(/Clubs/)).toBeInTheDocument();
    expect(screen.getByText(/Suspended/)).toBeInTheDocument();

    // Click on Volunteers tab
    fireEvent.click(screen.getByText(/Volunteers/));
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  it('shows empty state when no users are found', async () => {
    vi.mocked(useSearchVolunteers).mockReturnValue({
      data: { data: [], count: 0, page: 1, limit: 10, total_pages: 0 },
      isLoading: false,
    } as ReturnType<typeof useSearchVolunteers>);

    vi.mocked(useVerifiedClubs).mockReturnValue({
      data: [],
      isLoading: false,
    } as ReturnType<typeof useVerifiedClubs>);

    renderWithProviders(<UserManagement />);

    await waitFor(() => {
      expect(screen.getByText('No users found')).toBeInTheDocument();
    });
  });

  it('allows viewing user details', async () => {
    vi.mocked(useSearchVolunteers).mockReturnValue({
      data: { data: mockVolunteers, count: 1, page: 1, limit: 10, total_pages: 1 },
      isLoading: false,
    } as ReturnType<typeof useSearchVolunteers>);

    vi.mocked(useVerifiedClubs).mockReturnValue({
      data: mockClubs,
      isLoading: false,
    } as ReturnType<typeof useVerifiedClubs>);

    renderWithProviders(<UserManagement />);

    await waitFor(() => {
      const viewButton = screen.getByText('View Details');
      fireEvent.click(viewButton);
    });

    await waitFor(() => {
      expect(screen.getByText('User Details')).toBeInTheDocument();
    });
  });
});
