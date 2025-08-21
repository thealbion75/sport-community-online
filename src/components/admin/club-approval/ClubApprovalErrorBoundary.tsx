/**
 * Club Approval Error Boundary
 * Specialized error boundary for club approval system with context-aware error handling
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, Home, ArrowLeft, Bug, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  context?: string;
  showReportButton?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
}

export class ClubApprovalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Generate a unique error ID for tracking
    const errorId = `club-approval-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return { 
      hasError: true, 
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Club Approval Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Log to error reporting service in production
    if (process.env.NODE_ENV === 'production') {
      this.logErrorToService(error, errorInfo);
    }
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // In a real application, you would send this to your error reporting service
    // Example: Sentry, LogRocket, Bugsnag, etc.
    const errorReport = {
      errorId: this.state.errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      context: this.props.context || 'club-approval',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    console.log('Error report that would be sent to service:', errorReport);
    
    // Example API call:
    // fetch('/api/errors', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(errorReport)
    // });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleGoBack = () => {
    window.history.back();
  };

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined,
      errorId: undefined 
    });
  };

  handleReportError = () => {
    const { error, errorInfo, errorId } = this.state;
    const subject = encodeURIComponent(`Club Approval Error Report - ${errorId}`);
    const body = encodeURIComponent(`
Error ID: ${errorId}
Context: ${this.props.context || 'club-approval'}
Error: ${error?.message}
URL: ${window.location.href}
Timestamp: ${new Date().toISOString()}

Please describe what you were doing when this error occurred:
[Your description here]

Technical Details:
${error?.stack}

Component Stack:
${errorInfo?.componentStack}
    `);
    
    window.open(`mailto:support@example.com?subject=${subject}&body=${body}`);
  };

  private getErrorCategory = (error: Error): string => {
    if (error.message.includes('ChunkLoadError') || error.message.includes('Loading chunk')) {
      return 'chunk-load';
    }
    if (error.message.includes('Network') || error.message.includes('fetch')) {
      return 'network';
    }
    if (error.message.includes('Permission') || error.message.includes('401') || error.message.includes('403')) {
      return 'permission';
    }
    if (error.name === 'TypeError') {
      return 'type';
    }
    return 'unknown';
  };

  private getErrorSeverity = (error: Error): 'low' | 'medium' | 'high' => {
    const category = this.getErrorCategory(error);
    
    if (category === 'chunk-load' || category === 'network') {
      return 'medium';
    }
    if (category === 'permission') {
      return 'high';
    }
    return 'low';
  };

  private getRecoveryInstructions = (error: Error): string[] => {
    const category = this.getErrorCategory(error);
    
    switch (category) {
      case 'chunk-load':
        return [
          'This usually happens after an app update',
          'Try refreshing the page to load the latest version',
          'Clear your browser cache if the problem persists'
        ];
      case 'network':
        return [
          'Check your internet connection',
          'Try again in a few moments',
          'Contact support if the problem continues'
        ];
      case 'permission':
        return [
          'You may not have the required permissions',
          'Try logging out and logging back in',
          'Contact an administrator if you need access'
        ];
      default:
        return [
          'This appears to be an unexpected error',
          'Try refreshing the page',
          'Contact support if the problem persists'
        ];
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorId } = this.state;
      const category = error ? this.getErrorCategory(error) : 'unknown';
      const severity = error ? this.getErrorSeverity(error) : 'low';
      const instructions = error ? this.getRecoveryInstructions(error) : [];

      // Default error UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl border-destructive/50">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 text-destructive">
                <AlertTriangle className="h-full w-full" />
              </div>
              <CardTitle className="text-xl font-semibold text-destructive flex items-center justify-center gap-2">
                Club Approval System Error
                <Badge variant="outline" className="text-xs">
                  {category}
                </Badge>
              </CardTitle>
              <CardDescription>
                {this.props.context ? 
                  `An error occurred in ${this.props.context}` : 
                  'An unexpected error occurred in the club approval system'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Error ID for support */}
              {errorId && (
                <Alert>
                  <Bug className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Error ID:</strong> {errorId}
                    <br />
                    <span className="text-xs text-muted-foreground">
                      Please include this ID when contacting support
                    </span>
                  </AlertDescription>
                </Alert>
              )}

              {/* Recovery Instructions */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">What you can try:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {instructions.map((instruction, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-xs mt-1">•</span>
                      <span>{instruction}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Error Details (Development) */}
              {process.env.NODE_ENV === 'development' && error && (
                <details className="bg-muted p-3 rounded text-sm">
                  <summary className="cursor-pointer font-medium text-muted-foreground mb-2">
                    Technical Details (Development Only)
                  </summary>
                  <div className="space-y-2">
                    <div>
                      <strong>Error:</strong> {error.message}
                    </div>
                    <div>
                      <strong>Category:</strong> {category}
                    </div>
                    <div>
                      <strong>Severity:</strong> {severity}
                    </div>
                    {error.stack && (
                      <div>
                        <strong>Stack:</strong>
                        <pre className="mt-1 text-xs overflow-auto whitespace-pre-wrap">
                          {error.stack}
                        </pre>
                      </div>
                    )}
                    {this.state.errorInfo && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="mt-1 text-xs overflow-auto whitespace-pre-wrap">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  onClick={this.handleRetry}
                  className="flex-1"
                  variant="default"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button 
                  onClick={this.handleReload}
                  className="flex-1"
                  variant="outline"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reload Page
                </Button>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  onClick={this.handleGoBack}
                  className="flex-1"
                  variant="ghost"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Back
                </Button>
                <Button 
                  onClick={this.handleGoHome}
                  className="flex-1"
                  variant="ghost"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go to Dashboard
                </Button>
              </div>

              {/* Report Error Button */}
              {this.props.showReportButton && (
                <div className="pt-4 border-t">
                  <Button 
                    onClick={this.handleReportError}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <Bug className="h-4 w-4 mr-2" />
                    Report This Error
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component to wrap club approval components with error boundary
 */
export function withClubApprovalErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    fallback?: ReactNode;
    context?: string;
    showReportButton?: boolean;
  } = {}
) {
  const WrappedComponent = (props: P) => (
    <ClubApprovalErrorBoundary 
      fallback={options.fallback}
      context={options.context}
      showReportButton={options.showReportButton}
    >
      <Component {...props} />
    </ClubApprovalErrorBoundary>
  );

  WrappedComponent.displayName = `withClubApprovalErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}