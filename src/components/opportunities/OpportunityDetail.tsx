/**
 * Opportunity Detail Component
 * Detailed view of a volunteer opportunity with application functionality
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  Building, 
  Star,
  ExternalLink,
  Mail,
  Phone,
  Globe,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { useOpportunity } from '@/hooks/useOpportunities';
import { useCreateApplication, useExistingApplication } from '@/hooks/useApplications';
import { useVolunteerProfile } from '@/hooks/useVolunteers';
import { useAuthContext } from '@/contexts/AuthContext';
import type { VolunteerOpportunity } from '@/types';

interface OpportunityDetailProps {
  opportunityId: string;
  onBack?: () => void;
}

export const OpportunityDetail: React.FC<OpportunityDetailProps> = ({
  opportunityId,
  onBack
}) => {
  const { user } = useAuthContext();
  const [applicationMessage, setApplicationMessage] = useState('');
  const [showApplicationDialog, setShowApplicationDialog] = useState(false);

  const { data: opportunity, isLoading, error } = useOpportunity(opportunityId);
  const { data: volunteerProfile } = useVolunteerProfile(user?.id || '');
  const { data: existingApplication } = useExistingApplication(
    opportunityId, 
    volunteerProfile?.id || ''
  );
  const createApplicationMutation = useCreateApplication();

  const handleApply = async () => {
    if (!volunteerProfile) return;

    try {
      const result = await createApplicationMutation.mutateAsync({
        opportunityId,
        volunteerId: volunteerProfile.id,
        applicationData: { message: applicationMessage }
      });

      if (result.success) {
        setShowApplicationDialog(false);
        setApplicationMessage('');
      }
    } catch (error) {
      console.error('Application error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !opportunity) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {error ? 'Error loading opportunity' : 'Opportunity not found'}
          </h3>
          <p className="text-gray-600 mb-4">
            {error?.message || 'The opportunity you\'re looking for doesn\'t exist or has been removed.'}
          </p>
          <Button onClick={onBack}>Go Back</Button>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'filled': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateRange = () => {
    if (opportunity.is_recurring) {
      return 'Ongoing opportunity';
    }
    
    if (opportunity.start_date && opportunity.end_date) {
      return `${format(new Date(opportunity.start_date), 'MMMM d, yyyy')} - ${format(new Date(opportunity.end_date), 'MMMM d, yyyy')}`;
    }
    
    if (opportunity.start_date) {
      return `Starting ${format(new Date(opportunity.start_date), 'MMMM d, yyyy')}`;
    }
    
    if (opportunity.end_date) {
      return `Until ${format(new Date(opportunity.end_date), 'MMMM d, yyyy')}`;
    }
    
    return 'Flexible dates';
  };

  const canApply = opportunity.status === 'active' && 
                   volunteerProfile && 
                   !existingApplication;

  const hasApplied = !!existingApplication;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      {onBack && (
        <Button variant="outline" onClick={onBack}>
          ← Back to Opportunities
        </Button>
      )}

      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={getStatusColor(opportunity.status)}>
                  {opportunity.status}
                </Badge>
                {opportunity.is_recurring && (
                  <Badge variant="outline">Recurring</Badge>
                )}
              </div>
              <CardTitle className="text-2xl mb-2">{opportunity.title}</CardTitle>
              <CardDescription className="text-base">
                {opportunity.description}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 ml-4">
              {canApply && (
                <Dialog open={showApplicationDialog} onOpenChange={setShowApplicationDialog}>
                  <DialogTrigger asChild>
                    <Button size="lg" className="min-w-[120px]">
                      Apply Now
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Apply for this opportunity</DialogTitle>
                      <DialogDescription>
                        Send your application to {opportunity.club?.name}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="message">Application Message (Optional)</Label>
                        <Textarea
                          id="message"
                          placeholder="Tell the club why you're interested in this opportunity and what you can bring to the role..."
                          value={applicationMessage}
                          onChange={(e) => setApplicationMessage(e.target.value)}
                          rows={4}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => setShowApplicationDialog(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleApply}
                          disabled={createApplicationMutation.isPending}
                        >
                          {createApplicationMutation.isPending ? 'Sending...' : 'Send Application'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              
              {hasApplied && (
                <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-2 rounded">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Applied ({existingApplication?.status})
                  </span>
                </div>
              )}

              {!volunteerProfile && (
                <Button variant="outline" disabled>
                  Create Profile to Apply
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Opportunity Details */}
          <Card>
            <CardHeader>
              <CardTitle>Opportunity Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Time Commitment</p>
                    <p className="text-sm text-gray-600">{opportunity.time_commitment}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Duration</p>
                    <p className="text-sm text-gray-600">{formatDateRange()}</p>
                  </div>
                </div>
                
                {opportunity.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Location</p>
                      <p className="text-sm text-gray-600">{opportunity.location}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Required Skills */}
          <Card>
            <CardHeader>
              <CardTitle>Required Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {opportunity.required_skills.map((skill) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Club Information */}
          {opportunity.club && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  About the Club
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={opportunity.club.logo_url} />
                    <AvatarFallback>
                      {opportunity.club.name.split(' ').map(word => word[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h4 className="font-medium flex items-center gap-2">
                      {opportunity.club.name}
                      {opportunity.club.verified && (
                        <Star className="h-3 w-3 text-yellow-500" />
                      )}
                    </h4>
                    <p className="text-sm text-gray-600">{opportunity.club.location}</p>
                  </div>
                </div>

                {opportunity.club.description && (
                  <p className="text-sm text-gray-700">
                    {opportunity.club.description}
                  </p>
                )}

                {/* Sport Types */}
                <div>
                  <p className="text-sm font-medium mb-2">Sports:</p>
                  <div className="flex flex-wrap gap-1">
                    {opportunity.club.sport_types.map((sport) => (
                      <Badge key={sport} variant="outline" className="text-xs">
                        {sport}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-3 w-3" />
                    <a 
                      href={`mailto:${opportunity.club.contact_email}`}
                      className="text-blue-600 hover:underline"
                    >
                      {opportunity.club.contact_email}
                    </a>
                  </div>
                  
                  {opportunity.club.contact_phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-3 w-3" />
                      <a 
                        href={`tel:${opportunity.club.contact_phone}`}
                        className="text-blue-600 hover:underline"
                      >
                        {opportunity.club.contact_phone}
                      </a>
                    </div>
                  )}
                  
                  {opportunity.club.website_url && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="h-3 w-3" />
                      <a 
                        href={opportunity.club.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1"
                      >
                        Visit Website
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Application Status */}
          {hasApplied && existingApplication && (
            <Card>
              <CardHeader>
                <CardTitle>Your Application</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status:</span>
                    <Badge className={getStatusColor(existingApplication.status)}>
                      {existingApplication.status}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Applied:</span>
                    <p className="text-sm text-gray-600">
                      {format(new Date(existingApplication.applied_at), 'MMMM d, yyyy')}
                    </p>
                  </div>
                  {existingApplication.message && (
                    <div>
                      <span className="text-sm font-medium">Your message:</span>
                      <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded mt-1">
                        {existingApplication.message}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};