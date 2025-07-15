/**
 * Volunteer Card Component
 * Displays individual volunteer information for club recruitment
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MapPin, 
  Calendar, 
  Mail, 
  Phone, 
  Eye,
  MessageSquare,
  UserPlus,
  Star
} from 'lucide-react';
import { format } from 'date-fns';
import type { VolunteerProfile } from '@/types';

interface VolunteerCardProps {
  volunteer: VolunteerProfile;
  viewMode?: 'grid' | 'list';
  onContact?: () => void;
  onView?: () => void;
  onInvite?: () => void;
  showContactInfo?: boolean;
}

export const VolunteerCard: React.FC<VolunteerCardProps> = ({
  volunteer,
  viewMode = 'grid',
  onContact,
  onView,
  onInvite,
  showContactInfo = false
}) => {
  const isListView = viewMode === 'list';

  const getExperienceLevel = (skills: string[]) => {
    if (skills.length >= 8) return { level: 'Expert', color: 'bg-green-100 text-green-800' };
    if (skills.length >= 5) return { level: 'Experienced', color: 'bg-blue-100 text-blue-800' };
    if (skills.length >= 3) return { level: 'Intermediate', color: 'bg-yellow-100 text-yellow-800' };
    return { level: 'Beginner', color: 'bg-gray-100 text-gray-800' };
  };

  const experienceLevel = getExperienceLevel(volunteer.skills);

  if (isListView) {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <Avatar className="h-16 w-16 flex-shrink-0">
              <AvatarImage src={volunteer.profile_image_url} />
              <AvatarFallback className="text-lg">
                {volunteer.first_name[0]}{volunteer.last_name[0]}
              </AvatarFallback>
            </Avatar>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {volunteer.first_name} {volunteer.last_name}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                    {volunteer.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {volunteer.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Joined {format(new Date(volunteer.created_at), 'MMM yyyy')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className={experienceLevel.color}>
                      <Star className="h-3 w-3 mr-1" />
                      {experienceLevel.level}
                    </Badge>
                    <Badge variant="outline">
                      {volunteer.skills.length} skills
                    </Badge>
                    <Badge variant="outline">
                      {volunteer.availability.length} availability slots
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Bio */}
              {volunteer.bio && (
                <p className="text-gray-700 mb-4 line-clamp-2">
                  {volunteer.bio}
                </p>
              )}

              {/* Skills */}
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-600 mb-2">Skills:</p>
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

              {/* Availability */}
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-600 mb-2">Availability:</p>
                <div className="flex flex-wrap gap-1">
                  {volunteer.availability.slice(0, 4).map((slot) => (
                    <Badge key={slot} variant="outline" className="text-xs">
                      {slot}
                    </Badge>
                  ))}
                  {volunteer.availability.length > 4 && (
                    <Badge variant="outline" className="text-xs">
                      +{volunteer.availability.length - 4} more
                    </Badge>
                  )}
                </div>
              </div>

              {/* Contact Info (if allowed) */}
              {showContactInfo && (
                <div className="mb-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1 mb-1">
                    <Mail className="h-3 w-3" />
                    {volunteer.email}
                  </div>
                  {volunteer.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {volunteer.phone}
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button onClick={onView} variant="outline" size="sm">
                  <Eye className="h-3 w-3 mr-1" />
                  View Profile
                </Button>
                <Button onClick={onContact} size="sm">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Contact
                </Button>
                {onInvite && (
                  <Button onClick={onInvite} variant="outline" size="sm">
                    <UserPlus className="h-3 w-3 mr-1" />
                    Invite
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
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={volunteer.profile_image_url} />
            <AvatarFallback>
              {volunteer.first_name[0]}{volunteer.last_name[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">
              {volunteer.first_name} {volunteer.last_name}
            </CardTitle>
            <CardDescription className="flex items-center gap-1">
              {volunteer.location && (
                <>
                  <MapPin className="h-3 w-3" />
                  {volunteer.location}
                </>
              )}
            </CardDescription>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge className={experienceLevel.color} className="text-xs">
            <Star className="h-2 w-2 mr-1" />
            {experienceLevel.level}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {volunteer.skills.length} skills
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        {/* Bio */}
        {volunteer.bio && (
          <p className="text-gray-700 text-sm mb-4 line-clamp-3 flex-1">
            {volunteer.bio}
          </p>
        )}

        {/* Skills */}
        <div className="mb-4">
          <p className="text-xs font-medium text-gray-600 mb-2">Top Skills:</p>
          <div className="flex flex-wrap gap-1">
            {volunteer.skills.slice(0, 4).map((skill) => (
              <Badge key={skill} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
            {volunteer.skills.length > 4 && (
              <Badge variant="secondary" className="text-xs">
                +{volunteer.skills.length - 4}
              </Badge>
            )}
          </div>
        </div>

        {/* Availability */}
        <div className="mb-4">
          <p className="text-xs font-medium text-gray-600 mb-2">Availability:</p>
          <div className="flex flex-wrap gap-1">
            {volunteer.availability.slice(0, 3).map((slot) => (
              <Badge key={slot} variant="outline" className="text-xs">
                {slot}
              </Badge>
            ))}
            {volunteer.availability.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{volunteer.availability.length - 3}
              </Badge>
            )}
          </div>
        </div>

        {/* Contact Info (if allowed) */}
        {showContactInfo && (
          <div className="mb-4 text-xs text-gray-600">
            <div className="flex items-center gap-1 mb-1">
              <Mail className="h-2 w-2" />
              <span className="truncate">{volunteer.email}</span>
            </div>
            {volunteer.phone && (
              <div className="flex items-center gap-1">
                <Phone className="h-2 w-2" />
                {volunteer.phone}
              </div>
            )}
          </div>
        )}

        {/* Member Since */}
        <div className="text-xs text-gray-500 mb-4">
          <div className="flex items-center gap-1">
            <Calendar className="h-2 w-2" />
            Member since {format(new Date(volunteer.created_at), 'MMM yyyy')}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 mt-auto">
          <Button onClick={onView} variant="outline" size="sm" className="w-full">
            <Eye className="h-3 w-3 mr-1" />
            View Profile
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={onContact} size="sm">
              <MessageSquare className="h-3 w-3 mr-1" />
              Contact
            </Button>
            {onInvite && (
              <Button onClick={onInvite} variant="outline" size="sm">
                <UserPlus className="h-3 w-3 mr-1" />
                Invite
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};