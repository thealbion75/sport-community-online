/**
 * Applications List Component
 * Displays volunteer's applications with status and actions
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle, XCircle, Clock, Calendar, MapPin, Building, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useWithdrawApplication } from '@/hooks/useApplications';
import type { VolunteerApplication } from '@/types';

interface ApplicationsListProps {
  applications: VolunteerApplication[];
  isLoading?: boolean;
}

export const ApplicationsList: React.FC<ApplicationsListProps> = ({
  applications,
  isLoading
}) => {
  const [selectedApplication, setSelectedApplication] = useState<VolunteerApplication | null>(null);
  const withdrawMutation = useWithdrawApplication();

  const handleWithdraw = async (applicationId: string) => {
    if (window.confirm('Are you sure you want to withdraw this application? This action cannot be undone.')) {
      await withdrawMutation.mutateAsync(applicationId);
      setSelectedApplication(null);
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
    <Card className="hover:shadow-md transition-shadow cursor-pointer" 
          onClick={() => setSelectedApplication(application)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-medium text-lg mb-1">
              {application.opportunity?.title}
            </h4>
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <Building className="h-3 w-3" />
              {application.opportunity?.club?.name}
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
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
            {application.message && (
              <p className="text-sm text-gray-700 line-clamp-2 mb-3">
                "{application.message}"
              </p>
            )}
            <div className="text-sm text-gray-600">
              <strong>Time Commitment:</strong> {application.opportunity?.time_commitment}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge className={getStatusColor(application.status)}>
              {getStatusIcon(application.status)}
              <span className="ml-1 capitalize">{application.status}</span>
            </Badge>
            {application.status === 'pending' && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleWithdraw(application.id);
                }}
                disabled={withdrawMutation.isPending}
              >
                Withdraw
              </Button>
            )}
          </div>
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
        <CardContent className="text-center py-12">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
          <p className="text-gray-600 mb-6">
            You haven't applied to any volunteer opportunities yet. Start browsing to find positions that match your skills and interests.
          </p>
          <Button>Browse Opportunities</Button>
        </CardContent>
      </Card>
    );
  }

  const pendingApplications = filterApplicationsByStatus('pending');
  const acceptedApplications = filterApplicationsByStatus('accepted');
  const rejectedApplications = filterApplicationsByStatus('rejected');
  const withdrawnApplications = filterApplicationsByStatus('withdrawn');

  return (
    <>
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

      {/* Application Detail Dialog */}
      <Dialog open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>
              View your application details and status
            </DialogDescription>
          </DialogHeader>
          
          {selectedApplication && (
            <div className="space-y-6">
              {/* Opportunity Info */}
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  {selectedApplication.opportunity?.title}
                </h3>
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  <span className="flex items-center gap-1">
                    <Building className="h-4 w-4" />
                    {selectedApplication.opportunity?.club?.name}
                  </span>
                  {selectedApplication.opportunity?.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {selectedApplication.opportunity.location}
                    </span>
                  )}
                </div>
                <Badge className={getStatusColor(selectedApplication.status)}>
                  {getStatusIcon(selectedApplication.status)}
                  <span className="ml-1 capitalize">{selectedApplication.status}</span>
                </Badge>
              </div>

              {/* Opportunity Description */}
              <div>
                <h4 className="font-medium mb-2">Opportunity Description:</h4>
                <p className="text-gray-700 bg-gray-50 p-3 rounded">
                  {selectedApplication.opportunity?.description}
                </p>
              </div>

              {/* Application Message */}
              {selectedApplication.message && (
                <div>
                  <h4 className="font-medium mb-2">Your Application Message:</h4>
                  <p className="text-gray-700 bg-blue-50 p-3 rounded">
                    {selectedApplication.message}
                  </p>
                </div>
              )}

              {/* Required Skills */}
              {selectedApplication.opportunity?.required_skills && selectedApplication.opportunity.required_skills.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Required Skills:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedApplication.opportunity.required_skills.map((skill) => (
                      <Badge key={skill} variant="outline">{skill}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Time Commitment */}
              <div>
                <h4 className="font-medium mb-2">Time Commitment:</h4>
                <p className="text-gray-700">{selectedApplication.opportunity?.time_commitment}</p>
              </div>

              {/* Application Date */}
              <div>
                <h4 className="font-medium mb-2">Application Date:</h4>
                <p className="text-gray-700">
                  {format(new Date(selectedApplication.applied_at), 'MMMM d, yyyy \'at\' h:mm a')}
                </p>
              </div>

              {/* Actions */}
              {selectedApplication.status === 'pending' && (
                <div className="flex justify-end pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => handleWithdraw(selectedApplication.id)}
                    disabled={withdrawMutation.isPending}
                  >
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Withdraw Application
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};