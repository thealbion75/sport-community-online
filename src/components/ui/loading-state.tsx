/**
 * Loading State Components
 * Provides consistent loading states and skeleton components for better UX
 */

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingContainerProps {
  isLoading: boolean;
  children?: React.ReactNode;
  loadingText?: string;
  className?: string;
}

export function LoadingContainer({ 
  isLoading, 
  children, 
  loadingText = "Loading...",
  className 
}: LoadingContainerProps) {
  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center py-8", className)} role="status" aria-live="polite">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          <span className="text-sm text-gray-600">{loadingText}</span>
        </div>
        <span className="sr-only">Loading content, please wait</span>
      </div>
    );
  }

  return <>{children}</>;
}

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-200", className)}
      role="presentation"
      aria-hidden="true"
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="border rounded-lg p-6 space-y-4" role="presentation" aria-hidden="true">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="h-3 w-4/6" />
      </div>
      <div className="flex space-x-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3" role="presentation" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4 border rounded">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
}

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <Loader2 
      className={cn("animate-spin", sizeClasses[size], className)} 
      role="status"
      aria-label="Loading"
    />
  );
}