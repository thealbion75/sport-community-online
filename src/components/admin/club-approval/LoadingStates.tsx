/**
 * Enhanced Loading State Components for Club Approval System
 * Provides comprehensive loading states and skeleton screens
 */

import React from 'react';
import { Loader2, Clock, CheckCircle, XCircle, Building, Users, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export function LoadingSpinner({ size = 'md', text, className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="flex items-center gap-2">
        <Loader2 className={cn("animate-spin", sizeClasses[size])} />
        {text && (
          <span className="text-sm text-muted-foreground">{text}</span>
        )}
      </div>
    </div>
  );
}

export function ClubApprovalDashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Statistics Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alert Skeleton */}
      <Card className="border-orange-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-5" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-8 w-24" />
          </div>
        </CardContent>
      </Card>

      {/* Content Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-6 w-32" />
              </div>
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Skeleton className="h-4 w-4" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function ClubApplicationListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-6 w-32" />
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters Skeleton */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-48" />
        </div>

        {/* Table Skeleton */}
        <div className="rounded-md border">
          <div className="p-4 border-b">
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
          
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="p-4 border-b last:border-b-0">
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-4" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <div className="hidden md:block space-y-1">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="hidden lg:block h-3 w-20" />
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Skeleton */}
        <div className="flex justify-center mt-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ClubApplicationReviewSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-24" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Application Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Club Information Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-6 w-32" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Contact Information Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-6 w-32" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-48" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Application History Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-6 w-32" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="h-4 w-4 rounded-full mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Application Metadata Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-6 w-32" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-1">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

interface OperationProgressProps {
  isVisible: boolean;
  progress: number;
  total: number;
  operation: string;
  currentItem?: string;
}

export function OperationProgress({ 
  isVisible, 
  progress, 
  total, 
  operation, 
  currentItem 
}: OperationProgressProps) {
  if (!isVisible) return null;

  const percentage = total > 0 ? (progress / total) * 100 : 0;

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <span className="text-sm font-medium text-blue-800">
              {operation}...
            </span>
          </div>
          
          <Progress value={percentage} className="h-2" />
          
          <div className="flex items-center justify-between text-xs text-blue-700">
            <span>
              {progress} of {total} completed
            </span>
            <span>{Math.round(percentage)}%</span>
          </div>
          
          {currentItem && (
            <p className="text-xs text-blue-600 truncate">
              Processing: {currentItem}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface AsyncOperationWrapperProps {
  children: React.ReactNode;
  isLoading: boolean;
  error?: Error | null;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  onRetry?: () => void;
  minLoadingTime?: number;
}

export function AsyncOperationWrapper({
  children,
  isLoading,
  error,
  loadingComponent,
  errorComponent,
  onRetry,
  minLoadingTime = 500
}: AsyncOperationWrapperProps) {
  const [showLoading, setShowLoading] = React.useState(isLoading);

  // Ensure minimum loading time for better UX
  React.useEffect(() => {
    if (isLoading) {
      setShowLoading(true);
    } else {
      const timer = setTimeout(() => {
        setShowLoading(false);
      }, minLoadingTime);
      
      return () => clearTimeout(timer);
    }
  }, [isLoading, minLoadingTime]);

  if (error) {
    if (errorComponent) {
      return <>{errorComponent}</>;
    }
    
    return (
      <Card className="border-destructive/50">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-medium text-destructive mb-2">
              Something went wrong
            </h3>
            <p className="text-muted-foreground mb-4">
              {error.message || 'An unexpected error occurred'}
            </p>
            {onRetry && (
              <Button onClick={onRetry}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (showLoading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }
    
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  return <>{children}</>;
}

export function InlineLoadingState({ 
  isLoading, 
  text = "Loading...", 
  size = "sm" 
}: { 
  isLoading: boolean; 
  text?: string; 
  size?: 'sm' | 'md' | 'lg' 
}) {
  if (!isLoading) return null;

  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <LoadingSpinner size={size} />
      <span className="text-sm">{text}</span>
    </div>
  );
}