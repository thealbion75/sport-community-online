# Admin Account Setup Guide

This guide will help you set up an admin account for the EGSport volunteer platform.

## Prerequisites

- Access to your Supabase project dashboard
- The platform should be deployed and running

## Step-by-Step Setup

### 1. Create User Account in Supabase Auth

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** > **Users**
3. Click **"Add user"** or **"Invite user"**
4. Enter your email address and a secure password
5. Make sure to **confirm the email** if email confirmation is enabled

### 2. Run the Admin Setup SQL

1. Go to **SQL Editor** in your Supabase dashboard
2. Open the `setup-admin.sql` file from your project root
3. **Replace** `'your-admin-email@example.com'` with your actual email address (the same one you used in step 1)
4. Run the SQL script

### 3. Verify Admin Access

1. Sign in to the platform using your admin email and password
2. You should now see:
   - **Admin Panel** link in the user dropdown menu
   - Access to `/admin` route for platform administration
   - Access to `/sports-council/admin` route for sports council management

## Admin Capabilities

Once set up, your admin account will have access to:

### Platform Administration (`/admin`)
- **Club Verification**: Approve/reject club registrations
- **User Management**: View and manage user accounts
- **Content Moderation**: Review reported content and take action
- **Platform Analytics**: View usage statistics and metrics

### Sports Council Administration (`/sports-council/admin`)
- **Meeting Management**: Create and manage sports council meetings
- **Minutes Upload**: Add meeting agendas and minutes
- **Public Content**: Control what meeting information is publicly visible

## Troubleshooting

### "Access Denied" Error
- Ensure the SQL script ran successfully
- Check that your email matches exactly between the auth user and admin_roles table
- Verify you're signed in with the correct admin account

### Admin Menu Not Showing
- Clear your browser cache and refresh
- Sign out and sign back in
- Check the browser console for any JavaScript errors

### Database Errors
- Ensure all migrations have been applied to your Supabase database
- Check that the `admin_roles` and `sports_council_admins` tables exist
- Verify the RLS policies are properly configured

## Security Notes

- Use a strong, unique password for your admin account
- Consider enabling 2FA on your Supabase account
- Regularly review admin access and remove unused admin accounts
- Monitor admin actions through the platform analytics

## Need Help?

If you encounter issues:
1. Check the browser console for error messages
2. Verify your Supabase database schema matches the migrations
3. Ensure all environment variables are properly configured
4. Check that your Supabase project has the correct RLS policies enabled

---

**Important**: Keep your admin credentials secure and don't share them with unauthorized users.