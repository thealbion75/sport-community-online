/**
 * Opportunity Form Component
 * Create/edit volunteer opportunities
 */

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { LoadingSpinner } from '@/components/ui/loading-state';
import { FormError } from '@/components/ui/form-error';
import { useCreateOpportunity, useUpdateOpportunity, useOpportunity } from '@/hooks/use-opportunities';
import { opportunitySchemas } from '@/lib/validation';
import { OpportunityFormData } from '@/types';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';

// Common skills for selection
const COMMON_SKILLS = [
  'Communication', 'Leadership', 'Teamwork', 'Organization', 'Time Management',
  'Customer Service', 'Event Planning', 'Marketing', 'Social Media', 'Photography',
  'First Aid', 'Coaching', 'Refereeing', 'Administration', 'Fundraising',
  'IT Support', 'Web Design', 'Graphic Design', 'Writing', 'Translation',
  'Driving', 'Manual Labor', 'Equipment Maintenance', 'Catering', 'Childcare'
];

interface OpportunityFormProps {
  clubId: string;
  opportunityId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function OpportunityForm({ 
  clubId, 
  opportunityId, 
  onSuccess, 
  onCancel 
}: OpportunityFormProps) {
  const isEditing = !!opportunityId;
  
  const createMutation = useCreateOpportunity();
  const updateMutation = useUpdateOpportunity();
  const { data: existingOpportunity } = useOpportunity(opportunityId || '');

  const form = useForm<OpportunityFormData>({
    resolver: zodResolver(opportunitySchemas.create),
    defaultValues: {
      title: '',
      description: '',
      required_skills: [],
      time_commitment: '',
      location: '',
      start_date: '',
      end_date: '',
      is_recurring: false,
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (existingOpportunity && isEditing) {
      form.reset({
        title: existingOpportunity.title,
        description: existingOpportunity.description,
        required_skills: existingOpportunity.required_skills,
        time_commitment: existingOpportunity.time_commitment,
        location: existingOpportunity.location || '',
        start_date: existingOpportunity.start_date || '',
        end_date: existingOpportunity.end_date || '',
        is_recurring: existingOpportunity.is_recurring,
      });
    }
  }, [existingOpportunity, isEditing, form]);

  const onSubmit = async (data: OpportunityFormData) => {
    try {
      if (isEditing && opportunityId) {
        const result = await updateMutation.mutateAsync({ id: opportunityId, data });
        if (result.success) {
          onSuccess?.();
        }
      } else {
        const result = await createMutation.mutateAsync({ clubId, data });
        if (result.success) {
          form.reset();
          onSuccess?.();
        }
      }
    } catch (error) {
      // Error is handled by the mutation hooks
    }
  };

  const handleSkillChange = (skill: string, checked: boolean) => {
    const currentSkills = form.getValues('required_skills');
    if (checked) {
      form.setValue('required_skills', [...currentSkills, skill]);
    } else {
      form.setValue('required_skills', currentSkills.filter(s => s !== skill));
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-sm font-medium">
          Opportunity Title *
        </Label>
        <Input
          id="title"
          {...form.register('title')}
          placeholder="e.g., Match Day Volunteer, Event Coordinator"
          className="w-full"
        />
        <FormError message={form.formState.errors.title?.message} />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium">
          Description *
        </Label>
        <Textarea
          id="description"
          {...form.register('description')}
          placeholder="Describe the role, responsibilities, and what volunteers can expect..."
          rows={5}
          className="w-full"
        />
        <FormError message={form.formState.errors.description?.message} />
      </div>

      {/* Time Commitment */}
      <div className="space-y-2">
        <Label htmlFor="time_commitment" className="text-sm font-medium flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Time Commitment *
        </Label>
        <Input
          id="time_commitment"
          {...form.register('time_commitment')}
          placeholder="e.g., 2 hours per week, One-off event, Match days only"
          className="w-full"
        />
        <FormError message={form.formState.errors.time_commitment?.message} />
      </div>

      {/* Location */}
      <div className="space-y-2">
        <Label htmlFor="location" className="text-sm font-medium flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Location
        </Label>
        <Input
          id="location"
          {...form.register('location')}
          placeholder="e.g., Club grounds, Various locations, Remote"
          className="w-full"
        />
        <FormError message={form.formState.errors.location?.message} />
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_date" className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Start Date
          </Label>
          <Input
            id="start_date"
            type="date"
            {...form.register('start_date')}
            className="w-full"
          />
          <FormError message={form.formState.errors.start_date?.message} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="end_date" className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            End Date
          </Label>
          <Input
            id="end_date"
            type="date"
            {...form.register('end_date')}
            className="w-full"
          />
          <FormError message={form.formState.errors.end_date?.message} />
        </div>
      </div>

      {/* Recurring */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="is_recurring"
          checked={form.watch('is_recurring')}
          onCheckedChange={(checked) => form.setValue('is_recurring', checked as boolean)}
        />
        <Label htmlFor="is_recurring" className="text-sm font-medium cursor-pointer">
          This is a recurring opportunity
        </Label>
      </div>

      {/* Required Skills */}
      <div className="space-y-3">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Users className="h-4 w-4" />
          Required Skills * (Select all that apply)
        </Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-48 overflow-y-auto border rounded-md p-3">
          {COMMON_SKILLS.map((skill) => (
            <div key={skill} className="flex items-center space-x-2">
              <Checkbox
                id={`skill-${skill}`}
                checked={form.watch('required_skills').includes(skill)}
                onCheckedChange={(checked) => 
                  handleSkillChange(skill, checked as boolean)
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
        <FormError message={form.formState.errors.required_skills?.message} />
      </div>

      {/* Information Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <h4 className="font-medium text-blue-900 mb-2">Tips for a great opportunity post:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Be specific about what volunteers will be doing</li>
          <li>• Mention any training or support you'll provide</li>
          <li>• Include the benefits volunteers will gain</li>
          <li>• Be clear about time commitments and expectations</li>
        </ul>
      </div>

      {/* Form Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
        )}
        
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:flex-1"
        >
          {isSubmitting && (
            <LoadingSpinner size="sm" className="mr-2" />
          )}
          {isEditing ? 'Update Opportunity' : 'Create Opportunity'}
        </Button>
      </div>
    </form>
  );
}