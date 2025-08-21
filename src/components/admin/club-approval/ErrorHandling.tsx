/**
 * Enhanced Error Handling Components for Club Approval System
 * Provides comprehensive error handling with recovery suggestions
 */

import React from 'react';
import { AlertTriangle, RefreshCw, Wifi, WifiOff, Shield, Clock, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useNetworkStatus, useRetry } from '@/hooks/use-error-handling';

interface ErrorDisplayProps {
  error: Error | unknown;
  onRetry?: () => void;
  onGoBack?: () => void;
  context?: string;
  showDetails?: boolean;
}

export function ErrorDisplay({ 
  error, 
  onRetry, 
  onGoBack, 
  context = 'operation',
  showDetails = false 
}: ErrorDisplayProps) {
  const { isOnline } = useNetworkStatus();
  
  const getErrorInfo = (error: unknown) => {
    if (error instanceof Error) {
      return {
        title: getErrorTitle(error),
        message: error.message,
        type: getErrorType(error),
        suggestions: getRecoverySuggestions(error, isOnline)
      };
    }
    
    return {
      title: 'Unknown Error',
      message: 'An unexpected error occurred',
      type: 'unknown' as const,
      suggestions: ['Please try refreshing the page', 'Contact support if the problem persists']
    };
  };

  const errorInfo = getErrorInfo(error);

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <CardTitle className="text-destructive">{errorInfo.title}</CardTitle>
          <Badge variant="outline" className="text-xs">
            {errorInfo.type}
          </Badge>
        </div>
        <CardDescription>
          Failed to {context}. {errorInfo.message}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Network Status Indicator */}
        <div className="flex items-center gap-2 text-sm">
          {isOnline ? (
            <>
              <Wifi className="h-4 w-4 text-green-600" />
              <span className="text-green-600">Connected</span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 text-red-600" />
              <span className="text-red-600">Offline</span>
            </>
          )}
        </div>

        {/* Recovery Suggestions */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Suggested Actions:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            {errorInfo.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-xs mt-1">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Error Details (Development) */}
        {showDetails && process.env.NODE_ENV === 'development' && error instanceof Error && (
          <details className="bg-muted p-3 rounded text-sm">
            <summary className="cursor-pointer font-medium mb-2">
              Technical Details
            </summary>
            <div className="space-y-2">
              <div>
                <strong>Error:</strong> {error.message}
              </div>
              {error.stack && (
                <div>
                  <strong>Stack:</strong>
                  <pre className="mt-1 text-xs overflow-auto whitespace-pre-wrap">
                    {error.stack}
                  </pre>
                </div>
              )}
            </div>
          </details>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2">
          {onRetry && (
            <Button onClick={onRetry} className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
          {onGoBack && (
            <Button variant="outline" onClick={onGoBack} className="flex-1">
              Go Back
            </Button>
          )}
          <Button 
            variant="ghost" 
            onClick={() => window.location.reload()}
            className="flex-1"
          >
            Reload Page
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface NetworkErrorBannerProps {
  isVisible: boolean;
  onDismiss?: () => void;
}

export function NetworkErrorBanner({ isVisible, onDismiss }: NetworkErrorBannerProps) {
  const { isOnline } = useNetworkStatus();

  if (!isVisible || isOnline) return null;

  return (
    <Alert variant="destructive" className="mb-4">
      <WifiOff className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>
          You're currently offline. Some features may not work properly.
        </span>
        {onDismiss && (
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            <XCircle className="h-4 w-4" />
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

interface RetryableOperationProps {
  children: React.ReactNode;
  operation: () => Promise<any>;
  maxAttempts?: number;
  onError?: (error: Error, attempt: number) => void;
  onSuccess?: () => void;
}

export function RetryableOperation({ 
  children, 
  operation, 
  maxAttempts = 3,
  onError,
  onSuccess 
}: RetryableOperationProps) {
  const [isRetrying, setIsRetrying] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const [attemptCount, setAttemptCount] = React.useState(0);
  const { retry } = useRetry();

  const handleRetry = async () => {
    setIsRetrying(true);
    setError(null);
    
    try {
      await retry(operation, {
        maxAttempts,
        onRetry: (attempt, error) => {
          setAttemptCount(attempt);
          onError?.(error, attempt);
        }
      });
      
      onSuccess?.();
      setAttemptCount(0);
    } catch (error) {
      setError(error as Error);
    } finally {
      setIsRetrying(false);
    }
  };

  if (error) {
    return (
      <ErrorDisplay
        error={error}
        onRetry={attemptCount < maxAttempts ? handleRetry : undefined}
        context="complete this operation"
        showDetails={true}
      />
    );
  }

  if (isRetrying) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center space-y-2">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">
            Retrying... (Attempt {attemptCount} of {maxAttempts})
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Helper functions
function getErrorTitle(error: Error): string {
  if (error.name === 'NetworkError' || error.message.includes('fetch')) {
    return 'Network Error';
  }
  if (error.message.includes('401') || error.message.includes('unauthorized')) {
    return 'Authentication Error';
  }
  if (error.message.includes('403') || error.message.includes('forbidden')) {
    return 'Permission Denied';
  }
  if (error.message.includes('404') || error.message.includes('not found')) {
    return 'Not Found';
  }
  if (error.message.includes('500') || error.message.includes('server')) {
    return 'Server Error';
  }
  return 'Application Error';
}

function getErrorType(error: Error): string {
  if (error.name === 'NetworkError' || error.message.includes('fetch')) {
    return 'network';
  }
  if (error.message.includes('401') || error.message.includes('403')) {
    return 'auth';
  }
  if (error.message.includes('400')) {
    return 'validation';
  }
  if (error.message.includes('500')) {
    return 'server';
  }
  return 'client';
}

function getRecoverySuggestions(error: Error, isOnline: boolean): string[] {
  const suggestions: string[] = [];

  if (!isOnline) {
    suggestions.push('Check your internet connection');
    suggestions.push('Try again when you\'re back online');
    return suggestions;
  }

  if (error.name === 'NetworkError' || error.message.includes('fetch')) {
    suggestions.push('Check your internet connection');
    suggestions.push('Try refreshing the page');
    suggestions.push('Wait a moment and try again');
  } else if (error.message.includes('401')) {
    suggestions.push('Please log in again');
    suggestions.push('Your session may have expired');
  } else if (error.message.includes('403')) {
    suggestions.push('Contact an administrator for access');
    suggestions.push('You may not have the required permissions');
  } else if (error.message.includes('404')) {
    suggestions.push('The requested resource may have been moved or deleted');
    suggestions.push('Check the URL and try again');
  } else if (error.message.includes('500')) {
    suggestions.push('This is a server issue - please try again later');
    suggestions.push('Contact support if the problem persists');
  } else {
    suggestions.push('Try refreshing the page');
    suggestions.push('Clear your browser cache');
    suggestions.push('Contact support if the problem continues');
  }

  return suggestions;
}