/**
 * Opportunity Card Component
 * Display individual opportunity details with actions
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useUpdateOpportunityStatus, useDeleteOpportunity } from '@/hooks/use-opportunities';
import { useApplicationsByOpportunity } from '@/hooks/use-applications';
import { VolunteerOpportunity } from '@/types';
import { 
  MapPin, 
  Clock, 
  Calendar, 
  Users, 
  MoreVertical, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle,
  Eye,
  MessageSquare
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface OpportunityCardProps {
  opportunity: VolunteerOpportunity;
  isOwner?: boolean;
  onEdit?: () => void;
  onApply?: () => void;
  onView?: () => void;
}

export function OpportunityCard({ 
  opportunity, 
  isOwner = false, 
  onEdit, 
  onApply, 
  onView 
}: OpportunityCardProps) {
  const updateStatusMutation = useUpdateOpportunityStatus();
  const deleteMutation = useDeleteOpportunity();
  const { data: applications } = useApplicationsByOpportunity(opportunity.id);

  const handleStatusChange = async (status: 'active' | 'filled' | 'cancelled') => {
    try {
      await updateStatusMutation.mutateAsync({ id: opportunity.id, status });
    } catch (error) {
      // Error handled by mutation hook
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this opportunity? This action cannot be undone.')) {
      try {
        await deleteMutation.mutateAsync(opportunity.id);
      } catch (error) {
        // Error handled by mutation hook
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'filled':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const applicationCount = applications?.length || 0;
  const pendingApplications = applications?.filter(app => app.status === 'pending').length || 0;

  return (
    <Card className="w-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-lg">{opportunity.title}</CardTitle>
              <Badge className={getStatusColor(opportunity.status)}>
                {opportunity.status}
              </Badge>
              {opportunity.is_recurring && (
                <Badge variant="outline">Recurring</Badge>
              )}
            </div>
            
            {opportunity.club && !isOwner && (
              <CardDescription className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {opportunity.club.name}
              </CardDescription>
            )}
          </div>

          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onView}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                {opportunity.status === 'active' && (
                  <DropdownMenuItem onClick={() => handleStatusChange('filled')}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Filled
                  </DropdownMenuItem>
                )}
                {opportunity.status !== 'cancelled' && (
                  <DropdownMenuItem onClick={() => handleStatusChange('cancelled')}>
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel
                  </DropdownMenuItem>
                )}
                {opportunity.status !== 'active' && (
                  <DropdownMenuItem onClick={() => handleStatusChange('active')}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Reactivate
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                  onClick={handleDelete}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Description */}
        <p className="text-sm text-gray-600 line-clamp-3">
          {opportunity.description}
        </p>

        {/* Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="h-4 w-4" />
            <span>{opportunity.time_commitment}</span>
          </div>

          {opportunity.location && (
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="h-4 w-4" />
              <span>{opportunity.location}</span>
            </div>
          )}

          {opportunity.start_date && (
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>
                Starts {new Date(opportunity.start_date).toLocaleDateString()}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 text-gray-600">
            <Users className="h-4 w-4" />
            <span>
              Posted {formatDistanceToNow(new Date(opportunity.created_at))} ago
            </span>
          </div>
        </div>

        {/* Skills */}
        {opportunity.required_skills.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Required Skills:</p>
            <div className="flex flex-wrap gap-1">
              {opportunity.required_skills.slice(0, 4).map((skill) => (
                <Badge key={skill} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {opportunity.required_skills.length > 4 && (
                <Badge variant="secondary" className="text-xs">
                  +{opportunity.required_skills.length - 4} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Applications (for club owners) */}
        {isOwner && (
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-600">
                {applicationCount} application{applicationCount !== 1 ? 's' : ''}
              </span>
              {pendingApplications > 0 && (
                <Badge variant="outline" className="text-orange-600">
                  {pendingApplications} pending
                </Badge>
              )}
            </div>
            
            {applicationCount > 0 && (
              <Button variant="outline" size="sm">
                <MessageSquare className="h-4 w-4 mr-2" />
                View Applications
              </Button>
            )}
          </div>
        )}

        {/* Actions (for volunteers) */}
        {!isOwner && opportunity.status === 'active' && (
          <div className="flex gap-2 pt-2 border-t">
            <Button onClick={onApply} className="flex-1">
              Apply Now
            </Button>
            <Button variant="outline" onClick={onView}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>
          </div>
        )}

        {/* Status message for non-active opportunities */}
        {!isOwner && opportunity.status !== 'active' && (
          <div className="pt-2 border-t">
            <p className="text-sm text-gray-500 text-center">
              {opportunity.status === 'filled' 
                ? 'This opportunity has been filled' 
                : 'This opportunity is no longer available'
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}