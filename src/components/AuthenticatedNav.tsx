
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { User, Settings } from 'lucide-react';

const AuthenticatedNav = () => {
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="flex items-center gap-4">
      {/* Link to Club Dashboard */}
      <Link to="/profile" className="flex items-center text-gray-700 hover:text-blue-600 transition-colors">
        <Settings className="h-4 w-4 mr-1" />
        Club Dashboard
      </Link>
      
      <Button 
        variant="outline" 
        onClick={handleSignOut}
        className="text-sm"
      >
        Logout
      </Button>
    </div>
  );
};

export default AuthenticatedNav;
