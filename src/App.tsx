
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Clubs from "./pages/Clubs";
import VolunteerOpportunities from "./pages/VolunteerOpportunities";
import VolunteerDashboard from "./pages/VolunteerDashboard";
import Messages from "./pages/Messages";
import SportsCouncil from "./pages/SportsCouncil";
import SportsCouncilAdmin from "./pages/SportsCouncilAdmin";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { initializeSecurity } from "./lib/security";
import { ErrorBoundary } from "./components/ui/error-boundary";
import { createQueryClient } from "./lib/react-query-error-handler";
import { setupGlobalErrorHandlers } from "./lib/global-error-handler";
import { useEffect } from "react";

// Initialize the React Query client with error handling
const queryClient = createQueryClient();

/**
 * Main App component that sets up the application routing and global providers.
 * This includes React Query for data fetching, tooltips, toast notifications, and error handling.
 */
const App = () => {
  // Set up global error handlers and security measures on app initialization
  useEffect(() => {
    setupGlobalErrorHandlers();
    
    // Initialize security measures
    initializeSecurity(() => {
      // Handle session expiration - this will be called by SessionManager
      console.log('Session expired, redirecting to login');
    });
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ThemeProvider>
              <AuthProvider>
                <Routes>
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/clubs" element={<Clubs />} />
                <Route path="/volunteer-opportunities" element={<VolunteerOpportunities />} />
                <Route path="/sports-council" element={<SportsCouncil />} />
                
                {/* Protected routes */}
                <Route path="/profile" element={<Profile />} />
                <Route path="/volunteer/dashboard" element={<ProtectedRoute><VolunteerDashboard /></ProtectedRoute>} />
                <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                <Route path="/sports-council/admin" element={<SportsCouncilAdmin />} />
                <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
                <Route path="/admin/dashboard" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
                <Route path="/admin/club-approvals" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
                <Route path="/admin/club-approvals/:clubId" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
                
                {/* 404 page for non-existent routes */}
                <Route path="*" element={<NotFound />} />
                </Routes>
              </AuthProvider>
            </ThemeProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
