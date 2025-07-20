/**
 * Volunteer Profile Edit Component
 * Allows volunteers to edit their profile information
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Save, X, Info } from 'lucide-react';
import { useUpdateVolunteerProfile } from '@/hooks/use-volunteers';
import { useAuthContext } from '@/contexts/AuthContext';
import type { VolunteerProfile, VolunteerRegistrationData } from '@/types';

// Validation schema
const volunteerEditSchema = z.object({
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

type FormData = z.infer<typeof volunteerEditSchema>;

// Common skills for volunteers
const SKILL_OPTIONS = [
  'Communication', 'Leadership', 'Teamwork', 'Organization', 'Time Management',
  'Customer Service', 'Teaching', 'Coaching', 'First Aid', 'Event Management',
  'Social Media', 'Photography', 'Marketing', 'Administration', 'Fundraising',
  'Technical Skills', 'Physical Fitness', 'Patience', 'Reliability', 'Enthusiasm',
  'Problem Solving', 'Creative Thinking', 'Public Speaking', 'Data Entry',
  'Graphic Design', 'Video Editing', 'Writing', 'Translation', 'Driving License'
];

// Availability options
const AVAILABILITY_OPTIONS = [
  'Weekday Mornings', 'Weekday Afternoons', 'Weekday Evenings',
  'Weekend Mornings', 'Weekend Afternoons', 'Weekend Evenings',
  'School Holidays', 'Summer Only', 'Winter Only', 'Flexible',
  'One-off Events', 'Regular Commitment', 'Short-term Projects'
];

interface VolunteerProfileEditProps {
  profile: VolunteerProfile;
  onSave?: () => void;
  onCancel?: () => void;
}

export const VolunteerProfileEdit: React.FC<VolunteerProfileEditProps> = ({
  profile,
  onSave,
  onCancel
}) => {
  const { user } = useAuthContext();
  const updateProfileMutation = useUpdateVolunteerProfile();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    setValue,
    watch,
    reset
  } = useForm<FormData>({
    resolver: zodResolver(volunteerEditSchema),
    defaultValues: {
      first_name: profile.first_name,
      last_name: profile.last_name,
      email: profile.email,
      phone: profile.phone || '',
      location: profile.location || '',
      bio: profile.bio || '',
      skills: profile.skills,
      availability: profile.availability,
      is_visible: profile.is_visible,
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
    if (!user) {
      console.error('User not authenticated');
      return;
    }

    try {
      const result = await updateProfileMutation.mutateAsync({
        userId: user.id,
        updates: data
      });
      if (result.success) {
        onSave?.();
      }
    } catch (error) {
      console.error('Update error:', error);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Save className="h-5 w-5" />
          Edit Your Profile
        </CardTitle>
        <CardDescription>
          Update your volunteer profile information to help clubs find you for the right opportunities.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Personal Information</h3>
            
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

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="john.smith@example.com"
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
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

            <div className="space-y-2">
              <Label htmlFor="bio">About You</Label>
              <Textarea
                id="bio"
                {...register('bio')}
                placeholder="Tell us about yourself, your interests, and why you want to volunteer..."
                rows={3}
              />
              {errors.bio && (
                <p className="text-sm text-red-600">{errors.bio.message}</p>
              )}
            </div>
          </div>

          {/* Skills */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Your Skills *</h3>
            <p className="text-sm text-gray-600">
              Select the skills you have that could be useful for volunteering
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
            <h3 className="text-lg font-medium">Your Availability *</h3>
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

          {/* Privacy Settings */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Privacy Settings</h3>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <Label htmlFor="is_visible" className="text-base font-medium">
                  Make my profile visible to clubs
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  Allow sports clubs to find and contact you for volunteer opportunities
                </p>
              </div>
              <Switch
                id="is_visible"
                checked={isVisible}
                onCheckedChange={(checked) => setValue('is_visible', checked)}
              />
            </div>
          </div>

          {/* Privacy Notice */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Privacy Notice:</strong> Your information will only be shared with verified sports clubs 
              when you apply for opportunities or make your profile visible. You can update your privacy 
              settings at any time.
            </AlertDescription>
          </Alert>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => reset()}
              disabled={!isDirty || isSubmitting}
            >
              Reset Changes
            </Button>
            <Button
              type="submit"
              disabled={!isDirty || isSubmitting || updateProfileMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting || updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};