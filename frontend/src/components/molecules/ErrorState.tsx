import * as React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
  variant?: 'default' | 'destructive';
}

/**
 * ErrorState - Molecular component for error scenarios
 * 
 * Displays error messages with optional retry functionality.
 * Uses Alert component for consistent error presentation.
 * 
 * @example
 * ```tsx
 * <ErrorState
 *   title="Failed to load data"
 *   message="Unable to connect to the server. Please check your connection."
 *   onRetry={() => refetch()}
 *   variant="destructive"
 * />
 * ```
 */
export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Error',
  message,
  onRetry,
  className,
  variant = 'destructive',
}) => {
  return (
    <div
      className={cn('flex flex-col items-center justify-center py-8 px-4', className)}
      role="alert"
      aria-live="assertive"
    >
      <Alert variant={variant} className="max-w-2xl">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription className="mt-2">
          {message}
        </AlertDescription>
        
        {onRetry && (
          <div className="mt-4">
            <Button
              onClick={onRetry}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </div>
        )}
      </Alert>
    </div>
  );
};

ErrorState.displayName = 'ErrorState';
