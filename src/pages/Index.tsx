import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { supabase } from '@/integrations/supabase/client';
import type { SportsCouncilMeeting } from '@/types/sportsCouncil';

// SVG silhouette for sports (multi-sport, modern, and relevant)
const SPORTS_SILHOUETTE = (
  <svg viewBox="0 0 1440 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-full h-full object-cover">
    <rect width="1440" height="400" fill="#0f172a" />
    <g opacity="0.18">
      <path d="M200 350 Q 300 250 400 350 T 600 350 T 800 350 T 1000 350 T 1200 350" stroke="#fff" strokeWidth="8" fill="none" />
      <ellipse cx="300" cy="320" rx="40" ry="18" fill="#fff" /> {/* Football */}
      <rect x="700" y="320" width="60" height="18" rx="9" fill="#fff" /> {/* Tennis court */}
      <circle cx="1100" cy="320" r="18" fill="#fff" /> {/* Basketball */}
      <rect x="900" y="320" width="30" height="18" rx="9" fill="#fff" /> {/* Rugby ball */}
      <ellipse cx="500" cy="320" rx="18" ry="8" fill="#fff" /> {/* Hockey puck */}
      {/* Silhouettes */}
      <path d="M320 250 Q 330 230 340 250 Q 350 270 360 250 Q 370 230 380 250" stroke="#fff" strokeWidth="6" fill="none" />
      <path d="M800 250 Q 810 230 820 250 Q 830 270 840 250 Q 850 230 860 250" stroke="#fff" strokeWidth="6" fill="none" />
      <path d="M1200 250 Q 1210 230 1220 250 Q 1230 270 1240 250 Q 1250 230 1260 250" stroke="#fff" strokeWidth="6" fill="none" />
    </g>
  </svg>
);

const LOCAL_IMAGES = [
  // Football (Unsplash, East Grinstead relevant)
  'https://images.unsplash.com/photo-1505843273132-bc5c6f7bfa1a?auto=format&fit=crop&w=600&q=80',
  // Cricket
  'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=600&q=80',
  // Netball
  'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=600&q=80',
  // Athletics
  'https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=600&q=80',
  // Local landmark (Ashdown Forest)
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
];

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
      {/* Hero section with SVG sports silhouette */}
      <section className="relative min-h-[60vh] flex items-center justify-center bg-gray-900 overflow-hidden">
        {SPORTS_SILHOUETTE}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-sky-900/40" />
        <div className="relative z-10 max-w-3xl mx-auto text-center text-white py-16 px-4">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 drop-shadow-lg font-sans">East Grinstead Sports & Volunteering</h1>
          <p className="text-lg md:text-2xl mb-8 font-light drop-shadow">Discover, join, and grow with local clubs. Make a difference in your community.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/clubs">
              <Button size="lg" className="bg-egsport-green hover:bg-egsport-green/90 shadow-lg text-lg font-bold px-8 py-4 focus:ring-4 focus:ring-white/60">Find Clubs</Button>
            </Link>
            <Link to="/register">
              <Button size="lg" className="bg-egsport-blue hover:bg-egsport-blue/90 text-white shadow-lg text-lg font-bold px-8 py-4 focus:ring-4 focus:ring-white/60 border-2 border-white">Register Your Club</Button>
            </Link>
          </div>
        </div>
        {/* SVG wave accent */}
        <svg className="absolute bottom-0 left-0 w-full" height="80" viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fill="#f0f9ff" d="M0,32L48,37.3C96,43,192,53,288,58.7C384,64,480,64,576,58.7C672,53,768,43,864,37.3C960,32,1056,32,1152,37.3C1248,43,1344,53,1392,58.7L1440,64L1440,80L1392,80C1344,80,1248,80,1152,80C1056,80,960,80,864,80C768,80,672,80,576,80C480,80,384,80,288,80C192,80,96,80,48,80L0,80Z" />
        </svg>
      </section>

      {/* Why Join section */}
      <section className="py-16 bg-white">
        <div className="egsport-container">
          <h2 className="text-3xl font-bold text-center mb-12 font-sans text-egsport-blue">Why Join EGSport?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="rounded-2xl shadow-lg bg-white p-8 text-center hover:scale-105 transition-transform">
              <div className="w-16 h-16 bg-egsport-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-egsport-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Connect</h3>
              <p className="text-gray-600">Network with other local sports clubs to share ideas and resources.</p>
            </div>
            <div className="rounded-2xl shadow-lg bg-white p-8 text-center hover:scale-105 transition-transform">
              <div className="w-16 h-16 bg-egsport-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-egsport-green" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Discover</h3>
              <p className="text-gray-600">Help local residents discover your club and the activities you offer.</p>
            </div>
            <div className="rounded-2xl shadow-lg bg-white p-8 text-center hover:scale-105 transition-transform">
              <div className="w-16 h-16 bg-egsport-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-egsport-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Grow</h3>
              <p className="text-gray-600">Increase membership and participation in your club or society.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Local Impact photo grid */}
      <section className="py-16 bg-gradient-to-b from-sky-50 to-white">
        <div className="egsport-container">
          <h2 className="text-3xl font-bold text-center mb-10 font-sans text-egsport-green">Local Impact</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 rounded-2xl overflow-hidden shadow-xl">
            {LOCAL_IMAGES.map((img, i) => (
              <img key={i} src={img} alt={
                i === 0 ? 'Football in East Grinstead' :
                i === 1 ? 'Cricket in East Grinstead' :
                i === 2 ? 'Netball in East Grinstead' :
                i === 3 ? 'Athletics in East Grinstead' :
                'Ashdown Forest, East Grinstead'
              } className="object-cover w-full h-40 md:h-48 hover:scale-105 transition-transform" loading="lazy" />
            ))}
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="py-16 bg-gradient-to-b from-white to-sky-50">
        <div className="egsport-container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 font-sans text-egsport-blue">Ready to join the network?</h2>
            <p className="text-lg text-gray-700 mb-8">Register your club today and become part of our growing community of local sports organizations.</p>
            <Link to="/register">
              <Button size="lg" className="bg-egsport-green hover:bg-egsport-green/90 shadow-lg">Register Now</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Sports Council Meetings Section */}
      <section className="py-16 bg-sky-50">
        <div className="egsport-container">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 font-sans text-egsport-blue">Sports Council Meetings</h2>
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
