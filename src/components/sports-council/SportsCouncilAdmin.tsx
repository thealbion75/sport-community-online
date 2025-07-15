/**
 * Sports Council Admin Component
 * Administrative interface for sports council administrators to manage meetings
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { LoadingContainer } from '@/components/ui/loading-state';
import { 
  useAllMeetings, 
  useCreateMeeting, 
  useUpdateMeeting, 
  useDeleteMeeting,
  useSportsCouncilStats 
} from '@/hooks/use-sports-council';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Calendar, 
  Clock, 
  MapPin, 
  FileText, 
  Users,
  BarChart3,
  Eye,
  EyeOff
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { MeetingFormData, SportsCouncilMeeting } from '@/types';

// Form validation schema
const meetingSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  meeting_date: z.string().min(1, 'Meeting date is required'),
  meeting_time: z.string().optional(),
  location: z.string().optional(),
  agenda: z.string().optional(),
  minutes: z.string().optional(),
  status: z.enum(['upcoming', 'completed', 'cancelled']),
  is_public: z.boolean(),
});

type MeetingFormValues = z.infer<typeof meetingSchema>;

interface MeetingDialogProps {
  meeting?: SportsCouncilMeeting;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function MeetingDialog({ meeting, open, onOpenChange }: MeetingDialogProps) {
  const createMutation = useCreateMeeting();
  const updateMutation = useUpdateMeeting();
  const isEditing = !!meeting;

  const form = useForm<MeetingFormValues>({
    resolver: zodResolver(meetingSchema),
    defaultValues: {
      title: meeting?.title || '',
      meeting_date: meeting?.meeting_date || '',
      meeting_time: meeting?.meeting_time || '',
      location: meeting?.location || '',
      agenda: meeting?.agenda || '',
      minutes: meeting?.minutes || '',
      status: meeting?.status || 'upcoming',
      is_public: meeting?.is_public ?? true,
    },
  });

  const onSubmit = async (data: MeetingFormValues) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ ...data, id: meeting.id });
      } else {
        await createMutation.mutateAsync(data);
      }
      onOpenChange(false);
      form.reset();
    } catch (error) {
      // Error handling is done in the mutation hooks
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Meeting' : 'Create New Meeting'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update the meeting details and minutes.' 
              : 'Create a new sports council meeting with agenda and details.'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meeting Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Monthly Sports Council Meeting" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="meeting_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meeting Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="meeting_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meeting Time (Optional)</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Community Centre, Main Hall" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="upcoming">Upcoming</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_public"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Public Visibility</FormLabel>
                      <FormDescription className="text-xs">
                        Make this meeting visible to the public
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="agenda"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Agenda (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Meeting agenda items..."
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Outline the topics to be discussed in the meeting.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="minutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meeting Minutes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Meeting minutes and notes..."
                      className="min-h-[120px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Record what was discussed and decided in the meeting.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : (isEditing ? 'Update Meeting' : 'Create Meeting')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function SportsCouncilAdmin() {
  const [selectedTab, setSelectedTab] = useState('meetings');
  const [editingMeeting, setEditingMeeting] = useState<SportsCouncilMeeting | undefined>();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { data: meetings = [], isLoading } = useAllMeetings();
  const { data: stats } = useSportsCouncilStats();
  const deleteMutation = useDeleteMeeting();

  const handleEditMeeting = (meeting: SportsCouncilMeeting) => {
    setEditingMeeting(meeting);
    setIsEditDialogOpen(true);
  };

  const handleDeleteMeeting = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  const formatMeetingDate = (dateString: string, timeString?: string) => {
    const date = parseISO(dateString);
    const dateFormatted = format(date, 'MMM d, yyyy');
    
    if (timeString) {
      const [hours, minutes] = timeString.split(':');
      const time = new Date();
      time.setHours(parseInt(hours), parseInt(minutes));
      const timeFormatted = format(time, 'h:mm a');
      return `${dateFormatted} at ${timeFormatted}`;
    }
    
    return dateFormatted;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Sports Council Administration
            </h1>
            <p className="text-gray-600">
              Manage sports council meetings, agendas, and minutes.
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Meeting
          </Button>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="meetings" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Meetings
              {meetings.length > 0 && (
                <Badge variant="secondary">{meetings.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Meetings</p>
                        <p className="text-2xl font-bold">{stats.total_meetings}</p>
                      </div>
                      <Calendar className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Upcoming</p>
                        <p className="text-2xl font-bold text-blue-600">{stats.upcoming_meetings}</p>
                      </div>
                      <Clock className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Completed</p>
                        <p className="text-2xl font-bold text-green-600">{stats.completed_meetings}</p>
                      </div>
                      <FileText className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">This Year</p>
                        <p className="text-2xl font-bold text-purple-600">{stats.meetings_this_year}</p>
                      </div>
                      <BarChart3 className="h-8 w-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common administrative tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-auto p-4 flex flex-col items-center gap-2"
                    onClick={() => setIsCreateDialogOpen(true)}
                  >
                    <Plus className="h-6 w-6" />
                    <span>Create New Meeting</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-auto p-4 flex flex-col items-center gap-2"
                    onClick={() => setSelectedTab('meetings')}
                  >
                    <FileText className="h-6 w-6" />
                    <span>Manage Meetings</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Meetings Tab */}
          <TabsContent value="meetings">
            <LoadingContainer isLoading={isLoading}>
              {meetings.length > 0 ? (
                <div className="space-y-4">
                  {meetings.map((meeting) => (
                    <Card key={meeting.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg mb-2">{meeting.title}</CardTitle>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>{formatMeetingDate(meeting.meeting_date, meeting.meeting_time)}</span>
                              </div>
                              {meeting.location && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  <span>{meeting.location}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant={
                                    meeting.status === 'upcoming' ? 'default' : 
                                    meeting.status === 'completed' ? 'secondary' : 'destructive'
                                  }
                                >
                                  {meeting.status}
                                </Badge>
                                <div className="flex items-center gap-1">
                                  {meeting.is_public ? (
                                    <Eye className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <EyeOff className="h-4 w-4 text-gray-400" />
                                  )}
                                  <span className="text-xs">
                                    {meeting.is_public ? 'Public' : 'Private'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditMeeting(meeting)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Meeting</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this meeting? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteMeeting(meeting.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </CardHeader>
                      
                      {(meeting.agenda || meeting.minutes) && (
                        <CardContent className="pt-0">
                          {meeting.agenda && (
                            <div className="mb-3">
                              <h4 className="font-medium text-sm mb-1">Agenda:</h4>
                              <p className="text-sm text-gray-600 line-clamp-2">{meeting.agenda}</p>
                            </div>
                          )}
                          {meeting.minutes && (
                            <div>
                              <h4 className="font-medium text-sm mb-1">Minutes:</h4>
                              <p className="text-sm text-gray-600 line-clamp-2">{meeting.minutes}</p>
                            </div>
                          )}
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-12">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No Meetings Yet
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Get started by creating your first sports council meeting.
                      </p>
                      <Button onClick={() => setIsCreateDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Meeting
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </LoadingContainer>
          </TabsContent>
        </Tabs>

        {/* Create Meeting Dialog */}
        <MeetingDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
        />

        {/* Edit Meeting Dialog */}
        <MeetingDialog
          meeting={editingMeeting}
          open={isEditDialogOpen}
          onOpenChange={(open) => {
            setIsEditDialogOpen(open);
            if (!open) setEditingMeeting(undefined);
          }}
        />
      </div>
    </div>
  );
}