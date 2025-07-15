/**
 * Club Dashboard Component
 * Overview of club's volunteer opportunities and applications
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingContainer, OpportunityCardSkeleton } from '@/components/ui/loading-state';
import { useClubByEmail } from '@/hooks/use-clubs';
import { useOpportunitiesByClub } from '@/hooks/use-opportunities';
import { useApplicationsByClub, useClubApplicationStats } from '@/hooks/use-applications';
import { useCurrentUser } from '@/hooks/use-auth';
import { OpportunityForm } from './OpportunityForm';
import { OpportunityCard } from './OpportunityCard';
import { ApplicationManager } from './ApplicationManager';
import { 
  Users, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Plus,
  BarChart3,
  Settings
} from 'lucide-react';

export function ClubDashboard() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState<string | null>(null);

  // Get current user and club data
  const { data: user } = useCurrentUser();
  const { data: club, isLoading: clubLoading } = useClubByEmail(user?.email || '');
  
  // Get club opportunities and applications
  const { data: opportunities, isLoading: opportunitiesLoading } = useOpportunitiesByClub(club?.id || '');
  const { data: applications, isLoading: applicationsLoading } = useApplicationsByClub(club?.id || '');
  const { data: stats } = useClubApplicationStats(club?.id || '');

  if (clubLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 rounded animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Club Found
              </h3>
              <p className="text-gray-600 mb-4">
                We couldn't find a club associated with your account. 
                Please register your club first.
              </p>
              <Button onClick={() => window.location.href = '/register-club'}>
                Register Club
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeOpportunities = opportunities?.filter(opp => opp.status === 'active') || [];
  const filledOpportunities = opportunities?.filter(opp => opp.status === 'filled') || [];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{club.name}</h1>
          <p className="text-gray-600 mt-1">
            {club.location} • {club.verified ? 'Verified' : 'Pending Verification'}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Opportunity
          </Button>
        </div>
      </div>

      {/* Verification Notice */}
      {!club.verified && (
        <Card className="mb-6 border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <h4 className="font-medium text-yellow-900">Verification Pending</h4>
                <p className="text-sm text-yellow-800">
                  Your club is currently being reviewed. You can create opportunities, 
                  but they won't be visible to volunteers until verification is complete.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Opportunities</p>
                <p className="text-2xl font-bold">{opportunities?.length || 0}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{activeOpportunities.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Applications</p>
                <p className="text-2xl font-bold text-purple-600">{stats?.total || 0}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-orange-600">{stats?.pending || 0}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="opportunities" className="space-y-6">
        <TabsList>
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Opportunities Tab */}
        <TabsContent value="opportunities" className="space-y-6">
          {showCreateForm && (
            <Card>
              <CardHeader>
                <CardTitle>Create New Opportunity</CardTitle>
                <CardDescription>
                  Post a new volunteer opportunity for your club
                </CardDescription>
              </CardHeader>
              <CardContent>
                <OpportunityForm
                  clubId={club.id}
                  onSuccess={() => setShowCreateForm(false)}
                  onCancel={() => setShowCreateForm(false)}
                />
              </CardContent>
            </Card>
          )}

          <LoadingContainer isLoading={opportunitiesLoading}>
            {opportunities && opportunities.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Your Opportunities</h3>
                <div className="grid gap-4">
                  {opportunities.map((opportunity) => (
                    <OpportunityCard
                      key={opportunity.id}
                      opportunity={opportunity}
                      isOwner={true}
                      onEdit={() => setEditingOpportunity(opportunity.id)}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No Opportunities Yet
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Create your first volunteer opportunity to start connecting with volunteers.
                    </p>
                    <Button onClick={() => setShowCreateForm(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Opportunity
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </LoadingContainer>
        </TabsContent>

        {/* Applications Tab */}
        <TabsContent value="applications">
          <LoadingContainer isLoading={applicationsLoading}>
            <ApplicationManager 
              applications={applications || []}
              clubId={club.id}
            />
          </LoadingContainer>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Application Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Applications</span>
                    <Badge variant="secondary">{stats?.total || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Pending Review</span>
                    <Badge variant="outline">{stats?.pending || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Accepted</span>
                    <Badge className="bg-green-100 text-green-800">{stats?.accepted || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Rejected</span>
                    <Badge variant="destructive">{stats?.rejected || 0}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Opportunity Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Active Opportunities</span>
                    <Badge className="bg-blue-100 text-blue-800">{activeOpportunities.length}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Filled Positions</span>
                    <Badge className="bg-green-100 text-green-800">{filledOpportunities.length}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Average Applications per Opportunity</span>
                    <Badge variant="secondary">
                      {opportunities?.length ? Math.round((stats?.total || 0) / opportunities.length) : 0}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Opportunity Modal */}
      {editingOpportunity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Edit Opportunity</CardTitle>
            </CardHeader>
            <CardContent>
              <OpportunityForm
                clubId={club.id}
                opportunityId={editingOpportunity}
                onSuccess={() => setEditingOpportunity(null)}
                onCancel={() => setEditingOpportunity(null)}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}