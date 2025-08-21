/**
 * Advanced Search Hook
 * Manages advanced search and filter state with URL persistence
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ClubApplicationFilters, AdvancedSearchConfig } from '@/types';

interface UseAdvancedSearchOptions {
  defaultFilters?: Partial<ClubApplicationFilters>;
  persistToUrl?: boolean;
}

interface UseAdvancedSearchReturn {
  // Current filter state
  filters: ClubApplicationFilters;
  searchConfig: AdvancedSearchConfig;
  
  // Filter update functions
  updateSearch: (searchTerm: string) => void;
  updateSearchFields: (fields: ('name' | 'email' | 'description')[]) => void;
  updateDateRange: (from?: Date, to?: Date) => void;
  updateStatus: (status: 'pending' | 'approved' | 'rejected' | 'all') => void;
  updateLocation: (location?: string) => void;
  updateSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  
  // Combined filter operations
  updateFilters: (newFilters: Partial<ClubApplicationFilters>) => void;
  clearFilters: () => void;
  clearSearch: () => void;
  
  // State helpers
  hasActiveFilters: boolean;
  hasActiveSearch: boolean;
  isFiltered: boolean;
}

const DEFAULT_SEARCH_CONFIG: AdvancedSearchConfig = {
  searchTerm: '',
  searchFields: ['name', 'email', 'description'],
  dateRange: {},
  status: 'pending',
  sortBy: 'created_at',
  sortOrder: 'desc',
};

const DEFAULT_FILTERS: ClubApplicationFilters = {
  status: 'pending',
  search: '',
  limit: 10,
  offset: 0,
  search_fields: ['name', 'email', 'description'],
  sort_by: 'created_at',
  sort_order: 'desc',
};

export function useAdvancedSearch(options: UseAdvancedSearchOptions = {}): UseAdvancedSearchReturn {
  const { defaultFilters = {}, persistToUrl = true } = options;
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Initialize filters from URL params or defaults
  const initializeFilters = useCallback((): ClubApplicationFilters => {
    if (!persistToUrl) {
      return { ...DEFAULT_FILTERS, ...defaultFilters };
    }

    const urlFilters: Partial<ClubApplicationFilters> = {};
    
    // Parse URL parameters
    const status = searchParams.get('status') as ClubApplicationFilters['status'];
    if (status && ['pending', 'approved', 'rejected', 'all'].includes(status)) {
      urlFilters.status = status;
    }
    
    const search = searchParams.get('search');
    if (search) urlFilters.search = search;
    
    const dateFrom = searchParams.get('date_from');
    if (dateFrom) urlFilters.date_from = dateFrom;
    
    const dateTo = searchParams.get('date_to');
    if (dateTo) urlFilters.date_to = dateTo;
    
    const location = searchParams.get('location');
    if (location) urlFilters.location = location;
    
    const searchFields = searchParams.get('search_fields');
    if (searchFields) {
      const fields = searchFields.split(',').filter(field => 
        ['name', 'email', 'description'].includes(field)
      ) as ('name' | 'email' | 'description')[];
      if (fields.length > 0) urlFilters.search_fields = fields;
    }
    
    const sortBy = searchParams.get('sort_by');
    if (sortBy && ['name', 'created_at', 'application_status', 'location'].includes(sortBy)) {
      urlFilters.sort_by = sortBy as ClubApplicationFilters['sort_by'];
    }
    
    const sortOrder = searchParams.get('sort_order');
    if (sortOrder && ['asc', 'desc'].includes(sortOrder)) {
      urlFilters.sort_order = sortOrder as 'asc' | 'desc';
    }
    
    const limit = searchParams.get('limit');
    if (limit && !isNaN(parseInt(limit))) {
      urlFilters.limit = parseInt(limit);
    }
    
    return { ...DEFAULT_FILTERS, ...defaultFilters, ...urlFilters };
  }, [searchParams, defaultFilters, persistToUrl]);

  const [filters, setFilters] = useState<ClubApplicationFilters>(initializeFilters);

  // Update URL when filters change
  useEffect(() => {
    if (!persistToUrl) return;

    const newParams = new URLSearchParams();
    
    // Only add non-default values to URL
    if (filters.status && filters.status !== 'pending') {
      newParams.set('status', filters.status);
    }
    
    if (filters.search && filters.search.trim()) {
      newParams.set('search', filters.search.trim());
    }
    
    if (filters.date_from) {
      newParams.set('date_from', filters.date_from);
    }
    
    if (filters.date_to) {
      newParams.set('date_to', filters.date_to);
    }
    
    if (filters.location && filters.location.trim()) {
      newParams.set('location', filters.location.trim());
    }
    
    if (filters.search_fields && 
        JSON.stringify(filters.search_fields) !== JSON.stringify(['name', 'email', 'description'])) {
      newParams.set('search_fields', filters.search_fields.join(','));
    }
    
    if (filters.sort_by && filters.sort_by !== 'created_at') {
      newParams.set('sort_by', filters.sort_by);
    }
    
    if (filters.sort_order && filters.sort_order !== 'desc') {
      newParams.set('sort_order', filters.sort_order);
    }
    
    if (filters.limit && filters.limit !== 10) {
      newParams.set('limit', filters.limit.toString());
    }

    // Update URL without triggering navigation
    setSearchParams(newParams, { replace: true });
  }, [filters, persistToUrl, setSearchParams]);

  // Create search config from filters
  const searchConfig = useMemo((): AdvancedSearchConfig => ({
    searchTerm: filters.search || '',
    searchFields: filters.search_fields || ['name', 'email', 'description'],
    dateRange: {
      from: filters.date_from ? new Date(filters.date_from) : undefined,
      to: filters.date_to ? new Date(filters.date_to) : undefined,
    },
    location: filters.location,
    status: filters.status || 'pending',
    sortBy: filters.sort_by || 'created_at',
    sortOrder: filters.sort_order || 'desc',
  }), [filters]);

  // Update functions
  const updateSearch = useCallback((searchTerm: string) => {
    setFilters(prev => ({
      ...prev,
      search: searchTerm,
      offset: 0, // Reset pagination
    }));
  }, []);

  const updateSearchFields = useCallback((fields: ('name' | 'email' | 'description')[]) => {
    setFilters(prev => ({
      ...prev,
      search_fields: fields.length > 0 ? fields : ['name', 'email', 'description'],
      offset: 0,
    }));
  }, []);

  const updateDateRange = useCallback((from?: Date, to?: Date) => {
    setFilters(prev => ({
      ...prev,
      date_from: from ? from.toISOString().split('T')[0] : undefined,
      date_to: to ? to.toISOString().split('T')[0] : undefined,
      offset: 0,
    }));
  }, []);

  const updateStatus = useCallback((status: 'pending' | 'approved' | 'rejected' | 'all') => {
    setFilters(prev => ({
      ...prev,
      status,
      offset: 0,
    }));
  }, []);

  const updateLocation = useCallback((location?: string) => {
    setFilters(prev => ({
      ...prev,
      location: location?.trim() || undefined,
      offset: 0,
    }));
  }, []);

  const updateSort = useCallback((sortBy: string, sortOrder: 'asc' | 'desc') => {
    setFilters(prev => ({
      ...prev,
      sort_by: sortBy as ClubApplicationFilters['sort_by'],
      sort_order: sortOrder,
      offset: 0,
    }));
  }, []);

  const updateFilters = useCallback((newFilters: Partial<ClubApplicationFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      offset: 0, // Reset pagination when filters change
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ ...DEFAULT_FILTERS, ...defaultFilters });
  }, [defaultFilters]);

  const clearSearch = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      search: '',
      search_fields: ['name', 'email', 'description'],
      offset: 0,
    }));
  }, []);

  // State helpers
  const hasActiveSearch = useMemo(() => {
    return !!(filters.search && filters.search.trim());
  }, [filters.search]);

  const hasActiveFilters = useMemo(() => {
    return !!(
      filters.date_from ||
      filters.date_to ||
      filters.location ||
      (filters.status && filters.status !== 'pending') ||
      (filters.search_fields && 
       JSON.stringify(filters.search_fields) !== JSON.stringify(['name', 'email', 'description']))
    );
  }, [filters]);

  const isFiltered = useMemo(() => {
    return hasActiveSearch || hasActiveFilters;
  }, [hasActiveSearch, hasActiveFilters]);

  return {
    filters,
    searchConfig,
    updateSearch,
    updateSearchFields,
    updateDateRange,
    updateStatus,
    updateLocation,
    updateSort,
    updateFilters,
    clearFilters,
    clearSearch,
    hasActiveFilters,
    hasActiveSearch,
    isFiltered,
  };
}