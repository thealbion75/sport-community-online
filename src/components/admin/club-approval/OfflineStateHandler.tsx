/**
 * Offline State Handler for Club Approval System
 * Manages offline functionality and queued operations
 */

import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useNetworkStatus } from '@/hooks/use-error-handling';
import { useNetworkAwareOperation } from '@/hooks/use-club-approval-error-handling';

interface OfflineIndicatorProps {
  className?: string;
}

export function OfflineIndicator({ className }: OfflineIndicatorProps) {
  const { isOnline } = useNetworkStatus();
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowOfflineMessage(true);
    } else {
      // Hide the message after a brief delay when coming back online
      const timer = setTimeout(() => {
        setShowOfflineMessage(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  if (!showOfflineMessage) return null;

  return (
    <Alert variant={isOnline ? "default" : "destructive"} className={className}>
      {isOnline ? (
        <Wifi className="h-4 w-4" />
      ) : (
        <WifiOff className="h-4 w-4" />
      )}
      <AlertDescription>
        {isOnline ? (
          <span className="text-green-700">
            ✓ Connection restored. You're back online.
          </span>
        ) : (
          <span>
            You're currently offline. Some features may not work properly.
          </span>
        )}
      </AlertDescription>
    </Alert>
  );
}

interface QueuedOperationsDisplayProps {
  className?: string;
}

export function QueuedOperationsDisplay({ className }: QueuedOperationsDisplayProps) {
  const { queuedOperationsCount, clearQueue } = useNetworkAwareOperation();
  const { isOnline } = useNetworkStatus();

  if (queuedOperationsCount === 0) return null;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Queued Operations
          <Badge variant="secondary" className="text-xs">
            {queuedOperationsCount}
          </Badge>
        </CardTitle>
        <CardDescription className="text-xs">
          {isOnline ? 
            'Operations are being processed...' :
            'These operations will run when you\'re back online'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {queuedOperationsCount} operation{queuedOperationsCount !== 1 ? 's' : ''} pending
            </span>
            {isOnline && (
              <span className="text-green-600 text-xs">Processing...</span>
            )}
          </div>
          
          {!isOnline && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearQueue}
              className="w-full text-xs"
            >
              Clear Queue
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface OfflineCapabilitiesProps {
  children: React.ReactNode;
  fallbackMessage?: string;
  showQueuedOperations?: boolean;
}

export function OfflineCapabilities({ 
  children, 
  fallbackMessage,
  showQueuedOperations = true 
}: OfflineCapabilitiesProps) {
  const { isOnline } = useNetworkStatus();
  const { queuedOperationsCount } = useNetworkAwareOperation();

  return (
    <div className="space-y-4">
      <OfflineIndicator />
      
      {showQueuedOperations && queuedOperationsCount > 0 && (
        <QueuedOperationsDisplay />
      )}
      
      {!isOnline && fallbackMessage && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {fallbackMessage}
          </AlertDescription>
        </Alert>
      )}
      
      {children}
    </div>
  );
}

interface NetworkStatusBadgeProps {
  className?: string;
  showText?: boolean;
}

export function NetworkStatusBadge({ className, showText = false }: NetworkStatusBadgeProps) {
  const { isOnline } = useNetworkStatus();
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'poor' | 'offline'>('good');

  useEffect(() => {
    if (!isOnline) {
      setConnectionQuality('offline');
      return;
    }

    // Check connection quality using Network Information API if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        const updateConnectionQuality = () => {
          if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
            setConnectionQuality('poor');
          } else {
            setConnectionQuality('good');
          }
        };

        updateConnectionQuality();
        connection.addEventListener('change', updateConnectionQuality);
        
        return () => {
          connection.removeEventListener('change', updateConnectionQuality);
        };
      }
    }

    setConnectionQuality('good');
  }, [isOnline]);

  const getBadgeProps = () => {
    switch (connectionQuality) {
      case 'offline':
        return {
          variant: 'destructive' as const,
          icon: WifiOff,
          text: 'Offline'
        };
      case 'poor':
        return {
          variant: 'secondary' as const,
          icon: Wifi,
          text: 'Poor Connection'
        };
      default:
        return {
          variant: 'default' as const,
          icon: Wifi,
          text: 'Online'
        };
    }
  };

  const { variant, icon: Icon, text } = getBadgeProps();

  return (
    <Badge variant={variant} className={className}>
      <Icon className="h-3 w-3 mr-1" />
      {showText && text}
    </Badge>
  );
}

interface OfflineDataCacheProps {
  children: React.ReactNode;
  cacheKey: string;
  data?: any;
}

export function OfflineDataCache({ children, cacheKey, data }: OfflineDataCacheProps) {
  const { isOnline } = useNetworkStatus();
  const [cachedData, setCachedData] = useState<any>(null);
  const [isUsingCache, setIsUsingCache] = useState(false);

  // Cache data when online
  useEffect(() => {
    if (isOnline && data) {
      localStorage.setItem(`offline-cache-${cacheKey}`, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
      setCachedData(data);
      setIsUsingCache(false);
    }
  }, [isOnline, data, cacheKey]);

  // Load cached data when offline
  useEffect(() => {
    if (!isOnline && !data) {
      try {
        const cached = localStorage.getItem(`offline-cache-${cacheKey}`);
        if (cached) {
          const { data: cachedData, timestamp } = JSON.parse(cached);
          const isStale = Date.now() - timestamp > 5 * 60 * 1000; // 5 minutes
          
          if (!isStale) {
            setCachedData(cachedData);
            setIsUsingCache(true);
          }
        }
      } catch (error) {
        console.error('Failed to load cached data:', error);
      }
    }
  }, [isOnline, data, cacheKey]);

  return (
    <div>
      {isUsingCache && (
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Showing cached data from when you were last online. 
            Some information may be outdated.
          </AlertDescription>
        </Alert>
      )}
      {children}
    </div>
  );
}

interface RetryWhenOnlineProps {
  operation: () => Promise<any>;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  children: (retry: () => void, isRetrying: boolean) => React.ReactNode;
}

export function RetryWhenOnline({ 
  operation, 
  onSuccess, 
  onError, 
  children 
}: RetryWhenOnlineProps) {
  const { isOnline } = useNetworkStatus();
  const [isRetrying, setIsRetrying] = useState(false);

  const retry = async () => {
    if (!isOnline) {
      return;
    }

    setIsRetrying(true);
    try {
      await operation();
      onSuccess?.();
    } catch (error) {
      onError?.(error as Error);
    } finally {
      setIsRetrying(false);
    }
  };

  // Auto-retry when coming back online
  useEffect(() => {
    if (isOnline && !isRetrying) {
      retry();
    }
  }, [isOnline]);

  return <>{children(retry, isRetrying)}</>;
}