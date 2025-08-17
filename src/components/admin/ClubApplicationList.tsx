/**
 * ClubApplicationList Component
 * Displays a list of club applications with filtering, sorting, and pagination
 */

import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, Eye } from 'lucide-react';
import { 
  usePendingApplications, 
  useAllApplications,
  usePendingApplicationsOnly,
  useApprovedApplications,
  useRejectedApplications
} from '@/hooks/use-club-approval';
import { ClubApplicationFilters, Club } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';

interface ClubApplicationListProps {
  onApplicationSelect?: (clubId: string) => void;
  className?: string;
}

type SortField = 'name' | 'created_at' | 'application_status';
type SortDirection = 'asc' | 'desc';

export const ClubApplicationList: React.FC<ClubApplicationListProps> = ({
  onApplicationSelect,
  className
}) => {
  // State for filters and sorting
  const [filters, setFilters] = useState<ClubApplicationFilters>({
    status: 'pending',
    search: '',
    limit: 10,
    offset: 0
  });
  
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate offset based on current page
  const currentFilters = useMemo(() => ({
    ...filters,
    offset: (currentPage - 1) * (filters.limit || 10)
  }), [filters, currentPage]);

  // Select appropriate hook based on status filter
  const queryHook = useMemo(() => {
    switch (filters.status) {
      case 'pending':
        return usePendingApplicationsOnly;
      case 'approved':
        return useApprovedApplications;
      case 'rejected':
        return useRejectedApplications;
      case 'all':
        return useAllApplications;
      default:
        return usePendingApplications;
    }
  }, [filters.status]);

  // Fetch applications data
  const { data: applicationsData, isLoading, error } = queryHook(currentFilters);

  // Sort applications client-side
  const sortedApplications = useMemo(() => {
    if (!applicationsData?.data) return [];
    
    const sorted = [...applicationsData.data].sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'created_at':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case 'application_status':
          aValue = a.application_status;
          bValue = b.application_status;
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sorted;
  }, [applicationsData?.data, sortField, sortDirection]);

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setFilters(prev => ({ ...prev, search: value, offset: 0 }));
    setCurrentPage(1);
  };

  // Handle status filter change
  const handleStatusChange = (status: string) => {
    setFilters(prev => ({ 
      ...prev, 
      status: status as ClubApplicationFilters['status'],
      offset: 0 
    }));
    setCurrentPage(1);
  };

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: Club['application_status']) => {
    switch (status) {
      case 'approved':
        return 'default'; // Green
      case 'rejected':
        return 'destructive'; // Red
      case 'pending':
        return 'secondary'; // Gray
      default:
        return 'outline';
    }
  };

  // Get sort icon
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortDirection === 'asc' ? 
      <ArrowUp className="h-4 w-4" /> : 
      <ArrowDown className="h-4 w-4" />;
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Club Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-32" />
            </div>
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Club Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Failed to load applications. Please try again.
            </p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalPages = applicationsData?.total_pages || 0;
  const hasApplications = sortedApplications.length > 0;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Club Applications
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by club name or email..."
              value={filters.search || ''}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filters.status || 'pending'} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="all">All Applications</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Applications Table */}
        {hasApplications ? (
          <div className="space-y-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('name')}
                        className="h-auto p-0 font-medium hover:bg-transparent"
                      >
                        Club Name
                        {getSortIcon('name')}
                      </Button>
                    </TableHead>
                    <TableHead className="hidden md:table-cell">Contact</TableHead>
                    <TableHead className="hidden lg:table-cell">Location</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('application_status')}
                        className="h-auto p-0 font-medium hover:bg-transparent"
                      >
                        Status
                        {getSortIcon('application_status')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('created_at')}
                        className="h-auto p-0 font-medium hover:bg-transparent"
                      >
                        Submitted
                        {getSortIcon('created_at')}
                      </Button>
                    </TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedApplications.map((application) => (
                    <TableRow key={application.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div>
                          <div className="font-medium">{application.name}</div>
                          <div className="text-sm text-muted-foreground md:hidden">
                            {application.contact_email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="space-y-1">
                          <div className="text-sm">{application.contact_email}</div>
                          {application.contact_phone && (
                            <div className="text-sm text-muted-foreground">
                              {application.contact_phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="text-sm">{application.location}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(application.application_status)}>
                          {application.application_status.charAt(0).toUpperCase() + 
                           application.application_status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(application.created_at), 'MMM d, yyyy')}
                        </div>
                        <div className="text-xs text-muted-foreground lg:hidden">
                          {application.location}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onApplicationSelect?.(application.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View application</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  className="justify-center"
                />
              </div>
            )}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
              <Filter className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">
              {filters.status === 'pending' ? 'No pending applications' :
               filters.status === 'approved' ? 'No approved applications' :
               filters.status === 'rejected' ? 'No rejected applications' :
               'No applications found'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {filters.search ? 
                'Try adjusting your search terms or filters.' :
                'Applications will appear here when clubs register.'}
            </p>
            {filters.search && (
              <Button 
                variant="outline" 
                onClick={() => handleSearchChange('')}
              >
                Clear Search
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ClubApplicationList;