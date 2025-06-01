import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { MapPin, Clock, Mail, Phone, ExternalLink, Navigation } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

/**
 * Interface for volunteer position with club information
 */
interface VolunteerOpportunityWithClub {
  id: string;
  title: string;
  description: string;
  responsibilities?: string;
  requirements?: string;
  time_commitment?: string;
  location?: string;
  contact_info?: string;
  created_at: string;
  club_name: string;
  club_category: string;
  club_contact_email: string;
  club_contact_phone?: string;
  club_website?: string;
  club_address?: string;
  club_city?: string;
  club_postcode?: string;
  club_google_maps_url?: string;
  club_what3words?: string;
}

/**
 * Volunteer Opportunities Page
 * Displays all available volunteer positions across all approved clubs
 * with search and filtering capabilities.
 */
const VolunteerOpportunities = () => {
  const [opportunities, setOpportunities] = useState<VolunteerOpportunityWithClub[]>([]);
  const [filteredOpportunities, setFilteredOpportunities] = useState<VolunteerOpportunityWithClub[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchParams] = useSearchParams();

  // Fetch all live volunteer positions with club information
  useEffect(() => {
    const fetchVolunteerOpportunities = async () => {
      try {
        const { data, error } = await supabase
          .from('club_volunteer_positions')
          .select(`
            id,
            title,
            description,
            responsibilities,
            requirements,
            time_commitment,
            location,
            contact_info,
            created_at,
            club_profiles!inner (
              club_name,
              category,
              contact_email,
              contact_phone,
              website,
              address,
              city,
              postcode,
              google_maps_url,
              what3words,
              approved
            )
          `)
          .eq('is_live', true)
          .eq('club_profiles.approved', true)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Transform the data to flatten club information
        const transformedData: VolunteerOpportunityWithClub[] = data?.map(opportunity => ({
          id: opportunity.id,
          title: opportunity.title,
          description: opportunity.description,
          responsibilities: opportunity.responsibilities,
          requirements: opportunity.requirements,
          time_commitment: opportunity.time_commitment,
          location: opportunity.location,
          contact_info: opportunity.contact_info,
          created_at: opportunity.created_at,
          club_name: opportunity.club_profiles.club_name,
          club_category: opportunity.club_profiles.category,
          club_contact_email: opportunity.club_profiles.contact_email,
          club_contact_phone: opportunity.club_profiles.contact_phone,
          club_website: opportunity.club_profiles.website,
          club_address: opportunity.club_profiles.address,
          club_city: opportunity.club_profiles.city,
          club_postcode: opportunity.club_profiles.postcode,
          club_google_maps_url: opportunity.club_profiles.google_maps_url,
          club_what3words: opportunity.club_profiles.what3words,
        })) || [];
        
        setOpportunities(transformedData);
        setFilteredOpportunities(transformedData);
      } catch (error) {
        console.error('Error fetching volunteer opportunities:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVolunteerOpportunities();
  }, []);

  // Set initial search term from URL parameter
  useEffect(() => {
    const clubParam = searchParams.get('club');
    if (clubParam) {
      setSearchTerm(clubParam);
    }
  }, [searchParams]);

  // Filter opportunities based on search term and category
  useEffect(() => {
    let filtered = opportunities;
    
    if (searchTerm) {
      filtered = filtered.filter(opportunity =>
        opportunity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opportunity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opportunity.club_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opportunity.club_category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (opportunity.location && opportunity.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (opportunity.club_city && opportunity.club_city.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(opportunity => opportunity.club_category === selectedCategory);
    }
    
    setFilteredOpportunities(filtered);
  }, [opportunities, searchTerm, selectedCategory]);

  // Get unique categories for filter dropdown
  const categories = Array.from(new Set(opportunities.map(opportunity => opportunity.club_category))).sort();

  /**
   * Formats the club location display string
   */
  const formatClubLocation = (opportunity: VolunteerOpportunityWithClub): string => {
    const parts = [];
    if (opportunity.club_address) parts.push(opportunity.club_address);
    if (opportunity.club_city) parts.push(opportunity.club_city);
    if (opportunity.club_postcode) parts.push(opportunity.club_postcode);
    return parts.join(', ');
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="egsport-container py-12">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-egsport-blue"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="egsport-container py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Volunteer Opportunities</h1>
            <p className="text-xl text-gray-600">
              Find meaningful ways to contribute to your local sports community
            </p>
            {searchParams.get('club') && (
              <p className="text-sm text-gray-500 mt-2">
                Showing opportunities for: <span className="font-medium">{searchParams.get('club')}</span>
              </p>
            )}
          </div>

          {/* Search and Filter Controls */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1">
              <Input
                placeholder="Search by role title, club name, sport, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="md:w-64">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by sport" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sports</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results Count */}
          <div className="mb-6">
            <p className="text-gray-600">
              {filteredOpportunities.length} volunteer opportunity{filteredOpportunities.length !== 1 ? 'ies' : 'y'} found
            </p>
          </div>

          {/* Opportunities List */}
          {filteredOpportunities.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">
                {searchTerm || selectedCategory !== 'all' 
                  ? 'No volunteer opportunities match your search criteria.' 
                  : 'No volunteer opportunities are currently available.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {filteredOpportunities.map((opportunity) => (
                <Card key={opportunity.id} className="w-full">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{opportunity.title}</CardTitle>
                        <CardDescription className="text-lg font-medium text-egsport-blue">
                          {opportunity.club_name}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary">{opportunity.club_category}</Badge>
                    </div>
                    
                    {/* Club Location */}
                    {formatClubLocation(opportunity) && (
                      <CardDescription className="flex items-center mt-2">
                        <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                        <span>{formatClubLocation(opportunity)}</span>
                      </CardDescription>
                    )}
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Position Description */}
                    <div>
                      <p className="text-gray-700">{opportunity.description}</p>
                    </div>
                    
                    {/* Position Details */}
                    <div className="grid md:grid-cols-2 gap-4">
                      {opportunity.responsibilities && (
                        <div>
                          <h4 className="font-semibold text-sm mb-2">Responsibilities</h4>
                          <p className="text-gray-700 text-sm">{opportunity.responsibilities}</p>
                        </div>
                      )}
                      
                      {opportunity.requirements && (
                        <div>
                          <h4 className="font-semibold text-sm mb-2">Requirements</h4>
                          <p className="text-gray-700 text-sm">{opportunity.requirements}</p>
                        </div>
                      )}
                      
                      {opportunity.time_commitment && (
                        <div>
                          <h4 className="font-semibold text-sm mb-2">Time Commitment</h4>
                          <p className="text-gray-700 text-sm flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {opportunity.time_commitment}
                          </p>
                        </div>
                      )}
                      
                      {opportunity.location && (
                        <div>
                          <h4 className="font-semibold text-sm mb-2">Position Location</h4>
                          <p className="text-gray-700 text-sm flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {opportunity.location}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {/* Contact Information */}
                    <div className="pt-4 border-t">
                      <h4 className="font-semibold text-sm mb-3">Contact Information</h4>
                      <div className="grid md:grid-cols-2 gap-2">
                        {/* Position-specific contact or club contact */}
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                          <a 
                            href={`mailto:${opportunity.contact_info || opportunity.club_contact_email}`} 
                            className="text-egsport-blue hover:underline text-sm truncate"
                          >
                            {opportunity.contact_info || opportunity.club_contact_email}
                          </a>
                        </div>
                        
                        {opportunity.club_contact_phone && (
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                            <span className="text-sm">{opportunity.club_contact_phone}</span>
                          </div>
                        )}
                        
                        {opportunity.club_website && (
                          <div className="flex items-center">
                            <ExternalLink className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                            <a 
                              href={opportunity.club_website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-egsport-blue hover:underline text-sm truncate"
                            >
                              Club Website
                            </a>
                          </div>
                        )}
                        
                        {opportunity.club_google_maps_url && (
                          <div className="flex items-center">
                            <Navigation className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                            <a 
                              href={opportunity.club_google_maps_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-egsport-blue hover:underline text-sm"
                            >
                              Get Directions
                            </a>
                          </div>
                        )}
                        
                        {opportunity.club_what3words && (
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                            <a 
                              href={`https://what3words.com/${opportunity.club_what3words.replace('///', '')}`}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-egsport-blue hover:underline text-sm font-mono"
                            >
                              {opportunity.club_what3words}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default VolunteerOpportunities;
