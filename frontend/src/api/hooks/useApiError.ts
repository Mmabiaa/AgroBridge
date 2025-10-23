/**
 * React hook for handling API errors in components
 */
import { useCallback, useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { ApiError, defaultErrorHandler } from '../errorHandler';
import { notificationService } from '../notificationService';

export interface UseApiErrorOptions {
  showNotifications?: boolean;
  logErrors?: boolean;
  onError?: (error: ApiError) => void;
  customErrorMessages?: Record<number, string>;
}

export interface UseApiErrorReturn {
  error: ApiError | null;
  isError: boolean;
  clearError: () => void;
  handleError: (error: AxiosError | ApiError) => void;
  setError: (error: ApiError | null) => void;
}

/**
 * Hook for handling API errors in React components
 */
export const useApiError = (options: UseApiErrorOptions = {}): UseApiErrorReturn => {
  const [error, setError] = useState<ApiError | null>(null);

  const {
    showNotifications = true,
    logErrors = process.env.NODE_ENV === 'development',
    onError,
    customErrorMessages = {},
  } = options;

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleError = useCallback((error: AxiosError | ApiError) => {
    let apiError: ApiError;

    // Convert AxiosError to ApiError if needed
    if ('isAxiosError' in error) {
      apiError = defaultErrorHandler.handleError(error as AxiosError);
    } else {
      apiError = error as ApiError;
    }

    // Apply custom error message if available
    if (customErrorMessages[apiError.status]) {
      apiError = {
        ...apiError,
        message: customErrorMessages[apiError.status],
      };
    }

    // Set error state
    setError(apiError);

    // Log error if enabled
    if (logErrors) {
      console.error('Component API Error:', apiError);
    }

    // Show notification if enabled
    if (showNotifications) {
      notificationService.error('Error', apiError.message, undefined, apiError.requestId);
    }

    // Call custom error handler if provided
    if (onError) {
      onError(apiError);
    }
  }, [showNotifications, logErrors, onError, customErrorMessages]);

  return {
    error,
    isError: error !== null,
    clearError,
    handleError,
    setError,
  };
};

/**
 * Hook for handling specific API error types
 */
export const useApiErrorTypes = () => {
  const handleNetworkError = useCallback(() => {
    notificationService.error(
      'Network Error',
      'Please check your internet connection and try again.',
      8000
    );
  }, []);

  const handleServerError = useCallback(() => {
    notificationService.error(
      'Server Error',
      'The server is experiencing issues. Please try again later.',
      8000
    );
  }, []);

  const handleAuthError = useCallback(() => {
    notificationService.error(
      'Authentication Required',
      'Please log in to continue.',
      6000
    );
  }, []);

  const handlePermissionError = useCallback(() => {
    notificationService.error(
      'Access Denied',
      'You don\'t have permission to perform this action.',
      6000
    );
  }, []);

  const handleValidationError = useCallback((message: string) => {
    notificationService.warning('Validation Error', message, 5000);
  }, []);

  const handleRateLimitError = useCallback(() => {
    notificationService.warning(
      'Rate Limited',
      'Too many requests. Please wait a moment before trying again.',
      8000
    );
  }, []);

  return {
    handleNetworkError,
    handleServerError,
    handleAuthError,
    handlePermissionError,
    handleValidationError,
    handleRateLimitError,
  };
};

/**
 * Hook for handling async API operations with error handling
 */
export const useAsyncError = () => {
  const { handleError } = useApiError();

  const executeAsync = useCallback(async <T>(
    asyncOperation: () => Promise<T>,
    options: {
      onSuccess?: (result: T) => void;
      onError?: (error: ApiError) => void;
      showSuccessNotification?: boolean;
      successMessage?: string;
    } = {}
  ): Promise<T | null> => {
    const {
      onSuccess,
      onError,
      showSuccessNotification = false,
      successMessage = 'Operation completed successfully',
    } = options;

    try {
      const result = await asyncOperation();
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      if (showSuccessNotification) {
        notificationService.success('Success', successMessage, 4000);
      }
      
      return result;
    } catch (error) {
      const apiError = error as ApiError;
      
      handleError(apiError);
      
      if (onError) {
        onError(apiError);
      }
      
      return null;
    }
  }, [handleError]);

  return { executeAsync };
};

/**
 * Hook for handling form submission errors
 */
export const useFormError = () => {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const handleFormError = useCallback((error: ApiError) => {
    // Clear previous errors
    setFieldErrors({});
    setGeneralError(null);

    if (error.status === 422 && error.details) {
      // Handle validation errors
      const errors: Record<string, string[]> = {};
      
      if (typeof error.details === 'object') {
        Object.entries(error.details).forEach(([field, fieldErrors]) => {
          if (Array.isArray(fieldErrors)) {
            errors[field] = fieldErrors;
          } else if (typeof fieldErrors === 'string') {
            errors[field] = [fieldErrors];
          }
        });
      }
      
      setFieldErrors(errors);
      
      // Show general validation error notification
      notificationService.warning(
        'Validation Error',
        'Please check the form for errors and try again.',
        5000
      );
    } else {
      // Handle general errors
      setGeneralError(error.message);
      
      // Show error notification
      notificationService.error('Form Error', error.message, undefined, error.requestId);
    }
  }, []);

  const clearFormErrors = useCallback(() => {
    setFieldErrors({});
    setGeneralError(null);
  }, []);

  const getFieldError = useCallback((fieldName: string): string | null => {
    const errors = fieldErrors[fieldName];
    return errors && errors.length > 0 ? errors[0] : null;
  }, [fieldErrors]);

  const hasFieldError = useCallback((fieldName: string): boolean => {
    return fieldName in fieldErrors && fieldErrors[fieldName].length > 0;
  }, [fieldErrors]);

  return {
    fieldErrors,
    generalError,
    handleFormError,
    clearFormErrors,
    getFieldError,
    hasFieldError,
    hasErrors: Object.keys(fieldErrors).length > 0 || generalError !== null,
  };
};

export default useApiError;