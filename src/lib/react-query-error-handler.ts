// src/lib/react-query-error-handler.ts

/**
 * React Query Error Handler
 * Centralized error handling for React Query
 */

import { QueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast'; // Ensure this path is correct for your toast utility

/**
 * Default error handler for React Query
 */
function defaultErrorHandler(error: unknown) {
  console.error('React Query Error:', error);

  let errorMessage = 'An unexpected error occurred';

  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else if (error && typeof error === 'object' && 'message' in error) {
    errorMessage = (error as any).message;
  }

  // Show toast notification for errors
  toast({
    title: 'Error',
    description: errorMessage,
    variant: 'destructive',
  });
}

/**
 * Create a configured QueryClient with error handling
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Global error handler for queries
        // Retry configuration
        retry: (failureCount, error) => {
          // Don't retry on 4xx errors (client errors)
          if (error && typeof error === 'object' && 'status' in error) {
            const status = (error as any).status;
            if (status >= 400 && status < 500) {
              return false;
            }
          }

          // Retry up to 3 times for other errors
          return failureCount < 3;
        },
        // Stale time configuration
        staleTime: 5 * 60 * 1000, // 5 minutes
        // Cache time configuration
        cacheTime: 10 * 60 * 1000, // 10 minutes
        // Refetch on window focus
        refetchOnWindowFocus: false,
        // Refetch on reconnect
        refetchOnReconnect: true,
      },
      mutations: {
        // Global error handler for mutations
        onError: defaultErrorHandler,
        // Retry configuration for mutations
        retry: false, // Don't retry mutations by default
      },
    },
    // Global error handler
    errorHandler: defaultErrorHandler,
  });
}

/**
 * Error handler specifically for authentication errors
 */
export function handleAuthError(error: unknown) {
  console.error('Authentication Error:', error);

  // Redirect to login page on auth errors
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}

/**
 * Error handler for network errors
 */
export function handleNetworkError(error: unknown) {
  console.error('Network Error:', error);

  toast({
    title: 'Network Error',
    description: 'Please check your internet connection and try again.',
    variant: 'destructive',
  });
}

/**
 * Error handler for validation errors
 */
export function handleValidationError(error: unknown) {
  console.error('Validation Error:', error);

  let errorMessage = 'Please check your input and try again';

  if (error && typeof error === 'object' && 'message' in error) {
    errorMessage = (error as any).message;
  }

  toast({
    title: 'Validation Error',
    description: errorMessage,
    variant: 'destructive',
  });
}

/**
 * **NEW:** Error handler specifically for Supabase errors.
 * This function is now exported and will be used by your Supabase data access layers.
 * It leverages the existing `handleError` or `defaultErrorHandler` for consistency.
 */
export function handleSupabaseError(error: unknown): { message: string } {
  console.error('Supabase Specific Error:', error);

  let errorMessage = 'A Supabase-related error occurred.';

  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else if (error && typeof error === 'object' && 'message' in error) {
    errorMessage = (error as any).message;
  }

  // You can choose to call defaultErrorHandler here for consistent toast notifications
  defaultErrorHandler(error);

  // Return an object with a message, as your Supabase DALs expect `appError.message`
  return { message: errorMessage };
}


/**
 * Utility to determine error type and handle accordingly
 */
export function handleError(error: unknown, context?: string) {
  console.error(`Error in ${context || 'unknown context'}:`, error);

  // Check for specific error types
  if (error && typeof error === 'object') {
    const errorObj = error as any;

    // Authentication errors
    if (errorObj.status === 401 || errorObj.code === 'UNAUTHENTICATED') {
      handleAuthError(error);
      return;
    }

    // Network errors
    if (errorObj.name === 'NetworkError' || errorObj.code === 'NETWORK_ERROR') {
      handleNetworkError(error);
      return;
    }

    // Validation errors
    if (errorObj.status === 400 || errorObj.code === 'VALIDATION_ERROR') {
      handleValidationError(error);
      return;
    }

    // You might also add a check for Supabase specific error codes/structures here
    // if you want `handleError` to specifically call `handleSupabaseError`
    // For example:
    // if (errorObj.hint && errorObj.message && errorObj.code) { // Typical Supabase error structure
    //   handleSupabaseError(error);
    //   return;
    // }
  }

  // Default error handling
  defaultErrorHandler(error);
}