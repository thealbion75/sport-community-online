
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Calendar, Clock, MapPin, Plus, Edit, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface MeetingFormData {
  date: string;
  time: string;
  venue: string;
  address: string;
  speaker: string;
  speaker_role: string;
  topic: string;
  status: 'upcoming' | 'planned' | 'completed';
  outcomes: string[];
}

const SportsCouncilAdmin = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<any>(null);
  const [outcomeInput, setOutcomeInput] = useState('');
  
  const queryClient = useQueryClient();
  
  const form = useForm<MeetingFormData>({
    defaultValues: {
      date: '',
      time: '',
      venue: '',
      address: '',
      speaker: '',
      speaker_role: '',
      topic: '',
      status: 'planned',
      outcomes: []
    }
  });

  const { data: meetings, isLoading } = useQuery({
    queryKey: ['admin-sports-council-meetings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sports_council_meetings')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const createMeetingMutation = useMutation({
    mutationFn: async (data: MeetingFormData) => {
      const { error } = await supabase
        .from('sports_council_meetings')
        .insert([{
          ...data,
          outcomes: data.outcomes.length > 0 ? data.outcomes : null
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sports-council-meetings'] });
      queryClient.invalidateQueries({ queryKey: ['sports-council-meetings'] });
      setIsDialogOpen(false);
      form.reset();
      toast.success('Meeting created successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to create meeting: ' + error.message);
    }
  });

  const updateMeetingMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<MeetingFormData> }) => {
      const { error } = await supabase
        .from('sports_council_meetings')
        .update({
          ...data,
          outcomes: data.outcomes && data.outcomes.length > 0 ? data.outcomes : null
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sports-council-meetings'] });
      queryClient.invalidateQueries({ queryKey: ['sports-council-meetings'] });
      setIsDialogOpen(false);
      setEditingMeeting(null);
      form.reset();
      toast.success('Meeting updated successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to update meeting: ' + error.message);
    }
  });

  const deleteMeetingMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('sports_council_meetings')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sports-council-meetings'] });
      queryClient.invalidateQueries({ queryKey: ['sports-council-meetings'] });
      toast.success('Meeting deleted successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to delete meeting: ' + error.message);
    }
  });

  const onSubmit = (data: MeetingFormData) => {
    if (editingMeeting) {
      updateMeetingMutation.mutate({ id: editingMeeting.id, data });
    } else {
      createMeetingMutation.mutate(data);
    }
  };

  const handleEdit = (meeting: any) => {
    setEditingMeeting(meeting);
    form.reset({
      date: meeting.date,
      time: meeting.time || '',
      venue: meeting.venue || '',
      address: meeting.address || '',
      speaker: meeting.speaker || '',
      speaker_role: meeting.speaker_role || '',
      topic: meeting.topic,
      status: meeting.status,
      outcomes: meeting.outcomes || []
    });
    setIsDialogOpen(true);
  };

  const handleAddOutcome = () => {
    if (outcomeInput.trim()) {
      const currentOutcomes = form.getValues('outcomes');
      form.setValue('outcomes', [...currentOutcomes, outcomeInput.trim()]);
      setOutcomeInput('');
    }
  };

  const handleRemoveOutcome = (index: number) => {
    const currentOutcomes = form.getValues('outcomes');
    form.setValue('outcomes', currentOutcomes.filter((_, i) => i !== index));
  };

  const formatMeetingDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMMM d, yyyy');
    } catch {
      return dateString;
    }
  };

  const formatMeetingTime = (timeString: string | null) => {
    if (!timeString) return '';
    try {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch {
      return timeString;
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Sports Council Meetings</h2>
          <p className="text-gray-600">Manage Sports Council meetings and their outcomes</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingMeeting(null);
              form.reset();
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Meeting
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingMeeting ? 'Edit Meeting' : 'Add New Meeting'}</DialogTitle>
              <DialogDescription>
                {editingMeeting ? 'Update the meeting details' : 'Create a new Sports Council meeting'}
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time</FormLabel>
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
                  name="topic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Topic</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Meeting topic" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="speaker"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Speaker</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Speaker name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="speaker_role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Speaker Role</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Speaker role/title" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="venue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Venue</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Meeting venue" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Venue address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="planned">Planned</SelectItem>
                          <SelectItem value="upcoming">Upcoming</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <FormLabel>Outcomes (for completed meetings)</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      value={outcomeInput}
                      onChange={(e) => setOutcomeInput(e.target.value)}
                      placeholder="Add an outcome"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddOutcome();
                        }
                      }}
                    />
                    <Button type="button" onClick={handleAddOutcome} variant="outline">
                      Add
                    </Button>
                  </div>
                  
                  <div className="space-y-1">
                    {form.watch('outcomes').map((outcome, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <span className="flex-1">{outcome}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveOutcome(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingMeeting ? 'Update Meeting' : 'Create Meeting'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Meetings Overview</CardTitle>
          <CardDescription>
            All Sports Council meetings ({meetings?.length || 0} total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Topic</TableHead>
                <TableHead>Speaker</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {meetings?.map((meeting) => (
                <TableRow key={meeting.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="font-medium">{formatMeetingDate(meeting.date)}</div>
                        {meeting.time && (
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatMeetingTime(meeting.time)}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{meeting.topic}</div>
                      {meeting.venue && (
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {meeting.venue}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {meeting.speaker && (
                      <div>
                        <div className="font-medium">{meeting.speaker}</div>
                        {meeting.speaker_role && (
                          <div className="text-sm text-gray-500">{meeting.speaker_role}</div>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      meeting.status === 'upcoming' ? 'default' :
                      meeting.status === 'completed' ? 'secondary' : 'outline'
                    }>
                      {meeting.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(meeting)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this meeting?')) {
                            deleteMeetingMutation.mutate(meeting.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default SportsCouncilAdmin;
