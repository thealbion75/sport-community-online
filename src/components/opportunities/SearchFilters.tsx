/**
 * Search Filters Component
 * Advanced filtering for volunteer opportunities
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { OpportunityFilters } from '@/types';
import { 
  MapPin, 
  Clock, 
  Users, 
  Calendar, 
  RotateCcw,
  X,
  Filter
} from 'lucide-react';

// Common filter options
const SPORT_TYPES = [
  'Football', 'Rugby', 'Cricket', 'Tennis', 'Basketball', 'Netball',
  'Hockey', 'Swimming', 'Athletics', 'Cycling', 'Golf', 'Badminton',
  'Table Tennis', 'Squash', 'Volleyball', 'Baseball', 'Softball',
  'Martial Arts', 'Boxing', 'Gymnastics', 'Dance', 'Fitness', 'Other'
];

const COMMON_SKILLS = [
  'Communication', 'Leadership', 'Teamwork', 'Organization', 'Time Management',
  'Customer Service', 'Event Planning', 'Marketing', 'Social Media', 'Photography',
  'First Aid', 'Coaching', 'Refereeing', 'Administration', 'Fundraising',
  'IT Support', 'Web Design', 'Graphic Design', 'Writing', 'Translation',
  'Driving', 'Manual Labor', 'Equipment Maintenance', 'Catering', 'Childcare'
];

const TIME_COMMITMENTS = [
  'One-off event',
  '1-2 hours per week',
  '3-5 hours per week',
  '6-10 hours per week',
  'More than 10 hours per week',
  'Flexible',
  'Match days only',
  'Weekends only',
  'Evenings only'
];

const LOCATIONS = [
  'East Grinstead',
  'Crawley',
  'Horsham',
  'Haywards Heath',
  'Burgess Hill',
  'Redhill',
  'Reigate',
  'Dorking',
  'Leatherhead',
  'Epsom'
];

interface SearchFiltersProps {
  filters: OpportunityFilters;
  onFiltersChange: (filters: OpportunityFilters) => void;
  onClose?: () => void;
}

export function SearchFilters({ filters, onFiltersChange, onClose }: SearchFiltersProps) {
  const [localFilters, setLocalFilters] = useState<OpportunityFilters>(filters);

  // Update local filters when props change
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    onClose?.();
  };

  const handleClearFilters = () => {
    const clearedFilters: OpportunityFilters = {};
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const handleSkillToggle = (skill: string, checked: boolean) => {
    const currentSkills = localFilters.required_skills || [];
    const newSkills = checked 
      ? [...currentSkills, skill]
      : currentSkills.filter(s => s !== skill);
    
    setLocalFilters(prev => ({
      ...prev,
      required_skills: newSkills
    }));
  };

  const handleSportTypeToggle = (sportType: string, checked: boolean) => {
    const currentSports = localFilters.sport_types || [];
    const newSports = checked 
      ? [...currentSports, sportType]
      : currentSports.filter(s => s !== sportType);
    
    setLocalFilters(prev => ({
      ...prev,
      sport_types: newSports
    }));
  };

  const selectedSkillsCount = localFilters.required_skills?.length || 0;
  const selectedSportsCount = localFilters.sport_types?.length || 0;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Opportunities
            </CardTitle>
            <CardDescription>
              Narrow down opportunities to find the perfect match
            </CardDescription>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Location Filter */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Location
          </Label>
          <Select
            value={localFilters.location || ''}
            onValueChange={(value) => 
              setLocalFilters(prev => ({ ...prev, location: value || undefined }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All locations</SelectItem>
              {LOCATIONS.map((location) => (
                <SelectItem key={location} value={location}>
                  {location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Time Commitment Filter */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Time Commitment
          </Label>
          <Select
            value={localFilters.time_commitment || ''}
            onValueChange={(value) => 
              setLocalFilters(prev => ({ ...prev, time_commitment: value || undefined }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select time commitment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Any time commitment</SelectItem>
              {TIME_COMMITMENTS.map((commitment) => (
                <SelectItem key={commitment} value={commitment}>
                  {commitment}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Range Filter */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Date Range
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="start_date" className="text-xs text-gray-600">
                Start Date
              </Label>
              <Input
                id="start_date"
                type="date"
                value={localFilters.start_date || ''}
                onChange={(e) => 
                  setLocalFilters(prev => ({ ...prev, start_date: e.target.value || undefined }))
                }
              />
            </div>
            <div>
              <Label htmlFor="end_date" className="text-xs text-gray-600">
                End Date
              </Label>
              <Input
                id="end_date"
                type="date"
                value={localFilters.end_date || ''}
                onChange={(e) => 
                  setLocalFilters(prev => ({ ...prev, end_date: e.target.value || undefined }))
                }
              />
            </div>
          </div>
        </div>

        {/* Recurring Filter */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Opportunity Type
          </Label>
          <Select
            value={localFilters.is_recurring === undefined ? '' : localFilters.is_recurring.toString()}
            onValueChange={(value) => {
              const isRecurring = value === '' ? undefined : value === 'true';
              setLocalFilters(prev => ({ ...prev, is_recurring: isRecurring }));
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Any type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Any type</SelectItem>
              <SelectItem value="true">Recurring opportunities</SelectItem>
              <SelectItem value="false">One-time opportunities</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sport Types Filter */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4" />
            Sport Types
            {selectedSportsCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {selectedSportsCount} selected
              </Badge>
            )}
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto border rounded-md p-3">
            {SPORT_TYPES.map((sportType) => (
              <div key={sportType} className="flex items-center space-x-2">
                <Checkbox
                  id={`sport-${sportType}`}
                  checked={(localFilters.sport_types || []).includes(sportType)}
                  onCheckedChange={(checked) => 
                    handleSportTypeToggle(sportType, checked as boolean)
                  }
                />
                <Label 
                  htmlFor={`sport-${sportType}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {sportType}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Required Skills Filter */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4" />
            Required Skills
            {selectedSkillsCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {selectedSkillsCount} selected
              </Badge>
            )}
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto border rounded-md p-3">
            {COMMON_SKILLS.map((skill) => (
              <div key={skill} className="flex items-center space-x-2">
                <Checkbox
                  id={`skill-${skill}`}
                  checked={(localFilters.required_skills || []).includes(skill)}
                  onCheckedChange={(checked) => 
                    handleSkillToggle(skill, checked as boolean)
                  }
                />
                <Label 
                  htmlFor={`skill-${skill}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {skill}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleClearFilters}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Clear All
          </Button>
          <Button
            onClick={handleApplyFilters}
            className="flex-1"
          >
            Apply Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}