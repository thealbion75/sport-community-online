
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
  contactPhone: z.string().min(5, { message: "Please enter a valid phone number" }),
  meetingTimes: z.string().min(2, { message: "Please enter when your club meets" }),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const Profile = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  
  // Define club data with proper types
  const [clubData, setClubData] = useState<ProfileFormValues>({
    clubName: "",
    category: "",
    description: "",
    website: "",
    contactEmail: "",
    contactPhone: "",
    meetingTimes: "",
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
          throw error;
        }
        
        if (data) {
          const profileData = {
            clubName: data.club_name,
            category: data.category,
            description: data.description,
            website: data.website || '',
            contactEmail: data.contact_email,
            contactPhone: data.contact_phone,
            meetingTimes: data.meeting_times,
          };
          
          setClubData(profileData);
          form.reset(profileData);
        }
      } catch (error) {
        console.error('Error fetching club profile:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load your club profile.',
        });
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
      const { error } = await supabase
        .from('club_profiles')
        .upsert({
          id: user.id,
          club_name: data.clubName,
          category: data.category,
          description: data.description,
          website: data.website || null,
          contact_email: data.contactEmail,
          contact_phone: data.contactPhone,
          meeting_times: data.meetingTimes,
        });
      
      if (error) {
        throw error;
      }

      // Update local state with new data
      setClubData(data);
      
      // Show success message
      toast({
        title: 'Profile updated successfully',
        description: 'Your club information has been updated.',
      });
      
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
              <h1 className="text-2xl font-bold mb-6">Club Profile</h1>
              <p className="text-gray-600 mb-6">
                Keep your club information up to date to help people find and join your activities.
              </p>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Club Name field */}
                  <FormField
                    control={form.control}
                    name="clubName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Club Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
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

                  {/* Website field */}
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://yourclub.com" {...field} />
                        </FormControl>
                        <FormDescription>
                          Optional - Leave blank if you don't have a website.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Contact Email field */}
                  <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Contact Phone field */}
                  <FormField
                    control={form.control}
                    name="contactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Phone</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
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
                          <Input placeholder="e.g., Tuesdays and Thursdays, 7-9pm" {...field} />
                        </FormControl>
                        <FormDescription>
                          When and how often does your club meet?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="bg-egsport-blue hover:bg-egsport-blue/90">
                    Save Changes
                  </Button>
                </form>
              </Form>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default Profile;
