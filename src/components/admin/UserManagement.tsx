/**
 * User Management Component
 * Manages user accounts and profiles for administrators
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  Search, 
  Building, 
  UserX, 
  Shield, 
  Mail, 
  Calendar,
  MapPin,
  Eye,
  Ban,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { useSearchVolunteers } from '@/hooks/use-volunteers';
import { useVerifiedClubs } from '@/hooks/use-clubs';
import type { VolunteerProfile, Club } from '@/types';

interface UserAccount {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
  role: 'volunteer' | 'club_admin' | 'platform_admin';
  status: 'active' | 'suspended' | 'banned';
  profile?: VolunteerProfile;
  club?: Club;
}

export const UserManagement: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // Fetch data (in a real app, this would be from a dedicated user management API)
  const { data: volunteersData } = useSearchVolunteers({}, 1, 100);
  const { data: clubs = [] } = useVerifiedClubs();

  const volunteers = volunteersData?.data || [];

  // Mock user accounts (in a real app, this would come from auth service)
  const mockUsers: UserAccount[] = [
    ...volunteers.map(volunteer => ({
      id: volunteer.user_id,
      email: volunteer.email,
      created_at: volunteer.created_at,
      role: 'volunteer' as const,
      status: 'active' as const,
      profile: volunteer
    })),
    ...clubs.map(club => ({
      id: club.id,
      email: club.contact_email,
      created_at: club.created_at,
      role: 'club_admin' as const,
      status: 'active' as const,
      club: club
    }))
  ];

  const filteredUsers = mockUsers.filter(user => 
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.profile && `${user.profile.first_name} ${user.profile.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (user.club && user.club.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getUsersByTab = (tab: string) => {
    switch (tab) {
      case 'volunteers':
        return filteredUsers.filter(user => user.role === 'volunteer');
      case 'clubs':
        return filteredUsers.filter(user => user.role === 'club_admin');
      case 'suspended':
        return filteredUsers.filter(user => user.status === 'suspended');
      default:
        return filteredUsers;
    }
  };

  const handleViewUser = (user: UserAccount) => {
    setSelectedUser(user);
    setShowDetailsDialog(true);
  };

  const handleSuspendUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to suspend this user? They will not be able to access the platform.')) {
      // In a real app, this would call an API to suspend the user
      console.log('Suspending user:', userId);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'volunteer':
        return <Users className="h-4 w-4 text-blue-600" />;
      case 'club_admin':
        return <Building className="h-4 w-4 text-green-600" />;
      case 'platform_admin':
        return <Shield className="h-4 w-4 text-purple-600" />;
      default:
        return <Users className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'volunteer':
        return <Badge variant="outline">Volunteer</Badge>;
      case 'club_admin':
        return <Badge variant="outline">Club Admin</Badge>;
      case 'platform_admin':
        return <Badge variant="default">Platform Admin</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'suspended':
        return <Badge className="bg-orange-100 text-orange-800">Suspended</Badge>;
      case 'banned':
        return <Badge className="bg-red-100 text-red-800">Banned</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const UserCard: React.FC<{ user: UserAccount }> = ({ user }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.profile?.profile_image_url || user.club?.logo_url} />
            <AvatarFallback>
              {user.profile 
                ? `${user.profile.first_name[0]}${user.profile.last_name[0]}`
                : user.club
                ? user.club.name.split(' ').map(word => word[0]).join('').slice(0, 2)
                : user.email[0].toUpperCase()
              }
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-semibold">
                  {user.profile 
                    ? `${user.profile.first_name} ${user.profile.last_name}`
                    : user.club?.name || 'Unknown User'
                  }
                </h4>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Mail className="h-3 w-3" />
                  {user.email}
                </div>
                {(user.profile?.location || user.club?.location) && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-3 w-3" />
                    {user.profile?.location || user.club?.location}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                {getRoleBadge(user.role)}
                {getStatusBadge(user.status)}
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-gray-600 mb-3">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Joined {format(new Date(user.created_at), 'MMM d, yyyy')}
              </span>
              {user.last_sign_in_at && (
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Last active {format(new Date(user.last_sign_in_at), 'MMM d, yyyy')}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleViewUser(user)}
              >
                <Eye className="h-3 w-3 mr-1" />
                View Details
              </Button>
              
              {user.status === 'active' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSuspendUser(user.id)}
                  className="text-orange-600 hover:text-orange-700"
                >
                  <Ban className="h-3 w-3 mr-1" />
                  Suspend
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-gray-600">
            Manage user accounts and profiles
          </p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search users by name, email, or club..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-xl font-bold">{mockUsers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Volunteers</p>
                <p className="text-xl font-bold">
                  {mockUsers.filter(u => u.role === 'volunteer').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Club Admins</p>
                <p className="text-xl font-bold">
                  {mockUsers.filter(u => u.role === 'club_admin').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Suspended</p>
                <p className="text-xl font-bold">
                  {mockUsers.filter(u => u.status === 'suspended').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">
            All Users ({filteredUsers.length})
          </TabsTrigger>
          <TabsTrigger value="volunteers">
            Volunteers ({filteredUsers.filter(u => u.role === 'volunteer').length})
          </TabsTrigger>
          <TabsTrigger value="clubs">
            Clubs ({filteredUsers.filter(u => u.role === 'club_admin').length})
          </TabsTrigger>
          <TabsTrigger value="suspended">
            Suspended ({filteredUsers.filter(u => u.status === 'suspended').length})
          </TabsTrigger>
        </TabsList>

        {['all', 'volunteers', 'clubs', 'suspended'].map(tab => (
          <TabsContent key={tab} value={tab} className="space-y-4">
            {getUsersByTab(tab).length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No users found
                  </h3>
                  <p className="text-gray-600">
                    {searchQuery 
                      ? 'Try adjusting your search terms'
                      : `No ${tab === 'all' ? '' : tab} users to display`
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {getUsersByTab(tab).map((user) => (
                  <UserCard key={user.id} user={user} />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* User Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              View and manage user account information
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-6">
              {/* User Header */}
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedUser.profile?.profile_image_url || selectedUser.club?.logo_url} />
                  <AvatarFallback className="text-lg">
                    {selectedUser.profile 
                      ? `${selectedUser.profile.first_name[0]}${selectedUser.profile.last_name[0]}`
                      : selectedUser.club
                      ? selectedUser.club.name.split(' ').map(word => word[0]).join('').slice(0, 2)
                      : selectedUser.email[0].toUpperCase()
                    }
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">
                    {selectedUser.profile 
                      ? `${selectedUser.profile.first_name} ${selectedUser.profile.last_name}`
                      : selectedUser.club?.name || 'Unknown User'
                    }
                  </h3>
                  <div className="flex items-center gap-2 mb-2">
                    {getRoleBadge(selectedUser.role)}
                    {getStatusBadge(selectedUser.status)}
                  </div>
                  <div className="text-sm text-gray-600">
                    <div className="flex items-center gap-1 mb-1">
                      <Mail className="h-3 w-3" />
                      {selectedUser.email}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Joined {format(new Date(selectedUser.created_at), 'MMMM d, yyyy')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile/Club Details */}
              {selectedUser.profile && (
                <div>
                  <h4 className="font-medium mb-3">Volunteer Profile</h4>
                  <div className="space-y-3 text-sm">
                    {selectedUser.profile.location && (
                      <div>
                        <span className="font-medium">Location:</span> {selectedUser.profile.location}
                      </div>
                    )}
                    {selectedUser.profile.bio && (
                      <div>
                        <span className="font-medium">Bio:</span>
                        <p className="text-gray-700 bg-gray-50 p-2 rounded mt-1">
                          {selectedUser.profile.bio}
                        </p>
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Skills:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedUser.profile.skills.map((skill) => (
                          <Badge key={skill} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedUser.club && (
                <div>
                  <h4 className="font-medium mb-3">Club Information</h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium">Location:</span> {selectedUser.club.location}
                    </div>
                    {selectedUser.club.description && (
                      <div>
                        <span className="font-medium">Description:</span>
                        <p className="text-gray-700 bg-gray-50 p-2 rounded mt-1">
                          {selectedUser.club.description}
                        </p>
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Sports:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedUser.club.sport_types.map((sport) => (
                          <Badge key={sport} variant="outline" className="text-xs">
                            {sport}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowDetailsDialog(false)}
                >
                  Close
                </Button>
                {selectedUser.status === 'active' && (
                  <Button
                    variant="outline"
                    onClick={() => handleSuspendUser(selectedUser.id)}
                    className="text-orange-600 hover:text-orange-700"
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    Suspend User
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};