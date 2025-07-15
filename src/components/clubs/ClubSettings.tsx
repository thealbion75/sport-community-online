/**
 * Club Settings Component
 * Allows club administrators to update their club information
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
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertCircle } from 'lucide-react';
import { useUpdateClub } from '@/hooks/useClubs';
import type { Club, ClubRegistrationData } from '@/types';

// Validation schema
const clubSettingsSchema = z.object({
  name: z.string().min(2, 'Club name must be at least 2 characters'),
  description: z.string().optional(),
  location: z.string().min(2, 'Location is required'),
  contact_email: z.string().email('Please enter a valid email address'),
  contact_phone: z.string().optional(),
  website_url: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  sport_types: z.array(z.string()).min(1, 'Please select at least one sport type'),
});

type FormData = z.infer<typeof clubSettingsSchema>;

// Common sport types
const SPORT_OPTIONS = [
  'Football', 'Tennis', 'Cricket', 'Rugby', 'Basketball', 'Netball',
  'Swimming', 'Athletics', 'Cycling', 'Running', 'Golf', 'Hockey',
  'Badminton', 'Squash', 'Table Tennis', 'Volleyball', 'Baseball',
  'Softball', 'Martial Arts', 'Boxing', 'Gymnastics', 'Dance'
];

interface ClubSettingsProps {
  club: Club;
}

export const ClubSettings: React.FC<ClubSettingsProps> = ({ club }) => {
  const updateClubMutation = useUpdateClub();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    setValue,
    watch,
    reset
  } = useForm<FormData>({
    resolver: zodResolver(clubSettingsSchema),
    defaultValues: {
      name: club.name,
      description: club.description || '',
      location: club.location,
      contact_email: club.contact_email,
      contact_phone: club.contact_phone || '',
      website_url: club.website_url || '',
      sport_types: club.sport_types,
    }
  });

  const selectedSports = watch('sport_types') || [];

  const handleSportToggle = (sport: string) => {
    const currentSports = selectedSports;
    const updatedSports = currentSports.includes(sport)
      ? currentSports.filter(s => s !== sport)
      : [...currentSports, sport];
    setValue('sport_types', updatedSports);
  };

  const onSubmit = async (data: FormData) => {
    try {
      const result = await updateClubMutation.mutateAsync({
        id: club.id,
        updates: data
      });
      if (result.success) {
        reset(data); // Reset form with new values to clear isDirty
      }
    } catch (error) {
      console.error('Update error:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Verification Status */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <div>
              <strong>Verification Status:</strong>{' '}
              <Badge variant={club.verified ? 'default' : 'secondary'}>
                {club.verified ? 'Verified' : 'Pending Verification'}
              </Badge>
            </div>
          </div>
          {!club.verified && (
            <p className="mt-2 text-sm text-gray-600">
              Your club is pending verification. Once verified, your volunteer opportunities will be visible to all users.
            </p>
          )}
        </AlertDescription>
      </Alert>

      {/* Settings Form */}
      <Card>
        <CardHeader>
          <CardTitle>Club Information</CardTitle>
          <CardDescription>
            Update your club's information. Changes will be saved immediately.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Club Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Club Name *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="e.g., East Grinstead Tennis Club"
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Club Description</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Tell us about your club, its history, and what makes it special..."
                rows={3}
              />
              {errors.description && (
                <p className="text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            {/* Location */}
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

            {/* Contact Email */}
            <div className="space-y-2">
              <Label htmlFor="contact_email">Contact Email *</Label>
              <Input
                id="contact_email"
                type="email"
                {...register('contact_email')}
                placeholder="info@yourclub.co.uk"
              />
              {errors.contact_email && (
                <p className="text-sm text-red-600">{errors.contact_email.message}</p>
              )}
              <p className="text-xs text-gray-500">
                Note: Changing your contact email may affect your login access.
              </p>
            </div>

            {/* Contact Phone */}
            <div className="space-y-2">
              <Label htmlFor="contact_phone">Contact Phone</Label>
              <Input
                id="contact_phone"
                {...register('contact_phone')}
                placeholder="01342 123456"
              />
              {errors.contact_phone && (
                <p className="text-sm text-red-600">{errors.contact_phone.message}</p>
              )}
            </div>

            {/* Website URL */}
            <div className="space-y-2">
              <Label htmlFor="website_url">Website URL</Label>
              <Input
                id="website_url"
                {...register('website_url')}
                placeholder="https://www.yourclub.co.uk"
              />
              {errors.website_url && (
                <p className="text-sm text-red-600">{errors.website_url.message}</p>
              )}
            </div>

            {/* Sport Types */}
            <div className="space-y-3">
              <Label>Sport Types *</Label>
              <p className="text-sm text-gray-600">
                Select all sports that your club is involved with
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {SPORT_OPTIONS.map((sport) => (
                  <div key={sport} className="flex items-center space-x-2">
                    <Checkbox
                      id={sport}
                      checked={selectedSports.includes(sport)}
                      onCheckedChange={() => handleSportToggle(sport)}
                    />
                    <Label
                      htmlFor={sport}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {sport}
                    </Label>
                  </div>
                ))}
              </div>
              {errors.sport_types && (
                <p className="text-sm text-red-600">{errors.sport_types.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
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
                disabled={!isDirty || isSubmitting || updateClubMutation.isPending}
              >
                {isSubmitting || updateClubMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Club Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Club Statistics</CardTitle>
          <CardDescription>
            Overview of your club's activity on the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {new Date(club.created_at).getFullYear()}
              </p>
              <p className="text-sm text-gray-600">Joined Platform</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {club.sport_types.length}
              </p>
              <p className="text-sm text-gray-600">Sports Offered</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">
                {club.verified ? '✓' : '⏳'}
              </p>
              <p className="text-sm text-gray-600">Verification</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">
                {club.location.split(',')[0]}
              </p>
              <p className="text-sm text-gray-600">Location</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};