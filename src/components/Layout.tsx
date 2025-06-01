
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Users, Building, Home, Award } from 'lucide-react';
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
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="egsport-container">
          <div className="flex justify-between items-center py-4">
            {/* Logo and Brand */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-egsport-blue rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">EG</span>
              </div>
              <span className="text-xl font-bold text-gray-900">EGSport</span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-6">
              <Link 
                to="/" 
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === '/' 
                    ? 'bg-egsport-blue text-white' 
                    : 'text-gray-700 hover:text-egsport-blue hover:bg-gray-100'
                }`}
              >
                <Home className="h-4 w-4" />
                <span>Home</span>
              </Link>
              
              <Link 
                to="/clubs" 
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === '/clubs' 
                    ? 'bg-egsport-blue text-white' 
                    : 'text-gray-700 hover:text-egsport-blue hover:bg-gray-100'
                }`}
              >
                <Building className="h-4 w-4" />
                <span>Clubs</span>
              </Link>
              
              <Link 
                to="/volunteer-opportunities" 
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === '/volunteer-opportunities' 
                    ? 'bg-egsport-blue text-white' 
                    : 'text-gray-700 hover:text-egsport-blue hover:bg-gray-100'
                }`}
              >
                <Users className="h-4 w-4" />
                <span>Volunteer</span>
              </Link>

              <Link 
                to="/sports-council" 
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === '/sports-council' 
                    ? 'bg-egsport-blue text-white' 
                    : 'text-gray-700 hover:text-egsport-blue hover:bg-gray-100'
                }`}
              >
                <Award className="h-4 w-4" />
                <span>Sports Council</span>
              </Link>
            </div>

            {/* Authentication Section */}
            <div className="flex items-center space-x-4">
              {user ? (
                <AuthenticatedNav />
              ) : (
                <div className="flex items-center space-x-2">
                  <Link to="/login">
                    <Button variant="ghost" size="sm">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button size="sm" className="bg-egsport-blue hover:bg-egsport-blue/90">
                      Register Club
                    </Button>
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
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === '/' 
                    ? 'bg-egsport-blue text-white' 
                    : 'text-gray-700 hover:text-egsport-blue hover:bg-gray-100'
                }`}
              >
                <Home className="h-4 w-4" />
                <span>Home</span>
              </Link>
              
              <Link 
                to="/clubs" 
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === '/clubs' 
                    ? 'bg-egsport-blue text-white' 
                    : 'text-gray-700 hover:text-egsport-blue hover:bg-gray-100'
                }`}
              >
                <Building className="h-4 w-4" />
                <span>Clubs</span>
              </Link>
              
              <Link 
                to="/volunteer-opportunities" 
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === '/volunteer-opportunities' 
                    ? 'bg-egsport-blue text-white' 
                    : 'text-gray-700 hover:text-egsport-blue hover:bg-gray-100'
                }`}
              >
                <Users className="h-4 w-4" />
                <span>Volunteer Opportunities</span>
              </Link>

              <Link 
                to="/sports-council" 
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === '/sports-council' 
                    ? 'bg-egsport-blue text-white' 
                    : 'text-gray-700 hover:text-egsport-blue hover:bg-gray-100'
                }`}
              >
                <Award className="h-4 w-4" />
                <span>Sports Council</span>
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
