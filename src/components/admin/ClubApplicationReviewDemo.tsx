/**
 * ClubApplicationReview Demo Component
 * Demonstrates the usage of the ClubApplicationReview component
 */

import React, { useState } from 'react';
import { ClubApplicationReview } from './ClubApplicationReview';
import { ClubApplicationList } from './ClubApplicationList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const ClubApplicationReviewDemo: React.FC = () => {
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);

  const handleApplicationSelect = (clubId: string) => {
    setSelectedClubId(clubId);
  };

  const handleBack = () => {
    setSelectedClubId(null);
  };

  if (selectedClubId) {
    return (
      <ClubApplicationReview
        clubId={selectedClubId}
        onBack={handleBack}
        className="max-w-7xl mx-auto p-6"
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Club Application Review Demo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            This demo shows the ClubApplicationReview component. Click on an application 
            in the list below to view the detailed review interface.
          </p>
          <ClubApplicationList onApplicationSelect={handleApplicationSelect} />
        </CardContent>
      </Card>
    </div>
  );
};

export default ClubApplicationReviewDemo;