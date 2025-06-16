export interface SportsCouncilMeeting {
  id: string;
  meeting_date: string;
  location: string;
  agenda: string; // Added agenda field
  summary: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}
