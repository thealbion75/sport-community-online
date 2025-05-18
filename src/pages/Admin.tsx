
import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';

// Mock pending registration data
const initialPendingRegistrations = [
  {
    id: 1,
    name: "Jane Smith",
    email: "jane.smith@example.com",
    clubName: "East Grinstead Athletics Club",
    registeredAt: "2023-05-17T09:23:41",
  },
  {
    id: 2,
    name: "Robert Johnson",
    email: "robert.johnson@example.com",
    clubName: "East Grinstead Swimming Club",
    registeredAt: "2023-05-16T14:15:22",
  },
  {
    id: 3,
    name: "Sarah Williams",
    email: "sarah.williams@example.com",
    clubName: "East Grinstead Chess Society",
    registeredAt: "2023-05-15T08:30:11",
  },
];

const Admin = () => {
  const [pendingRegistrations, setPendingRegistrations] = useState(initialPendingRegistrations);
  
  // Handle approving a registration
  const handleApprove = (id: number) => {
    // Here we would normally make an API call to approve the registration
    console.log("Approving registration:", id);
    
    // Remove the registration from the pending list
    setPendingRegistrations(pendingRegistrations.filter((reg) => reg.id !== id));
    
    // Show success message
    toast({
      title: "Registration approved",
      description: "The user can now log in and manage their club profile.",
    });
  };
  
  // Handle rejecting a registration
  const handleReject = (id: number) => {
    // Here we would normally make an API call to reject the registration
    console.log("Rejecting registration:", id);
    
    // Remove the registration from the pending list
    setPendingRegistrations(pendingRegistrations.filter((reg) => reg.id !== id));
    
    // Show success message
    toast({
      title: "Registration rejected",
      description: "The user has been notified.",
      variant: "destructive",
    });
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB') + ' ' + date.toLocaleTimeString('en-GB');
  };

  return (
    <Layout>
      <div className="egsport-container py-12">
        <h1 className="egsport-heading mb-8">Admin Dashboard</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Pending Registrations</h2>
            <Badge variant="outline">{pendingRegistrations.length}</Badge>
          </div>
          
          {pendingRegistrations.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Club</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingRegistrations.map((registration) => (
                  <TableRow key={registration.id}>
                    <TableCell className="font-medium">{registration.name}</TableCell>
                    <TableCell>{registration.email}</TableCell>
                    <TableCell>{registration.clubName}</TableCell>
                    <TableCell>{formatDate(registration.registeredAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button 
                          size="sm" 
                          className="bg-egsport-green hover:bg-egsport-green/90"
                          onClick={() => handleApprove(registration.id)}
                        >
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-red-500 text-red-500 hover:bg-red-50"
                          onClick={() => handleReject(registration.id)}
                        >
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No pending registrations.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Admin;
