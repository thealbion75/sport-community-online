# Design Document

## Overview

The volunteer sports platform will be built as a React-based web application using the existing tech stack (React, TypeScript, Tailwind CSS, Supabase). The platform will serve as a marketplace connecting local sports clubs and societies in East Grinstead with potential volunteers. The design leverages the existing Supabase backend and extends the current component architecture to support volunteer management functionality.

## Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite
- **UI Components**: Radix UI primitives with shadcn/ui components
- **Styling**: Tailwind CSS with custom design system
- **State Management**: React Query for server state, React Context for auth
- **Routing**: React Router DOM for client-side navigation
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Database**: Supabase PostgreSQL with Row Level Security (RLS)
- **Authentication**: Supabase Auth with JWT tokens
- **API**: Supabase client-side SDK for database operations
- **File Storage**: Supabase Storage for club logos and volunteer profile images

### Database Schema Design

```sql
-- Clubs table (extends existing functionality)
CREATE TABLE clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  logo_url TEXT,
  website_url TEXT,
  sport_types TEXT[] DEFAULT '{}',
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Volunteer opportunities table
CREATE TABLE volunteer_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  required_skills TEXT[] DEFAULT '{}',
  time_commitment TEXT NOT NULL,
  location TEXT,
  start_date DATE,
  end_date DATE,
  is_recurring BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'filled', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Volunteer profiles table
CREATE TABLE volunteer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  location TEXT,
  bio TEXT,
  skills TEXT[] DEFAULT '{}',
  availability TEXT[] DEFAULT '{}',
  profile_image_url TEXT,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Applications table
CREATE TABLE volunteer_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES volunteer_opportunities(id) ON DELETE CASCADE,
  volunteer_id UUID REFERENCES volunteer_profiles(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(opportunity_id, volunteer_id)
);

-- Messages table for internal communication
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Components and Interfaces

### Core Components

#### Club Management Components
- `ClubRegistration`: Form for clubs to register and verify their organization
- `ClubDashboard`: Overview of club's volunteer opportunities and applications
- `OpportunityForm`: Create/edit volunteer opportunities
- `ApplicationManager`: View and manage volunteer applications

#### Volunteer Components
- `VolunteerRegistration`: Profile creation for volunteers
- `OpportunityBrowser`: Search and filter volunteer opportunities
- `OpportunityCard`: Display individual opportunity details
- `ApplicationForm`: Apply for volunteer positions
- `VolunteerDashboard`: Track applications and manage profile

#### Communication Components
- `MessageCenter`: Internal messaging system
- `MessageThread`: Individual conversation view
- `NotificationBell`: Real-time notifications for new messages/applications

#### Shared Components
- `SearchFilters`: Reusable filtering component for opportunities and volunteers
- `UserProfile`: Display user information and verification status
- `ImageUpload`: Handle profile images and club logos

### Data Interfaces

```typescript
interface Club {
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
  created_at: string;
  updated_at: string;
}

interface VolunteerOpportunity {
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

interface VolunteerProfile {
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

interface VolunteerApplication {
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
```

## Data Models

### User Roles and Permissions
- **Volunteers**: Can create profiles, browse opportunities, apply for positions, message clubs
- **Club Administrators**: Can create opportunities, manage applications, search volunteers, message volunteers
- **Platform Administrators**: Can verify clubs, moderate content, manage user accounts

### Row Level Security Policies
```sql
-- Volunteers can only see their own profile data
CREATE POLICY "Volunteers can view own profile" ON volunteer_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Clubs can view volunteer profiles that are visible
CREATE POLICY "Clubs can view visible volunteer profiles" ON volunteer_profiles
  FOR SELECT USING (is_visible = true);

-- Only club members can manage their opportunities
CREATE POLICY "Club members manage opportunities" ON volunteer_opportunities
  FOR ALL USING (
    club_id IN (
      SELECT id FROM clubs WHERE contact_email = auth.jwt() ->> 'email'
    )
  );
```

## Error Handling

### Client-Side Error Handling
- Form validation using Zod schemas with user-friendly error messages
- Network error handling with retry mechanisms using React Query
- Toast notifications for user feedback on actions
- Fallback UI components for failed data loads

### Server-Side Error Handling
- Database constraint violations handled gracefully
- Authentication errors with clear redirect flows
- Rate limiting for API endpoints to prevent abuse
- Comprehensive logging for debugging and monitoring

### Error Boundaries
```typescript
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<PropsWithChildren, ErrorBoundaryState> {
  // Catch and display user-friendly error messages
  // Log errors for debugging
  // Provide recovery options where possible
}
```

## Testing Strategy

### Unit Testing
- Component testing using React Testing Library
- Hook testing for custom React hooks
- Utility function testing with Jest
- Form validation testing with various input scenarios

### Integration Testing
- API integration tests with Supabase
- Authentication flow testing
- End-to-end user journeys (registration, application, messaging)
- Database operation testing with test data

### Performance Testing
- Component rendering performance with React DevTools Profiler
- Database query optimization testing
- Image loading and optimization testing
- Mobile responsiveness testing across devices

### Security Testing
- Row Level Security policy validation
- Input sanitization testing
- Authentication and authorization testing
- XSS and injection attack prevention testing

## Security Considerations

### Authentication & Authorization
- JWT token validation on all protected routes
- Role-based access control for different user types
- Session management with automatic token refresh
- Secure password requirements and hashing

### Data Protection
- Input sanitization for all user-generated content
- SQL injection prevention through parameterized queries
- XSS protection through proper output encoding
- File upload validation and virus scanning

### Privacy Controls
- Volunteer profile visibility settings
- Data retention policies for inactive accounts
- GDPR compliance for data export and deletion
- Secure communication channels for sensitive information