
import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Facebook, Instagram, Twitter, Globe, Mail, Phone, Clock, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ClubProfile {
  id: string;
  club_name: string;
  category: string;
  contact_email: string;
  contact_phone: string | null;
  description: string;
  website: string | null;
  facebook_url: string | null;
  twitter_url: string | null;
  instagram_url: string | null;
  meeting_times: string;
  approved: boolean;
}

interface VolunteerPosition {
  id: string;
  club_id: string;
  title: string;
  description: string;
  responsibilities: string | null;
  requirements: string | null;
  time_commitment: string | null;
  location: string | null;
  contact_info: string | null;
  is_live: boolean;
  created_at: string;
  updated_at: string;
}

const Clubs = () => {
  const [clubs, setClubs] = useState<ClubProfile[]>([]);
  const [filteredClubs, setFilteredClubs] = useState<ClubProfile[]>([]);
  const [volunteerPositions, setVolunteerPositions] = useState<VolunteerPosition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  const [viewType, setViewType] = useState<'clubs' | 'volunteer'>('clubs');

  // Fetch club profiles and volunteer positions
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch clubs
        const { data: clubsData, error: clubsError } = await supabase
          .from('club_profiles')
          .select('*')
          .eq('approved', true)
          .order('club_name', { ascending: true });
        
        if (clubsError) {
          throw clubsError;
        }
        
        if (clubsData) {
          setClubs(clubsData);
          setFilteredClubs(clubsData);
          
          // Extract unique categories for the filter
          const uniqueCategories = Array.from(new Set(clubsData.map(club => club.category)));
          setCategories(uniqueCategories);
        }

        // Fetch volunteer positions
        const { data: positionsData, error: positionsError } = await supabase
          .from('club_volunteer_positions')
          .select('*')
          .eq('is_live', true)
          .order('created_at', { ascending: false });
        
        if (positionsError) {
          throw positionsError;
        }
        
        if (positionsData) {
          setVolunteerPositions(positionsData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter clubs based on search query and category filter
  useEffect(() => {
    let result = clubs;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(club => 
        club.club_name.toLowerCase().includes(query) ||
        club.description.toLowerCase().includes(query) ||
        club.meeting_times.toLowerCase().includes(query)
      );
    }
    
    if (categoryFilter) {
      result = result.filter(club => club.category === categoryFilter);
    }
    
    setFilteredClubs(result);
  }, [searchQuery, categoryFilter, clubs]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value);
  };
  
  const resetFilters = () => {
    setSearchQuery('');
    setCategoryFilter('');
    setFilteredClubs(clubs);
  };

  // Get club positions
  const getClubPositions = (clubId: string) => {
    return volunteerPositions.filter(position => position.club_id === clubId);
  };

  // Get club by ID
  const getClubById = (clubId: string) => {
    return clubs.find(club => club.id === clubId);
  };

  // Display the club's volunteer positions
  const showClubPositions = (clubId: string) => {
    setSelectedClubId(clubId);
    setViewType('volunteer');
  };

  // Back to clubs list
  const backToClubs = () => {
    setSelectedClubId(null);
    setViewType('clubs');
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
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Sports Clubs Directory</h1>
          
          <Tabs defaultValue="clubs" className="w-full mb-8" onValueChange={(value) => setViewType(value as 'clubs' | 'volunteer')}>
            <TabsList>
              <TabsTrigger value="clubs" onClick={backToClubs}>Clubs</TabsTrigger>
              <TabsTrigger value="volunteer">Volunteer Opportunities</TabsTrigger>
            </TabsList>
          </Tabs>

          {viewType === 'clubs' && !selectedClubId && (
            <>
              {/* Search and Filter for Clubs */}
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <div className="flex-1">
                  <Input
                    type="text"
                    placeholder="Search clubs..."
                    value={searchQuery}
                    onChange={handleSearch}
                    className="w-full"
                  />
                </div>
                <div className="w-full sm:w-64">
                  <Select value={categoryFilter} onValueChange={handleCategoryChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by sport" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Sports</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {(searchQuery || categoryFilter) && (
                  <button 
                    onClick={resetFilters}
                    className="bg-gray-100 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
              
              {/* Clubs List */}
              {filteredClubs.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No clubs found matching your search criteria.</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {filteredClubs.map((club) => {
                    const clubPositions = getClubPositions(club.id);
                    const hasPositions = clubPositions.length > 0;
                    
                    return (
                      <div key={club.id} className="border rounded-lg overflow-hidden shadow-sm">
                        <div className="bg-gray-50 px-4 py-3 border-b">
                          <div className="flex justify-between items-start">
                            <div>
                              <h2 className="font-bold text-lg">{club.club_name}</h2>
                              <p className="text-sm text-blue-600">{club.category}</p>
                            </div>
                            {hasPositions && (
                              <Badge className="bg-egsport-blue hover:bg-egsport-blue/90">
                                {clubPositions.length} volunteer {clubPositions.length === 1 ? 'position' : 'positions'}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="p-4">
                          <p className="text-gray-700 mb-4">{club.description}</p>
                          
                          <div className="mb-3">
                            <h3 className="font-semibold text-sm text-gray-600 mb-1">Meeting Times</h3>
                            <p className="text-sm">{club.meeting_times}</p>
                          </div>
                          
                          <div className="text-sm space-y-1">
                            <div className="flex items-center">
                              <Mail className="h-4 w-4 mr-2 text-gray-500" />
                              <a href={`mailto:${club.contact_email}`} className="text-blue-600 hover:underline">
                                {club.contact_email}
                              </a>
                            </div>
                            
                            {club.contact_phone && (
                              <div className="flex items-center">
                                <Phone className="h-4 w-4 mr-2 text-gray-500" />
                                <a href={`tel:${club.contact_phone}`} className="text-blue-600 hover:underline">
                                  {club.contact_phone}
                                </a>
                              </div>
                            )}
                            
                            <div className="flex items-center space-x-3 mt-3">
                              {club.website && (
                                <a 
                                  href={club.website} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-gray-600 hover:text-blue-600 transition-colors"
                                >
                                  <Globe className="h-5 w-5" />
                                </a>
                              )}
                              
                              {club.facebook_url && (
                                <a 
                                  href={club.facebook_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 transition-colors"
                                >
                                  <Facebook className="h-5 w-5" />
                                </a>
                              )}
                              
                              {club.instagram_url && (
                                <a 
                                  href={club.instagram_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-pink-600 hover:text-pink-800 transition-colors"
                                >
                                  <Instagram className="h-5 w-5" />
                                </a>
                              )}
                              
                              {club.twitter_url && (
                                <a 
                                  href={club.twitter_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:text-blue-600 transition-colors"
                                >
                                  <Twitter className="h-5 w-5" />
                                </a>
                              )}
                            </div>
                          </div>

                          {hasPositions && (
                            <div className="mt-4 pt-4 border-t">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => showClubPositions(club.id)}
                                className="w-full"
                              >
                                View Volunteer Opportunities
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {viewType === 'volunteer' && selectedClubId && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" onClick={backToClubs}>
                  &larr; Back to Clubs
                </Button>
                <h2 className="text-xl font-semibold">
                  {getClubById(selectedClubId)?.club_name} - Volunteer Positions
                </h2>
              </div>

              {getClubPositions(selectedClubId).length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No volunteer positions currently available.</p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {getClubPositions(selectedClubId).map((position) => (
                    <Card key={position.id}>
                      <CardHeader>
                        <CardTitle>{position.title}</CardTitle>
                        {position.location && (
                          <CardDescription className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" /> {position.location}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p>{position.description}</p>
                        
                        <div className="grid md:grid-cols-2 gap-4">
                          {position.responsibilities && (
                            <div>
                              <h4 className="font-medium text-sm">Responsibilities:</h4>
                              <p className="text-gray-700 text-sm">{position.responsibilities}</p>
                            </div>
                          )}
                          
                          {position.requirements && (
                            <div>
                              <h4 className="font-medium text-sm">Requirements:</h4>
                              <p className="text-gray-700 text-sm">{position.requirements}</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-4">
                          {position.time_commitment && (
                            <div className="flex items-start">
                              <Clock className="h-4 w-4 mr-2 mt-0.5 text-gray-500" />
                              <div>
                                <h4 className="font-medium text-sm">Time Commitment:</h4>
                                <p className="text-gray-700 text-sm">{position.time_commitment}</p>
                              </div>
                            </div>
                          )}
                          
                          {position.contact_info && (
                            <div className="flex items-start">
                              <Mail className="h-4 w-4 mr-2 mt-0.5 text-gray-500" />
                              <div>
                                <h4 className="font-medium text-sm">Contact:</h4>
                                <p className="text-gray-700 text-sm">{position.contact_info}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-end">
                        <Button className="bg-egsport-blue hover:bg-egsport-blue/90">
                          Apply Now
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {viewType === 'volunteer' && !selectedClubId && (
            <>
              <h2 className="text-2xl font-semibold mb-4">All Volunteer Opportunities</h2>
              
              {volunteerPositions.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No volunteer positions currently available.</p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {volunteerPositions.map((position) => {
                    const club = getClubById(position.club_id);
                    
                    return (
                      <Card key={position.id}>
                        <CardHeader>
                          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2">
                            <div>
                              <CardTitle>{position.title}</CardTitle>
                              <CardDescription className="font-medium text-blue-600">
                                {club?.club_name} - {club?.category}
                              </CardDescription>
                            </div>
                            {position.location && (
                              <div className="flex items-center text-sm text-gray-500">
                                <MapPin className="h-4 w-4 mr-1" /> {position.location}
                              </div>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <p>{position.description}</p>
                          
                          <div className="grid md:grid-cols-2 gap-4">
                            {position.responsibilities && (
                              <div>
                                <h4 className="font-medium text-sm">Responsibilities:</h4>
                                <p className="text-gray-700 text-sm">{position.responsibilities}</p>
                              </div>
                            )}
                            
                            {position.requirements && (
                              <div>
                                <h4 className="font-medium text-sm">Requirements:</h4>
                                <p className="text-gray-700 text-sm">{position.requirements}</p>
                              </div>
                            )}
                          </div>
                          
                          <div className="grid md:grid-cols-2 gap-4">
                            {position.time_commitment && (
                              <div className="flex items-start">
                                <Clock className="h-4 w-4 mr-2 mt-0.5 text-gray-500" />
                                <div>
                                  <h4 className="font-medium text-sm">Time Commitment:</h4>
                                  <p className="text-gray-700 text-sm">{position.time_commitment}</p>
                                </div>
                              </div>
                            )}
                            
                            {(position.contact_info || club?.contact_email) && (
                              <div className="flex items-start">
                                <Mail className="h-4 w-4 mr-2 mt-0.5 text-gray-500" />
                                <div>
                                  <h4 className="font-medium text-sm">Contact:</h4>
                                  <p className="text-gray-700 text-sm">
                                    {position.contact_info || club?.contact_email}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                        <CardFooter className="flex flex-col sm:flex-row sm:justify-between gap-4">
                          <Button 
                            variant="outline" 
                            onClick={() => showClubPositions(position.club_id)}
                          >
                            View All {club?.club_name} Positions
                          </Button>
                          <Button className="bg-egsport-blue hover:bg-egsport-blue/90">
                            Apply Now
                          </Button>
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Clubs;
