/**
 * Opportunity Details Component
 * Full detailed view of a volunteer opportunity
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useOpportunity } from '@/hooks/use-opportunities';
import { useApplicationsByOpportunity } from '@/hooks/use-applications';
import { LoadingContainer } from '@/components/ui/loading-state';
import { VolunteerOpportunity } from '@/types';
import { 
  MapPin, 
  Clock, 
  Calendar, 
  Users, 
  Mail, 
  Phone, 
  Globe, 
  CheckCircle,
  RotateCcw,
  ArrowLeft,
  Heart,
  Share2
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface OpportunityDetailsProps {
  opportunityId?: string;
  opportunity?: VolunteerOpportunity;
  onBack?: () => void;
  onApply?: () => void;
  onContact?: () => void;
  showApplications?: boolean;
}

export function OpportunityDetails({ 
  opportunityId, 
  opportunity: propOpportunity,
  onBack, 
  onApply, 
  onContact,
  showApplications = false
}: OpportunityDetailsProps) {
  const { data: fetchedOpportunity, isLoading } = useOpportunity(opportunityId || '');
  const { data: applications } = useApplicationsByOpportunity(opportunityId || '');
  
  const opportunity = propOpportunity || fetchedOpportunity;

  if (isLoading) {
    return (
      <LoadingContainer isLoading={true} loadingText="Loading opportunity details..." />
    );
  }

  if (!opportunity) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Opportunity Not Found
            </h3>
            <p className="text-gray-600 mb-4">
              The opportunity you're looking for doesn't exist or has been removed.
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

  const club = opportunity.club;
  const applicationCount = applications?.length || 0;
  const isActive = opportunity.status === 'active';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        {onBack && (
          <Button variant="outline" onClick={onBack} className="self-start">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Opportunities
          </Button>
        )}
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Heart className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Opportunity Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-2xl mb-2">{opportunity.title}</CardTitle>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className={
                      opportunity.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : opportunity.status === 'filled'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-red-100 text-red-800'
                    }>
                      {opportunity.status}
                    </Badge>
                    {opportunity.is_recurring && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <RotateCcw className="h-3 w-3" />
                        Recurring
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-base">
                    Posted {formatDistanceToNow(new Date(opportunity.created_at))} ago
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Description */}
              <div>
                <h3 className="font-semibold mb-3">About This Opportunity</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {opportunity.description}
                </p>
              </div>

              <Separator />

              {/* Key Details */}
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

                {opportunity.end_date && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium">End Date</p>
                      <p className="text-sm text-gray-600">
                        {format(new Date(opportunity.end_date), 'PPP')}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Required Skills */}
              {opportunity.required_skills.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Required Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {opportunity.required_skills.map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Application Stats */}
              {showApplications && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-3">Application Statistics</h3>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span>{applicationCount} application{applicationCount !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>
                </>
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
                  <p className="text-sm text-gray-700 line-clamp-3">
                    {club.description}
                  </p>
                )}

                {/* Sport Types */}
                {club.sport_types.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Sports:</p>
                    <div className="flex flex-wrap gap-1">
                      {club.sport_types.slice(0, 3).map((sport) => (
                        <Badge key={sport} variant="outline" className="text-xs">
                          {sport}
                        </Badge>
                      ))}
                      {club.sport_types.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{club.sport_types.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
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

          {/* Action Buttons */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {isActive && onApply && (
                  <Button onClick={onApply} className="w-full" size="lg">
                    Apply for This Opportunity
                  </Button>
                )}
                
                {!isActive && (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">
                      {opportunity.status === 'filled' 
                        ? 'This opportunity has been filled' 
                        : 'This opportunity is no longer available'
                      }
                    </p>
                  </div>
                )}

                {onContact && (
                  <Button 
                    variant="outline" 
                    onClick={onContact} 
                    className="w-full"
                  >
                    Contact Club
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Application Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Highlight relevant skills and experience</li>
                <li>• Explain why you're interested in this opportunity</li>
                <li>• Mention your availability clearly</li>
                <li>• Be enthusiastic and genuine</li>
                <li>• Ask questions if you need clarification</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}