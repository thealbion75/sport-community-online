/**
 * Volunteer Filters Component
 * Advanced filtering options for volunteer search
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { X } from 'lucide-react';
import type { VolunteerFilters as VolunteerFiltersType } from '@/types';

// Filter options
const SKILL_OPTIONS = [
  'Communication', 'Leadership', 'Teamwork', 'Organization', 'Time Management',
  'Customer Service', 'Teaching', 'Coaching', 'First Aid', 'Event Management',
  'Social Media', 'Photography', 'Marketing', 'Administration', 'Fundraising',
  'Technical Skills', 'Physical Fitness', 'Patience', 'Reliability', 'Enthusiasm',
  'Problem Solving', 'Creative Thinking', 'Public Speaking', 'Data Entry',
  'Graphic Design', 'Web Development', 'Accounting', 'Legal Knowledge'
];

const AVAILABILITY_OPTIONS = [
  'Weekday Mornings', 'Weekday Afternoons', 'Weekday Evenings',
  'Weekend Mornings', 'Weekend Afternoons', 'Weekend Evenings',
  'School Holidays', 'Summer Only', 'Winter Only', 'Flexible',
  'One-off Events', 'Regular Commitment', 'Short-term Projects'
];

const EXPERIENCE_LEVELS = [
  { value: 'beginner', label: 'Beginner (1-2 skills)', min: 1, max: 2 },
  { value: 'intermediate', label: 'Intermediate (3-4 skills)', min: 3, max: 4 },
  { value: 'experienced', label: 'Experienced (5-7 skills)', min: 5, max: 7 },
  { value: 'expert', label: 'Expert (8+ skills)', min: 8, max: 50 }
];

interface VolunteerFiltersProps {
  filters: VolunteerFiltersType;
  onFiltersChange: (filters: VolunteerFiltersType) => void;
}

export const VolunteerFilters: React.FC<VolunteerFiltersProps> = ({
  filters,
  onFiltersChange
}) => {
  const updateFilter = (key: keyof VolunteerFiltersType, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const toggleArrayFilter = (key: keyof VolunteerFiltersType, value: string) => {
    const currentArray = (filters[key] as string[]) || [];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    
    updateFilter(key, newArray.length > 0 ? newArray : undefined);
  };

  const clearFilter = (key: keyof VolunteerFiltersType) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    onFiltersChange(newFilters);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Location Filter */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="location">Location</Label>
            {filters.location && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearFilter('location')}
                className="h-auto p-1"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          <Input
            id="location"
            placeholder="e.g., East Grinstead, London"
            value={filters.location || ''}
            onChange={(e) => updateFilter('location', e.target.value || undefined)}
          />
        </div>

        {/* Experience Level Filter */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Experience Level</Label>
            {filters.experience_level && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearFilter('experience_level')}
                className="h-auto p-1"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          <Select
            value={filters.experience_level || ''}
            onValueChange={(value) => updateFilter('experience_level', value || undefined)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select experience level" />
            </SelectTrigger>
            <SelectContent>
              {EXPERIENCE_LEVELS.map((level) => (
                <SelectItem key={level.value} value={level.value}>
                  {level.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Minimum Skills Count */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Minimum Skills ({filters.min_skills || 1})</Label>
            {filters.min_skills && filters.min_skills > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearFilter('min_skills')}
                className="h-auto p-1"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          <Slider
            value={[filters.min_skills || 1]}
            onValueChange={(value) => updateFilter('min_skills', value[0] > 1 ? value[0] : undefined)}
            max={15}
            min={1}
            step={1}
            className="w-full"
          />
        </div>
      </div>

      {/* Skills Filter */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Required Skills</Label>
          {filters.skills && filters.skills.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => clearFilter('skills')}
              className="h-auto p-1"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        <p className="text-sm text-gray-600">
          Select skills that volunteers should have
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-40 overflow-y-auto border rounded-md p-3">
          {SKILL_OPTIONS.map((skill) => (
            <div key={skill} className="flex items-center space-x-2">
              <Checkbox
                id={`skill-${skill}`}
                checked={(filters.skills || []).includes(skill)}
                onCheckedChange={() => toggleArrayFilter('skills', skill)}
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

      {/* Availability Filter */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Availability</Label>
          {filters.availability && filters.availability.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => clearFilter('availability')}
              className="h-auto p-1"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        <p className="text-sm text-gray-600">
          Select when volunteers should be available
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-32 overflow-y-auto border rounded-md p-3">
          {AVAILABILITY_OPTIONS.map((slot) => (
            <div key={slot} className="flex items-center space-x-2">
              <Checkbox
                id={`availability-${slot}`}
                checked={(filters.availability || []).includes(slot)}
                onCheckedChange={() => toggleArrayFilter('availability', slot)}
              />
              <Label
                htmlFor={`availability-${slot}`}
                className="text-sm font-normal cursor-pointer"
              >
                {slot}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Active Filters Summary */}
      {Object.keys(filters).length > 0 && (
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Active Filters:</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onFiltersChange({})}
            >
              Clear All
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {filters.location && (
              <div className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                Location: {filters.location}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearFilter('location')}
                  className="h-auto p-0 ml-1"
                >
                  <X className="h-2 w-2" />
                </Button>
              </div>
            )}
            {filters.experience_level && (
              <div className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                Experience: {EXPERIENCE_LEVELS.find(l => l.value === filters.experience_level)?.label}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearFilter('experience_level')}
                  className="h-auto p-0 ml-1"
                >
                  <X className="h-2 w-2" />
                </Button>
              </div>
            )}
            {filters.min_skills && filters.min_skills > 1 && (
              <div className="flex items-center gap-1 bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                Min Skills: {filters.min_skills}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearFilter('min_skills')}
                  className="h-auto p-0 ml-1"
                >
                  <X className="h-2 w-2" />
                </Button>
              </div>
            )}
            {filters.skills && filters.skills.length > 0 && (
              <div className="flex items-center gap-1 bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">
                Skills: {filters.skills.length} selected
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearFilter('skills')}
                  className="h-auto p-0 ml-1"
                >
                  <X className="h-2 w-2" />
                </Button>
              </div>
            )}
            {filters.availability && filters.availability.length > 0 && (
              <div className="flex items-center gap-1 bg-pink-100 text-pink-800 px-2 py-1 rounded text-xs">
                Availability: {filters.availability.length} selected
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearFilter('availability')}
                  className="h-auto p-0 ml-1"
                >
                  <X className="h-2 w-2" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};