/**
 * Test Runner for Club Approval System
 * Comprehensive test suite runner with categorized test execution
 */

import { describe, it } from 'vitest';

// Import all test suites
import './unit/admin-club-approval-api.test';
import './unit/club-approval-hooks.test';
import './components/ClubApprovalDashboard.test';
import './components/ClubApplicationReview.test';
import './integration/club-approval-workflow.test';
import './e2e/admin-club-approval.test';
import './performance/club-approval-performance.test';

describe('Club Approval System Test Suite', () => {
  it('should run all test categories', () => {
    // This is a placeholder test to ensure the test runner loads all suites
    expect(true).toBe(true);
  });
});

export default {
  // Test categories for selective running
  categories: {
    unit: [
      'unit/admin-club-approval-api.test.ts',
      'unit/club-approval-hooks.test.ts'
    ],
    components: [
      'components/ClubApprovalDashboard.test.tsx',
      'components/ClubApplicationReview.test.tsx'
    ],
    integration: [
      'integration/club-approval-workflow.test.tsx'
    ],
    e2e: [
      'e2e/admin-club-approval.test.tsx'
    ],
    performance: [
      'performance/club-approval-performance.test.ts'
    ]
  }
};