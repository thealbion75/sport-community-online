/**
 * Application Manager Component
 * View and manage volunteer applications for clubs
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAcceptApplication, useRejectApplication } from '@/hooks/use-applications';
import { VolunteerApplication } from '@/types';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock,
  MessageSquare,
  Eye
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ApplicationManagerProps {
  applications: VolunteerApplication[];
  clubId: string;
}

export function ApplicationManager({ applications }: ApplicationManagerProps) {
  const [selectedApplication, setSelectedApplication] = useState<VolunteerApplication | null>(null);
  
  const acceptMutation = useAcceptApplication();
  const rejectMutation = useRejectApplication();

  const pendingApplications = applications.filter(app => app.status === 'pending');
  const acceptedApplications = applications.filter(app => app.status === 'accepted');
  const rejectedApplications = applications.filter(app => app.status === 'rejected');

  const handleAccept = async (applicationId: string) => {
    try {
      await acceptMutation.mutateAsync(applicationId);
    } catch (error) {
      // Error handled by mutation hook
    }
  };

  const handleReject = async (applicationId: string) => {
    try {
      await rejectMutation.mutateAsync(applicationId);
    } catch (error) {
      // Error handled by mutation hook
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'withdrawn':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const ApplicationCard = ({ application }: { application: VolunteerApplication }) => {
    const volunteer = application.volunteer;
    const opportunity = application.opportunity;

    if (!volunteer || !opportunity) return null;

    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={volunteer.profile_image_url} />
                <AvatarFallback>
                  {volunteer.first_name[0]}{volunteer.last_name[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">
                  {volunteer.first_name} {volunteer.last_name}
                </CardTitle>
                <CardDescription>
                  Applied for: {opportunity.title}
                </CardDescription>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(application.status)}>
                {application.status}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedApplication(application)}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Volunteer Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Mail className="h-4 w-4" />
              <span>{volunteer.email}</span>
            </div>

            {volunteer.phone && (
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="h-4 w-4" />
                <span>{volunteer.phone}</span>
              </div>
            )}

            {volunteer.location && (
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>{volunteer.location}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>
                Applied {formatDistanceToNow(new Date(application.applied_at))} ago
              </span>
            </div>
          </div>

          {/* Skills */}
          {volunteer.skills.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Skills:</p>
              <div className="flex flex-wrap gap-1">
                {volunteer.skills.slice(0, 5).map((skill) => (
                  <Badge key={skill} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
                {volunteer.skills.length > 5 && (
                  <Badge variant="secondary" className="text-xs">
                    +{volunteer.skills.length - 5} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Application Message */}
          {application.message && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Message:</p>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                {application.message}
              </p>
            </div>
          )}

          {/* Actions */}
          {application.status === 'pending' && (
            <div className="flex gap-2 pt-2 border-t">
              <Button
                onClick={() => handleAccept(application.id)}
                disabled={acceptMutation.isPending}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Accept
              </Button>
              <Button
                variant="outline"
                onClick={() => handleReject(application.id)}
                disabled={rejectMutation.isPending}
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button variant="outline" size="sm">
                <MessageSquare className="h-4 w-4 mr-2" />
                Message
              </Button>
            </div>
          )}

          {application.status === 'accepted' && (
            <div className="flex gap-2 pt-2 border-t">
              <Button variant="outline" className="flex-1">
                <MessageSquare className="h-4 w-4 mr-2" />
                Contact Volunteer
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (applications.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Applications Yet
            </h3>
            <p className="text-gray-600">
              Applications for your volunteer opportunities will appear here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold">{applications.length}</p>
              </div>
              <User className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingApplications.length}</p>
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
                <p className="text-2xl font-bold text-green-600">{acceptedApplications.length}</p>
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
                <p className="text-2xl font-bold text-red-600">{rejectedApplications.length}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Applications Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({pendingApplications.length})
          </TabsTrigger>
          <TabsTrigger value="accepted">
            Accepted ({acceptedApplications.length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({rejectedApplications.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            All ({applications.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingApplications.length > 0 ? (
            pendingApplications.map((application) => (
              <ApplicationCard key={application.id} application={application} />
            ))
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">No pending applications</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="accepted" className="space-y-4">
          {acceptedApplications.length > 0 ? (
            acceptedApplications.map((application) => (
              <ApplicationCard key={application.id} application={application} />
            ))
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <CheckCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">No accepted applications</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {rejectedApplications.length > 0 ? (
            rejectedApplications.map((application) => (
              <ApplicationCard key={application.id} application={application} />
            ))
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <XCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">No rejected applications</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {applications.map((application) => (
            <ApplicationCard key={application.id} application={application} />
          ))}
        </TabsContent>
      </Tabs>

      {/* Application Detail Modal */}
      {selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Application Details</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedApplication(null)}
                className="absolute top-4 right-4"
              >
                Close
              </Button>
            </CardHeader>
            <CardContent>
              <ApplicationCard application={selectedApplication} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}