/**
 * Volunteer Matchmaker Component
 * Intelligent matching system to find volunteers for specific opportunities
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Target, 
  Users, 
  Star, 
  MapPin, 
  Clock, 
  CheckCircle,
  MessageSquare,
  Lightbulb,
  TrendingUp
} from 'lucide-react';
import { useSearchVolunteers } from '@/hooks/use-volunteers';
import { ContactVolunteerDialog } from './ContactVolunteerDialog';
import type { VolunteerOpportunity, VolunteerProfile, VolunteerFilters } from '@/types';

interface VolunteerMatch {
  volunteer: VolunteerProfile;
  matchScore: number;
  matchReasons: string[];
  skillMatches: string[];
  availabilityMatches: string[];
}

interface VolunteerMatchmakerProps {
  opportunity: VolunteerOpportunity;
  onContactVolunteer?: (volunteerId: string) => void;
}

export const VolunteerMatchmaker: React.FC<VolunteerMatchmakerProps> = ({
  opportunity,
  onContactVolunteer
}) => {
  const [selectedVolunteer, setSelectedVolunteer] = useState<VolunteerProfile | null>(null);
  const [showContactDialog, setShowContactDialog] = useState(false);

  // Create filters based on opportunity requirements
  const matchFilters: VolunteerFilters = {
    skills: opportunity.required_skills,
    location: opportunity.location || opportunity.club?.location
  };

  const { data: volunteersData, isLoading } = useSearchVolunteers(matchFilters, 1, 20);
  const volunteers = volunteersData?.data || [];

  // Calculate match scores for volunteers
  const calculateMatchScore = (volunteer: VolunteerProfile): VolunteerMatch => {
    let score = 0;
    const matchReasons: string[] = [];
    const skillMatches: string[] = [];
    const availabilityMatches: string[] = [];

    // Skill matching (40% of score)
    const skillIntersection = volunteer.skills.filter(skill => 
      opportunity.required_skills.includes(skill)
    );
    const skillScore = (skillIntersection.length / opportunity.required_skills.length) * 40;
    score += skillScore;
    skillMatches.push(...skillIntersection);

    if (skillIntersection.length > 0) {
      matchReasons.push(`${skillIntersection.length} matching skills`);
    }

    // Location matching (20% of score)
    if (volunteer.location && opportunity.location) {
      const volunteerLocation = volunteer.location.toLowerCase();
      const opportunityLocation = opportunity.location.toLowerCase();
      
      if (volunteerLocation.includes(opportunityLocation) || 
          opportunityLocation.includes(volunteerLocation)) {
        score += 20;
        matchReasons.push('Location match');
      }
    } else if (volunteer.location && opportunity.club?.location) {
      const volunteerLocation = volunteer.location.toLowerCase();
      const clubLocation = opportunity.club.location.toLowerCase();
      
      if (volunteerLocation.includes(clubLocation) || 
          clubLocation.includes(volunteerLocation)) {
        score += 20;
        matchReasons.push('Near club location');
      }
    }

    // Availability matching (20% of score)
    const timeCommitment = opportunity.time_commitment.toLowerCase();
    let availabilityScore = 0;

    if (timeCommitment.includes('weekend') && 
        volunteer.availability.some(slot => slot.toLowerCase().includes('weekend'))) {
      availabilityScore += 10;
      availabilityMatches.push('Weekend availability');
    }

    if (timeCommitment.includes('weekday') && 
        volunteer.availability.some(slot => slot.toLowerCase().includes('weekday'))) {
      availabilityScore += 10;
      availabilityMatches.push('Weekday availability');
    }

    if (timeCommitment.includes('evening') && 
        volunteer.availability.some(slot => slot.toLowerCase().includes('evening'))) {
      availabilityScore += 5;
      availabilityMatches.push('Evening availability');
    }

    if (timeCommitment.includes('morning') && 
        volunteer.availability.some(slot => slot.toLowerCase().includes('morning'))) {
      availabilityScore += 5;
      availabilityMatches.push('Morning availability');
    }

    if (volunteer.availability.includes('Flexible')) {
      availabilityScore += 10;
      availabilityMatches.push('Flexible schedule');
    }

    score += availabilityScore;

    // Experience bonus (10% of score)
    if (volunteer.skills.length >= 8) {
      score += 10;
      matchReasons.push('Highly experienced');
    } else if (volunteer.skills.length >= 5) {
      score += 5;
      matchReasons.push('Experienced volunteer');
    }

    // Recurring opportunity bonus (10% of score)
    if (opportunity.is_recurring && 
        volunteer.availability.includes('Regular Commitment')) {
      score += 10;
      matchReasons.push('Prefers regular commitments');
    }

    return {
      volunteer,
      matchScore: Math.min(Math.round(score), 100),
      matchReasons,
      skillMatches,
      availabilityMatches
    };
  };

  const matches = volunteers
    .map(calculateMatchScore)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 10); // Top 10 matches

  const getMatchLevel = (score: number) => {
    if (score >= 80) return { level: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (score >= 60) return { level: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-100' };
    if (score >= 40) return { level: 'Fair', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    return { level: 'Poor', color: 'text-red-600', bgColor: 'bg-red-100' };
  };

  const handleContactVolunteer = (volunteer: VolunteerProfile) => {
    setSelectedVolunteer(volunteer);
    setShowContactDialog(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Finding the best volunteer matches...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Volunteer Matchmaker
          </CardTitle>
          <CardDescription>
            AI-powered matching to find the best volunteers for "{opportunity.title}"
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{matches.length}</div>
              <div className="text-sm text-gray-600">Potential Matches</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {matches.filter(m => m.matchScore >= 60).length}
              </div>
              <div className="text-sm text-gray-600">Good+ Matches</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {matches.filter(m => m.matchScore >= 80).length}
              </div>
              <div className="text-sm text-gray-600">Excellent Matches</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Matching Tips */}
      <Alert>
        <Lightbulb className="h-4 w-4" />
        <AlertDescription>
          <strong>Matching Algorithm:</strong> Volunteers are scored based on skill overlap (40%), 
          location proximity (20%), availability alignment (20%), experience level (10%), 
          and commitment preference (10%).
        </AlertDescription>
      </Alert>

      {/* No Matches */}
      {matches.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No matches found</h3>
            <p className="text-gray-600 mb-4">
              No volunteers currently match the requirements for this opportunity.
            </p>
            <Button variant="outline">
              Broaden Search Criteria
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Matches List */}
      {matches.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Top Matches
          </h3>
          
          {matches.map((match, index) => {
            const matchLevel = getMatchLevel(match.matchScore);
            
            return (
              <Card key={match.volunteer.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Rank Badge */}
                    <div className="flex-shrink-0">
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                        ${index === 0 ? 'bg-yellow-100 text-yellow-800' : 
                          index === 1 ? 'bg-gray-100 text-gray-800' :
                          index === 2 ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'}
                      `}>
                        {index + 1}
                      </div>
                    </div>

                    {/* Volunteer Info */}
                    <Avatar className="h-12 w-12 flex-shrink-0">
                      <AvatarImage src={match.volunteer.profile_image_url} />
                      <AvatarFallback>
                        {match.volunteer.first_name[0]}{match.volunteer.last_name[0]}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-lg">
                            {match.volunteer.first_name} {match.volunteer.last_name}
                          </h4>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            {match.volunteer.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {match.volunteer.location}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3" />
                              {match.volunteer.skills.length} skills
                            </span>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <Badge className={`${matchLevel.bgColor} ${matchLevel.color} mb-2`}>
                            {match.matchScore}% Match
                          </Badge>
                          <div className="text-xs text-gray-500">{matchLevel.level}</div>
                        </div>
                      </div>

                      {/* Match Score Progress */}
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Match Score</span>
                          <span>{match.matchScore}%</span>
                        </div>
                        <Progress value={match.matchScore} className="h-2" />
                      </div>

                      {/* Match Reasons */}
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-600 mb-2">Why this is a good match:</p>
                        <div className="flex flex-wrap gap-1">
                          {match.matchReasons.map((reason, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              <CheckCircle className="h-2 w-2 mr-1" />
                              {reason}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Skill Matches */}
                      {match.skillMatches.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-600 mb-1">Matching Skills:</p>
                          <div className="flex flex-wrap gap-1">
                            {match.skillMatches.map((skill) => (
                              <Badge key={skill} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button 
                          onClick={() => handleContactVolunteer(match.volunteer)}
                          size="sm"
                        >
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Contact
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => onContactVolunteer?.(match.volunteer.id)}
                        >
                          View Profile
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Contact Dialog */}
      <ContactVolunteerDialog
        volunteer={selectedVolunteer}
        isOpen={showContactDialog}
        onClose={() => {
          setShowContactDialog(false);
          setSelectedVolunteer(null);
        }}
        opportunityTitle={opportunity.title}
      />
    </div>
  );
};