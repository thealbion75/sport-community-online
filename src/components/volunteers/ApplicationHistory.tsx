/**
 * Application History Component
 * Shows volunteer's application history and status
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Clock, CheckCircle, XCircle, AlertCircle, 
  Calendar, MapPin, Building, Eye 
} from 'lucide-react';
import { format } from 'date-fns';
import { useWithdrawApplication } from '@/hooks/use-applications';
import type { VolunteerApplication } from '@/types';

interface ApplicationHistoryProps {
  applications: VolunteerApplication[];
  isLoading?: boolean;
}

export const ApplicationHistory: React.FC<ApplicationHistoryProps> = ({
  applications,
  isLoading
}) => {
  const withdrawMutation = useWithdrawApplication();

  const handleWithdraw = async (applicationId: string) => {
    if (window.confirm('Are you sure you want to withdraw this application?')) {
      await withdrawMutation.mutateAsync(applicationId);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'withdrawn': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
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

  const filterApplicationsByStatus = (status: string) => {
    return applications.filter(app => app.status === status);
  };

  const ApplicationCard: React.FC<{ application: VolunteerApplication }> = ({ application }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-medium text-lg">
                  {application.opportunity?.title}
                </h4>
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <Building className="h-3 w-3" />
                  {application.opportunity?.club?.name}
                </p>
              </div>
              <Badge className={getStatusColor(application.status)}>
                {getStatusIcon(application.status)}
                <span className="ml-1 capitalize">{application.status}</span>
              </Badge>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Applied {format(new Date(application.applied_at), 'MMM d, yyyy')}
                </span>
                {application.opportunity?.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {application.opportunity.location}
                  </span>
                )}
              </div>
              
              <p className="text-gray-700">
                Time Commitment: {application.opportunity?.time_commitment}
              </p>
              
              {application.message && (
                <div className="mt-3 p-3 bg-gray-50 rounded">
                  <p className="text-sm">
                    <strong>Your message:</strong> "{application.message}"
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
          {application.status === 'pending' && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleWithdraw(application.id)}
              disabled={withdrawMutation.isPending}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Withdraw
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
          <p className="text-gray-600">
            Start browsing volunteer opportunities to make your first application.
          </p>
          <Button className="mt-4" onClick={() => window.location.href = '/opportunities'}>
            Browse Opportunities
          </Button>
        </CardContent>
      </Card>
    );
  }

  const pendingApplications = filterApplicationsByStatus('pending');
  const acceptedApplications = filterApplicationsByStatus('accepted');
  const rejectedApplications = filterApplicationsByStatus('rejected');
  const withdrawnApplications = filterApplicationsByStatus('withdrawn');

  return (
    <Tabs defaultValue="all" className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="all">
          All ({applications.length})
        </TabsTrigger>
        <TabsTrigger value="pending">
          Pending ({pendingApplications.length})
        </TabsTrigger>
        <TabsTrigger value="accepted">
          Accepted ({acceptedApplications.length})
        </TabsTrigger>
        <TabsTrigger value="rejected">
          Rejected ({rejectedApplications.length})
        </TabsTrigger>
        <TabsTrigger value="withdrawn">
          Withdrawn ({withdrawnApplications.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="all" className="space-y-4">
        {applications.map((application) => (
          <ApplicationCard key={application.id} application={application} />
        ))}
      </TabsContent>

      <TabsContent value="pending" className="space-y-4">
        {pendingApplications.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No pending applications</p>
            </CardContent>
          </Card>
        ) : (
          pendingApplications.map((application) => (
            <ApplicationCard key={application.id} application={application} />
          ))
        )}
      </TabsContent>

      <TabsContent value="accepted" className="space-y-4">
        {acceptedApplications.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <CheckCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No accepted applications</p>
            </CardContent>
          </Card>
        ) : (
          acceptedApplications.map((application) => (
            <ApplicationCard key={application.id} application={application} />
          ))
        )}
      </TabsContent>

      <TabsContent value="rejected" className="space-y-4">
        {rejectedApplications.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <XCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No rejected applications</p>
            </CardContent>
          </Card>
        ) : (
          rejectedApplications.map((application) => (
            <ApplicationCard key={application.id} application={application} />
          ))
        )}
      </TabsContent>

      <TabsContent value="withdrawn" className="space-y-4">
        {withdrawnApplications.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No withdrawn applications</p>
            </CardContent>
          </Card>
        ) : (
          withdrawnApplications.map((application) => (
            <ApplicationCard key={application.id} application={application} />
          ))
        )}
      </TabsContent>
    </Tabs>
  );
};