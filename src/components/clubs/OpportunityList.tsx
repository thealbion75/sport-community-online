/**
 * Opportunity List Component
 * Displays a list of volunteer opportunities with management actions
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, Eye, Users, Calendar, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { useUpdateOpportunityStatus, useDeleteOpportunity } from '@/hooks/use-opportunities';
import type { VolunteerOpportunity } from '@/types';

interface OpportunityListProps {
  opportunities: VolunteerOpportunity[];
  isLoading?: boolean;
  showClubInfo?: boolean;
  onEdit?: (opportunity: VolunteerOpportunity) => void;
  onView?: (opportunity: VolunteerOpportunity) => void;
}

export const OpportunityList: React.FC<OpportunityListProps> = ({
  opportunities,
  isLoading,
  showClubInfo = true,
  onEdit,
  onView
}) => {
  const updateStatusMutation = useUpdateOpportunityStatus();
  const deleteOpportunityMutation = useDeleteOpportunity();

  const handleStatusChange = async (id: string, status: 'active' | 'filled' | 'cancelled') => {
    await updateStatusMutation.mutateAsync({ id, status });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this opportunity? This action cannot be undone.')) {
      await deleteOpportunityMutation.mutateAsync(id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'filled': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (opportunities.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No opportunities yet</h3>
          <p className="text-gray-600">
            Create your first volunteer opportunity to start attracting helpers.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {opportunities.map((opportunity) => (
        <Card key={opportunity.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg">{opportunity.title}</CardTitle>
                <CardDescription className="mt-1">
                  {showClubInfo && opportunity.club && (
                    <span className="font-medium">{opportunity.club.name} • </span>
                  )}
                  <span className="flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3" />
                    {opportunity.location || opportunity.club?.location}
                  </span>
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(opportunity.status)}>
                  {opportunity.status}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onView?.(opportunity)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit?.(opportunity)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    {opportunity.status === 'active' && (
                      <DropdownMenuItem 
                        onClick={() => handleStatusChange(opportunity.id, 'filled')}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Mark as Filled
                      </DropdownMenuItem>
                    )}
                    {opportunity.status === 'filled' && (
                      <DropdownMenuItem 
                        onClick={() => handleStatusChange(opportunity.id, 'active')}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Reactivate
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem 
                      onClick={() => handleStatusChange(opportunity.id, 'cancelled')}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Cancel
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDelete(opportunity.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4 line-clamp-2">
              {opportunity.description}
            </p>
            
            <div className="space-y-3">
              {/* Skills */}
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Required Skills:</p>
                <div className="flex flex-wrap gap-1">
                  {opportunity.required_skills.map((skill) => (
                    <Badge key={skill} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Time Commitment */}
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {opportunity.time_commitment}
                </span>
                {opportunity.is_recurring && (
                  <Badge variant="outline" className="text-xs">
                    Recurring
                  </Badge>
                )}
              </div>

              {/* Dates */}
              {(opportunity.start_date || opportunity.end_date) && (
                <div className="text-sm text-gray-600">
                  {opportunity.start_date && (
                    <span>From: {format(new Date(opportunity.start_date), 'PPP')}</span>
                  )}
                  {opportunity.end_date && (
                    <span className="ml-4">To: {format(new Date(opportunity.end_date), 'PPP')}</span>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={() => onView?.(opportunity)}>
                View Applications
              </Button>
              <Button size="sm" onClick={() => onEdit?.(opportunity)}>
                Edit
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};