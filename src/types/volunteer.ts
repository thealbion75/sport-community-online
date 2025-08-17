/**
 * Volunteer Platform Type Definitions
 * Contains all TypeScript interfaces for the volunteer sports platform
 */

/**
 * Club Interface
 * Represents a sports club that can post volunteer opportunities
 */
export interface Club {
  id: string;
  name: string;
  description?: string;
  location: string;
  contact_email: string;
  contact_phone?: string;
  logo_url?: string;
  website_url?: string;
  sport_types: string[];
  verified: boolean;
  application_status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Volunteer Opportunity Interface
 * Represents a volunteer position posted by a club
 */
export interface VolunteerOpportunity {
  id: string;
  club_id: string;
  title: string;
  description: string;
  required_skills: string[];
  time_commitment: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  is_recurring: boolean;
  status: 'active' | 'filled' | 'cancelled';
  club?: Club;
  created_at: string;
  updated_at: string;
}

/**
 * Volunteer Profile Interface
 * Represents a volunteer's profile and information
 */
export interface VolunteerProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  location?: string;
  bio?: string;
  skills: string[];
  availability: string[];
  profile_image_url?: string;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Volunteer Application Interface
 * Represents an application from a volunteer to a specific opportunity
 */
export interface VolunteerApplication {
  id: string;
  opportunity_id: string;
  volunteer_id: string;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  opportunity?: VolunteerOpportunity;
  volunteer?: VolunteerProfile;
  applied_at: string;
  updated_at: string;
}

/**
 * Message Interface
 * Represents internal messages between users
 */
export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  conversation_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

/**
 * Search Filters Interface
 * Used for filtering volunteer opportunities and volunteers
 */
export interface OpportunityFilters {
  location?: string;
  sport_types?: string[];
  required_skills?: string[];
  time_commitment?: string;
  is_recurring?: boolean;
  start_date?: string;
  end_date?: string;
}

export interface VolunteerFilters {
  location?: string;
  skills?: string[];
  availability?: string[];
}

/**
 * Form Data Interfaces
 * Used for form submissions and validation
 */
export interface ClubRegistrationData {
  name: string;
  description?: string;
  location: string;
  contact_email: string;
  contact_phone?: string;
  website_url?: string;
  sport_types: string[];
}

export interface VolunteerRegistrationData {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  location?: string;
  bio?: string;
  skills: string[];
  availability: string[];
  is_visible: boolean;
}

export interface OpportunityFormData {
  title: string;
  description: string;
  required_skills: string[];
  time_commitment: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  is_recurring: boolean;
}

export interface ApplicationFormData {
  message?: string;
}

export interface MessageFormData {
  sender_id: string;
  recipient_id: string;
  content: string;
  conversation_id?: string; // Can be optional if a new conversation is being started
}

/**
 * API Response Interfaces
 * Used for API responses and error handling
 */
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  limit: number;
  total_pages: number;
}

/**
 * User Role Enum
 * Defines the different types of users in the system
 */
export enum UserRole {
  VOLUNTEER = 'volunteer',
  CLUB_ADMIN = 'club_admin',
  PLATFORM_ADMIN = 'platform_admin'
}

/**
 * Notification Interface
 * For real-time notifications
 */
export interface Notification {
  id: string;
  user_id: string;
  type: 'application' | 'message' | 'opportunity' | 'system';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

/**
 * Dashboard Stats Interfaces
 * For displaying statistics on dashboards
 */
export interface ClubDashboardStats {
  total_opportunities: number;
  active_opportunities: number;
  total_applications: number;
  pending_applications: number;
  accepted_applications: number;
}

export interface VolunteerDashboardStats {
  total_applications: number;
  pending_applications: number;
  accepted_applications: number;
  opportunities_available: number;
}

export interface PlatformStats {
  total_clubs: number;
  verified_clubs: number;
  total_volunteers: number;
  total_opportunities: number;
  total_applications: number;
  active_users: number;
}

/**
 * Club Application History Interface
 * Represents the history of approval/rejection decisions for a club
 */
export interface ClubApplicationHistory {
  id: string;
  club_id: string;
  admin_id: string;
  action: 'approved' | 'rejected' | 'pending';
  notes?: string;
  created_at: string;
  admin_email?: string;
  admin_name?: string;
}

/**
 * Club Application Review Interface
 * Extended club data with history for admin review
 */
export interface ClubApplicationReview {
  club: Club;
  history: ClubApplicationHistory[];
  admin_user?: {
    email: string;
    name?: string;
  };
}

/**
 * Approval Action Data Interface
 * Data structure for approval/rejection actions
 */
export interface ApprovalActionData {
  club_id: string;
  action: 'approve' | 'reject';
  admin_notes?: string;
  send_notification?: boolean;
}

/**
 * Club Application Filters Interface
 * Filters for club application queries
 */
export interface ClubApplicationFilters {
  status?: 'pending' | 'approved' | 'rejected' | 'all';
  search?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}