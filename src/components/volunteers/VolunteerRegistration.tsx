/**
 * Volunteer Registration Component
 * Allows volunteers to create their profile on the platform
 */

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { useCreateVolunteerProfile } from '@/hooks/useVolunteers';
import { useAuthContext } from '@/contexts/AuthContext';
import type { VolunteerRegistrationData } from '@/types';

// Validation schema
const volunteerRegistrationSchema = z.object({
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  location: z.string().min(2, 'Location is required'),
  bio: z.string().optional(),
  skills: z.array(z.string()).min(1, 'Please select at least one skill'),
  availability: z.array(z.string()).min(1, 'Please select your availability'),
  is_visible: z.boolean().default(true),
});

type FormData = z.infer<typeof volunteerRegistrationSchema>;

// Common skills for volunteers
const SKILL_OPTIONS = [
  'Communication', 'Leadership', 'Teamwork', 'Organization', 'Time Management',
  'Customer Service', 'Teaching', 'Coaching', 'First Aid', 'Event Management',
  'Social Media', 'Photography', 'Marketing', 'Administration', 'Fundraising',
  'Technical Skills', 'Physical Fitness', 'Patience', 'Reliability', 'Enthusiasm',
  'Problem Solving', 'Creative Thinking', 'Public Speaking', 'Data Entry',
  'Graphic Design', 'Web Development', 'Accounting', 'Legal Knowledge'
];

// Availability options
const AVAILABILITY_OPTIONS = [
  'Weekday Mornings', 'Weekday Afternoons', 'Weekday Evenings',
  'Weekend Mornings', 'Weekend Afternoons', 'Weekend Evenings',
  'School Holidays', 'Summer Only', 'Winter Only', 'Flexible',
  'One-off Events', 'Regular Commitment', 'Short-term Projects'
];

interface VolunteerRegistrationProps {
  onSuccess?: () => void;
}

export const VolunteerRegistration: React.FC<VolunteerRegistrationProps> = ({ onSuccess }) => {
  const { user } = useAuthContext();
  const createProfileMutation = useCreateVolunteerProfile();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset
  } = useForm<FormData>({
    resolver: zodResolver(volunteerRegistrationSchema),
    defaultValues: {
      email: user?.email || '',
      skills: [],
      availability: [],
      is_visible: true
    }
  });

  const selectedSkills = watch('skills') || [];
  const selectedAvailability = watch('availability') || [];
  const isVisible = watch('is_visible');

  const handleSkillToggle = (skill: string) => {
    const currentSkills = selectedSkills;
    const updatedSkills = currentSkills.includes(skill)
      ? currentSkills.filter(s => s !== skill)
      : [...currentSkills, skill];
    setValue('skills', updatedSkills);
  };

  const handleAvailabilityToggle = (availability: string) => {
    const currentAvailability = selectedAvailability;
    const updatedAvailability = currentAvailability.includes(availability)
      ? currentAvailability.filter(a => a !== availability)
      : [...currentAvailability, availability];
    setValue('availability', updatedAvailability);
  };

  const onSubmit = async (data: FormData) => {
    if (!user) return;
    
    try {
      const result = await createProfileMutation.mutateAsync({
        userId: user.id,
        profileData: data
      });
      if (result.success) {
        reset();
        onSuccess?.();
      }
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Create Your Volunteer Profile</CardTitle>
        <CardDescription>
          Join our community of volunteers and discover opportunities to help local sports clubs.
          Your profile helps clubs find volunteers with the right skills and availability.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                {...register('first_name')}
                placeholder="John"
              />
              {errors.first_name && (
                <p className="text-sm text-red-600">{errors.first_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                {...register('last_name')}
                placeholder="Smith"
              />
              {errors.last_name && (
                <p className="text-sm text-red-600">{errors.last_name.message}</p>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="john.smith@example.com"
              disabled={!!user?.email}
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
            {user?.email && (
              <p className="text-xs text-gray-500">
                Email is automatically filled from your account
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              {...register('phone')}
              placeholder="01342 123456"
            />
            {errors.phone && (
              <p className="text-sm text-red-600">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <Input
              id="location"
              {...register('location')}
              placeholder="e.g., East Grinstead, West Sussex"
            />
            {errors.location && (
              <p className="text-sm text-red-600">{errors.location.message}</p>
            )}
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">About You</Label>
            <Textarea
              id="bio"
              {...register('bio')}
              placeholder="Tell clubs about yourself, your interests, and why you want to volunteer..."
              rows={4}
            />
            {errors.bio && (
              <p className="text-sm text-red-600">{errors.bio.message}</p>
            )}
          </div>

          {/* Skills */}
          <div className="space-y-3">
            <Label>Your Skills *</Label>
            <p className="text-sm text-gray-600">
              Select the skills you have that could be useful for volunteering
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto border rounded-md p-3">
              {SKILL_OPTIONS.map((skill) => (
                <div key={skill} className="flex items-center space-x-2">
                  <Checkbox
                    id={skill}
                    checked={selectedSkills.includes(skill)}
                    onCheckedChange={() => handleSkillToggle(skill)}
                  />
                  <Label
                    htmlFor={skill}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {skill}
                  </Label>
                </div>
              ))}
            </div>
            {errors.skills && (
              <p className="text-sm text-red-600">{errors.skills.message}</p>
            )}
          </div>

          {/* Availability */}
          <div className="space-y-3">
            <Label>Your Availability *</Label>
            <p className="text-sm text-gray-600">
              When are you typically available to volunteer?
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {AVAILABILITY_OPTIONS.map((availability) => (
                <div key={availability} className="flex items-center space-x-2">
                  <Checkbox
                    id={availability}
                    checked={selectedAvailability.includes(availability)}
                    onCheckedChange={() => handleAvailabilityToggle(availability)}
                  />
                  <Label
                    htmlFor={availability}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {availability}
                  </Label>
                </div>
              ))}
            </div>
            {errors.availability && (
              <p className="text-sm text-red-600">{errors.availability.message}</p>
            )}
          </div>

          {/* Profile Visibility */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label htmlFor="is_visible" className="text-base font-medium">
                Make my profile visible to clubs
              </Label>
              <p className="text-sm text-gray-600">
                Allow clubs to find and contact you directly for volunteer opportunities
              </p>
            </div>
            <Switch
              id="is_visible"
              checked={isVisible}
              onCheckedChange={(checked) => setValue('is_visible', checked)}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => reset()}
              disabled={isSubmitting}
            >
              Clear Form
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || createProfileMutation.isPending}
            >
              {isSubmitting || createProfileMutation.isPending ? 'Creating Profile...' : 'Create Profile'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};