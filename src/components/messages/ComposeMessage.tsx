/**
 * Compose Message Component
 * Form for composing and sending new messages
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LoadingSpinner } from '@/components/ui/loading-state';
import { FormError } from '@/components/ui/form-error';
import { useSendMessage } from '@/hooks/use-messages';
import { useClubs } from '@/hooks/use-clubs';
import { useVisibleVolunteers } from '@/hooks/use-volunteers';
import { useCurrentUser, useUserRole } from '@/hooks/use-auth';
import { messageSchemas } from '@/lib/validation';
import { MessageFormData, UserRole } from '@/types';
import { 
  Send, 
  X, 
  Users, 
  Building, 
  User,
  Mail,
  CheckCircle
} from 'lucide-react';

interface ComposeMessageProps {
  recipientId?: string;
  recipientType?: 'club' | 'volunteer';
  subject?: string;
  onCancel?: () => void;
  onMessageSent?: () => void;
}

export function ComposeMessage({ 
  recipientId, 
  recipientType,
  subject: initialSubject,
  onCancel, 
  onMessageSent 
}: ComposeMessageProps) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState(recipientId || '');

  const { data: user } = useCurrentUser();
  const { data: userRole } = useUserRole();
  const { data: clubs } = useClubs({ verified: true, limit: 50 });
  const { data: volunteers } = useVisibleVolunteers(50);
  const sendMessageMutation = useSendMessage();

  const form = useForm<MessageFormData>({
    resolver: zodResolver(messageSchemas.create),
    defaultValues: {
      recipient_id: recipientId || '',
      subject: initialSubject || '',
      content: '',
    },
  });

  const onSubmit = async (data: MessageFormData) => {
    try {
      const result = await sendMessageMutation.mutateAsync({
        ...data,
        recipient_id: selectedRecipient || data.recipient_id,
      });
      
      if (result.success) {
        setShowSuccess(true);
        form.reset();
        setTimeout(() => {
          onMessageSent?.();
        }, 2000);
      }
    } catch (error) {
      // Error handled by mutation hook
    }
  };

  // Show success screen
  if (showSuccess) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Message Sent!
            </h3>
            <p className="text-gray-600 mb-6">
              Your message has been delivered successfully.
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <p>• The recipient will be notified of your message</p>
              <p>• You can track responses in your inbox</p>
              <p>• Messages are kept secure and private</p>
            </div>
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
              <CardTitle className="text-2xl flex items-center gap-2">
                <Mail className="h-6 w-6" />
                Compose Message
              </CardTitle>
              <CardDescription className="mt-2">
                Send a secure message to a club or volunteer
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

      {/* Compose Form */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Recipient Selection */}
            {!recipientId && (
              <div className="space-y-4">
                <Label className="text-sm font-medium">Send To</Label>
                
                {/* Recipient Type Tabs */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Clubs */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Building className="h-4 w-4" />
                      Sports Clubs
                    </div>
                    
                    {clubs && clubs.length > 0 ? (
                      <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
                        {clubs.map((club) => (
                          <div
                            key={club.id}
                            onClick={() => setSelectedRecipient(club.id)}
                            className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                              selectedRecipient === club.id
                                ? 'bg-blue-50 border border-blue-200'
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={club.logo_url} />
                              <AvatarFallback className="text-xs">
                                {club.name.split(' ').map(word => word[0]).join('').slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{club.name}</p>
                              <p className="text-xs text-gray-500 truncate">{club.location}</p>
                            </div>
                            {club.verified && (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 p-4 text-center border rounded-md">
                        No clubs available
                      </p>
                    )}
                  </div>

                  {/* Volunteers (only show to clubs) */}
                  {userRole === UserRole.CLUB_ADMIN && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Users className="h-4 w-4" />
                        Volunteers
                      </div>
                      
                      {volunteers && volunteers.length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
                          {volunteers.map((volunteer) => (
                            <div
                              key={volunteer.id}
                              onClick={() => setSelectedRecipient(volunteer.user_id)}
                              className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                                selectedRecipient === volunteer.user_id
                                  ? 'bg-blue-50 border border-blue-200'
                                  : 'hover:bg-gray-50'
                              }`}
                            >
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={volunteer.profile_image_url} />
                                <AvatarFallback className="text-xs">
                                  {volunteer.first_name[0]}{volunteer.last_name[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {volunteer.first_name} {volunteer.last_name}
                                </p>
                                <p className="text-xs text-gray-500 truncate">{volunteer.location}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 p-4 text-center border rounded-md">
                          No volunteers available
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {!selectedRecipient && (
                  <p className="text-sm text-gray-500">
                    Select a recipient from the list above to continue.
                  </p>
                )}
              </div>
            )}

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject" className="text-sm font-medium">
                Subject *
              </Label>
              <Input
                id="subject"
                {...form.register('subject')}
                placeholder="What is this message about?"
                maxLength={100}
              />
              <FormError message={form.formState.errors.subject?.message} />
            </div>

            {/* Message Content */}
            <div className="space-y-2">
              <Label htmlFor="content" className="text-sm font-medium">
                Message *
              </Label>
              <Textarea
                id="content"
                {...form.register('content')}
                placeholder="Type your message here..."
                rows={8}
                maxLength={2000}
              />
              <div className="flex justify-between items-center text-xs text-gray-500">
                <FormError message={form.formState.errors.content?.message} />
                <span>{form.watch('content')?.length || 0}/2000</span>
              </div>
            </div>

            {/* Message Guidelines */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h4 className="font-medium text-blue-900 mb-2">Message Guidelines:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Be respectful and professional in your communication</li>
                <li>• Clearly state your purpose and any questions you have</li>
                <li>• Include relevant details about opportunities or applications</li>
                <li>• Messages are private and secure between you and the recipient</li>
              </ul>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={sendMessageMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
              )}
              
              <Button
                type="submit"
                disabled={
                  sendMessageMutation.isPending || 
                  (!recipientId && !selectedRecipient) ||
                  !form.watch('subject') ||
                  !form.watch('content')
                }
                className="w-full sm:flex-1"
              >
                {sendMessageMutation.isPending && (
                  <LoadingSpinner size="sm" className="mr-2" />
                )}
                <Send className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Messaging Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">For Volunteers:</h4>
              <ul className="text-gray-600 space-y-1">
                <li>• Ask specific questions about opportunities</li>
                <li>• Share your relevant experience</li>
                <li>• Confirm your availability</li>
                <li>• Be enthusiastic and professional</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">For Clubs:</h4>
              <ul className="text-gray-600 space-y-1">
                <li>• Provide clear opportunity details</li>
                <li>• Respond to applications promptly</li>
                <li>• Ask about volunteer experience</li>
                <li>• Share next steps clearly</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}