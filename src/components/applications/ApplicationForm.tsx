/**
 * Application Form Component
 * Form for volunteers to apply to opportunities
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LoadingSpinner } from '@/components/ui/loading-state';
import { FormError } from '@/components/ui/form-error';
import { useCreateApplication, useHasVolunteerApplied } from '@/hooks/use-applications';
import { useVolunteerProfile } from '@/hooks/use-volunteers';
import { useCurrentUser } from '@/hooks/use-auth';
import { applicationSchemas } from '@/lib/validation';
import { ApplicationFormData, VolunteerOpportunity } from '@/types';
import { 
  Send, 
  User, 
  Mail, 
  MapPin, 
  Users, 
  Clock,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';

interface ApplicationFormProps {
  opportunity: VolunteerOpportunity;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ApplicationForm({ opportunity, onSuccess, onCancel }: ApplicationFormProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  const { data: user } = useCurrentUser();
  const { data: volunteerProfile } = useVolunteerProfile(user?.id || '');
  const { data: hasApplied } = useHasVolunteerApplied(
    opportunity.id, 
    volunteerProfile?.id || ''
  );
  
  const createApplicationMutation = useCreateApplication();

  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchemas.create),
    defaultValues: {
      message: '',
    },
  });

  const onSubmit = async (data: ApplicationFormData) => {
    if (!volunteerProfile) {
      return;
    }

    try {
      const result = await createApplicationMutation.mutateAsync({
        opportunityId: opportunity.id,
        volunteerId: volunteerProfile.id,
        data,
      });
      
      if (result.success) {
        setShowConfirmation(true);
        form.reset();
        setTimeout(() => {
          onSuccess?.();
        }, 2000);
      }
    } catch (error) {
      // Error is handled by the mutation hook
    }
  };

  // Show confirmation screen after successful application
  if (showConfirmation) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Application Submitted!
            </h3>
            <p className="text-gray-600 mb-6">
              Your application for "{opportunity.title}" has been sent to {opportunity.club?.name}.
              They will review your application and get back to you soon.
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <p>• You'll receive an email confirmation shortly</p>
              <p>• The club will review your application within 3-5 business days</p>
              <p>• You can track your application status in your dashboard</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show message if user has already applied
  if (hasApplied) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Already Applied
            </h3>
            <p className="text-gray-600 mb-4">
              You have already submitted an application for this opportunity.
              Check your dashboard to track the status of your application.
            </p>
            {onCancel && (
              <Button onClick={onCancel} variant="outline">
                Close
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show message if no volunteer profile
  if (!volunteerProfile) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Complete Your Profile First
            </h3>
            <p className="text-gray-600 mb-4">
              You need to create a volunteer profile before you can apply for opportunities.
            </p>
            <Button onClick={() => window.location.href = '/profile'}>
              Create Profile
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">Apply for Opportunity</CardTitle>
              <CardDescription className="mt-2">
                Submit your application for "{opportunity.title}" at {opportunity.club?.name}
              </CardDescription>
            </div>
            {onCancel && (
              <Button variant="ghost" size="sm" onClick={onCancel}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Application Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Your Application
              </CardTitle>
              <CardDescription>
                Tell the club why you're interested and what you can bring to this opportunity
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Message */}
                <div className="space-y-2">
                  <Label htmlFor="message" className="text-sm font-medium">
                    Cover Message (Optional)
                  </Label>
                  <Textarea
                    id="message"
                    {...form.register('message')}
                    placeholder="Tell the club about your interest in this opportunity, relevant experience, and what you hope to contribute..."
                    rows={6}
                    className="w-full"
                  />
                  <FormError message={form.formState.errors.message?.message} />
                  <p className="text-xs text-gray-500">
                    A personal message helps clubs understand your motivation and can improve your chances of being selected.
                  </p>
                </div>

                {/* Confirmation Checkbox */}
                <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <h4 className="font-medium text-blue-900">Before you apply:</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start space-x-2">
                      <Checkbox id="confirm-availability" />
                      <Label htmlFor="confirm-availability" className="text-blue-800 cursor-pointer">
                        I confirm that I am available for the time commitment required ({opportunity.time_commitment})
                      </Label>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Checkbox id="confirm-skills" />
                      <Label htmlFor="confirm-skills" className="text-blue-800 cursor-pointer">
                        I understand the skills required and believe I can contribute effectively
                      </Label>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Checkbox id="confirm-contact" />
                      <Label htmlFor="confirm-contact" className="text-blue-800 cursor-pointer">
                        I agree to be contacted by the club regarding this application
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  {onCancel && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onCancel}
                      disabled={createApplicationMutation.isPending}
                      className="w-full sm:w-auto"
                    >
                      Cancel
                    </Button>
                  )}
                  
                  <Button
                    type="submit"
                    disabled={createApplicationMutation.isPending}
                    className="w-full sm:flex-1"
                  >
                    {createApplicationMutation.isPending && (
                      <LoadingSpinner size="sm" className="mr-2" />
                    )}
                    Submit Application
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Your Profile Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Profile</CardTitle>
              <CardDescription>
                This is how the club will see your information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={volunteerProfile.profile_image_url} />
                  <AvatarFallback>
                    {volunteerProfile.first_name[0]}{volunteerProfile.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold">
                    {volunteerProfile.first_name} {volunteerProfile.last_name}
                  </h4>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {volunteerProfile.email}
                  </p>
                </div>
              </div>

              {volunteerProfile.location && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>{volunteerProfile.location}</span>
                </div>
              )}

              {volunteerProfile.skills.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Your Skills:</p>
                  <div className="flex flex-wrap gap-1">
                    {volunteerProfile.skills.slice(0, 6).map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {volunteerProfile.skills.length > 6 && (
                      <Badge variant="secondary" className="text-xs">
                        +{volunteerProfile.skills.length - 6} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {volunteerProfile.availability.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Availability:</p>
                  <div className="flex flex-wrap gap-1">
                    {volunteerProfile.availability.map((time) => (
                      <Badge key={time} variant="outline" className="text-xs">
                        {time}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Opportunity Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Opportunity Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="font-semibold">{opportunity.title}</h4>
                <p className="text-sm text-gray-600">{opportunity.club?.name}</p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>{opportunity.time_commitment}</span>
                </div>
                
                {opportunity.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span>{opportunity.location}</span>
                  </div>
                )}
              </div>

              {opportunity.required_skills.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Required Skills:</p>
                  <div className="flex flex-wrap gap-1">
                    {opportunity.required_skills.slice(0, 4).map((skill) => (
                      <Badge key={skill} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {opportunity.required_skills.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{opportunity.required_skills.length - 4} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Application Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Application Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Be specific about your relevant experience</li>
                <li>• Explain why this opportunity interests you</li>
                <li>• Mention your availability clearly</li>
                <li>• Show enthusiasm and commitment</li>
                <li>• Ask questions if you need clarification</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}