/**
 * Opportunity Browser Component
 * Search and filter volunteer opportunities with pagination
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LoadingContainer, OpportunityCardSkeleton } from '@/components/ui/loading-state';
import { useOpportunities, useOpportunityCount } from '@/hooks/use-opportunities';
import { useSearchOpportunities } from '@/hooks/use-opportunities';
import { OpportunityCard } from '@/components/clubs/OpportunityCard';
import { SearchFilters } from './SearchFilters';
import { Pagination } from './Pagination';
import { OpportunityFilters } from '@/types';
import { 
  Search, 
  Filter, 
  MapPin, 
  Clock, 
  Users, 
  Briefcase,
  SlidersHorizontal,
  X
} from 'lucide-react';

const ITEMS_PER_PAGE = 12;

interface OpportunityBrowserProps {
  showClubInfo?: boolean;
  onApply?: (opportunityId: string) => void;
  onViewDetails?: (opportunityId: string) => void;
}

export function OpportunityBrowser({ 
  showClubInfo = true, 
  onApply, 
  onViewDetails 
}: OpportunityBrowserProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<OpportunityFilters>({});

  // Calculate pagination
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  // Fetch opportunities based on search or filters
  const shouldUseSearch = searchTerm.length > 2;
  
  const { 
    data: searchResults, 
    isLoading: searchLoading 
  } = useSearchOpportunities(searchTerm, shouldUseSearch ? 50 : undefined);
  
  const { 
    data: filteredOpportunities, 
    isLoading: filterLoading 
  } = useOpportunities({
    ...filters,
    limit: ITEMS_PER_PAGE,
    offset,
  });

  const { data: totalCount } = useOpportunityCount(filters);

  // Determine which data to use
  const opportunities = shouldUseSearch ? searchResults : filteredOpportunities;
  const isLoading = shouldUseSearch ? searchLoading : filterLoading;

  // Calculate pagination for search results
  const paginatedSearchResults = useMemo(() => {
    if (!shouldUseSearch || !searchResults) return [];
    return searchResults.slice(offset, offset + ITEMS_PER_PAGE);
  }, [shouldUseSearch, searchResults, offset]);

  const displayOpportunities = shouldUseSearch ? paginatedSearchResults : opportunities;
  const displayTotalCount = shouldUseSearch ? (searchResults?.length || 0) : (totalCount || 0);
  const totalPages = Math.ceil(displayTotalCount / ITEMS_PER_PAGE);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (newFilters: OpportunityFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
    setSearchTerm(''); // Clear search when filtering
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
    setCurrentPage(1);
  };

  const hasActiveFilters = Object.keys(filters).some(key => {
    const value = filters[key as keyof OpportunityFilters];
    return Array.isArray(value) ? value.length > 0 : !!value;
  }) || searchTerm.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Volunteer Opportunities</h1>
          <p className="text-gray-600 mt-1">
            Find meaningful ways to contribute to your local sports community
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Briefcase className="h-3 w-3" />
            {displayTotalCount} opportunities
          </Badge>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search opportunities by title, description, or club name..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Toggle */}
            <div className="flex gap-2">
              <Button
                variant={showFilters ? "default" : "outline"}
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-1">
                    Active
                  </Badge>
                )}
              </Button>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  onClick={clearFilters}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="mt-4 flex flex-wrap gap-2">
              {searchTerm && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Search className="h-3 w-3" />
                  Search: "{searchTerm}"
                  <button
                    onClick={() => setSearchTerm('')}
                    className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              
              {filters.location && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {filters.location}
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, location: undefined }))}
                    className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}

              {filters.time_commitment && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {filters.time_commitment}
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, time_commitment: undefined }))}
                    className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}

              {filters.required_skills && filters.required_skills.length > 0 && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {filters.required_skills.length} skill{filters.required_skills.length !== 1 ? 's' : ''}
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, required_skills: [] }))}
                    className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters Panel */}
      {showFilters && (
        <SearchFilters
          filters={filters}
          onFiltersChange={handleFilterChange}
          onClose={() => setShowFilters(false)}
        />
      )}

      {/* Results */}
      <LoadingContainer isLoading={isLoading} loadingText="Finding opportunities...">
        {displayOpportunities && displayOpportunities.length > 0 ? (
          <div className="space-y-6">
            {/* Results Info */}
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Showing {displayOpportunities.length} of {displayTotalCount} opportunities
                {currentPage > 1 && ` (Page ${currentPage} of ${totalPages})`}
              </p>
            </div>

            {/* Opportunity Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {displayOpportunities.map((opportunity) => (
                <OpportunityCard
                  key={opportunity.id}
                  opportunity={opportunity}
                  isOwner={false}
                  onApply={() => onApply?.(opportunity.id)}
                  onView={() => onViewDetails?.(opportunity.id)}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={ITEMS_PER_PAGE}
                totalItems={displayTotalCount}
              />
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {hasActiveFilters ? 'No opportunities match your criteria' : 'No opportunities available'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {hasActiveFilters 
                    ? 'Try adjusting your search terms or filters to find more opportunities.'
                    : 'Check back later for new volunteer opportunities from local sports clubs.'
                  }
                </p>
                {hasActiveFilters && (
                  <Button onClick={clearFilters} variant="outline">
                    Clear all filters
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </LoadingContainer>

      {/* Quick Stats */}
      {!isLoading && displayOpportunities && displayOpportunities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Stats</CardTitle>
            <CardDescription>Overview of available opportunities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {displayOpportunities.filter(opp => opp.is_recurring).length}
                </div>
                <div className="text-sm text-gray-600">Recurring</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {displayOpportunities.filter(opp => !opp.is_recurring).length}
                </div>
                <div className="text-sm text-gray-600">One-time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {new Set(displayOpportunities.map(opp => opp.club?.name).filter(Boolean)).size}
                </div>
                <div className="text-sm text-gray-600">Clubs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {new Set(displayOpportunities.flatMap(opp => opp.required_skills)).size}
                </div>
                <div className="text-sm text-gray-600">Skills</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}