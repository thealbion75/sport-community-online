
import React, { useState } from 'react';
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
  // Mock data for a logged-in user's club - in a real app, this would come from the database
  const [clubData, setClubData] = useState({
    clubName: "East Grinstead Football Club",
    category: "Football",
    description: "Local football club with teams for all ages and abilities. We welcome players of all skill levels and have both competitive and recreational teams.",
    website: "https://egfc.example.com",
    contactEmail: "info@egfc.example.com",
    contactPhone: "01234 567890",
    meetingTimes: "Tuesdays and Thursdays, 7-9pm",
  });

  // Initialize form with react-hook-form and zod validation
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: clubData,
  });

  // Handle form submission
  const onSubmit = async (data: ProfileFormValues) => {
    try {
      // Here we would normally make an API call to update the club profile
      console.log("Profile update data:", data);
      
      // Update local state with new data
      setClubData(data);
      
      // Show success message
      toast({
        title: "Profile updated successfully",
        description: "Your club information has been updated.",
      });
      
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "There was a problem updating your profile. Please try again.",
      });
      console.error("Profile update error:", error);
    }
  };

  return (
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
  );
};

export default Profile;
