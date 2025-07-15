-- Sample data for volunteer platform testing
-- This file provides initial test data for development

-- Insert sample clubs
INSERT INTO clubs (name, description, location, contact_email, contact_phone, sport_types, verified) VALUES
('East Grinstead Tennis Club', 'A friendly tennis club welcoming players of all abilities', 'East Grinstead, West Sussex', 'info@egtennisclub.co.uk', '01342 123456', ARRAY['Tennis'], true),
('Meridian Football Club', 'Local football club with teams for all ages', 'East Grinstead, West Sussex', 'contact@meridianfc.co.uk', '01342 234567', ARRAY['Football'], true),
('East Grinstead Cricket Club', 'Historic cricket club established in 1890', 'East Grinstead, West Sussex', 'secretary@egcricket.co.uk', '01342 345678', ARRAY['Cricket'], true),
('Blackwell Runners', 'Running club for all abilities and distances', 'East Grinstead, West Sussex', 'hello@blackwellrunners.co.uk', '01342 456789', ARRAY['Running', 'Athletics'], true),
('East Grinstead Swimming Club', 'Competitive and recreational swimming for all ages', 'East Grinstead, West Sussex', 'info@egswimming.co.uk', '01342 567890', ARRAY['Swimming'], false);

-- Insert sample volunteer opportunities
INSERT INTO volunteer_opportunities (club_id, title, description, required_skills, time_commitment, location, is_recurring, status) VALUES
(
  (SELECT id FROM clubs WHERE name = 'East Grinstead Tennis Club'),
  'Tennis Coach Assistant',
  'Help with junior tennis coaching sessions on Saturday mornings. Support the head coach with equipment setup, court preparation, and assisting young players.',
  ARRAY['Tennis knowledge', 'Good with children', 'Patience'],
  '3 hours per week (Saturday mornings)',
  'East Grinstead Tennis Club courts',
  true,
  'active'
),
(
  (SELECT id FROM clubs WHERE name = 'Meridian Football Club'),
  'Match Day Referee',
  'Referee youth football matches on Sunday mornings. Must have basic knowledge of football rules and be comfortable managing young players.',
  ARRAY['Football knowledge', 'Leadership', 'Communication'],
  '4 hours per week (Sunday mornings)',
  'Various local pitches',
  true,
  'active'
),
(
  (SELECT id FROM clubs WHERE name = 'East Grinstead Cricket Club'),
  'Groundskeeper Assistant',
  'Help maintain the cricket ground including pitch preparation, boundary marking, and general ground maintenance.',
  ARRAY['Groundskeeping', 'Physical fitness', 'Attention to detail'],
  '6 hours per week (flexible)',
  'East Grinstead Cricket Ground',
  true,
  'active'
),
(
  (SELECT id FROM clubs WHERE name = 'Blackwell Runners'),
  'Event Photographer',
  'Photograph club events, races, and training sessions to help promote the club on social media and website.',
  ARRAY['Photography', 'Social media', 'Editing software'],
  '2-3 hours per month',
  'Various locations around East Grinstead',
  false,
  'active'
),
(
  (SELECT id FROM clubs WHERE name = 'East Grinstead Swimming Club'),
  'Pool Safety Marshal',
  'Ensure safety during training sessions and competitions. Must have lifeguard certification or be willing to obtain one.',
  ARRAY['Swimming', 'First aid', 'Lifeguard certification'],
  '4 hours per week (evenings)',
  'East Grinstead Swimming Pool',
  true,
  'active'
);

-- Note: Volunteer profiles and applications would be created by actual users
-- We don't seed these as they require real user authentication