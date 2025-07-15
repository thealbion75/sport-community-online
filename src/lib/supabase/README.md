# Data Access Layer

This directory contains the complete data access layer for the volunteer sports platform. It provides a clean, type-safe interface between the application and the Supabase database.

## Architecture

The data access layer is organized into several modules:

- **clubs.ts** - Club management operations
- **volunteers.ts** - Volunteer profile operations  
- **opportunities.ts** - Volunteer opportunity operations
- **applications.ts** - Application management operations
- **messages.ts** - Internal messaging operations
- **auth.ts** - Authentication and user management

## Features

### Type Safety
- Full TypeScript integration with Supabase types
- Consistent API response format with `ApiResponse<T>`
- Input validation and sanitization

### Error Handling
- Centralized error handling with `handleSupabaseError`
- Consistent error messages and types
- Graceful fallbacks for common scenarios

### Security
- Input sanitization for all user data
- Row Level Security (RLS) policy integration
- Authentication state management

### Performance
- Optimized queries with selective field loading
- Pagination support for large datasets
- Efficient filtering and searching

## Usage Examples

### Basic CRUD Operations

```typescript
import { createClub, getClubById, updateClub } from '@/lib/supabase/clubs';

// Create a new club
const result = await createClub({
  name: 'East Grinstead FC',
  location: 'East Grinstead',
  contact_email: 'contact@egfc.com',
  sport_types: ['football'],
});

if (result.success) {
  console.log('Club created:', result.data);
} else {
  console.error('Error:', result.error);
}

// Fetch club by ID
const club = await getClubById('club-id');

// Update club
const updated = await updateClub('club-id', {
  description: 'Updated description',
});
```

### Search and Filtering

```typescript
import { searchVolunteers, getOpportunities } from '@/lib/supabase';

// Search volunteers with filters
const volunteers = await searchVolunteers({
  location: 'East Grinstead',
  skills: ['JavaScript', 'React'],
  availability: ['Weekends'],
  limit: 20,
});

// Get opportunities with filters
const opportunities = await getOpportunities({
  sport_types: ['football'],
  time_commitment: 'part-time',
  is_recurring: true,
});
```

### Authentication

```typescript
import { signIn, getCurrentUser, getUserRole } from '@/lib/supabase/auth';

// Sign in user
const authResult = await signIn('user@example.com', 'password');

// Get current user
const user = await getCurrentUser();

// Check user role
const role = await getUserRole();
```

## React Query Integration

The data access layer is designed to work seamlessly with React Query hooks:

```typescript
import { useClubs, useCreateClub } from '@/hooks/use-clubs';

function ClubList() {
  const { data: clubs, isLoading } = useClubs({ verified: true });
  const createClubMutation = useCreateClub();

  const handleCreateClub = (clubData) => {
    createClubMutation.mutate(clubData);
  };

  // Component implementation...
}
```

## API Response Format

All data access functions return a consistent `ApiResponse<T>` format:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

This allows for consistent error handling across the application:

```typescript
const result = await someDataFunction();

if (result.success) {
  // Handle success case
  console.log(result.data);
} else {
  // Handle error case
  console.error(result.error);
}
```

## Database Schema

The data access layer works with the following main tables:

### clubs
- Club information and verification status
- Contact details and sport types
- Location and website information

### volunteer_profiles
- Volunteer personal information
- Skills and availability
- Privacy settings

### volunteer_opportunities
- Opportunity details and requirements
- Time commitment and location
- Status tracking (active/filled/cancelled)

### volunteer_applications
- Application submissions
- Status tracking (pending/accepted/rejected/withdrawn)
- Messages and timestamps

### messages
- Internal messaging system
- Read status tracking
- Conversation threading

## Security Considerations

### Row Level Security (RLS)
The data access layer respects Supabase RLS policies:

- Volunteers can only see their own profile data
- Clubs can only manage their own opportunities
- Messages are only visible to sender and recipient
- Admin functions require proper permissions

### Input Sanitization
All user input is sanitized before database operations:

```typescript
const sanitizedData = sanitizeObject(inputData);
const result = await supabase.from('table').insert(sanitizedData);
```

### Authentication Checks
Functions that require authentication automatically check user status:

```typescript
const { data: { user } } = await supabase.auth.getUser();
if (!user) throw new Error('User not authenticated');
```

## Error Handling

The layer includes comprehensive error handling:

### Supabase-Specific Errors
```typescript
export function handleSupabaseError(error: any): AppError {
  if (error?.code) {
    switch (error.code) {
      case 'PGRST116':
        return new AppError('No data found', 'NOT_FOUND');
      case '23505':
        return new AppError('This record already exists', 'VALIDATION');
      // ... more cases
    }
  }
  return handleApiError(error);
}
```

### Network and Connection Errors
- Automatic retry logic for transient failures
- Graceful degradation for offline scenarios
- Clear error messages for users

## Testing

The data access layer includes comprehensive tests:

```bash
# Run data access tests
npm test src/lib/supabase/__tests__/

# Run specific test file
npm test data-access.test.ts
```

Tests cover:
- Successful operations
- Error scenarios
- Authentication flows
- Data validation
- Edge cases

## Performance Optimization

### Query Optimization
- Selective field loading with `select()`
- Efficient joins with related data
- Proper indexing on filtered columns

### Caching Strategy
- React Query integration for client-side caching
- Appropriate stale times for different data types
- Cache invalidation on mutations

### Pagination
```typescript
const result = await getOpportunities({
  limit: 20,
  offset: 0,
});
```

## Best Practices

1. **Always handle errors**: Check `result.success` before using data
2. **Use TypeScript**: Leverage type safety for better development experience
3. **Sanitize inputs**: All user data should be sanitized
4. **Respect RLS**: Don't try to bypass security policies
5. **Use pagination**: For large datasets, always implement pagination
6. **Cache appropriately**: Use React Query hooks for optimal caching
7. **Test thoroughly**: Write tests for both success and error cases

## Migration and Updates

When updating the database schema:

1. Update Supabase migration files
2. Regenerate TypeScript types
3. Update data access functions
4. Update React Query hooks
5. Run tests to ensure compatibility
6. Update documentation

## Monitoring and Debugging

### Logging
All operations are logged for debugging:

```typescript
console.error('Error:', appError);
// In production, send to error tracking service
```

### Performance Monitoring
- Query execution times
- Error rates by operation
- Cache hit/miss ratios

### Health Checks
- Database connection status
- Authentication service availability
- API response times