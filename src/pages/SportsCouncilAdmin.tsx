import React from 'react';
import Layout from '@/components/Layout';
import { SportsCouncilAdmin as SportsCouncilAdminComponent } from '@/components/sports-council';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useIsSportsCouncilAdmin } from '@/hooks/use-sports-council';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingContainer } from '@/components/ui/loading-state';
import { Shield, AlertTriangle } from 'lucide-react';

/**
 * Sports Council Admin Page
 * Protected page for sports council administrators
 */
const SportsCouncilAdmin = () => {
  const { user } = useAuth();
  const { data: isAdmin, isLoading } = useIsSportsCouncilAdmin(user?.email || '');

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <LoadingContainer isLoading={true} loadingText="Checking permissions..." />
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Access Denied
                </h3>
                <p className="text-gray-600">
                  You don't have permission to access the sports council administration panel.
                  Only authorized sports council administrators can manage meetings and content.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <ProtectedRoute>
      <Layout>
        <SportsCouncilAdminComponent />
      </Layout>
    </ProtectedRoute>
  );
};

export default SportsCouncilAdmin;