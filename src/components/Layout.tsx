import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Users, Building, Home } from 'lucide-react';
import AuthenticatedNav from './AuthenticatedNav';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Layout Component
 * Provides the main navigation structure for the application
 * including responsive navigation and authentication-aware menu items.
 */
const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-emerald-50">
      {/* Sticky Navigation Header with gradient and shadow */}
      <nav className="sticky top-0 z-50 bg-gradient-to-r from-egsport-blue/90 via-sky-900/80 to-egsport-green/80 shadow-lg border-b">
        <div className="egsport-container">
          <div className="flex justify-between items-center py-4">
            {/* Logo and Brand */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-egsport-green to-egsport-blue rounded-full flex items-center justify-center shadow-lg">
                {/* Modern local sports icon (SVG) */}
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 32 32" stroke="currentColor" strokeWidth="2"><circle cx="16" cy="16" r="14" stroke="white" strokeWidth="2" fill="none" /><path d="M8 24c2-4 8-4 10 0" stroke="white" strokeWidth="2" /><circle cx="16" cy="13" r="4" stroke="white" strokeWidth="2" fill="white" /></svg>
              </div>
              <span className="text-2xl font-extrabold text-white tracking-tight drop-shadow">EGSport</span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-6">
              <Link 
                to="/" 
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-base font-semibold transition-colors ${
                  location.pathname === '/' 
                    ? 'bg-white text-egsport-blue shadow' 
                    : 'text-white/90 hover:text-white hover:bg-white/10'
                }`}
              >
                <Home className="h-5 w-5" />
                <span>Home</span>
              </Link>
              <Link 
                to="/clubs" 
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-base font-semibold transition-colors ${
                  location.pathname === '/clubs' 
                    ? 'bg-white text-egsport-blue shadow' 
                    : 'text-white/90 hover:text-white hover:bg-white/10'
                }`}
              >
                <Building className="h-5 w-5" />
                <span>Clubs</span>
              </Link>
              <Link 
                to="/volunteer-opportunities" 
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-base font-semibold transition-colors ${
                  location.pathname === '/volunteer-opportunities' 
                    ? 'bg-white text-egsport-blue shadow' 
                    : 'text-white/90 hover:text-white hover:bg-white/10'
                }`}
              >
                <Users className="h-5 w-5" />
                <span>Volunteer</span>
              </Link>
            </div>

            {/* Authentication Section */}
            <div className="flex items-center space-x-4">
              {user ? (
                <AuthenticatedNav />
              ) : (
                <div className="flex items-center space-x-2">
                  <Link to="/login">
                    <Button variant="ghost" size="sm" className="text-white border-white hover:bg-white/10">Sign In</Button>
                  </Link>
                  <Link to="/register">
                    <Button size="sm" className="bg-egsport-green hover:bg-egsport-green/90 text-white shadow">Register Club</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          <div className="md:hidden pb-4">
            <div className="flex flex-col space-y-2">
              <Link 
                to="/" 
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-semibold transition-colors ${
                  location.pathname === '/' 
                    ? 'bg-white text-egsport-blue shadow' 
                    : 'text-white/90 hover:text-white hover:bg-white/10'
                }`}
              >
                <Home className="h-5 w-5" />
                <span>Home</span>
              </Link>
              <Link 
                to="/clubs" 
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-semibold transition-colors ${
                  location.pathname === '/clubs' 
                    ? 'bg-white text-egsport-blue shadow' 
                    : 'text-white/90 hover:text-white hover:bg-white/10'
                }`}
              >
                <Building className="h-5 w-5" />
                <span>Clubs</span>
              </Link>
              <Link 
                to="/volunteer-opportunities" 
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-semibold transition-colors ${
                  location.pathname === '/volunteer-opportunities' 
                    ? 'bg-white text-egsport-blue shadow' 
                    : 'text-white/90 hover:text-white hover:bg-white/10'
                }`}
              >
                <Users className="h-5 w-5" />
                <span>Volunteer Opportunities</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        {children}
      </main>
    </div>
  );
};

export default Layout;
