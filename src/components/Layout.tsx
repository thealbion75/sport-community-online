
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Building, Home, Calendar, MessageSquare } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import AuthenticatedNav from './AuthenticatedNav';
import { useAuth } from '@/contexts/AuthContext';
import { useUnreadMessageCount } from '@/hooks/use-messages';
import { UserRole } from '@/types';

/**
 * Layout Component
 * Provides the main navigation structure for the application
 * including responsive navigation and authentication-aware menu items.
 */
const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { user } = useAuth();
  const { data: unreadCount = 0 } = useUnreadMessageCount(user?.id || '');

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <nav className="bg-card shadow-sm border-b border-border">
        <div className="egsport-container">
          <div className="flex justify-between items-center py-4">
            {/* Logo and Brand */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-egsport-blue rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">EG</span>
              </div>
              <span className="text-xl font-bold text-foreground">EGSport</span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-6">
              <Link 
                to="/" 
                className={`egsport-nav-link ${
                  location.pathname === '/' 
                    ? 'egsport-nav-link-active' 
                    : 'egsport-nav-link-inactive'
                }`}
              >
                <Home className="h-4 w-4" />
                <span>Home</span>
              </Link>
              
              <Link 
                to="/clubs" 
                className={`egsport-nav-link ${
                  location.pathname === '/clubs' 
                    ? 'egsport-nav-link-active' 
                    : 'egsport-nav-link-inactive'
                }`}
              >
                <Building className="h-4 w-4" />
                <span>Clubs</span>
              </Link>
              
              <Link 
                to="/volunteer-opportunities" 
                className={`egsport-nav-link ${
                  location.pathname.startsWith('/volunteer-opportunities') 
                    ? 'egsport-nav-link-active' 
                    : 'egsport-nav-link-inactive'
                }`}
              >
                <Users className="h-4 w-4" />
                <span>Volunteer</span>
              </Link>

              <Link 
                to="/sports-council" 
                className={`egsport-nav-link ${
                  location.pathname.startsWith('/sports-council') 
                    ? 'egsport-nav-link-active' 
                    : 'egsport-nav-link-inactive'
                }`}
              >
                <Calendar className="h-4 w-4" />
                <span>Sports Council</span>
              </Link>

              {/* Messages link with notification indicator for authenticated users */}
              {user && (
                <Link 
                  to="/messages" 
                  className={`egsport-nav-link relative ${
                    location.pathname.startsWith('/messages') 
                      ? 'egsport-nav-link-active' 
                      : 'egsport-nav-link-inactive'
                  }`}
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Messages</span>
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Badge>
                  )}
                </Link>
              )}
            </div>

            {/* Authentication Section */}
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              {user ? (
                <AuthenticatedNav />
              ) : (
                <div className="flex items-center space-x-2">
                  <Link 
                    to="/login"
                    className={`egsport-nav-link ${
                      location.pathname === '/login' 
                        ? 'egsport-nav-link-active' 
                        : 'egsport-nav-link-inactive'
                    }`}
                  >
                    Sign In
                  </Link>
                  <Link 
                    to="/register"
                    className={`egsport-nav-link ${
                      location.pathname === '/register' 
                        ? 'egsport-nav-link-active' 
                        : 'egsport-nav-link-inactive'
                    }`}
                  >
                    Register Club
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
                className={`egsport-nav-link ${
                  location.pathname === '/' 
                    ? 'egsport-nav-link-active' 
                    : 'egsport-nav-link-inactive'
                }`}
              >
                <Home className="h-4 w-4" />
                <span>Home</span>
              </Link>
              
              <Link 
                to="/clubs" 
                className={`egsport-nav-link ${
                  location.pathname === '/clubs' 
                    ? 'egsport-nav-link-active' 
                    : 'egsport-nav-link-inactive'
                }`}
              >
                <Building className="h-4 w-4" />
                <span>Clubs</span>
              </Link>
              
              <Link 
                to="/volunteer-opportunities" 
                className={`egsport-nav-link ${
                  location.pathname.startsWith('/volunteer-opportunities') 
                    ? 'egsport-nav-link-active' 
                    : 'egsport-nav-link-inactive'
                }`}
              >
                <Users className="h-4 w-4" />
                <span>Volunteer Opportunities</span>
              </Link>

              <Link 
                to="/sports-council" 
                className={`egsport-nav-link ${
                  location.pathname.startsWith('/sports-council') 
                    ? 'egsport-nav-link-active' 
                    : 'egsport-nav-link-inactive'
                }`}
              >
                <Calendar className="h-4 w-4" />
                <span>Sports Council</span>
              </Link>

              {/* Messages link for mobile - only show for authenticated users */}
              {user && (
                <Link 
                  to="/messages" 
                  className={`egsport-nav-link ${
                    location.pathname.startsWith('/messages') 
                      ? 'egsport-nav-link-active' 
                      : 'egsport-nav-link-inactive'
                  }`}
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Messages</span>
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="ml-auto h-5 w-5 p-0 flex items-center justify-center text-xs">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Badge>
                  )}
                </Link>
              )}
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
