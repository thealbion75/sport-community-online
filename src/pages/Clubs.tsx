
import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Facebook, Instagram, Twitter, Globe, Mail, Phone } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

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

const Clubs = () => {
  const [clubs, setClubs] = useState<ClubProfile[]>([]);
  const [filteredClubs, setFilteredClubs] = useState<ClubProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState<string[]>([]);

  // Fetch club profiles
  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const { data, error } = await supabase
          .from('club_profiles')
          .select('*')
          .eq('approved', true)
          .order('club_name', { ascending: true });
        
        if (error) {
          throw error;
        }
        
        if (data) {
          setClubs(data);
          setFilteredClubs(data);
          
          // Extract unique categories for the filter
          const uniqueCategories = Array.from(new Set(data.map(club => club.category)));
          setCategories(uniqueCategories);
        }
      } catch (error) {
        console.error('Error fetching clubs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClubs();
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
          
          {/* Search and Filter */}
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
              {filteredClubs.map((club) => (
                <div key={club.id} className="border rounded-lg overflow-hidden shadow-sm">
                  <div className="bg-gray-50 px-4 py-3 border-b">
                    <h2 className="font-bold text-lg">{club.club_name}</h2>
                    <p className="text-sm text-blue-600">{club.category}</p>
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Clubs;
