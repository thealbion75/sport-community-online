/**
 * Error Handling Utilities
 * Centralized error handling for the application
 */

export enum ErrorType {
  NETWORK = 'network',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NOT_FOUND = 'not_found',
  SERVER = 'server',
  UNKNOWN = 'unknown'
}

export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly statusCode?: number;
  public readonly details?: any;

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    statusCode?: number,
    details?: any
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const handleApiError = (error: any): AppError => {
  // Handle network errors
  if (!navigator.onLine) {
    return new AppError(
      'No internet connection. Please check your network and try again.',
      ErrorType.NETWORK
    );
  }

  // Handle fetch errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return new AppError(
      'Network error. Please check your connection and try again.',
      ErrorType.NETWORK
    );
  }

  // Handle HTTP errors
  if (error?.status || error?.statusCode) {
    const status = error.status || error.statusCode;
    
    switch (status) {
      case 400:
        return new AppError(
          error.message || 'Invalid request. Please check your input.',
          ErrorType.VALIDATION,
          status,
          error.details
        );
      case 401:
        return new AppError(
          'Authentication required. Please log in.',
          ErrorType.AUTHENTICATION,
          status
        );
      case 403:
        return new AppError(
          'Access denied. You don\'t have permission to perform this action.',
          ErrorType.AUTHORIZATION,
          status
        );
      case 404:
        return new AppError(
          'Resource not found.',
          ErrorType.NOT_FOUND,
          status
        );
      case 429:
        return new AppError(
          'Too many requests. Please wait a moment and try again.',
          ErrorType.NETWORK,
          status
        );
      case 500:
      case 502:
      case 503:
      case 504:
        return new AppError(
          'Server error. Please try again later.',
          ErrorType.SERVER,
          status
        );
      default:
        return new AppError(
          error.message || 'An unexpected error occurred.',
          ErrorType.UNKNOWN,
          status,
          error.details
        );
    }
  }

  // Handle Supabase errors
  if (error?.code) {
    switch (error.code) {
      case 'PGRST116':
        return new AppError(
          'Resource not found.',
          ErrorType.NOT_FOUND
        );
      case 'PGRST301':
        return new AppError(
          'Access denied. You don\'t have permission to perform this action.',
          ErrorType.AUTHORIZATION
        );
      default:
        return new AppError(
          error.message || 'Database error occurred.',
          ErrorType.SERVER,
          undefined,
          { code: error.code }
        );
    }
  }

  // Handle validation errors
  if (error?.name === 'ValidationError' || error?.type === 'validation') {
    return new AppError(
      error.message || 'Validation failed.',
      ErrorType.VALIDATION,
      undefined,
      error.details
    );
  }

  // Handle generic errors
  if (error instanceof Error) {
    return new AppError(
      error.message,
      ErrorType.UNKNOWN,
      undefined,
      { originalError: error.name }
    );
  }

  // Handle string errors
  if (typeof error === 'string') {
    return new AppError(error, ErrorType.UNKNOWN);
  }

  // Fallback for unknown error types
  return new AppError(
    'An unexpected error occurred.',
    ErrorType.UNKNOWN,
    undefined,
    { originalError: error }
  );
};

export const getErrorMessage = (error: AppError | Error | string): string => {
  if (error instanceof AppError) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unexpected error occurred.';
};

export const isRetryableError = (error: AppError): boolean => {
  return [
    ErrorType.NETWORK,
    ErrorType.SERVER
  ].includes(error.type) && 
  error.statusCode !== 401 && 
  error.statusCode !== 403 && 
  error.statusCode !== 404;
};

export const getRetryDelay = (attemptNumber: number): number => {
  // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
  return Math.min(1000 * Math.pow(2, attemptNumber - 1), 30000);
};

export default {
  AppError,
  ErrorType,
  handleApiError,
  getErrorMessage,
  isRetryableError,
  getRetryDelay
};