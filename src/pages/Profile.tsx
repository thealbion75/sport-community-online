import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Facebook, Instagram, Twitter } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VolunteerPositions from '@/components/VolunteerPositions';
import MeetingTimesSelector from '@/components/MeetingTimesSelector';

// Define the sports categories
const sportsCategories = [
  "Football",
  "Rugby",
  "Cricket",
  "Tennis",
  "Swimming",
  "Athletics",
  "Cycling",
  "Badminton",
  "Basketball",
  "Chess",
  "Golf",
  "Netball",
  "Martial Arts",
  "Table Tennis",
  "Other",
];

// Define the club profile form schema with validation (removed meetingTimes)
const profileSchema = z.object({
  clubName: z.string().min(2, { message: "Club name must be at least 2 characters" }),
  category: z.string().min(1, { message: "Please select a sport category" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }).max(500, { message: "Description must not exceed 500 characters" }),
  website: z.string().url({ message: "Please enter a valid URL" }).or(z.literal("")),
  contactEmail: z.string().email({ message: "Please enter a valid email address" }),
  contactPhone: z.string().min(5, { message: "Please enter a valid phone number" }).or(z.literal("")),
  facebookUrl: z.string().url({ message: "Please enter a valid Facebook URL" }).or(z.literal("")),
  instagramUrl: z.string().url({ message: "Please enter a valid Instagram URL" }).or(z.literal("")),
  twitterUrl: z.string().url({ message: "Please enter a valid Twitter/X URL" }).or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface MeetingTime {
  day: string;
  startTime: string;
  endTime: string;
}

const Profile = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isNewProfile, setIsNewProfile] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [profileExists, setProfileExists] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [meetingTimes, setMeetingTimes] = useState<MeetingTime[]>([]);
  
  // Define club data with proper types
  const [clubData, setClubData] = useState<ProfileFormValues>({
    clubName: "",
    category: "",
    description: "",
    website: "",
    contactEmail: "",
    contactPhone: "",
    facebookUrl: "",
    instagramUrl: "",
    twitterUrl: "",
  });

  // Initialize form with react-hook-form and zod validation
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: clubData,
  });

  // Initialize meeting times form
  const meetingTimesForm = useForm({
    defaultValues: {
      meetingTimes: [{ day: '', startTime: '', endTime: '' }],
    },
  });

  // Fetch club profile data and meeting times when component mounts
  useEffect(() => {
    const fetchClubProfile = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('club_profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error) {
          if (error.code === 'PGRST116') { // No data found
            setIsNewProfile(true);
          } else {
            throw error;
          }
        }
        
        if (data) {
          setProfileExists(true);
          setIsApproved(data.approved);
          const profileData = {
            clubName: data.club_name,
            category: data.category,
            description: data.description,
            website: data.website || '',
            contactEmail: data.contact_email,
            contactPhone: data.contact_phone || '',
            facebookUrl: data.facebook_url || '',
            instagramUrl: data.instagram_url || '',
            twitterUrl: data.twitter_url || '',
          };
          
          setClubData(profileData);
          form.reset(profileData);

          // Fetch meeting times if approved
          if (data.approved) {
            const { data: meetingTimesData } = await supabase
              .from('club_meeting_times')
              .select('*')
              .eq('club_id', user.id)
              .order('day_of_week, start_time');

            if (meetingTimesData && meetingTimesData.length > 0) {
              const formattedMeetingTimes = meetingTimesData.map(mt => ({
                day: mt.day_of_week,
                startTime: mt.start_time,
                endTime: mt.end_time,
              }));
              setMeetingTimes(formattedMeetingTimes);
              meetingTimesForm.reset({ meetingTimes: formattedMeetingTimes });
            }
          }
        }
      } catch (error) {
        console.error('Error fetching club profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClubProfile();
  }, [user, form, meetingTimesForm]);

  // Handle form submission
  const onSubmit = async (data: ProfileFormValues) => {
    if (!user) return;
    
    try {
      // If profile already exists and trying to change club name, prevent it
      if (profileExists && data.clubName !== clubData.clubName) {
        toast({
          variant: 'destructive',
          title: 'Cannot change club name',
          description: 'The club name cannot be modified after initial creation.',
        });
        form.setValue('clubName', clubData.clubName);
        return;
      }

      const { error } = await supabase
        .from('club_profiles')
        .upsert({
          id: user.id,
          club_name: data.clubName,
          category: data.category,
          description: data.description,
          website: data.website || null,
          contact_email: data.contactEmail,
          contact_phone: data.contactPhone || null,
          facebook_url: data.facebookUrl || null,
          instagram_url: data.instagramUrl || null,
          twitter_url: data.twitterUrl || null,
        });
      
      if (error) {
        throw error;
      }

      setClubData(data);
      setIsNewProfile(false);
      setProfileExists(true);
      
      if (isNewProfile) {
        setShowSuccessMessage(true);
        window.scrollTo(0, 0);
        setTimeout(() => {
          setShowSuccessMessage(false);
          setActiveTab('volunteer-positions');
        }, 3000);
      } else {
        toast({
          title: 'Profile updated successfully',
          description: 'Your club information has been updated.',
        });
      }
      
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: 'There was a problem updating your profile. Please try again.',
      });
      console.error('Profile update error:', error);
    }
  };

  // Handle meeting times submission
  const onMeetingTimesSubmit = async (data: { meetingTimes: MeetingTime[] }) => {
    if (!user || !isApproved) return;

    // Check for validation errors from MeetingTimesSelector
    if (meetingTimesForm.formState.errors.meetingTimes) {
      // Iterate through the errors array or object to see if any specific error messages are set.
      // react-hook-form might structure errors for field arrays as an array of objects.
      const errorsExist = Array.isArray(meetingTimesForm.formState.errors.meetingTimes)
        ? meetingTimesForm.formState.errors.meetingTimes.some(errorSet => errorSet && Object.keys(errorSet).length > 0)
        : Object.keys(meetingTimesForm.formState.errors.meetingTimes).length > 0;

      if (errorsExist) {
        toast({
          variant: 'destructive',
          title: 'Invalid Meeting Times',
          description: 'Please correct the errors in the meeting times before saving.',
        });
        return; // Prevent submission
      }
    }

    try {
      // Delete existing meeting times
      await supabase
        .from('club_meeting_times')
        .delete()
        .eq('club_id', user.id);

      // Insert new meeting times
      const validMeetingTimes = data.meetingTimes.filter(mt => 
        mt.day && mt.startTime && mt.endTime
      );

      if (validMeetingTimes.length > 0) {
        const { error } = await supabase
          .from('club_meeting_times')
          .insert(
            validMeetingTimes.map(mt => ({
              club_id: user.id,
              day_of_week: mt.day,
              start_time: mt.startTime,
              end_time: mt.endTime,
            }))
          );

        if (error) throw error;
      }

      setMeetingTimes(validMeetingTimes);
      
      toast({
        title: 'Meeting times updated successfully',
        description: 'Your club meeting times have been updated.',
      });
      
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: 'There was a problem updating your meeting times. Please try again.',
      });
      console.error('Meeting times update error:', error);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="egsport-container py-12">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-egsport-blue"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="egsport-container py-12">
          <div className="max-w-3xl mx-auto">
            <div className="egsport-card">
              <h1 className="text-2xl font-bold mb-6">Club Dashboard</h1>
              
              {showSuccessMessage && (
                <Alert className="mb-6 bg-green-50 border-green-200">
                  <AlertDescription className="text-green-800 font-medium">
                    Thank you for providing your club details! Your information has been saved and is now being reviewed for approval.
                  </AlertDescription>
                </Alert>
              )}
              
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="mb-6">
                  <TabsTrigger value="profile">Club Profile</TabsTrigger>
                  <TabsTrigger value="meeting-times" disabled={!isApproved}>Meeting Times</TabsTrigger>
                  <TabsTrigger value="volunteer-positions" disabled={!profileExists}>Volunteer Positions</TabsTrigger>
                </TabsList>
                
                <TabsContent value="profile" className="space-y-6">
                  <p className="text-gray-600 mb-6">
                    Keep your club information up to date to help people find and join your activities.
                  </p>
                  
                  {isNewProfile && !showSuccessMessage && (
                    <Alert className="mb-6 bg-blue-50 border-blue-200">
                      <AlertDescription>
                        This is your first time setting up your club profile. 
                        Once submitted, your club listing will need admin approval before appearing in the public directory.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {!isNewProfile && !isApproved && !showSuccessMessage && (
                    <Alert className="mb-6 bg-yellow-50 border-yellow-200">
                      <AlertDescription>
                        Your club profile is currently pending admin approval. 
                        It will appear in the public directory once approved.
                        You can still make changes to your information at any time.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="clubName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Club Name</FormLabel>
                            <FormControl>
                              <Input {...field} readOnly={profileExists} className={profileExists ? "bg-gray-100" : ""} />
                            </FormControl>
                            {profileExists && (
                              <FormDescription className="text-amber-600">
                                Club name cannot be changed after initial setup.
                              </FormDescription>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sport Category</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a sport" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {sportsCategories.map((category) => (
                                  <SelectItem key={category} value={category}>
                                    {category}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Club Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Tell us about your club..." 
                                className="min-h-[120px]" 
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Briefly describe your club, activities, and who can join.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="space-y-6">
                        <h3 className="text-lg font-medium">Contact Information</h3>
                        
                        <FormField
                          control={form.control}
                          name="contactEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contact Email (Required)</FormLabel>
                              <FormControl>
                                <Input type="email" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="contactPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contact Phone (Optional)</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="website"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Website URL (Optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="https://yourclub.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="space-y-6">
                        <h3 className="text-lg font-medium">Social Media (Optional)</h3>
                        
                        <FormField
                          control={form.control}
                          name="facebookUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center">
                                <Facebook className="h-4 w-4 mr-2" /> Facebook Page URL
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="https://facebook.com/yourclub" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="instagramUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center">
                                <Instagram className="h-4 w-4 mr-2" /> Instagram Profile URL
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="https://instagram.com/yourclub" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="twitterUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center">
                                <Twitter className="h-4 w-4 mr-2" /> Twitter/X Profile URL
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="https://twitter.com/yourclub" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Button type="submit" className="bg-egsport-blue hover:bg-egsport-blue/90">
                        Save Changes
                      </Button>
                    </form>
                  </Form>
                </TabsContent>

                <TabsContent value="meeting-times">
                  {isApproved ? (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium mb-2">Meeting Times</h3>
                        <p className="text-gray-600 mb-6">
                          Set up your club's regular meeting times to help people know when to join.
                        </p>
                      </div>
                      
                      <Form {...meetingTimesForm}>
                        <form onSubmit={meetingTimesForm.handleSubmit(onMeetingTimesSubmit)} className="space-y-6">
                          <MeetingTimesSelector control={meetingTimesForm.control} name="meetingTimes" />
                          
                          <Button type="submit" className="bg-egsport-blue hover:bg-egsport-blue/90">
                            Save Meeting Times
                          </Button>
                        </form>
                      </Form>
                    </div>
                  ) : (
                    <Alert className="bg-yellow-50 border-yellow-200">
                      <AlertDescription>
                        Meeting times can only be set up after your club profile has been approved by an admin.
                      </AlertDescription>
                    </Alert>
                  )}
                </TabsContent>
                
                <TabsContent value="volunteer-positions">
                  {profileExists ? (
                    <VolunteerPositions />
                  ) : (
                    <Alert className="bg-yellow-50 border-yellow-200">
                      <AlertDescription>
                        Please complete your club profile before adding volunteer positions.
                      </AlertDescription>
                    </Alert>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default Profile;
