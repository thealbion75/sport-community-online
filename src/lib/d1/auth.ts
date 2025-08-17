/**
 * Authentication Service - D1 Version
 * Handles user authentication using JWT and D1 database
 */

import { 
  executeQuery, 
  executeQueryFirst, 
  executeUpdate, 
  generateId 
} from './client';
import { UserRole, ApiResponse } from '@/types';
import { sanitizeObject } from '@/lib/sanitization';

// Simple password hashing (in production, use bcrypt or similar)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

/**
 * Sign up a new user
 */
export async function signUp(email: string, password: string): Promise<ApiResponse<{ user: any; token: string }>> {
  try {
    const sanitizedData = sanitizeObject({ email, password });
    
    // Check if user already exists
    const existingUser = await executeQueryFirst<any>('SELECT id FROM users WHERE email = ?1', [sanitizedData.email]);
    if (existingUser) {
      return { success: false, error: 'User already exists' };
    }

    // Hash password
    const passwordHash = await hashPassword(sanitizedData.password);
    const userId = generateId();

    // Create user
    const insertQuery = `
      INSERT INTO users (id, email, password_hash, email_verified, created_at, updated_at)
      VALUES (?1, ?2, ?3, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;

    const result = await executeUpdate(insertQuery, [userId, sanitizedData.email, passwordHash]);

    if (!result.success) {
      throw new Error('Failed to create user');
    }

    // Create session token
    const token = generateId();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

    const sessionQuery = `
      INSERT INTO user_sessions (id, user_id, token, expires_at, created_at)
      VALUES (?1, ?2, ?3, ?4, CURRENT_TIMESTAMP)
    `;

    await executeUpdate(sessionQuery, [generateId(), userId, token, expiresAt]);

    const user = {
      id: userId,
      email: sanitizedData.email,
      email_verified: false
    };

    return { success: true, data: { user, token } };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Sign in a user
 */
export async function signIn(email: string, password: string): Promise<ApiResponse<{ user: any; token: string }>> {
  try {
    const sanitizedData = sanitizeObject({ email, password });

    // Get user
    const user = await executeQueryFirst<any>('SELECT * FROM users WHERE email = ?1', [sanitizedData.email]);
    if (!user) {
      return { success: false, error: 'Invalid credentials' };
    }

    // Verify password
    const isValidPassword = await verifyPassword(sanitizedData.password, user.password_hash);
    if (!isValidPassword) {
      return { success: false, error: 'Invalid credentials' };
    }

    // Create session token
    const token = generateId();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

    const sessionQuery = `
      INSERT INTO user_sessions (id, user_id, token, expires_at, created_at)
      VALUES (?1, ?2, ?3, ?4, CURRENT_TIMESTAMP)
    `;

    await executeUpdate(sessionQuery, [generateId(), user.id, token, expiresAt]);

    const userData = {
      id: user.id,
      email: user.email,
      email_verified: user.email_verified
    };

    return { success: true, data: { user: userData, token } };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Sign out the current user
 */
export async function signOut(token: string): Promise<ApiResponse<void>> {
  try {
    // Delete session
    await executeUpdate('DELETE FROM user_sessions WHERE token = ?1', [token]);
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Get current user from token
 */
export async function getCurrentUser(token: string): Promise<ApiResponse<any>> {
  try {
    const sessionQuery = `
      SELECT u.id, u.email, u.email_verified, u.created_at
      FROM user_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ?1 AND s.expires_at > CURRENT_TIMESTAMP
    `;

    const user = await executeQueryFirst<any>(sessionQuery, [token]);
    
    if (!user) {
      return { success: false, error: 'Invalid or expired session' };
    }

    return { success: true, data: user };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Check if user is admin
 */
export async function isUserAdmin(userId: string): Promise<ApiResponse<boolean>> {
  try {
    const adminCheck = await executeQueryFirst<{ is_admin: boolean }>(
      'SELECT is_admin FROM admin_roles WHERE user_id = ?1', 
      [userId]
    );

    return { success: true, data: adminCheck?.is_admin || false };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Determine user role based on their data
 */
export async function getUserRole(userId: string): Promise<ApiResponse<UserRole>> {
  try {
    // Check if user is platform admin
    const adminResult = await isUserAdmin(userId);
    if (adminResult.success && adminResult.data) {
      return { success: true, data: UserRole.PLATFORM_ADMIN };
    }

    // Check if user has a club profile (club admin)
    const userQuery = 'SELECT email FROM users WHERE id = ?1';
    const user = await executeQueryFirst<{ email: string }>(userQuery, [userId]);
    
    if (user) {
      const clubProfile = await executeQueryFirst<any>(
        'SELECT id FROM clubs WHERE contact_email = ?1', 
        [user.email]
      );

      if (clubProfile) {
        return { success: true, data: UserRole.CLUB_ADMIN };
      }
    }

    // Check if user has a volunteer profile
    const volunteerProfile = await executeQueryFirst<any>(
      'SELECT id FROM volunteer_profiles WHERE user_id = ?1', 
      [userId]
    );

    if (volunteerProfile) {
      return { success: true, data: UserRole.VOLUNTEER };
    }

    // Default to volunteer if no specific role found
    return { success: true, data: UserRole.VOLUNTEER };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Check if user has permission for a specific action
 */
export async function hasPermission(
  action: 'create_club' | 'verify_club' | 'moderate_content' | 'manage_users',
  userId: string
): Promise<ApiResponse<boolean>> {
  try {
    const roleResult = await getUserRole(userId);
    
    if (!roleResult.success) {
      return { success: false, error: roleResult.error };
    }

    const userRole = roleResult.data;

    switch (action) {
      case 'create_club':
        return { success: true, data: true }; // Anyone can create a club
      
      case 'verify_club':
      case 'moderate_content':
      case 'manage_users':
        return { success: true, data: userRole === UserRole.PLATFORM_ADMIN };
      
      default:
        return { success: true, data: false };
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions(): Promise<ApiResponse<void>> {
  try {
    await executeUpdate('DELETE FROM user_sessions WHERE expires_at <= CURRENT_TIMESTAMP');
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}