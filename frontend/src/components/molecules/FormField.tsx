import * as React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface FormFieldProps extends React.ComponentProps<'input'> {
  label: string;
  name: string;
  error?: string;
  touched?: boolean;
  helperText?: string;
  containerClassName?: string;
}

/**
 * FormField - Molecular component combining Label + Input + Error
 * 
 * A complete form field with label, input, error message, and helper text.
 * Handles validation states and accessibility.
 * 
 * @example
 * ```tsx
 * <FormField
 *   label="Email"
 *   name="email"
 *   type="email"
 *   error="Invalid email address"
 *   touched={true}
 *   required
 * />
 * ```
 */
export const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  (
    {
      label,
      name,
      error,
      touched,
      helperText,
      containerClassName,
      className,
      required,
      ...props
    },
    ref
  ) => {
    const hasError = touched && error;
    const inputId = `field-${name}`;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    return (
      <div className={cn('space-y-2', containerClassName)}>
        <Label htmlFor={inputId} className="flex items-center gap-1">
          {label}
          {required && <span className="text-destructive">*</span>}
        </Label>
        
        <Input
          ref={ref}
          id={inputId}
          name={name}
          className={cn(
            hasError && 'border-destructive focus-visible:ring-destructive',
            className
          )}
          aria-invalid={hasError ? 'true' : 'false'}
          aria-describedby={
            hasError ? errorId : helperText ? helperId : undefined
          }
          required={required}
          {...props}
        />
        
        {hasError && (
          <p
            id={errorId}
            className="text-sm font-medium text-destructive"
            role="alert"
          >
            {error}
          </p>
        )}
        
        {!hasError && helperText && (
          <p
            id={helperId}
            className="text-sm text-muted-foreground"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = 'FormField';
