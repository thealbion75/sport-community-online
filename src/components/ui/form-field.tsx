import * as React from "react"
import { cn } from "@/lib/utils"
import { Label } from "./label"
import { Input, InputProps } from "./input"

export interface FormFieldProps extends Omit<InputProps, 'id'> {
  label?: string
  helpText?: string
  errorMessage?: string
  successMessage?: string
  required?: boolean
  id?: string
}

const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({ 
    label, 
    helpText, 
    errorMessage, 
    successMessage, 
    required, 
    className,
    id,
    error,
    success,
    ...props 
  }, ref) => {
    const fieldId = id || React.useId()
    const helpTextId = helpText ? `${fieldId}-help` : undefined
    const errorId = errorMessage ? `${fieldId}-error` : undefined
    const successId = successMessage ? `${fieldId}-success` : undefined
    
    const hasError = error || !!errorMessage
    const hasSuccess = success || !!successMessage
    
    return (
      <div className={cn("space-y-2", className)}>
        {label && (
          <Label 
            htmlFor={fieldId}
            variant={hasError ? "error" : hasSuccess ? "success" : "default"}
            className="egsport-label"
          >
            {label}
            {required && <span className="text-error ml-1" aria-label="required">*</span>}
          </Label>
        )}
        
        <Input
          id={fieldId}
          ref={ref}
          error={hasError}
          success={hasSuccess}
          className="egsport-input"
          aria-describedby={cn(
            helpTextId,
            errorId,
            successId
          )}
          aria-invalid={hasError}
          aria-required={required}
          {...props}
        />
        
        {helpText && !hasError && !hasSuccess && (
          <p id={helpTextId} className="text-sm text-muted-foreground">
            {helpText}
          </p>
        )}
        
        {errorMessage && (
          <p 
            id={errorId} 
            className="text-sm text-error flex items-center gap-1"
            role="alert"
            aria-live="polite"
          >
            <svg 
              className="h-4 w-4 flex-shrink-0" 
              fill="currentColor" 
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path 
                fillRule="evenodd" 
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
                clipRule="evenodd" 
              />
            </svg>
            {errorMessage}
          </p>
        )}
        
        {successMessage && (
          <p 
            id={successId} 
            className="text-sm text-success flex items-center gap-1"
            role="status"
            aria-live="polite"
          >
            <svg 
              className="h-4 w-4 flex-shrink-0" 
              fill="currentColor" 
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path 
                fillRule="evenodd" 
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                clipRule="evenodd" 
              />
            </svg>
            {successMessage}
          </p>
        )}
      </div>
    )
  }
)

FormField.displayName = "FormField"

export { FormField }