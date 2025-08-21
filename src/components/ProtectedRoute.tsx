
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
// Using D1 API instead of Supabase
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [profileExists, setProfileExists] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      // Redirect to login if user is not authenticated
      navigate('/login');
    }
  }, [user, loading, navigate]);

  // Check if user profile exists
  useEffect(() => {
    const checkProfile = async () => {
      if (!user) {
        setCheckingProfile(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('club_profiles')
          .select('id')
          .eq('id', user.id)
          .single();
        
        if (!error && data) {
          setProfileExists(true);
        }
      } catch (error) {
        // We don't want to show an error for first time users
        console.log('User profile does not exist yet');
      } finally {
        setCheckingProfile(false);
      }
    };

    if (user) {
      checkProfile();
    }
  }, [user]);

  // Show loading indicator while checking auth status
  if (loading || (user && checkingProfile)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-egsport-blue" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  // Render children if user is authenticated
  return user ? <>{children}</> : null;
};

export default ProtectedRoute;
