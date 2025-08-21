/**
 * Search Analytics Component
 * Displays search performance metrics and analytics for admin users
 */

import React, { useState } from 'react';
import { 
  BarChart3, 
  Clock, 
  Search, 
  TrendingUp, 
  Database,
  Zap,
  Eye,
  EyeOff
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SearchMetrics {
  searchCount: number;
  averageResponseTime: number;
  cacheHitRate: number;
  lastSearchTime: number;
}

interface SearchAnalyticsProps {
  metrics: SearchMetrics;
  cacheSize: number;
  isVisible?: boolean;
  onToggleVisibility?: () => void;
  className?: string;
}

export const SearchAnalytics: React.FC<SearchAnalyticsProps> = ({
  metrics,
  cacheSize,
  isVisible = false,
  onToggleVisibility,
  className
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getPerformanceColor = (responseTime: number) => {
    if (responseTime < 200) return 'text-green-600';
    if (responseTime < 500) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCacheEfficiencyColor = (hitRate: number) => {
    if (hitRate > 80) return 'text-green-600';
    if (hitRate > 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!isVisible) {
    return onToggleVisibility ? (
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggleVisibility}
        className="fixed bottom-4 right-4 z-50 bg-background border shadow-lg"
      >
        <BarChart3 className="h-4 w-4 mr-2" />
        Analytics
      </Button>
    ) : null;
  }

  return (
    <TooltipProvider>
      <Card className={`${className} border-dashed`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Search Analytics
              <Badge variant="outline" className="text-xs">
                Dev Mode
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="h-6 px-2"
              >
                {showDetails ? (
                  <EyeOff className="h-3 w-3" />
                ) : (
                  <Eye className="h-3 w-3" />
                )}
              </Button>
              {onToggleVisibility && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleVisibility}
                  className="h-6 px-2"
                >
                  ×
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                  <Search className="h-3 w-3 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Searches</div>
                    <div className="text-sm font-medium">{metrics.searchCount}</div>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Total number of search operations performed</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                  <Clock className={`h-3 w-3 ${getPerformanceColor(metrics.averageResponseTime)}`} />
                  <div>
                    <div className="text-xs text-muted-foreground">Avg Time</div>
                    <div className={`text-sm font-medium ${getPerformanceColor(metrics.averageResponseTime)}`}>
                      {formatTime(metrics.averageResponseTime)}
                    </div>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Average response time for search operations</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Cache Performance */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Cache Hit Rate
              </span>
              <span className={`text-xs font-medium ${getCacheEfficiencyColor(metrics.cacheHitRate)}`}>
                {metrics.cacheHitRate.toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={metrics.cacheHitRate} 
              className="h-1"
            />
          </div>

          {showDetails && (
            <>
              {/* Detailed Metrics */}
              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Database className="h-3 w-3" />
                    Cache Size
                  </span>
                  <span className="font-medium">{cacheSize} entries</span>
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Last Search
                  </span>
                  <span className={`font-medium ${getPerformanceColor(metrics.lastSearchTime)}`}>
                    {formatTime(metrics.lastSearchTime)}
                  </span>
                </div>
              </div>

              {/* Performance Indicators */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                <div className="text-center">
                  <div className={`text-lg font-bold ${
                    metrics.averageResponseTime < 200 ? 'text-green-600' : 
                    metrics.averageResponseTime < 500 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {metrics.averageResponseTime < 200 ? '🚀' : 
                     metrics.averageResponseTime < 500 ? '⚡' : '🐌'}
                  </div>
                  <div className="text-xs text-muted-foreground">Speed</div>
                </div>
                
                <div className="text-center">
                  <div className={`text-lg font-bold ${
                    metrics.cacheHitRate > 80 ? 'text-green-600' : 
                    metrics.cacheHitRate > 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {metrics.cacheHitRate > 80 ? '💎' : 
                     metrics.cacheHitRate > 60 ? '⭐' : '📈'}
                  </div>
                  <div className="text-xs text-muted-foreground">Cache</div>
                </div>
                
                <div className="text-center">
                  <div className={`text-lg font-bold ${
                    metrics.searchCount > 50 ? 'text-blue-600' : 
                    metrics.searchCount > 10 ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {metrics.searchCount > 50 ? '🔥' : 
                     metrics.searchCount > 10 ? '✨' : '🌱'}
                  </div>
                  <div className="text-xs text-muted-foreground">Usage</div>
                </div>
              </div>

              {/* Performance Tips */}
              {(metrics.averageResponseTime > 500 || metrics.cacheHitRate < 60) && (
                <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs">
                  <div className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                    Performance Tips:
                  </div>
                  <ul className="text-yellow-700 dark:text-yellow-300 space-y-1">
                    {metrics.averageResponseTime > 500 && (
                      <li>• Consider adding search indexes to improve query speed</li>
                    )}
                    {metrics.cacheHitRate < 60 && (
                      <li>• Users are searching for diverse terms - cache is less effective</li>
                    )}
                  </ul>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default SearchAnalytics;