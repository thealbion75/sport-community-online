/**
 * ClubApplicationList Demo Component
 * Example usage of the ClubApplicationList component
 */

import React, { useState } from 'react';
import { ClubApplicationList } from './ClubApplicationList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const ClubApplicationListDemo: React.FC = () => {
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);

  const handleApplicationSelect = (clubId: string) => {
    setSelectedApplicationId(clubId);
    console.log('Selected application:', clubId);
    // In a real app, this would navigate to the application detail page
    // or open a modal with application details
  };

  const handleClearSelection = () => {
    setSelectedApplicationId(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Club Application Management Demo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            This demo shows the ClubApplicationList component with all its features:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground mb-4">
            <li>Status-based filtering (pending, approved, rejected, all)</li>
            <li>Search functionality for club name and email</li>
            <li>Sortable columns (name, status, submission date)</li>
            <li>Responsive table layout</li>
            <li>Pagination for large datasets</li>
            <li>Loading and error states</li>
            <li>Empty state handling</li>
          </ul>
          
          {selectedApplicationId && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm">
                <strong>Selected Application ID:</strong> {selectedApplicationId}
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleClearSelection}
                className="mt-2"
              >
                Clear Selection
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <ClubApplicationList 
        onApplicationSelect={handleApplicationSelect}
        className="w-full"
      />
    </div>
  );
};

export default ClubApplicationListDemo;