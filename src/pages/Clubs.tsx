
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

// Define the sports categories
const sportsCategories = [
  "All Categories",
  "Football",
  "Rugby",
  "Cricket",
  "Tennis",
  "Swimming",
  "Athletics",
  "Cycling",
  "Badminton",
  "Basketball",
  "Chess",
  "Golf",
  "Netball",
  "Martial Arts",
  "Table Tennis",
  "Other",
];

interface ClubProfile {
  id: string;
  club_name: string;
  category: string;
  description: string;
  website: string | null;
  contact_email: string;
  contact_phone: string;
  meeting_times: string;
}

const Clubs = () => {
  const [clubs, setClubs] = useState<ClubProfile[]>([]);
  const [filteredClubs, setFilteredClubs] = useState<ClubProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');

  // Fetch approved club profiles
  useEffect(() => {
    const fetchApprovedClubs = async () => {
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
        }
      } catch (error) {
        console.error('Error fetching club profiles:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load club profiles.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchApprovedClubs();
  }, []);

  // Filter clubs based on search term and category
  useEffect(() => {
    let results = clubs;
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(club => 
        club.club_name.toLowerCase().includes(term) || 
        club.description.toLowerCase().includes(term)
      );
    }
    
    // Filter by category
    if (selectedCategory !== 'All Categories') {
      results = results.filter(club => club.category === selectedCategory);
    }
    
    setFilteredClubs(results);
  }, [searchTerm, selectedCategory, clubs]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Handle category selection change
  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
  };

  // Clear filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All Categories');
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
          <h1 className="text-3xl font-bold mb-2">Find Local Sports Clubs</h1>
          <p className="text-gray-600 mb-8">
            Discover sports clubs and activities in your area
          </p>

          {/* Search and filter section */}
          <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="col-span-1 md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <Select 
                  value={selectedCategory} 
                  onValueChange={handleCategoryChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sportsCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <Input 
                  type="text" 
                  placeholder="Search by name or description" 
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
            </div>
            
            {(searchTerm || selectedCategory !== 'All Categories') && (
              <div className="mt-4 flex justify-end">
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            )}
          </div>

          {/* Results section */}
          <div className="space-y-6">
            {filteredClubs.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900">No clubs found</h3>
                <p className="mt-2 text-gray-500">
                  Try adjusting your search or filters to find what you're looking for.
                </p>
              </div>
            ) : (
              filteredClubs.map((club) => (
                <div key={club.id} className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                    <div>
                      <h2 className="text-xl font-bold">{club.club_name}</h2>
                      <p className="text-sm text-gray-500 mb-2">Category: {club.category}</p>
                      <p className="mb-4">{club.description}</p>
                      
                      <div className="space-y-1 text-sm">
                        <p><strong>Meeting Times:</strong> {club.meeting_times}</p>
                        <p><strong>Contact:</strong> {club.contact_email} | {club.contact_phone}</p>
                        {club.website && (
                          <p>
                            <strong>Website:</strong>{' '}
                            <a 
                              href={club.website.startsWith('http') ? club.website : `https://${club.website}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-egsport-blue hover:underline"
                            >
                              {club.website}
                            </a>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Clubs;
