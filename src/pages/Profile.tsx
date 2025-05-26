
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

// Define the club profile form schema with validation
const profileSchema = z.object({
  clubName: z.string().min(2, { message: "Club name must be at least 2 characters" }),
  category: z.string().min(1, { message: "Please select a sport category" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }).max(500, { message: "Description must not exceed 500 characters" }),
  website: z.string().url({ message: "Please enter a valid URL" }).or(z.literal("")),
  contactEmail: z.string().email({ message: "Please enter a valid email address" }),
  contactPhone: z.string().min(5, { message: "Please enter a valid phone number" }).or(z.literal("")),
  meetingTimes: z.string().min(2, { message: "Please enter when your club meets" }),
  facebookUrl: z.string().url({ message: "Please enter a valid Facebook URL" }).or(z.literal("")),
  instagramUrl: z.string().url({ message: "Please enter a valid Instagram URL" }).or(z.literal("")),
  twitterUrl: z.string().url({ message: "Please enter a valid Twitter/X URL" }).or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const Profile = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isNewProfile, setIsNewProfile] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [profileExists, setProfileExists] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  // Define club data with proper types
  const [clubData, setClubData] = useState<ProfileFormValues>({
    clubName: "",
    category: "",
    description: "",
    website: "",
    contactEmail: "",
    contactPhone: "",
    meetingTimes: "",
    facebookUrl: "",
    instagramUrl: "",
    twitterUrl: "",
  });

  // Initialize form with react-hook-form and zod validation
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: clubData,
  });

  // Fetch club profile data when component mounts
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
            meetingTimes: data.meeting_times,
            facebookUrl: data.facebook_url || '',
            instagramUrl: data.instagram_url || '',
            twitterUrl: data.twitter_url || '',
          };
          
          setClubData(profileData);
          form.reset(profileData);
        }
      } catch (error) {
        console.error('Error fetching club profile:', error);
        // We don't show an error toast here as this is expected for new users
      } finally {
        setIsLoading(false);
      }
    };

    fetchClubProfile();
  }, [user, form]);

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
        // Reset club name to original value
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
          meeting_times: data.meetingTimes,
          facebook_url: data.facebookUrl || null,
          instagram_url: data.instagramUrl || null,
          twitter_url: data.twitterUrl || null,
        });
      
      if (error) {
        throw error;
      }

      // Update local state with new data
      setClubData(data);
      setIsNewProfile(false);
      setProfileExists(true);
      
      // Show success message and scroll to top
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
                      {/* Club Name field - readonly if profile exists */}
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

                      {/* Category field */}
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

                      {/* Description field */}
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

                      {/* Meeting Times field */}
                      <FormField
                        control={form.control}
                        name="meetingTimes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Meeting Times</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="e.g., Mondays 7-9pm at Community Center, Thursdays 6-8pm at Local Park"
                                className="min-h-[80px]"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Please provide details about when and where your club meets. 
                              Include days, times, and locations.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Contact Information */}
                      <div className="space-y-6">
                        <h3 className="text-lg font-medium">Contact Information</h3>
                        
                        {/* Contact Email field */}
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

                        {/* Contact Phone field - optional */}
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

                        {/* Website field - optional */}
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
                      
                      {/* Social Media Links */}
                      <div className="space-y-6">
                        <h3 className="text-lg font-medium">Social Media (Optional)</h3>
                        
                        {/* Facebook URL field */}
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
                        
                        {/* Instagram URL field */}
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
                        
                        {/* Twitter/X URL field */}
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
