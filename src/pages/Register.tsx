
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Define the registration form schema with validation (removed meeting times)
const registerSchema = z.object({
  fullName: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  clubName: z.string().min(2, { message: "Club name must be at least 2 characters" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  confirmPassword: z.string(),
  captchaValue: z.string().min(1, { message: "Please complete the captcha" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const Register = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [isRegistered, setIsRegistered] = useState(false);
  
  // Generate a simple math captcha (for demo purposes only - would use a real captcha service in production)
  const [captcha, setCaptcha] = useState(() => {
    const num1 = Math.floor(Math.random() * 10);
    const num2 = Math.floor(Math.random() * 10);
    return { num1, num2, answer: num1 + num2 };
  });

  // Initialize form with react-hook-form and zod validation
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      clubName: "",
      password: "",
      confirmPassword: "",
      captchaValue: "",
    },
  });

  // Handle form submission
  const onSubmit = async (data: RegisterFormValues) => {
    // Check if the captcha is correct
    if (Number(data.captchaValue) !== captcha.answer) {
      toast({
        variant: "destructive",
        title: "Invalid captcha",
        description: "Please enter the correct sum",
      });
      return;
    }

    try {
      // Register with Supabase (removed meeting_times from metadata)
      await signUp(data.email, data.password, {
        full_name: data.fullName,
        club_name: data.clubName,
      });
      
      // Reset the form
      form.reset();
      
      // Generate a new captcha
      const num1 = Math.floor(Math.random() * 10);
      const num2 = Math.floor(Math.random() * 10);
      setCaptcha({ num1, num2, answer: num1 + num2 });
      
      // Show success message instead of redirecting
      setIsRegistered(true);
      window.scrollTo(0, 0);
      
    } catch (error: any) {
      // Check for specific error about email already in use
      if (error?.message?.toLowerCase().includes('user already registered') || 
          error?.message?.toLowerCase().includes('email already') ||
          error?.message?.toLowerCase().includes('already registered')) {
        toast({
          variant: "destructive",
          title: "Email already in use",
          description: "This email address has already been used with a sports club.",
        });
      } else {
        // Error handling is done in the signUp function in AuthContext
        console.error("Registration error:", error);
      }
    }
  };

  // Generate a new captcha
  const refreshCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10);
    const num2 = Math.floor(Math.random() * 10);
    setCaptcha({ num1, num2, answer: num1 + num2 });
    form.setValue("captchaValue", "");
  };

  if (isRegistered) {
    return (
      <Layout>
        <div className="egsport-container py-12">
          <div className="max-w-md mx-auto">
            <div className="egsport-card">
              <Alert className="mb-6 bg-green-50 border-green-200">
                <AlertDescription className="text-green-800">
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold text-green-900">Thank you for registering!</h2>
                    <p>
                      Once we have confirmed your details, you will receive an email to complete your club sign up 
                      and be able to advertise for volunteers to fill roles in your club.
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
              
              <div className="text-center space-y-4">
                <Button 
                  onClick={() => navigate('/login')}
                  className="bg-egsport-blue hover:bg-egsport-blue/90"
                >
                  Go to Login
                </Button>
                <div className="text-sm text-gray-500">
                  or{" "}
                  <button 
                    onClick={() => setIsRegistered(false)}
                    className="text-egsport-blue hover:underline"
                  >
                    register another club
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="egsport-container py-12">
        <div className="max-w-2xl mx-auto">
          <div className="egsport-card">
            <h1 className="text-2xl font-bold mb-6 text-center">Register Your Club</h1>
            <p className="text-gray-600 mb-6 text-center">
              Create an account to add your local sports club to our directory.
            </p>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Full Name field */}
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Smith" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Email field */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Club Name field */}
                <FormField
                  control={form.control}
                  name="clubName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Club Name</FormLabel>
                      <FormControl>
                        <Input placeholder="East Grinstead Football Club" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Password field */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Confirm Password field */}
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Simple Captcha field */}
                <FormField
                  control={form.control}
                  name="captchaValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Captcha</FormLabel>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <div className="bg-muted p-2 rounded-md text-center flex-1">
                            {captcha.num1} + {captcha.num2} = ?
                          </div>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={refreshCaptcha}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </Button>
                        </div>
                        <FormControl>
                          <Input placeholder="Enter the sum" {...field} />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full bg-egsport-blue hover:bg-egsport-blue/90">
                  Register
                </Button>

                <div className="text-center text-sm text-gray-500">
                  Already have an account?{" "}
                  <Link to="/login" className="text-egsport-blue hover:underline">
                    Login
                  </Link>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Register;
