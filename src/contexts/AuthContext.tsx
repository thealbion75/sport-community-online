import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, d1Auth } from '@/lib/d1-auth';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { SessionManager, CSRF } from '@/lib/security';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Clean up auth state in localStorage
  const cleanupAuthState = () => {
    // Use secure session manager for cleanup
    SessionManager.clearSession();
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = d1Auth.onAuthStateChange(
      (event, newSession) => {
        console.log('Auth state changed:', event);
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // Initialize session management
          SessionManager.updateActivity();
          
          // Generate new CSRF token
          const csrfToken = CSRF.generateToken();
          CSRF.storeToken(csrfToken);
          
          // Defer data fetching to prevent deadlocks
          setTimeout(() => {
            // Handle additional actions on sign in if needed
            console.log('User signed in:', newSession?.user);
          }, 0);
        }

        if (event === 'SIGNED_OUT') {
          // Clean up security tokens and session data
          cleanupAuthState();
          console.log('User signed out');
        }
      }
    );

    // THEN check for existing session
    const initAuth = async () => {
      try {
        setLoading(true);
        const currentSession = d1Auth.getSession();
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          console.log('Initial auth check: User is logged in');
        } else {
          console.log('Initial auth check: No user logged in');
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Initialize session monitoring
    SessionManager.initializeSessionMonitoring(() => {
      // Handle session expiration
      cleanupAuthState();
      setSession(null);
      setUser(null);
      toast({
        title: 'Session Expired',
        description: 'Your session has expired. Please log in again.',
        variant: 'destructive',
      });
      navigate('/login');
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const signUp = async (email: string, password: string, metadata?: Record<string, unknown>) => {
    try {
      // Clean up existing state
      cleanupAuthState();
      
      const result = await d1Auth.signUp(email, password, metadata);

      if (!result.success) {
        throw new Error(result.error || 'Registration failed');
      }

      toast({
        title: 'Registration successful',
        description: 'Your account has been created and is pending approval.',
      });
      
    } catch (error) {
      const err = error as Error;
      console.error('Error signing up:', err);
      toast({
        variant: 'destructive',
        title: 'Registration failed',
        description: err.message || 'There was a problem with your registration.',
      });
      throw err;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Clean up existing state
      cleanupAuthState();
      
      const result = await d1Auth.signInWithPassword(email, password);

      if (!result.success) {
        throw new Error(result.error || 'Sign in failed');
      }

      // Update local state
      if (result.data?.session) {
        setSession(result.data.session);
        setUser(result.data.session.user);
      }

      toast({
        title: 'Sign in successful',
        description: 'You have successfully signed in.',
      });

      // Redirect to profile page after successful sign in
      navigate('/profile');
      
    } catch (error) {
      const err = error as Error;
      console.error('Error signing in:', err);
      toast({
        variant: 'destructive',
        title: 'Sign in failed',
        description: err.message || 'Invalid email or password.',
      });
      throw err;
    }
  };

  const signOut = async () => {
    try {
      // Clean up auth state
      cleanupAuthState();
      
      const result = await d1Auth.signOut();
      
      // Update local state regardless of API response
      setSession(null);
      setUser(null);

      if (result.success) {
        toast({
          title: 'Signed out',
          description: 'You have been signed out successfully.',
        });
      }

      // Redirect to home page
      navigate('/');
      
    } catch (error) {
      const err = error as Error;
      console.error('Error signing out:', err);
      toast({
        variant: 'destructive',
        title: 'Sign out failed',
        description: err.message || 'There was a problem signing out.',
      });
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const result = await d1Auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (!result.success) {
        throw new Error(result.error || 'Password reset failed');
      }

      toast({
        title: 'Password reset email sent',
        description: 'Check your email for the password reset link.',
      });
      
    } catch (error) {
      const err = error as Error;
      console.error('Error resetting password:', err);
      toast({
        variant: 'destructive',
        title: 'Password reset failed',
        description: err.message || 'There was a problem sending the password reset email.',
      });
      throw err;
    }
  };

  const value = {
    session,
    user,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// 👇 Add this line to fix the import errors
export const useAuthContext = useAuth;
