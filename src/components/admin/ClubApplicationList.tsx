/**
 * ClubApplicationList Component
 * Displays a list of club applications with filtering, sorting, and pagination
 */

import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, Eye, CheckSquare, Square, Check, AlertCircle, Shield, RefreshCw } from 'lucide-react';
import { 
  usePendingApplications, 
  useAllApplications,
  usePendingApplicationsOnly,
  useApprovedApplications,
  useRejectedApplications,
  useBulkApproveApplications
} from '@/hooks/use-club-approval';
import { useIsAdmin } from '@/hooks/use-admin';
import { useUrlFilters } from '@/hooks/use-url-filters';
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
import { Skeleton } from '@/components/ui/skeleton';
import { MobilePagination } from './club-approval/MobilePagination';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ClubApprovalErrorBoundary } from './club-approval/ClubApprovalErrorBoundary';
import { ClubApplicationListSkeleton, AsyncOperationWrapper, OperationProgress } from './club-approval/LoadingStates';
import { ErrorDisplay, RetryableOperation } from './club-approval/ErrorHandling';
import { OfflineCapabilities, NetworkStatusBadge } from './club-approval/OfflineStateHandler';
import { AdvancedSearchFilters } from './club-approval/AdvancedSearchFilters';
import { MobileFilters } from './club-approval/MobileFilters';
import { SearchResultHighlight } from './club-approval/SearchResultHighlight';
import { useClubApprovalErrorHandler, useBulkOperationErrorHandler } from '@/hooks/use-club-approval-error-handling';

interface ClubApplicationListProps {
  onApplicationSelect?: (clubId: string) => void;
  className?: string;
}

type SortField = 'name' | 'created_at' | 'application_status';
type SortDirection = 'asc' | 'desc';

interface BulkOperationResult {
  successful: string[];
  failed: { id: string; error: string }[];
}

interface BulkOperationProgress {
  isRunning: boolean;
  processed: number;
  total: number;
  results?: BulkOperationResult;
}

export const ClubApplicationList: React.FC<ClubApplicationListProps> = ({
  onApplicationSelect,
  className
}) => {
  // Check admin permissions
  const { data: isAdmin, isLoading: adminLoading, error: adminError } = useIsAdmin();
  
  // Error handling
  const { handleError } = useClubApprovalErrorHandler();
  const { handleBulkErrors, clearErrors, errors, hasErrors } = useBulkOperationErrorHandler();
  
  // URL-persisted filter state
  const { 
    filters, 
    updateFilters, 
    clearFilters: clearAllFilters, 
    resetPagination 
  } = useUrlFilters({
    defaultFilters: {
      status: 'pending',
      limit: 10,
      offset: 0
    }
  });
  
  const [sortField, setSortField] = useState<SortField>(
    (filters.sort_by as SortField) || 'created_at'
  );
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    filters.sort_order || 'desc'
  );
  const [currentPage, setCurrentPage] = useState(
    Math.floor((filters.offset || 0) / (filters.limit || 10)) + 1
  );

  // Bulk operations state
  const [selectedApplications, setSelectedApplications] = useState<Set<string>>(new Set());
  const [showBulkConfirmDialog, setShowBulkConfirmDialog] = useState(false);
  const [bulkAdminNotes, setBulkAdminNotes] = useState('');
  const [bulkProgress, setBulkProgress] = useState<BulkOperationProgress>({
    isRunning: false,
    processed: 0,
    total: 0
  });

  // Calculate offset based on current page and sync with URL filters
  const currentFilters = useMemo(() => ({
    ...filters,
    sort_by: sortField,
    sort_order: sortDirection,
    offset: (currentPage - 1) * (filters.limit || 10)
  }), [filters, currentPage, sortField, sortDirection]);

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

  // Bulk approval mutation
  const bulkApproveMutation = useBulkApproveApplications();

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

  // Handle filter changes
  const handleFiltersChange = (newFilters: ClubApplicationFilters) => {
    updateFilters(newFilters);
    if (newFilters.offset === 0) {
      setCurrentPage(1);
    }
  };

  // Handle clear filters
  const handleClearFilters = () => {
    clearAllFilters();
    setCurrentPage(1);
    setSortField('created_at');
    setSortDirection('desc');
  };

  // Handle sorting
  const handleSort = (field: SortField) => {
    let newDirection: SortDirection;
    if (sortField === field) {
      newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      newDirection = 'asc';
    }
    
    setSortField(field);
    setSortDirection(newDirection);
    
    // Update URL filters
    updateFilters({
      sort_by: field,
      sort_order: newDirection,
      offset: 0
    });
    setCurrentPage(1);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const newOffset = (page - 1) * (filters.limit || 10);
    updateFilters({ offset: newOffset });
    // Clear selections when changing pages
    setSelectedApplications(new Set());
  };

  // Bulk selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Only select pending applications for bulk approval
      const pendingIds = sortedApplications
        .filter(app => app.application_status === 'pending')
        .map(app => app.id);
      setSelectedApplications(new Set(pendingIds));
    } else {
      setSelectedApplications(new Set());
    }
  };

  const handleSelectApplication = (applicationId: string, checked: boolean) => {
    const newSelection = new Set(selectedApplications);
    if (checked) {
      newSelection.add(applicationId);
    } else {
      newSelection.delete(applicationId);
    }
    setSelectedApplications(newSelection);
  };

  // Bulk approval handlers
  const handleBulkApprove = () => {
    if (selectedApplications.size === 0) return;
    setShowBulkConfirmDialog(true);
  };

  const confirmBulkApprove = async () => {
    const clubIds = Array.from(selectedApplications);
    
    setBulkProgress({
      isRunning: true,
      processed: 0,
      total: clubIds.length
    });

    try {
      const result = await bulkApproveMutation.mutateAsync({
        clubIds,
        adminNotes: bulkAdminNotes.trim() || undefined
      });

      setBulkProgress(prev => ({
        ...prev,
        isRunning: false,
        processed: prev.total,
        results: result.data
      }));

      // Clear selections and close dialog
      setSelectedApplications(new Set());
      setShowBulkConfirmDialog(false);
      setBulkAdminNotes('');

    } catch (error) {
      setBulkProgress(prev => ({
        ...prev,
        isRunning: false
      }));
    }
  };

  const closeBulkDialog = () => {
    setShowBulkConfirmDialog(false);
    setBulkAdminNotes('');
  };

  const clearBulkResults = () => {
    setBulkProgress({
      isRunning: false,
      processed: 0,
      total: 0
    });
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

  // Show loading state while checking permissions
  if (adminLoading) {
    return <ClubApplicationListSkeleton />;
  }

  // Show access denied if not admin
  if (!isAdmin) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Access Denied
            </h3>
            <p className="text-gray-600">
              You don't have permission to access club application management.
              Only authorized platform administrators can view and manage club applications.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Loading skeleton
  if (isLoading) {
    return <ClubApplicationListSkeleton />;
  }

  // Error state with enhanced error display
  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Club Applications
            <NetworkStatusBadge className="ml-2" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorDisplay
            error={error}
            onRetry={() => window.location.reload()}
            context="load club applications"
            showDetails={true}
          />
        </CardContent>
      </Card>
    );
  }

  const totalPages = applicationsData?.total_pages || 0;
  const hasApplications = sortedApplications.length > 0;

  // Bulk operation computed values
  const pendingApplications = sortedApplications.filter(app => app.application_status === 'pending');
  const allPendingSelected = pendingApplications.length > 0 && 
    pendingApplications.every(app => selectedApplications.has(app.id));
  const somePendingSelected = pendingApplications.some(app => selectedApplications.has(app.id));
  const canBulkApprove = selectedApplications.size > 0 && filters.status === 'pending';

  return (
    <ClubApprovalErrorBoundary context="Club Application List" showReportButton={true}>
      <OfflineCapabilities 
        fallbackMessage="Application list may show cached data while offline. New applications won't appear until you're back online."
        showQueuedOperations={true}
      >
        <Card className={className}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Club Applications
              <NetworkStatusBadge className="ml-2" />
            </CardTitle>
          </CardHeader>
          <CardContent>
        {/* Mobile Filters (visible on small screens) */}
        <div className="block md:hidden mb-6">
          <MobileFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
          />
        </div>

        {/* Desktop Advanced Search and Filters (hidden on small screens) */}
        <div className="hidden md:block mb-6">
          <AdvancedSearchFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
            showAnalytics={process.env.NODE_ENV === 'development'}
          />
        </div>

        {/* Bulk Actions - Mobile Optimized */}
        {canBulkApprove && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4 p-3 bg-muted/50 rounded-lg">
            <span className="text-sm font-medium text-center sm:text-left">
              {selectedApplications.size} application{selectedApplications.size !== 1 ? 's' : ''} selected
            </span>
            <Button
              onClick={handleBulkApprove}
              disabled={bulkProgress.isRunning}
              size="sm"
              className="w-full sm:w-auto sm:ml-auto min-h-[44px] touch-manipulation"
            >
              <Check className="h-4 w-4 mr-2" />
              Bulk Approve
            </Button>
          </div>
        )}

        {/* Applications Table - Mobile Optimized */}
        {hasApplications ? (
          <div className="space-y-4">
            {/* Mobile Card View (visible on small screens) */}
            <div className="block md:hidden space-y-3">
              {sortedApplications.map((application) => (
                <Card 
                  key={application.id} 
                  className="touch-manipulation cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => onApplicationSelect?.(application.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {filters.status === 'pending' && (
                            <Checkbox
                              checked={selectedApplications.has(application.id)}
                              onCheckedChange={(checked) => 
                                handleSelectApplication(application.id, checked as boolean)
                              }
                              disabled={application.application_status !== 'pending'}
                              aria-label={`Select ${application.name}`}
                              onClick={(e) => e.stopPropagation()}
                              className="touch-manipulation"
                            />
                          )}
                          <h3 className="font-medium text-sm truncate">
                            <SearchResultHighlight 
                              text={application.name} 
                              searchTerm={filters.search}
                            />
                          </h3>
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">
                          <SearchResultHighlight 
                            text={application.contact_email} 
                            searchTerm={filters.search}
                          />
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <SearchResultHighlight 
                            text={application.location} 
                            searchTerm={filters.search}
                          />
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2 ml-3">
                        <Badge 
                          variant={getStatusBadgeVariant(application.application_status)}
                          className="text-xs"
                        >
                          {application.application_status.charAt(0).toUpperCase() + 
                           application.application_status.slice(1)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(application.created_at), 'MMM d')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      {application.contact_phone && (
                        <span className="text-xs text-muted-foreground">
                          {application.contact_phone}
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onApplicationSelect?.(application.id);
                        }}
                        className="h-8 w-8 p-0 ml-auto touch-manipulation"
                      >
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View application</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Desktop Table View (hidden on small screens) */}
            <div className="hidden md:block rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {filters.status === 'pending' && (
                      <TableHead className="w-12">
                        <Checkbox
                          checked={allPendingSelected}
                          onCheckedChange={handleSelectAll}
                          indeterminate={somePendingSelected && !allPendingSelected}
                          aria-label="Select all pending applications"
                          className="touch-manipulation"
                        />
                      </TableHead>
                    )}
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('name')}
                        className="h-auto p-0 font-medium hover:bg-transparent touch-manipulation"
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
                        className="h-auto p-0 font-medium hover:bg-transparent touch-manipulation"
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
                        className="h-auto p-0 font-medium hover:bg-transparent touch-manipulation"
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
                      {filters.status === 'pending' && (
                        <TableCell>
                          <Checkbox
                            checked={selectedApplications.has(application.id)}
                            onCheckedChange={(checked) => 
                              handleSelectApplication(application.id, checked as boolean)
                            }
                            disabled={application.application_status !== 'pending'}
                            aria-label={`Select ${application.name}`}
                            className="touch-manipulation"
                          />
                        </TableCell>
                      )}
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            <SearchResultHighlight 
                              text={application.name} 
                              searchTerm={filters.search}
                            />
                          </div>
                          <div className="text-sm text-muted-foreground md:hidden">
                            <SearchResultHighlight 
                              text={application.contact_email} 
                              searchTerm={filters.search}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="space-y-1">
                          <div className="text-sm">
                            <SearchResultHighlight 
                              text={application.contact_email} 
                              searchTerm={filters.search}
                            />
                          </div>
                          {application.contact_phone && (
                            <div className="text-sm text-muted-foreground">
                              {application.contact_phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="text-sm">
                          <SearchResultHighlight 
                            text={application.location} 
                            searchTerm={filters.search}
                          />
                        </div>
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
                          <SearchResultHighlight 
                            text={application.location} 
                            searchTerm={filters.search}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onApplicationSelect?.(application.id)}
                          className="h-8 w-8 p-0 touch-manipulation"
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

            {/* Pagination - Mobile Optimized */}
            {totalPages > 1 && (
              <MobilePagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                showPageSize={true}
                pageSize={filters.limit || 10}
                onPageSizeChange={(size) => {
                  updateFilters({ limit: size, offset: 0 });
                  setCurrentPage(1);
                }}
                className="mt-6"
              />
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
              {filters.search || filters.date_from || filters.date_to || filters.location ? 
                'No applications match your current search criteria. Try adjusting your filters.' :
                'Applications will appear here when clubs register.'}
            </p>
            {(filters.search || filters.date_from || filters.date_to || filters.location) && (
              <Button 
                variant="outline" 
                onClick={handleClearFilters}
              >
                Clear All Filters
              </Button>
            )}
          </div>
        )}

        {/* Bulk Confirmation Dialog */}
        <Dialog open={showBulkConfirmDialog} onOpenChange={closeBulkDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Confirm Bulk Approval</DialogTitle>
              <DialogDescription>
                You are about to approve {selectedApplications.size} club application{selectedApplications.size !== 1 ? 's' : ''}. 
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="bulk-notes" className="text-sm font-medium">
                  Admin Notes (Optional)
                </label>
                <Textarea
                  id="bulk-notes"
                  placeholder="Add notes for this bulk approval..."
                  value={bulkAdminNotes}
                  onChange={(e) => setBulkAdminNotes(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={closeBulkDialog}>
                Cancel
              </Button>
              <Button 
                onClick={confirmBulkApprove}
                disabled={bulkProgress.isRunning}
              >
                {bulkProgress.isRunning ? 'Processing...' : 'Approve All'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Operation Progress */}
        {bulkProgress.isRunning && (
          <Dialog open={true} onOpenChange={() => {}}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Processing Bulk Approval</DialogTitle>
                <DialogDescription>
                  Please wait while we process the applications...
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <Progress 
                  value={(bulkProgress.processed / bulkProgress.total) * 100} 
                  className="w-full"
                />
                <p className="text-sm text-center text-muted-foreground">
                  Processing {bulkProgress.processed} of {bulkProgress.total} applications
                </p>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Bulk Operation Results */}
        {bulkProgress.results && (
          <Dialog open={true} onOpenChange={clearBulkResults}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Bulk Approval Results</DialogTitle>
                <DialogDescription>
                  Here are the results of your bulk approval operation.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                {bulkProgress.results.successful.length > 0 && (
                  <Alert>
                    <Check className="h-4 w-4" />
                    <AlertDescription>
                      Successfully approved {bulkProgress.results.successful.length} application{bulkProgress.results.successful.length !== 1 ? 's' : ''}.
                    </AlertDescription>
                  </Alert>
                )}

                {bulkProgress.results.failed.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Failed to approve {bulkProgress.results.failed.length} application{bulkProgress.results.failed.length !== 1 ? 's' : ''}:
                      <ul className="mt-2 list-disc list-inside text-sm">
                        {bulkProgress.results.failed.map((failure, index) => (
                          <li key={index}>
                            Application {failure.id}: {failure.error}
                          </li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <DialogFooter>
                <Button onClick={clearBulkResults}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
          </CardContent>
        </Card>
      </OfflineCapabilities>
    </ClubApprovalErrorBoundary>
  );
};

export default ClubApplicationList;