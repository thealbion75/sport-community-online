/**
 * Error Handling Hooks
 * Provides React hooks for consistent error handling
 */

import * as React from 'react';
import { useCallback } from 'react';
import { useToast } from './use-toast';
import { handleApiError, AppError, ErrorType } from '@/lib/error-handling';

// Hook for handling API errors with toast notifications
export function useApiErrorHandler() {
  const { toast } = useToast();

  const handleError = useCallback((error: unknown, customMessage?: string) => {
    const appError = handleApiError(error);
    
    toast({
      title: getErrorTitle(appError.type),
      description: customMessage || appError.message,
      variant: 'destructive',
    });

    // Log error for debugging
    console.error('API Error:', appError);
    
    return appError;
  }, [toast]);

  return { handleError };
}

// Hook for handling form submission errors
export function useFormErrorHandler() {
  const { toast } = useToast();

  const handleFormError = useCallback((error: unknown, setError?: (field: string, error: { message: string }) => void) => {
    const appError = handleApiError(error);
    
    // If it's a validation error with field-specific errors
    if (appError.type === ErrorType.VALIDATION && appError.details?.fieldErrors && setError) {
      Object.entries(appError.details.fieldErrors).forEach(([field, message]) => {
        setError(field, { message: message as string });
      });
    } else {
      // Show general error toast
      toast({
        title: 'Form Error',
        description: appError.message,
        variant: 'destructive',
      });
    }

    return appError;
  }, [toast]);

  return { handleFormError };
}

// Hook for handling async operations with loading states
export function useAsyncOperation() {
  const { handleError } = useApiErrorHandler();

  const executeAsync = useCallback(async <T>(
    operation: () => Promise<T>,
    options: {
      onSuccess?: (result: T) => void;
      onError?: (error: AppError) => void;
      successMessage?: string;
      errorMessage?: string;
    } = {}
  ): Promise<T | null> => {
    try {
      const result = await operation();
      
      if (options.onSuccess) {
        options.onSuccess(result);
      }
      
      if (options.successMessage) {
        toast({
          title: 'Success',
          description: options.successMessage,
          variant: 'success',
        });
      }
      
      return result;
    } catch (error) {
      const appError = handleError(error, options.errorMessage);
      
      if (options.onError) {
        options.onError(appError);
      }
      
      return null;
    }
  }, [handleError]);

  return { executeAsync };
}

// Hook for retry logic
export function useRetry() {
  const { handleError } = useApiErrorHandler();

  const retry = useCallback(async <T>(
    operation: () => Promise<T>,
    options: {
      maxAttempts?: number;
      delay?: number;
      backoff?: boolean;
      onRetry?: (attempt: number, error: Error) => void;
    } = {}
  ): Promise<T> => {
    const { maxAttempts = 3, delay = 1000, backoff = true, onRetry } = options;
    
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxAttempts) {
          break;
        }
        
        if (onRetry) {
          onRetry(attempt, lastError);
        }
        
        // Wait before retrying
        const waitTime = backoff ? delay * Math.pow(2, attempt - 1) : delay;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    // All attempts failed
    throw handleError(lastError!);
  }, [handleError]);

  return { retry };
}

// Hook for handling network connectivity
export function useNetworkStatus() {
  const { toast } = useToast();

  const handleOffline = useCallback(() => {
    toast({
      title: 'Connection Lost',
      description: 'You are currently offline. Some features may not work.',
      variant: 'warning',
    });
  }, [toast]);

  const handleOnline = useCallback(() => {
    toast({
      title: 'Connection Restored',
      description: 'You are back online.',
      variant: 'success',
    });
  }, [toast]);

  // Set up event listeners
  React.useEffect(() => {
    const handleOfflineEvent = () => handleOffline();
    const handleOnlineEvent = () => handleOnline();

    window.addEventListener('offline', handleOfflineEvent);
    window.addEventListener('online', handleOnlineEvent);

    return () => {
      window.removeEventListener('offline', handleOfflineEvent);
      window.removeEventListener('online', handleOnlineEvent);
    };
  }, [handleOffline, handleOnline]);

  return {
    isOnline: navigator.onLine,
    handleOffline,
    handleOnline,
  };
}

// Helper function to get error title
function getErrorTitle(type: ErrorType): string {
  switch (type) {
    case ErrorType.VALIDATION:
      return 'Validation Error';
    case ErrorType.AUTHENTICATION:
      return 'Authentication Error';
    case ErrorType.AUTHORIZATION:
      return 'Permission Denied';
    case ErrorType.NOT_FOUND:
      return 'Not Found';
    case ErrorType.SERVER:
      return 'Server Error';
    case ErrorType.NETWORK:
      return 'Network Error';
    default:
      return 'Error';
  }
}

