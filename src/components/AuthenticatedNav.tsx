
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useVolunteerProfile } from '@/hooks/use-volunteers';
import { useClubByEmail } from '@/hooks/use-clubs';
import { useUnreadMessageCount } from '@/hooks/use-messages';
import { useIsSportsCouncilAdmin } from '@/hooks/use-sports-council';
import { NotificationBell } from '@/components/messaging';
import { 
  User, 
  Settings, 
  Building, 
  Users, 
  MessageSquare, 
  Search,
  LogOut,
  UserPlus,
  Calendar
} from 'lucide-react';
import { UserRole } from '@/types';

const AuthenticatedNav = () => {
  const { user, signOut } = useAuth();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  
  const { data: volunteerProfile } = useVolunteerProfile(user?.id || '');
  const { data: club } = useClubByEmail(user?.email || '');
  const { data: unreadCount = 0 } = useUnreadMessageCount(user?.id || '');
  const { data: isSportsCouncilAdmin = false } = useIsSportsCouncilAdmin(user?.email || '');

  // Determine user role based on profile data
  React.useEffect(() => {
    if (user) {
      // Simple role determination based on existing data
      if (club) {
        setUserRole(UserRole.CLUB_ADMIN);
      } else if (volunteerProfile) {
        setUserRole(UserRole.VOLUNTEER);
      } else {
        // Default to volunteer for new users
        setUserRole(UserRole.VOLUNTEER);
      }
    }
  }, [user, club, volunteerProfile]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getDisplayName = () => {
    if (volunteerProfile) {
      return `${volunteerProfile.first_name} ${volunteerProfile.last_name}`;
    }
    if (club) {
      return club.name;
    }
    return user?.email?.split('@')[0] || 'User';
  };

  const getAvatarUrl = () => {
    if (volunteerProfile?.profile_image_url) {
      return volunteerProfile.profile_image_url;
    }
    if (club?.logo_url) {
      return club.logo_url;
    }
    return undefined;
  };

  const getInitials = () => {
    const name = getDisplayName();
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <div className="flex items-center gap-4">
      {/* Messages Notification */}
      <NotificationBell 
        onViewAllMessages={() => window.location.href = '/messages'}
      />

      {/* Quick Actions based on role */}
      {userRole === UserRole.VOLUNTEER && (
        <Link to="/opportunities" className="hidden md:flex">
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Find Opportunities
          </Button>
        </Link>
      )}

      {userRole === UserRole.CLUB_ADMIN && (
        <Link to="/volunteers/search" className="hidden md:flex">
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Find Volunteers
          </Button>
        </Link>
      )}

      {/* User Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10">
              <AvatarImage src={getAvatarUrl()} />
              <AvatarFallback>{getInitials()}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <div className="flex items-center justify-start gap-2 p-2">
            <div className="flex flex-col space-y-1 leading-none">
              <p className="font-medium">{getDisplayName()}</p>
              <p className="w-[200px] truncate text-sm text-muted-foreground">
                {user?.email}
              </p>
              {userRole && (
                <Badge variant="outline" className="w-fit text-xs">
                  {userRole === UserRole.VOLUNTEER && 'Volunteer'}
                  {userRole === UserRole.CLUB_ADMIN && 'Club Admin'}
                  {userRole === UserRole.PLATFORM_ADMIN && 'Admin'}
                </Badge>
              )}
            </div>
          </div>
          <DropdownMenuSeparator />
          
          {/* Role-specific menu items */}
          {userRole === UserRole.VOLUNTEER && (
            <>
              <DropdownMenuItem asChild>
                <Link to="/volunteer/dashboard" className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  <span>My Dashboard</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/volunteer/profile" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>My Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/opportunities" className="flex items-center">
                  <Search className="mr-2 h-4 w-4" />
                  <span>Find Opportunities</span>
                </Link>
              </DropdownMenuItem>
            </>
          )}

          {userRole === UserRole.CLUB_ADMIN && (
            <>
              <DropdownMenuItem asChild>
                <Link to="/club/dashboard" className="flex items-center">
                  <Building className="mr-2 h-4 w-4" />
                  <span>Club Dashboard</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/club/opportunities" className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4" />
                  <span>My Opportunities</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/volunteers/search" className="flex items-center">
                  <Users className="mr-2 h-4 w-4" />
                  <span>Find Volunteers</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/club/settings" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Club Settings</span>
                </Link>
              </DropdownMenuItem>
            </>
          )}

          {userRole === UserRole.PLATFORM_ADMIN && (
            <>
              <DropdownMenuItem asChild>
                <Link to="/admin/dashboard" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Admin Dashboard</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/admin/clubs" className="flex items-center">
                  <Building className="mr-2 h-4 w-4" />
                  <span>Manage Clubs</span>
                </Link>
              </DropdownMenuItem>
            </>
          )}

          {/* Sports Council Admin menu item */}
          {isSportsCouncilAdmin && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/sports-council/admin" className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4" />
                  <span>Sports Council Admin</span>
                </Link>
              </DropdownMenuItem>
            </>
          )}

          {/* Common menu items */}
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to="/messages" className="flex items-center">
              <MessageSquare className="mr-2 h-4 w-4" />
              <span>Messages</span>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-auto">
                  {unreadCount}
                </Badge>
              )}
            </Link>
          </DropdownMenuItem>

          {/* Registration options for users without profiles */}
          {!volunteerProfile && !club && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/volunteer/register" className="flex items-center">
                  <UserPlus className="mr-2 h-4 w-4" />
                  <span>Create Volunteer Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/club/register" className="flex items-center">
                  <Building className="mr-2 h-4 w-4" />
                  <span>Register Club</span>
                </Link>
              </DropdownMenuItem>
            </>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default AuthenticatedNav;
