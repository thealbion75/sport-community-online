/**
 * Audit Log Viewer Component
 * Displays comprehensive admin action logs with filtering and search
 */

import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Calendar,
  User,
  Activity,
  Eye,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  useAdminActivityLog,
  useExportAdminActivityReport
} from '@/hooks/use-admin-audit-reporting';
import { AdminActivityLog, ReportFilters } from '@/lib/supabase/admin-audit-reporting';
import { formatDistanceToNow, format } from 'date-fns';

interface AuditLogViewerProps {
  className?: string;
}

export function AuditLogViewer({ className }: AuditLogViewerProps) {
  const [filters, setFilters] = useState<ReportFilters>({
    limit: 25,
    offset: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Hooks
  const { data: auditLog, isLoading, refetch } = useAdminActivityLog(filters);
  const exportReport = useExportAdminActivityReport();

  const handleFilterChange = (key: keyof ReportFilters, value: string | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      offset: 0 // Reset to first page when filters change
    }));
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    const newOffset = (page - 1) * (filters.limit || 25);
    setFilters(prev => ({ ...prev, offset: newOffset }));
    setCurrentPage(page);
  };

  const handleSearch = () => {
    // In a real implementation, you'd add search functionality to the API
    // For now, we'll just refetch with current filters
    refetch();
  };

  const handleExport = () => {
    exportReport.mutate({
      format: 'xlsx',
      date_from: filters.date_from,
      date_to: filters.date_to,
      admin_id: filters.admin_id
    });
  };

  const getActionIcon = (actionType: AdminActivityLog['action_type']) => {
    switch (actionType) {
      case 'approve':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'reject':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'view':
        return <Eye className="h-4 w-4 text-blue-600" />;
      case 'export':
        return <Download className="h-4 w-4 text-purple-600" />;
      case 'bulk_approve':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'bulk_reject':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActionColor = (actionType: AdminActivityLog['action_type']) => {
    switch (actionType) {
      case 'approve':
      case 'bulk_approve':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'reject':
      case 'bulk_reject':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'view':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'export':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getActionLabel = (actionType: AdminActivityLog['action_type']) => {
    switch (actionType) {
      case 'approve':
        return 'Approved';
      case 'reject':
        return 'Rejected';
      case 'view':
        return 'Viewed';
      case 'export':
        return 'Exported';
      case 'bulk_approve':
        return 'Bulk Approved';
      case 'bulk_reject':
        return 'Bulk Rejected';
      default:
        return actionType;
    }
  };

  const totalPages = auditLog ? Math.ceil(auditLog.count / (filters.limit || 25)) : 0;

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Admin Audit Log</h2>
          <p className="text-gray-600">Complete record of all administrative actions</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={exportReport.isPending}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="flex gap-2">
                <Input
                  id="search"
                  placeholder="Search admin or target..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button variant="outline" size="sm" onClick={handleSearch}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="action-type">Action Type</Label>
              <Select 
                value={filters.action_type || 'all'} 
                onValueChange={(value) => handleFilterChange('action_type', value === 'all' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="approve">Approve</SelectItem>
                  <SelectItem value="reject">Reject</SelectItem>
                  <SelectItem value="view">View</SelectItem>
                  <SelectItem value="export">Export</SelectItem>
                  <SelectItem value="bulk_approve">Bulk Approve</SelectItem>
                  <SelectItem value="bulk_reject">Bulk Reject</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-from">From Date</Label>
              <Input
                id="date-from"
                type="date"
                value={filters.date_from || ''}
                onChange={(e) => handleFilterChange('date_from', e.target.value || undefined)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-to">To Date</Label>
              <Input
                id="date-to"
                type="date"
                value={filters.date_to || ''}
                onChange={(e) => handleFilterChange('date_to', e.target.value || undefined)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Activity Log
            </span>
            {auditLog && (
              <span className="text-sm font-normal text-gray-500">
                {auditLog.count} total entries
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3" />
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
                  </div>
                  <div className="h-6 bg-gray-200 rounded animate-pulse w-16" />
                </div>
              ))}
            </div>
          ) : auditLog && auditLog.data.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead>Admin</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>IP Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLog.data.map((entry) => (
                      <TableRow key={entry.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getActionIcon(entry.action_type)}
                            <Badge 
                              variant="outline" 
                              className={getActionColor(entry.action_type)}
                            >
                              {getActionLabel(entry.action_type)}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <div>
                              <div className="font-medium text-sm">
                                {entry.admin_name || 'Unknown'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {entry.admin_email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">
                              {entry.target_name || entry.target_id || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500 capitalize">
                              {entry.target_type.replace('_', ' ')}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-600 max-w-xs truncate">
                            {entry.details || 'No details'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">
                              {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                            </div>
                            <div className="text-xs text-gray-500">
                              {format(new Date(entry.created_at), 'PPpp')}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs text-gray-500 font-mono">
                            {entry.ip_address || 'N/A'}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-500">
                    Showing {((currentPage - 1) * (filters.limit || 25)) + 1} to{' '}
                    {Math.min(currentPage * (filters.limit || 25), auditLog.count)} of{' '}
                    {auditLog.count} entries
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(page)}
                          >
                            {page}
                          </Button>
                        );
                      })}
                      {totalPages > 5 && (
                        <>
                          <span className="text-gray-500">...</span>
                          <Button
                            variant={currentPage === totalPages ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(totalPages)}
                          >
                            {totalPages}
                          </Button>
                        </>
                      )}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No audit log entries found</p>
              <p className="text-sm">Admin actions will appear here as they occur</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}