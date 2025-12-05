/**
 * React hook for making API requests with built-in error handling and retry logic
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { AxiosRequestConfig } from 'axios';
import apiClient from '../axiosClient';
import { ApiError } from '../errorHandler';
import { useApiError } from './useApiError';

export interface UseApiRequestOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: ApiError) => void;
  showNotifications?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
  transform?: (data: any) => T;
}

export interface UseApiRequestReturn<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  execute: (config?: AxiosRequestConfig) => Promise<T | null>;
  retry: () => Promise<T | null>;
  cancel: () => void;
  reset: () => void;
}

/**
 * Hook for making API requests with comprehensive error handling
 */
export const useApiRequest = <T = any>(
  initialConfig?: AxiosRequestConfig,
  options: UseApiRequestOptions<T> = {}
): UseApiRequestReturn<T> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastConfigRef = useRef<AxiosRequestConfig | undefined>(initialConfig);

  const {
    onSuccess,
    onError,
    showNotifications = true,
    retryAttempts = 0,
    retryDelay = 1000,
    transform,
  } = options;

  const { error, handleError, clearError, setError } = useApiError({
    showNotifications,
    onError,
  });

  const execute = useCallback(async (config?: AxiosRequestConfig): Promise<T | null> => {
    const requestConfig = config || lastConfigRef.current;
    
    if (!requestConfig) {
      const error: ApiError = {
        message: 'No request configuration provided',
        status: 0,
        timestamp: new Date().toISOString(),
      };
      setError(error);
      return null;
    }

    // Store config for retry
    lastConfigRef.current = requestConfig;

    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    
    setLoading(true);
    clearError();

    let attempt = 0;
    const maxAttempts = retryAttempts + 1;

    while (attempt < maxAttempts) {
      try {
        const response = await apiClient.request<T>({
          ...requestConfig,
          signal: abortControllerRef.current.signal,
        });

        // Transform data if transformer provided
        const resultData = transform ? transform(response) : response;
        
        setData(resultData);
        setLoading(false);

        if (onSuccess) {
          onSuccess(resultData);
        }

        return resultData;
      } catch (err) {
        attempt++;
        
        // If this was an abort, don't retry
        if (abortControllerRef.current?.signal.aborted) {
          setLoading(false);
          return null;
        }

        // If we've exhausted retries, handle the error
        if (attempt >= maxAttempts) {
          setLoading(false);
          handleError(err as ApiError);
          return null;
        }

        // Wait before retrying
        if (retryDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        }
      }
    }

    return null;
  }, [
    retryAttempts,
    retryDelay,
    transform,
    onSuccess,
    handleError,
    clearError,
    setError,
  ]);

  const retry = useCallback((): Promise<T | null> => {
    return execute();
  }, [execute]);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
  }, []);

  const reset = useCallback(() => {
    cancel();
    setData(null);
    clearError();
  }, [cancel, clearError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return {
    data,
    loading,
    error,
    execute,
    retry,
    cancel,
    reset,
  };
};

/**
 * Hook for making GET requests
 */
export const useApiGet = <T = any>(
  url: string,
  options: UseApiRequestOptions<T> & {
    params?: Record<string, any>;
    immediate?: boolean;
  } = {}
) => {
  const { params, immediate = false, ...requestOptions } = options;
  
  const config: AxiosRequestConfig = {
    method: 'GET',
    url,
    params,
  };

  const request = useApiRequest<T>(config, requestOptions);

  // Execute immediately if requested
  useEffect(() => {
    if (immediate) {
      request.execute();
    }
  }, [immediate]); // eslint-disable-line react-hooks/exhaustive-deps

  return request;
};

/**
 * Hook for making POST requests
 */
export const useApiPost = <T = any, D = any>(
  url: string,
  options: UseApiRequestOptions<T> = {}
) => {
  const request = useApiRequest<T>(undefined, options);

  const post = useCallback((data?: D, config?: AxiosRequestConfig) => {
    return request.execute({
      method: 'POST',
      url,
      data,
      ...config,
    });
  }, [request, url]);

  return {
    ...request,
    post,
  };
};

/**
 * Hook for making PUT requests
 */
export const useApiPut = <T = any, D = any>(
  url: string,
  options: UseApiRequestOptions<T> = {}
) => {
  const request = useApiRequest<T>(undefined, options);

  const put = useCallback((data?: D, config?: AxiosRequestConfig) => {
    return request.execute({
      method: 'PUT',
      url,
      data,
      ...config,
    });
  }, [request, url]);

  return {
    ...request,
    put,
  };
};

/**
 * Hook for making PATCH requests
 */
export const useApiPatch = <T = any, D = any>(
  url: string,
  options: UseApiRequestOptions<T> = {}
) => {
  const request = useApiRequest<T>(undefined, options);

  const patch = useCallback((data?: D, config?: AxiosRequestConfig) => {
    return request.execute({
      method: 'PATCH',
      url,
      data,
      ...config,
    });
  }, [request, url]);

  return {
    ...request,
    patch,
  };
};

/**
 * Hook for making DELETE requests
 */
export const useApiDelete = <T = any>(
  url: string,
  options: UseApiRequestOptions<T> = {}
) => {
  const request = useApiRequest<T>(undefined, options);

  const del = useCallback((config?: AxiosRequestConfig) => {
    return request.execute({
      method: 'DELETE',
      url,
      ...config,
    });
  }, [request, url]);

  return {
    ...request,
    delete: del,
  };
};

/**
 * Hook for file upload with progress tracking
 */
export const useApiUpload = <T = any>(
  url: string,
  options: UseApiRequestOptions<T> & {
    onUploadProgress?: (progressEvent: any) => void;
  } = {}
) => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const { onUploadProgress, ...requestOptions } = options;

  const request = useApiRequest<T>(undefined, requestOptions);

  const upload = useCallback((file: File, additionalData?: Record<string, any>) => {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    setUploadProgress(0);

    return request.execute({
      method: 'POST',
      url,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(progress);
        
        if (onUploadProgress) {
          onUploadProgress(progressEvent);
        }
      },
    });
  }, [request, url, onUploadProgress]);

  return {
    ...request,
    upload,
    uploadProgress,
  };
};

export default useApiRequest;