/**
 * Application List Component
 * Display list of volunteer applications with filtering and sorting
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { LoadingContainer } from '@/components/ui/loading-state';
import { ApplicationStatus } from './ApplicationStatus';
import { VolunteerApplication } from '@/types';
import { 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';

interface ApplicationListProps {
  applications: VolunteerApplication[];
  isLoading?: boolean;
  onViewDetails?: (applicationId: string) => void;
  onMessage?: (applicationId: string) => void;
  showStats?: boolean;
}

type SortOption = 'date-desc' | 'date-asc' | 'status' | 'title';
type FilterOption = 'all' | 'pending' | 'accepted' | 'rejected' | 'withdrawn';

export function ApplicationList({ 
  applications, 
  isLoading = false,
  onViewDetails,
  onMessage,
  showStats = true
}: ApplicationListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterOption>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');

  // Filter and sort applications
  const filteredAndSortedApplications = useMemo(() => {
    let filtered = applications;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(app => 
        app.opportunity?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.opportunity?.club?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime();
        case 'date-asc':
          return new Date(a.applied_at).getTime() - new Date(b.applied_at).getTime();
        case 'status':
          return a.status.localeCompare(b.status);
        case 'title':
          return (a.opportunity?.title || '').localeCompare(b.opportunity?.title || '');
        default:
          return 0;
      }
    });

    return filtered;
  }, [applications, searchTerm, statusFilter, sortBy]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = applications.length;
    const pending = applications.filter(app => app.status === 'pending').length;
    const accepted = applications.filter(app => app.status === 'accepted').length;
    const rejected = applications.filter(app => app.status === 'rejected').length;
    const withdrawn = applications.filter(app => app.status === 'withdrawn').length;

    return { total, pending, accepted, rejected, withdrawn };
  }, [applications]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      case 'withdrawn':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <LoadingContainer isLoading={true} loadingText="Loading your applications..." />
    );
  }

  if (applications.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Applications Yet
            </h3>
            <p className="text-gray-600 mb-4">
              You haven't applied to any volunteer opportunities yet. 
              Start browsing opportunities to find the perfect match!
            </p>
            <Button onClick={() => window.location.href = '/volunteer-opportunities'}>
              Browse Opportunities
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      {showStats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Accepted</p>
                  <p className="text-2xl font-bold text-green-600">{stats.accepted}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Rejected</p>
                  <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Withdrawn</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.withdrawn}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by opportunity title or club name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={(value: FilterOption) => setStatusFilter(value)}>
              <SelectTrigger className="w-full lg:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Applications</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="withdrawn">Withdrawn</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
              <SelectTrigger className="w-full lg:w-48">
                {sortBy.includes('desc') ? (
                  <SortDesc className="h-4 w-4 mr-2" />
                ) : (
                  <SortAsc className="h-4 w-4 mr-2" />
                )}
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Newest First</SelectItem>
                <SelectItem value="date-asc">Oldest First</SelectItem>
                <SelectItem value="status">By Status</SelectItem>
                <SelectItem value="title">By Title</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active Filters */}
          {(searchTerm || statusFilter !== 'all') && (
            <div className="flex flex-wrap gap-2 mt-4">
              {searchTerm && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Search className="h-3 w-3" />
                  Search: "{searchTerm}"
                  <button
                    onClick={() => setSearchTerm('')}
                    className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                  >
                    ×
                  </button>
                </Badge>
              )}
              
              {statusFilter !== 'all' && (
                <Badge variant="outline" className="flex items-center gap-1">
                  {getStatusIcon(statusFilter)}
                  Status: {statusFilter}
                  <button
                    onClick={() => setStatusFilter('all')}
                    className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                  >
                    ×
                  </button>
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Showing {filteredAndSortedApplications.length} of {applications.length} applications
          </p>
        </div>

        {filteredAndSortedApplications.length > 0 ? (
          <div className="space-y-4">
            {filteredAndSortedApplications.map((application) => (
              <ApplicationStatus
                key={application.id}
                application={application}
                onViewDetails={() => onViewDetails?.(application.id)}
                onMessage={() => onMessage?.(application.id)}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Search className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">
                  No applications match your current filters.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                  }}
                  className="mt-2"
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}