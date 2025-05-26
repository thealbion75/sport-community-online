
import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Control } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';

interface MeetingTime {
  day: string;
  startTime: string;
  endTime: string;
}

interface MeetingTimesSelectorProps {
  control: Control<any>;
  name: string;
}

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

const TIME_OPTIONS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
  '22:00'
];

const MeetingTimesSelector: React.FC<MeetingTimesSelectorProps> = ({ control, name }) => {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const meetingTimes: MeetingTime[] = field.value || [{ day: '', startTime: '', endTime: '' }];

        const addMeetingTime = () => {
          const newMeetingTimes = [...meetingTimes, { day: '', startTime: '', endTime: '' }];
          field.onChange(newMeetingTimes);
        };

        const removeMeetingTime = (index: number) => {
          const newMeetingTimes = meetingTimes.filter((_, i) => i !== index);
          field.onChange(newMeetingTimes);
        };

        const updateMeetingTime = (index: number, key: keyof MeetingTime, value: string) => {
          const newMeetingTimes = [...meetingTimes];
          newMeetingTimes[index][key] = value;
          field.onChange(newMeetingTimes);
        };

        return (
          <FormItem>
            <FormLabel>Meeting Times</FormLabel>
            <div className="space-y-4">
              {meetingTimes.map((meetingTime, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium">Session {index + 1}</h4>
                    {meetingTimes.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeMeetingTime(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Day</label>
                      <Select
                        value={meetingTime.day}
                        onValueChange={(value) => updateMeetingTime(index, 'day', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select day" />
                        </SelectTrigger>
                        <SelectContent>
                          {DAYS_OF_WEEK.map((day) => (
                            <SelectItem key={day} value={day}>
                              {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1 block">Start Time</label>
                      <Select
                        value={meetingTime.startTime}
                        onValueChange={(value) => updateMeetingTime(index, 'startTime', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Start time" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_OPTIONS.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1 block">End Time</label>
                      <Select
                        value={meetingTime.endTime}
                        onValueChange={(value) => updateMeetingTime(index, 'endTime', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="End time" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_OPTIONS.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={addMeetingTime}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Meeting Time
              </Button>
            </div>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
};

export default MeetingTimesSelector;
