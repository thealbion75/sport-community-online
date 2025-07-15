/**
 * Application Details Component
 * Full detailed view of a volunteer application
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useApplication } from '@/hooks/use-applications';
import { LoadingContainer } from '@/components/ui/loading-state';
import { VolunteerApplication } from '@/types';
import { 
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Mail,
  Phone,
  Globe,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MessageSquare,
  FileText
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface ApplicationDetailsProps {
  applicationId?: string;
  application?: VolunteerApplication;
  onBack?: () => void;
  onMessage?: () => void;
  onWithdraw?: () => void;
  showActions?: boolean;
}

export function ApplicationDetails({ 
  applicationId, 
  application: propApplication,
  onBack, 
  onMessage,
  onWithdraw,
  showActions = true
}: ApplicationDetailsProps) {
  const { data: fetchedApplication, isLoading } = useApplication(applicationId || '');
  
  const application = propApplication || fetchedApplication;

  if (isLoading) {
    return (
      <LoadingContainer isLoading={true} loadingText="Loading application details..." />
    );
  }

  if (!application) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Application Not Found
            </h3>
            <p className="text-gray-600 mb-4">
              The application you're looking for doesn't exist or has been removed.
            </p>
            {onBack && (
              <Button onClick={onBack} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const opportunity = application.opportunity;
  const volunteer = application.volunteer;
  const club = opportunity?.club;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-6 w-6 text-yellow-600" />;
      case 'accepted':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-6 w-6 text-red-600" />;
      case 'withdrawn':
        return <AlertTriangle className="h-6 w-6 text-gray-600" />;
      default:
        return <Clock className="h-6 w-6 text-gray-600" />;
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        {onBack && (
          <Button variant="outline" onClick={onBack} className="self-start">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Applications
          </Button>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Application Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    {getStatusIcon(application.status)}
                    <div>
                      <CardTitle className="text-2xl">
                        {opportunity?.title || 'Unknown Opportunity'}
                      </CardTitle>
                      <CardDescription className="text-base">
                        Application submitted {formatDistanceToNow(new Date(application.applied_at))} ago
                      </CardDescription>
                    </div>
                  </div>
                  
                  <Badge className={getStatusColor(application.status)} size="lg">
                    {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Status Timeline */}
              <div>
                <h3 className="font-semibold mb-3">Application Timeline</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-md">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-900">Application Submitted</p>
                      <p className="text-sm text-blue-700">
                        {format(new Date(application.applied_at), 'PPP p')}
                      </p>
                    </div>
                  </div>

                  {application.updated_at !== application.applied_at && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-md">
                      {getStatusIcon(application.status)}
                      <div>
                        <p className="font-medium text-gray-900">Status Updated</p>
                        <p className="text-sm text-gray-700">
                          {format(new Date(application.updated_at), 'PPP p')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Application Message */}
              {application.message && (
                <div>
                  <h3 className="font-semibold mb-3">Your Message</h3>
                  <div className="p-4 bg-gray-50 rounded-md">
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {application.message}
                    </p>
                  </div>
                </div>
              )}

              {!application.message && (
                <div>
                  <h3 className="font-semibold mb-3">Your Message</h3>
                  <p className="text-gray-500 italic">No message was included with this application.</p>
                </div>
              )}

              <Separator />

              {/* Opportunity Details */}
              {opportunity && (
                <div>
                  <h3 className="font-semibold mb-3">Opportunity Details</h3>
                  <div className="space-y-4">
                    <p className="text-gray-700 leading-relaxed">
                      {opportunity.description}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="font-medium">Time Commitment</p>
                          <p className="text-sm text-gray-600">{opportunity.time_commitment}</p>
                        </div>
                      </div>

                      {opportunity.location && (
                        <div className="flex items-center gap-3">
                          <MapPin className="h-5 w-5 text-gray-500" />
                          <div>
                            <p className="font-medium">Location</p>
                            <p className="text-sm text-gray-600">{opportunity.location}</p>
                          </div>
                        </div>
                      )}

                      {opportunity.start_date && (
                        <div className="flex items-center gap-3">
                          <Calendar className="h-5 w-5 text-gray-500" />
                          <div>
                            <p className="font-medium">Start Date</p>
                            <p className="text-sm text-gray-600">
                              {format(new Date(opportunity.start_date), 'PPP')}
                            </p>
                          </div>
                        </div>
                      )}

                      {opportunity.is_recurring && (
                        <div className="flex items-center gap-3">
                          <Users className="h-5 w-5 text-gray-500" />
                          <div>
                            <p className="font-medium">Type</p>
                            <p className="text-sm text-gray-600">Recurring Opportunity</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {opportunity.required_skills.length > 0 && (
                      <div>
                        <p className="font-medium mb-2">Required Skills:</p>
                        <div className="flex flex-wrap gap-2">
                          {opportunity.required_skills.map((skill) => (
                            <Badge key={skill} variant="secondary">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Club Information */}
          {club && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">About the Club</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={club.logo_url} />
                    <AvatarFallback>
                      {club.name.split(' ').map(word => word[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold">{club.name}</h4>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {club.location}
                    </p>
                    {club.verified && (
                      <Badge variant="outline" className="mt-1">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                </div>

                {club.description && (
                  <p className="text-sm text-gray-700">
                    {club.description}
                  </p>
                )}

                {/* Contact Information */}
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">{club.contact_email}</span>
                  </div>
                  
                  {club.contact_phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">{club.contact_phone}</span>
                    </div>
                  )}
                  
                  {club.website_url && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="h-4 w-4 text-gray-500" />
                      <a 
                        href={club.website_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Visit Website
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Volunteer Information */}
          {volunteer && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Volunteer Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={volunteer.profile_image_url} />
                    <AvatarFallback>
                      {volunteer.first_name[0]}{volunteer.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold">
                      {volunteer.first_name} {volunteer.last_name}
                    </h4>
                    <p className="text-sm text-gray-600">{volunteer.email}</p>
                  </div>
                </div>

                {volunteer.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{volunteer.location}</span>
                  </div>
                )}

                {volunteer.skills.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Skills:</p>
                    <div className="flex flex-wrap gap-1">
                      {volunteer.skills.slice(0, 6).map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {volunteer.skills.length > 6 && (
                        <Badge variant="secondary" className="text-xs">
                          +{volunteer.skills.length - 6} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          {showActions && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {application.status === 'accepted' && onMessage && (
                    <Button onClick={onMessage} className="w-full">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Contact Club
                    </Button>
                  )}
                  
                  {application.status === 'pending' && onWithdraw && (
                    <Button 
                      variant="outline" 
                      onClick={onWithdraw} 
                      className="w-full text-red-600 hover:text-red-700"
                    >
                      Withdraw Application
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status Help */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">What's Next?</CardTitle>
            </CardHeader>
            <CardContent>
              {application.status === 'pending' && (
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• The club is reviewing your application</li>
                  <li>• You'll be notified when they make a decision</li>
                  <li>• Check your email regularly for updates</li>
                  <li>• You can withdraw your application if needed</li>
                </ul>
              )}
              
              {application.status === 'accepted' && (
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Congratulations on being accepted!</li>
                  <li>• The club will contact you with next steps</li>
                  <li>• You can message them directly if needed</li>
                  <li>• Be sure to confirm your participation</li>
                </ul>
              )}
              
              {application.status === 'rejected' && (
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Don't be discouraged - keep applying!</li>
                  <li>• Consider updating your profile</li>
                  <li>• Look for other opportunities that match your skills</li>
                  <li>• Each application is valuable experience</li>
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}