/**
 * Reporting Interface Component
 * Provides comprehensive reporting and analytics for club applications
 */

import React, { useState } from 'react';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Calendar,
  Download,
  Filter,
  RefreshCw,
  FileText,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  MapPin
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  useApplicationStatistics,
  useExportApplicationData,
  useExportStatisticsReport,
  useCurrentMonthStatistics
} from '@/hooks/use-admin-audit-reporting';
import { ApplicationStatistics, ReportFilters } from '@/lib/supabase/admin-audit-reporting';
import { format, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';

interface ReportingInterfaceProps {
  className?: string;
}

export function ReportingInterface({ className }: ReportingInterfaceProps) {
  const [filters, setFilters] = useState<ReportFilters>({});
  const [selectedPeriod, setSelectedPeriod] = useState<string>('current-month');
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'xlsx'>('xlsx');

  // Hooks
  const { data: statistics, isLoading, refetch } = useApplicationStatistics(filters);
  const { data: currentMonthStats } = useCurrentMonthStatistics();
  const exportApplications = useExportApplicationData();
  const exportStatistics = useExportStatisticsReport();

  // Update filters based on selected period
  React.useEffect(() => {
    const now = new Date();
    let dateFrom: string | undefined;
    let dateTo: string | undefined;

    switch (selectedPeriod) {
      case 'last-7-days':
        dateFrom = subDays(now, 7).toISOString().split('T')[0];
        break;
      case 'last-30-days':
        dateFrom = subDays(now, 30).toISOString().split('T')[0];
        break;
      case 'last-3-months':
        dateFrom = subMonths(now, 3).toISOString().split('T')[0];
        break;
      case 'current-month':
        dateFrom = startOfMonth(now).toISOString().split('T')[0];
        dateTo = endOfMonth(now).toISOString().split('T')[0];
        break;
      case 'last-month':
        const lastMonth = subMonths(now, 1);
        dateFrom = startOfMonth(lastMonth).toISOString().split('T')[0];
        dateTo = endOfMonth(lastMonth).toISOString().split('T')[0];
        break;
      default:
        dateFrom = undefined;
        dateTo = undefined;
    }

    setFilters(prev => ({
      ...prev,
      date_from: dateFrom,
      date_to: dateTo
    }));
  }, [selectedPeriod]);

  const handleExportApplications = () => {
    exportApplications.mutate({
      format: exportFormat,
      include_history: true,
      include_admin_notes: true,
      date_from: filters.date_from,
      date_to: filters.date_to,
      status_filter: 'all'
    });
  };

  const handleExportStatistics = () => {
    exportStatistics.mutate({
      format: exportFormat,
      date_from: filters.date_from,
      date_to: filters.date_to
    });
  };

  const formatPercentage = (value: number) => {
    return `${Math.round(value * 100)}%`;
  };

  const formatHours = (hours: number) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`;
    }
    return `${Math.round(hours)}h`;
  };

  return (
    <div className={className}>
      {/* Header with filters and export */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Application Reports & Analytics</h2>
          <p className="text-gray-600">Comprehensive insights into club application trends and performance</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last-7-days">Last 7 days</SelectItem>
              <SelectItem value="current-month">Current month</SelectItem>
              <SelectItem value="last-month">Last month</SelectItem>
              <SelectItem value="last-30-days">Last 30 days</SelectItem>
              <SelectItem value="last-3-months">Last 3 months</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={exportFormat} onValueChange={(value: 'csv' | 'json' | 'xlsx') => setExportFormat(value)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="xlsx">Excel</SelectItem>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="json">JSON</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Applications</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoading ? '...' : (statistics?.total_applications || 0)}
                </p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approval Rate</p>
                <p className="text-2xl font-bold text-green-600">
                  {isLoading ? '...' : formatPercentage(statistics?.approval_rate || 0)}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Applications</p>
                <p className="text-2xl font-bold text-orange-600">
                  {isLoading ? '...' : (statistics?.pending_applications || 0)}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Processing Time</p>
                <p className="text-2xl font-bold text-purple-600">
                  {isLoading ? '...' : formatHours(statistics?.average_processing_time_hours || 0)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Application Status Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Application Status Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-24" />
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-16" />
                      </div>
                    ))}
                  </div>
                ) : statistics ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-green-900">Approved</span>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        {statistics.approved_applications}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-orange-600" />
                        <span className="font-medium text-orange-900">Pending</span>
                      </div>
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                        {statistics.pending_applications}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span className="font-medium text-red-900">Rejected</span>
                      </div>
                      <Badge variant="secondary" className="bg-red-100 text-red-800">
                        {statistics.rejected_applications}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Rejection Reasons */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <XCircle className="h-5 w-5" />
                  Top Rejection Reasons
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-32" />
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-8" />
                      </div>
                    ))}
                  </div>
                ) : statistics?.top_rejection_reasons && statistics.top_rejection_reasons.length > 0 ? (
                  <div className="space-y-3">
                    {statistics.top_rejection_reasons.slice(0, 5).map((reason, index) => (
                      <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                        <span className="text-sm text-gray-700 flex-1 truncate">
                          {reason.reason}
                        </span>
                        <Badge variant="outline">
                          {reason.count}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <XCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No rejection data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Monthly Application Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-16" />
                      <div className="flex-1 h-8 bg-gray-200 rounded animate-pulse" />
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-12" />
                    </div>
                  ))}
                </div>
              ) : statistics?.applications_by_month && statistics.applications_by_month.length > 0 ? (
                <div className="space-y-4">
                  {statistics.applications_by_month.map((month, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                          {format(new Date(month.month + '-01'), 'MMM yyyy')}
                        </span>
                        <span className="text-sm text-gray-500">
                          {month.total} total
                        </span>
                      </div>
                      <div className="flex gap-1 h-6 bg-gray-100 rounded overflow-hidden">
                        <div 
                          className="bg-green-500" 
                          style={{ width: `${(month.approved / month.total) * 100}%` }}
                          title={`${month.approved} approved`}
                        />
                        <div 
                          className="bg-orange-500" 
                          style={{ width: `${(month.pending / month.total) * 100}%` }}
                          title={`${month.pending} pending`}
                        />
                        <div 
                          className="bg-red-500" 
                          style={{ width: `${(month.rejected / month.total) * 100}%` }}
                          title={`${month.rejected} rejected`}
                        />
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded" />
                          {month.approved} approved
                        </span>
                        <span className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-orange-500 rounded" />
                          {month.pending} pending
                        </span>
                        <span className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-red-500 rounded" />
                          {month.rejected} rejected
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No trend data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Applications by Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-24" />
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-12" />
                    </div>
                  ))}
                </div>
              ) : statistics?.applications_by_location && statistics.applications_by_location.length > 0 ? (
                <div className="space-y-3">
                  {statistics.applications_by_location.slice(0, 10).map((location, index) => (
                    <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                      <span className="text-sm text-gray-700 flex-1">
                        {location.location || 'Unknown Location'}
                      </span>
                      <Badge variant="outline">
                        {location.count}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No location data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Export Application Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Export detailed application data including history and admin notes.
                </p>
                <Button 
                  onClick={handleExportApplications}
                  disabled={exportApplications.isPending}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {exportApplications.isPending ? 'Exporting...' : `Export Applications (${exportFormat.toUpperCase()})`}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Export Statistics Report
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Export comprehensive statistics and analytics report.
                </p>
                <Button 
                  onClick={handleExportStatistics}
                  disabled={exportStatistics.isPending}
                  className="w-full"
                  variant="outline"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  {exportStatistics.isPending ? 'Exporting...' : `Export Statistics (${exportFormat.toUpperCase()})`}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}