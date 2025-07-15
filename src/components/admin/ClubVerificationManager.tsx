/**
 * Club Verification Manager Component
 * Manages club verification process for administrators
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Building, 
  Mail, 
  Phone, 
  Globe,
  MapPin,
  Calendar,
  AlertTriangle,
  Eye,
  Star
} from 'lucide-react';
import { format } from 'date-fns';
import { useVerifiedClubs, useUnverifiedClubs, useVerifyClub } from '@/hooks/use-clubs';
import type { Club } from '@/types';

export const ClubVerificationManager: React.FC = () => {
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const { data: verifiedClubs = [], isLoading: verifiedLoading } = useVerifiedClubs();
  const { data: unverifiedClubs = [], isLoading: unverifiedLoading } = useUnverifiedClubs();
  const verifyClubMutation = useVerifyClub();

  const handleVerifyClub = async (clubId: string) => {
    if (window.confirm('Are you sure you want to verify this club? This action will make them visible to all users.')) {
      await verifyClubMutation.mutateAsync(clubId);
      setShowDetailsDialog(false);
      setSelectedClub(null);
    }
  };

  const handleViewDetails = (club: Club) => {
    setSelectedClub(club);
    setShowDetailsDialog(true);
  };

  const ClubCard: React.FC<{ club: Club; showActions?: boolean }> = ({ 
    club, 
    showActions = false 
  }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={club.logo_url} />
            <AvatarFallback>
              {club.name.split(' ').map(word => word[0]).join('').slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-semibold text-lg">{club.name}</h4>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <MapPin className="h-3 w-3" />
                  {club.location}
                </div>
              </div>
              <Badge variant={club.verified ? 'default' : 'secondary'}>
                {club.verified ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </>
                ) : (
                  <>
                    <Clock className="h-3 w-3 mr-1" />
                    Pending
                  </>
                )}
              </Badge>
            </div>

            {club.description && (
              <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                {club.description}
              </p>
            )}

            <div className="flex items-center gap-4 text-xs text-gray-600 mb-3">
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {club.contact_email}
              </span>
              {club.contact_phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {club.contact_phone}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(club.created_at), 'MMM d, yyyy')}
              </span>
            </div>

            <div className="flex flex-wrap gap-1 mb-4">
              {club.sport_types.map((sport) => (
                <Badge key={sport} variant="outline" className="text-xs">
                  {sport}
                </Badge>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleViewDetails(club)}
              >
                <Eye className="h-3 w-3 mr-1" />
                View Details
              </Button>
              
              {showActions && !club.verified && (
                <Button
                  size="sm"
                  onClick={() => handleVerifyClub(club.id)}
                  disabled={verifyClubMutation.isPending}
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {verifyClubMutation.isPending ? 'Verifying...' : 'Verify Club'}
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
          <h2 className="text-2xl font-bold">Club Verification</h2>
          <p className="text-gray-600">
            Review and verify club registrations
          </p>
        </div>
      </div>

      {/* Pending Verifications Alert */}
      {unverifiedClubs.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>{unverifiedClubs.length}</strong> club{unverifiedClubs.length !== 1 ? 's' : ''} 
            {' '}pending verification. Review and verify legitimate clubs to make them visible to volunteers.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">
            Pending Verification ({unverifiedClubs.length})
          </TabsTrigger>
          <TabsTrigger value="verified">
            Verified Clubs ({verifiedClubs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {unverifiedLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : unverifiedClubs.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  All caught up!
                </h3>
                <p className="text-gray-600">
                  No clubs are currently pending verification.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {unverifiedClubs.map((club) => (
                <ClubCard key={club.id} club={club} showActions={true} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="verified" className="space-y-4">
          {verifiedLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : verifiedClubs.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No verified clubs yet
                </h3>
                <p className="text-gray-600">
                  Verified clubs will appear here once you approve them.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {verifiedClubs.map((club) => (
                <ClubCard key={club.id} club={club} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Club Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Club Details</DialogTitle>
            <DialogDescription>
              Review club information for verification
            </DialogDescription>
          </DialogHeader>
          
          {selectedClub && (
            <div className="space-y-6">
              {/* Club Header */}
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedClub.logo_url} />
                  <AvatarFallback className="text-lg">
                    {selectedClub.name.split(' ').map(word => word[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">{selectedClub.name}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={selectedClub.verified ? 'default' : 'secondary'}>
                      {selectedClub.verified ? (
                        <>
                          <Star className="h-3 w-3 mr-1" />
                          Verified
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3 mr-1" />
                          Pending Verification
                        </>
                      )}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    <div className="flex items-center gap-1 mb-1">
                      <MapPin className="h-3 w-3" />
                      {selectedClub.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Registered {format(new Date(selectedClub.created_at), 'MMMM d, yyyy')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedClub.description && (
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded">
                    {selectedClub.description}
                  </p>
                </div>
              )}

              {/* Contact Information */}
              <div>
                <h4 className="font-medium mb-3">Contact Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span>{selectedClub.contact_email}</span>
                  </div>
                  {selectedClub.contact_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span>{selectedClub.contact_phone}</span>
                    </div>
                  )}
                  {selectedClub.website_url && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-gray-500" />
                      <a 
                        href={selectedClub.website_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {selectedClub.website_url}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Sport Types */}
              <div>
                <h4 className="font-medium mb-2">Sports</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedClub.sport_types.map((sport) => (
                    <Badge key={sport} variant="outline">
                      {sport}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Actions */}
              {!selectedClub.verified && (
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setShowDetailsDialog(false)}
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => handleVerifyClub(selectedClub.id)}
                    disabled={verifyClubMutation.isPending}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {verifyClubMutation.isPending ? 'Verifying...' : 'Verify Club'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};