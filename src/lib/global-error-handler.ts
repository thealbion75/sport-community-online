/**
 * Global Error Handler
 * Sets up global error handling for unhandled errors and promise rejections
 */

import { toast } from '@/hooks/use-toast';

/**
 * Global error handler for unhandled JavaScript errors
 */
function handleGlobalError(event: ErrorEvent) {
  console.error('Global Error:', event.error);
  
  // Don't show toast for every error in development
  if (process.env.NODE_ENV === 'production') {
    toast({
      title: 'Unexpected Error',
      description: 'Something went wrong. Please refresh the page and try again.',
      variant: 'destructive',
    });
  }
  
  // Log error to external service in production
  if (process.env.NODE_ENV === 'production') {
    logErrorToService({
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    });
  }
}

/**
 * Global handler for unhandled promise rejections
 */
function handleUnhandledRejection(event: PromiseRejectionEvent) {
  console.error('Unhandled Promise Rejection:', event.reason);
  
  // Prevent the default browser behavior (logging to console)
  event.preventDefault();
  
  // Don't show toast for every rejection in development
  if (process.env.NODE_ENV === 'production') {
    toast({
      title: 'Unexpected Error',
      description: 'Something went wrong. Please try again.',
      variant: 'destructive',
    });
  }
  
  // Log error to external service in production
  if (process.env.NODE_ENV === 'production') {
    logErrorToService({
      type: 'unhandledRejection',
      reason: event.reason,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    });
  }
}

/**
 * Log error to external monitoring service
 * Replace this with your actual error logging service (e.g., Sentry, LogRocket, etc.)
 */
function logErrorToService(errorData: any) {
  // Example implementation - replace with your actual service
  try {
    // You could send to services like:
    // - Sentry: Sentry.captureException(errorData)
    // - LogRocket: LogRocket.captureException(errorData)
    // - Custom API endpoint
    
    console.log('Error logged to service:', errorData);
    
    // Example API call to your error logging endpoint
    // fetch('/api/errors', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify(errorData),
    // }).catch(() => {
    //   // Silently fail if error logging fails
    // });
  } catch (error) {
    // Silently fail if error logging fails
    console.warn('Failed to log error to service:', error);
  }
}

/**
 * Setup global error handlers
 */
export function setupGlobalErrorHandlers() {
  // Handle uncaught JavaScript errors
  window.addEventListener('error', handleGlobalError);
  
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', handleUnhandledRejection);
  
  // Handle React errors (this is handled by ErrorBoundary components)
  // But we can add additional logging here if needed
  
  console.log('Global error handlers initialized');
}

/**
 * Remove global error handlers (useful for cleanup in tests)
 */
export function removeGlobalErrorHandlers() {
  window.removeEventListener('error', handleGlobalError);
  window.removeEventListener('unhandledrejection', handleUnhandledRejection);
}

/**
 * Manually report an error to the global error handler
 */
export function reportError(error: Error, context?: string) {
  console.error(`Manual error report${context ? ` (${context})` : ''}:`, error);
  
  logErrorToService({
    type: 'manual',
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
  });
}

/**
 * Error boundary fallback component data
 */
export const errorBoundaryFallback = {
  title: 'Something went wrong',
  description: 'We apologize for the inconvenience. Please try refreshing the page.',
  actions: [
    {
      label: 'Refresh Page',
      action: () => window.location.reload(),
    },
    {
      label: 'Go Home',
      action: () => window.location.href = '/',
    },
  ],
};