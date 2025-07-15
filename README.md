
# EGSport - Sports Club Management Platform

EGSport is a comprehensive web platform designed to help sports clubs manage their operations and connect with their communities. The platform provides tools for club registration, member management, volunteer coordination, and public discovery of local sports clubs.

## 🚀 Features

### For Sports Clubs
- **Club Registration & Approval**: Streamlined registration process with admin approval workflow
- **Club Dashboard**: Comprehensive management interface for club administrators
- **Meeting Times Management**: Set up and manage regular club meeting schedules
- **Volunteer Position Management**: Create, edit, and manage volunteer opportunities
- **Location & Contact Management**: Add club addresses, contact details, and social media links
- **Google Maps Integration**: Link club locations to Google Maps for easy discovery
- **What3Words Support**: Precise location sharing using What3Words addresses

### For Users
- **Club Directory**: Browse and search approved sports clubs by category and location
- **Advanced Search**: Filter clubs by sport type, location, and keywords
- **Contact Integration**: Direct email and phone contact with clubs
- **Responsive Design**: Full mobile and desktop compatibility

### For Administrators
- **Admin Dashboard**: Review and approve club registrations
- **User Management**: Comprehensive user and club oversight
- **Approval Workflow**: Streamlined process for reviewing club applications

## 🛠 Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Framework**: Tailwind CSS, Shadcn UI components
- **Backend**: Supabase (PostgreSQL database, Authentication, Real-time)
- **Form Handling**: React Hook Form with Zod validation
- **Routing**: React Router DOM
- **State Management**: React Context API
- **Icons**: Lucide React

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account for backend services

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
The project uses Supabase for backend services. Ensure your Supabase project is configured with the correct database schema and RLS policies.

### Supabase Project Setup

1.  **Create a new Supabase project:** Go to [supabase.com](https://supabase.com) and create a new project.
2.  **Get your API keys:** In your Supabase project, go to "Project Settings" > "API". You will need the "Project URL" and the "public" `anon` key.
3.  **Create a `.env` file:** In the root of your project, create a `.env` file by copying the `.env.example` file.
4.  **Add your Supabase credentials to the `.env` file:**
    ```
    VITE_SUPABASE_URL=YOUR_SUPABASE_URL
    VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
    ```
5.  **Database setup:** Supabase automatically creates the `auth.users` table. When a user signs up, their `full_name` and `club_name` are stored in the `raw_user_meta_data` column.

### 4. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 🗄 Database Schema

### Tables
- **club_profiles**: Main club information and registration data
- **club_meeting_times**: Scheduled meeting times for clubs
- **club_volunteer_positions**: Volunteer opportunities posted by clubs
- **admin_roles**: Administrative user permissions

### Key Features
- Row Level Security (RLS) for data protection
- Automated timestamps with triggers
- Foreign key relationships for data integrity
- Approval workflow for club registrations

## 🔐 Authentication & Authorization

The platform uses Supabase Auth with the following roles:
- **Public Users**: Can browse approved clubs
- **Club Administrators**: Can manage their club profile and content
- **System Administrators**: Can approve/reject club registrations

## 📱 User Interface Components

### Reusable Components
- **Layout**: Main application layout with navigation
- **AuthenticatedNav**: Navigation for logged-in users
- **ProtectedRoute**: Route protection for authenticated areas
- **MeetingTimesSelector**: Interactive meeting time picker
- **VolunteerPositions**: Volunteer opportunity management

### Pages
- **Home**: Landing page with platform overview
- **Clubs**: Public directory of approved clubs
- **Profile**: Club dashboard for administrators
- **Admin**: Administrative approval interface
- **Login/Register**: Authentication pages

## 🔧 Development Guidelines

### Code Structure
- Components are organized by feature and reusability
- TypeScript interfaces defined in `/src/types/`
- Supabase integration centralized in `/src/integrations/`
- Form validation using Zod schemas

### Best Practices
- All user inputs are validated both client and server-side
- Responsive design using Tailwind CSS utilities
- Accessibility considerations throughout the interface
- Error handling with user-friendly toast notifications

## 🚀 Deployment

### Using Lovable (Recommended)
1. Open the [Lovable Project](https://lovable.dev/projects/21e1c028-7b98-43c5-a43e-6d463d0069ba)
2. Click on Share → Publish
3. Your app will be deployed with a custom domain option available

### Manual Deployment
1. Build the project: `npm run build`
2. Deploy the `dist` folder to your hosting provider
3. Configure environment variables for Supabase connection

## 🔗 External Integrations

### Supabase Configuration
- Database hosted on Supabase cloud
- Real-time subscriptions for live updates
- File storage for future media uploads
- Edge functions for custom backend logic

### Future Integrations
- Google Maps API for enhanced location features
- What3Words API for precise location sharing
- Email notifications for club activities
- Payment processing for membership fees

## 📖 Usage Guide

### For Club Administrators
1. **Registration**: Register your club through the signup process
2. **Approval**: Wait for admin approval of your club profile
3. **Dashboard Access**: Use the "Club Dashboard" link after login
4. **Profile Management**: Complete your club information in the Profile tab
5. **Meeting Times**: Set up regular meeting schedules (available after approval)
6. **Volunteer Positions**: Create and manage volunteer opportunities

### For Administrators
1. **Admin Access**: Access the admin dashboard if you have admin privileges
2. **Review Applications**: Review pending club registrations
3. **Approval Process**: Approve or reject club applications
4. **User Management**: Monitor club activities and user engagement

## 🤝 Contributing

### Development Workflow
1. Create feature branches from main
2. Follow TypeScript and ESLint guidelines
3. Test changes thoroughly before merging
4. Update documentation for new features

### Code Quality
- Use TypeScript for type safety
- Follow React best practices
- Implement proper error handling
- Write descriptive commit messages

## 📄 License

This project is built using Lovable.dev and follows their terms of service.

## 🆘 Support

For technical issues or feature requests:
- Check the [Lovable Documentation](https://docs.lovable.dev/)
- Join the [Lovable Discord Community](https://discord.com/channels/1119885301872070706/1280461670979993613)
- Review the [troubleshooting guide](https://docs.lovable.dev/tips-tricks/troubleshooting)

## 🔮 Future Roadmap

- **Enhanced Location Features**: Full Google Maps integration
- **Mobile App**: React Native version for mobile users
- **Payment Integration**: Membership fee processing
- **Event Management**: Club event scheduling and management
- **Member Communications**: Internal messaging system
- **Analytics Dashboard**: Club engagement metrics
- **Multi-language Support**: International accessibility
