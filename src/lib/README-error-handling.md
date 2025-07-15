# Error Handling System

This directory contains a comprehensive error handling system for the volunteer sports platform. The system provides consistent error handling, validation, sanitization, and user feedback across the entire application.

## Components

### Core Error Handling

#### `error-handling.ts`
- **AppError Class**: Custom error class with type categorization
- **handleApiError**: Centralized API error processing
- **useErrorToast**: Hook for displaying error notifications
- **Error Types**: Categorized error types (VALIDATION, AUTHENTICATION, etc.)

#### `global-error-handler.ts`
- **setupGlobalErrorHandlers**: Sets up global error listeners
- **reportError**: Error reporting functionality (ready for services like Sentry)
- **withErrorRecovery**: Higher-order function for error recovery
- **withAsyncErrorRecovery**: Async version of error recovery

### Form Validation

#### `validation.ts`
- **Zod Schemas**: Comprehensive validation schemas for all forms
- **Common Validation Patterns**: Reusable validation rules
- **validateForm**: Utility function for form validation
- **Validation Messages**: Centralized error messages

#### `use-form-validation.ts`
- **useValidatedForm**: Enhanced React Hook Form integration
- **useFieldValidation**: Field-level validation utilities
- **useAsyncValidation**: Async validation with debouncing

### Input Sanitization

#### `sanitization.ts`
- **sanitizeUserInput**: General purpose input sanitization
- **sanitizeHtml**: HTML content sanitization (XSS prevention)
- **sanitizeEmail**: Email address sanitization
- **sanitizeUrl**: URL sanitization
- **sanitizeObject**: Recursive object sanitization

### React Query Integration

#### `react-query-error-handler.ts`
- **createQueryClient**: Pre-configured QueryClient with error handling
- **defaultQueryErrorHandler**: Default error handler for queries
- **useQueryErrorHandler**: Hook for query error handling
- **useMutationErrorHandler**: Hook for mutation error handling
- **handleSupabaseError**: Supabase-specific error handling

### UI Components

#### `error-boundary.tsx`
- **ErrorBoundary**: React error boundary component
- **withErrorBoundary**: HOC for wrapping components

#### `form-error.tsx`
- **FormError**: Individual form error display
- **FormFieldError**: Field-specific error display
- **FormSubmitError**: Form submission error display

#### `loading-state.tsx`
- **LoadingSpinner**: Consistent loading indicators
- **LoadingContainer**: Container with loading states
- **Skeleton**: Skeleton loading components

#### `form-wrapper.tsx`
- **FormWrapper**: Complete form wrapper with validation
- **FormField**: Standardized form field component

### Toast Notifications

#### `toast.tsx` & `toaster.tsx`
- **Toast Components**: Radix UI-based toast notifications
- **Toast Variants**: Different toast types (success, error, warning, info)

#### `use-toast.ts`
- **useToast**: Hook for displaying toast notifications
- **Toast Management**: Toast state management and queuing

### Error Handling Hooks

#### `use-error-handling.ts`
- **useApiErrorHandler**: API error handling with toasts
- **useFormErrorHandler**: Form-specific error handling
- **useAsyncOperation**: Async operation wrapper with error handling
- **useRetry**: Retry logic with exponential backoff
- **useNetworkStatus**: Network connectivity monitoring

## Usage Examples

### Basic Form with Validation

```typescript
import { useValidatedForm } from '@/hooks/use-form-validation';
import { volunteerSchemas } from '@/lib/validation';

function VolunteerRegistrationForm() {
  const form = useValidatedForm({
    schema: volunteerSchemas.registration,
    onSubmit: async (data) => {
      // Form submission logic
      await createVolunteerProfile(data);
    },
  });

  return (
    <form onSubmit={form.handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

### API Error Handling

```typescript
import { useApiErrorHandler } from '@/hooks/use-error-handling';

function DataComponent() {
  const { handleError } = useApiErrorHandler();

  const fetchData = async () => {
    try {
      const data = await api.getData();
      return data;
    } catch (error) {
      handleError(error, 'Failed to load data');
    }
  };
}
```

### React Query with Error Handling

```typescript
import { useQuery } from '@tanstack/react-query';
import { useQueryErrorHandler } from '@/lib/react-query-error-handler';

function DataComponent() {
  const { onError } = useQueryErrorHandler();

  const { data, isLoading, error } = useQuery({
    queryKey: ['data'],
    queryFn: fetchData,
    onError,
  });
}
```

### Input Sanitization

```typescript
import { sanitizeUserInput } from '@/lib/sanitization';

function handleUserInput(input: string) {
  const sanitized = sanitizeUserInput(input, {
    allowHtml: false,
    maxLength: 1000,
    removeNewlines: true,
  });
  
  // Use sanitized input
}
```

### Error Boundary Usage

```typescript
import { ErrorBoundary } from '@/components/ui/error-boundary';

function App() {
  return (
    <ErrorBoundary>
      <MyComponent />
    </ErrorBoundary>
  );
}
```

## Configuration

### Global Setup

Add to your main App component:

```typescript
import { setupGlobalErrorHandlers } from '@/lib/global-error-handler';
import { createQueryClient } from '@/lib/react-query-error-handler';

const queryClient = createQueryClient();

function App() {
  useEffect(() => {
    setupGlobalErrorHandlers();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        {/* Your app */}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
```

### Environment Variables

```env
# Enable error reporting in development
REPORT_DEV_ERRORS=true

# Error tracking service configuration (production)
SENTRY_DSN=your_sentry_dsn
```

## Error Types

The system categorizes errors into the following types:

- **VALIDATION**: Form validation errors
- **AUTHENTICATION**: Login/auth errors
- **AUTHORIZATION**: Permission errors
- **NOT_FOUND**: Resource not found
- **SERVER**: Server-side errors
- **NETWORK**: Network connectivity issues
- **UNKNOWN**: Uncategorized errors

## Best Practices

1. **Always use validation schemas** for forms
2. **Sanitize user input** before processing
3. **Use error boundaries** for component error handling
4. **Provide meaningful error messages** to users
5. **Log errors** for debugging and monitoring
6. **Handle network errors** gracefully
7. **Use loading states** for better UX
8. **Test error scenarios** thoroughly

## Testing

The system includes comprehensive tests in `__tests__/error-handling.test.ts`. Run tests with:

```bash
npm run test
```

## Integration with External Services

The error handling system is designed to integrate with external error tracking services like Sentry, LogRocket, or Bugsnag. Update the `reportError` function in `global-error-handler.ts` to send errors to your preferred service.

## Performance Considerations

- **Debounced validation** for async operations
- **Memoized error handlers** to prevent re-renders
- **Efficient toast management** with limits and timeouts
- **Lazy loading** of error boundary fallbacks