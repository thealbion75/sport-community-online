/**
 * Hooks Index
 * Centralized exports for all custom hooks
 */

// Data fetching hooks
export * from './use-clubs';
export * from './use-volunteers';
export * from './use-opportunities';
export * from './use-applications';
export * from './use-messages';
export * from './use-auth';
export * from './use-club-approval';

// Utility hooks
export * from './use-toast';
export * from './use-error-handling';
export * from './use-form-validation';

// Re-export commonly used React Query hooks
export { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';