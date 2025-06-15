import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { supabase } from '@/integrations/supabase/client';
import type { SportsCouncilMeeting } from '@/types/sportsCouncil';

const Index = () => {
  const [councilMeetings, setCouncilMeetings] = useState<SportsCouncilMeeting[]>([]);

  useEffect(() => {
    const fetchCouncilMeetings = async () => {
      const { data, error } = await supabase
        .from('sports_council_meetings')
        .select('*')
        .order('meeting_date', { ascending: false });
      if (!error && data) setCouncilMeetings(data);
    };
    fetchCouncilMeetings();
  }, []);

  return (
    <Layout>
      {/* Hero section */}
      <section className="bg-gradient-to-b from-sky-100 to-white py-16 md:py-24">
        <div className="egsport-container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="egsport-heading mb-4">
              Discover Local Sports Clubs in Your Community
            </h1>
            <p className="text-lg md:text-xl text-gray-700 mb-8">
              Connect with sports clubs in your area, find new activities, 
              and build a healthier, more active community together.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/clubs">
                <Button size="lg" className="bg-egsport-blue hover:bg-egsport-blue/90">
                  Find Clubs
                </Button>
              </Link>
              <Link to="/register">
                <Button size="lg" variant="outline" className="border-egsport-blue text-egsport-blue hover:bg-egsport-blue/10">
                  Register Your Club
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured section */}
      <section className="py-16 bg-white">
        <div className="egsport-container">
          <h2 className="egsport-subheading text-center mb-12">Why Join EGSport?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="egsport-card text-center">
              <div className="w-16 h-16 bg-egsport-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-egsport-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Connect</h3>
              <p className="text-gray-600">Network with other local sports clubs to share ideas and resources.</p>
            </div>
            
            <div className="egsport-card text-center">
              <div className="w-16 h-16 bg-egsport-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-egsport-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Discover</h3>
              <p className="text-gray-600">Help local residents discover your club and the activities you offer.</p>
            </div>
            
            <div className="egsport-card text-center">
              <div className="w-16 h-16 bg-egsport-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-egsport-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Grow</h3>
              <p className="text-gray-600">Increase membership and participation in your club or society.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="py-16 bg-gradient-to-b from-white to-sky-50">
        <div className="egsport-container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="egsport-subheading mb-4">Ready to join the network?</h2>
            <p className="text-lg text-gray-700 mb-8">
              Register your club today and become part of our growing community of local sports organizations.
            </p>
            <Link to="/register">
              <Button size="lg" className="bg-egsport-green hover:bg-egsport-green/90">
                Register Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Sports Council Meetings Section */}
      <section className="py-16 bg-sky-50">
        <div className="egsport-container">
          <h2 className="egsport-subheading text-center mb-8">Sports Council Meetings</h2>
          {councilMeetings.length === 0 ? (
            <p className="text-center text-gray-500">No recent Sports Council meetings found.</p>
          ) : (
            <div className="max-w-3xl mx-auto space-y-8">
              {councilMeetings.map(meeting => (
                <div key={meeting.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                    <span className="font-semibold text-lg text-egsport-blue">{new Date(meeting.meeting_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    <span className="text-sm text-gray-600 mt-1 md:mt-0">{meeting.location}</span>
                  </div>
                  <div className="text-gray-800 mb-2"><strong>Summary:</strong> {meeting.summary}</div>
                  {meeting.notes && <div className="text-gray-600 text-sm"><strong>Notes:</strong> {meeting.notes}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Index;
