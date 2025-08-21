/**
 * URL Filter State Management Hook
 * Manages filter state with URL persistence for better user experience
 */

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ClubApplicationFilters } from '@/types';

interface UseUrlFiltersOptions {
  defaultFilters?: Partial<ClubApplicationFilters>;
  debounceMs?: number;
}

export function useUrlFilters(options: UseUrlFiltersOptions = {}) {
  const { defaultFilters = {}, debounceMs = 300 } = options;
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Initialize filters from URL or defaults
  const initializeFilters = useCallback((): ClubApplicationFilters => {
    const urlFilters: ClubApplicationFilters = {};
    
    // Parse URL parameters
    const status = searchParams.get('status');
    if (status && ['pending', 'approved', 'rejected', 'all'].includes(status)) {
      urlFilters.status = status as ClubApplicationFilters['status'];
    }
    
    const search = searchParams.get('search');
    if (search) {
      urlFilters.search = search;
    }
    
    const searchFields = searchParams.get('search_fields');
    if (searchFields) {
      const fields = searchFields.split(',').filter(field => 
        ['name', 'email', 'description'].includes(field)
      );
      if (fields.length > 0) {
        urlFilters.search_fields = fields as ('name' | 'email' | 'description')[];
      }
    }
    
    const dateFrom = searchParams.get('date_from');
    if (dateFrom && isValidDate(dateFrom)) {
      urlFilters.date_from = dateFrom;
    }
    
    const dateTo = searchParams.get('date_to');
    if (dateTo && isValidDate(dateTo)) {
      urlFilters.date_to = dateTo;
    }
    
    const location = searchParams.get('location');
    if (location) {
      urlFilters.location = location;
    }
    
    const sortBy = searchParams.get('sort_by');
    if (sortBy && ['name', 'created_at', 'application_status', 'location'].includes(sortBy)) {
      urlFilters.sort_by = sortBy as ClubApplicationFilters['sort_by'];
    }
    
    const sortOrder = searchParams.get('sort_order');
    if (sortOrder && ['asc', 'desc'].includes(sortOrder)) {
      urlFilters.sort_order = sortOrder as ClubApplicationFilters['sort_order'];
    }
    
    const limit = searchParams.get('limit');
    if (limit && !isNaN(Number(limit))) {
      urlFilters.limit = Number(limit);
    }
    
    const offset = searchParams.get('offset');
    if (offset && !isNaN(Number(offset))) {
      urlFilters.offset = Number(offset);
    }
    
    // Merge with defaults
    return {
      status: 'pending',
      limit: 10,
      offset: 0,
      ...defaultFilters,
      ...urlFilters
    };
  }, [searchParams, defaultFilters]);
  
  const [filters, setFilters] = useState<ClubApplicationFilters>(initializeFilters);
  
  // Update URL when filters change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      const newSearchParams = new URLSearchParams();
      
      // Only add non-default values to URL
      if (filters.status && filters.status !== 'pending') {
        newSearchParams.set('status', filters.status);
      }
      
      if (filters.search) {
        newSearchParams.set('search', filters.search);
      }
      
      if (filters.search_fields && filters.search_fields.length > 0) {
        // Only add if not the default (all fields)
        if (filters.search_fields.length !== 3 || 
            !filters.search_fields.includes('name') ||
            !filters.search_fields.includes('email') ||
            !filters.search_fields.includes('description')) {
          newSearchParams.set('search_fields', filters.search_fields.join(','));
        }
      }
      
      if (filters.date_from) {
        newSearchParams.set('date_from', filters.date_from);
      }
      
      if (filters.date_to) {
        newSearchParams.set('date_to', filters.date_to);
      }
      
      if (filters.location) {
        newSearchParams.set('location', filters.location);
      }
      
      if (filters.sort_by && filters.sort_by !== 'created_at') {
        newSearchParams.set('sort_by', filters.sort_by);
      }
      
      if (filters.sort_order && filters.sort_order !== 'desc') {
        newSearchParams.set('sort_order', filters.sort_order);
      }
      
      if (filters.limit && filters.limit !== 10) {
        newSearchParams.set('limit', filters.limit.toString());
      }
      
      if (filters.offset && filters.offset !== 0) {
        newSearchParams.set('offset', filters.offset.toString());
      }
      
      // Update URL without causing navigation
      setSearchParams(newSearchParams, { replace: true });
    }, debounceMs);
    
    return () => clearTimeout(timer);
  }, [filters, setSearchParams, debounceMs]);
  
  // Update filters function
  const updateFilters = useCallback((newFilters: Partial<ClubApplicationFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);
  
  // Clear all filters
  const clearFilters = useCallback(() => {
    const clearedFilters: ClubApplicationFilters = {
      status: 'pending',
      limit: 10,
      offset: 0,
      ...defaultFilters
    };
    setFilters(clearedFilters);
  }, [defaultFilters]);
  
  // Reset pagination
  const resetPagination = useCallback(() => {
    setFilters(prev => ({ ...prev, offset: 0 }));
  }, []);
  
  return {
    filters,
    updateFilters,
    clearFilters,
    resetPagination,
    setFilters
  };
}

// Helper function to validate date strings
function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

export default useUrlFilters;