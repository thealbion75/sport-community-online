/**
 * Type Definitions Index
 * Centralized exports for all type definitions
 */

// Legacy club types (existing functionality)
export type { ClubProfile, MeetingTime } from './club';

// Sports council types
export type {
  SportsCouncilMeeting,
  SportsCouncilAdmin,
  MeetingFormData,
  MeetingFilters,
  SportsCouncilStats
} from './sportsCouncil';

// Volunteer platform types
export type {
  Club,
  VolunteerOpportunity,
  VolunteerProfile,
  VolunteerApplication,
  Message,
  OpportunityFilters,
  VolunteerFilters,
  ClubRegistrationData,
  VolunteerRegistrationData,
  OpportunityFormData,
  ApplicationFormData,
  MessageFormData,
  ApiResponse,
  PaginatedResponse,
  Notification,
  ClubDashboardStats,
  VolunteerDashboardStats,
  PlatformStats
} from './volunteer';

export { UserRole } from './volunteer';

// Common utility types
export interface SelectOption {
  value: string;
  label: string;
}

export interface TableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: any, item: T) => React.ReactNode;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage?: number;
}

export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

export interface FormFieldProps {
  label: string;
  name: string;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
}