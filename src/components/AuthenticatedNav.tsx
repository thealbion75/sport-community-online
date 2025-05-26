
import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

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
