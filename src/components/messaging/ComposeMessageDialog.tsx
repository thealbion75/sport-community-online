/**
 * Compose Message Dialog Component
 * Dialog for composing and sending new messages
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown, Send, Users, Building } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSendMessage } from '@/hooks/use-messages';
import { useSearchVolunteers } from '@/hooks/use-volunteers';
import { useVerifiedClubs } from '@/hooks/use-clubs';
import { useAuthContext } from '@/contexts/AuthContext';
import type { MessageFormData } from '@/types';

// Validation schema
const messageSchema = z.object({
  recipient_id: z.string().min(1, 'Please select a recipient'),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  content: z.string().min(10, 'Message must be at least 10 characters'),
});

type FormData = z.infer<typeof messageSchema>;

interface ComposeMessageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  prefilledRecipient?: {
    id: string;
    name: string;
    type: 'volunteer' | 'club';
  };
  prefilledSubject?: string;
}

export const ComposeMessageDialog: React.FC<ComposeMessageDialogProps> = ({
  isOpen,
  onClose,
  prefilledRecipient,
  prefilledSubject
}) => {
  const { user } = useAuthContext();
  const [recipientSearch, setRecipientSearch] = useState('');
  const [showRecipientDropdown, setShowRecipientDropdown] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<{
    id: string;
    name: string;
    type: 'volunteer' | 'club';
    avatar?: string;
  } | null>(prefilledRecipient || null);

  const sendMessageMutation = useSendMessage();

  // Search for potential recipients
  const { data: volunteersData } = useSearchVolunteers(
    recipientSearch ? { location: recipientSearch } : {},
    1,
    10
  );
  const { data: clubs = [] } = useVerifiedClubs();

  const volunteers = volunteersData?.data || [];

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch
  } = useForm<FormData>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      recipient_id: prefilledRecipient?.id || '',
      subject: prefilledSubject || '',
      content: ''
    }
  });

  React.useEffect(() => {
    if (prefilledRecipient) {
      setSelectedRecipient(prefilledRecipient);
      setValue('recipient_id', prefilledRecipient.id);
    }
    if (prefilledSubject) {
      setValue('subject', prefilledSubject);
    }
  }, [prefilledRecipient, prefilledSubject, setValue]);

  const onSubmit = async (data: FormData) => {
    if (!user?.id) return;

    try {
      const result = await sendMessageMutation.mutateAsync({
        senderId: user.id,
        messageData: data
      });

      if (result.success) {
        reset();
        setSelectedRecipient(null);
        onClose();
      }
    } catch (error) {
      console.error('Send message error:', error);
    }
  };

  const handleClose = () => {
    reset();
    setSelectedRecipient(null);
    setRecipientSearch('');
    onClose();
  };

  const handleSelectRecipient = (recipient: {
    id: string;
    name: string;
    type: 'volunteer' | 'club';
    avatar?: string;
  }) => {
    setSelectedRecipient(recipient);
    setValue('recipient_id', recipient.id);
    setShowRecipientDropdown(false);
  };

  // Combine volunteers and clubs for recipient selection
  const allRecipients = [
    ...volunteers.map(v => ({
      id: v.user_id,
      name: `${v.first_name} ${v.last_name}`,
      type: 'volunteer' as const,
      avatar: v.profile_image_url,
      location: v.location,
      skills: v.skills
    })),
    ...clubs.map(c => ({
      id: c.id,
      name: c.name,
      type: 'club' as const,
      avatar: c.logo_url,
      location: c.location,
      sport_types: c.sport_types
    }))
  ].filter(recipient => 
    recipient.name.toLowerCase().includes(recipientSearch.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Compose Message</DialogTitle>
          <DialogDescription>
            Send a message to a volunteer or club
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Recipient Selection */}
          <div className="space-y-2">
            <Label>To *</Label>
            {selectedRecipient ? (
              <div className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={selectedRecipient.avatar} />
                  <AvatarFallback>
                    {selectedRecipient.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{selectedRecipient.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {selectedRecipient.type === 'volunteer' ? (
                        <Users className="h-2 w-2 mr-1" />
                      ) : (
                        <Building className="h-2 w-2 mr-1" />
                      )}
                      {selectedRecipient.type}
                    </Badge>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedRecipient(null);
                    setValue('recipient_id', '');
                  }}
                >
                  Change
                </Button>
              </div>
            ) : (
              <Popover open={showRecipientDropdown} onOpenChange={setShowRecipientDropdown}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={showRecipientDropdown}
                    className="w-full justify-between"
                  >
                    Select recipient...
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput 
                      placeholder="Search volunteers and clubs..." 
                      value={recipientSearch}
                      onValueChange={setRecipientSearch}
                    />
                    <CommandEmpty>No recipients found.</CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-y-auto">
                      {allRecipients.map((recipient) => (
                        <CommandItem
                          key={`${recipient.type}-${recipient.id}`}
                          value={recipient.name}
                          onSelect={() => handleSelectRecipient(recipient)}
                        >
                          <div className="flex items-center gap-3 w-full">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={recipient.avatar} />
                              <AvatarFallback className="text-xs">
                                {recipient.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{recipient.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {recipient.type === 'volunteer' ? (
                                    <Users className="h-2 w-2 mr-1" />
                                  ) : (
                                    <Building className="h-2 w-2 mr-1" />
                                  )}
                                  {recipient.type}
                                </Badge>
                              </div>
                              {'location' in recipient && recipient.location && (
                                <p className="text-xs text-gray-600">{recipient.location}</p>
                              )}
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            )}
            {errors.recipient_id && (
              <p className="text-sm text-red-600">{errors.recipient_id.message}</p>
            )}
          </div>

          {/* Subject */}
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

          {/* Message Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Message *</Label>
            <Textarea
              id="content"
              {...register('content')}
              placeholder="Write your message..."
              rows={8}
            />
            {errors.content && (
              <p className="text-sm text-red-600">{errors.content.message}</p>
            )}
            <p className="text-xs text-gray-500">
              Be clear and professional in your communication.
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4">
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
              disabled={isSubmitting || sendMessageMutation.isPending || !selectedRecipient}
            >
              <Send className="h-4 w-4 mr-2" />
              {isSubmitting || sendMessageMutation.isPending ? 'Sending...' : 'Send Message'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};