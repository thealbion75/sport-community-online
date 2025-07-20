import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';

import { MapPin, Clock, Mail, Phone, ExternalLink, Navigation } from 'lucide-react';

// Minimal interface for demonstration
interface VolunteerOpportunityWithClub {
  id: string;
  title: string;
}

const VolunteerOpportunities = () => {
  // Minimal state for demonstration
  const [opportunities] = useState<VolunteerOpportunityWithClub[]>([]);

  return (
    <Layout>
      <div className="egsport-container py-12">
        <div className="text-center mb-8">
          <h1 className="egsport-heading mb-4">Volunteer Opportunities</h1>
          <p className="egsport-body text-xl">
            Find meaningful ways to contribute to your local sports community
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <div className="egsport-card text-center py-12">
            <h2 className="egsport-subheading mb-4">Coming Soon</h2>
            <p className="egsport-body mb-6">
              We're working on bringing you exciting volunteer opportunities with local sports clubs. 
              Check back soon to discover ways you can make a difference in your community.
            </p>
            <p className="egsport-caption">
              In the meantime, explore our sports clubs directory to connect with organizations directly.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default VolunteerOpportunities;
