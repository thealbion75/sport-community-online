# Complete D1-Only Setup Guide

## 🎯 Overview

This platform now uses **Cloudflare D1 only** - no Supabase dependencies. Everything runs on D1 SQLite database with the Cloudflare Worker API.

## 🚀 Quick Setup

### 1. Create D1 Database

```bash
# Create the database
wrangler d1 create sport-community-db

# Copy the database ID from the output
# Example: database_id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
```

### 2. Update Configuration

Edit `wrangler.toml` and replace:
```toml
database_id = "your-database-id-here"
```
With your actual database ID.

### 3. Apply Database Schema

```bash
# Create all tables
wrangler d1 execute sport-community-db --file=./schema.sql
```

### 4. Create Admin Account

**Generate password hash:**
```bash
node generate-password-hash.js "your-admin-password"
```

**Edit `setup-d1-admin.sql`** and replace:
- `admin@yourdomain.com` → Your email
- `$2b$10$example.hash.here` → The generated hash

**Create admin:**
```bash
wrangler d1 execute sport-community-db --file=./setup-d1-admin.sql
```

### 5. Start Development

```bash
# Start the worker
npm run worker:dev

# In another terminal, start the frontend
npm run dev
```

## 🔐 Admin Login Details

**URL**: `http://localhost:5173/login` (or your domain)
**Email**: The email you set in step 4
**Password**: The password you used to generate the hash
**Admin Panel**: `http://localhost:5173/admin`

## ✅ Verify Setup

### Test Database Connection

```bash
# List tables
wrangler d1 execute sport-community-db --command="SELECT name FROM sqlite_master WHERE type='table';"

# Check admin account
wrangler d1 execute sport-community-db --command="SELECT * FROM admin_roles;"
```

### Test API Endpoints

```bash
# Test worker is running
curl http://localhost:8787/api/admin/club-applications/stats

# Should return: {"success":false,"error":"Authentication required"}
# This means the API is working and security is active!
```

### Test Frontend Login

1. Go to `http://localhost:5173/login`
2. Enter your admin credentials
3. Should redirect to `/profile`
4. Navigate to `/admin` - should show admin panel

## 🛡️ Security Features Active

All security measures are implemented and active:

- ✅ **CSRF Protection** - Tokens generated and validated
- ✅ **Session Management** - 30-minute timeout with activity tracking  
- ✅ **Rate Limiting** - Admin actions limited (50 approvals/min, etc.)
- ✅ **Input Validation** - All inputs sanitized and validated
- ✅ **Email Security** - Template validation and sanitization
- ✅ **Admin Logging** - All admin actions logged for audit

## 📊 Database Schema

The D1 database includes these main tables:

- `users` - User accounts and authentication
- `admin_roles` - Admin permissions
- `clubs` - Club applications and data
- `volunteer_opportunities` - Volunteer positions
- `volunteer_profiles` - Volunteer user profiles
- `volunteer_applications` - Applications to volunteer positions
- `messages` - Internal messaging
- `club_application_history` - Audit trail for admin actions
- `user_sessions` - Active user sessions

## 🔧 Development Commands

```bash
# Database operations
npm run db:create          # Create D1 database
npm run db:migrate:local   # Apply schema locally
npm run db:migrate         # Apply schema to production

# Development
npm run worker:dev         # Start worker (port 8787)
npm run dev               # Start frontend (port 5173)

# Deployment
npm run worker:deploy     # Deploy worker
npm run pages:deploy      # Deploy frontend
```

## 🐛 Troubleshooting

### "Database not initialized" error
```bash
# Check database exists
wrangler d1 list

# Check wrangler.toml has correct database_id
cat wrangler.toml | grep database_id
```

### "Authentication required" for all endpoints
This is correct! The API requires authentication. Make sure you:
1. Created an admin account
2. Can log in through the frontend
3. Have a valid session token

### Admin panel shows "No permission"
```bash
# Check admin role was created
wrangler d1 execute sport-community-db --command="SELECT * FROM admin_roles WHERE email = 'your-email@domain.com';"
```

### Frontend can't connect to worker
- Worker should run on port 8787
- Frontend should run on port 5173
- Check both are running: `npm run worker:dev` and `npm run dev`

## 🚀 Production Deployment

### 1. Set Environment Variables

```bash
# Set JWT secret
wrangler secret put JWT_SECRET
# Enter a strong random string when prompted

# Set environment
wrangler secret put ENVIRONMENT
# Enter "production" when prompted
```

### 2. Deploy

```bash
# Deploy worker
npm run worker:deploy

# Deploy frontend (if using Cloudflare Pages)
npm run pages:deploy
```

### 3. Create Production Admin

Repeat the admin setup steps but use the production database:

```bash
# Apply schema to production
wrangler d1 execute sport-community-db --file=./schema.sql

# Create production admin
wrangler d1 execute sport-community-db --file=./setup-d1-admin.sql
```

## 📈 What's Working

- ✅ D1 SQLite database with full schema
- ✅ Cloudflare Worker API with all endpoints
- ✅ React frontend with D1 authentication
- ✅ Admin panel with club approval workflow
- ✅ Comprehensive security implementation
- ✅ Rate limiting and CSRF protection
- ✅ Input validation and sanitization
- ✅ Session management with timeout
- ✅ Admin action logging and audit trail

## 🎉 You're Ready!

Your sports community platform is now running entirely on Cloudflare D1 with enterprise-grade security. No Supabase dependencies, no external database services - just pure Cloudflare infrastructure.

**Next Steps:**
1. Test the admin login and club approval workflow
2. Customize the frontend styling and content
3. Add your club data and volunteer opportunities
4. Deploy to production when ready

**Need Help?**
- Check the security tests: `npm test -- --run security.test.ts`
- Review the API endpoints in `src/worker.ts`
- Examine the database schema in `schema.sql`
- Look at the admin components in `src/components/admin/`