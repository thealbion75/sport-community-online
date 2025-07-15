/**
 * Opportunity Card Component
 * Displays individual volunteer opportunity information
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  Building, 
  Star,
  Eye,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import type { VolunteerOpportunity } from '@/types';

interface OpportunityCardProps {
  opportunity: VolunteerOpportunity;
  viewMode?: 'grid' | 'list';
  onApply?: () => void;
  onView?: () => void;
  showClubInfo?: boolean;
}

export const OpportunityCard: React.FC<OpportunityCardProps> = ({
  opportunity,
  viewMode = 'grid',
  onApply,
  onView,
  showClubInfo = true
}) => {
  const isListView = viewMode === 'list';

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
      return 'Ongoing';
    }
    
    if (opportunity.start_date && opportunity.end_date) {
      return `${format(new Date(opportunity.start_date), 'MMM d')} - ${format(new Date(opportunity.end_date), 'MMM d, yyyy')}`;
    }
    
    if (opportunity.start_date) {
      return `From ${format(new Date(opportunity.start_date), 'MMM d, yyyy')}`;
    }
    
    if (opportunity.end_date) {
      return `Until ${format(new Date(opportunity.end_date), 'MMM d, yyyy')}`;
    }
    
    return 'Flexible dates';
  };

  if (isListView) {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            {/* Club Avatar */}
            {showClubInfo && opportunity.club && (
              <Avatar className="h-12 w-12 flex-shrink-0">
                <AvatarImage src={opportunity.club.logo_url} />
                <AvatarFallback>
                  {opportunity.club.name.split(' ').map(word => word[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {opportunity.title}
                  </h3>
                  {showClubInfo && opportunity.club && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <Building className="h-3 w-3" />
                      {opportunity.club.name}
                      {opportunity.club.verified && (
                        <Badge variant="outline" className="text-xs">
                          <Star className="h-2 w-2 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                <Badge className={getStatusColor(opportunity.status)}>
                  {opportunity.status}
                </Badge>
              </div>

              <p className="text-gray-700 mb-4 line-clamp-2">
                {opportunity.description}
              </p>

              {/* Details Row */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {opportunity.location || opportunity.club?.location}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {opportunity.time_commitment}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDateRange()}
                </span>
                {opportunity.is_recurring && (
                  <Badge variant="outline" className="text-xs">
                    Recurring
                  </Badge>
                )}
              </div>

              {/* Skills */}
              <div className="flex flex-wrap gap-1 mb-4">
                {opportunity.required_skills.slice(0, 4).map((skill) => (
                  <Badge key={skill} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
                {opportunity.required_skills.length > 4 && (
                  <Badge variant="secondary" className="text-xs">
                    +{opportunity.required_skills.length - 4} more
                  </Badge>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button onClick={onView} variant="outline" size="sm">
                  <Eye className="h-3 w-3 mr-1" />
                  View Details
                </Button>
                {opportunity.status === 'active' && (
                  <Button onClick={onApply} size="sm">
                    Apply Now
                  </Button>
                )}
                {opportunity.club?.website_url && (
                  <Button variant="ghost" size="sm" asChild>
                    <a 
                      href={opportunity.club.website_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Club Website
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Grid view
  return (
    <Card className="hover:shadow-md transition-shadow h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between mb-2">
          <Badge className={getStatusColor(opportunity.status)}>
            {opportunity.status}
          </Badge>
          {opportunity.is_recurring && (
            <Badge variant="outline" className="text-xs">
              Recurring
            </Badge>
          )}
        </div>
        
        <CardTitle className="text-lg line-clamp-2">
          {opportunity.title}
        </CardTitle>
        
        {showClubInfo && opportunity.club && (
          <CardDescription className="flex items-center gap-2">
            <Avatar className="h-5 w-5">
              <AvatarImage src={opportunity.club.logo_url} />
              <AvatarFallback className="text-xs">
                {opportunity.club.name.split(' ').map(word => word[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            {opportunity.club.name}
            {opportunity.club.verified && (
              <Star className="h-3 w-3 text-yellow-500" />
            )}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        <p className="text-gray-700 text-sm mb-4 line-clamp-3 flex-1">
          {opportunity.description}
        </p>

        {/* Details */}
        <div className="space-y-2 text-xs text-gray-600 mb-4">
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span className="truncate">
              {opportunity.location || opportunity.club?.location}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span className="truncate">{opportunity.time_commitment}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span className="truncate">{formatDateRange()}</span>
          </div>
        </div>

        {/* Skills */}
        <div className="flex flex-wrap gap-1 mb-4">
          {opportunity.required_skills.slice(0, 3).map((skill) => (
            <Badge key={skill} variant="secondary" className="text-xs">
              {skill}
            </Badge>
          ))}
          {opportunity.required_skills.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{opportunity.required_skills.length - 3}
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 mt-auto">
          <Button onClick={onView} variant="outline" size="sm" className="w-full">
            <Eye className="h-3 w-3 mr-1" />
            View Details
          </Button>
          {opportunity.status === 'active' && (
            <Button onClick={onApply} size="sm" className="w-full">
              Apply Now
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};