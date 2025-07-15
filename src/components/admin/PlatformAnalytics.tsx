/**
 * Platform Analytics Component
 * Displays analytics and reporting for platform administrators
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Users, 
  Building, 
  Calendar, 
  MessageSquare,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Award
} from 'lucide-react';
import type { PlatformStats } from '@/types';

interface PlatformAnalyticsProps {
  stats: PlatformStats;
}

export const PlatformAnalytics: React.FC<PlatformAnalyticsProps> = ({ stats }) => {
  // Mock additional analytics data (in a real app, this would come from APIs)
  const growthData = {
    clubs_this_month: 5,
    volunteers_this_month: 23,
    opportunities_this_month: 12,
    applications_this_month: 45
  };

  const engagementData = {
    active_clubs_percentage: 78,
    active_volunteers_percentage: 65,
    application_success_rate: 42,
    message_response_rate: 89
  };

  const topSports = [
    { name: 'Football', count: 8, percentage: 32 },
    { name: 'Tennis', count: 6, percentage: 24 },
    { name: 'Cricket', count: 4, percentage: 16 },
    { name: 'Running', count: 3, percentage: 12 },
    { name: 'Swimming', count: 2, percentage: 8 },
    { name: 'Other', count: 2, percentage: 8 }
  ];

  const recentActivity = [
    { type: 'club_registration', description: 'New club registered: East Grinstead FC', time: '2 hours ago' },
    { type: 'volunteer_signup', description: '3 new volunteer profiles created', time: '4 hours ago' },
    { type: 'opportunity_posted', description: 'Tennis coach opportunity posted', time: '6 hours ago' },
    { type: 'application_submitted', description: '5 new applications submitted', time: '8 hours ago' },
    { type: 'message_sent', description: '12 messages exchanged between users', time: '1 day ago' }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'club_registration':
        return <Building className="h-4 w-4 text-green-600" />;
      case 'volunteer_signup':
        return <Users className="h-4 w-4 text-blue-600" />;
      case 'opportunity_posted':
        return <Calendar className="h-4 w-4 text-purple-600" />;
      case 'application_submitted':
        return <Target className="h-4 w-4 text-orange-600" />;
      case 'message_sent':
        return <MessageSquare className="h-4 w-4 text-pink-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Platform Analytics</h2>
          <p className="text-gray-600">
            Insights and metrics for the volunteer platform
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          <BarChart3 className="h-3 w-3" />
          Live Data
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Clubs</p>
                <p className="text-2xl font-bold">{stats.total_clubs}</p>
                <p className="text-xs text-green-600">
                  +{growthData.clubs_this_month} this month
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Volunteers</p>
                <p className="text-2xl font-bold">{stats.total_volunteers}</p>
                <p className="text-xs text-green-600">
                  +{growthData.volunteers_this_month} this month
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Opportunities</p>
                <p className="text-2xl font-bold">{stats.total_opportunities}</p>
                <p className="text-xs text-green-600">
                  +{growthData.opportunities_this_month} this month
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Target className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Applications</p>
                <p className="text-2xl font-bold">{stats.total_applications}</p>
                <p className="text-xs text-green-600">
                  +{growthData.applications_this_month} this month
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Engagement Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Engagement Metrics
            </CardTitle>
            <CardDescription>
              Platform activity and user engagement rates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Active Clubs</span>
                <span>{engagementData.active_clubs_percentage}%</span>
              </div>
              <Progress value={engagementData.active_clubs_percentage} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Active Volunteers</span>
                <span>{engagementData.active_volunteers_percentage}%</span>
              </div>
              <Progress value={engagementData.active_volunteers_percentage} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Application Success Rate</span>
                <span>{engagementData.application_success_rate}%</span>
              </div>
              <Progress value={engagementData.application_success_rate} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Message Response Rate</span>
                <span>{engagementData.message_response_rate}%</span>
              </div>
              <Progress value={engagementData.message_response_rate} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Top Sports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Popular Sports
            </CardTitle>
            <CardDescription>
              Distribution of sports across registered clubs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topSports.map((sport, index) => (
                <div key={sport.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      index === 0 ? 'bg-blue-500' :
                      index === 1 ? 'bg-green-500' :
                      index === 2 ? 'bg-purple-500' :
                      index === 3 ? 'bg-orange-500' :
                      index === 4 ? 'bg-pink-500' : 'bg-gray-500'
                    }`}></div>
                    <span className="text-sm font-medium">{sport.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{sport.count}</span>
                    <Badge variant="outline" className="text-xs">
                      {sport.percentage}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Platform Activity
          </CardTitle>
          <CardDescription>
            Latest actions and events across the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 mt-0.5">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Platform Health Summary
          </CardTitle>
          <CardDescription>
            Overall platform performance and key indicators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {stats.verified_clubs}/{stats.total_clubs}
              </div>
              <p className="text-sm text-gray-600">Clubs Verified</p>
              <p className="text-xs text-gray-500 mt-1">
                {Math.round((stats.verified_clubs / stats.total_clubs) * 100)}% verification rate
              </p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {engagementData.application_success_rate}%
              </div>
              <p className="text-sm text-gray-600">Success Rate</p>
              <p className="text-xs text-gray-500 mt-1">
                Applications accepted by clubs
              </p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {engagementData.message_response_rate}%
              </div>
              <p className="text-sm text-gray-600">Response Rate</p>
              <p className="text-xs text-gray-500 mt-1">
                Messages receiving replies
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};