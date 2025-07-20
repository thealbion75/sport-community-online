/**
 * Volunteer Search Component
 * Allows clubs to search for and find suitable volunteers
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Filter, Users, MapPin, SlidersHorizontal, UserPlus } from 'lucide-react';
import { useSearchVolunteers } from '@/hooks/use-volunteers';
import { VolunteerCard } from './VolunteerCard';
import { VolunteerFilters } from './VolunteerFilters';
import { Pagination } from '@/components/ui/pagination';
import type { VolunteerFilters as VolunteerFiltersType } from '@/types';

interface VolunteerSearchProps {
  onContactVolunteer?: (volunteerId: string) => void;
  onViewVolunteer?: (volunteerId: string) => void;
  onInviteVolunteer?: (volunteerId: string) => void;
}

export const VolunteerSearch: React.FC<VolunteerSearchProps> = ({
  onContactVolunteer,
  onViewVolunteer,
  onInviteVolunteer
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<VolunteerFiltersType>({});
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const itemsPerPage = 12;

  // Combine search query with filters
  const combinedFilters: VolunteerFiltersType = {
    ...filters,
    ...(searchQuery && { location: searchQuery }) // Simple search implementation
  };

  const { 
    data: volunteersData, 
    isLoading, 
    error 
  } = useSearchVolunteers(combinedFilters, currentPage, itemsPerPage);

  const volunteers = volunteersData?.data || [];
  const totalPages = volunteersData?.total_pages || 1;
  const totalCount = volunteersData?.count || 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleFilterChange = (newFilters: VolunteerFiltersType) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearchQuery('');
    setCurrentPage(1);
  };

  const activeFilterCount = Object.values(filters).filter(value => 
    value !== undefined && value !== '' && 
    (Array.isArray(value) ? value.length > 0 : true)
  ).length;

  if (error) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="text-center py-8">
          <div className="text-red-600 mb-4">
            <Search className="h-12 w-12 mx-auto mb-2" />
            <h3 className="text-lg font-medium">Error loading volunteers</h3>
            <p className="text-sm">{error.message}</p>
          </div>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Find Volunteers</h1>
          <p className="text-gray-600 mt-1">
            Search for volunteers who match your club's needs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {totalCount} volunteers
          </Badge>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by location, skills, or keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </form>

            {/* Filter Toggle */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>

            {/* Clear Filters */}
            {(activeFilterCount > 0 || searchQuery) && (
              <Button variant="ghost" onClick={handleClearFilters}>
                Clear All
              </Button>
            )}
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t">
              <VolunteerFilters
                filters={filters}
                onFiltersChange={handleFilterChange}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        {/* Results Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-600">
              {isLoading ? 'Loading...' : `Showing ${volunteers.length} of ${totalCount} volunteers`}
            </p>
            {currentPage > 1 && (
              <p className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </p>
            )}
          </div>

          {/* View Mode Toggle */}
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'grid' | 'list')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="grid">Grid</TabsTrigger>
              <TabsTrigger value="list">List</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/3 mt-4"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* No Results */}
        {!isLoading && volunteers.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No volunteers found</h3>
              <p className="text-gray-600 mb-6">
                {searchQuery || activeFilterCount > 0
                  ? 'Try adjusting your search criteria or filters'
                  : 'No volunteers match your current criteria'
                }
              </p>
              {(searchQuery || activeFilterCount > 0) && (
                <Button onClick={handleClearFilters}>
                  Clear Search & Filters
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Volunteers Grid/List */}
        {!isLoading && volunteers.length > 0 && (
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }>
            {volunteers.map((volunteer) => (
              <VolunteerCard
                key={volunteer.id}
                volunteer={volunteer}
                viewMode={viewMode}
                onContact={() => onContactVolunteer?.(volunteer.id)}
                onView={() => onViewVolunteer?.(volunteer.id)}
                onInvite={() => onInviteVolunteer?.(volunteer.id)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Search Tips */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Recruitment Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <ul className="space-y-1 text-gray-700">
            <li>• Use specific skill filters to find volunteers with relevant experience</li>
            <li>• Search by location to find volunteers near your club</li>
            <li>• Check availability filters to match your opportunity timing</li>
            <li>• Contact volunteers directly to discuss opportunities</li>
            <li>• Be clear about time commitments and expectations</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};