/**
 * Application Tracker Component
 * Tracks and displays the progress of volunteer applications
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Clock, XCircle, AlertCircle, Calendar } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import type { VolunteerApplication } from '@/types';

interface ApplicationTrackerProps {
  application: VolunteerApplication;
  showTimeline?: boolean;
}

export const ApplicationTracker: React.FC<ApplicationTrackerProps> = ({
  application,
  showTimeline = true
}) => {
  const getStatusStep = (status: string) => {
    switch (status) {
      case 'pending': return 1;
      case 'accepted': return 3;
      case 'rejected': return 3;
      case 'withdrawn': return 2;
      default: return 0;
    }
  };

  const getProgressPercentage = (status: string) => {
    switch (status) {
      case 'pending': return 33;
      case 'accepted': return 100;
      case 'rejected': return 100;
      case 'withdrawn': return 66;
      default: return 0;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600';
      case 'accepted': return 'text-green-600';
      case 'rejected': return 'text-red-600';
      case 'withdrawn': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'accepted': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'withdrawn': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const daysSinceApplication = differenceInDays(new Date(), new Date(application.applied_at));
  const daysSinceUpdate = differenceInDays(new Date(), new Date(application.updated_at));

  const timelineSteps = [
    {
      title: 'Application Submitted',
      description: 'Your application was sent to the club',
      date: application.applied_at,
      status: 'completed',
      icon: <CheckCircle className="h-4 w-4 text-green-600" />
    },
    {
      title: 'Under Review',
      description: 'The club is reviewing your application',
      date: application.applied_at,
      status: application.status === 'pending' ? 'current' : 'completed',
      icon: application.status === 'pending' 
        ? <Clock className="h-4 w-4 text-yellow-600" />
        : <CheckCircle className="h-4 w-4 text-green-600" />
    },
    {
      title: getStatusTitle(application.status),
      description: getStatusDescription(application.status),
      date: application.updated_at !== application.applied_at ? application.updated_at : null,
      status: application.status === 'pending' ? 'pending' : 'completed',
      icon: getStatusIcon(application.status)
    }
  ];

  function getStatusTitle(status: string) {
    switch (status) {
      case 'accepted': return 'Application Accepted';
      case 'rejected': return 'Application Declined';
      case 'withdrawn': return 'Application Withdrawn';
      default: return 'Decision Pending';
    }
  }

  function getStatusDescription(status: string) {
    switch (status) {
      case 'accepted': return 'Congratulations! You\'ve been selected for this role';
      case 'rejected': return 'Unfortunately, you weren\'t selected this time';
      case 'withdrawn': return 'You withdrew your application';
      default: return 'Waiting for the club\'s decision';
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <span className={getStatusColor(application.status)}>
                {getStatusIcon(application.status)}
              </span>
              Application Progress
            </CardTitle>
            <CardDescription>
              Track the status of your volunteer application
            </CardDescription>
          </div>
          <Badge variant={application.status === 'accepted' ? 'default' : 'secondary'}>
            {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{getProgressPercentage(application.status)}%</span>
          </div>
          <Progress 
            value={getProgressPercentage(application.status)} 
            className="h-2"
          />
        </div>

        {/* Key Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">Applied</p>
            <p className="text-sm text-gray-600">
              {format(new Date(application.applied_at), 'MMMM d, yyyy')}
              <span className="text-xs text-gray-500 ml-2">
                ({daysSinceApplication} {daysSinceApplication === 1 ? 'day' : 'days'} ago)
              </span>
            </p>
          </div>
          
          {application.updated_at !== application.applied_at && (
            <div className="space-y-1">
              <p className="text-sm font-medium">Last Updated</p>
              <p className="text-sm text-gray-600">
                {format(new Date(application.updated_at), 'MMMM d, yyyy')}
                <span className="text-xs text-gray-500 ml-2">
                  ({daysSinceUpdate} {daysSinceUpdate === 1 ? 'day' : 'days'} ago)
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Timeline */}
        {showTimeline && (
          <div className="space-y-4">
            <h4 className="font-medium">Application Timeline</h4>
            <div className="space-y-4">
              {timelineSteps.map((step, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className={`
                    flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2
                    ${step.status === 'completed' 
                      ? 'bg-green-50 border-green-200' 
                      : step.status === 'current'
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-gray-50 border-gray-200'
                    }
                  `}>
                    {step.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`
                        text-sm font-medium
                        ${step.status === 'completed' 
                          ? 'text-gray-900' 
                          : step.status === 'current'
                          ? 'text-yellow-800'
                          : 'text-gray-500'
                        }
                      `}>
                        {step.title}
                      </p>
                      {step.date && (
                        <p className="text-xs text-gray-500">
                          {format(new Date(step.date), 'MMM d')}
                        </p>
                      )}
                    </div>
                    <p className={`
                      text-xs mt-1
                      ${step.status === 'completed' 
                        ? 'text-gray-600' 
                        : step.status === 'current'
                        ? 'text-yellow-700'
                        : 'text-gray-400'
                      }
                    `}>
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status-specific Information */}
        {application.status === 'pending' && (
          <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Application Under Review</p>
                <p className="text-xs text-yellow-700 mt-1">
                  The club typically responds within 5-7 business days. You'll be notified as soon as they make a decision.
                </p>
              </div>
            </div>
          </div>
        )}

        {application.status === 'accepted' && (
          <div className="bg-green-50 p-4 rounded border border-green-200">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800">Congratulations!</p>
                <p className="text-xs text-green-700 mt-1">
                  Your application has been accepted. The club will contact you soon with next steps.
                </p>
              </div>
            </div>
          </div>
        )}

        {application.status === 'rejected' && (
          <div className="bg-red-50 p-4 rounded border border-red-200">
            <div className="flex items-start gap-2">
              <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Application Not Successful</p>
                <p className="text-xs text-red-700 mt-1">
                  Don't be discouraged! There are many other opportunities available that might be a better fit.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};