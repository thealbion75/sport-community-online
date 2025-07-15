/**
 * Sports Council Meetings Component
 * Public component for displaying meeting minutes and upcoming meetings
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { LoadingContainer } from '@/components/ui/loading-state';
import { usePublicMeetings } from '@/hooks/use-sports-council';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  FileText, 
  Users,
  ChevronDown,
  ChevronUp,
  Filter
} from 'lucide-react';
import { format, parseISO, isAfter, isBefore } from 'date-fns';
import type { MeetingFilters, SportsCouncilMeeting } from '@/types';

export function SportsCouncilMeetings() {
  const [filters, setFilters] = useState<MeetingFilters>({ status: 'all' });
  const [selectedTab, setSelectedTab] = useState('upcoming');
  const [expandedMeeting, setExpandedMeeting] = useState<string | null>(null);

  const { data: meetings = [], isLoading, error } = usePublicMeetings(filters);

  // Separate meetings by status
  const upcomingMeetings = meetings.filter(meeting => 
    meeting.status === 'upcoming' || 
    (meeting.status === 'completed' && isAfter(parseISO(meeting.meeting_date), new Date()))
  );
  
  const pastMeetings = meetings.filter(meeting => 
    meeting.status === 'completed' && 
    isBefore(parseISO(meeting.meeting_date), new Date())
  );

  const handleYearChange = (year: string) => {
    setFilters(prev => ({
      ...prev,
      year: year === 'all' ? undefined : parseInt(year)
    }));
  };

  const toggleMeetingExpansion = (meetingId: string) => {
    setExpandedMeeting(expandedMeeting === meetingId ? null : meetingId);
  };

  const formatMeetingDate = (dateString: string, timeString?: string) => {
    const date = parseISO(dateString);
    const dateFormatted = format(date, 'EEEE, MMMM d, yyyy');
    
    if (timeString) {
      const [hours, minutes] = timeString.split(':');
      const time = new Date();
      time.setHours(parseInt(hours), parseInt(minutes));
      const timeFormatted = format(time, 'h:mm a');
      return `${dateFormatted} at ${timeFormatted}`;
    }
    
    return dateFormatted;
  };

  const MeetingCard = ({ meeting }: { meeting: SportsCouncilMeeting }) => {
    const isExpanded = expandedMeeting === meeting.id;
    const hasMinutes = meeting.minutes && meeting.minutes.trim().length > 0;
    const hasAgenda = meeting.agenda && meeting.agenda.trim().length > 0;

    return (
      <Card key={meeting.id} className="mb-4">
        <CardHeader className="pb-3">
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
                <Badge 
                  variant={meeting.status === 'upcoming' ? 'default' : 'secondary'}
                  className={meeting.status === 'upcoming' ? 'bg-blue-100 text-blue-800' : ''}
                >
                  {meeting.status === 'upcoming' ? 'Upcoming' : 'Completed'}
                </Badge>
              </div>
            </div>
            {(hasAgenda || hasMinutes) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleMeetingExpansion(meeting.id)}
                className="ml-4"
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </CardHeader>

        {isExpanded && (hasAgenda || hasMinutes) && (
          <CardContent className="pt-0">
            <Separator className="mb-4" />
            
            {hasAgenda && (
              <div className="mb-4">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Agenda
                </h4>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm whitespace-pre-wrap">{meeting.agenda}</p>
                </div>
              </div>
            )}

            {hasMinutes && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Meeting Minutes
                </h4>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm whitespace-pre-wrap">{meeting.minutes}</p>
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    );
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-red-600">Failed to load meetings. Please try again later.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Sports Council Meetings
          </h1>
          <p className="text-gray-600">
            Stay informed about sports council activities, upcoming meetings, and past meeting minutes.
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Filter by year:</span>
              </div>
              <Select onValueChange={handleYearChange} defaultValue="all">
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Meetings Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="upcoming" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Upcoming Meetings
              {upcomingMeetings.length > 0 && (
                <Badge variant="secondary">{upcomingMeetings.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="past" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Past Meetings & Minutes
              {pastMeetings.length > 0 && (
                <Badge variant="secondary">{pastMeetings.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Upcoming Meetings Tab */}
          <TabsContent value="upcoming">
            <LoadingContainer isLoading={isLoading}>
              {upcomingMeetings.length > 0 ? (
                <div className="space-y-4">
                  {upcomingMeetings.map((meeting) => (
                    <MeetingCard key={meeting.id} meeting={meeting} />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-12">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No Upcoming Meetings
                      </h3>
                      <p className="text-gray-600">
                        There are currently no upcoming sports council meetings scheduled.
                        Check back later for updates.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </LoadingContainer>
          </TabsContent>

          {/* Past Meetings Tab */}
          <TabsContent value="past">
            <LoadingContainer isLoading={isLoading}>
              {pastMeetings.length > 0 ? (
                <div className="space-y-4">
                  {pastMeetings.map((meeting) => (
                    <MeetingCard key={meeting.id} meeting={meeting} />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No Past Meetings
                      </h3>
                      <p className="text-gray-600">
                        No past meeting minutes are available at this time.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </LoadingContainer>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}