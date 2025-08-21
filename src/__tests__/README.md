# Club Approval System Test Suite

This directory contains a comprehensive testing suite for the admin club approval system, covering all aspects from unit tests to end-to-end workflows and performance testing.

## Test Structure

### Unit Tests (`/unit/`)
- **admin-club-approval-api.test.ts**: Tests for all API service functions with mock data
- **club-approval-hooks.test.ts**: Tests for React Query hooks with comprehensive scenarios

### Component Tests (`/components/`)
- **ClubApprovalDashboard.test.tsx**: Tests for the main dashboard component
- **ClubApplicationReview.test.tsx**: Tests for the application review component

### Integration Tests (`/integration/`)
- **club-approval-workflow.test.tsx**: Tests for complete approval and rejection workflows

### End-to-End Tests (`/e2e/`)
- **admin-club-approval.test.tsx**: Complete user journey tests from login to approval

### Performance Tests (`/performance/`)
- **club-approval-performance.test.ts**: Tests for handling large datasets and performance optimization

## Running Tests

### All Club Approval Tests
```bash
npm run test:club-approval
```

### By Category
```bash
# Unit tests only
npm run test:club-approval:unit

# Component tests only
npm run test:club-approval:components

# Integration tests only
npm run test:club-approval:integration

# End-to-end tests only
npm run test:club-approval:e2e

# Performance tests only
npm run test:club-approval:performance
```

### Individual Test Files
```bash
# Run specific test file
npx vitest run src/__tests__/unit/admin-club-approval-api.test.ts

# Run with watch mode
npx vitest src/__tests__/unit/admin-club-approval-api.test.ts

# Run with UI
npx vitest --ui src/__tests__/components/ClubApprovalDashboard.test.tsx
```

## Test Coverage

The test suite covers:

### API Service Functions (100% coverage target)
- ✅ `getPendingClubApplications` - with filters, pagination, search
- ✅ `getClubApplicationById` - success and error cases
- ✅ `approveClubApplication` - with/without notes, error handling
- ✅ `rejectClubApplication` - validation, sanitization, errors
- ✅ `getApplicationHistory` - empty and populated history
- ✅ `bulkApproveApplications` - success, partial failures, validation
- ✅ `getClubApplicationStats` - statistics fetching and errors

### React Query Hooks (100% coverage target)
- ✅ `usePendingApplications` - filtering, caching, error states
- ✅ `useClubApplication` - data fetching, conditional queries
- ✅ `useApplicationHistory` - history retrieval
- ✅ `useApproveApplication` - mutation handling, optimistic updates
- ✅ `useRejectApplication` - validation, error handling
- ✅ `useBulkApproveApplications` - bulk operations, partial failures
- ✅ `useClubApplicationStats` - statistics queries

### Component Functionality (95% coverage target)
- ✅ Dashboard statistics display and loading states
- ✅ Application list rendering and interactions
- ✅ Application review details and actions
- ✅ Approval/rejection dialogs and forms
- ✅ Navigation between views
- ✅ Error states and recovery
- ✅ Mobile responsiveness

### Workflows (100% coverage target)
- ✅ Complete approval workflow from dashboard to confirmation
- ✅ Complete rejection workflow with proper documentation
- ✅ Bulk operations workflow
- ✅ Search and filtering functionality
- ✅ Error handling and recovery scenarios
- ✅ Navigation state management

### Performance Scenarios
- ✅ Large dataset handling (1000+ applications)
- ✅ Pagination performance
- ✅ Search performance across large datasets
- ✅ Bulk operations with 100+ items
- ✅ Memory usage optimization
- ✅ Concurrent operations handling
- ✅ Network performance and timeouts

## Test Data and Mocks

### Mock Data Generation
The test suite includes utilities for generating realistic test data:
- `generateMockClubs(count)` - Creates specified number of mock club applications
- Realistic email addresses, phone numbers, and descriptions
- Varied application statuses and timestamps
- Multiple sport types and locations

### API Mocking Strategy
- All external API calls are mocked using Vitest's `vi.mock()`
- Consistent mock responses across test files
- Error simulation for edge cases
- Network delay simulation for performance tests

### Component Mocking
- Child components are mocked to isolate testing
- Toast notifications are mocked for interaction testing
- Date formatting is mocked for consistent test results
- Authentication hooks are mocked for admin scenarios

## Performance Benchmarks

### Target Performance Metrics
- Dashboard load time: < 2 seconds
- Application list with 50 items: < 1 second
- Search across 1000+ items: < 1 second
- Bulk approval of 100 items: < 5 seconds
- Memory usage increase: < 50MB for repeated operations

### Performance Test Scenarios
1. **Large Dataset Handling**: Tests with 1000+ applications
2. **Rapid Pagination**: Quick navigation through multiple pages
3. **Search Performance**: Full-text search across large datasets
4. **Bulk Operations**: Processing multiple applications simultaneously
5. **Memory Management**: Detecting memory leaks in repeated operations
6. **Concurrent Operations**: Multiple simultaneous API calls
7. **Network Conditions**: Slow network and timeout handling

## Error Scenarios Tested

### API Errors
- Network connection failures
- Server errors (500, 503)
- Authentication failures (401, 403)
- Not found errors (404)
- Validation errors (400)
- Concurrent modification conflicts

### Component Errors
- Missing or invalid data
- Component rendering failures
- User interaction errors
- Navigation failures
- Form validation errors

### Performance Errors
- Memory leaks
- Timeout errors
- Race conditions
- Resource exhaustion

## Continuous Integration

### Pre-commit Hooks
Tests should be run before commits to ensure code quality:
```bash
# Add to .husky/pre-commit
npm run test:club-approval:unit
npm run test:club-approval:components
```

### CI Pipeline Integration
```yaml
# Example GitHub Actions workflow
- name: Run Club Approval Tests
  run: |
    npm run test:club-approval:unit
    npm run test:club-approval:components
    npm run test:club-approval:integration
    
- name: Run Performance Tests
  run: npm run test:club-approval:performance
  
- name: Generate Coverage Report
  run: npm run test:coverage -- src/__tests__/
```

## Debugging Tests

### Common Issues
1. **Mock not working**: Ensure mock is called before component render
2. **Async test failures**: Use `waitFor` for async operations
3. **Component not found**: Check if component is properly imported and rendered
4. **API mock not called**: Verify mock implementation matches actual API calls

### Debug Commands
```bash
# Run with verbose output
npx vitest run --reporter=verbose src/__tests__/unit/admin-club-approval-api.test.ts

# Run single test with debugging
npx vitest run --reporter=verbose -t "should approve application successfully"

# Run with coverage to see what's not tested
npx vitest run --coverage src/__tests__/components/
```

## Contributing

When adding new tests:

1. **Follow naming conventions**: `describe` blocks should match component/function names
2. **Use descriptive test names**: Tests should clearly state what they're testing
3. **Mock external dependencies**: Don't make real API calls in tests
4. **Test error cases**: Include both success and failure scenarios
5. **Add performance considerations**: Consider impact on large datasets
6. **Update documentation**: Add new test scenarios to this README

### Test Template
```typescript
describe('ComponentName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Setup common mocks
  });

  it('should handle success case', async () => {
    // Arrange
    // Act
    // Assert
  });

  it('should handle error case', async () => {
    // Arrange
    // Act
    // Assert
  });
});
```

## Requirements Coverage

This test suite fulfills the requirements specified in task 13:

- ✅ **Unit tests for all API service functions with mock data**
- ✅ **Component tests for all admin approval components**
- ✅ **Integration tests for approval and rejection workflows**
- ✅ **End-to-end tests for complete admin approval process**
- ✅ **Performance tests for handling large numbers of applications**

All tests are designed to ensure the club approval system is robust, performant, and user-friendly across all scenarios and edge cases.