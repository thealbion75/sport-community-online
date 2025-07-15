/**
 * Contact Volunteer Dialog Component
 * Dialog for clubs to contact volunteers directly
 */

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, MapPin, Calendar, Info } from 'lucide-react';
import { format } from 'date-fns';
import { useSendMessage } from '@/hooks/useMessages';
import { useClubByEmail } from '@/hooks/useClubs';
import { useAuthContext } from '@/contexts/AuthContext';
import type { VolunteerProfile, MessageFormData } from '@/types';

// Validation schema
const messageSchema = z.object({
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  content: z.string().min(20, 'Message must be at least 20 characters'),
});

type FormData = z.infer<typeof messageSchema>;

interface ContactVolunteerDialogProps {
  volunteer: VolunteerProfile | null;
  isOpen: boolean;
  onClose: () => void;
  opportunityTitle?: string;
}

export const ContactVolunteerDialog: React.FC<ContactVolunteerDialogProps> = ({
  volunteer,
  isOpen,
  onClose,
  opportunityTitle
}) => {
  const { user } = useAuthContext();
  const { data: club } = useClubByEmail(user?.email || '');
  const sendMessageMutation = useSendMessage();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue
  } = useForm<FormData>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      subject: opportunityTitle ? `Volunteer Opportunity: ${opportunityTitle}` : 'Volunteer Opportunity',
      content: ''
    }
  });

  React.useEffect(() => {
    if (volunteer && club && opportunityTitle) {
      setValue('subject', `Volunteer Opportunity: ${opportunityTitle}`);
      setValue('content', 
        `Hi ${volunteer.first_name},\n\n` +
        `I hope this message finds you well. I'm reaching out from ${club.name} regarding a volunteer opportunity that might interest you.\n\n` +
        `We have a "${opportunityTitle}" position available and noticed that your skills and availability could be a great match for what we're looking for.\n\n` +
        `Would you be interested in learning more about this opportunity? I'd be happy to discuss the details with you.\n\n` +
        `Best regards,\n${club.name}`
      );
    }
  }, [volunteer, club, opportunityTitle, setValue]);

  const onSubmit = async (data: FormData) => {
    if (!volunteer || !user) return;

    try {
      const messageData: MessageFormData = {
        recipient_id: volunteer.user_id,
        subject: data.subject,
        content: data.content
      };

      const result = await sendMessageMutation.mutateAsync({
        senderId: user.id,
        messageData
      });

      if (result.success) {
        reset();
        onClose();
      }
    } catch (error) {
      console.error('Send message error:', error);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!volunteer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Contact Volunteer</DialogTitle>
          <DialogDescription>
            Send a message to {volunteer.first_name} {volunteer.last_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Volunteer Info */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-start gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={volunteer.profile_image_url} />
                <AvatarFallback>
                  {volunteer.first_name[0]}{volunteer.last_name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h4 className="font-semibold text-lg">
                  {volunteer.first_name} {volunteer.last_name}
                </h4>
                <div className="space-y-1 text-sm text-gray-600 mb-3">
                  <div className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {volunteer.email}
                  </div>
                  {volunteer.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {volunteer.location}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Member since {format(new Date(volunteer.created_at), 'MMMM yyyy')}
                  </div>
                </div>

                {/* Skills */}
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-600 mb-1">Skills:</p>
                  <div className="flex flex-wrap gap-1">
                    {volunteer.skills.slice(0, 8).map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {volunteer.skills.length > 8 && (
                      <Badge variant="secondary" className="text-xs">
                        +{volunteer.skills.length - 8} more
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Availability */}
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Availability:</p>
                  <div className="flex flex-wrap gap-1">
                    {volunteer.availability.slice(0, 4).map((slot) => (
                      <Badge key={slot} variant="outline" className="text-xs">
                        {slot}
                      </Badge>
                    ))}
                    {volunteer.availability.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{volunteer.availability.length - 4} more
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Club Info */}
          {club && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                This message will be sent from <strong>{club.name}</strong> ({club.contact_email}).
                The volunteer will be able to reply directly to you.
              </AlertDescription>
            </Alert>
          )}

          {/* Message Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                {...register('subject')}
                placeholder="e.g., Volunteer Opportunity at Our Club"
              />
              {errors.subject && (
                <p className="text-sm text-red-600">{errors.subject.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Message *</Label>
              <Textarea
                id="content"
                {...register('content')}
                placeholder="Write your message to the volunteer..."
                rows={8}
              />
              {errors.content && (
                <p className="text-sm text-red-600">{errors.content.message}</p>
              )}
              <p className="text-xs text-gray-500">
                Be clear about the opportunity, time commitment, and what you're looking for in a volunteer.
              </p>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || sendMessageMutation.isPending}
              >
                {isSubmitting || sendMessageMutation.isPending 
                  ? 'Sending Message...' 
                  : 'Send Message'
                }
              </Button>
            </div>
          </form>

          {/* Privacy Notice */}
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded border">
            <p>
              <strong>Privacy Notice:</strong> By sending this message, you acknowledge that you are contacting 
              this volunteer for legitimate club recruitment purposes. Please respect their privacy and only 
              contact them about relevant volunteer opportunities.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};