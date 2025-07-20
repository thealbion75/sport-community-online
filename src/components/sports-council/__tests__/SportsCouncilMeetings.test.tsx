/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { SportsCouncilMeetings } from '../SportsCouncilMeetings';
import type { SportsCouncilMeeting } from '@/types';
import { usePublicMeetings } from '@/hooks/use-sports-council';

// Mock the hooks
vi.mock('@/hooks/use-sports-council', () => ({
  usePublicMeetings: vi.fn(),
}));

const mockMeetings: SportsCouncilMeeting[] = [
  {
    id: '1',
    title: 'Monthly Sports Council Meeting - January 2025',
    meeting_date: '2025-01-15',
    meeting_time: '19:00:00',
    location: 'Community Centre, Main Hall',
    agenda: 'Review of club applications, budget discussions',
    minutes: 'Meeting called to order at 7:00 PM. Present: John Smith (Chair).',
    status: 'completed',
    is_public: true,
    created_at: '2024-12-01T10:00:00Z',
    updated_at: '2025-01-15T20:00:00Z',
  },
  {
    id: '2',
    title: 'Sports Council Meeting - February 2025',
    meeting_date: '2025-02-15',
    meeting_time: '19:00:00',
    location: 'Community Centre, Main Hall',
    agenda: 'Equipment grants review, volunteer recognition program',
    minutes: null,
    status: 'upcoming',
    is_public: true,
    created_at: '2025-01-01T10:00:00Z',
    updated_at: '2025-01-01T10:00:00Z',
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

describe('SportsCouncilMeetings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the sports council meetings page', async () => {
    vi.mocked(usePublicMeetings).mockReturnValue({
      data: mockMeetings,
      isLoading: false,
      error: null,
    } as ReturnType<typeof usePublicMeetings>);

    renderWithProviders(<SportsCouncilMeetings />);

    expect(screen.getByText('Sports Council Meetings')).toBeInTheDocument();
    expect(screen.getByText('Stay informed about sports council activities')).toBeInTheDocument();
  });

  it('displays upcoming and past meetings in separate tabs', async () => {
    vi.mocked(usePublicMeetings).mockReturnValue({
      data: mockMeetings,
      isLoading: false,
      error: null,
    } as ReturnType<typeof usePublicMeetings>);

    renderWithProviders(<SportsCouncilMeetings />);

    await waitFor(() => {
      expect(screen.getByText('Upcoming Meetings')).toBeInTheDocument();
      expect(screen.getByText('Past Meetings & Minutes')).toBeInTheDocument();
    });
  });

  it('shows loading state when data is being fetched', async () => {
    vi.mocked(usePublicMeetings).mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
    } as unknown as ReturnType<typeof usePublicMeetings>);

    renderWithProviders(<SportsCouncilMeetings />);

    // The loading state should be handled by LoadingContainer
    expect(screen.getByText('Sports Council Meetings')).toBeInTheDocument();
  });

  it('displays error message when data fetching fails', async () => {
    vi.mocked(usePublicMeetings).mockReturnValue({
      data: [],
      isLoading: false,
      error: new Error('Failed to fetch meetings'),
    } as ReturnType<typeof usePublicMeetings>);

    renderWithProviders(<SportsCouncilMeetings />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load meetings. Please try again later.')).toBeInTheDocument();
    });
  });

  it('displays meeting information correctly', async () => {
    vi.mocked(usePublicMeetings).mockReturnValue({
      data: mockMeetings,
      isLoading: false,
      error: null,
    } as ReturnType<typeof usePublicMeetings>);

    renderWithProviders(<SportsCouncilMeetings />);

    await waitFor(() => {
      expect(screen.getByText('Monthly Sports Council Meeting - January 2025')).toBeInTheDocument();
      expect(screen.getByText('Sports Council Meeting - February 2025')).toBeInTheDocument();
      expect(screen.getByText('Community Centre, Main Hall')).toBeInTheDocument();
    });
  });

  it('shows empty state when no meetings are available', async () => {
    vi.mocked(usePublicMeetings).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as ReturnType<typeof usePublicMeetings>);

    renderWithProviders(<SportsCouncilMeetings />);

    await waitFor(() => {
      expect(screen.getByText('No Upcoming Meetings')).toBeInTheDocument();
    });
  });
});
