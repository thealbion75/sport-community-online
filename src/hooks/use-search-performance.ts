/**
 * Search Performance Optimization Hook
 * Provides debouncing, caching, and performance monitoring for search operations
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';

interface SearchPerformanceOptions {
  debounceMs?: number;
  cacheTime?: number;
  staleTime?: number;
  minSearchLength?: number;
  maxCacheSize?: number;
}

interface SearchMetrics {
  searchCount: number;
  averageResponseTime: number;
  cacheHitRate: number;
  lastSearchTime: number;
}

export function useSearchPerformance<T>(
  searchFn: (query: string) => Promise<T>,
  options: SearchPerformanceOptions = {}
) {
  const {
    debounceMs = 300,
    cacheTime = 5 * 60 * 1000, // 5 minutes
    staleTime = 2 * 60 * 1000, // 2 minutes
    minSearchLength = 1,
    maxCacheSize = 100
  } = options;

  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [metrics, setMetrics] = useState<SearchMetrics>({
    searchCount: 0,
    averageResponseTime: 0,
    cacheHitRate: 0,
    lastSearchTime: 0
  });

  const debounceTimer = useRef<NodeJS.Timeout>();
  const searchCache = useRef<Map<string, { data: T; timestamp: number }>>(new Map());
  const searchTimes = useRef<number[]>([]);
  const cacheHits = useRef(0);
  const totalSearches = useRef(0);

  // Debounce search query
  const setSearchQuery = useCallback((query: string) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);
  }, [debounceMs]);

  // Enhanced search function with caching and metrics
  const enhancedSearchFn = useCallback(async (query: string): Promise<T> => {
    const startTime = Date.now();
    totalSearches.current++;

    // Check cache first
    const cacheKey = query.toLowerCase().trim();
    const cached = searchCache.current.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < cacheTime) {
      cacheHits.current++;
      const responseTime = Date.now() - startTime;
      searchTimes.current.push(responseTime);
      
      // Update metrics
      setMetrics(prev => ({
        searchCount: totalSearches.current,
        averageResponseTime: searchTimes.current.reduce((a, b) => a + b, 0) / searchTimes.current.length,
        cacheHitRate: (cacheHits.current / totalSearches.current) * 100,
        lastSearchTime: responseTime
      }));

      return cached.data;
    }

    // Perform actual search
    try {
      const result = await searchFn(query);
      const responseTime = Date.now() - startTime;
      
      // Cache the result
      if (searchCache.current.size >= maxCacheSize) {
        // Remove oldest entries
        const entries = Array.from(searchCache.current.entries());
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        const toRemove = entries.slice(0, Math.floor(maxCacheSize * 0.2)); // Remove 20%
        toRemove.forEach(([key]) => searchCache.current.delete(key));
      }
      
      searchCache.current.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      // Update performance metrics
      searchTimes.current.push(responseTime);
      if (searchTimes.current.length > 100) {
        searchTimes.current = searchTimes.current.slice(-50); // Keep last 50 measurements
      }

      setMetrics(prev => ({
        searchCount: totalSearches.current,
        averageResponseTime: searchTimes.current.reduce((a, b) => a + b, 0) / searchTimes.current.length,
        cacheHitRate: (cacheHits.current / totalSearches.current) * 100,
        lastSearchTime: responseTime
      }));

      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      searchTimes.current.push(responseTime);
      throw error;
    }
  }, [searchFn, cacheTime, maxCacheSize]);

  // React Query integration
  const queryResult = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => enhancedSearchFn(debouncedQuery),
    enabled: debouncedQuery.length >= minSearchLength,
    staleTime,
    cacheTime,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Clear cache function
  const clearCache = useCallback(() => {
    searchCache.current.clear();
    cacheHits.current = 0;
    totalSearches.current = 0;
    searchTimes.current = [];
    setMetrics({
      searchCount: 0,
      averageResponseTime: 0,
      cacheHitRate: 0,
      lastSearchTime: 0
    });
  }, []);

  // Prefetch function for predictive loading
  const prefetch = useCallback(async (query: string) => {
    if (query.length >= minSearchLength) {
      try {
        await enhancedSearchFn(query);
      } catch (error) {
        // Silently fail for prefetch operations
        console.debug('Prefetch failed for query:', query, error);
      }
    }
  }, [enhancedSearchFn, minSearchLength]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return {
    setSearchQuery,
    debouncedQuery,
    ...queryResult,
    metrics,
    clearCache,
    prefetch,
    isSearching: queryResult.isFetching,
    hasResults: !!queryResult.data,
    cacheSize: searchCache.current.size
  };
}

/**
 * Hook for search suggestions with performance optimization
 */
export function useSearchSuggestions(
  getSuggestionsFn: (query: string) => Promise<string[]>,
  options: SearchPerformanceOptions = {}
) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  
  const {
    setSearchQuery,
    debouncedQuery,
    data,
    isLoading,
    error
  } = useSearchPerformance(getSuggestionsFn, {
    debounceMs: 150, // Faster for suggestions
    minSearchLength: 2,
    ...options
  });

  useEffect(() => {
    if (data) {
      setSuggestions(data);
      setIsLoadingSuggestions(false);
    } else if (isLoading) {
      setIsLoadingSuggestions(true);
    } else {
      setIsLoadingSuggestions(false);
    }
  }, [data, isLoading]);

  const getSuggestions = useCallback((query: string) => {
    setSearchQuery(query);
  }, [setSearchQuery]);

  return {
    suggestions,
    getSuggestions,
    isLoadingSuggestions,
    suggestionsError: error,
    debouncedQuery
  };
}

export default useSearchPerformance;