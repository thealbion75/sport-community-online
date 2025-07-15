/**
 * Application Status Component
 * Display and manage application status for volunteers
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useWithdrawApplication } from '@/hooks/use-applications';
import { VolunteerApplication } from '@/types';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Calendar,
  MapPin,
  Users,
  MessageSquare,
  Eye,
  Trash2
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface ApplicationStatusProps {
  application: VolunteerApplication;
  onViewDetails?: () => void;
  onMessage?: () => void;
  showActions?: boolean;
}

export function ApplicationStatus({ 
  application, 
  onViewDetails, 
  onMessage,
  showActions = true 
}: ApplicationStatusProps) {
  const withdrawMutation = useWithdrawApplication();
  
  const opportunity = application.opportunity;
  const club = opportunity?.club;

  const handleWithdraw = async () => {
    if (window.confirm('Are you sure you want to withdraw this application? This action cannot be undone.')) {
      try {
        await withdrawMutation.mutateAsync(application.id);
      } catch (error) {
        // Error handled by mutation hook
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'accepted':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'withdrawn':
        return <AlertTriangle className="h-5 w-5 text-gray-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
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

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Your application is being reviewed by the club.';
      case 'accepted':
        return 'Congratulations! Your application has been accepted.';
      case 'rejected':
        return 'Unfortunately, your application was not successful this time.';
      case 'withdrawn':
        return 'You have withdrawn this application.';
      default:
        return 'Application status unknown.';
    }
  };

  if (!opportunity) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-lg">{opportunity.title}</CardTitle>
              <Badge className={getStatusColor(application.status)}>
                {application.status}
              </Badge>
            </div>
            
            {club && (
              <CardDescription className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                {club.name} • {club.location}
              </CardDescription>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {getStatusIcon(application.status)}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status Message */}
        <div className="p-3 bg-gray-50 rounded-md">
          <p className="text-sm text-gray-700">
            {getStatusMessage(application.status)}
          </p>
        </div>

        {/* Application Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>
              Applied {formatDistanceToNow(new Date(application.applied_at))} ago
            </span>
          </div>

          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="h-4 w-4" />
            <span>{opportunity.time_commitment}</span>
          </div>

          {opportunity.location && (
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="h-4 w-4" />
              <span>{opportunity.location}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>
              Updated {formatDistanceToNow(new Date(application.updated_at))} ago
            </span>
          </div>
        </div>

        {/* Application Message */}
        {application.message && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Your Message:</p>
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                {application.message}
              </p>
            </div>
          </div>
        )}

        {/* Required Skills Match */}
        {opportunity.required_skills.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Required Skills:</p>
            <div className="flex flex-wrap gap-1">
              {opportunity.required_skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Club Information */}
        {club && (
          <div className="pt-3 border-t">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={club.logo_url} />
                <AvatarFallback className="text-xs">
                  {club.name.split(' ').map(word => word[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{club.name}</p>
                <p className="text-xs text-gray-600">{club.contact_email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex flex-wrap gap-2 pt-3 border-t">
            {onViewDetails && (
              <Button variant="outline" size="sm" onClick={onViewDetails}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
            )}

            {application.status === 'accepted' && onMessage && (
              <Button variant="outline" size="sm" onClick={onMessage}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Contact Club
              </Button>
            )}

            {application.status === 'pending' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleWithdraw}
                disabled={withdrawMutation.isPending}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Withdraw
              </Button>
            )}
          </div>
        )}

        {/* Next Steps */}
        {application.status === 'accepted' && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <h4 className="font-medium text-green-900 mb-2">Next Steps:</h4>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• The club will contact you with further details</li>
              <li>• Check your email regularly for updates</li>
              <li>• You can message the club directly if you have questions</li>
            </ul>
          </div>
        )}

        {application.status === 'rejected' && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <h4 className="font-medium text-blue-900 mb-2">Don't give up!</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• There are many other opportunities available</li>
              <li>• Consider updating your profile with new skills</li>
              <li>• Keep applying to opportunities that interest you</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}