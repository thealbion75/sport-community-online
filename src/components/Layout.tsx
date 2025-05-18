
import React from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

// Layout component that provides consistent structure across pages
interface LayoutProps {
  children: React.ReactNode;
  showNavigation?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, showNavigation = true }) => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-egsport-blue text-white shadow-md">
        <div className="egsport-container py-4">
          <div className="flex justify-between items-center">
            <Link to="/" className="text-2xl font-bold">EGSport</Link>
            
            {showNavigation && (
              <nav className="hidden md:flex space-x-6">
                <Link to="/" className="hover:text-white/80 transition-colors">Home</Link>
                <Link to="/clubs" className="hover:text-white/80 transition-colors">Clubs</Link>
                <Link to="/register" className="hover:text-white/80 transition-colors">Register</Link>
                <Link to="/login" className="hover:text-white/80 transition-colors">Login</Link>
              </nav>
            )}
            
            {/* Mobile menu button - would need additional implementation for dropdown */}
            <button className="md:hidden p-2 rounded-md hover:bg-egsport-blue-dark">
              <span className="sr-only">Open menu</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-egsport-dark text-white py-8">
        <div className="egsport-container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">EGSport</h3>
              <p className="text-white/70">
                Connecting local sports clubs and the community since 2024.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-white/70">
                <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
                <li><Link to="/clubs" className="hover:text-white transition-colors">Find Clubs</Link></li>
                <li><Link to="/register" className="hover:text-white transition-colors">Register</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Login</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <p className="text-white/70">
                Email: info@egsport.org<br />
                Phone: (123) 456-7890
              </p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/10 text-center text-white/50">
            <p>&copy; {new Date().getFullYear()} EGSport. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
