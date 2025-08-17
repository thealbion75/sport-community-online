# Cloudflare D1 Migration Guide

This guide covers the migration from Supabase to Cloudflare D1 for the Sports Community Platform.

## 🚀 **Migration Overview**

We're moving from:
- **Database**: PostgreSQL (Supabase) → SQLite (Cloudflare D1)
- **Authentication**: Supabase Auth → Custom JWT Auth
- **Hosting**: Current → Cloudflare Pages + Workers
- **API**: Supabase Client → Cloudflare Workers API

## 📋 **Prerequisites**

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
2. **Wrangler CLI**: Already installed via `npm install`
3. **Domain**: Optional, can use `*.workers.dev` subdomain

## 🛠️ **Setup Steps**

### 1. **Authenticate with Cloudflare**
```bash
npx wrangler login
```

### 2. **Create D1 Database**
```bash
npm run db:create
```
This will output a database ID - copy it to `wrangler.toml`

### 3. **Update wrangler.toml**
Replace `your-database-id-here` with your actual database ID:
```toml
[[d1_databases]]
binding = "DB"
database_name = "sport-community-db"
database_id = "your-actual-database-id"
```

### 4. **Run Database Migration**
```bash
# For local development
npm run db:migrate:local

# For production
npm run db:migrate
```

### 5. **Set Environment Variables**
```bash
# Set JWT secret for production
npx wrangler secret put JWT_SECRET
```

### 6. **Test Worker Locally**
```bash
npm run worker:dev
```

### 7. **Deploy Worker**
```bash
npm run worker:deploy
```

### 8. **Build and Deploy Frontend**
```bash
npm run build
npm run pages:deploy
```

## 🔧 **Configuration**

### **Environment Variables**

Create `.env.local` for development:
```env
VITE_API_URL=http://localhost:8787
```

For production, the API URL will be your worker URL:
```env
VITE_API_URL=https://sport-community-online.your-subdomain.workers.dev
```

### **Database Schema**

The SQLite schema is in `schema.sql` and includes:
- User authentication tables
- Club approval workflow
- All existing platform features
- Proper indexes and triggers

## 📊 **Key Differences from Supabase**

### **Database**
- **Arrays**: PostgreSQL arrays → JSON strings in SQLite
- **UUIDs**: PostgreSQL UUID → TEXT in SQLite
- **Timestamps**: PostgreSQL TIMESTAMPTZ → DATETIME in SQLite

### **Authentication**
- **Sessions**: Supabase sessions → Custom JWT tokens
- **RLS**: Row Level Security → Application-level permissions
- **OAuth**: Supabase OAuth → Custom implementation needed

### **API**
- **Real-time**: Supabase real-time → WebSocket implementation needed
- **Storage**: Supabase Storage → Cloudflare R2 (if needed)
- **Edge Functions**: Supabase Edge Functions → Cloudflare Workers

## 🔄 **Migration Process**

### **Phase 1: Infrastructure** ✅
- [x] D1 database setup
- [x] Worker API endpoints
- [x] Authentication system
- [x] Admin club approval functions

### **Phase 2: Service Migration** (Next)
- [ ] Migrate clubs service
- [ ] Migrate volunteers service  
- [ ] Migrate opportunities service
- [ ] Migrate applications service
- [ ] Migrate messages service

### **Phase 3: Frontend Updates** (Next)
- [ ] Update service imports
- [ ] Replace Supabase client calls
- [ ] Update authentication flow
- [ ] Test all functionality

### **Phase 4: Deployment** (Final)
- [ ] Production database setup
- [ ] Environment configuration
- [ ] DNS configuration
- [ ] Performance testing

## 🧪 **Testing**

The admin club approval functions have been migrated and tested:
- ✅ `getPendingClubApplications()`
- ✅ `getClubApplicationById()`
- ✅ `approveClubApplication()`
- ✅ `rejectClubApplication()`
- ✅ `getApplicationHistory()`
- ✅ `bulkApproveApplications()`
- ✅ `getClubApplicationStats()`

## 💰 **Cloudflare Free Tier Limits**

- **D1**: 5GB storage, 25M row reads/month, 50K row writes/month
- **Workers**: 100K requests/day
- **Pages**: Unlimited static requests
- **R2**: 10GB storage, 1M Class A operations/month

## 🚨 **Important Notes**

1. **Data Migration**: You'll need to export data from Supabase and import to D1
2. **Authentication**: Users will need to re-register (or implement migration)
3. **Real-time Features**: Will need custom WebSocket implementation
4. **File Uploads**: Will need Cloudflare R2 integration

## 📞 **Next Steps**

1. Complete the setup steps above
2. Test the admin club approval functionality
3. Migrate remaining services one by one
4. Update frontend to use new API endpoints
5. Deploy to production

The foundation is now in place for a fully Cloudflare-based architecture!