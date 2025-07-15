/**
 * Club Registration Component
 * Form for clubs to register and verify their organization
 */

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { LoadingSpinner } from '@/components/ui/loading-state';
import { FormError } from '@/components/ui/form-error';
import { useCreateClub } from '@/hooks/use-clubs';
import { clubSchemas } from '@/lib/validation';
import { ClubRegistrationData } from '@/types';
import { MapPin, Mail, Phone, Globe, Users } from 'lucide-react';

// Common sport types for selection
const SPORT_TYPES = [
  'Football', 'Rugby', 'Cricket', 'Tennis', 'Basketball', 'Netball',
  'Hockey', 'Swimming', 'Athletics', 'Cycling', 'Golf', 'Badminton',
  'Table Tennis', 'Squash', 'Volleyball', 'Baseball', 'Softball',
  'Martial Arts', 'Boxing', 'Gymnastics', 'Dance', 'Fitness', 'Other'
];

interface ClubRegistrationProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ClubRegistration({ onSuccess, onCancel }: ClubRegistrationProps) {
  const createClubMutation = useCreateClub();

  const form = useForm<ClubRegistrationData>({
    resolver: zodResolver(clubSchemas.registration),
    defaultValues: {
      name: '',
      description: '',
      location: '',
      contact_email: '',
      contact_phone: '',
      website_url: '',
      sport_types: [],
    },
  });

  const onSubmit = async (data: ClubRegistrationData) => {
    try {
      const result = await createClubMutation.mutateAsync(data);
      if (result.success) {
        form.reset();
        onSuccess?.();
      }
    } catch (error) {
      // Error is handled by the mutation hook
    }
  };

  const handleSportTypeChange = (sportType: string, checked: boolean) => {
    const currentSportTypes = form.getValues('sport_types');
    if (checked) {
      form.setValue('sport_types', [...currentSportTypes, sportType]);
    } else {
      form.setValue('sport_types', currentSportTypes.filter(type => type !== sportType));
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Register Your Sports Club
        </CardTitle>
        <CardDescription>
          Join our volunteer platform to connect with enthusiastic volunteers in your community.
          Your club will be reviewed for verification before being listed.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Club Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Club Name *
            </Label>
            <Input
              id="name"
              {...form.register('name')}
              placeholder="e.g., East Grinstead Football Club"
              className="w-full"
            />
            <FormError message={form.formState.errors.name?.message} />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description
            </Label>
            <Textarea
              id="description"
              {...form.register('description')}
              placeholder="Tell us about your club, its history, and what makes it special..."
              rows={4}
              className="w-full"
            />
            <FormError message={form.formState.errors.description?.message} />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location *
            </Label>
            <Input
              id="location"
              {...form.register('location')}
              placeholder="e.g., East Grinstead, West Sussex"
              className="w-full"
            />
            <FormError message={form.formState.errors.location?.message} />
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_email" className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Contact Email *
              </Label>
              <Input
                id="contact_email"
                type="email"
                {...form.register('contact_email')}
                placeholder="contact@yourclub.com"
                className="w-full"
              />
              <FormError message={form.formState.errors.contact_email?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_phone" className="text-sm font-medium flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Contact Phone
              </Label>
              <Input
                id="contact_phone"
                type="tel"
                {...form.register('contact_phone')}
                placeholder="01342 123456"
                className="w-full"
              />
              <FormError message={form.formState.errors.contact_phone?.message} />
            </div>
          </div>

          {/* Website */}
          <div className="space-y-2">
            <Label htmlFor="website_url" className="text-sm font-medium flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Website
            </Label>
            <Input
              id="website_url"
              type="url"
              {...form.register('website_url')}
              placeholder="https://www.yourclub.com"
              className="w-full"
            />
            <FormError message={form.formState.errors.website_url?.message} />
          </div>

          {/* Sport Types */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Sport Types * (Select all that apply)
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-48 overflow-y-auto border rounded-md p-3">
              {SPORT_TYPES.map((sportType) => (
                <div key={sportType} className="flex items-center space-x-2">
                  <Checkbox
                    id={`sport-${sportType}`}
                    checked={form.watch('sport_types').includes(sportType)}
                    onCheckedChange={(checked) => 
                      handleSportTypeChange(sportType, checked as boolean)
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
            <FormError message={form.formState.errors.sport_types?.message} />
          </div>

          {/* Information Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Your club registration will be reviewed by our team</li>
              <li>• We may contact you to verify your club's legitimacy</li>
              <li>• Once verified, you can start posting volunteer opportunities</li>
              <li>• Volunteers will be able to find and apply to your opportunities</li>
            </ul>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={createClubMutation.isPending}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
            )}
            
            <Button
              type="submit"
              disabled={createClubMutation.isPending}
              className="w-full sm:flex-1"
            >
              {createClubMutation.isPending && (
                <LoadingSpinner size="sm" className="mr-2" />
              )}
              Register Club
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}