/**
 * Error Handling Tests for Club Approval System
 * Tests comprehensive error handling and loading states
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ErrorDisplay, NetworkErrorBanner, RetryableOperation } from '../ErrorHandling';
import { ClubApprovalErrorBoundary } from '../ClubApprovalErrorBoundary';
import { LoadingSpinner, AsyncOperationWrapper } from '../LoadingStates';
import { OfflineIndicator, NetworkStatusBadge } from '../OfflineStateHandler';

// Mock hooks
vi.mock('@/hooks/use-error-handling', () => ({
  useNetworkStatus: () => ({ isOnline: true }),
  useRetry: () => ({
    retry: vi.fn().mockResolvedValue('success')
  })
}));

vi.mock('@/hooks/use-club-approval-error-handling', () => ({
  useClubApprovalErrorHandler: () => ({
    handleError: vi.fn()
  }),
  useNetworkAwareOperation: () => ({
    executeWhenOnline: vi.fn(),
    queuedOperationsCount: 0,
    clearQueue: vi.fn()
  })
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false }
  }
});

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('ErrorDisplay Component', () => {
  it('should display error information correctly', () => {
    const mockError = new Error('Test error message');
    const mockRetry = vi.fn();

    render(
      <TestWrapper>
        <ErrorDisplay
          error={mockError}
          onRetry={mockRetry}
          context="test operation"
          showDetails={true}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Application Error')).toBeInTheDocument();
    expect(screen.getByText(/Failed to test operation/)).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('should handle network errors specifically', () => {
    const networkError = new Error('fetch failed');
    networkError.name = 'NetworkError';

    render(
      <TestWrapper>
        <ErrorDisplay
          error={networkError}
          context="load data"
        />
      </TestWrapper>
    );

    expect(screen.getByText('Network Error')).toBeInTheDocument();
    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('should call retry function when retry button is clicked', () => {
    const mockError = new Error('Test error');
    const mockRetry = vi.fn();

    render(
      <TestWrapper>
        <ErrorDisplay
          error={mockError}
          onRetry={mockRetry}
        />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText('Try Again'));
    expect(mockRetry).toHaveBeenCalled();
  });

  it('should show recovery suggestions', () => {
    const mockError = new Error('500 server error');

    render(
      <TestWrapper>
        <ErrorDisplay
          error={mockError}
          context="save data"
        />
      </TestWrapper>
    );

    expect(screen.getByText('Suggested Actions:')).toBeInTheDocument();
    expect(screen.getByText(/server issue/)).toBeInTheDocument();
  });
});

describe('ClubApprovalErrorBoundary', () => {
  const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
    if (shouldThrow) {
      throw new Error('Test error boundary');
    }
    return <div>No error</div>;
  };

  it('should catch and display errors', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ClubApprovalErrorBoundary context="test component">
        <ThrowError shouldThrow={true} />
      </ClubApprovalErrorBoundary>
    );

    expect(screen.getByText('Club Approval System Error')).toBeInTheDocument();
    expect(screen.getByText(/error occurred in test component/)).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('should render children when no error occurs', () => {
    render(
      <ClubApprovalErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ClubApprovalErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('should show error ID for support', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ClubApprovalErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ClubApprovalErrorBoundary>
    );

    expect(screen.getByText(/Error ID:/)).toBeInTheDocument();

    consoleSpy.mockRestore();
  });
});

describe('LoadingSpinner Component', () => {
  it('should render with default props', () => {
    render(<LoadingSpinner />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
  });

  it('should render with text', () => {
    render(<LoadingSpinner text="Loading data..." />);
    
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('should apply size classes correctly', () => {
    const { rerender } = render(<LoadingSpinner size="sm" />);
    expect(document.querySelector('.h-4.w-4')).toBeInTheDocument();

    rerender(<LoadingSpinner size="lg" />);
    expect(document.querySelector('.h-8.w-8')).toBeInTheDocument();
  });
});

describe('AsyncOperationWrapper Component', () => {
  it('should show loading component when loading', () => {
    render(
      <AsyncOperationWrapper
        isLoading={true}
        loadingComponent={<div>Custom loading...</div>}
      >
        <div>Content</div>
      </AsyncOperationWrapper>
    );

    expect(screen.getByText('Custom loading...')).toBeInTheDocument();
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('should show error component when error occurs', () => {
    const mockError = new Error('Test error');

    render(
      <AsyncOperationWrapper
        isLoading={false}
        error={mockError}
        errorComponent={<div>Custom error display</div>}
      >
        <div>Content</div>
      </AsyncOperationWrapper>
    );

    expect(screen.getByText('Custom error display')).toBeInTheDocument();
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('should show children when no loading or error', () => {
    render(
      <AsyncOperationWrapper
        isLoading={false}
        error={null}
      >
        <div>Content loaded successfully</div>
      </AsyncOperationWrapper>
    );

    expect(screen.getByText('Content loaded successfully')).toBeInTheDocument();
  });

  it('should show default error UI when no custom error component provided', () => {
    const mockError = new Error('Test error');
    const mockRetry = vi.fn();

    render(
      <AsyncOperationWrapper
        isLoading={false}
        error={mockError}
        onRetry={mockRetry}
      >
        <div>Content</div>
      </AsyncOperationWrapper>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });
});

describe('RetryableOperation Component', () => {
  it('should execute operation and show children on success', async () => {
    const mockOperation = vi.fn().mockResolvedValue('success');
    const mockOnSuccess = vi.fn();

    render(
      <TestWrapper>
        <RetryableOperation
          operation={mockOperation}
          onSuccess={mockOnSuccess}
        >
          <div>Operation completed</div>
        </RetryableOperation>
      </TestWrapper>
    );

    expect(screen.getByText('Operation completed')).toBeInTheDocument();
  });

  it('should show error display on operation failure', async () => {
    const mockOperation = vi.fn().mockRejectedValue(new Error('Operation failed'));

    render(
      <TestWrapper>
        <RetryableOperation
          operation={mockOperation}
          maxAttempts={1}
        >
          <div>Operation completed</div>
        </RetryableOperation>
      </TestWrapper>
    );

    // Wait for the operation to fail
    await waitFor(() => {
      expect(screen.queryByText('Operation completed')).not.toBeInTheDocument();
    });
  });
});

describe('NetworkStatusBadge Component', () => {
  it('should show online status by default', () => {
    render(<NetworkStatusBadge showText={true} />);
    
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('should show icon only when showText is false', () => {
    render(<NetworkStatusBadge showText={false} />);
    
    expect(screen.queryByText('Online')).not.toBeInTheDocument();
    // Should still render the badge with icon
    expect(document.querySelector('[data-badge]')).toBeInTheDocument();
  });
});

describe('Error Recovery Suggestions', () => {
  it('should provide appropriate suggestions for different error types', () => {
    const testCases = [
      {
        error: new Error('401 unauthorized'),
        expectedSuggestion: 'Please log in again'
      },
      {
        error: new Error('403 forbidden'),
        expectedSuggestion: 'Contact an administrator for access'
      },
      {
        error: new Error('404 not found'),
        expectedSuggestion: 'The requested resource may have been moved'
      },
      {
        error: new Error('500 server error'),
        expectedSuggestion: 'This is a server issue'
      }
    ];

    testCases.forEach(({ error, expectedSuggestion }) => {
      const { unmount } = render(
        <TestWrapper>
          <ErrorDisplay error={error} />
        </TestWrapper>
      );

      expect(screen.getByText(new RegExp(expectedSuggestion, 'i'))).toBeInTheDocument();
      unmount();
    });
  });
});