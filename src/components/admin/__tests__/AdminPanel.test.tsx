/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { AdminPanel } from '../AdminPanel';
import type { PlatformStats } from '@/types';

// Mock the hooks
vi.mock('@/hooks/use-clubs', () => ({
  useVerifiedClubs: vi.fn(),
  useUnverifiedClubs: vi.fn(),
}));

vi.mock('@/hooks/use-admin', () => ({
  usePlatformStats: vi.fn(),
}));

const mockStats: PlatformStats = {
  total_clubs: 25,
  verified_clubs: 20,
  total_volunteers: 150,
  total_opportunities: 45,
  total_applications: 89,
  active_users: 120,
};

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

describe('AdminPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the admin panel with platform statistics', async () => {
    const { useVerifiedClubs, useUnverifiedClubs } = await import('@/hooks/use-clubs');
    const { usePlatformStats } = await import('@/hooks/use-admin');

    vi.mocked(useVerifiedClubs).mockReturnValue({
      data: [],
      isLoading: false,
    } as any);

    vi.mocked(useUnverifiedClubs).mockReturnValue({
      data: [],
      isLoading: false,
    } as any);

    vi.mocked(usePlatformStats).mockReturnValue({
      data: mockStats,
      isLoading: false,
    } as any);

    renderWithProviders(<AdminPanel />);

    expect(screen.getByText('Platform Administration')).toBeInTheDocument();
    expect(screen.getByText('Manage and moderate the EGSport volunteer platform')).toBeInTheDocument();
  });

  it('displays platform statistics correctly', async () => {
    const { useVerifiedClubs, useUnverifiedClubs } = await import('@/hooks/use-clubs');
    const { usePlatformStats } = await import('@/hooks/use-admin');

    vi.mocked(useVerifiedClubs).mockReturnValue({
      data: [],
      isLoading: false,
    } as any);

    vi.mocked(useUnverifiedClubs).mockReturnValue({
      data: [],
      isLoading: false,
    } as any);

    vi.mocked(usePlatformStats).mockReturnValue({
      data: mockStats,
      isLoading: false,
    } as any);

    renderWithProviders(<AdminPanel />);

    await waitFor(() => {
      expect(screen.getByText('25')).toBeInTheDocument(); // Total clubs
      expect(screen.getByText('150')).toBeInTheDocument(); // Total volunteers
      expect(screen.getByText('45')).toBeInTheDocument(); // Total opportunities
    });
  });

  it('shows pending verification alert when clubs need verification', async () => {
    const { useVerifiedClubs, useUnverifiedClubs } = await import('@/hooks/use-clubs');
    const { usePlatformStats } = await import('@/hooks/use-admin');

    vi.mocked(useVerifiedClubs).mockReturnValue({
      data: [],
      isLoading: false,
    } as any);

    vi.mocked(useUnverifiedClubs).mockReturnValue({
      data: [{ id: '1', name: 'Test Club' }],
      isLoading: false,
    } as any);

    vi.mocked(usePlatformStats).mockReturnValue({
      data: mockStats,
      isLoading: false,
    } as any);

    renderWithProviders(<AdminPanel />);

    await waitFor(() => {
      expect(screen.getByText('Action Required')).toBeInTheDocument();
      expect(screen.getByText(/1 club pending verification/)).toBeInTheDocument();
    });
  });

  it('allows navigation between admin tabs', async () => {
    const { useVerifiedClubs, useUnverifiedClubs } = await import('@/hooks/use-clubs');
    const { usePlatformStats } = await import('@/hooks/use-admin');

    vi.mocked(useVerifiedClubs).mockReturnValue({
      data: [],
      isLoading: false,
    } as any);

    vi.mocked(useUnverifiedClubs).mockReturnValue({
      data: [],
      isLoading: false,
    } as any);

    vi.mocked(usePlatformStats).mockReturnValue({
      data: mockStats,
      isLoading: false,
    } as any);

    renderWithProviders(<AdminPanel />);

    // Check that tabs are present
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Clubs')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('Moderation')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();

    // Click on Users tab
    fireEvent.click(screen.getByText('Users'));
    
    await waitFor(() => {
      expect(screen.getByText('User Management')).toBeInTheDocument();
    });
  });

  it('displays quick actions for common admin tasks', async () => {
    const { useVerifiedClubs, useUnverifiedClubs } = await import('@/hooks/use-clubs');
    const { usePlatformStats } = await import('@/hooks/use-admin');

    vi.mocked(useVerifiedClubs).mockReturnValue({
      data: [],
      isLoading: false,
    } as any);

    vi.mocked(useUnverifiedClubs).mockReturnValue({
      data: [],
      isLoading: false,
    } as any);

    vi.mocked(usePlatformStats).mockReturnValue({
      data: mockStats,
      isLoading: false,
    } as any);

    renderWithProviders(<AdminPanel />);

    await waitFor(() => {
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      expect(screen.getByText('Review Club Verifications')).toBeInTheDocument();
      expect(screen.getByText('Manage Users')).toBeInTheDocument();
      expect(screen.getByText('Content Moderation')).toBeInTheDocument();
      expect(screen.getByText('View Analytics')).toBeInTheDocument();
    });
  });

  it('handles missing platform stats gracefully', async () => {
    const { useVerifiedClubs, useUnverifiedClubs } = await import('@/hooks/use-clubs');
    const { usePlatformStats } = await import('@/hooks/use-admin');

    vi.mocked(useVerifiedClubs).mockReturnValue({
      data: [],
      isLoading: false,
    } as any);

    vi.mocked(useUnverifiedClubs).mockReturnValue({
      data: [],
      isLoading: false,
    } as any);

    vi.mocked(usePlatformStats).mockReturnValue({
      data: undefined,
      isLoading: false,
    } as any);

    renderWithProviders(<AdminPanel />);

    // Should still render with default values
    expect(screen.getByText('Platform Administration')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('0')).toBeInTheDocument(); // Default stats
    });
  });
});