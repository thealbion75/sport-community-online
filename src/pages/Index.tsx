
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';

const Index = () => {
  return (
    <Layout>
      {/* Hero section */}
      <section className="egsport-section-lg bg-gradient-to-br from-egsport-blue-600 via-egsport-blue-500 to-egsport-green-500 text-white relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-egsport-blue-600/20 to-egsport-green-500/20"></div>
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>
        
        <div className="egsport-container relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white leading-tight">
              Discover Local Sports Clubs in Your Community
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto text-white/90 leading-relaxed">
              Connect with sports clubs in your area, find new activities, 
              and build a healthier, more active community together.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/clubs">
                <Button size="lg" className="bg-white text-egsport-blue-600 hover:bg-gray-50 font-semibold px-8 py-3 text-lg shadow-lg hover:shadow-xl transition-all duration-300">
                  Find Clubs
                </Button>
              </Link>
              <Link to="/register">
                <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-egsport-blue-600 font-semibold px-8 py-3 text-lg transition-all duration-300">
                  Register Your Club
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured section */}
      <section className="egsport-section bg-gradient-to-b from-gray-50 to-white">
        <div className="egsport-container">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-900">Why Join EGSport?</h2>
          <p className="text-xl text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Join a thriving community of sports enthusiasts and make a real impact in your local area
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-blue-100">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Connect</h3>
              <p className="text-gray-600 leading-relaxed">Network with other local sports clubs to share ideas, resources, and build lasting partnerships.</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-emerald-100">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Discover</h3>
              <p className="text-gray-600 leading-relaxed">Help local residents discover your club and the amazing activities you offer to the community.</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-purple-100">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Grow</h3>
              <p className="text-gray-600 leading-relaxed">Increase membership and participation in your club while building a stronger sports community.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="py-16 bg-gradient-to-b from-white to-sky-50">
        <div className="egsport-container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="egsport-subheading mb-4">Ready to join the network?</h2>
            <p className="egsport-body text-lg mb-8">
              Register your club today and become part of our growing community of local sports organizations.
            </p>
            <Link to="/register">
              <Button size="lg" className="egsport-btn-secondary">
                Register Now
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
