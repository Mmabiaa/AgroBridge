/**
 * Enhanced API Error Handling and Retry Logic
 */
import { AxiosError, AxiosRequestConfig } from 'axios';
import { API_CONFIG, HTTP_STATUS, ERROR_MESSAGES } from './config';

export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: any;
  timestamp: string;
  requestId?: string;
}

export interface RetryConfig {
  attempts: number;
  delay: number;
  backoffFactor: number;
  maxDelay: number;
  retryCondition: (error: AxiosError) => boolean;
}

export interface ErrorHandlerConfig {
  showNotifications: boolean;
  logErrors: boolean;
  reportErrors: boolean;
  customHandlers: Record<number, (error: ApiError) => void>;
}

// Default retry configuration
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  attempts: API_CONFIG.RETRY_ATTEMPTS,
  delay: API_CONFIG.RETRY_DELAY,
  backoffFactor: 2,
  maxDelay: 10000,
  retryCondition: (error: AxiosError) => {
    // Retry on network errors and 5xx server errors
    return !error.response || (error.response.status >= 500 && error.response.status < 600);
  },
};

// Default error handler configuration
const DEFAULT_ERROR_CONFIG: ErrorHandlerConfig = {
  showNotifications: true,
  logErrors: import.meta.env.DEV,
  reportErrors: import.meta.env.PROD,
  customHandlers: {},
};

class ApiErrorHandler {
  private config: ErrorHandlerConfig;
  private retryConfig: RetryConfig;

  constructor(
    errorConfig: Partial<ErrorHandlerConfig> = {},
    retryConfig: Partial<RetryConfig> = {}
  ) {
    this.config = { ...DEFAULT_ERROR_CONFIG, ...errorConfig };
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  }

  /**
   * Handle API errors with comprehensive error processing
   */
  handleError(error: AxiosError): ApiError {
    const apiError = this.createApiError(error);

    // Log error if enabled
    if (this.config.logErrors) {
      this.logError(apiError, error);
    }

    // Report error if enabled
    if (this.config.reportErrors) {
      this.reportError(apiError, error);
    }

    // Show notification if enabled
    if (this.config.showNotifications) {
      this.showErrorNotification(apiError);
    }

    // Execute custom handler if available
    const customHandler = this.config.customHandlers[apiError.status];
    if (customHandler) {
      customHandler(apiError);
    }

    return apiError;
  }

  /**
   * Create standardized API error object
   */
  private createApiError(error: AxiosError): ApiError {
    const apiError: ApiError = {
      message: ERROR_MESSAGES.UNKNOWN_ERROR,
      status: 0,
      code: error.code,
      details: null,
      timestamp: new Date().toISOString(),
      requestId: this.generateRequestId(),
    };

    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      apiError.status = status;
      apiError.details = data;

      // Set user-friendly error messages
      switch (status) {
        case HTTP_STATUS.BAD_REQUEST:
          apiError.message = this.extractErrorMessage(data) || ERROR_MESSAGES.VALIDATION_ERROR;
          break;
        case HTTP_STATUS.UNAUTHORIZED:
          apiError.message = ERROR_MESSAGES.UNAUTHORIZED;
          break;
        case HTTP_STATUS.FORBIDDEN:
          apiError.message = ERROR_MESSAGES.FORBIDDEN;
          break;
        case HTTP_STATUS.NOT_FOUND:
          apiError.message = ERROR_MESSAGES.NOT_FOUND;
          break;
        case HTTP_STATUS.UNPROCESSABLE_ENTITY:
          apiError.message = this.extractValidationErrors(data) || ERROR_MESSAGES.VALIDATION_ERROR;
          break;
        case HTTP_STATUS.TOO_MANY_REQUESTS:
          apiError.message = ERROR_MESSAGES.RATE_LIMITED;
          break;
        case HTTP_STATUS.INTERNAL_SERVER_ERROR:
          apiError.message = ERROR_MESSAGES.SERVER_ERROR;
          break;
        case HTTP_STATUS.BAD_GATEWAY:
        case HTTP_STATUS.SERVICE_UNAVAILABLE:
        case HTTP_STATUS.GATEWAY_TIMEOUT:
          apiError.message = ERROR_MESSAGES.SERVICE_UNAVAILABLE;
          break;
        default:
          apiError.message = this.extractErrorMessage(data) || `Request failed with status ${status}`;
      }
    } else if (error.request) {
      // Network error
      apiError.message = ERROR_MESSAGES.NETWORK_ERROR;
      if (error.code === 'ECONNABORTED') {
        apiError.message = ERROR_MESSAGES.TIMEOUT;
      }
    }

    return apiError;
  }

  /**
   * Extract error message from response data
   */
  private extractErrorMessage(data: any): string | null {
    if (typeof data === 'string') {
      return data;
    }

    if (data && typeof data === 'object') {
      // Try common error message fields
      const messageFields = ['message', 'error', 'detail', 'msg'];
      for (const field of messageFields) {
        if (data[field] && typeof data[field] === 'string') {
          return data[field];
        }
      }

      // Try to extract first error from validation errors
      if (data.errors && typeof data.errors === 'object') {
        const firstError = Object.values(data.errors)[0];
        if (Array.isArray(firstError) && firstError.length > 0) {
          return firstError[0];
        }
      }
    }

    return null;
  }

  /**
   * Extract validation errors and format them
   */
  private extractValidationErrors(data: any): string | null {
    if (!data || typeof data !== 'object') {
      return null;
    }

    const errors: string[] = [];

    // Handle Django REST Framework validation errors
    if (data.errors || data.non_field_errors) {
      const errorData = data.errors || data;
      
      Object.entries(errorData).forEach(([field, fieldErrors]) => {
        if (Array.isArray(fieldErrors)) {
          fieldErrors.forEach((error: string) => {
            if (field === 'non_field_errors') {
              errors.push(error);
            } else {
              errors.push(`${field}: ${error}`);
            }
          });
        } else if (typeof fieldErrors === 'string') {
          if (field === 'non_field_errors') {
            errors.push(fieldErrors);
          } else {
            errors.push(`${field}: ${fieldErrors}`);
          }
        }
      });
    }

    return errors.length > 0 ? errors.join(', ') : null;
  }

  /**
   * Log error for debugging
   */
  private logError(apiError: ApiError, originalError: AxiosError): void {
    console.group(`🚨 API Error: ${apiError.status} ${originalError.config?.url}`);
    console.error('Error Message:', apiError.message);
    console.error('Status Code:', apiError.status);
    console.error('Request ID:', apiError.requestId);
    console.error('Timestamp:', apiError.timestamp);
    
    if (apiError.details) {
      console.error('Error Details:', apiError.details);
    }
    
    if (originalError.config) {
      console.error('Request Config:', {
        method: originalError.config.method,
        url: originalError.config.url,
        headers: originalError.config.headers,
        data: originalError.config.data,
      });
    }
    
    console.error('Original Error:', originalError);
    console.groupEnd();
  }

  /**
   * Report error to monitoring service
   */
  private reportError(apiError: ApiError, originalError: AxiosError): void {
    // In a real application, you would send this to a monitoring service
    // like Sentry, LogRocket, or your own error tracking system
    
    const errorReport = {
      error: apiError,
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId(),
      stackTrace: originalError.stack,
      requestConfig: originalError.config ? {
        method: originalError.config.method,
        url: originalError.config.url,
        headers: originalError.config.headers,
      } : null,
    };

    // Example: Send to monitoring service
    // this.sendToMonitoringService(errorReport);
    
    console.warn('Error reported:', errorReport);
  }

  /**
   * Show error notification to user
   */
  private showErrorNotification(apiError: ApiError): void {
    // In a real application, you would integrate with your notification system
    // like react-toastify, antd notifications, or custom notification component
    
    const notificationData = {
      type: 'error' as const,
      title: 'Error',
      message: apiError.message,
      duration: this.getNotificationDuration(apiError.status),
      requestId: apiError.requestId,
    };

    // Example: Show notification
    // notificationService.show(notificationData);
    
    console.warn('Error notification:', notificationData);
  }

  /**
   * Get notification duration based on error severity
   */
  private getNotificationDuration(status: number): number {
    if (status >= 500) {
      return 8000; // Server errors - longer duration
    } else if (status === 401 || status === 403) {
      return 6000; // Auth errors - medium duration
    } else {
      return 4000; // Client errors - shorter duration
    }
  }

  /**
   * Generate unique request ID for tracking
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current user ID for error reporting
   */
  private getCurrentUserId(): string | null {
    try {
      const userData = localStorage.getItem('user_data');
      if (userData) {
        const user = JSON.parse(userData);
        return user.id || null;
      }
    } catch {
      // Ignore parsing errors
    }
    return null;
  }

  /**
   * Get session ID for error tracking
   */
  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Update error handler configuration
   */
  updateConfig(newConfig: Partial<ErrorHandlerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Update retry configuration
   */
  updateRetryConfig(newConfig: Partial<RetryConfig>): void {
    this.retryConfig = { ...this.retryConfig, ...newConfig };
  }

  /**
   * Get current retry configuration
   */
  getRetryConfig(): RetryConfig {
    return { ...this.retryConfig };
  }
}

/**
 * Retry interceptor for axios
 */
export class RetryInterceptor {
  private retryConfig: RetryConfig;

  constructor(retryConfig: Partial<RetryConfig> = {}) {
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  }

  /**
   * Create retry interceptor function
   */
  createInterceptor() {
    return async (error: AxiosError): Promise<any> => {
      const config = error.config as AxiosRequestConfig & { 
        __retryCount?: number;
        __retryDelay?: number;
      };

      // Don't retry if retry is disabled or condition not met
      if (!this.retryConfig.retryCondition(error)) {
        return Promise.reject(error);
      }

      // Initialize retry count
      config.__retryCount = config.__retryCount || 0;
      config.__retryDelay = config.__retryDelay || this.retryConfig.delay;

      // Check if we've exceeded retry attempts
      if (config.__retryCount >= this.retryConfig.attempts) {
        return Promise.reject(error);
      }

      // Increment retry count
      config.__retryCount += 1;

      // Calculate delay with exponential backoff
      const delay = Math.min(
        config.__retryDelay * Math.pow(this.retryConfig.backoffFactor, config.__retryCount - 1),
        this.retryConfig.maxDelay
      );

      console.warn(
        `🔄 Retrying request (${config.__retryCount}/${this.retryConfig.attempts}) ` +
        `to ${config.url} after ${delay}ms delay`
      );

      // Wait for delay
      await this.sleep(delay);

      // Import axios dynamically to avoid circular dependency
      const { default: axios } = await import('axios');
      
      // Retry the request
      return axios(config);
    };
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Update retry configuration
   */
  updateConfig(newConfig: Partial<RetryConfig>): void {
    this.retryConfig = { ...this.retryConfig, ...newConfig };
  }
}

// Create default instances
export const defaultErrorHandler = new ApiErrorHandler();
export const defaultRetryInterceptor = new RetryInterceptor();

// Export utility functions
export const createApiError = (
  message: string,
  status: number = 0,
  details?: any
): ApiError => ({
  message,
  status,
  details,
  timestamp: new Date().toISOString(),
  requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
});

export const isNetworkError = (error: AxiosError): boolean => {
  return !error.response && !!error.request;
};

export const isServerError = (error: AxiosError): boolean => {
  return !!error.response && error.response.status >= 500;
};

export const isClientError = (error: AxiosError): boolean => {
  return !!error.response && error.response.status >= 400 && error.response.status < 500;
};

export const isRetryableError = (error: AxiosError): boolean => {
  return isNetworkError(error) || isServerError(error);
};