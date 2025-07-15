/**
 * Form Validation Hook
 * Provides comprehensive form validation with React Hook Form integration
 */

import * as React from 'react';
import { useForm, UseFormProps, FieldValues, Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCallback } from 'react';
import { sanitizeObject } from '@/lib/sanitization';
import { useFormErrorHandler } from './use-error-handling';

interface UseValidatedFormProps<TFormValues extends FieldValues> extends UseFormProps<TFormValues> {
  schema: z.ZodType<any, any>;
  sanitizeOnSubmit?: boolean;
  onSubmit: (data: TFormValues) => Promise<void> | void;
  onError?: (error: unknown) => void;
}

export function useValidatedForm<TFormValues extends FieldValues>({
  schema,
  sanitizeOnSubmit = true,
  onSubmit,
  onError,
  ...formOptions
}: UseValidatedFormProps<TFormValues>) {
  const { handleFormError } = useFormErrorHandler();
  
  const form = useForm<TFormValues>({
    ...formOptions,
    resolver: zodResolver(schema),
  });

  const handleSubmit = useCallback(async (data: TFormValues) => {
    try {
      // Sanitize data before submission if enabled
      const processedData = sanitizeOnSubmit ? sanitizeObject(data) : data;
      
      await onSubmit(processedData);
    } catch (error) {
      const appError = handleFormError(error, form.setError);
      
      if (onError) {
        onError(appError);
      }
    }
  }, [onSubmit, sanitizeOnSubmit, handleFormError, form.setError, onError]);

  return {
    ...form,
    handleSubmit: form.handleSubmit(handleSubmit),
  };
}

// Hook for field-level validation
export function useFieldValidation<TFormValues extends FieldValues>(
  form: ReturnType<typeof useForm<TFormValues>>,
  fieldName: Path<TFormValues>
) {
  const fieldError = form.formState.errors[fieldName];
  const fieldValue = form.watch(fieldName);
  
  const validateField = useCallback(async (value: any) => {
    try {
      await form.trigger(fieldName);
      return true;
    } catch {
      return false;
    }
  }, [form, fieldName]);

  return {
    error: fieldError,
    value: fieldValue,
    isValid: !fieldError,
    isDirty: form.formState.dirtyFields[fieldName],
    isTouched: form.formState.touchedFields[fieldName],
    validate: validateField,
  };
}

// Hook for async validation (e.g., checking if email exists)
export function useAsyncValidation<T>(
  validationFn: (value: T) => Promise<boolean>,
  debounceMs: number = 500
) {
  const [isValidating, setIsValidating] = React.useState(false);
  const [isValid, setIsValid] = React.useState<boolean | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const validate = useCallback(
    debounce(async (value: T) => {
      if (!value) {
        setIsValid(null);
        setError(null);
        return;
      }

      setIsValidating(true);
      setError(null);

      try {
        const result = await validationFn(value);
        setIsValid(result);
        if (!result) {
          setError('Validation failed');
        }
      } catch (err) {
        setIsValid(false);
        setError(err instanceof Error ? err.message : 'Validation error');
      } finally {
        setIsValidating(false);
      }
    }, debounceMs),
    [validationFn, debounceMs]
  );

  return {
    validate,
    isValidating,
    isValid,
    error,
  };
}

// Debounce utility
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

