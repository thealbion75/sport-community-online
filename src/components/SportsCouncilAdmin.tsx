import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import type { SportsCouncilMeeting } from '@/types/sportsCouncil';

const SportsCouncilAdmin: React.FC = () => {
  const [meetings, setMeetings] = useState<SportsCouncilMeeting[]>([]);
  const [editing, setEditing] = useState<SportsCouncilMeeting | null>(null);
  const [form, setForm] = useState<Partial<SportsCouncilMeeting>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    const { data, error } = await supabase
      .from('sports_council_meetings')
      .select('*')
      .order('meeting_date', { ascending: false });
    if (!error && data) setMeetings(data);
  };

  const handleEdit = (meeting: SportsCouncilMeeting) => {
    setEditing(meeting);
    setForm(meeting);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this meeting?')) return;
    setIsLoading(true);
    const { error } = await supabase
      .from('sports_council_meetings')
      .delete()
      .eq('id', id);
    setIsLoading(false);
    if (!error) {
      toast({ title: 'Deleted', description: 'Meeting deleted.' });
      fetchMeetings();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    if (editing) {
      // Update
      const { error } = await supabase
        .from('sports_council_meetings')
        .update(form)
        .eq('id', editing.id);
      if (!error) toast({ title: 'Updated', description: 'Meeting updated.' });
    } else {
      // Create
      const { meeting_date, location, summary, notes } = form;
      if (!meeting_date || !location || !summary) {
        toast({ title: 'Missing fields', description: 'Date, location, and summary are required.' });
        setIsLoading(false);
        return;
      }
      const { error } = await supabase
        .from('sports_council_meetings')
        .insert([{ meeting_date, location, summary, notes: notes || null }]);
      if (!error) toast({ title: 'Created', description: 'Meeting created.' });
    }
    setIsLoading(false);
    setEditing(null);
    setForm({});
    fetchMeetings();
  };

  return (
    <div className="mb-12">
      <h2 className="text-2xl font-semibold mb-4">Sports Council Meetings Admin</h2>
      <form onSubmit={handleSave} className="space-y-4 bg-white rounded-lg shadow p-6 mb-8">
        <div>
          <label className="block font-medium mb-1">Meeting Date</label>
          <Input type="date" name="meeting_date" value={form.meeting_date || ''} onChange={handleChange} required />
        </div>
        <div>
          <label className="block font-medium mb-1">Location</label>
          <Input name="location" value={form.location || ''} onChange={handleChange} required />
        </div>
        <div>
          <label className="block font-medium mb-1">Summary</label>
          <Textarea name="summary" value={form.summary || ''} onChange={handleChange} required />
        </div>
        <div>
          <label className="block font-medium mb-1">Notes</label>
          <Textarea name="notes" value={form.notes || ''} onChange={handleChange} />
        </div>
        <div className="flex space-x-2">
          <Button type="submit" className="bg-egsport-blue" disabled={isLoading}>{editing ? 'Update' : 'Create'} Meeting</Button>
          {editing && <Button type="button" variant="outline" onClick={() => { setEditing(null); setForm({}); }}>Cancel</Button>}
        </div>
      </form>
      <div className="space-y-4">
        {meetings.map(meeting => (
          <div key={meeting.id} className="bg-gray-50 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <div className="font-semibold text-egsport-blue">{new Date(meeting.meeting_date).toLocaleDateString()}</div>
              <div className="text-gray-700">{meeting.location}</div>
              <div className="text-gray-800 mt-1"><strong>Summary:</strong> {meeting.summary}</div>
              {meeting.notes && <div className="text-gray-600 text-sm"><strong>Notes:</strong> {meeting.notes}</div>}
            </div>
            <div className="flex space-x-2 mt-2 md:mt-0">
              <Button size="sm" variant="outline" onClick={() => handleEdit(meeting)}>Edit</Button>
              <Button size="sm" variant="destructive" onClick={() => handleDelete(meeting.id)} disabled={isLoading}>Delete</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SportsCouncilAdmin;
