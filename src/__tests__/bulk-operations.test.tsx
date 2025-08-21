/**
 * Bulk Operations Test
 * Tests the bulk approval functionality for club applications
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { ClubApplicationList } from '@/components/admin/ClubApplicationList';
import { Club } from '@/types';

// Mock the API functions
vi.mock('@/hooks/use-club-approval', () => ({
  usePendingApplicationsOnly: vi.fn(() => ({
    data: {
      data: mockPendingApplications,
      count: 3,
      page: 1,
      limit: 10,
      total_pages: 1
    },
    isLoading: false,
    error: null
  })),
  useBulkApproveApplications: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue({
      data: {
        successful: ['1', '2'],
        failed: [{ id: '3', error: 'Test error' }]
      }
    })
  }))
}));

const mockPendingApplications: Club[] = [
  {
    id: '1',
    name: 'Test Club 1',
    description: 'Test description 1',
    location: 'Test Location 1',
    contact_email: 'test1@example.com',
    contact_phone: '123-456-7890',
    logo_url: null,
    website_url: null,
    sport_types: ['football'],
    verified: false,
    application_status: 'pending',
    admin_notes: null,
    reviewed_by: null,
    reviewed_at: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Test Club 2',
    description: 'Test description 2',
    location: 'Test Location 2',
    contact_email: 'test2@example.com',
    contact_phone: '123-456-7891',
    logo_url: null,
    website_url: null,
    sport_types: ['basketball'],
    verified: false,
    application_status: 'pending',
    admin_notes: null,
    reviewed_by: null,
    reviewed_at: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: '3',
    name: 'Test Club 3',
    description: 'Test description 3',
    location: 'Test Location 3',
    contact_email: 'test3@example.com',
    contact_phone: '123-456-7892',
    logo_url: null,
    website_url: null,
    sport_types: ['tennis'],
    verified: false,
    application_status: 'pending',
    admin_notes: null,
    reviewed_by: null,
    reviewed_at: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  }
];

describe('Bulk Operations', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
  });

  const renderWithQueryClient = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  it('should display bulk selection checkboxes for pending applications', async () => {
    renderWithQueryClient(
      <ClubApplicationList />
    );

    await waitFor(() => {
      // Should show the select all checkbox
      expect(screen.getByLabelText('Select all pending applications')).toBeInTheDocument();
      
      // Should show individual selection checkboxes
      expect(screen.getByLabelText('Select Test Club 1')).toBeInTheDocument();
      expect(screen.getByLabelText('Select Test Club 2')).toBeInTheDocument();
      expect(screen.getByLabelText('Select Test Club 3')).toBeInTheDocument();
    });
  });

  it('should show bulk approve button when applications are selected', async () => {
    renderWithQueryClient(
      <ClubApplicationList />
    );

    await waitFor(() => {
      // Select first application
      const checkbox1 = screen.getByLabelText('Select Test Club 1');
      fireEvent.click(checkbox1);
    });

    await waitFor(() => {
      // Should show bulk actions bar
      expect(screen.getByText('1 application selected')).toBeInTheDocument();
      expect(screen.getByText('Bulk Approve')).toBeInTheDocument();
    });
  });

  it('should select all pending applications when select all is clicked', async () => {
    renderWithQueryClient(
      <ClubApplicationList />
    );

    await waitFor(() => {
      // Click select all checkbox
      const selectAllCheckbox = screen.getByLabelText('Select all pending applications');
      fireEvent.click(selectAllCheckbox);
    });

    await waitFor(() => {
      // Should show all applications selected
      expect(screen.getByText('3 applications selected')).toBeInTheDocument();
    });
  });

  it('should open confirmation dialog when bulk approve is clicked', async () => {
    renderWithQueryClient(
      <ClubApplicationList />
    );

    await waitFor(() => {
      // Select first application
      const checkbox1 = screen.getByLabelText('Select Test Club 1');
      fireEvent.click(checkbox1);
    });

    await waitFor(() => {
      // Click bulk approve button
      const bulkApproveButton = screen.getByText('Bulk Approve');
      fireEvent.click(bulkApproveButton);
    });

    await waitFor(() => {
      // Should show confirmation dialog
      expect(screen.getByText('Confirm Bulk Approval')).toBeInTheDocument();
      expect(screen.getByText(/You are about to approve 1 club application/)).toBeInTheDocument();
    });
  });

  it('should allow adding admin notes in bulk approval dialog', async () => {
    renderWithQueryClient(
      <ClubApplicationList />
    );

    await waitFor(() => {
      // Select first application
      const checkbox1 = screen.getByLabelText('Select Test Club 1');
      fireEvent.click(checkbox1);
    });

    await waitFor(() => {
      // Click bulk approve button
      const bulkApproveButton = screen.getByText('Bulk Approve');
      fireEvent.click(bulkApproveButton);
    });

    await waitFor(() => {
      // Add admin notes
      const notesTextarea = screen.getByPlaceholderText('Add notes for this bulk approval...');
      fireEvent.change(notesTextarea, { target: { value: 'Bulk approval test notes' } });
      
      expect(notesTextarea).toHaveValue('Bulk approval test notes');
    });
  });
});