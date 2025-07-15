/**
 * Sports Council Type Definitions
 * Contains TypeScript interfaces for sports council meeting management
 */

/**
 * Sports Council Meeting Interface
 * Represents a sports council meeting with agenda and minutes
 */
export interface SportsCouncilMeeting {
  id: string;
  title: string;
  meeting_date: string; // ISO date string
  meeting_time?: string; // Time in HH:MM format
  location?: string;
  agenda?: string;
  minutes?: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Sports Council Administrator Interface
 * Represents an administrator who can manage sports council content
 */
export interface SportsCouncilAdmin {
  id: string;
  user_id: string;
  email: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Meeting Form Data Interface
 * Used for creating and updating meetings
 */
export interface MeetingFormData {
  title: string;
  meeting_date: string;
  meeting_time?: string;
  location?: string;
  agenda?: string;
  minutes?: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  is_public: boolean;
}

/**
 * Meeting Filters Interface
 * Used for filtering meetings in the display
 */
export interface MeetingFilters {
  status?: 'upcoming' | 'completed' | 'cancelled' | 'all';
  year?: number;
  month?: number;
}

/**
 * Sports Council Stats Interface
 * For displaying statistics on the admin dashboard
 */
export interface SportsCouncilStats {
  total_meetings: number;
  upcoming_meetings: number;
  completed_meetings: number;
  meetings_this_year: number;
}