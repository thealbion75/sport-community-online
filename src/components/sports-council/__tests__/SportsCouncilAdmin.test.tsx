/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { SportsCouncilAdmin } from '../SportsCouncilAdmin';
import type { SportsCouncilMeeting, SportsCouncilStats } from '@/types';

// Mock the hooks
vi.mock('@/hooks/use-sports-council', () => ({
  useAllMeetings: vi.fn(),
  useCreateMeeting: vi.fn(),
  useUpdateMeeting: vi.fn(),
  useDeleteMeeting: vi.fn(),
  useSportsCouncilStats: vi.fn(),
}));

const mockMeetings: SportsCouncilMeeting[] = [
  {
    id: '1',
    title: 'Monthly Sports Council Meeting - January 2025',
    meeting_date: '2025-01-15',
    meeting_time: '19:00:00',
    location: 'Community Centre, Main Hall',
    agenda: 'Review of club applications, budget discussions',
    minutes: 'Meeting called to order at 7:00 PM.',
    status: 'completed',
    is_public: true,
    created_at: '2024-12-01T10:00:00Z',
    updated_at: '2025-01-15T20:00:00Z',
  },
];

const mockStats: SportsCouncilStats = {
  total_meetings: 5,
  upcoming_meetings: 2,
  completed_meetings: 3,
  meetings_this_year: 4,
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

describe('SportsCouncilAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the sports council admin interface', async () => {
    const { useAllMeetings, useSportsCouncilStats, useCreateMeeting, useUpdateMeeting, useDeleteMeeting } = await import('@/hooks/use-sports-council');
    
    vi.mocked(useAllMeetings).mockReturnValue({
      data: mockMeetings,
      isLoading: false,
    } as any);
    
    vi.mocked(useSportsCouncilStats).mockReturnValue({
      data: mockStats,
    } as any);

    vi.mocked(useCreateMeeting).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(useUpdateMeeting).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(useDeleteMeeting).mockReturnValue({
      mutateAsync: vi.fn(),
    } as any);

    renderWithProviders(<SportsCouncilAdmin />);

    expect(screen.getByText('Sports Council Administration')).toBeInTheDocument();
    expect(screen.getByText('Manage sports council meetings, agendas, and minutes.')).toBeInTheDocument();
  });

  it('displays statistics correctly', async () => {
    const { useAllMeetings, useSportsCouncilStats, useCreateMeeting, useUpdateMeeting, useDeleteMeeting } = await import('@/hooks/use-sports-council');
    
    vi.mocked(useAllMeetings).mockReturnValue({
      data: mockMeetings,
      isLoading: false,
    } as any);
    
    vi.mocked(useSportsCouncilStats).mockReturnValue({
      data: mockStats,
    } as any);

    vi.mocked(useCreateMeeting).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(useUpdateMeeting).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(useDeleteMeeting).mockReturnValue({
      mutateAsync: vi.fn(),
    } as any);

    renderWithProviders(<SportsCouncilAdmin />);

    // Click on Overview tab to see stats
    fireEvent.click(screen.getByText('Overview'));

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument(); // Total meetings
      expect(screen.getByText('2')).toBeInTheDocument(); // Upcoming meetings
      expect(screen.getByText('3')).toBeInTheDocument(); // Completed meetings
      expect(screen.getByText('4')).toBeInTheDocument(); // This year meetings
    });
  });

  it('shows create meeting button', async () => {
    const { useAllMeetings, useSportsCouncilStats, useCreateMeeting, useUpdateMeeting, useDeleteMeeting } = await import('@/hooks/use-sports-council');
    
    vi.mocked(useAllMeetings).mockReturnValue({
      data: mockMeetings,
      isLoading: false,
    } as any);
    
    vi.mocked(useSportsCouncilStats).mockReturnValue({
      data: mockStats,
    } as any);

    vi.mocked(useCreateMeeting).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(useUpdateMeeting).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(useDeleteMeeting).mockReturnValue({
      mutateAsync: vi.fn(),
    } as any);

    renderWithProviders(<SportsCouncilAdmin />);

    expect(screen.getByText('New Meeting')).toBeInTheDocument();
  });

  it('displays meetings in the meetings tab', async () => {
    const { useAllMeetings, useSportsCouncilStats, useCreateMeeting, useUpdateMeeting, useDeleteMeeting } = await import('@/hooks/use-sports-council');
    
    vi.mocked(useAllMeetings).mockReturnValue({
      data: mockMeetings,
      isLoading: false,
    } as any);
    
    vi.mocked(useSportsCouncilStats).mockReturnValue({
      data: mockStats,
    } as any);

    vi.mocked(useCreateMeeting).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(useUpdateMeeting).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(useDeleteMeeting).mockReturnValue({
      mutateAsync: vi.fn(),
    } as any);

    renderWithProviders(<SportsCouncilAdmin />);

    // Click on Meetings tab
    fireEvent.click(screen.getByText('Meetings'));

    await waitFor(() => {
      expect(screen.getByText('Monthly Sports Council Meeting - January 2025')).toBeInTheDocument();
      expect(screen.getByText('Community Centre, Main Hall')).toBeInTheDocument();
    });
  });

  it('shows loading state when data is being fetched', async () => {
    const { useAllMeetings, useSportsCouncilStats, useCreateMeeting, useUpdateMeeting, useDeleteMeeting } = await import('@/hooks/use-sports-council');
    
    vi.mocked(useAllMeetings).mockReturnValue({
      data: [],
      isLoading: true,
    } as any);
    
    vi.mocked(useSportsCouncilStats).mockReturnValue({
      data: undefined,
    } as any);

    vi.mocked(useCreateMeeting).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(useUpdateMeeting).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(useDeleteMeeting).mockReturnValue({
      mutateAsync: vi.fn(),
    } as any);

    renderWithProviders(<SportsCouncilAdmin />);

    expect(screen.getByText('Sports Council Administration')).toBeInTheDocument();
  });

  it('shows empty state when no meetings exist', async () => {
    const { useAllMeetings, useSportsCouncilStats, useCreateMeeting, useUpdateMeeting, useDeleteMeeting } = await import('@/hooks/use-sports-council');
    
    vi.mocked(useAllMeetings).mockReturnValue({
      data: [],
      isLoading: false,
    } as any);
    
    vi.mocked(useSportsCouncilStats).mockReturnValue({
      data: mockStats,
    } as any);

    vi.mocked(useCreateMeeting).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(useUpdateMeeting).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(useDeleteMeeting).mockReturnValue({
      mutateAsync: vi.fn(),
    } as any);

    renderWithProviders(<SportsCouncilAdmin />);

    // Click on Meetings tab
    fireEvent.click(screen.getByText('Meetings'));

    await waitFor(() => {
      expect(screen.getByText('No Meetings Yet')).toBeInTheDocument();
      expect(screen.getByText('Get started by creating your first sports council meeting.')).toBeInTheDocument();
    });
  });
});