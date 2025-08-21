/**
 * Advanced Search and Filters Component
 * Provides comprehensive search and filtering capabilities for club applications
 */

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  Search, 
  Filter, 
  X, 
  Calendar,
  MapPin,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AdvancedSearchConfig, ClubApplicationFilters } from '@/types';
import { EnhancedSearchInput } from './EnhancedSearchInput';
import { SearchAnalytics } from './SearchAnalytics';
import { useSearchPerformance } from '@/hooks/use-search-performance';

interface AdvancedSearchFiltersProps {
  filters: ClubApplicationFilters;
  onFiltersChange: (filters: ClubApplicationFilters) => void;
  onClearFilters: () => void;
  className?: string;
  showAnalytics?: boolean;
}

export const AdvancedSearchFilters: React.FC<AdvancedSearchFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  className,
  showAnalytics = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [selectedSearchFields, setSelectedSearchFields] = useState<string[]>(
    filters.search_fields || ['name', 'email', 'description']
  );
  const [dateFrom, setDateFrom] = useState<Date | undefined>(
    filters.date_from ? new Date(filters.date_from) : undefined
  );
  const [dateTo, setDateTo] = useState<Date | undefined>(
    filters.date_to ? new Date(filters.date_to) : undefined
  );
  const [location, setLocation] = useState(filters.location || '');
  const [fuzzySearch, setFuzzySearch] = useState(false);
  const [showSearchAnalytics, setShowSearchAnalytics] = useState(false);

  // Mock search function for analytics (in real app, this would be your actual search API)
  const mockSearchFn = async (query: string) => {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 50));
    return { results: [], count: 0 };
  };

  const { metrics, cacheSize } = useSearchPerformance(mockSearchFn, {
    debounceMs: 300,
    minSearchLength: 1
  });

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      onFiltersChange({
        ...filters,
        search: searchTerm || undefined,
        search_fields: selectedSearchFields.length > 0 ? selectedSearchFields as ('name' | 'email' | 'description')[] : undefined,
        date_from: dateFrom ? format(dateFrom, 'yyyy-MM-dd') : undefined,
        date_to: dateTo ? format(dateTo, 'yyyy-MM-dd') : undefined,
        location: location || undefined,
        offset: 0 // Reset pagination when filters change
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, selectedSearchFields, dateFrom, dateTo, location]);

  const handleSearchFieldToggle = (field: string, checked: boolean) => {
    if (checked) {
      setSelectedSearchFields(prev => [...prev, field]);
    } else {
      setSelectedSearchFields(prev => prev.filter(f => f !== field));
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  const handleClearDateRange = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const handleClearLocation = () => {
    setLocation('');
  };

  const handleClearAll = () => {
    setSearchTerm('');
    setSelectedSearchFields(['name', 'email', 'description']);
    setDateFrom(undefined);
    setDateTo(undefined);
    setLocation('');
    onClearFilters();
  };

  // Count active filters
  const activeFiltersCount = [
    searchTerm,
    dateFrom || dateTo,
    location,
    filters.status !== 'pending' ? filters.status : null
  ].filter(Boolean).length;

  const hasAdvancedFilters = dateFrom || dateTo || location || selectedSearchFields.length !== 3;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Search className="h-4 w-4" />
            Search & Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount} active
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {showAnalytics && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSearchAnalytics(!showSearchAnalytics)}
                className="h-8 px-2"
              >
                <BarChart3 className="h-3 w-3 mr-1" />
                Analytics
              </Button>
            )}
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="h-8 px-2"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Clear All
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 px-2"
            >
              <Filter className="h-3 w-3 mr-1" />
              Advanced
              {isExpanded ? (
                <ChevronUp className="h-3 w-3 ml-1" />
              ) : (
                <ChevronDown className="h-3 w-3 ml-1" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Enhanced Search */}
        <div className="space-y-2">
          <Label htmlFor="search">Search Applications</Label>
          <EnhancedSearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            onSearchFieldsChange={setSelectedSearchFields}
            searchFields={selectedSearchFields}
            placeholder="Search by club name, email, or description..."
            fuzzySearch={fuzzySearch}
            onFuzzySearchChange={setFuzzySearch}
            suggestions={[
              'Football Club',
              'Basketball Association',
              'Tennis Club',
              'Swimming Club',
              'Athletics Club'
            ]}
          />
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <Label>Application Status</Label>
          <Select 
            value={filters.status || 'pending'} 
            onValueChange={(value) => onFiltersChange({ 
              ...filters, 
              status: value as ClubApplicationFilters['status'],
              offset: 0 
            })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending Applications</SelectItem>
              <SelectItem value="approved">Approved Applications</SelectItem>
              <SelectItem value="rejected">Rejected Applications</SelectItem>
              <SelectItem value="all">All Applications</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Advanced Filters */}
        {isExpanded && (
          <div className="space-y-4 pt-2">
            <Separator />
            
            {/* Search Fields Selection */}
            <div className="space-y-3">
              <Label>Search In</Label>
              <div className="flex flex-wrap gap-3">
                {[
                  { id: 'name', label: 'Club Name' },
                  { id: 'email', label: 'Contact Email' },
                  { id: 'description', label: 'Description' }
                ].map((field) => (
                  <div key={field.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`search-${field.id}`}
                      checked={selectedSearchFields.includes(field.id)}
                      onCheckedChange={(checked) => 
                        handleSearchFieldToggle(field.id, checked as boolean)
                      }
                    />
                    <Label 
                      htmlFor={`search-${field.id}`}
                      className="text-sm font-normal"
                    >
                      {field.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Date Range Filter */}
            <div className="space-y-3">
              <Label>Application Date Range</Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="justify-start text-left font-normal flex-1"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, 'MMM d, yyyy') : 'From date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={dateFrom}
                      onSelect={setDateFrom}
                      disabled={(date) => 
                        date > new Date() || (dateTo && date > dateTo)
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="justify-start text-left font-normal flex-1"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, 'MMM d, yyyy') : 'To date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={dateTo}
                      onSelect={setDateTo}
                      disabled={(date) => 
                        date > new Date() || (dateFrom && date < dateFrom)
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                {(dateFrom || dateTo) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearDateRange}
                    className="px-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Location Filter */}
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="location"
                  placeholder="Filter by location..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="pl-10 pr-10"
                />
                {location && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearLocation}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Active Filters Summary */}
        {activeFiltersCount > 0 && (
          <div className="pt-2">
            <Separator className="mb-3" />
            <div className="flex flex-wrap gap-2">
              {searchTerm && (
                <Badge variant="secondary" className="gap-1">
                  Search: "{searchTerm}"
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearSearch}
                    className="h-4 w-4 p-0 hover:bg-transparent"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              
              {filters.status && filters.status !== 'pending' && (
                <Badge variant="secondary" className="gap-1">
                  Status: {filters.status}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onFiltersChange({ ...filters, status: 'pending', offset: 0 })}
                    className="h-4 w-4 p-0 hover:bg-transparent"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              
              {(dateFrom || dateTo) && (
                <Badge variant="secondary" className="gap-1">
                  Date: {dateFrom ? format(dateFrom, 'MMM d') : '...'} - {dateTo ? format(dateTo, 'MMM d') : '...'}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearDateRange}
                    className="h-4 w-4 p-0 hover:bg-transparent"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              
              {location && (
                <Badge variant="secondary" className="gap-1">
                  Location: {location}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearLocation}
                    className="h-4 w-4 p-0 hover:bg-transparent"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>

      {/* Search Analytics */}
      {showAnalytics && (
        <SearchAnalytics
          metrics={metrics}
          cacheSize={cacheSize}
          isVisible={showSearchAnalytics}
          onToggleVisibility={() => setShowSearchAnalytics(!showSearchAnalytics)}
          className="mt-4"
        />
      )}
    </Card>
  );
};

export default AdvancedSearchFilters;