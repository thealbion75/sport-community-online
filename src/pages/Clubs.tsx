
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// Using D1 API instead of Supabase
import Layout from '@/components/Layout';
import { ClubProfile } from '@/types/club';
import { ExternalLink, Mail, Phone, MapPin, Navigation, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Clubs Directory Page
 * Displays a searchable and filterable list of approved sports clubs
 * with their contact information, location details, and volunteer opportunities.
 */
const Clubs = () => {
  const [clubs, setClubs] = useState<ClubProfile[]>([]);
  const [filteredClubs, setFilteredClubs] = useState<ClubProfile[]>([]);
  const [clubVolunteerCounts, setClubVolunteerCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Fetch approved clubs and volunteer position counts from the database
  useEffect(() => {
    const fetchClubsAndVolunteerCounts = async () => {
      try {
        // Fetch approved clubs
        const { data: clubsData, error: clubsError } = await supabase
          .from('club_profiles')
          .select('*')
          .eq('approved', true)
          .order('club_name');
        
        if (clubsError) throw clubsError;
        
        // Fetch volunteer position counts for each club
        const { data: volunteerData, error: volunteerError } = await supabase
          .from('club_volunteer_positions')
          .select('club_id')
          .eq('is_live', true);
          
        if (volunteerError) throw volunteerError;
        
        // Count volunteer positions per club
        const counts: Record<string, number> = {};
        volunteerData?.forEach(position => {
          counts[position.club_id] = (counts[position.club_id] || 0) + 1;
        });
        
        setClubs(clubsData || []);
        setFilteredClubs(clubsData || []);
        setClubVolunteerCounts(counts);
      } catch (error) {
        console.error('Error fetching clubs and volunteer data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClubsAndVolunteerCounts();
  }, []);

  // Filter clubs based on search term and category
  useEffect(() => {
    let filtered = clubs;
    
    if (searchTerm) {
      filtered = filtered.filter(club =>
        club.club_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        club.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        club.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (club.city && club.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (club.address && club.address.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(club => club.category === selectedCategory);
    }
    
    setFilteredClubs(filtered);
  }, [clubs, searchTerm, selectedCategory]);

  // Get unique categories for filter dropdown
  const categories = Array.from(new Set(clubs.map(club => club.category))).sort();

  /**
   * Formats the location display string from available location fields
   */
  const formatLocation = (club: ClubProfile): string => {
    const parts = [];
    if (club.address) parts.push(club.address);
    if (club.city) parts.push(club.city);
    if (club.postcode) parts.push(club.postcode);
    return parts.join(', ');
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="egsport-container py-12">
          <div className="max-w-6xl mx-auto">
            {/* Loading skeleton for header */}
            <div className="text-center mb-8 egsport-fade-in">
              <div className="h-10 bg-muted rounded-lg w-80 mx-auto mb-4 egsport-loading"></div>
              <div className="h-6 bg-muted rounded-lg w-96 mx-auto mb-4 egsport-loading"></div>
              <div className="h-10 bg-muted rounded-lg w-64 mx-auto egsport-loading"></div>
            </div>

            {/* Loading skeleton for search controls */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <div className="flex-1 h-10 bg-muted rounded-md egsport-loading"></div>
              <div className="md:w-64 h-10 bg-muted rounded-md egsport-loading"></div>
            </div>

            {/* Loading skeleton for clubs grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="egsport-card egsport-loading">
                  <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
                  <div className="h-4 bg-muted rounded w-full mb-2"></div>
                  <div className="h-4 bg-muted rounded w-5/6 mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-4/5"></div>
                    <div className="h-4 bg-muted rounded w-3/5"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
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
            <h1 className="egsport-heading mb-4">Sports Clubs Directory</h1>
            <p className="egsport-body text-xl mb-4">
              Discover local sports clubs and join the community
            </p>
            <Link to="/volunteer-opportunities">
              <Button className="egsport-btn-secondary">
                <Users className="mr-2 h-4 w-4" />
                View All Volunteer Opportunities
              </Button>
            </Link>
          </div>

          {/* Search and Filter Controls */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1">
              <Input
                placeholder="Search clubs by name, description, sport, or location..."
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
            <p className="egsport-caption">
              {filteredClubs.length} club{filteredClubs.length !== 1 ? 's' : ''} found
            </p>
          </div>

          {/* Clubs Grid */}
          {filteredClubs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">
                {searchTerm || selectedCategory !== 'all' 
                  ? 'No clubs match your search criteria.' 
                  : 'No clubs are currently listed.'}
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClubs.map((club) => (
                <Card key={club.id} className="h-full flex flex-col">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{club.club_name}</CardTitle>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant="secondary">{club.category}</Badge>
                        {clubVolunteerCounts[club.id] && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <Users className="h-3 w-3 mr-1" />
                            {clubVolunteerCounts[club.id]} volunteer role{clubVolunteerCounts[club.id] !== 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {/* Location Display */}
                    {formatLocation(club) && (
                      <CardDescription className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                        <span className="truncate">{formatLocation(club)}</span>
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <p className="text-gray-700 mb-4 flex-1">{club.description}</p>
                    
                    {/* Contact Information */}
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                        <a 
                          href={`mailto:${club.contact_email}`} 
                          className="text-egsport-blue hover:underline text-sm truncate"
                        >
                          {club.contact_email}
                        </a>
                      </div>
                      {club.contact_phone && (
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                          <span className="text-sm">{club.contact_phone}</span>
                        </div>
                      )}
                      {club.website && (
                        <div className="flex items-center">
                          <ExternalLink className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                          <a 
                            href={club.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-egsport-blue hover:underline text-sm truncate"
                          >
                            Visit Website
                          </a>
                        </div>
                      )}
                      
                      {/* Location Links */}
                      {club.google_maps_url && (
                        <div className="flex items-center">
                          <Navigation className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                          <a 
                            href={club.google_maps_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-egsport-blue hover:underline text-sm"
                          >
                            Get Directions
                          </a>
                        </div>
                      )}
                      
                      {club.what3words && (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                          <a 
                            href={`https://what3words.com/${club.what3words.replace('///', '')}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-egsport-blue hover:underline text-sm font-mono"
                          >
                            {club.what3words}
                          </a>
                        </div>
                      )}
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

export default Clubs;
