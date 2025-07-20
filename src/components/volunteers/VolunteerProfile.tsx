/**
 * Volunteer Profile Component
 * Displays and allows editing of volunteer profile information
 */

import React, { useState } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Edit, Eye, EyeOff, Mail, Phone, MapPin, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { useUpdateVolunteerProfile, useUpdateProfileVisibility } from '@/hooks/use-volunteers';
import type { VolunteerProfile, VolunteerRegistrationData } from '@/types';

// Validation schema
const profileUpdateSchema = z.object({
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  location: z.string().min(2, 'Location is required'),
  bio: z.string().optional(),
  skills: z.array(z.string()).min(1, 'Please select at least one skill'),
  availability: z.array(z.string()).min(1, 'Please select your availability'),
});

type FormData = z.infer<typeof profileUpdateSchema>;

// Common skills and availability options (same as registration)
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

interface VolunteerProfileProps {
  profile: VolunteerProfile;
  isOwnProfile?: boolean;
}

export const VolunteerProfile: React.FC<VolunteerProfileProps> = ({ 
  profile, 
  isOwnProfile = false 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const updateProfileMutation = useUpdateVolunteerProfile();
  const updateVisibilityMutation = useUpdateProfileVisibility();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    setValue,
    watch,
    reset
  } = useForm<FormData>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      first_name: profile.first_name,
      last_name: profile.last_name,
      email: profile.email,
      phone: profile.phone || '',
      location: profile.location || '',
      bio: profile.bio || '',
      skills: profile.skills,
      availability: profile.availability,
    }
  });

  const selectedSkills = watch('skills') || [];
  const selectedAvailability = watch('availability') || [];

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

  const handleVisibilityToggle = async (isVisible: boolean) => {
    await updateVisibilityMutation.mutateAsync({
      userId: profile.user_id,
      isVisible
    });
  };

  const onSubmit = async (data: FormData) => {
    try {
      const result = await updateProfileMutation.mutateAsync({
        userId: profile.user_id,
        updates: data
      });
      if (result.success) {
        setIsEditing(false);
        reset(data); // Reset form with new values
      }
    } catch (error) {
      console.error('Update error:', error);
    }
  };

  const handleCancelEdit = () => {
    reset(); // Reset to original values
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile.profile_image_url} />
                <AvatarFallback className="text-lg">
                  {profile.first_name[0]}{profile.last_name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-2xl font-bold">
                  {profile.first_name} {profile.last_name}
                </h1>
                <div className="space-y-1 mt-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {profile.email}
                  </div>
                  {profile.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {profile.phone}
                    </div>
                  )}
                  {profile.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {profile.location}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Joined {format(new Date(profile.created_at), 'MMMM yyyy')}
                  </div>
                </div>
              </div>
            </div>
            
            {isOwnProfile && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 mr-4">
                  <Badge variant={profile.is_visible ? 'default' : 'secondary'}>
                    {profile.is_visible ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
                    {profile.is_visible ? 'Visible' : 'Hidden'}
                  </Badge>
                  <Switch
                    checked={profile.is_visible}
                    onCheckedChange={handleVisibilityToggle}
                    disabled={updateVisibilityMutation.isPending}
                  />
                </div>
                <Button
                  variant={isEditing ? 'outline' : 'default'}
                  onClick={() => setIsEditing(!isEditing)}
                  disabled={isSubmitting}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Profile Content */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Bio */}
          {profile.bio && (
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{profile.bio}</p>
              </CardContent>
            </Card>
          )}

          {/* Skills */}
          <Card>
            <CardHeader>
              <CardTitle>Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <Badge key={skill} variant="outline">{skill}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Availability */}
          <Card>
            <CardHeader>
              <CardTitle>Availability</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {profile.availability.map((availability) => (
                  <Badge key={availability} variant="secondary">{availability}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-6">
          {isEditing && isOwnProfile ? (
            /* Edit Form */
            <Card>
              <CardHeader>
                <CardTitle>Edit Profile</CardTitle>
                <CardDescription>
                  Update your profile information to help clubs find you
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
                      disabled
                    />
                    <p className="text-xs text-gray-500">
                      Email cannot be changed from your profile
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      {...register('phone')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location *</Label>
                    <Input
                      id="location"
                      {...register('location')}
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
                      rows={4}
                    />
                  </div>

                  {/* Skills */}
                  <div className="space-y-3">
                    <Label>Your Skills *</Label>
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

                  {/* Form Actions */}
                  <div className="flex justify-end space-x-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={!isDirty || isSubmitting || updateProfileMutation.isPending}
                    >
                      {isSubmitting || updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : (
            /* View Mode */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Email</Label>
                    <p>{profile.email}</p>
                  </div>
                  {profile.phone && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Phone</Label>
                      <p>{profile.phone}</p>
                    </div>
                  )}
                  {profile.location && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Location</Label>
                      <p>{profile.location}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Profile Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Profile Visibility</Label>
                    <p className="flex items-center gap-2">
                      {profile.is_visible ? (
                        <>
                          <Eye className="h-4 w-4 text-green-600" />
                          Visible to clubs
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-4 w-4 text-gray-600" />
                          Hidden from clubs
                        </>
                      )}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Member Since</Label>
                    <p>{format(new Date(profile.created_at), 'MMMM d, yyyy')}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Last Updated</Label>
                    <p>{format(new Date(profile.updated_at), 'MMMM d, yyyy')}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};