/**
 * MobileFilters Component
 * Mobile-optimized filter interface for club applications
 */

import React, { useState } from 'react';
import { Filter, Search, X, Calendar, MapPin, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { ClubApplicationFilters } from '@/types';

interface MobileFiltersProps {
  filters: ClubApplicationFilters;
  onFiltersChange: (filters: ClubApplicationFilters) => void;
  onClearFilters: () => void;
  className?: string;
}

export const MobileFilters: React.FC<MobileFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);

  // Count active filters
  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'limit' || key === 'offset') return false;
    return value !== undefined && value !== '' && value !== null;
  }).length;

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    setIsOpen(false);
  };

  const handleClearFilters = () => {
    onClearFilters();
    setLocalFilters({});
    setIsOpen(false);
  };

  const updateLocalFilter = (key: keyof ClubApplicationFilters, value: any) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Quick Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search clubs..."
          value={filters.search || ''}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value, offset: 0 })}
          className="pl-10 h-12 touch-manipulation"
        />
        {filters.search && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onFiltersChange({ ...filters, search: '', offset: 0 })}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 touch-manipulation"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Filter Controls */}
      <div className="flex items-center gap-2">
        {/* Status Filter */}
        <Select
          value={filters.status || 'pending'}
          onValueChange={(value) => onFiltersChange({ ...filters, status: value as any, offset: 0 })}
        >
          <SelectTrigger className="flex-1 h-12 touch-manipulation">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="all">All Status</SelectItem>
          </SelectContent>
        </Select>

        {/* Advanced Filters Sheet */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="h-12 px-4 touch-manipulation relative"
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs flex items-center justify-center"
                >
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh]">
            <SheetHeader>
              <SheetTitle>Filter Applications</SheetTitle>
              <SheetDescription>
                Refine your search with advanced filters
              </SheetDescription>
            </SheetHeader>
            
            <div className="mt-6 space-y-6 pb-20">
              {/* Search */}
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Club name, email, or description..."
                    value={localFilters.search || ''}
                    onChange={(e) => updateLocalFilter('search', e.target.value)}
                    className="pl-10 h-12 touch-manipulation"
                  />
                </div>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label>Application Status</Label>
                <Select
                  value={localFilters.status || 'pending'}
                  onValueChange={(value) => updateLocalFilter('status', value)}
                >
                  <SelectTrigger className="h-12 touch-manipulation">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="all">All Applications</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="location"
                    placeholder="Filter by location..."
                    value={localFilters.location || ''}
                    onChange={(e) => updateLocalFilter('location', e.target.value)}
                    className="pl-10 h-12 touch-manipulation"
                  />
                </div>
              </div>

              {/* Date Range */}
              <div className="space-y-4">
                <Label>Application Date Range</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="date-from" className="text-sm">From</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="date-from"
                        type="date"
                        value={localFilters.date_from || ''}
                        onChange={(e) => updateLocalFilter('date_from', e.target.value)}
                        className="pl-10 h-12 touch-manipulation"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date-to" className="text-sm">To</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="date-to"
                        type="date"
                        value={localFilters.date_to || ''}
                        onChange={(e) => updateLocalFilter('date_to', e.target.value)}
                        className="pl-10 h-12 touch-manipulation"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sort Options */}
              <div className="space-y-2">
                <Label>Sort By</Label>
                <Select
                  value={`${localFilters.sort_by || 'created_at'}_${localFilters.sort_order || 'desc'}`}
                  onValueChange={(value) => {
                    const [sortBy, sortOrder] = value.split('_');
                    updateLocalFilter('sort_by', sortBy);
                    updateLocalFilter('sort_order', sortOrder);
                  }}
                >
                  <SelectTrigger className="h-12 touch-manipulation">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at_desc">Newest First</SelectItem>
                    <SelectItem value="created_at_asc">Oldest First</SelectItem>
                    <SelectItem value="name_asc">Club Name A-Z</SelectItem>
                    <SelectItem value="name_desc">Club Name Z-A</SelectItem>
                    <SelectItem value="application_status_asc">Status A-Z</SelectItem>
                    <SelectItem value="application_status_desc">Status Z-A</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                  className="flex-1 h-12 touch-manipulation"
                >
                  Clear All
                </Button>
                <Button
                  onClick={handleApplyFilters}
                  className="flex-1 h-12 touch-manipulation"
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Active Filter Tags */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <Badge variant="secondary" className="text-xs">
              Search: {filters.search}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onFiltersChange({ ...filters, search: '', offset: 0 })}
                className="ml-1 h-4 w-4 p-0 hover:bg-transparent"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {filters.location && (
            <Badge variant="secondary" className="text-xs">
              Location: {filters.location}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onFiltersChange({ ...filters, location: '', offset: 0 })}
                className="ml-1 h-4 w-4 p-0 hover:bg-transparent"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {filters.date_from && (
            <Badge variant="secondary" className="text-xs">
              From: {filters.date_from}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onFiltersChange({ ...filters, date_from: '', offset: 0 })}
                className="ml-1 h-4 w-4 p-0 hover:bg-transparent"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {filters.date_to && (
            <Badge variant="secondary" className="text-xs">
              To: {filters.date_to}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onFiltersChange({ ...filters, date_to: '', offset: 0 })}
                className="ml-1 h-4 w-4 p-0 hover:bg-transparent"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default MobileFilters;