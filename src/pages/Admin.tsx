import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { AdminPanel } from '@/components/admin';
import { useIsAdmin } from '@/hooks/use-admin';
import { LoadingContainer } from '@/components/ui/loading-state';
import { Shield, AlertTriangle } from 'lucide-react';

/**
 * Admin Page
 * Platform administration dashboard for authorized administrators
 */
const Admin = () => {
  const { data: isAdmin, isLoading } = useIsAdmin();

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
                  You don't have permission to access the platform administration panel.
                  Only authorized platform administrators can access this area.
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
        <div className="container mx-auto px-4 py-8">
          <AdminPanel />
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default Admin;