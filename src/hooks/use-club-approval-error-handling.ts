/**
 * Club Approval Error Handling Hooks
 * Enhanced error handling specifically for club approval operations
 */

import { useCallback, useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from './use-toast';
import { useNetworkStatus, useRetry } from './use-error-handling';
import { clubApprovalKeys } from './use-club-approval';

interface ErrorState {
  error: Error | null;
  isRetrying: boolean;
  retryCount: number;
  canRetry: boolean;
}

interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  backoff?: boolean;
  onRetry?: (attempt: number, error: Error) => void;
  onMaxAttemptsReached?: (error: Error) => void;
}

/**
 * Enhanced error handling hook for club approval operations
 */
export function useClubApprovalErrorHandler() {
  const { toast } = useToast();
  const { isOnline } = useNetworkStatus();
  const queryClient = useQueryClient();

  const handleError = useCallback((
    error: unknown, 
    context: string = 'club approval operation',
    options: {
      showToast?: boolean;
      invalidateQueries?: boolean;
      customMessage?: string;
    } = {}
  ) => {
    const { showToast = true, invalidateQueries = false, customMessage } = options;
    
    console.error(`Club Approval Error in ${context}:`, error);

    const errorInfo = analyzeError(error, isOnline);
    
    if (showToast) {
      toast({
        title: errorInfo.title,
        description: customMessage || errorInfo.message,
        variant: 'destructive',
        action: errorInfo.canRetry ? {
          label: 'Retry',
          onClick: () => window.location.reload()
        } : undefined
      });
    }

    // Invalidate related queries if needed
    if (invalidateQueries) {
      queryClient.invalidateQueries({ queryKey: clubApprovalKeys.all });
    }

    return errorInfo;
  }, [toast, isOnline, queryClient]);

  return { handleError };
}

/**
 * Hook for retryable club approval operations
 */
export function useClubApprovalRetry() {
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isRetrying: false,
    retryCount: 0,
    canRetry: true
  });
  
  const { handleError } = useClubApprovalErrorHandler();
  const { retry } = useRetry();

  const executeWithRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    context: string,
    options: RetryOptions = {}
  ): Promise<T | null> => {
    const {
      maxAttempts = 3,
      delay = 1000,
      backoff = true,
      onRetry,
      onMaxAttemptsReached
    } = options;

    setErrorState(prev => ({ ...prev, isRetrying: true, error: null }));

    try {
      const result = await retry(operation, {
        maxAttempts,
        delay,
        backoff,
        onRetry: (attempt, error) => {
          setErrorState(prev => ({ 
            ...prev, 
            retryCount: attempt,
            error: error as Error
          }));
          onRetry?.(attempt, error);
        }
      });

      setErrorState({
        error: null,
        isRetrying: false,
        retryCount: 0,
        canRetry: true
      });

      return result;
    } catch (error) {
      const errorInfo = handleError(error, context, { showToast: false });
      
      setErrorState({
        error: error as Error,
        isRetrying: false,
        retryCount: maxAttempts,
        canRetry: errorInfo.canRetry
      });

      onMaxAttemptsReached?.(error as Error);
      return null;
    }
  }, [handleError, retry]);

  const resetError = useCallback(() => {
    setErrorState({
      error: null,
      isRetrying: false,
      retryCount: 0,
      canRetry: true
    });
  }, []);

  return {
    executeWithRetry,
    resetError,
    ...errorState
  };
}

/**
 * Hook for handling bulk operation errors
 */
export function useBulkOperationErrorHandler() {
  const { toast } = useToast();
  const [errors, setErrors] = useState<Array<{ id: string; error: string }>>([]);

  const handleBulkErrors = useCallback((
    results: { successful: string[]; failed: Array<{ id: string; error: string }> },
    operation: string
  ) => {
    const { successful, failed } = results;
    
    setErrors(failed);

    if (failed.length === 0) {
      toast({
        title: 'Success',
        description: `Successfully completed ${operation} for ${successful.length} item${successful.length !== 1 ? 's' : ''}.`,
        variant: 'default'
      });
    } else if (successful.length > 0) {
      toast({
        title: 'Partial Success',
        description: `${operation} completed for ${successful.length} items. ${failed.length} failed.`,
        variant: 'default'
      });
    } else {
      toast({
        title: 'Operation Failed',
        description: `${operation} failed for all ${failed.length} items.`,
        variant: 'destructive'
      });
    }
  }, [toast]);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  return {
    handleBulkErrors,
    clearErrors,
    errors,
    hasErrors: errors.length > 0
  };
}

/**
 * Hook for handling network-aware operations
 */
export function useNetworkAwareOperation() {
  const { isOnline } = useNetworkStatus();
  const { toast } = useToast();
  const [queuedOperations, setQueuedOperations] = useState<Array<() => Promise<any>>>([]);

  const executeWhenOnline = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName: string = 'operation'
  ): Promise<T | null> => {
    if (!isOnline) {
      toast({
        title: 'Offline',
        description: `Cannot perform ${operationName} while offline. It will be queued for when you're back online.`,
        variant: 'default'
      });
      
      setQueuedOperations(prev => [...prev, operation]);
      return null;
    }

    try {
      return await operation();
    } catch (error) {
      console.error(`Network-aware operation failed:`, error);
      throw error;
    }
  }, [isOnline, toast]);

  // Execute queued operations when coming back online
  useEffect(() => {
    if (isOnline && queuedOperations.length > 0) {
      toast({
        title: 'Back Online',
        description: `Executing ${queuedOperations.length} queued operation${queuedOperations.length !== 1 ? 's' : ''}...`,
        variant: 'default'
      });

      // Execute all queued operations
      Promise.allSettled(queuedOperations.map(op => op()))
        .then(results => {
          const successful = results.filter(r => r.status === 'fulfilled').length;
          const failed = results.filter(r => r.status === 'rejected').length;
          
          if (failed === 0) {
            toast({
              title: 'Success',
              description: `All ${successful} queued operations completed successfully.`,
              variant: 'default'
            });
          } else {
            toast({
              title: 'Partial Success',
              description: `${successful} operations succeeded, ${failed} failed.`,
              variant: 'default'
            });
          }
        });

      setQueuedOperations([]);
    }
  }, [isOnline, queuedOperations, toast]);

  return {
    executeWhenOnline,
    queuedOperationsCount: queuedOperations.length,
    clearQueue: () => setQueuedOperations([])
  };
}

/**
 * Hook for graceful degradation when features are unavailable
 */
export function useGracefulDegradation() {
  const [unavailableFeatures, setUnavailableFeatures] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const markFeatureUnavailable = useCallback((feature: string, reason?: string) => {
    setUnavailableFeatures(prev => new Set([...prev, feature]));
    
    toast({
      title: 'Feature Temporarily Unavailable',
      description: reason || `${feature} is currently unavailable. Please try again later.`,
      variant: 'default'
    });
  }, [toast]);

  const markFeatureAvailable = useCallback((feature: string) => {
    setUnavailableFeatures(prev => {
      const newSet = new Set(prev);
      newSet.delete(feature);
      return newSet;
    });
  }, []);

  const isFeatureAvailable = useCallback((feature: string) => {
    return !unavailableFeatures.has(feature);
  }, [unavailableFeatures]);

  return {
    markFeatureUnavailable,
    markFeatureAvailable,
    isFeatureAvailable,
    unavailableFeatures: Array.from(unavailableFeatures)
  };
}

// Helper function to analyze errors
function analyzeError(error: unknown, isOnline: boolean) {
  let title = 'Error';
  let message = 'An unexpected error occurred';
  let canRetry = true;
  let severity: 'low' | 'medium' | 'high' = 'medium';

  if (error instanceof Error) {
    message = error.message;

    // Network errors
    if (error.name === 'NetworkError' || message.includes('fetch') || message.includes('network')) {
      title = 'Network Error';
      message = isOnline ? 
        'Unable to connect to the server. Please try again.' :
        'You appear to be offline. Please check your connection.';
      canRetry = true;
      severity = 'medium';
    }
    // Authentication errors
    else if (message.includes('401') || message.includes('unauthorized')) {
      title = 'Authentication Error';
      message = 'Your session has expired. Please log in again.';
      canRetry = false;
      severity = 'high';
    }
    // Permission errors
    else if (message.includes('403') || message.includes('forbidden')) {
      title = 'Permission Denied';
      message = 'You don\'t have permission to perform this action.';
      canRetry = false;
      severity = 'high';
    }
    // Validation errors
    else if (message.includes('400') || message.includes('validation')) {
      title = 'Validation Error';
      message = 'Please check your input and try again.';
      canRetry = false;
      severity = 'low';
    }
    // Server errors
    else if (message.includes('500') || message.includes('server')) {
      title = 'Server Error';
      message = 'The server encountered an error. Please try again later.';
      canRetry = true;
      severity = 'high';
    }
    // Timeout errors
    else if (message.includes('timeout')) {
      title = 'Request Timeout';
      message = 'The request took too long to complete. Please try again.';
      canRetry = true;
      severity = 'medium';
    }
  }

  return {
    title,
    message,
    canRetry,
    severity,
    isNetworkError: !isOnline || message.includes('network') || message.includes('fetch')
  };
}