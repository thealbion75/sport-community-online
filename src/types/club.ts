
export interface ClubProfile {
  id: string;
  club_name: string;
  category: string;
  description: string;
  website?: string;
  contact_email: string;
  contact_phone?: string;
  facebook_url?: string;
  instagram_url?: string;
  twitter_url?: string;
  approved: boolean;
  created_at: string;
  updated_at: string;
  // Location fields
  address?: string;
  city?: string;
  postcode?: string;
  what3words?: string;
  google_maps_url?: string;
}

export interface MeetingTime {
  id: string;
  club_id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  created_at: string;
  updated_at: string;
}
