# D1-Only Admin Setup Guide

## Overview

This guide explains how to set up admin access using **Cloudflare D1 database only** (no Supabase) for the sports community platform.

## Database Architecture

The platform uses **Cloudflare D1 (SQLite)** for all data storage and authentication.

## Admin Account Setup

**Step 1: Set up Cloudflare D1 database**

```bash
# Create the D1 database
wrangler d1 create sport-community-db

# This will output a database ID - copy it!
# Example output:
# database_id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
```

**Step 2: Update wrangler.toml**

Replace `"your-database-id-here"` in `wrangler.toml` with your actual database ID.

**Step 3: Apply database schema**

```bash
# Apply the D1 schema
wrangler d1 execute sport-community-db --file=./schema.sql
```

**Step 4: Create your admin account**

Edit `setup-d1-admin.sql` and replace the placeholder values:

```sql
-- Change these values:
'admin@yourdomain.com'  -- Your actual email
'$2b$10$example.hash.here'  -- A proper bcrypt hash of your password
```

Then run:

```bash
# Create admin account
wrangler d1 execute sport-community-db --file=./setup-d1-admin.sql
```

**Step 5: Generate password hash**

You'll need to generate a bcrypt hash for your password. You can use:

```bash
# Using Node.js (if you have bcrypt installed)
node -e "console.log(require('bcrypt').hashSync('your-password', 10))"

# Or use an online bcrypt generator (search "bcrypt generator")
```

## Database Connection Verification

### Cloudflare D1 Setup

**1. Check Wrangler Configuration**

Your `wrangler.toml` file shows:
```toml
[[d1_databases]]
binding = "DB"
database_name = "sport-community-db"
database_id = "your-database-id-here"  # ⚠️ NEEDS TO BE UPDATED
```

**2. Create D1 Database**

```bash
# Create the database
npm run db:create

# This will output a database ID like:
# database_id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
```

**3. Update wrangler.toml**

Replace `"your-database-id-here"` with the actual database ID from step 2.

**4. Run Database Migration**

```bash
# For local development
npm run db:migrate:local

# For production
npm run db:migrate
```

**5. Verify Connection**

```bash
# Start local development server
npm run worker:dev

# Test the worker endpoint
curl http://localhost:8787/api/admin/club-applications/stats
```

### Connection Status Check

**To verify D1 is connected**:

1. **Check the worker logs** when starting:
   ```bash
   npm run worker:dev
   ```
   
2. **Look for database initialization** in the logs

3. **Test an API endpoint**:
   ```bash
   # Should return authentication error (not database error)
   curl http://localhost:8787/api/admin/club-applications
   ```

4. **Check database tables**:
   ```bash
   # List tables in your D1 database
   wrangler d1 execute sport-community-db --command="SELECT name FROM sqlite_master WHERE type='table';"
   ```

## Security Implementation Status

### ✅ Implemented Security Features

1. **CSRF Protection**
   - Token generation and validation
   - Automatic token refresh
   - Header and form integration

2. **Session Management**
   - 30-minute timeout
   - Activity tracking
   - Automatic cleanup

3. **Rate Limiting**
   - Admin action limits:
     - Approvals: 50/minute
     - Rejections: 30/minute
     - Bulk operations: 5/minute
     - Views: 200/minute

4. **Input Validation**
   - XSS prevention
   - SQL injection protection
   - Email/URL validation
   - UUID format validation

5. **Email Security**
   - Template validation
   - Variable sanitization
   - Content filtering

### 🔐 Admin Action Logging

All admin actions are logged with:
- Admin user ID
- Action type (approve, reject, bulk_approve)
- Timestamp
- Action details
- Success/failure status

**View logs** (client-side for now):
```javascript
// In browser console
const logs = JSON.parse(sessionStorage.getItem('admin_action_logs') || '[]');
console.log('Admin Actions:', logs);
```

## Environment Variables

**Required for production**:

```bash
# In your Cloudflare Worker environment
JWT_SECRET=your-super-secret-jwt-key-here
ENVIRONMENT=production
```

**Set via Wrangler**:
```bash
wrangler secret put JWT_SECRET
# Enter your secret when prompted
```

## Testing the Setup

### 1. Test Database Connection

```bash
# Check if D1 database exists
wrangler d1 list

# Test query
wrangler d1 execute sport-community-db --command="SELECT COUNT(*) as table_count FROM sqlite_master WHERE type='table';"
```

### 2. Test Admin Authentication

```bash
# Start the worker
npm run worker:dev

# Test admin endpoint (should require auth)
curl -X GET http://localhost:8787/api/admin/club-applications/stats
# Expected: {"success":false,"error":"Authentication required"}
```

### 3. Test Security Features

```bash
# Run security tests
npm test -- --run security.test.ts
# Expected: All 27 tests should pass ✅
```

## Troubleshooting

### Common Issues

**1. "Database not initialized" error**
- Check that `wrangler.toml` has correct database_id
- Ensure D1 database was created: `wrangler d1 list`
- Verify schema was applied: `npm run db:migrate:local`

**2. "Authentication required" for admin endpoints**
- This is expected behavior - you need to implement login flow
- Admin endpoints require valid JWT token
- Use the frontend login form to authenticate

**3. CSRF token errors**
- Ensure security initialization in App.tsx
- Check browser console for CSRF token generation
- Verify sessionStorage contains 'csrf_token'

**4. Rate limiting issues**
- Check browser console for rate limit messages
- Wait for rate limit window to reset (1 minute)
- Different actions have different limits

### Debug Commands

```bash
# Check D1 database status
wrangler d1 info sport-community-db

# View database schema
wrangler d1 execute sport-community-db --command=".schema"

# Check admin roles table
wrangler d1 execute sport-community-db --command="SELECT * FROM admin_roles;"

# View recent logs
wrangler tail
```

## Next Steps

1. **Create your admin account** using one of the methods above
2. **Update database IDs** in wrangler.toml
3. **Run database migrations** to set up tables
4. **Test the admin login flow** through the frontend
5. **Verify security features** are working
6. **Set up production environment variables**

## Production Deployment

```bash
# Deploy the worker
npm run worker:deploy

# Deploy the frontend
npm run pages:deploy

# Set production environment variables
wrangler secret put JWT_SECRET
```

## Support

If you encounter issues:

1. Check the `SECURITY_IMPLEMENTATION.md` for detailed security documentation
2. Review the test suite in `src/__tests__/security.test.ts`
3. Examine the worker logs: `wrangler tail`
4. Verify database connection: `wrangler d1 list`

**Current Status**: 
- ✅ Security implementation complete
- ✅ D1 schema ready
- ⚠️ Admin account needs manual setup
- ⚠️ Database ID needs configuration