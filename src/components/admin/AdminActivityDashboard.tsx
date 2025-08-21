/**
 * Admin Activity Dashboard Component
 * Shows individual admin performance metrics and activity
 */

import React, { useState } from 'react';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Activity, 
  Calendar,
  TrendingUp,
  Clock,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  useAdminPerformanceMetrics, 
  useRecentAdminActivity,
  useExportAdminActivityReport,
  useCurrentMonthAdminPerformance
} from '@/hooks/use-admin-audit-reporting';
import { AdminPerformanceMetrics, ReportFilters } from '@/lib/supabase/admin-audit-reporting';
import { formatDistanceToNow, format, subDays, subMonths } from 'date-fns';

interface AdminActivityDashboardProps {
  className?: string;
}

export function AdminActivityDashboard({ className }: AdminActivityDashboardProps) {
  const [filters, setFilters] = useState<ReportFilters>({});
  const [selectedPeriod, setSelectedPeriod] = useState<string>('current-month');
  const [selectedAdmin, setSelectedAdmin] = useState<string>('all');

  // Hooks
  const { data: performanceMetrics, isLoading: metricsLoading, refetch: refetchMetrics } = useAdminPerformanceMetrics(filters);
  const { data: recentActivity, isLoading: activityLoading } = useRecentAdminActivity();
  const { data: currentMonthMetrics } = useCurrentMonthAdminPerformance();
  const exportReport = useExportAdminActivityReport();

  // Update filters based on selected period
  React.useEffect(() => {
    const now = new Date();
    let dateFrom: string | undefined;

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
        dateFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        break;
      default:
        dateFrom = undefined;
    }

    setFilters(prev => ({
      ...prev,
      date_from: dateFrom,
      admin_id: selectedAdmin === 'all' ? undefined : selectedAdmin
    }));
  }, [selectedPeriod, selectedAdmin]);

  const handleExportReport = () => {
    exportReport.mutate({
      format: 'xlsx',
      date_from: filters.date_from,
      date_to: filters.date_to,
      admin_id: filters.admin_id
    });
  };

  const calculateTotalActions = (metrics: AdminPerformanceMetrics[]) => {
    return metrics.reduce((total, admin) => total + admin.total_actions, 0);
  };

  const getTopPerformer = (metrics: AdminPerformanceMetrics[]) => {
    if (!metrics || metrics.length === 0) return null;
    return metrics.reduce((top, current) => 
      current.total_actions > top.total_actions ? current : top
    );
  };

  return (
    <div className={className}>
      {/* Header with filters and export */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Admin Activity Dashboard</h2>
          <p className="text-gray-600">Monitor admin performance and activity metrics</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last-7-days">Last 7 days</SelectItem>
              <SelectItem value="current-month">Current month</SelectItem>
              <SelectItem value="last-30-days">Last 30 days</SelectItem>
              <SelectItem value="last-3-months">Last 3 months</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            onClick={() => refetchMetrics()}
            disabled={metricsLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${metricsLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button
            variant="outline"
            onClick={handleExportReport}
            disabled={exportReport.isPending}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Actions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {metricsLoading ? '...' : calculateTotalActions(performanceMetrics || [])}
                </p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Admins</p>
                <p className="text-2xl font-bold text-gray-900">
                  {metricsLoading ? '...' : (performanceMetrics?.length || 0)}
                </p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Top Performer</p>
                <p className="text-lg font-bold text-gray-900 truncate">
                  {metricsLoading ? '...' : (getTopPerformer(performanceMetrics || [])?.admin_name || 'N/A')}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Processing Time</p>
                <p className="text-2xl font-bold text-gray-900">
                  {metricsLoading ? '...' : 
                    performanceMetrics && performanceMetrics.length > 0 
                      ? `${Math.round(performanceMetrics.reduce((sum, admin) => sum + admin.average_processing_time_hours, 0) / performanceMetrics.length)}h`
                      : 'N/A'
                  }
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Admin Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Admin Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-32" />
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-24" />
                    </div>
                    <div className="h-8 bg-gray-200 rounded animate-pulse w-16" />
                  </div>
                ))}
              </div>
            ) : performanceMetrics && performanceMetrics.length > 0 ? (
              <div className="space-y-4">
                {performanceMetrics.map((admin) => (
                  <div key={admin.admin_id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900">
                          {admin.admin_name || admin.admin_email}
                        </h4>
                        {admin.total_actions > 0 && (
                          <Badge variant="secondary">
                            {admin.total_actions} actions
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          {admin.approvals_count} approved
                        </span>
                        <span className="flex items-center gap-1">
                          <XCircle className="h-3 w-3 text-red-600" />
                          {admin.rejections_count} rejected
                        </span>
                        {admin.bulk_operations_count > 0 && (
                          <span className="flex items-center gap-1">
                            <Activity className="h-3 w-3 text-blue-600" />
                            {admin.bulk_operations_count} bulk ops
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Last active: {formatDistanceToNow(new Date(admin.last_activity), { addSuffix: true })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {Math.round(admin.average_processing_time_hours)}h
                      </div>
                      <div className="text-xs text-gray-500">avg time</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No admin activity data available</p>
                <p className="text-sm">Data will appear as admins perform actions</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity Feed */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivity && recentActivity.data.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {recentActivity.data.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      {activity.action_type === 'approve' && <CheckCircle className="h-4 w-4 text-green-600" />}
                      {activity.action_type === 'reject' && <XCircle className="h-4 w-4 text-red-600" />}
                      {activity.action_type === 'view' && <Activity className="h-4 w-4 text-blue-600" />}
                      {activity.action_type === 'export' && <Download className="h-4 w-4 text-purple-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {activity.admin_name || activity.admin_email}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {activity.action_type}
                        </Badge>
                      </div>
                      {activity.target_name && (
                        <p className="text-sm text-gray-600 truncate">
                          {activity.target_name}
                        </p>
                      )}
                      {activity.details && (
                        <p className="text-xs text-gray-500 truncate">
                          {activity.details}
                        </p>
                      )}
                      <div className="text-xs text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recent activity</p>
                <p className="text-sm">Admin actions will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}