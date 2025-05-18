
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

// Define the login form schema with validation
const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

// Define the password reset form schema
const resetSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type ResetFormValues = z.infer<typeof resetSchema>;

const Login = () => {
  // State for password reset dialog
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  // Initialize login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Initialize reset password form
  const resetForm = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      email: "",
    },
  });

  // Handle login form submission
  const onLogin = async (data: LoginFormValues) => {
    try {
      // Here we would normally make an API call to authenticate the user
      console.log("Login data:", data);
      
      // Simulate successful login
      toast({
        title: "Login successful",
        description: "You are now logged in to your account.",
      });
      
      // We would typically redirect to the profile page here
      
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: "Invalid email or password. Please try again.",
      });
      console.error("Login error:", error);
    }
  };

  // Handle password reset form submission
  const onReset = async (data: ResetFormValues) => {
    try {
      // Here we would normally make an API call to request password reset
      console.log("Reset password data:", data);
      
      // Close the dialog
      setResetDialogOpen(false);
      
      // Show success message
      toast({
        title: "Password reset link sent",
        description: "Check your email for instructions to reset your password.",
      });
      
      // Reset the form
      resetForm.reset();
      
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to send reset link",
        description: "There was a problem sending the reset link. Please try again.",
      });
      console.error("Reset password error:", error);
    }
  };

  return (
    <Layout>
      <div className="egsport-container py-12">
        <div className="max-w-md mx-auto">
          <div className="egsport-card">
            <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>
            <p className="text-gray-600 mb-6 text-center">
              Access your club profile to keep your information up to date.
            </p>
            
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-6">
                {/* Email field */}
                <FormField
                  control={loginForm.control}
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

                {/* Password field */}
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Password</FormLabel>
                        <Button 
                          type="button" 
                          variant="link" 
                          className="p-0 h-auto text-xs text-egsport-blue"
                          onClick={() => setResetDialogOpen(true)}
                        >
                          Forgot password?
                        </Button>
                      </div>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full bg-egsport-blue hover:bg-egsport-blue/90">
                  Login
                </Button>

                <div className="text-center text-sm text-gray-500">
                  Need an account?{" "}
                  <Link to="/register" className="text-egsport-blue hover:underline">
                    Register
                  </Link>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>

      {/* Password Reset Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Enter your email address and we'll send you a link to reset your password.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...resetForm}>
            <form onSubmit={resetForm.handleSubmit(onReset)} className="space-y-4 py-4">
              <FormField
                control={resetForm.control}
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
              
              <DialogFooter className="pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setResetDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Send Reset Link
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Login;
