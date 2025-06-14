
-- Create a table for Sports Council meetings
CREATE TABLE public.sports_council_meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  time TIME,
  venue TEXT,
  address TEXT,
  speaker TEXT,
  speaker_role TEXT,
  topic TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('upcoming', 'planned', 'completed')),
  outcomes TEXT[], -- Array of outcome strings
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for the table
ALTER TABLE public.sports_council_meetings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow everyone to read meetings (public information)
CREATE POLICY "Everyone can view sports council meetings" 
  ON public.sports_council_meetings 
  FOR SELECT 
  TO PUBLIC
  USING (true);

-- Create policy to allow only admins to insert/update/delete meetings
CREATE POLICY "Only admins can manage sports council meetings" 
  ON public.sports_council_meetings 
  FOR ALL 
  USING (public.is_admin(auth.uid()));

-- Create trigger to automatically update the updated_at timestamp
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.sports_council_meetings 
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Insert the existing meeting data
INSERT INTO public.sports_council_meetings (date, time, venue, address, speaker, speaker_role, topic, status) VALUES
('2024-03-15', '19:30', 'East Grinstead Tennis Club', 'Saint Hill Road, East Grinstead', 'Sarah Johnson', 'Olympic Athlete & Sports Development Officer', 'Building Inclusive Sports Communities', 'upcoming'),
('2024-06-20', '19:30', 'TBC', 'To be confirmed', 'TBC', 'To be confirmed', 'TBC', 'planned');

INSERT INTO public.sports_council_meetings (date, time, venue, address, speaker, speaker_role, topic, status, outcomes) VALUES
('2023-12-08', '19:30', 'East Grinstead RFC', NULL, 'Mark Stevens', 'Mid Sussex District Council Sports Development', 'Funding Opportunities for Local Sports Clubs', 'completed', 
 ARRAY['New grant application process outlined for 2024', '5 clubs received direct guidance on funding applications', 'Community partnership opportunities identified', 'Equipment sharing scheme launched between 3 clubs']),
('2023-09-22', '19:30', 'East Grinstead Swimming Club', NULL, 'Dr. Emma Williams', 'Sports Psychologist', 'Youth Engagement and Mental Wellbeing in Sport', 'completed',
 ARRAY['Mental health resources shared with all clubs', 'Youth coaching workshop scheduled for November', 'Inter-club youth tournament planning committee formed', 'Best practices for supporting young athletes established']);
