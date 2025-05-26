
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
          newMeetingTimes[index][key] = value; // Apply change immediately to the cloned array

          const currentSession = newMeetingTimes[index]; // Session with the new value applied
          const { startTime, endTime } = currentSession;

          if (key === 'startTime' || key === 'endTime') {
            if (startTime && endTime) { // Both times are selected, so validate
              const startIndex = TIME_OPTIONS.indexOf(startTime);
              const endIndex = TIME_OPTIONS.indexOf(endTime);

              if (startIndex !== -1 && endIndex !== -1 && startIndex >= endIndex) {
                // Invalid: Start time is not strictly before end time
                control.setError(`${name}.${index}.endTime`, { // Set error on endTime field
                  type: 'manual',
                  message: 'End time must be after start time.',
                });
              } else {
                // Valid or became valid
                control.clearErrors(`${name}.${index}.startTime`); // Clear for both, just in case
                control.clearErrors(`${name}.${index}.endTime`);
              }
            } else {
              // One or both times are not set, so not an "invalid range" yet. Clear any existing errors.
              control.clearErrors(`${name}.${index}.startTime`);
              control.clearErrors(`${name}.${index}.endTime`);
            }
          }
          
          field.onChange(newMeetingTimes); // Update the form state with the (potentially invalid) new values
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

                    <FormField
                      control={control}
                      name={`${name}.${index}.startTime`}
                      render={({ field: startTimeField }) => (
                        <FormItem>
                          <label className="text-sm font-medium mb-1 block">Start Time</label>
                          <Select
                            value={startTimeField.value}
                            onValueChange={(value) => {
                              startTimeField.onChange(value);
                              updateMeetingTime(index, 'startTime', value);
                            }}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Start time" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {TIME_OPTIONS.map((time) => (
                                <SelectItem key={time} value={time}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name={`${name}.${index}.endTime`}
                      render={({ field: endTimeField }) => (
                        <FormItem>
                          <label className="text-sm font-medium mb-1 block">End Time</label>
                          <Select
                            value={endTimeField.value}
                            onValueChange={(value) => {
                              endTimeField.onChange(value);
                              updateMeetingTime(index, 'endTime', value);
                            }}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="End time" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {TIME_OPTIONS.map((time) => (
                                <SelectItem key={time} value={time}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  {/* General error for the session can be shown here if preferred */}
                  {/* <FormMessage name={`${name}.${index}.endTime`} /> */} 
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
            {/* This FormMessage is for the whole field array, not individual items.
                Errors for specific time fields are now inside the map. */}
            {/* <FormMessage /> */} 
          </FormItem>
        );
      }}
    />
  );
};

export default MeetingTimesSelector;
