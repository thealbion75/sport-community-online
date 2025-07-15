import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingContainer } from '@/components/ui/loading-state';
import { useYouthVolunteerRoles } from '@/hooks/useYouthVolunteerRoles';
import type { VolunteerOpportunity } from '@/types';
import { format } from 'date-fns';
import { AlertTriangle, Filter, User, Clock, MapPin, ExternalLink } from 'lucide-react';

export function YouthVolunteerRoles() {
  const [ageFilter, setAgeFilter] = useState<number | undefined>(undefined);
  const { data: opportunities = [], isLoading, error } = useYouthVolunteerRoles(ageFilter);

  const handleAgeFilterChange = (value: string) => {
    setAgeFilter(value === 'all' ? undefined : parseInt(value));
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600">Failed to load volunteer opportunities. Please try again later.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Youth Volunteer Opportunities</h1>
          <p className="text-lg text-gray-600">
            Find local sports volunteering roles suitable for young people aged 14-18.
          </p>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Filter by minimum age:</span>
              </div>
              <Select onValueChange={handleAgeFilterChange} defaultValue="all">
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ages</SelectItem>
                  <SelectItem value="14">14+</SelectItem>
                  <SelectItem value="16">16+</SelectItem>
                  <SelectItem value="18">18+</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <LoadingContainer isLoading={isLoading}>
          {opportunities.length > 0 ? (
            <div className="space-y-4">
              {opportunities.map((opportunity) => (
                <Card key={opportunity.id}>
                  <CardHeader>
                    <CardTitle>{opportunity.title}</CardTitle>
                    <CardDescription>{opportunity.club?.name}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">{opportunity.description}</p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                      {opportunity.minimum_age && (
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>Min age: {opportunity.minimum_age}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{opportunity.time_commitment}</span>
                      </div>
                      {opportunity.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{opportunity.location}</span>
                        </div>
                      )}
                    </div>
                    {opportunity.required_skills && opportunity.required_skills.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium text-sm mb-1">Skills required:</h4>
                        <div className="flex flex-wrap gap-2">
                          {opportunity.required_skills.map((skill) => (
                            <Badge key={skill} variant="secondary">{skill}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    <Button asChild>
                      <a href={`/opportunities/${opportunity.id}`} target="_blank" rel="noopener noreferrer">
                        View Details <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No matching opportunities found
                  </h3>
                  <p className="text-gray-600">
                    Please try adjusting your filters or check back later.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </LoadingContainer>
      </div>
    </div>
  );
}
