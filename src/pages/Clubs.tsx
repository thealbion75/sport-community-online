
import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';

// Define sports categories for filtering
const sportsCategories = [
  "All Sports",
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

// Mock data for clubs - in a real app, this would come from the database
const mockClubs = [
  {
    id: 1,
    name: "East Grinstead Football Club",
    category: "Football",
    description: "Local football club with teams for all ages and abilities.",
    website: "https://egfc.example.com",
    contactEmail: "info@egfc.example.com",
    contactPhone: "01234 567890",
    meetingTimes: "Tuesdays and Thursdays, 7-9pm",
  },
  {
    id: 2,
    name: "East Grinstead Rugby Club",
    category: "Rugby",
    description: "Competitive rugby club with youth and adult teams.",
    website: "https://egrugby.example.com",
    contactEmail: "info@egrugby.example.com",
    contactPhone: "01234 567891",
    meetingTimes: "Wednesdays 6-8pm, Saturdays 10am-1pm",
  },
  {
    id: 3,
    name: "East Grinstead Tennis Club",
    category: "Tennis",
    description: "Local tennis club with courts available for members.",
    website: "https://egtennis.example.com",
    contactEmail: "info@egtennis.example.com",
    contactPhone: "01234 567892",
    meetingTimes: "Monday to Friday, 9am-9pm",
  },
  {
    id: 4,
    name: "East Grinstead Chess Society",
    category: "Chess",
    description: "Weekly chess meetings for players of all levels.",
    website: "https://egchess.example.com",
    contactEmail: "info@egchess.example.com",
    contactPhone: "01234 567893",
    meetingTimes: "Fridays, 7-10pm",
  },
];

const Clubs = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Sports");
  
  // Filter clubs based on search term and selected category
  const filteredClubs = mockClubs.filter(club => {
    const matchesSearch = club.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         club.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === "All Sports" || club.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <Layout>
      <div className="egsport-container py-12">
        <h1 className="egsport-heading text-center mb-2">Local Sports Clubs Directory</h1>
        <p className="text-gray-600 text-center mb-8">
          Discover and connect with sports clubs in your area.
        </p>
        
        {/* Search and filter section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="col-span-1 md:col-span-2">
              <Input
                placeholder="Search clubs by name or description"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a sport" />
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
          </div>
        </div>
        
        {/* Results section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClubs.length > 0 ? (
            filteredClubs.map((club) => (
              <Card key={club.id} className="h-full flex flex-col">
                <CardHeader>
                  <CardTitle>{club.name}</CardTitle>
                  <CardDescription>{club.category}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="mb-4">{club.description}</p>
                  <div className="space-y-2 text-sm">
                    <p><strong>Website:</strong> <a href={club.website} className="text-egsport-blue hover:underline" target="_blank" rel="noopener noreferrer">{club.website}</a></p>
                    <p><strong>Email:</strong> <a href={`mailto:${club.contactEmail}`} className="text-egsport-blue hover:underline">{club.contactEmail}</a></p>
                    <p><strong>Phone:</strong> {club.contactPhone}</p>
                    <p><strong>Meeting Times:</strong> {club.meetingTimes}</p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" asChild>
                    <a href={club.website} target="_blank" rel="noopener noreferrer">
                      Visit Website
                    </a>
                  </Button>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-12">
              <p className="text-xl text-gray-500">No clubs found matching your criteria.</p>
              <p className="text-gray-500 mt-2">Try adjusting your search or filter.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Clubs;
