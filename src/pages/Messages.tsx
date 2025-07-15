import React from 'react';
import Layout from '@/components/Layout';
import { MessageCenter } from '@/components/messaging/MessageCenter';
import ProtectedRoute from '@/components/ProtectedRoute';

/**
 * Messages Page
 * Internal messaging system for users
 */
const Messages = () => {
  return (
    <ProtectedRoute>
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <MessageCenter />
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default Messages;