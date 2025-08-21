/**
 * D1 Authentication Client
 * Handles authentication using Cloudflare D1 database only
 */

export interface User {
  id: string;
  email: string;
  email_verified: boolean;
  created_at: string;
}

export interface Session {
  access_token: string;
  user: User;
  expires_at: string;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    user?: User;
    session?: Session;
  };
  error?: string;
}

/**
 * D1 Authentication API Client
 */
class D1AuthClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  /**
   * Sign up a new user
   */
  async signUp(email: string, password: string, metadata?: Record<string, unknown>): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, metadata }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  /**
   * Sign in with email and password
   */
  async signInWithPassword(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();
      
      if (result.success && result.data?.session) {
        // Store session in localStorage
        localStorage.setItem('d1_session', JSON.stringify(result.data.session));
      }
      
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<AuthResponse> {
    try {
      const session = this.getSession();
      if (!session) {
        return { success: true };
      }

      const response = await fetch(`${this.baseUrl}/auth/signout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json();
      
      // Clear local session regardless of API response
      localStorage.removeItem('d1_session');
      
      return result;
    } catch (error) {
      // Clear local session even on error
      localStorage.removeItem('d1_session');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  /**
   * Get current session from localStorage
   */
  getSession(): Session | null {
    try {
      const sessionData = localStorage.getItem('d1_session');
      if (!sessionData) return null;

      const session = JSON.parse(sessionData);
      
      // Check if session is expired
      if (new Date(session.expires_at) <= new Date()) {
        localStorage.removeItem('d1_session');
        return null;
      }

      return session;
    } catch {
      localStorage.removeItem('d1_session');
      return null;
    }
  }

  /**
   * Get current user
   */
  async getUser(): Promise<AuthResponse> {
    try {
      const session = this.getSession();
      if (!session) {
        return { success: false, error: 'No active session' };
      }

      const response = await fetch(`${this.baseUrl}/auth/user`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  /**
   * Reset password
   */
  async resetPasswordForEmail(email: string, options?: { redirectTo?: string }): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          redirect_to: options?.redirectTo 
        }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  /**
   * Listen for auth state changes
   */
  onAuthStateChange(callback: (event: string, session: Session | null) => void): { data: { subscription: { unsubscribe: () => void } } } {
    // Simple polling implementation for auth state changes
    let currentSession = this.getSession();
    
    const checkSession = () => {
      const newSession = this.getSession();
      
      if (!currentSession && newSession) {
        callback('SIGNED_IN', newSession);
      } else if (currentSession && !newSession) {
        callback('SIGNED_OUT', null);
      } else if (currentSession && newSession && currentSession.access_token !== newSession.access_token) {
        callback('TOKEN_REFRESHED', newSession);
      }
      
      currentSession = newSession;
    };

    // Check every 5 seconds
    const interval = setInterval(checkSession, 5000);

    return {
      data: {
        subscription: {
          unsubscribe: () => clearInterval(interval)
        }
      }
    };
  }
}

// Export singleton instance
export const d1Auth = new D1AuthClient();