import React from 'react';
import Layout from '@/components/Layout';
import { VolunteerDashboard as VolunteerDashboardComponent } from '@/components/dashboard/VolunteerDashboard';
import ProtectedRoute from '@/components/ProtectedRoute';

/**
 * Volunteer Dashboard Page
 * Main dashboard page for volunteer users
 */
const VolunteerDashboard = () => {
  return (
    <ProtectedRoute>
      <Layout>
        <VolunteerDashboardComponent />
      </Layout>
    </ProtectedRoute>
  );
};

export default VolunteerDashboard;