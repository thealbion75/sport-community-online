/**
 * ApplicationHistoryTimeline Component Tests
 * Unit tests for the application history timeline component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { ApplicationHistoryTimeline } from '@/components/admin/ApplicationHistoryTimeline';

// Mock the hooks
vi.mock('@/hooks/use-admin-audit-reporting', () => ({
  useApplicationTimeline: vi.fn(),
}));

import { useApplicationTimeline } from '@/hooks/use-admin-audit-reporting';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

const mockTimelineData = [
  {
    id: 'log-1',
    admin_id: 'admin-1',
    admin_email: 'admin1@example.com',
    admin_name: 'Admin One',
    action_type: 'approve' as const,
    target_type: 'club_application' as const,
    target_id: 'club-1',
    target_name: 'Test Club',
    details: 'Application approved after review',
    ip_address: '192.168.1.1',
    created_at: '2024-01-15T10:00:00Z'
  },
  {
    id: 'log-2',
    admin_id: 'admin-2',
    admin_email: 'admin2@example.com',
    admin_name: 'Admin Two',
    action_type: 'view' as const,
    target_type: 'club_application' as const,
    target_id: 'club-1',
    target_name: 'Test Club',
    details: 'Application viewed for review',
    ip_address: '192.168.1.2',
    created_at: '2024-01-14T15:30:00Z'
  }
];

describe('ApplicationHistoryTimeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state', () => {
    vi.mocked(useApplicationTimeline).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);

    render(
      <ApplicationHistoryTimeline clubId="club-1" />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Application Timeline')).toBeInTheDocument();
    // Check for loading skeletons - should have at least 3 skeleton items
    const skeletons = screen.container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should render error state', () => {
    vi.mocked(useApplicationTimeline).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load timeline'),
    } as any);

    render(
      <ApplicationHistoryTimeline clubId="club-1" />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Application Timeline')).toBeInTheDocument();
    expect(screen.getByText('Unable to load application timeline')).toBeInTheDocument();
    expect(screen.getByText('Please try refreshing the page')).toBeInTheDocument();
  });

  it('should render empty state when no timeline data', () => {
    vi.mocked(useApplicationTimeline).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    render(
      <ApplicationHistoryTimeline clubId="club-1" />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Application Timeline')).toBeInTheDocument();
    expect(screen.getByText('No timeline data available')).toBeInTheDocument();
    expect(screen.getByText('Actions will appear here as they occur')).toBeInTheDocument();
  });

  it('should render timeline entries correctly', () => {
    vi.mocked(useApplicationTimeline).mockReturnValue({
      data: mockTimelineData,
      isLoading: false,
      error: null,
    } as any);

    render(
      <ApplicationHistoryTimeline clubId="club-1" />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Application Timeline')).toBeInTheDocument();
    
    // Check for approval entry
    expect(screen.getByText('Approved')).toBeInTheDocument();
    expect(screen.getByText('Admin One')).toBeInTheDocument();
    expect(screen.getByText('Application approved after review')).toBeInTheDocument();
    expect(screen.getByText(/IP: 192\.168\.1\.1/)).toBeInTheDocument();
    
    // Check for view entry
    expect(screen.getByText('Viewed')).toBeInTheDocument();
    expect(screen.getByText('Admin Two')).toBeInTheDocument();
    expect(screen.getByText('Application viewed for review')).toBeInTheDocument();
    expect(screen.getByText(/IP: 192\.168\.1\.2/)).toBeInTheDocument();
    
    // Check entry count
    expect(screen.getByText('Showing 2 timeline entries')).toBeInTheDocument();
  });

  it('should display correct action icons and colors', () => {
    vi.mocked(useApplicationTimeline).mockReturnValue({
      data: [
        {
          ...mockTimelineData[0],
          action_type: 'approve'
        },
        {
          ...mockTimelineData[1],
          action_type: 'reject'
        }
      ],
      isLoading: false,
      error: null,
    } as any);

    render(
      <ApplicationHistoryTimeline clubId="club-1" />,
      { wrapper: createWrapper() }
    );

    // Check for approve badge (should be green)
    const approveBadge = screen.getByText('Approved');
    expect(approveBadge).toBeInTheDocument();
    expect(approveBadge.closest('.bg-green-100')).toBeInTheDocument();
    
    // Check for reject badge (should be red)
    const rejectBadge = screen.getByText('Rejected');
    expect(rejectBadge).toBeInTheDocument();
    expect(rejectBadge.closest('.bg-red-100')).toBeInTheDocument();
  });

  it('should handle missing admin name gracefully', () => {
    const timelineWithoutName = [
      {
        ...mockTimelineData[0],
        admin_name: undefined
      }
    ];

    vi.mocked(useApplicationTimeline).mockReturnValue({
      data: timelineWithoutName,
      isLoading: false,
      error: null,
    } as any);

    render(
      <ApplicationHistoryTimeline clubId="club-1" />,
      { wrapper: createWrapper() }
    );

    // Should fall back to email
    expect(screen.getByText('admin1@example.com')).toBeInTheDocument();
  });

  it('should handle missing details gracefully', () => {
    const timelineWithoutDetails = [
      {
        ...mockTimelineData[0],
        details: undefined
      }
    ];

    vi.mocked(useApplicationTimeline).mockReturnValue({
      data: timelineWithoutDetails,
      isLoading: false,
      error: null,
    } as any);

    render(
      <ApplicationHistoryTimeline clubId="club-1" />,
      { wrapper: createWrapper() }
    );

    // Should not show details section
    expect(screen.queryByText('Application approved after review')).not.toBeInTheDocument();
    // But should still show other information
    expect(screen.getByText('Admin One')).toBeInTheDocument();
  });

  it('should handle missing IP address gracefully', () => {
    const timelineWithoutIP = [
      {
        ...mockTimelineData[0],
        ip_address: undefined
      }
    ];

    vi.mocked(useApplicationTimeline).mockReturnValue({
      data: timelineWithoutIP,
      isLoading: false,
      error: null,
    } as any);

    render(
      <ApplicationHistoryTimeline clubId="club-1" />,
      { wrapper: createWrapper() }
    );

    // Should not show IP address
    expect(screen.queryByText(/IP:/)).not.toBeInTheDocument();
    // But should still show other information
    expect(screen.getByText('Admin One')).toBeInTheDocument();
  });

  it('should format dates correctly', () => {
    vi.mocked(useApplicationTimeline).mockReturnValue({
      data: mockTimelineData,
      isLoading: false,
      error: null,
    } as any);

    render(
      <ApplicationHistoryTimeline clubId="club-1" />,
      { wrapper: createWrapper() }
    );

    // Should show relative time (there are multiple, so use getAllByText)
    const relativeTimeElements = screen.getAllByText(/ago$/);
    expect(relativeTimeElements.length).toBeGreaterThan(0);
    
    // Should show full formatted date
    expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    vi.mocked(useApplicationTimeline).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    const { container } = render(
      <ApplicationHistoryTimeline clubId="club-1" className="custom-class" />,
      { wrapper: createWrapper() }
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should call useApplicationTimeline with correct clubId', () => {
    vi.mocked(useApplicationTimeline).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    render(
      <ApplicationHistoryTimeline clubId="test-club-123" />,
      { wrapper: createWrapper() }
    );

    expect(useApplicationTimeline).toHaveBeenCalledWith('test-club-123');
  });

  it('should handle bulk operations correctly', () => {
    const bulkTimelineData = [
      {
        ...mockTimelineData[0],
        action_type: 'bulk_approve' as const,
        details: 'Bulk approved 5 applications'
      }
    ];

    vi.mocked(useApplicationTimeline).mockReturnValue({
      data: bulkTimelineData,
      isLoading: false,
      error: null,
    } as any);

    render(
      <ApplicationHistoryTimeline clubId="club-1" />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Bulk Approved')).toBeInTheDocument();
    expect(screen.getByText('Bulk approved 5 applications')).toBeInTheDocument();
  });
});